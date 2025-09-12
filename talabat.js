// ===== Firebase init =====
const firebaseConfig = {
  apiKey: "AIzaSyB6dC1UAS0-ilt-dj9UpcLIPljwbI3FCZs",
  authDomain: "qusaystore-ec327.firebaseapp.com",
  projectId: "qusaystore-ec327",
  storageBucket: "qusaystore-ec327.firebasestorage.app",
  messagingSenderId: "701743074708",
  appId: "1:701743074708:web:defc2de594567b6624d381",
  measurementId: "G-00R4XQCB1V"
};

// Reuse existing app if already initialized on this page
const app = (firebase.apps && firebase.apps.length)
  ? firebase.app()
  : firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ========= إعدادات عامة =========
const STATUS_REFRESH_WINDOW_DAYS = 7; // عدد الأيام التي نحدّث فيها حالة الطلب عند كل دخول
const PAGINATION = { size: 20, page: 1, orders: [] };

/* ===================== Theme (اختياري) ===================== */
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  } catch (e) {}
});

// عند تحقق تسجيل الدخول
firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    alert("يجب تسجيل الدخول أولاً");
    window.location.href = "index.html";
  } else {
    await loadOrdersCacheFirst(user.uid);   // اعرض من الكاش أو اجلب مرة واحدة إذا فاضي
    await syncOrdersMerge(user.uid);        // عند كل دخول: اجلب وادمج الطلبات الجديدة وتحديث حالاتها
    refreshRecentStatuses(user.uid);        // كتحسين: حدّث حديثة فقط (احتياطي)
    listenOrdersRealtime(user.uid);         // متابعة فورية لأي طلب جديد/معدل
  }
});

/* ===================== LocalStorage Helpers ===================== */
/**
 * نخزن الطلبات بهذا الشكل داخل localStorage:
 * key: orders_cache:<uid>
 * value: { byCode: { CODE: orderObj }, lastSync: <timestamp> }
 * ملاحظة: نضع بيانات public داخل كائن الطلب مباشرة (playerId, total, status, timestamp, العروض ...)
 * وإذا جلبنا تفاصيل pub/priv للطلب نضيفها في حقول __pub / __priv داخل نفس الطلب.
 */
const ORDERS_KEY = (uid) => `orders_cache:${uid}`;

const LS = {
  read(uid) {
    try {
      const raw = localStorage.getItem(ORDERS_KEY(uid));
      if (!raw) return { byCode: {}, lastSync: 0 };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.byCode !== 'object') return { byCode: {}, lastSync: 0 };
      return parsed;
    } catch {
      return { byCode: {}, lastSync: 0 };
    }
  },
  replace(uid, ordersArray) {
    const byCode = {};
    (ordersArray || []).forEach(o => { if (o?.code) byCode[o.code] = o; });
    LS._save(uid, { byCode, lastSync: Date.now() });
  },
  merge(uid, ordersArray) {
    const cur = LS.read(uid);
    (ordersArray || []).forEach(o => {
      if (!o?.code) return;
      cur.byCode[o.code] = { ...(cur.byCode[o.code] || {}), ...o };
    });
    cur.lastSync = Date.now();
    LS._save(uid, cur);
  },
  upsert(uid, orderObj) {
    if (!orderObj?.code) return;
    const cur = LS.read(uid);
    cur.byCode[orderObj.code] = { ...(cur.byCode[orderObj.code] || {}), ...orderObj };
    cur.lastSync = Date.now();
    LS._save(uid, cur);
  },
  _save(uid, obj) {
    try {
      localStorage.setItem(ORDERS_KEY(uid), JSON.stringify(obj));
    } catch (e) {
      console.warn("تعذّر الحفظ في LocalStorage (قد تكون المساحة ممتلئة).", e);
    }
  },
  clear(uid) {
    try { localStorage.removeItem(ORDERS_KEY(uid)); } catch {}
  }
};

// تحويل الكاش إلى مصفوفة مرتبة زمنياً
function cacheToSortedArray(uid) {
  const { byCode } = LS.read(uid);
  const arr = Object.values(byCode || {});
  return arr.sort((a, b) => {
    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tB - tA;
  });
}

