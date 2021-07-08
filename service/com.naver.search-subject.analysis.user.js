// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 검색어 주제 적합성 분석
// @description  네이버 검색결과에서 제목 또는 문장을 검색하면, 세부 키워드를 추출하여 주제 적합도를 검사해줍니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-subject.analysis.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/lib/naver-search-rx.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(){Array.prototype.flat||Object.defineProperty(Array.prototype,"flat",{configurable:!0,value:function r(){var t=isNaN(arguments[0])?1:Number(arguments[0]);return t?Array.prototype.reduce.call(this,function(a,e){return Array.isArray(e)?a.push.apply(a,r.call(e,t-1)):a.push(e),a},[]):Array.prototype.slice.call(this)},writable:!0}),Array.prototype.flatMap||Object.defineProperty(Array.prototype,"flatMap",{configurable:!0,value:function(r){return Array.prototype.map.apply(this,arguments).flat()},writable:!0})})();
// ---------------------
(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window){
    function flatten(object, path = null, separator = '.') {
        return Object.keys(object).reduce((acc, key) => {
            const value = object[key];
            const newPath = Array.isArray(object) ? `${path ? path : ''}[${key}]` : [path, key].filter(Boolean).join(separator);
            const isObject = [typeof value === 'object', value !== null, !(value instanceof Date), !(value instanceof RegExp), !(Array.isArray(value) && value.length === 0),].every(Boolean);
            return isObject ? { ...acc, ...flatten(value, newPath, separator) } : { ...acc, [newPath]: value };
        }, {});
    }
    function map_categories(nlu_category = '') {
        const categories = [];
        categories.push({ name: '문학·책', id: 5 });
        categories.push({ name: '영화', id: 6 });
        categories.push({ name: '미술·디자인', id: 8 });
        categories.push({ name: '공연·전시', id: 7 });
        categories.push({ name: '음악', id: 11 });
        categories.push({ name: '드라마', id: 9 });
        categories.push({ name: '스타·연예인', id: 12 });
        categories.push({ name: '만화·애니', id: 13 });
        categories.push({ name: '방송', id: 10 });
        categories.push({ name: '일상·생각', id: 14 });
        categories.push({ name: '육아·결혼', id: 15 });
        categories.push({ name: '애완·반려동물', id: 16 });
        categories.push({ name: '좋은글·이미지', id: 17 });
        categories.push({ name: '패션·미용', id: 18 });
        categories.push({ name: '인테리어·DIY', id: 19 });
        categories.push({ name: '요리·레시피', id: 20 });
        categories.push({ name: '상품리뷰', id: 21 });
        categories.push({ name: '원예·재배', id: 36 });
        categories.push({ name: '게임', id: 22 });
        categories.push({ name: '스포츠', id: 23 });
        categories.push({ name: '사진', id: 24 });
        categories.push({ name: '자동차', id: 25 });
        categories.push({ name: '취미', id: 26 });
        categories.push({ name: '국내여행', id: 27 });
        categories.push({ name: '세계여행', id: 28 });
        categories.push({ name: '맛집', id: 29 });
        categories.push({ name: 'IT·컴퓨터', id: 30 });
        categories.push({ name: '사회·정치', id: 31 });
        categories.push({ name: '건강·의학', id: 32 });
        categories.push({ name: '비즈니스·경제', id: 33 });
        categories.push({ name: '어학·외국어', id: 35 });
        categories.push({ name: '교육·학문', id: 34 });
        return (nlu_category || '').split(' ').map((id) => categories.find((o)=>o.id == id)).filter(v=>!!v).map(o=>o.name);
    }
    async function NR_Request(keyword, where = 'm_view') {
        const ref = new URL('https://search.naver.com/search.naver?ie=UTF-8&query=&sm=chr_hty');
        const uri = new URL('https://m.search.naver.com/search.naver?where=m_view&sm=mtb_jum&query=');
        if(location.hostname.includes('search.naver.com')) uri.search = location.search;
        uri.searchParams.set('where', where);
        uri.searchParams.set('query', keyword);
        uri.searchParams.set('mode', 'normal');
        ref.searchParams.set('query', keyword);
        return GM_xmlhttpRequestAsync(uri, { headers: { 'referer': ref.toString() } });
    }
    window.NR_info = async function NR_info(keyword, where) {
        const res = await NR_Request(keyword, where);
        alert(res.responseText);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
        const api = doc.querySelector('.review_loading[data-api], [data-loading-class="u_pg_new_loading"][data-api]'); if(!api) return {};
        const url = api && api.dataset.api, uri = new URL(url);
        const prm = Object.fromEntries(uri.searchParams.entries());
        const map = Object.keys(prm).reduce((map, key) => (map[key] = ((v)=>{ try { return JSON.parse(v) } catch(e){ return v; } })(prm[key]), map), {});
        const obj = Object.assign({}, flatten(map, null, '$'), map);
        if(obj && obj.nlu_query && obj.nlu_query.r_category) {
            obj.nlu_query.r_category = map_categories(obj.nlu_query.r_category).join(', ') || '(알 수 없음)';
            obj['nlu_query$r_category'] = obj.nlu_query.r_category;
        }
        return obj;
    }
    window.NR_terms = async function NR_terms(keyword)  {
        const m_view = await NR_info(keyword, 'm_view');
        const m_blog = await NR_info(keyword, 'm_blog');
        alert(JSON.stringify({ m_view, m_blog }));
        return Object.assign({ query: m_view.query || m_blog.query }, m_view.nqx_theme, m_blog.nlu_query);
    }
    window.NR_termsAll = async function NR_termsParagraph(...keywords) {
        const uniqs = keywords.filter((word, index, keywords)=>keywords.indexOf(word) == index);
        alert(JSON.stringify(uniqs));
        const terms = []; while(uniqs.length) { terms.push((await Promise.all(uniqs.splice(0, 5).map(NR_terms))).flat()); }
        alert(JSON.stringify(terms));
        return terms.flat();
    }
})(window);


