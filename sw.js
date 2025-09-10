// Image precache + cache-first service worker
const SW_VERSION = 'v2.0.1';
const PRECACHE_CACHE = 'qs-precache-' + SW_VERSION;
const IMAGE_CACHE = 'qs-images-' + SW_VERSION;

// List of images to precache on first install (base list)
let PRECACHE_IMAGES = [
  "assets/games.png",
  "assets/social.png",
  "assets/software.png",
  "banner.jpg",
  "emp.png",
  "https://actufinance.fr/wp-content/uploads/2020/08/binance.png",
  "https://app.thrivingcampus.com/static/images/default-avatar.ee24c6283da6.png",
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg",
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg",
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg",
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg",
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg",
  "https://cdn.midasbuy.com/images/apps/pubgm/1599546071746KqkIhrzG.png",
  "https://cloudtiktak.com/media/static/media/WhatsApp_Image_2024-08-06_at_8_wcvOZla.jpeg",
  "https://file.yallapay.live/country/2022/0221172850768.png",
  "https://gamestoresy.com/wp-content/uploads/2025/01/c34f5ce6-1020-4765-9a68-e6a35cc9a9c0.webp",
  "https://gamestoresy.com/wp-content/uploads/2025/01/c34f5ce6-1020-4767-b38a-28821ac74453.jpg",
  "https://gawaly.net/wp-content/uploads/2022/09/facebook.png",
  "https://i.ibb.co/0N8RC93/bg1.jpg",
  "https://i.ibb.co/0pDbDVsc/1756498704843.jpg",
  "https://i.ibb.co/1fNC8yHn/unnamed.png",
  "https://i.ibb.co/1GYPyKMj/1447-02-27-23-46-21-df66c84f.jpg",
  "https://i.ibb.co/5g5rXxwf/freecompress-your-loading.gif",
  "https://i.ibb.co/6078djhh/340.png",
  "https://i.ibb.co/6cR4j9xc/monthly.png",
  "https://i.ibb.co/7xZwmG1F/1756498841823.jpg",
  "https://i.ibb.co/8nfR0P9n/bg2.jpg",
  "https://i.ibb.co/b5VMTNpz/1756415284620.jpg",
  "https://i.ibb.co/CK1tksb6/2-3.png",
  "https://i.ibb.co/cSFd7q5N/4.png",
  "https://i.ibb.co/cXQ1mG6y/prod-68632f4bac1c0-1.jpg",
  "https://i.ibb.co/DNPcqmX/cloud-2044823-640.png",
  "https://i.ibb.co/dsr8STp6/5.png",
  "https://i.ibb.co/fdNkjNXm/12.png",
  "https://i.ibb.co/Fkftn6tJ/2025-07-09-162704-2.png",
  "https://i.ibb.co/FLBGm4R8/4.png",
  "https://i.ibb.co/FLbPLzty/2000.png",
  "https://i.ibb.co/gMjH01Ff/10K.png",
  "https://i.ibb.co/GQ7bBnjp/110.png",
  "https://i.ibb.co/hFGnwDYT/1756415246638.jpg",
  "https://i.ibb.co/HpDvMDry/1756415249784.jpg",
  "https://i.ibb.co/hwRZkBG/2400.png",
  "https://i.ibb.co/Jw8XwRLg/Picsart-25-08-21-23-54-55-228.png",
  "https://i.ibb.co/Lz2rDsgr/1756331102734.jpg",
  "https://i.ibb.co/m5HLhf1n/1756802404151-1.jpg",
  "https://i.ibb.co/mrq4pqyG/image.png",
  "https://i.ibb.co/N24pzvsN/96bab6f0c8124176b6864967c220de89.jpg",
  "https://i.ibb.co/N4Rgvxy/1756424100200.jpg",
  "https://i.ibb.co/N6NmR9qr/1756415248251.jpg",
  "https://i.ibb.co/Ng98nQrh/5K.png",
  "https://i.ibb.co/nNNqHg9g/booyah.png",
  "https://i.ibb.co/PGY97mLc/3.png",
  "https://i.ibb.co/Pvkv2x4W/570.png",
  "https://i.ibb.co/qY2spSjF/1.png",
  "https://i.ibb.co/RGPKZBMq/20K.png",
  "https://i.ibb.co/sJDxmDpx/bg3.jpg",
  "https://i.ibb.co/sJsqbdfL/weekly.png",
  "https://i.ibb.co/SXdhVf8r/1756424101725.jpg",
  "https://i.ibb.co/Txf5Trqp/3.png",
  "https://i.ibb.co/V0wVXvgV/store.gif",
  "https://i.ibb.co/Vcq1dr69/1756157590278.jpg",
  "https://i.ibb.co/wFvwLZZR/1756330901302.jpg",
  "https://i.ibb.co/WvG3v5NR/2.png",
  "https://i.ibb.co/WWz1kBfM/1756415249784.jpg",
  "https://i.ibb.co/xKmTvgwS/1756498380860.jpg",
  "https://i.ibb.co/xnz6c4N/2-2.png",
  "https://i.ibb.co/Xr0rms0C/ff.webp",
  "https://i.ibb.co/xSGnKdfj/7.png",
  "https://i.ibb.co/xt399t27/1756424103296.jpg",
  "https://i.ibb.co/XZHyMGSG/1756247096045.jpg",
  "https://i.ibb.co/ymjYwxHS/1024.png",
  "https://i.ibb.co/ynzRJj22/1166.png",
  "https://i.ibb.co/ZYW3VTp/default.png",
  "https://i.ibb.co/svXFyxQk/Chat-GPT-Image-9-2025-06-11-56.png",
  "https://images.ctfassets.net/y2ske730sjqp/1aONibCke6niZhgPxuiilC/2c401b05a07288746ddf3bd3943fbc76/BrandAssets_Logos_01-Wordmark.jpg",
  "https://m.media-amazon.com/images/I/71nvKD9L-iL._UF1000,1000_QL80_.jpg",
  "https://media.zid.store/d17406b9-7e45-411a-aa40-719b34321d63/0280163c-eb42-4477-96fa-d6524a702a23.png",
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/39a153d3-9dd4-418f-bc3c-f9411100287f/id-preview-15921b1b--5c59e1c0-93f4-4530-ba14-8ac9fa8eb9dd.lovable.app-1752317021181.png",
  "https://static.vecteezy.com/system/resources/previews/020/927/344/original/vodafone-brand-logo-phone-symbol-white-design-england-mobile-illustration-with-red-background-free-vector.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg",
  "https://www.lkgamers.com/wp-content/uploads/2025/04/blood-strike-premium-strike-pass-65148.jpg",
  "https://www.thaqfny.com/wp-content/uploads/2020/12/%D8%A8%D8%A7%D9%8A-%D8%A8%D8%A7%D9%84-1.jpg",
  "images/1024.png",
  "images/10K.png",
  "images/110.png",
  "images/1166.png",
  "images/2000.png",
  "images/20K.png",
  "images/2400.png",
  "images/340.png",
  "images/570.png",
  "images/5K.png",
  "images/booyah.png",
  "images/monthly.png",
  "images/weekly.png",
  "store.gif"
];

