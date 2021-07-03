// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          GM_storage
// @description   GM_setValue, GM_getValue, GM_deleteValue 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.9

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(window) {
    window.GM_setValue = window.GM_setValue || ((k, v)=>(localStorage.setItem(k, v)));
    window.GM_getValue = window.GM_getValue || ((k, v)=>(localStorage.getItem(k) || v));
    window.GM_deleteValue = window.GM_deleteValue || ((k)=>(localStorage.removeItem(k)));
})(window);