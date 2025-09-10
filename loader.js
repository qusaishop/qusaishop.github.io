// loader.js
// Preload + warm cache for the loader logo image (ASAP with defer)
(function(){
  try{
    var LOADER_IMG = "https://i.ibb.co/svXFyxQk/Chat-GPT-Image-9-2025-06-11-56.png";
    // Inject <link rel="preload" as="image"> once
    if (document.head && !document.querySelector("link[rel='preload'][as='image'][href='"+LOADER_IMG+"']")) {
      var l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'image';
      l.href = LOADER_IMG;
      document.head.appendChild(l);
    }
    // Warm the cache immediately
    var im = new Image();
    im.decoding = 'async';
    // Note: fetchpriority is supported on <img> element
    try { im.fetchPriority = 'high'; } catch(_){}
    im.loading = 'eager';
    im.src = LOADER_IMG;
  }catch(_){}
})();

// Ensure Service Worker registration (fallback for pages without header.js)
(function(){
  try{
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){});
    }
  }catch(_){}
})();

document.addEventListener("DOMContentLoaded", function () {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;
  // Ensure loader image exists inside the ring
  try{
    var LOADER_IMG = "https://i.ibb.co/svXFyxQk/Chat-GPT-Image-9-2025-06-11-56.png";
    var ring = preloader.querySelector('.loader');
    if (ring && !ring.querySelector('img.loader-logo')){
      var img = document.createElement('img');
      img.className = 'loader-logo';
      img.alt = 'Loading...';
      img.decoding = 'async';
      try { img.fetchPriority = 'high'; } catch(_){}
      img.loading = 'eager';
      img.src = LOADER_IMG;
      ring.appendChild(img);
    }
  }catch(_){}

  const hide = () => {
    try {
      // انسخ أسلوب الإخفاء نفسه دائمًا لضمان زواله
      preloader.style.transition = "opacity 0.4s ease";
      preloader.style.opacity = "0";
      preloader.classList.add("hidden");
      setTimeout(() => { preloader.style.display = "none"; }, 400);
    } catch (_) {}
  };

  // أخفِه مبكرًا قدر الإمكان لنُشبه index.html (بدون انتظار تحميل الصور)
  hide();

  // ضمان الإخفاء بعد اكتمال تحميل الصفحة التقليدي
  window.addEventListener("load", hide);

  // معالجة الرجوع/التقدم من الهيستوري (BFCache): تُعاد الصفحة ومعها اللودر ظاهر
  // pageshow يُطلق حتى لو لم تُنفّذ DOMContentLoaded ثانيةً
  window.addEventListener("pageshow", function (e) {
    // في كل الأحوال أخفِ اللودر، خصوصًا عندما e.persisted=true
    hide();
  });

  // في بعض البيئات قد يُطلق popstate بدون pageshow فورًا
  window.addEventListener("popstate", hide);

  // كضمان إضافي: بمجرد أن تصبح الصفحة مرئية نزيل اللودر
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") hide();
  });
});
