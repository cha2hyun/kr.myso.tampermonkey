// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 연관 검색어 분석
// @description  네이버 검색결과에서 연관 검색어와 관련된 통계를 제공합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.4
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-relation.analysis.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @connect      ryo.co.kr
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/donation.js
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
    .lst_related_srch { max-height: none !important; }
    [data-monthly-qc-cnt] { position: relative; overflow: visible !important; }
    [data-monthly-qc-cnt]::after {
      display: block !important; position: absolute; top: 0; right: 8px; bottom: 0;
      font-size:12px; color:#0099e5; border-radius:0.2em; white-space: pre; line-height: 12px; text-align: right;
      content: attr(data-monthly-mobile-qc-cnt) ':모\\A' attr(data-monthly-pc-qc-cnt) ':데' !important;
    }
    [data-monthly-qc-cnt] .clip_left { display: block !important; left: 8px !important; }
    [data-monthly-qc-cnt] .clip_right { display: none !important; }
    .lst_related_srch [data-monthly-qc-cnt] { margin-bottom: 8px; }
    .lst_related_srch [data-monthly-qc-cnt]::after { position: relative; right: 0; }
    tag-toggle [data-monthly-qc-cnt] { margin-bottom: 8px; }
    tag-toggle [data-monthly-qc-cnt]::after { position: relative; }
    tag-toggle .eg-flick-viewport { height: 80px !important; }
    tag-toggle .eg-flick-panel [data-monthly-qc-cnt]::after { display: none !important; position: relative; right: 0; }
    tag-toggle .eg-flick-panel:hover [data-monthly-qc-cnt]::after { display: block !important;  }
    `);
    function parsed_number(number) { return /^[\d\.]+$/.test(String(number)) ? parseFloat(number) : 0; }
    async function get_keyword_count(keyword, errors = 0) {
        try {
            const uri = new URL('http://www.ryo.co.kr/naver/keyword?position=main&callback=update_keyword_analysis&dn=&keyword='); uri.searchParams.set('keyword', keyword.replace(/[\s]+/g, ''));
            const res = await GM_xmlhttpRequestAsync(uri.toString());
            function update_keyword_analysis(data){
                const resp = {}; if(!data) return;
                resp.monthlyPcQcCnt = parsed_number(data && data.monthlyPcQcCnt);
                resp.monthlyMobileQcCnt = parsed_number(data && data.monthlyMobileQcCnt);
                resp.monthlyQcCnt = resp.monthlyPcQcCnt + resp.monthlyMobileQcCnt;
                return resp;
            }
            return eval(res.responseText);
        } catch(e) {
            console.error(e);
            if(errors < 1) return Promise.delay(500).then(()=>get_keyword_count(keyword, errors + 1));
        }
    }
    async function rel_keyword(selector1, selector2) {
        const wrp = document.querySelector(selector1); if(!wrp) return;
        const rel = document.querySelector(selector2); if(!rel) return;
        wrp.prepend(rel); rel.classList.add('open');
        const kwd = [];
        if(!kwd.length) kwd.push(...document.querySelectorAll('.lst_related_srch a > .tit'));
        if(!kwd.length) kwd.push(...document.querySelectorAll('.keyword .clip_wrap'));
        if(!kwd.length) kwd.push(...document.querySelectorAll('.keyword > a'));
        await Promise.mapSeries(kwd, async (el) => Object.assign(el.dataset, await get_keyword_count(el.innerText)));
    }
    async function rel_keyword2() {
        const keyword = (new URL(location.href)).searchParams.get('query'); if(!keyword) return;
        const kwd = Array.from(document.querySelectorAll('tag-toggle a > .txt')).slice(1);
        await Promise.mapSeries(kwd, async (el) => Object.assign(el.dataset, await get_keyword_count(el.innerText)));
    }
    await rel_keyword('#main_pack', '#nx_footer_related_keywords');
    await rel_keyword('#sub_pack', '#nx_right_related_keywords');
    await rel_keyword('#snb', '#_related_keywords, #_related_keywords_aside');
    await rel_keyword2();
})