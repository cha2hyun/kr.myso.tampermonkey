// ==UserScript==
// @name         네이버 검색결과 블로그&포스트 글자수 세기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.10
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-text.counter.user.js
// @description  네이버 검색결과에서 블로그&포스트 글자수 세기를 활성화합니다.
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://tampermonkey.myso.kr/assets/lib/smart-editor-one.js?v=20
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
const nx = {};
async function nx_request_xhr(keyword) {
    let uri = new URL('https://s.search.naver.com/p/blog/search.naver?where=m_view&query=&main_q=&mode=normal&ac=1&aq=0&spq=0'); uri.search = location.search;
    uri.searchParams.set('where', 'm_blog');
    uri.searchParams.set('query', keyword);
    uri.searchParams.set('main_q', keyword);
    uri.searchParams.set('mode', 'normal');
    uri.searchParams.delete('api_type');
    uri.searchParams.delete('mobile_more');
    return GM_xmlhttpRequestAsync(uri.toString());
}
async function nx_request(keyword) {
    let res = await nx_request_xhr(keyword);
    let doc = new DOMParser().parseFromString(res.responseText, 'text/html')
    let map = Array.from(doc.body.childNodes).filter(el=>el.nodeType == 8).map((nx) => Array.from(nx.nodeValue.matchAll(/^(?<k>[^\s\:]+)([\s\:]+)?(?<v>.*)$/igm)).map(o=>Object.assign({}, o.groups))).flat();
    let ret = map.reduce((r, { k, v }) => {
        if(typeof v === 'string' && v.includes(',')) v = v.split(',').map(r=>r.split(',').map(v=>decodeURIComponent(v).split(':').map(v=>decodeURIComponent(v))));
        if(typeof v === 'string' && v.includes('|')) v = v.split('|').map(r=>r.split(':').map(v=>decodeURIComponent(v)));
        if(typeof v === 'string' && v.includes(':')) v = v.split(':').map(v=>decodeURIComponent(v));
        if(typeof v === 'string') v = decodeURIComponent(v);
        return (r[k] = v, r);
    }, {});
    return ret;
}
async function parse(target) {
    if(!target || !target.querySelector) return;
    const anchor = target.querySelector('a.total_tit[href*="blog.naver.com"], a.total_tit[href*="post.naver.com"]'); if(!anchor) return;
    const uri = new URL(anchor.href);
    if(uri.hostname.includes('blog.naver.com')) { uri.hostname = 'm.blog.naver.com'; }
    const res = await GM_xmlhttpRequestAsync(uri.toString());
    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
    const obj = SE_parse(doc);
    const map = _.flattenDeep(nx.terms).map((keyword) =>({ keyword, count: obj.contentTrim.toLowerCase().split(keyword.toLowerCase()).length - 1 }));
    const keywordCounts = _.orderBy(map, 'count', 'desc').map((info)=>`${info.keyword}: ${info.count}회`).join(', ');
    Object.assign(target.dataset, {
        keywordCounts: keywordCounts,
        contentLength: obj.contentLength,
        contentLengthTrim: obj.contentLengthTrim,
    });
}
async function observe(target) {
    const observer = new MutationObserver(function(mutations) {
        mutations.map(function(mutation) {
            const { type, addedNodes } = mutation;
            if(type == 'childList' && addedNodes.length) {
                Promise.mapSeries(addedNodes, parse);
            }
        });
    });
    const config = { attributes: true, childList: true, characterData: true };
    observer.observe(target, config);
}
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
    const keyword = (new URL(location.href)).searchParams.get('query');
    Object.assign(nx, keyword && await nx_request(keyword));
    // observe
    const views = document.querySelector('ul.lst_total'); observe(views);
    const links = document.querySelectorAll('ul.lst_total > li');
    Promise.mapSeries(links, parse);
});