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
    element.textContent = `(${script})()`;
    container.append(element);
    element.onload = function() { container.removeChild(element); };
    setTimeout(function(){ container.removeChild(element); }, 300);
  }
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
      return handleElementRecursive.bind(this, appendChild).apply(this, arguments);
    }
  })(HTMLElement.prototype.appendChild$ = HTMLElement.prototype.appendChild$ || HTMLElement.prototype.appendChild);

  function handleElementRecursive(handler, element, ...props) {
    if(element && element instanceof HTMLElement) {
      element = handleElement.apply(this, arguments);
      if(window.handleElementRecursive) window.handleElementRecursive.apply(this, arguments);
      if(element instanceof HTMLElement && element.children) {
        element.children.filter((child)=>child instanceof HTMLElement).map((child)=>handleElementRecursive.call(element, null, child));
      }
    }
    return element;
  }
  function handleElement(handler, element, ...props) {
    if(element && element instanceof HTMLElement && window.handleElement) {
      element = window.handleElement.apply(this, arguments) || element;
    }
    return element;
  }
})(window);