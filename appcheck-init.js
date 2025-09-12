// Firebase App Check activation (Compat) for the whole site
// Uses reCAPTCHA v3 site key provided by the owner
(function () {
  var SITE_KEY = '6LcL5ccrAAAAAIaZ1PVAIWMtVBiHVm_IJzeiP2in';
  var attempts = 0;
  var maxAttempts = 300; // ~60s with 200ms interval

  function tryActivate() {
    attempts++;
    try {
      if (window.firebase && typeof firebase === 'object') {
        // Ensure App Check SDK is loaded and default app exists
        if (typeof firebase.appCheck === 'function' && firebase.apps && firebase.apps.length) {
          try {
            firebase.appCheck().activate(SITE_KEY, true);
            // Optional log for diagnostics
            if (window.console && console.log) console.log('[AppCheck] Activated (compat)');
          } catch (e) {
            if (window.console && console.warn) console.warn('[AppCheck] Activation error', e);
          }
          return; // Done
        }
      }
    } catch (e) {
      if (window.console && console.warn) console.warn('[AppCheck] Probe error', e);
    }

    if (attempts < maxAttempts) {
      setTimeout(tryActivate, 200);
    } else {
      if (window.console && console.warn) console.warn('[AppCheck] Could not initialize within timeout');
    }
  }

  tryActivate();
})();
