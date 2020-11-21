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