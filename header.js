// ===== الهيدر =====
// ===== علامة تنقّل مبكرة على كل الصفحات =====
// ===== Global fast-reload guard (applies to all pages) =====
(function(){
  try{
    var file = (location.pathname.split('/').pop()||'').toLowerCase();
    var isIndex = (file === '' || file === 'index.html');
    if (!isIndex) { window.__SKIP_FIREBASE__ = false; return; }
    var KEY = 'global:loadTimes';
    var now = Date.now();
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(_) { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    arr = arr.filter(function(t){ return typeof t === 'number' && (now - t) < 10000; });
    arr.push(now);
    try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-10))); } catch(_){ }
    window.__SKIP_FIREBASE__ = (arr.length >= 3);

    if (window.__SKIP_FIREBASE__ && typeof firebase !== 'undefined'){
      (function(){
        try{
          var noOp = function(){};
          function stubDoc(){ return { get:function(){ return Promise.resolve({ exists:false, data:function(){return {};}, id:'' }); }, set:function(){ return Promise.resolve(); }, update:function(){ return Promise.resolve(); }, onSnapshot:function(){ return noOp; } }; }
          function stubCol(){ return { doc:function(){ return stubDoc(); }, where:function(){ return stubCol(); }, orderBy:function(){ return stubCol(); }, limit:function(){ return stubCol(); }, get:function(){ return Promise.resolve({ empty:true, forEach:noOp, docs:[] }); }, onSnapshot:function(){ return noOp; } }; }
          var stubDb = { collection:function(){ return stubCol(); }, doc:function(){ return stubDoc(); } };
          try{ window.__ORIG_FIREBASE__ = { auth: firebase.auth, firestore: firebase.firestore }; }catch(_){ }
          firebase.firestore = function(){ return stubDb; };
        }catch(_){ }
      })();
    }
  }catch(_){ window.__SKIP_FIREBASE__ = false; }
})();

(function(){
  // Force HTTPS on public hosts (skip localhost/LAN)
  try{
    var h = location.hostname || '';
    var isLocal = h === 'localhost' || h === '127.0.0.1' || /^0\.0\.0\.0$/.test(h) || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
    if (location.protocol === 'http:' && !isLocal) {
      var target = 'https://' + location.host + location.pathname + location.search + location.hash;
      try { window.stop && window.stop(); } catch(_){ }
      location.replace(target);
      return;
    }
  }catch(_){ }
})();

// ===== الهيدر =====
// ===== علامة تنقّل مبكرة على كل الصفحات =====
(function(){
  function addAllow(a){
    try{
      var href = a.getAttribute('href');
      if(!href) return;
      var url = new URL(href, location.href);
      if(!url.searchParams.has('allow')){
        url.searchParams.set('allow','1');
        a.setAttribute('href', url.pathname + url.search + url.hash);
      }
    }catch(_){}
  }
  function mark(e){
    try{
      var a = e.target && e.target.closest ? e.target.closest('a[href$=".html"]') : null;
      if(!a) return;
      try{ sessionStorage.setItem('nav:fromHome','1'); }catch(_){}
      addAllow(a);
    }catch(_){ }
  }
  document.addEventListener('pointerdown', mark, true);
  document.addEventListener('auxclick',    mark, true);
  document.addEventListener('click',       mark, true);
})();

// ===== Warm loader image globally =====
(function(){
  try {
    var LOADER_IMG = "https://i.ibb.co/svXFyxQk/Chat-GPT-Image-9-2025-06-11-56.png";
    // Preconnect to host (faster handshake)
    if (document.head && !document.querySelector("link[rel='preconnect'][href='https://i.ibb.co']")) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = 'https://i.ibb.co';
      pc.crossOrigin = '';
      document.head.appendChild(pc);
    }
    // Preload once per page
    if (document.head && !document.querySelector("link[rel='preload'][as='image'][href='"+LOADER_IMG+"']")) {
      var l = document.createElement('link');
      l.rel = 'preload';
      l.as  = 'image';
      l.href = LOADER_IMG;
      document.head.appendChild(l);
    }
    // Warm the cache immediately
    var im = new Image();
    im.decoding = 'async';
    try { im.fetchPriority = 'high'; } catch(_){}
    im.loading = 'eager';
    im.src = LOADER_IMG;
  } catch(_){}
})();

