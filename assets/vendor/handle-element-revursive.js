// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          GM_elementRecursive
// @description   GM_elementRecursive 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
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