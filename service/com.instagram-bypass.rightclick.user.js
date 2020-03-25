// ==UserScript==
// @name         인스타그램 이미지 우클릭 제한 해제
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://tampermonkey.myso.kr/service/com.instagram-bypass.rightclick.user.js
// @description  인스타그램에서 이미지의 우클릭 기능이 활성화됩니다.
// @author       Won Choi
// @match        *://instagram.com
// @match        *://instagram.com/*
// @match        *://www.instagram.com
// @match        *://www.instagram.com/*
// @grant        none
// ==/UserScript==
async function main() {
    const style = document.createElement('style');
    style.innerHTML = 'article > div > div[role="button"] > div > div:nth-child(2) { display: none; }';
    document.head.prepend(style);
}
function checkForDOM() { return (document.head) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
