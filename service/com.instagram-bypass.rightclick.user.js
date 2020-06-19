// ==UserScript==
// @name         인스타그램 이미지 우클릭 제한 해제
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.4
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.instagram-bypass.rightclick.user.js
// @description  인스타그램에서 이미지의 우클릭 기능이 활성화됩니다.
// @author       Won Choi
// @match        *://instagram.com
// @match        *://instagram.com/*
// @match        *://www.instagram.com
// @match        *://www.instagram.com/*
// @grant        GM_addStyle
// @require      https://tampermonkey.myso.kr/assets/donation.js
// ==/UserScript==
async function main() {
    GM_donation('#react-root section', 1);
    GM_addStyle(`
      ._9AhH0 { display: none; }
      .PyenC, .fXIG0 { margin: auto; left: 0; right: 0; top: 0; bottom: 0; width: 135px; height: 135px; }
   `);
}
function checkForDOM() { return (document.head) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
