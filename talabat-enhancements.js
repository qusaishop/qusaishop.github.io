// talabat-enhancements.js
// - Auto-focus orders list to the latest day with orders on initial load
// - Show per-day counts on filter chips (approved / rejected / pending)

(function () {
  'use strict';

  // Config
  const LS_KEYS = {
    lastDaySeen: 'talabat:lastDaySeen',
    lastDayApplied: 'talabat:lastDayApplied',
    autoAppliedFlag: 'talabat:autoAppliedOnce'
  };

  function log(...args) {
    try { console.debug('[talabat-enh]', ...args); } catch (_) {}
  }
  // Keep a baseline snapshot of the full list for the currently selected يوم/نطاق
  // so counts don’t drop to 0 when a status filter replaces DOM.
  let baselineMap = null; // Map<code, status>
  let baselineCounts = { approved: 0, rejected: 0, pending: 0 };
  let baselineDayKey = null;

  function toDayKey(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const da = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  function getAllOrderCards() {
    return Array.from(document.querySelectorAll('.order-card'));
  }

  function getOrderCodeFromCard(card) {
    // Expect id like "order-<code>"
    const id = card && card.id || '';
    if (id.startsWith('order-')) return id.substring('order-'.length);
    return null;
  }

  function getOrderStatusFromCard(card) {
    const st = card.querySelector('.order-status');
    if (!st) return 'unknown';
    const t = (st.textContent || '').trim();
    // Arabic labels commonly used in this project:
    if (t.includes('مرفوض')) return 'rejected';
    if (t.includes('تم الشحن') || t.includes('تم_الشحن')) return 'approved';
    if (t.includes('قيد') || t.includes('انتظار') || t.includes('قيد المعالجة')) return 'pending';
    return 'other';
  }

  function computeCountsFromMap(map) {
    const out = { approved: 0, rejected: 0, pending: 0 };
    for (const s of map.values()) {
      if (s === 'approved') out.approved++;
      else if (s === 'rejected') out.rejected++;
      else if (s === 'pending') out.pending++;
    }
    return out;
  }

  function scanDomToMap() {
    const map = new Map();
    for (const c of getAllOrderCards()) {
      const code = getOrderCodeFromCard(c);
      if (!code) continue;
      map.set(code, getOrderStatusFromCard(c));
    }
    return map;
  }

  function rebuildBaseline() {
    baselineMap = scanDomToMap();
    baselineCounts = computeCountsFromMap(baselineMap);
    baselineDayKey = localStorage.getItem(LS_KEYS.lastDayApplied) || localStorage.getItem(LS_KEYS.lastDaySeen) || null;
    log('baseline updated', baselineCounts);
  }

  function maybeUpdateBaseline() {
    try {
      // Only refresh baseline when the "all" chip is active to ensure DOM has the full list
      const allChip = document.querySelector('.chip[data-filter="all"]');
      const isAllActive = !!(allChip && allChip.classList && allChip.classList.contains('active'));
      const hasCards = !!document.querySelector('.order-card');
      if (isAllActive && hasCards) rebuildBaseline();
    } catch (_) {}
  }

  function updateChipCounts() {
    // Prefer baseline if available and still for the same day/range
    const currentDay = localStorage.getItem(LS_KEYS.lastDayApplied) || localStorage.getItem(LS_KEYS.lastDaySeen) || null;
    let counts = null;
    if (baselineMap && baselineMap.size) {
      if (!baselineDayKey || !currentDay || baselineDayKey === currentDay) {
        counts = { ...baselineCounts };
      }
    }
    if (!counts) {
      const map = scanDomToMap();
      counts = computeCountsFromMap(map);
    }
    const { approved, rejected, pending } = counts;
    // Try to find chips by data-filter attr first
    const chipApproved = document.querySelector('.chip[data-filter="approved"]');
    const chipRejected = document.querySelector('.chip[data-filter="rejected"]');
    const chipPending  = document.querySelector('.chip[data-filter="pending"]');

    const applyLabel = (el, count) => {
      if (!el) return;
      if (!el.dataset.label) el.dataset.label = (el.textContent || '').trim();
      el.textContent = `${el.dataset.label} (${count})`;
    };

    applyLabel(chipApproved, approved);
    applyLabel(chipRejected, rejected);
    applyLabel(chipPending,  pending);
  }

  // Observe orders container to refresh chip counts automatically
  function observeOrdersContainer() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    const mo = new MutationObserver(() => {
      // small debounce via rAF to wait for batch DOM writes
      requestAnimationFrame(() => { maybeUpdateBaseline(); updateChipCounts(); });
    });
    mo.observe(container, { childList: true, subtree: true });
  }

  // Hide order cards not in the provided set of codes
  function filterDomToCodes(keepCodes) {
    if (!keepCodes || keepCodes.size === 0) return;
    const all = Array.from(document.querySelectorAll('.order-card'));
    for (const c of all) {
      const code = getOrderCodeFromCard(c);
      if (!code) continue;
      if (keepCodes.has(code)) {
        c.style.display = '';
      } else {
        c.style.display = 'none';
      }
    }
    maybeUpdateBaseline();
    updateChipCounts();
  }

  // Try to auto-focus to the last day with orders (single-day focus)
  async function autoFocusLastDayOnce() {
    try {
      if (window.disableTalabatEnhancer) return; // allow opt-out if needed
      if (localStorage.getItem(LS_KEYS.autoAppliedFlag) === 'true') return; // do once per load

      const hasFirebase = typeof window.firebase !== 'undefined' && firebase && firebase.firestore && firebase.auth;
      if (!hasFirebase) return;

      const user = firebase.auth().currentUser;
      if (!user) {
        // wait for auth
        return new Promise(resolve => {
          const unsub = firebase.auth().onAuthStateChanged(async u => {
            try { if (u) await autoFocusLastDayOnce(); } finally { try { unsub(); } catch(_) {} resolve(); }
          });
        });
      }

      const db = firebase.firestore();
      const snap = await db.collection('orders').where('userId', '==', user.uid).get();
      if (snap.empty) {
        localStorage.setItem(LS_KEYS.autoAppliedFlag, 'true');
        return;
      }

      // read timestamp + code + status from public/main
      const rows = await Promise.all(snap.docs.map(async d => {
        const data = d.data() || {};
        const code = data.code || d.id;
        try {
          const pub = await d.ref.collection('public').doc('main').get();
          const p = pub.exists ? (pub.data() || {}) : {};
          return { code, timestamp: p.timestamp || null, status: p.status || '' };
        } catch (_) {
          return { code, timestamp: null, status: '' };
        }
      }));

      const withDay = rows.map(r => ({ ...r, dayKey: r.timestamp ? toDayKey(r.timestamp) : null }))
                          .filter(r => !!r.dayKey);
      if (withDay.length === 0) {
        localStorage.setItem(LS_KEYS.autoAppliedFlag, 'true');
        return;
      }

      // latest day by timestamp
      withDay.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const lastDay = withDay[0].dayKey;
      localStorage.setItem(LS_KEYS.lastDaySeen, lastDay);

      // Build set of codes for that day
      const lastDayCodes = new Set(withDay.filter(x => x.dayKey === lastDay).map(x => x.code));

      // Wait for DOM orders to be painted (up to ~3s)
      const start = Date.now();
      while (Date.now() - start < 3000) {
        const hasCards = document.querySelector('.order-card');
        if (hasCards) break;
        await new Promise(r => setTimeout(r, 100));
      }

      // Apply DOM filter once
      filterDomToCodes(lastDayCodes);
      localStorage.setItem(LS_KEYS.lastDayApplied, lastDay);
      localStorage.setItem(LS_KEYS.autoAppliedFlag, 'true');
      log('Auto-applied last day filter:', lastDay, 'codes:', lastDayCodes.size);
    } catch (e) {
      log('autoFocusLastDayOnce error', e);
    }
  }

  // Init when DOM is ready
  function onReady() {
    observeOrdersContainer();
    maybeUpdateBaseline();
    updateChipCounts();
    autoFocusLastDayOnce();
    if (typeof window.observeCalendarOpen === 'function') {
      window.observeCalendarOpen();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();

// Calendar helpers: ensure calendar opens on latest month (not oldest)
(function(){
  'use strict';

  const MONTH_MAP = {
    // Arabic
    'يناير':0,'فبراير':1,'مارس':2,'أبريل':3,'ابريل':3,'مايو':4,'يونيو':5,'يوليو':6,
    'أغسطس':7,'اغسطس':7,'سبتمبر':8,'أكتوبر':9,'اكتوبر':9,'نوفمبر':10,'ديسمبر':11,
    // English
    'january':0,'february':1,'march':2,'april':3,'may':4,'june':5,'july':6,'august':7,
    'september':8,'october':9,'november':10,'december':11
  };

  function parseMonthIndex(str){
    if(!str) return null;
    const s = String(str).toLowerCase();
    for(const key in MONTH_MAP){
      if(s.includes(key)) return MONTH_MAP[key];
    }
    return null;
  }

  function parseTitleYearMonth(titleEl){
    if(!titleEl) return null;
    const txt = (titleEl.textContent||'').trim();
    const yearMatch = txt.match(/(19|20)\d{2}/);
    const y = yearMatch ? parseInt(yearMatch[0],10) : null;
    const m = parseMonthIndex(txt);
    if(y!=null && m!=null) return {year:y, month:m};
    return null;
  }

  function navButtons(panel){
    const btns = panel.querySelectorAll('.cal-nav');
    if(btns.length>=2){
      // assume [0]=prev, last=next
      return { prev: btns[0], next: btns[btns.length-1] };
    }
    return { prev: null, next: null };
  }

  function parseTargetFromStorage(){
    try{
      const s = localStorage.getItem('talabat:lastDaySeen');
      if(!s) return null;
      const dt = new Date(s);
      if(isNaN(dt)) return null;
      return { year: dt.getFullYear(), month: dt.getMonth() };
    }catch(_){ return null; }
  }

  function compareYM(a,b){
    if(a.year!==b.year) return a.year - b.year;
    return a.month - b.month;
  }

  async function alignCalendarToLatest(panel){
    const title = panel.querySelector('.cal-title');
    if(!title) return;
    const buttons = navButtons(panel);
    if(!buttons.prev || !buttons.next) return;

    const target = parseTargetFromStorage() || (function(){
      const d=new Date();
      return {year:d.getFullYear(), month:d.getMonth()};
    })();

    // Try to read current YM from title; retry a few times if empty
    let current=null, retries=10;
    while(retries-->0){
      current = parseTitleYearMonth(title);
      if(current) break;
      await new Promise(r=>setTimeout(r,50));
    }
    if(!current) return;

    // Click prev/next up to 48 steps max
    let guard=48;
    while(compareYM(current,target)!==0 && guard-->0){
      if(compareYM(current,target)<0){
        buttons.next.click();
      }else{
        buttons.prev.click();
      }
      await new Promise(r=>setTimeout(r,60));
      current = parseTitleYearMonth(title) || current;
    }
  }

  function observeCalendarOpen(){
    const mo = new MutationObserver(async (muts)=>{
      for(const m of muts){
        for(const n of m.addedNodes){
          if(!(n instanceof HTMLElement)) continue;
          const panel = n.matches && n.matches('.calendar-panel') ? n : n.querySelector && n.querySelector('.calendar-panel');
          if(panel){
            try{ await alignCalendarToLatest(panel); }catch(_){/*noop*/}
          }
        }
      }
    });
    mo.observe(document.body, {childList:true, subtree:true});
    // Expose for main initializer
    window.observeCalendarOpen = function(){/* no-op: already active */};
  }

  // If main init ran before this IIFE, ensure observer is active
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', observeCalendarOpen);
  } else {
    observeCalendarOpen();
  }
})();
