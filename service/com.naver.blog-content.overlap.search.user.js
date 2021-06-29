// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 블로그 중복문서 검색
// @description  네이버 블로그에서 내 글의 중복문서/짜집기문서를 쉽게 찾기위한 기능을 추가합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.11
// @updateURL    https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/service/com.naver.blog-content.overlap.search.user.js
// @author       Won Choi
// @match        *://blog.naver.com/PostView*
// @match        *://blog.naver.com/PostList*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/assets/vendor/gm-app.min.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/assets/donation.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    const wrappers = Array.from(document.querySelectorAll('[data-post-editor-version]'));
    wrappers.map((wrapper) => {
        const container = wrapper.querySelector('.lyr_overflow_menu');
        const anchor = document.createElement('a'); anchor.href = '#';
        anchor.innerText = '중복문서 찾기';
        anchor.onclick = function(e) {
            e.preventDefault();
            if(confirm('해당 기능은 본문 내용 일부를 무작위로 추출하여 검색합니다. 계속하시겠습니까?')) {
                //const article = anchor.
                const arr = wrapper.querySelector('.se-main-container, [id^="post-view"]').innerText.replace(/[\n]+/g, ' ').split(' ');
                const idx = Math.floor(Math.random() * (arr.length - 10));
                const uri = new URL('https://search.naver.com/search.naver');
                uri.searchParams.set('sm', 'tab_opt');
                uri.searchParams.set('where', 'nexearch');
                uri.searchParams.set('query', arr.slice(idx, idx + 50).join(' '));
                window.open(uri, 'overlap_search');
            }
        }
        container.prepend(anchor);
    });
});