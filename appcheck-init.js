// App Check disabled intentionally across the site.
// No-op to avoid any reCAPTCHA/App Check traffic.
(function () {
  try { if (window.console && console.log) console.log('[AppCheck] Disabled'); } catch (_) {}
})();
