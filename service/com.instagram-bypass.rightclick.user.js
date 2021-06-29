// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         인스타그램 이미지 우클릭 제한 해제
// @description  인스타그램에서 이미지의 우클릭 기능이 활성화됩니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.9
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.instagram-bypass.rightclick.user.js
// @author       Won Choi
// @grant        GM_addStyle
// @match        *://instagram.com
// @match        *://instagram.com/*
// @match        *://www.instagram.com
// @match        *://www.instagram.com/*
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
async function main() {
  GM_addStyle(`
    ._9AhH0 { display: none; }
    .PyenC, .fXIG0 { margin: auto; left: 0; right: 0; top: 0; bottom: 0; width: 135px; height: 135px; }
 `);
}
function _requestIdleCallback(callback) {
if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);