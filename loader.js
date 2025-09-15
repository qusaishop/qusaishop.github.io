// loader.js (smooth navigation preloader)
// 1) Warm loader image cache ASAP
(function(){
  try{
    var LOADER_IMG = "https://i.ibb.co/svXFyxQk/Chat-GPT-Image-9-2025-06-11-56.png";
    if (document.head && !document.querySelector("link[rel='preload'][as='image'][href='"+LOADER_IMG+"']")) {
      var l = document.createElement('link'); l.rel='preload'; l.as='image'; l.href=LOADER_IMG; document.head.appendChild(l);
    }
    var im = new Image();
    im.decoding = 'async';
    try { im.fetchPriority = 'high'; } catch(_){ }
    im.loading = 'eager';
    im.src = LOADER_IMG;
  }catch(_){ }
})();

// 2) Ensure SW (for image caching) — safe on HTTPS/localhost
(function(){
  try{
    var h = (location.hostname||'');
    var isLocal = h === 'localhost' || h === '127.0.0.1' || /^0\.0\.0\.0$/.test(h) || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
    var isSecure = (typeof window.isSecureContext === 'boolean' ? window.isSecureContext : false) || location.protocol === 'https:' || isLocal;
    if ('serviceWorker' in navigator && isSecure) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){});
    }
  }catch(_){ }
})();

// 3) Preloader control with minimum hold to avoid flicker
document.addEventListener('DOMContentLoaded', function(){
  var pre = document.getElementById('preloader');
  if (!pre) return;

  // Ensure inner logo <img> exists (for non-CSS-only environments)
  try{
    var LOADER_IMG = "https://i.ibb.co/svXFyxQk/Chat-GPT-Image-9-2025-06-11-56.png";
    var ring = pre.querySelector('.loader');
    if (ring && !ring.querySelector('img.loader-logo')){
      var img = document.createElement('img');
      img.className = 'loader-logo';
      img.alt = 'Loading...';
      img.decoding = 'async';
      try { img.fetchPriority = 'high'; } catch(_){ }
      img.loading = 'eager';
      img.src = LOADER_IMG;
      ring.appendChild(img);
    }
  }catch(_){ }

  var KEY_FLAG = 'nav:loader:expected';
  var KEY_TIME = 'nav:loader:showAt';

  function cleanup(){ try{ sessionStorage.removeItem(KEY_FLAG); sessionStorage.removeItem(KEY_TIME); }catch(_){ } }

  function hide(){
    try{
      pre.style.transition = 'opacity 0.4s ease';
      pre.style.opacity = '0';
      pre.classList.add('hidden');
      setTimeout(function(){ pre.style.display = 'none'; }, 400);
    }catch(_){ }
  }

  // Immediate hide on BFCache restore
  window.addEventListener('pageshow', function(e){ if (e && e.persisted) { hide(); cleanup(); } });

  var expected = false; var shownAt = 0;
  try { expected = sessionStorage.getItem(KEY_FLAG) === '1'; shownAt = Number(sessionStorage.getItem(KEY_TIME) || 0) || 0; } catch(_){ }

  if (expected) {
    var MIN_HOLD = 450;     // ms: minimum visible time for smoothness
    var MAX_SAFETY = 2200;  // ms: ensure we never get stuck
    var now = Date.now();
    var remain = Math.max(0, MIN_HOLD - (now - shownAt));

    var loadDone = false, timerDone = false, safetyDone = false;
    function tryHide(){ if (loadDone && (timerDone || safetyDone)) { hide(); cleanup(); } }

    window.addEventListener('load', function(){ loadDone = true; tryHide(); });
    setTimeout(function(){ timerDone = true; tryHide(); }, remain);
    setTimeout(function(){ safetyDone = true; tryHide(); }, Math.max(remain + 800, 1200));
    document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'visible') tryHide(); });
  } else {
    // Direct open/refresh: wait for full page load + 2 rAFs to settle layout
    window.addEventListener('load', function(){
      try { requestAnimationFrame(function(){ requestAnimationFrame(hide); }); } catch(_){ hide(); }
    });
  }

  // Fallback path: ensure hide on popstate as well
  window.addEventListener('popstate', function(){ hide(); cleanup(); });
});