// ===== Helper: Show/Hide page loader (if present) =====
function showPageLoader() {
  try {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    try {
      sessionStorage.setItem('nav:loader:expected', '1');
      sessionStorage.setItem('nav:loader:showAt', String(Date.now()));
    } catch(_){}
    pre.classList.remove('hidden');
    pre.style.display = 'flex';
    pre.style.opacity = '1';
  } catch(_){}
}

function hidePageLoader() {
  try {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    pre.classList.add('hidden');
    pre.style.transition = 'opacity 0.4s ease';
    pre.style.opacity = '0';
    setTimeout(function(){ pre.style.display = 'none'; }, 400);
  } catch(_){}
}

// Show loader when navigating via anchors to local .html pages
document.addEventListener('click', function(e){
  try{
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.target && a.target.toLowerCase() === '_blank') return;
    var href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    var url = new URL(href, location.href);
    // نفس الأصل + ملف HTML فقط
    if (url.origin === location.origin && /\.html(\?|#|$)/i.test(url.pathname)) {
      showPageLoader();
    }
  }catch(_){ }
}, true);

// عند استعادة الصفحة من BFCache أو عند كل ظهور للصفحة مجددًا
window.addEventListener('pageshow', function(){
  try { if (sessionStorage.getItem('nav:loader:expected') === '1') return; } catch(_){ }
  hidePageLoader();
});
document.addEventListener('visibilitychange', function(){
  try { if (sessionStorage.getItem('nav:loader:expected') === '1') return; } catch(_){ }
  if (document.visibilityState === 'visible') hidePageLoader();
});

const header = document.createElement("header");
header.className = "top-header";

// زر الهامبرغر
const hamburger = document.createElement("div");
hamburger.id = "hamburger";
hamburger.onclick = toggleSidebar;

for (let i = 0; i < 3; i++) {
  const span = document.createElement("span");
  hamburger.appendChild(span);
}
header.appendChild(hamburger);

// الشعار
const logo = document.createElement("img");
logo.src = "https://i.ibb.co/C3TWgd6n/1.gif";
logo.alt = "متجر قصي";
logo.className = "header-logo";
logo.setAttribute("fetchpriority","high");
logo.loading = "eager";
logo.decoding = "async";
(function(){ try{
  var href = logo.src;
  if (href && document.head && !document.querySelector("link[rel='preload'][as='image'][href='"+href+"']")) {
    var l = document.createElement('link'); l.rel='preload'; l.as='image'; l.href=href; document.head.appendChild(l);
  }
} catch(e){} })();

// لف الشعار برابط يقود إلى الصفحة الرئيسية
const logoLink = document.createElement('a');
logoLink.href = 'index.html';
logoLink.setAttribute('aria-label', 'العودة إلى الرئيسية');
// عكس التموضع: دفع الشعار لأقصى اليسار
logoLink.style.marginLeft = '0';
logoLink.style.marginRight = 'auto';
logoLink.appendChild(logo);

// عنصر الرصيد داخل الهيدر
const balanceSpan = document.createElement("span");
balanceSpan.id = "balanceHeader";
balanceSpan.className = "header-balance";
balanceSpan.style.marginRight = "0px";

// أضف أيقونة الرصيد + أيقونة (+) للنقل إلى الإيداع
balanceSpan.innerHTML = `
  <i class="fas fa-coins"></i> 
  <span id="headerBalanceText">…</span>
  <i id="depositShortcut" class="fas fa-plus" style="color: white; cursor: pointer; margin-left:0px;"></i>
`;


// مستمع لتحويل المستخدم إلى صفحة الإيداع عند الضغط على +
balanceSpan.querySelector("#depositShortcut").onclick = () => {
  try { showPageLoader(); } catch(_){}
  window.location.href = "edaa.html";
};