GM_App(async function main() {
    GM_donation('#container', 0);
    function format_number(number) { return number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ); }
    const keyword = (new URL(location.href)).searchParams.get('query'); if(!keyword) return;
    const pack = document.querySelector('#main_pack, #snb');
    const wrap = pack.querySelector('.section.subject-analysis') || document.createElement('section'); wrap.classList.add('section', 'subject-analysis'); wrap.setAttribute('style', 'margin-top: 9px'); pack.prepend(wrap);
    const canv = wrap.querySelector('.section-item') || document.createElement('div'); canv.setAttribute('style', 'padding:1em; background:#fff; border-radius:6px; border: 1px solid #eee; font-size: 12px;'); wrap.append(canv);
    canv.innerHTML = '검색어 주제 적합성 분석 중...';
    const term = await NX_termsParagraph(keyword);
    const role = await NR_termsAll(...term);
    const kg_w = role.reduce((r, o)=>(r.push(...o.r_category ? o.r_category.split(',').map(c=>({ query: o.query, category: c.trim() })) : []), r), []);
    const kg_c = role.reduce((r, o)=>(o.theme && o.theme.main && r.push({ query: o.query, theme: o.theme.main.name }), o.theme && o.theme.sub && r.push(...o.theme.sub.map(t=>({ query: o.query, theme: t.name }))), r), []);
    const ka_w = _.orderBy(_.map(_.groupBy(kg_w, 'category'), (a, k)=>({ category: k, items: a, count: a.length, score: ((a.length / role.length) * 100).toFixed(2) })), ['count', 'category'], ['desc', 'asc']);
    const ka_c = _.orderBy(_.map(_.groupBy(kg_c, 'theme'), (a, k)=>({ theme: k, items: a, count: a.length, score: ((a.length / role.length) * 100).toFixed(2) })), ['count', 'theme'], ['desc', 'asc']);
    const data = { role, ka_w, ka_c }
    const tmpl = Handlebars.compile(`
    <div style="display: flex; flex-direction: row">
        <div style="flex-grow: 1; padding: 1rem; border-right: 1px solid #eee;">
        <h4 style="text-align: center; padding-bottom:6px;">검색어 생산 주제 적합성</h4>
        <table style="font-size:12px; width: 100%;">
            <thead>
            <tr>
                <th style="text-align: left;">주제</th>
                <th style="text-align: right;">적합도</th>
            </tr>
            </thead>
            <tbody>
            {{#each ka_w}}
            <tr>
                <td style="text-align: left;">{{category}}</td>
                <td style="text-align: right;">{{score}}%</td>
            </tr>
            {{/each}}
            </tbody>
        </table>
        </div>
        <div style="flex-grow: 1; padding: 1rem;">
        <h4 style="text-align: center; padding-bottom:6px;">검색어 소비 주제 적합성</h4>
        <table style="font-size:12px; width: 100%;">
            <thead>
            <tr>
                <th style="text-align: left;">주제</th>
                <th style="text-align: right;">적합도</th>
            </tr>
            </thead>
            <tbody>
            {{#each ka_c}}
            <tr>
                <td style="text-align: left;">{{theme}}</td>
                <td style="text-align: right;">{{score}}%</td>
            </tr>
            {{/each}}
            </tbody>
        </table>
        </div>
    </div>
    `);
    canv.innerHTML = tmpl(data);
})