// أداة: حساب إن كان الطلب حديثًا (≤ N أيام)
function isWithinDays(ts, days) {
  if (!ts) return true; // إذا التاريخ غير معروف نعتبره حديثًا لتحديثه بحذر
  const t = new Date(ts).getTime();
  if (isNaN(t)) return true;
  const diffMs = Date.now() - t;
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

/* ===================== Skeleton أثناء التحميل ===================== */
function showOrdersSkeleton(count = 3) {
  const list = document.getElementById("ordersList");
  if (!list) return;
  list.querySelectorAll(".order-card.loading").forEach(n => n.remove());
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "order-card loading";
    list.appendChild(sk);
  }
}

/* ===================== تحميل الطلبات: Cache-First ===================== */
async function loadOrdersCacheFirst(uid) {
  const ordersList = document.getElementById("ordersList");
  if (!ordersList) return;

  // اعرض المخزن أولًا إن وُجد
  const cachedArr = cacheToSortedArray(uid);
  if (cachedArr.length) {
    renderOrders(cachedArr);
    return;
  }

  // الكاش فاضي -> قراءة واحدة من Firebase ثم تخزين
  ordersList.innerHTML = "";
  showOrdersSkeleton(1);

  try {
    const fresh = await fetchOrdersFromFirebaseOnce(uid);
    LS.replace(uid, fresh);
    renderOrders(fresh);
  } catch (e) {
    console.error(e);
    ordersList.querySelectorAll(".order-card.loading").forEach(n => n.remove());
  }
}

// قراءة مرّة واحدة لكل الطلبات الخاصة بالمستخدم (لملء الكاش فقط عند فراغه)
async function fetchOrdersFromFirebaseOnce(uid) {
  const ordersRef = db.collection("orders").where("userId", "==", uid);
  const snapshot = await ordersRef.get();

  const promises = snapshot.docs.map(async (doc) => {
    const orderData = doc.data() || {};
    const pubSnap = await doc.ref.collection("public").doc("main").get();
    const pubData = pubSnap.exists ? pubSnap.data() : {};
    return {
      code: orderData.code || doc.id,
      ...pubData,                        // playerId / total / status / timestamp / العروض...
      proof: orderData.proof || "",
      __fetchedAt: Date.now()
    };
  });

  const ordersArray = await Promise.all(promises);
  return ordersArray.sort((a, b) => {
    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tB - tA;
  });
}

// جلب جميع الطلبات ودمجها مع الكاش (يضمن ظهور الجديدة بعد كل دخول)
async function syncOrdersMerge(uid) {
  try {
    const ordersRef = db.collection("orders").where("userId", "==", uid);
    const snapshot = await ordersRef.get();

    const promises = snapshot.docs.map(async (doc) => {
      const orderData = doc.data() || {};
      const pubSnap = await doc.ref.collection("public").doc("main").get();
      const pubData = pubSnap.exists ? pubSnap.data() : {};
      return {
        code: orderData.code || doc.id,
        ...pubData,
        proof: orderData.proof || "",
        __fetchedAt: Date.now()
      };
    });

    const fresh = await Promise.all(promises);
    // دمج مع الكاش ثم أعد الرسم من الكاش المدمج (مرتب زمنياً)
    LS.merge(uid, fresh);
    renderOrders(cacheToSortedArray(uid));
  } catch (e) {
    console.error("syncOrdersMerge error:", e);
  }
}

/* ===================== تحديث حالة الطلبات الحديثة عند كل دخول ===================== */
/**
 * يجلب public/main لكل طلب حديث (≤ 7 أيام) لتحديث الحقول (خصوصًا status).
 * الأقدم من 7 أيام لا يُجلب ويوثق من الكاش فقط.
 */
