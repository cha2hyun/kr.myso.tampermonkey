// ---------------------
((window) => {
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
    window.__queueTimer = setTimeout(() => {
      window.__queueTimer = clearTimeout(window.__queueTimer);
      let now = Date.now();
      let queue = window.__queues.shift();
      let timeout = queue ? (queue.timeout || window.__queueDelay) : window.__queueDelay;
      if(queue && queue.handler) { queue.handler.apply(this); }
      let dif = Date.now() - now;
      let handle = setTimeout(() => {
          handle = clearTimeout(handle);
          window.runTimeoutQueue();
      }, Math.max(window.__queueDelay, timeout - dif));
    });
  }
  window.runTimeoutQueue();
})(window);
// ---------------------
((window) => {
  window.inject_js = function inject_js(script) {
    const container = (document.head || document.body || document.documentElement);
    const element = document.createElement('script');
    element.setAttribute('type', 'text/javascript');
    element.textContent = `(${script})()`;
    container.append(element);
    element.onload = () => container.removeChild(element);
    setTimeout(()=>container.removeChild(element), 300);
  }
})(window);
// ---------------------
((window) => {
  const delay = 300;
  const main = { timer: null };
  history.pushState = ( f => function pushState(){
    var ret = f.apply(this, arguments);
    main.timer = clearTimeout(main.timer);
    main.timer = setTimeout(() => {
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));  
    }, delay);
    return ret;
  })(history.pushState);
  history.replaceState = ( f => function replaceState(){
    var ret = f.apply(this, arguments);
    main.timer = clearTimeout(main.timer);
    main.timer = setTimeout(() => {
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
    }, delay);
    return ret;
  })(history.replaceState);
  window.addEventListener('popstate',()=>{
    main.timer = clearTimeout(main.timer);
    main.timer = setTimeout(() => {
      window.dispatchEvent(new Event('locationchange'));
    }, delay);
  });
  window.addEventListener('load',()=>{
    if(!window.__loaded__) {
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(() => {
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
    }
    window.__loaded__ = true;
  });
  window.addEventListener('DOMContentLoaded',()=>{
    if(!window.__loaded__) {
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(() => {
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
    }
    window.__loaded__ = true;
  });
  setTimeout(() => {
    if(!window.__loaded__) {
      main.timer = clearTimeout(main.timer);
      main.timer = setTimeout(() => {
        window.dispatchEvent(new Event('locationchange'));
      }, delay);
    }
    window.__loaded__ = true;
  }, 1000);
})(window);