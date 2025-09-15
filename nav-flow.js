// Navigation guard and states cache across pages (session-scoped)
(function(){
  var KEY_FLOW_ACTIVE = 'FLOW_ACTIVE';
  var KEY_FLOW_STARTED_AT = 'FLOW_STARTED_AT';
  var KEY_STATES_MAP = 'SITE_STATES_MAP';

  function getPageName(){
    try { var p = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); return p || 'index.html'; } catch(_) { return 'index.html'; }
  }

  function start(){
    try {
      sessionStorage.setItem(KEY_FLOW_ACTIVE, '1');
      sessionStorage.setItem(KEY_FLOW_STARTED_AT, String(Date.now()));
    } catch(_){ }
  }

  function beforeNavigate(){
    // mark flow active just-in-time before following a link
    start();
  }

  function ensure(){
    try{
      var active = sessionStorage.getItem(KEY_FLOW_ACTIVE) === '1';
      if(!active){
        // Hard redirect to entry
        location.replace('index.html');
      }
    }catch(_){
      try { location.replace('index.html'); } catch(__){}
    }
  }

  function saveStates(map){
    try { sessionStorage.setItem(KEY_STATES_MAP, JSON.stringify(map||{})); } catch(_){ }
  }
  function getStates(){
    try { return JSON.parse(sessionStorage.getItem(KEY_STATES_MAP) || '{}'); } catch(_){ return {}; }
  }
  function getState(pageId){
    var m = getStates();
    var ent = m && (m[pageId] || m[pageId.toLowerCase()] || m[pageId.toUpperCase()]);
    if(ent && typeof ent === 'object'){
      return ent.state || ent.status || ent.enabled || ent.on || ent.value || 'on';
    }
    if(typeof ent === 'string') return ent;
    return null;
  }

  window.NavFlow = {
    getPageName: getPageName,
    start: start,
    beforeNavigate: beforeNavigate,
    ensure: ensure,
    states: { save: saveStates, getAll: getStates, get: getState }
  };
})();