const leftContainer = document.createElement("div");
leftContainer.style.display = "flex";
leftContainer.style.alignItems = "center";
leftContainer.style.gap = "10px"; // ✅ مسافة بين الرصيد والهامبرغر
leftContainer.appendChild(hamburger);
leftContainer.appendChild(balanceSpan);



// ترتيب العناصر: مجموعة (الهامبورغر + الرصيد) يمينًا، الشعار يسارًا
header.appendChild(leftContainer); // مجموعة اليمين
header.appendChild(logoLink);      // الشعار يسار الهيدر

// ===== مستمع الرصيد اللحظي =====
let unsubscribeBalance = null;

// مفاتيح التخزين المحلية
const BAL_KEY = (uid) => `balance:cache:${uid}`;
const LAST_UID_KEY = 'auth:lastUid';
const LAST_LOGGED_KEY = 'auth:lastLoggedIn';

// مساعد لتحديث نص الرصيد بأمان
function setHeaderBalance(text) {
  const el = document.getElementById("headerBalanceText") || balanceSpan.querySelector("#headerBalanceText");
  if (el) el.textContent = text;
}

// حفظ/قراءة الرصيد من التخزين المحلي
function readCachedBalance(uid) {
  try {
    const v = localStorage.getItem(BAL_KEY(uid));
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch(_) { return null; }
}
function writeCachedBalance(uid, value) {
  try { localStorage.setItem(BAL_KEY(uid), String(value)); } catch(_) {}
}

// نشر تغيّر الرصيد للاستخدام داخل الصفحات
function broadcastBalance(value) {
  try { window.__BALANCE__ = value; } catch(_) {}
  try {
    const formatted = `${Number(value || 0).toFixed(2)} د.أ`;
    window.dispatchEvent(new CustomEvent('balance:change', { detail: { value: Number(value||0), formatted } }));
  } catch(_) {}
}

// تهيئة أولية: عرِض الرصيد من الصفحة السابقة إن كان المستخدم مسجلاً سابقًا
(function seedHeaderFromCache(){
  try {
    const wasLogged = localStorage.getItem(LAST_LOGGED_KEY) === '1';
    const lastUid = localStorage.getItem(LAST_UID_KEY);
    if (wasLogged && lastUid) {
      const cached = readCachedBalance(lastUid);
      if (cached != null) {
        setHeaderBalance(`${cached.toFixed(2)} د.أ`);
        broadcastBalance(cached);
      }
    } else {
      setHeaderBalance("غير مسجل");
    }
  } catch(_) {}
})();

// تحميل وتحديث الرصيد لحظيًا بعد تسجيل الدخول
firebase.auth().onAuthStateChanged(user => {
  // ألغِ أي اشتراك سابق قبل إنشاء اشتراك جديد
  if (typeof unsubscribeBalance === "function") {
    try { unsubscribeBalance(); } catch (e) { console.warn("unsubscribeBalance error:", e); }
    unsubscribeBalance = null;
  }

  if (user && user.emailVerified) {
    try { localStorage.setItem(LAST_UID_KEY, user.uid); } catch(_) {}
    try { localStorage.setItem(LAST_LOGGED_KEY, '1'); } catch(_) {}

    // اعرض الرصيد من الكاش فورًا بدون قراءة إضافية
    const cached = readCachedBalance(user.uid);
    if (cached != null) {
      setHeaderBalance(`${cached.toFixed(2)} د.أ`);
      broadcastBalance(cached);
    } else {
      // إبقِ النص كما هو (… أو قيمة من seed) حتى يصل الـ onSnapshot
    }

    const docRef = firebase.firestore().collection("users").doc(user.uid);

    // 🟢 مستمع لحظي لأي تغيير في وثيقة المستخدم (balance)
    unsubscribeBalance = docRef.onSnapshot(
      (snap) => {
        if (snap.exists) {
          const raw = snap.data().balance ?? 0;
          const numeric = Number(raw);
          const safe = Number.isFinite(numeric) ? numeric : 0;
          // حدِّث العرض + خزّن في الكاش + ابثّ الحدث
          setHeaderBalance(`${safe.toFixed(2)} د.أ`);
          writeCachedBalance(user.uid, safe);
          broadcastBalance(safe);
        } else {
          setHeaderBalance("0.00 د.أ");
          writeCachedBalance(user.uid, 0);
          broadcastBalance(0);
        }
      },
      (err) => {
        console.error("Balance listener error:", err);
        setHeaderBalance("تعذر التحميل");
      }
    );
  } else {
    setHeaderBalance("غير مسجل");
    try { localStorage.setItem(LAST_LOGGED_KEY, '0'); } catch(_) {}
    try { localStorage.removeItem(LAST_UID_KEY); } catch(_) {}
    broadcastBalance(null);
  }
});

// (اختياري) نظافة: إلغاء المستمع عند إغلاق الصفحة
window.addEventListener("beforeunload", () => {
  if (typeof unsubscribeBalance === "function") {
    try { unsubscribeBalance(); } catch (e) {}
  }
});

// إضافته للصفحة
window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("headerContainer");
  if (container) {
    container.appendChild(header);
  }
  // علّم جلسة الملاحة لأي رابط يؤدي إلى صفحة HTML داخل الموقع
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href$=".html"]');
    if (a) { try { sessionStorage.setItem('nav:fromHome','1'); } catch (e) {} }
  });
});

