(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
    });
  }
})(window);
// ---------------------
(function(window) {
  window.addEventListener("message", async ({ data, origin }) => {
    const from = (!window.GM_xmlhttpRequest) ? 'foreground' : 'background';
    if(!data || origin != location.origin || from == data.from) return;
    if(from == 'background' && data.from == 'foreground' && data.type == 'xhr') {
      const req = GM_xmlhttpRequestCORS(data.url, data.options);
      req.then ((v)=>window.postMessage({ from, type: 'xhr.resolve', token: data.token, data: v }, location.origin));
      req.catch((e)=>window.postMessage({ from, type: 'xhr.reject' , token: data.token, data: e }, location.origin));
    }
  }, false);
  window.GM_xmlhttpRequestCORS = async function GM_xmlhttpRequestCORS(url, options = { method: 'GET' }) {
    const from = (!window.GM_xmlhttpRequest) ? 'foreground' : 'background';
    if(from == 'foreground') {
      return new Promise((resolve, reject) => {
        const token = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        function callback({ data, origin }) {
          if(!data || origin != location.origin || from == data.uuid || token != data.token) return;
          if(from == 'foreground' && data.from == 'background' && data.type == 'xhr.resolve') {
            window.removeEventListener("message", callback); resolve(data.data);
          }
          if(from == 'foreground' && data.from == 'background' && data.type == 'xhr.reject') {
            window.removeEventListener("message", callback); reject(data.data);
          }
        }
        window.addEventListener("message", callback, false);
        window.postMessage({ type: 'xhr', token, from, url, options }, location.origin);
      });
    }
    if(from == 'background') {
        const resp = await GM_xmlhttpRequestAsync(url, options);
        return resp && resp.response;
    }
  }
  window.addEventListener('load', () => {
    if(window.GM_addScript) { window.GM_addScript(`()=>{ window.GM_xmlhttpRequestCORS = ${GM_xmlhttpRequestCORS}; }`); }
  })
})(window);