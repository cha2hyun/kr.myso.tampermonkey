// ==UserScript==
// @namespace     https://tampermonkey.myso.kr
// @exclude       *

// ==UserLibrary==
// @name          GM_addStyle
// @description   GM_addStyle 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
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