// التحكم في ظهور زر "تسجيل الدخول" و"الإعدادات" و"الإيداع" بناء على حالة المصادقة
firebase.auth().onAuthStateChanged(user => {
  const loginItem = document.getElementById('loginSidebarBtn');
  const depositItem = document.getElementById('depositBtn');
  const sahbItem = document.getElementById('sahbBtn'); // ⬅️ جديد
  const walletItem = document.getElementById('walletBtn'); // ⬅️ محفظتي

  if (user && user.emailVerified) {
    if (loginItem) loginItem.style.display = "none";

    // أظهر زرّي الإيداع والسحب للمسجّلين
    if (depositItem) depositItem.style.display = "flex";
    if (sahbItem) sahbItem.style.display = "flex"; // ⬅️ جديد
    if (walletItem) walletItem.style.display = "flex"; // ⬅️ محفظتي

    // أضف زر الإعدادات إذا لم يكن موجوداً
    if (!document.getElementById("settingsBtn")) {
      const settingsLi = document.createElement("li");
      settingsLi.id = "settingsBtn";
      settingsLi.innerHTML = `<i class="fas fa-cog"></i><a href="#">الإعدادات</a>`;
      settingsLi.onclick = () => navigateTo("settings.html");

      const ul = document.querySelector("#sidebar ul");
      if (ul) ul.insertBefore(settingsLi, loginItem);
    }

  } else {
    if (loginItem) loginItem.style.display = "flex";

    // أخفِ زرّي الإيداع والسحب لغير المسجّلين
    if (depositItem) depositItem.style.display = "none";
    if (sahbItem) sahbItem.style.display = "none"; // ⬅️ جديد
    if (walletItem) walletItem.style.display = "none"; // ⬅️ محفظتي

    const settingsLi = document.getElementById("settingsBtn");
    if (settingsLi) settingsLi.remove();
  }
});

// ===== الشريط الجانبي (sidebar) =====
const sidebar = document.createElement("nav");
sidebar.id = "sidebar";

const ul = document.createElement("ul");

// عنصر: الرئيسية
const homeLi = document.createElement("li");
homeLi.onclick = () => navigateTo("index.html");
homeLi.innerHTML = `<i class="fas fa-home"></i><a href="#">الرئيسية</a>`;
ul.appendChild(homeLi);

// عنصر: طلباتي (سنستخدمه كمرجع للإدراج قبلَه)
const ordersLi = document.createElement("li");
ordersLi.onclick = () => navigateTo("talabat.html");
ordersLi.innerHTML = `<i class="fas fa-list"></i><a href="#">طلباتي</a>`;
ul.appendChild(ordersLi);