async function refreshRecentStatuses(uid) {
  const cache = LS.read(uid);
  const codes = Object.keys(cache.byCode || {});
  if (!codes.length) return;

  const recentCodes = codes.filter(code => {
    const o = cache.byCode[code];
    // نحدّث إذا الطلب حديث (≤ 7 أيام) أو لا يملك timestamp أو لا يملك status
    return isWithinDays(o?.timestamp, STATUS_REFRESH_WINDOW_DAYS) || !o?.status;
  });

  if (!recentCodes.length) return;

  try {
    // اجلب public/main لكل كود حديث
    const updates = await Promise.all(recentCodes.map(async (code) => {
      try {
        const orderRef = db.collection("orders").doc(code);
        const pubSnap = await orderRef.collection("public").doc("main").get();
        const pub = pubSnap.exists ? pubSnap.data() : {};
        // ندمج فقط الحقول العامة (ومن ضمنها status/timestamp)
        return { code, ...pub, __lastStatusRefreshAt: Date.now() };
      } catch (e) {
        console.warn("تعذّر تحديث حالة الطلب:", code, e);
        return null;
      }
    }));

    const valid = updates.filter(Boolean);
    if (valid.length) {
      LS.merge(uid, valid);
      // أعد الرسم بعد الدمج
      renderOrders(cacheToSortedArray(uid));
    }
  } catch (e) {
    console.error("refreshRecentStatuses error:", e);
  }
}

/* ===================== عرض الطلبات ===================== */
function renderOrders(orders) {
  const ordersList = document.getElementById("ordersList");
  if (!ordersList) return;

  // حفظ البيانات وتبديل إلى الصفحة الأولى
  PAGINATION.orders = Array.isArray(orders) ? orders.slice() : [];
  PAGINATION.page = 1;

  drawOrdersPage();
}

function drawOrdersPage() {
  const ordersList = document.getElementById("ordersList");
  if (!ordersList) return;

  ordersList.innerHTML = "";

  const total = PAGINATION.orders.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGINATION.size));
  const page = Math.min(Math.max(1, PAGINATION.page), totalPages);
  PAGINATION.page = page;

  const start = (page - 1) * PAGINATION.size;
  const end = Math.min(start + PAGINATION.size, total);
  const slice = PAGINATION.orders.slice(start, end);

  slice.forEach(order => {
    const { code, playerId, total, country, payment, العروض: offers, timestamp, status, proof } = order;
    const existing = document.getElementById(`order-${code}`);
    if (existing) existing.remove();

    let formattedDate = "";
    try {
      formattedDate = new Date(timestamp).toLocaleString("ar-EG", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      formattedDate = timestamp || "غير معروف";
    }

    let offersFormatted = "";
    if (offers) {
      offersFormatted = offers
        .split("•")
        .filter(item => item.trim())
        .map(item => `<li>${item.trim()}</li>`)
        .join("");
      offersFormatted = `<ul style="padding-right:20px;">${offersFormatted}</ul>`;
    }

    let statusClass = "";
    if (status === "مرفوض") statusClass = "مرفوض";
    else if (status === "تم_الشحن") statusClass = "تم_الشحن";

    const card = document.createElement("div");
    card.className = "order-card";
    card.id = `order-${code}`;

    card.innerHTML = `
      <div class="order-header" onclick="toggleDetails('${code}')">
        <div>
          <strong>كود الطلب:</strong> ${code}<br>
          🎮 <strong>${playerId || "-"}</strong> | 💵 <strong>${total || "-"}</strong>
        </div>
        <div class="order-status ${statusClass}">
          ${status === "تم_الشحن" ? "تم الشحن" : (status || "قيد المعالجة")}
        </div>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="order-details" id="details-${code}" style="display:none;">
        <p><strong>🆔 معرف اللاعب:</strong> ${playerId || "غير متوفر"}</p>
        <p><strong>🎁 العروض:</strong> ${offersFormatted || "-"}</p>
        <p><strong>💵 المجموع:</strong> ${total || "-"}</p>
        <p><strong>📅 تاريخ الإرسال:</strong> ${formattedDate}</p>
        ${
          proof
            ? `<p>
                 <strong>📸 إثبات التحويل:</strong>
                 <button class="btn-show-proof" data-code="${code}">عرض الصورة</button><br>
                 <img id="proof-img-${code}" src="${proof}" alt="إثبات التحويل" style="display:none; max-width:100%; margin-top:10px;">
               </p>`
            : ``
        }
      </div>
    `;

    ordersList.appendChild(card);
  });

  attachProofButtons();
  renderPaginationControls(total, page, totalPages, start, end);
}

function attachProofButtons() {
  document.querySelectorAll('.btn-show-proof').forEach(btn => {
    btn.onclick = () => {
      const code = btn.dataset.code;
      const img = document.getElementById(`proof-img-${code}`);
      if (img.style.display === 'none' || !img.style.display) {
        img.style.display = 'block';
        btn.textContent = 'إخفاء الصورة';
      } else {
        img.style.display = 'none';
        btn.textContent = 'عرض الصورة';
      }
    };
  });
}

