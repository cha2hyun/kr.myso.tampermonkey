// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 블로그&포스트 글자수 세기
// @description  네이버 검색결과에서 블로그&포스트 글자수 세기를 활성화합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.16
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-text.counter.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://openuserjs.org/src/libs/myso/GM_App.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_addStyle.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_addScript.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_xmlhttpRequestAsync.min.js
// @require      https://openuserjs.org/src/libs/myso/donation.min.js
// @require      https://openuserjs.org/src/libs/myso/com.naver.search.nx.min.js
// @require      https://openuserjs.org/src/libs/myso/com.naver.smart-editor.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    GM_donation('#container', 0);
    GM_addStyle(`
    [data-content-length][data-content-length-trim][data-keyword-counts]::before {
      display: block; margin: 15px 15px 0px; padding: 0.5rem 1rem; font-size: 12px; color: #000; white-space: pre-wrap;
      background-color: #efefef; border-radius: 8px;
      content: '글자수 : ' attr(data-content-length) '자 (공백제외: ' attr(data-content-length-trim) '자)\\A' attr(data-keyword-counts);
    }
    `);
    // keyword NX
    const uri = new URL(location.href), query = uri.searchParams.get('query'); if(!query) return;
    const nx_terms = await NX_terms(query);

    async function parse(target) {
        if(!target || !target.querySelector) return;
        const anchor = target.querySelector('a.total_tit[href*="blog.naver.com"], a.total_tit[href*="post.naver.com"]'); if(!anchor) return;
        const uri = new URL(anchor.href); if(uri.hostname.includes('blog.naver.com')) { uri.hostname = 'm.blog.naver.com'; }
        const res = await GM_xmlhttpRequestAsync(uri.toString());
        const obj = SE_parse(new DOMParser().parseFromString(res.responseText, 'text/html'));
        const map = _.flattenDeep(nx_terms).map((keyword) =>({ keyword, count: obj.contentTrim.toLowerCase().split(keyword.toLowerCase()).length - 1 }));
        const keywordCounts = _.orderBy(map, 'count', 'desc').map((info)=>`${info.keyword}: ${info.count}회`).join(', ');
        Object.assign(target.dataset, { keywordCounts: keywordCounts }, _.pick(obj, 'contentLength', 'contentLengthTrim'));
    }
    async function observe(target) {
        const observer = new MutationObserver(function(mutations) {
            mutations.map(function(mutation) {
                const { type, addedNodes } = mutation;
                if(type == 'childList' && addedNodes.length) {
                    Promise.map(addedNodes, parse);
                }
            });
        });
        const config = { attributes: true, childList: true, characterData: true };
        observer.observe(target, config);
    }
    // observe
    const views = document.querySelector('ul.lst_total'); observe(views);
    const links = document.querySelectorAll('ul.lst_total > li');
    Promise.map(links, parse);
});