// Extra local images discovered to ensure first-visit warm cache
const EXTRA_LOCAL_IMAGES = [
  // assets
  "assets/تصميم بدون عنوان.png",
  "assets/تصميم بدون عنوان (1).png",
  "assets/تصميم بدون عنوان (2).png",
  "assets/تصميم بدون عنوان (3).png",
  "assets/تصميم بدون عنوان (4).png",
  "assets/تصميم بدون عنوان (5).png",
  "assets/تصميم بدون عنوان (6).png",
  "assets/تصميم بدون عنوان (7).png",
  "assets/تصميم بدون عنوان (8).png",
  "assets/تصميم بدون عنوان (9).png",
  "assets/تصميم بدون عنوان (10).png",
  "assets/تصميم بدون عنوان (11).png",
  "assets/تصميم بدون عنوان (12).png",
  // images (additional)
  "images/LevelUpPass.png",
  "images/payment_1754260103_7826.png",
  "images/payment_1754260770_4984.png",
  "images/payment_1754260973_4242.png",
  "images/cat_688fa09d63268.webp",
  "images/cat_688fa22e65545.webp",
  "images/cat_688fa34eb18c5.webp",
  "images/cat_688fa5151ff2d.webp",
  // root
  "icons8-upload-to-the-cloud.gif"
];
PRECACHE_IMAGES = PRECACHE_IMAGES.concat(EXTRA_LOCAL_IMAGES);
const PRECACHE_SET = new Set(PRECACHE_IMAGES.map(u => {
  try { return new URL(u, self.location).href } catch (_) { return u }
}));

function isImageRequest(request) {
  try {
    if (request.destination === 'image') return true;
    const url = new URL(request.url);
    return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|\.ico)$/i.test(url.pathname);
  } catch (_) {
    return false;
  }
}

self.addEventListener('install', (event) => {
  // Precache all images once on first install
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(PRECACHE_CACHE);
      // Fetch and cache each image (allow opaque)
      for (const u of PRECACHE_IMAGES) {
        try {
          const full = new URL(u, self.location).href;
          const res = await fetch(full, { mode: 'no-cors', cache: 'reload' });
          if (res && (res.ok || res.type === 'opaque')) {
            await cache.put(full, res.clone());
          }
        } catch (e) { /* skip failed item */ }
      }
    } catch (_) {}
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if ((k.startsWith('qs-precache-') && k !== PRECACHE_CACHE) || (k.startsWith('qs-images-') && k !== IMAGE_CACHE)) {
        return caches.delete(k);
      }
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (!isImageRequest(req)) return;

  const url = new URL(req.url);
  const href = url.href;
  const inPrecache = PRECACHE_SET.has(href);

  // Serve precached items strictly from precache (no revalidation)
  if (inPrecache) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { cacheName: PRECACHE_CACHE });
      if (cached) return cached;
      // If somehow missing, fall back to network and store in precache
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) {
          const cache = await caches.open(PRECACHE_CACHE);
          await cache.put(req, res.clone());
        }
        return res;
      } catch (_) {
        return new Response('', { status: 504, statusText: 'Offline precached image not found' });
      }
    })());
    return;
  }

  // Dynamic image cache: cache-first with background refresh
  event.respondWith((async () => {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(req, { ignoreVary: true, ignoreSearch: false });
    if (cached) {
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && (fresh.ok || fresh.type === 'opaque')) {
            await cache.put(req, fresh.clone());
          }
        } catch (_) {}
      })());
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        try { await cache.put(req, res.clone()); } catch (_) {}
      }
      return res;
    } catch (e) {
      return cached || new Response('', { status: 504, statusText: 'Offline image not cached' });
    }
  })());
});
