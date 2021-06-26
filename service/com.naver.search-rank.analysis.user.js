// ==UserScript==
// @name         네이버 검색결과 지수 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.7
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-rank.analysis.user.js
// @description  네이버 검색결과에서 상대평가 지수를 확인할 수 있습니다.
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
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://tampermonkey.myso.kr/assets/lib/naver-search-nx.js?v=5
// @require      https://tampermonkey.myso.kr/assets/lib/naver-search-rx.js?v=2
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window){
    async function NX_Request(keyword, start = 1, where = 'm_blog', mode = 'normal') {
        const endpoints = [];
        endpoints.push({ url: 'https://s.search.naver.com/p/review/search.naver', where: ['view', 'm_view'] });
        endpoints.push({ url: 'https://s.search.naver.com/p/blog/search.naver', where: ['blog', 'm_blog'] });
        const endpoint = endpoints.find(o=>o.where.includes(where)) || 'https://s.search.naver.com/p/blog/search.naver';
        const uri = new URL(endpoint.url);
        if(start) uri.searchParams.set('start', start);
        uri.searchParams.set('where', where);
        uri.searchParams.set('mode', mode);
        uri.searchParams.set('query', keyword);
        return GM_xmlhttpRequestAsync(uri);
    }
    window.NX_info = async function NX_info(keyword, start, where, mode) {
        const res = await NX_Request(keyword, start, where, mode);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
        const map = Array.from(doc.body.childNodes).filter(el=>el.nodeType == 8).map((nx) => Array.from(nx.nodeValue.matchAll(/^(?<k>[^\s\:]+)([\s\:]+)?(?<v>.*)$/igm)).map(o=>Object.assign({}, o.groups))).flat();
        const ret = map.reduce((r, { k, v }) => {
            if(typeof v === 'string' && v.includes(',')) v = v.split(',').map(r=>r.split(',').map(v=>decodeURIComponent(v).split(':').map(v=>decodeURIComponent(v))));
            if(typeof v === 'string' && v.includes('|')) v = v.split('|').map(r=>r.split(':').map(v=>decodeURIComponent(v)));
            if(typeof v === 'string' && v.includes(':')) v = v.split(':').map(v=>decodeURIComponent(v));
            if(typeof v === 'string') v = decodeURIComponent(v);
            return (r[k] = v, r);
        }, {});
        return ret;
    }
    window.NX_score = async function NX_score(keyword, start, where, mode) {
        const res = await NX_info(keyword, start, where, mode).catch(e=>null);
        const rnk = Object.keys(res || {}).filter(k=>/^r[\d]+$/.test(k)).map(k=>res[k]);
        return rnk.map((data)=>{
            let [[[crArea]], [[crGdid]], [[o1, a, b, c]]] = data;
            let crScoreA = parseFloat(a); if(crScoreA == 0 || crScoreA > 1600000000) crScoreA = '?';
            let crScoreB = parseFloat(b); if(crScoreB == 0 || crScoreB > 1600000000) crScoreB = '?';
            let crScoreC = parseFloat(c); if(crScoreC == 0 || crScoreC > 1600000000) crScoreC = '?';
            return { crGdid, crArea, crScoreA, crScoreB, crScoreC };
        });
    }
    window.NX_terms = async function NX_terms(keyword) {
        const res = await NX_info(keyword).catch(e=>null);
        if(!res || !res.terms) return [];
        if(typeof res.terms == 'string') return [res.terms];
        const terms = res.terms.map(item=>item && item.flat && item.flat()).flat();
        return terms.filter((word, offset, terms)=>terms.filter((item)=>item.includes(word)).length == 2);
    }
    window.NX_termsParagraph = async function NX_termsParagraph(paragraph) {
        const words = paragraph.split(/[\s]+/g);
        const chunk = words.reduce((chunk, word, offset)=>{ const index = Math.floor(offset / 5), item = chunk[index] = chunk[index] || []; item.push(word); return chunk }, []).map(item=>item.join(' '));
        return (await Promise.all(chunk.map(NX_terms))).flat();
    }
})(window);
// ---------------------
async function observe(target) {
    const uri = new URL(location.href), query = uri.searchParams.get('query'); if(!query) return;
    const observer = new MutationObserver(async function(mutations) {
        let start = (30 * (Math.ceil(Math.max(0, target.children.length) / 30) - 1)) + 1;
        await update(query, start);
    });
    const config = { attributes: true, childList: true, characterData: true };
    observer.observe(target, config);
    await update(query);
}
async function update(keyword, start = 1) {
    const uri = new URL(location.href);
    const mode = uri.searchParams.get('mode');
    const where = uri.searchParams.get('where');
    const items = Array.from(document.querySelectorAll('[data-cr-gdid][data-cr-rank]'));
    const scores = await NX_score(keyword, start, where, mode);
    await Promise.map(items, async (item) => {
        const title = item.querySelector('.total_tit');
        const score = scores.find((o)=>o.crGdid == item.dataset.crGdid); Object.assign(item.dataset, score);
        if(score) delete item.dataset.crTitleScore;
        if(!score && !item.dataset.crTitleScore && title) {
            item.dataset.crTitleScore = true;
            const scores = await NX_score(title.textContent, 1, where, mode);
            const score = scores.find((o)=>o.crGdid == item.dataset.crGdid); Object.assign(item.dataset, score);
        }
    });
}
GM_App(async function main() {
    GM_donation('#container', 0);
    GM_addStyle(`
    :not([data-cr-area="rvw*o"])[data-cr-rank]::after { display: block; margin: 0px 15px 15px; padding: 0.5rem 1rem; font-size: 14px; color: #000; font-weight: bold;  border-radius: 8px; }
    :not([data-cr-area="rvw*o"])[data-cr-rank][data-cr-score-a][data-cr-score-b][data-cr-score-c]::after { background-color: #52565e; color: #fff; content: '전문성: ' attr(data-cr-score-a) ' / 신뢰성: ' attr(data-cr-score-b) ' / 관련성: ' attr(data-cr-score-c) }
    :not([data-cr-area="rvw*o"])[data-cr-rank][data-cr-score-a][data-cr-score-b][data-cr-score-c][data-cr-title-score]::after { background-color: #f3f4f7; color: #000; content: '전문성: ' attr(data-cr-score-a) ' / 신뢰성: ' attr(data-cr-score-b) ' / 관련성: ' attr(data-cr-score-c) ' - 제목 기준' }
    :not([data-cr-area="rvw*o"])[data-cr-rank]:not([data-cr-score-a])::after { background-color: #e4002b; color: #fff; content: '오류 : 분석 결과를 알 수 없음.'; }
    `);
    const wrp = document.querySelector('ul.lst_total'); if(wrp) observe(wrp);
})