// عنصر: محفظتي (يظهر للمسجّلين)
const walletLi = document.createElement("li");
walletLi.id = "walletBtn";
walletLi.innerHTML = `<i class="fas fa-wallet"></i><a href="#">محفظتي</a>`;
walletLi.onclick = () => navigateTo("wallet.html");
walletLi.style.display = "none"; // نظهره للمستخدمين المسجلين
ul.appendChild(walletLi);

// عنصر: الإيداع (يوضع بعد الرئيسية وقبل "طلباتي")
// عنصر: الإيداع (يوضع بعد الرئيسية وقبل "طلباتي")
const depositLi = document.createElement("li");
depositLi.id = "depositBtn";
depositLi.innerHTML = `<i class="fa-solid fa-circle-dollar-to-slot"></i><a href="#">الإيداع</a>`;
depositLi.onclick = () => navigateTo("edaa.html");
// مخفي مبدئياً وسنظهره للمستخدم المسجّل فقط
depositLi.style.display = "none";
// ضعه قبل "طلباتي" ليظهر بعد "الرئيسية" مباشرة
ul.insertBefore(depositLi, ordersLi);


// عنصر: التقييمات
const ratingLi = document.createElement("li");
ratingLi.onclick = () => navigateTo("Reviews.html"); 
ratingLi.innerHTML = `<i class="fas fa-star" style="color: gold;"></i><a href="#">التقييمات</a>`;
ul.appendChild(ratingLi);


// عنصر: تسجيل الدخول
const loginLi = document.createElement("li");
loginLi.id = "loginSidebarBtn";
loginLi.innerHTML = `<i class="fas fa-sign-in-alt"></i><a href="#">تسجيل الدخول</a>`;
loginLi.onclick = () => {
  toggleSidebar();
  try { showPageLoader(); } catch(_){}
  window.location.href = "login.html";
};
ul.appendChild(loginLi);

sidebar.appendChild(ul);

// إضافته للصفحة
window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("sidebarContainer");
  if (container) {
    container.appendChild(sidebar);
  }
});

// ===== قسم الدعم =====
const section = document.createElement("section");
section.className = "support-section";

const title = document.createElement("h2");
title.className = "support-title";
title.textContent = "هل تحتاج إلى المساعدة؟ تواصل معنا عبر";
section.appendChild(title);

const iconsDiv = document.createElement("div");
iconsDiv.className = "support-icons";

const contacts = [
  {
    href: "https://t.me/+962790809441",
    iconURL: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg",
    class: "telegram"
  },
  {
    href: "https://www.instagram.com/qus2i_shop/",
    iconURL: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
    class: "instagram"
  },
  {
    href: "https://wa.me/962790809441",
    iconURL: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg",
    class: "whatsapp"
  },
  {
    href: "https://www.facebook.com/share/17Eodommb4/",
    iconURL: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg",
    class: "facebook"
  },
  {
    href: "https://mail.google.com/mail/?view=cm&to=qusaialfalahat2@gmail.com",
    iconURL: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg",
    class: "email"
  }
];

contacts.forEach(contact => {
  const a = document.createElement("a");
  a.href = contact.href;
  a.target = "_blank";
  a.className = `support-icon ${contact.class}`;

  const img = document.createElement("img");
  img.src = contact.iconURL;
  img.alt = `${contact.class} icon`;
  img.style.width = "32px";
  img.style.height = "32px";

  a.appendChild(img);
  iconsDiv.appendChild(a);
});

section.appendChild(iconsDiv);
document.body.appendChild(section);

// ===== قسم الحقوق =====
const rightsDiv = document.createElement("div");
rightsDiv.className = "support-rights";

// رابط واتساب مع النص
const devLink = document.createElement("a");
devLink.href = "https://wa.me/962790108559";
devLink.target = "_blank";
devLink.innerHTML = `<i class="fas fa-external-link-alt" style="margin-left:6px;"></i> هذا الموقع من تطوير ليث قرقز`;
rightsDiv.appendChild(devLink);

// حقوق النشر
const copyright = document.createElement("p");
copyright.textContent = "كل الحقوق محفوظة © 2025";
rightsDiv.appendChild(copyright);

section.appendChild(rightsDiv);

