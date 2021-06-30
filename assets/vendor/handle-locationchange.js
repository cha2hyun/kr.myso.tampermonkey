// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          locationChangeEvent
// @description   locationChangeEvent 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.8

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
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