/* ===================== استماع فوري لتغيرات الطلبات ===================== */
let _ordersUnsub = null;
function listenOrdersRealtime(uid) {
  try { if (_ordersUnsub) { _ordersUnsub(); _ordersUnsub = null; } } catch {}
  try {
    const q = db.collection('orders').where('userId', '==', uid);
    _ordersUnsub = q.onSnapshot(async (snap) => {
      if (snap.empty) return;
      try {
        const changes = snap.docChanges();
        // اجلب public/main للوثائق المضافة/المعدلة فقط
        const updates = await Promise.all(changes.map(async (ch) => {
          if (ch.type !== 'added' && ch.type !== 'modified') return null;
          const doc = ch.doc;
          const data = doc.data() || {};
          try {
            const pubSnap = await doc.ref.collection('public').doc('main').get();
            const pub = pubSnap.exists ? pubSnap.data() : {};
            return {
              code: data.code || doc.id,
              ...pub,
              proof: data.proof || ''
            };
          } catch {
            return {
              code: data.code || doc.id,
              proof: data.proof || ''
            };
          }
        }));
        const valid = updates.filter(Boolean);
        if (valid.length) {
          const uidNow = (auth.currentUser || firebase.auth().currentUser)?.uid;
          if (uidNow) {
            LS.merge(uidNow, valid);
            renderOrders(cacheToSortedArray(uidNow));
          }
        }
      } catch (e) {
        console.warn('orders realtime merge failed', e);
      }
    });
  } catch (e) {
    console.warn('listenOrdersRealtime failed', e);
  }
}

function renderPaginationControls(total, page, totalPages, start, end) {
  const ordersList = document.getElementById('ordersList');
  if (!ordersList) return;

  let pager = document.getElementById('ordersPagination');
  if (!pager) {
    pager = document.createElement('div');
    pager.id = 'ordersPagination';
    pager.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0;flex-wrap:wrap';
    ordersList.insertAdjacentElement('afterend', pager);
  }

  if (total <= PAGINATION.size) {
    pager.innerHTML = '';
    pager.style.display = 'none';
    return;
  }
  pager.style.display = 'flex';

  const info = document.createElement('div');
  info.textContent = `عرض ${start + 1}–${end} من ${total}`;
  info.style.marginInlineStart = '8px';

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '6px';

  const mkBtn = (label, disabled, handler) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer';
    if (document.body.classList.contains('dark-mode')) {
      b.style.background = '#0f172a'; b.style.color = '#e6edf3'; b.style.borderColor = '#334155';
    }
    b.disabled = !!disabled;
    if (disabled) { b.style.opacity = '0.6'; b.style.cursor = 'not-allowed'; }
    if (handler) b.addEventListener('click', handler);
    return b;
  };

  // Previous
  controls.appendChild(mkBtn('السابق', page <= 1, () => { PAGINATION.page = Math.max(1, page - 1); drawOrdersPage(); }));

  // Page numbers (compact: 1 ... p-1 p p+1 ... N)
  const addPageBtn = (p) => {
    const btn = mkBtn(String(p), false, () => { PAGINATION.page = p; drawOrdersPage(); });
    if (p === page) { btn.style.fontWeight = '800'; btn.style.borderColor = '#0077cc'; }
    controls.appendChild(btn);
  };
  const addEllipsis = () => {
    const span = document.createElement('span'); span.textContent = '...'; span.style.padding = '6px 4px';
    controls.appendChild(span);
  };
  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p++) addPageBtn(p);
  } else {
    addPageBtn(1);
    if (page > 3) addEllipsis();
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) addPageBtn(p);
    if (page < totalPages - 2) addEllipsis();
    addPageBtn(totalPages);
  }

  // Next
  controls.appendChild(mkBtn('التالي', page >= totalPages, () => { PAGINATION.page = Math.min(totalPages, page + 1); drawOrdersPage(); }));

  pager.innerHTML = '';
  pager.appendChild(info);
  pager.appendChild(controls);
}