// ===== الدوال المستخدمة =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    console.warn("الشريط الجانبي غير موجود بعد.");
    return;
  }
  sidebar.classList.toggle('active');
}

document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (
    sidebar.classList.contains('active') &&
    !sidebar.contains(event.target) &&
    !hamburger.contains(event.target)
  ) {
    sidebar.classList.remove('active');
  }
});

function navigateTo(url) {
  try { sessionStorage.setItem('nav:fromHome', '1'); } catch (e) {}
  toggleSidebar();
  // أظهر اللودر قبل الانتقال
  showPageLoader();
  setTimeout(() => { window.location.href = url; }, 150);
}

// تعطيل القائمة اليمنى وسحب الصور
// السماح بالقائمة داخل الحقول النصية (لتمكين النسخ/اللصق/تحديد الكل على الجوال)
document.addEventListener('contextmenu', function (e) {
  const t = e.target;
  const isEditable = (
    (t && (
      t.tagName === 'INPUT' ||
      t.tagName === 'TEXTAREA' ||
      t.isContentEditable ||
      (t.closest && t.closest('input, textarea, [contenteditable="true"]'))
    ))
  );
  if (isEditable) return; // لا تمنع داخل الحقول النصية
  e.preventDefault();
});
document.addEventListener('dragstart', function (e) {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});

// ===== Service Worker register (images cache) =====
(function(){
  try{
    var h = (location.hostname||'');
    var isLocal = h === 'localhost' || h === '127.0.0.1' || /^0\.0\.0\.0$/.test(h) || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
    var isSecure = (typeof window.isSecureContext === 'boolean' ? window.isSecureContext : false) || location.protocol === 'https:' || isLocal;
    if ("serviceWorker" in navigator && isSecure) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .catch(function(e){ /* silent */ });
      if (!navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener("controllerchange", function(){
          try { window.location.reload(); } catch (e) {}
        });
      }
    }
  }catch(_){}
})();

// ===== Card tap ripple & press effect (delegated) =====
document.addEventListener('pointerdown', function(e){
  try{
    var el = e.target && e.target.closest ? e.target.closest('.offer-box, .card') : null;
    if (!el) return;
    // mark pressed
    el.classList.add('is-pressed');
    // create ripple
    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    var x = (e.clientX - rect.left) - size/2;
    var y = (e.clientY - rect.top)  - size/2;
    ripple.style.left = x + 'px';
    ripple.style.top  = y + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', function(){ try{ ripple.remove(); }catch(_){} }, { once: true });
  }catch(_){}
}, { passive: true });

['pointerup','pointerleave','pointercancel'].forEach(function(type){
  document.addEventListener(type, function(e){
    try{
      var el = e.target && e.target.closest ? e.target.closest('.offer-box, .card') : null;
      if (!el) return;
      el.classList.remove('is-pressed');
    }catch(_){}
  }, { passive: true });
});



// ربط تلقائي مع أي عنصر #balanceAmount داخل الصفحة
(function wirePageBalanceBox(){
  function setBox(val){
    try{
      const el = document.getElementById('balanceAmount');
      if (!el) return;
      if (val == null || !Number.isFinite(Number(val))) {
        el.textContent = 'يجب تسجيل الدخول اولا';
      } else {
        el.textContent = `${Number(val).toFixed(2)} د.أ`;
      }
    }catch(_){}
  }
  // تهيئة من الكاش (إن كان المستخدم مسجلاً)
  try {
    const wasLogged = localStorage.getItem('auth:lastLoggedIn') === '1';
    const lastUid = localStorage.getItem('auth:lastUid');
    if (wasLogged && lastUid) {
      const cached = (function(){ try{ const v = localStorage.getItem(`balance:cache:${lastUid}`); const n = Number(v); return Number.isFinite(n) ? n : null; }catch(_){ return null; } })();
      if (cached != null) setBox(cached);
    }
  } catch(_){}
  // استمع لتغييرات الرصيد اللحظية
  try { window.addEventListener('balance:change', (e)=>{ setBox(e?.detail?.value ?? null); }); } catch(_){}
})();

