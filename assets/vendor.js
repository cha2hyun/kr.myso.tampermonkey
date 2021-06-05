// ---------------------
(function(window) {
  window.GM_App = function(callback) {
    function _requestIdleCallback(callback) {
        if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
        return requestIdleCallback(callback);
    }
    function checkForDOM() { return (document.body) ? callback() : _requestIdleCallback(checkForDOM); }
    _requestIdleCallback(checkForDOM);
  }
})(window);
// ---------------------
(function(window) {
  window.__queueDelay = 1000 * 15;
  window.__queueTimer;
  window.__queues = [];
  window.setTimeoutQueue = function(handler, timeout = window.__queueDelay) { window.__queues.push({ handler, timeout }); }
  window.clearTimeoutQueue = function(){
    window.__queueTimer = clearTimeout(window.__queueTimer);
    window.__queues.splice(0, window.__queues.length - 1);
    window.runTimeoutQueue();
  }
  window.runTimeoutQueue = function() {
    window.__queueTimer = clearTimeout(window.__queueTimer);
    window.__queueTimer = setTimeout(function() {
      window.__queueTimer = clearTimeout(window.__queueTimer);
      let now = Date.now();
      let queue = window.__queues.shift();
      let timeout = queue ? (queue.timeout || window.__queueDelay) : window.__queueDelay;
      if(queue && queue.handler) { queue.handler.apply(this); }
      let dif = Date.now() - now;
      let handle = setTimeout(function() {
          handle = clearTimeout(handle);
          window.runTimeoutQueue();
      }, Math.max(window.__queueDelay, timeout - dif));
    });
  }
  window.runTimeoutQueue();
})(window);
// ---------------------
(function(window) {
  window.inject_js = function inject_js(script) {
    const container = (document.head || document.body || document.documentElement);
    const element = document.createElement('script');
    element.setAttribute('type', 'text/javascript');
    const remote = (()=>{ try { return !!new URL(script); } catch(e) { return !1; } })();
    if(remote) { element.setAttribute('src', script); } else { element.textContent = `(${script})()`; }
    container.append(element);
    element.onload = function() { try{ container.removeChild(element); } catch(e) {} };
    setTimeout(function(){ try{ container.removeChild(element); } catch(e) {} }, 300);
  }
  window.GM_addScript = window.GM_addScript || window.inject_js;
})(window);
// ---------------------
(function(window) {
  window.inject_css = function inject_css(css) {
    const container = (document.head || document.body || document.documentElement);
    const element = document.createElement('style');
    element.setAttribute('type', 'text/css');
    element.textContent = css;
    container.append(element);
    element.onload = function() { container.removeChild(element); };
    setTimeout(function(){ container.removeChild(element); }, 300);
  }
  window.GM_addStyle = window.GM_addStyle || window.inject_css;
})(window);
// ---------------------
(function(window) {
  const delay = 300;
  const main = { timer: null };
  history.pushState = (function (f) {
    return function pushState(){
      var ret = f.apply(this, arguments);
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(function() {
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));  
      }, delay);
      return ret;
    }
  })(history.pushState);
  history.replaceState = (function (f) {
    return function replaceState(){
      var ret = f.apply(this, arguments);
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(function() {
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
      return ret;
    }
  })(history.replaceState);
  window.addEventListener('popstate',function() {
    main.timer = clearTimeout(main.timer);
    main.timer = setTimeout(function() {
      window.dispatchEvent(new Event('locationchange'));
    }, delay);
  });
  window.addEventListener('load',function() {
    if(!window.__loaded__) {
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(function() {
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
    }
    window.__loaded__ = true;
  });
  window.addEventListener('DOMContentLoaded',function() {
    if(!window.__loaded__) {
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(function() {
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
    }
    window.__loaded__ = true;
  });
  setTimeout(function() {
    if(!window.__loaded__) {
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(function() {
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
    }
    window.__loaded__ = true;
  }, 1000);
})(window);
// ---------------------
(function () {
  Object.pick = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>filter.includes(key));
    return keys.reduce((out, key)=>(out[key] = object[key], out), {});
  }
  Object.omit = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>!filter.includes(key));
    return keys.reduce((out, key)=>(out[key] = object[key], out), {});
  }
  Object.conservation = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>!filter.includes(key));
    keys.map((key)=>delete object[key]);
  }
  Object.exclusion = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>filter.includes(key));
    keys.map((key)=>delete object[key]);
  }
  Array.prototype.excludes = function(x) { return !this.includes(x); }
  function ArrayClass(Clazz) {
    let prototypeArray = Object.getOwnPropertyNames(Array.prototype);
    let prototypeClazz = Object.getOwnPropertyNames(Clazz.prototype);
    let prototype = prototypeArray.filter(prototypeClazz.excludes.bind(prototypeClazz)); prototype.push(Symbol.iterator, Symbol.unscopables);
    prototype.map(prototypeName=>{
      if(typeof Clazz.prototype[prototypeName] !== 'undefined') return;
      Clazz.prototype[prototypeName] = Array.prototype[prototypeName];
    });
  }
  ArrayClass(NodeList);
  ArrayClass(DOMTokenList);
  ArrayClass(HTMLCollection);
  DOMTokenList.prototype.startsWith = function(className) { return this.find(o=>o.startsWith(className)); }
  DOMTokenList.prototype.endsWith = function(className) { return this.find(o=>o.endsWith(className)); }
})();
// ---------------------
(function (window) {
  HTMLDocument.prototype.createElement = ((createElement) => {
    return function() {
      createElement.name = 'createElement';
      return createElement.apply(this, arguments);
    }
  })(HTMLDocument.prototype.createElement$ = HTMLDocument.prototype.createElement$ || HTMLDocument.prototype.createElement);

  HTMLElement.prototype.appendChild = ((appendChild) => {
    return function() {
      appendChild.name = 'appendChild';
      handleElementRecursive.apply(this, arguments);
      return appendChild.apply(this, arguments);
    }
  })(HTMLElement.prototype.appendChild$ = HTMLElement.prototype.appendChild$ || HTMLElement.prototype.appendChild);

  function handleElementRecursive(element, ...props) {
    if(element && element instanceof HTMLElement) {
      if(window.handleElementRecursive) window.handleElementRecursive.apply(this, arguments);
      if(element instanceof HTMLElement && element.children) {
        element.children.filter((child)=>child instanceof HTMLElement).map((child)=>handleElementRecursive.call(element, null, child));
      }
    }
    return element;
  }
})(window);
// ---------------------
(function (window) {
  window.GM_xmlhttpRequestHook = (callback) => window.GM_xmlhttpRequestHook.tracking = callback || window.GM_xmlhttpRequestHook.tracking;
  window.GM_xmlhttpRequestHook.tracking = (data, origin) => origin;
  window.fetch = ((fetch) => {
    return function(url) {
      window.GM_xmlhttpRequestHook.tracking({ type: 'xhr', target: this.url = url });
      return fetch.apply(this, arguments);
    };
  })(window.fetch$ = window.fetch$ || window.fetch);
  window.Response = ((Response) => {
    const Res = Response.prototype, text = Res.text, json = Res.json;
    Res.text = async function() {
      const res = await text.apply(this, arguments), txt = res;
      const detail_keys = ['url', 'status', 'statusText'];
      const detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), { response: txt, responseText: txt, responseJson: undefined });
      try { detail.responseJson = JSON.parse(res); } catch(e) {}
      return window.GM_xmlhttpRequestHook.tracking({ type: 'xhrload', target: this.url, detail }, res);
    };
    Res.json = async function() {
      const res = await json.apply(this, arguments), txt = JSON.stringify(res);
      const detail_keys = ['url', 'status', 'statusText'];
      const detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), { response: txt, responseText: txt, responseJson: res, });
      return window.GM_xmlhttpRequestHook.tracking({ type: 'xhrload', target: this.url, detail }, res);
    };
  })(window.Response$ = window.Response$ || window.Response)
  window.XMLHttpRequest = ((XMLHttpRequest)=> {
    const XHR = XMLHttpRequest.prototype, send = XHR.send, open = XHR.open;
    XHR.open = function(method, url) { this.url = url; return open.apply(this, arguments); }
    XHR.send = function() {
      this.addEventListener('load', function () {
        const detail_keys = ['url', 'response', 'status', 'statusText'];
        const detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), { responseText: undefined, responseJson: undefined });
        try { detail.responseText = detail.response; } catch(e) {};
        try { detail.responseJson = JSON.parse(detail.response); } catch(e) {}
        window.GM_xmlhttpRequestHook.tracking({ type: 'xhrload', target: this.url, detail });
      });
      window.GM_xmlhttpRequestHook.tracking({ type: 'xhr', target: this.url });
      send.apply(this, arguments);
    };
    return XMLHttpRequest;
  })(window.XMLHttpRequest$ = window.XMLHttpRequest$ || window.XMLHttpRequest);
})(window);
// ---------------------
(function(window) {
  window.GM_xmlhttpRequestCORSAsync = function(url, options) {
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
        const resp = await GM_xmlhttpRequestCORSAsync(url, options);
        return resp && resp.response;
    }
  }
  window.addEventListener('load', () => {
    if(window.GM_addScript) { window.GM_addScript(`()=>{ window.GM_xmlhttpRequestCORS = ${GM_xmlhttpRequestCORS}; }`); }
  })
})(window);