/* ===================== تفاصيل الطلب: Cache-First ثم Firebase لهذا الطلب ===================== */
async function showOrderDetails(code) {
  const detailsBox = document.getElementById("orderDetails");
  if (!detailsBox) return;

  if (!code) {
    detailsBox.style.display = "none";
    return;
  }

  const uid = (auth.currentUser || firebase.auth().currentUser)?.uid;
  if (!uid) return;

  // حاول من الكاش أولاً
  const cache = LS.read(uid);
  const cachedOrder = cache.byCode[code];

  if (cachedOrder?.__pub && cachedOrder?.__priv) {
    renderDetailsTable(cachedOrder.__pub, cachedOrder.__priv, detailsBox);
    return;
  }

  // خلاف ذلك: اجلب لهذا الطلب فقط ثم خزّنه
  try {
    const orderRef = db.collection("orders").doc(code);
    const [pubSnap, privSnap] = await Promise.all([
      orderRef.collection("public").doc("main").get(),
      orderRef.collection("private").doc("main").get()
    ]);

    const pub = pubSnap.exists ? pubSnap.data() : {};
    const priv = privSnap.exists ? privSnap.data() : {};

    // خزّن ضمن نفس عنصر الطلب في الكاش
    LS.upsert(uid, { code, __pub: pub, __priv: priv });

    renderDetailsTable(pub, priv, detailsBox);
  } catch (e) {
    console.error(e);
    detailsBox.style.display = "none";
  }
}

function renderDetailsTable(pub, priv, detailsBox) {
  let rows = '';
  const appendRow = (label, value) => {
    rows += `<tr>
               <td style="padding:10px;font-weight:bold;border:1px solid #ccc;">${label}</td>
               <td style="padding:10px;border:1px solid #ccc;">${value}</td>
             </tr>`;
  };

  rows += `<tr><td colspan="2" style="background:#eee;padding:10px;font-weight:bold;">📂 Public</td></tr>`;
  Object.entries(pub || {}).forEach(([k, v]) => appendRow(k, v));

  rows += `<tr><td colspan="2" style="background:#eee;padding:10px;font-weight:bold;">🔒 Private</td></tr>`;
  Object.entries(priv || {}).forEach(([k, v]) => appendRow(k, v));

  detailsBox.innerHTML = `<table style="width:100%;direction:rtl;border-collapse:collapse;">${rows}</table>`;
  detailsBox.style.display = "block";
}

/* ===================== اتفاقية المستخدم (كما لديك) ===================== */
// أبقِ هذا الحدث للاتفاقية فقط — بدون استدعاء تحميلات هنا
window.addEventListener("DOMContentLoaded", () => {
  const agreed = localStorage.getItem('userAgreementAccepted');
  if (agreed !== 'true') {
    const box = document.getElementById('user-agreement');
    if (box) {
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.justifyContent = 'center';
    }
  }
});

/* ===================== أدوات واجهة بسيطة (اختيارية) ===================== */
// زر تحديت/مسح الكاش (إن أضفتهما في الصفحة)
document.addEventListener('DOMContentLoaded', () => {
  const btnRefresh = document.getElementById('btnRefresh');
  const btnClear = document.getElementById('btnClearCache');

  if (btnRefresh) {
    btnRefresh.onclick = async () => {
      const uid = (auth.currentUser || firebase.auth().currentUser)?.uid;
      if (!uid) return;
      showOrdersSkeleton(1);
      try {
        const fresh = await fetchOrdersFromFirebaseOnce(uid);
        LS.replace(uid, fresh);
        renderOrders(fresh);
        // بعد التحديث الكامل، ما زلنا نطبّق قاعدة 7 أيام تلقائيًا عند الدخول القادم
      } catch (e) {
        console.error(e);
      }
    };
  }

  if (btnClear) {
    btnClear.onclick = () => {
      const uid = (auth.currentUser || firebase.auth().currentUser)?.uid;
      if (!uid) return;
      LS.clear(uid);
      const ordersList = document.getElementById("ordersList");
      if (ordersList) ordersList.innerHTML = "";
    };
  }
});

/* ===================== أدوات صغيرة ===================== */
function toggleDetails(code) {
  const d = document.getElementById(`details-${code}`);
  const card = document.getElementById(`order-${code}`);
  if (!d || !card) return;
  const isOpen = d.style.display === 'block';
  d.style.display = isOpen ? 'none' : 'block';
  card.classList.toggle('open', !isOpen);
}