// ===== Mobile Bottom Dock (شريط سفلي للجوال) =====
(function initMobileDock(){
  try{
    // تأكد من وجود Font Awesome للأيقونات إن لم تُضمَّن من الصفحة
    try{
      var hasFA = !!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], link[href*="/fa"], link[href*="/all.min.css"]');
      if (!hasFA){
        var fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
        fa.crossOrigin = 'anonymous';
        document.head.appendChild(fa);
      }
    }catch(_){ }

    // أنشئ العناصر مرة واحدة
    var dock = document.createElement('nav');
    dock.className = 'mobile-dock';
    dock.setAttribute('aria-label','الشريط السفلي للجوال');

    function makeBtn(html, key, href){
      if (href){
        var a = document.createElement('a');
        a.href = href;
        a.innerHTML = html;
        a.className = 'dock-item';
        a.dataset.key = key;
        return a;
      } else {
        var b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = html;
        b.className = 'dock-item';
        b.dataset.key = key;
        return b;
      }
    }

    // عناصر ثابتة بنفس الترتيب على كل الصفحات
    var walletDockBtn  = makeBtn('<i class="fa-solid fa-wallet" aria-hidden="true"></i>', 'wallet',  'wallet.html');
    walletDockBtn.setAttribute('aria-label','محفظتي');

    var storeBtn   = makeBtn('<i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>', 'store',   'index.html#/games');
    storeBtn.setAttribute('aria-label','المتجر/الألعاب');

    var ordersBtn  = makeBtn('<i class="fa-solid fa-list" aria-hidden="true"></i>',            'orders',  'talabat.html');
    ordersBtn.setAttribute('aria-label','طلباتي');




    
    var depositBtn = makeBtn('<i class="fa-solid fa-circle-dollar-to-slot" aria-hidden="true"></i>', 'deposit', 'edaa.html');
    depositBtn.setAttribute('aria-label','شحن الرصيد');

    var homeBtn    = makeBtn('<i class="fa-solid fa-house" aria-hidden="true"></i>',            'home',    'index.html');
    homeBtn.setAttribute('aria-label','الرئيسية');

    dock.appendChild(walletDockBtn);
    dock.appendChild(storeBtn);
    dock.appendChild(ordersBtn);
    dock.appendChild(depositBtn);
    dock.appendChild(homeBtn);

    // أضفه بعد تحميل DOM
    window.addEventListener('DOMContentLoaded', function(){
      try{
        document.body.appendChild(dock);
        document.body.classList.add('mobile-has-dock');
      }catch(_){ }
    });

    // سلوك زر البحث: انتقال لصفحة البحث الشامل
    walletDockBtn.addEventListener('click', function(e){
      try { showPageLoader(); } catch(_){ }
      // عند كونه رابطًا لن نمنع السلوك الافتراضي
    });

    // تمييز العنصر النشط وفق المسار
    function highlight(){
      try{
        var p = (location.pathname.split('/').pop()||'').toLowerCase();
        var gamePages = new Set(['games.html','freefire.html','freefireauto.html','freefiremembership.html','freefireinbut.html','freefiren.html','pubg.html','weplay.html','bloodstrike.html','roblox.html','jawaker.html','yala.html','8ball.html','mobailleg.html','instainbut.html']);
        var key = 'home';
        if (p === 'index.html') key = 'home';
        else if (p === 'wallet.html') key = 'wallet';
        else if (p === 'talabat.html') key = 'orders';
        else if (p === 'edaa.html') key = 'deposit';
        else if (gamePages.has(p)) key = 'store';
        dock.querySelectorAll('.dock-item').forEach(function(el){ el.classList.remove('active'); });
        if (key){
          var el = dock.querySelector('.dock-item[data-key="'+key+'"]');
          if (el) el.classList.add('active');
        }
      }catch(_){ }
    }
    window.addEventListener('DOMContentLoaded', highlight);
    window.addEventListener('pageshow', highlight);
  }catch(_){ }
})();

// (تمت إزالة حارس الحالات الجديد وإرجاع سلوك الإغلاق القديم المعتمد على Firestore في الصفحات)

