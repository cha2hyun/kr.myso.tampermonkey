// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 인플루언서 모바일 메인 노출 모니터링
// @description  네이버 모바일 메인에서 유입될 수 있는 내 인플루언서의 글들의 노출된 현황을 모니터링 할 수 있습니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.in-center.mainview.analysis.user.js
// @author       Won Choi
// @connect      naver.com
// @match        *://influencercenter.naver.com/my
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://openuserjs.org/src/libs/myso/GM_App.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_addStyle.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_addScript.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_xmlhttpRequestAsync.min.js
// @require      https://openuserjs.org/src/libs/myso/GM_xmlhttpRequestCORS.min.js
// @require      https://openuserjs.org/src/libs/myso/donation.min.js
// @require      https://openuserjs.org/src/libs/myso/com.naver.www.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    console.log('main');
    GM_donation('[class^="My__content___"], [class^="My__content_p___"]', 0);
    GM_addStyle("@import url('https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.css')");
    GM_addStyle(`
    [class^="MyProfile__aside_p___"] { padding-top: 180px; }
    [class^="My__main_p___"] { padding-top: 0; }
    `);
    const dom = document.querySelector('[class^="MyProfile__link_t___"], [class^="MyProfile__link_p___"], [class^="MyProfile__link___"]'); if(!dom) return Promise.delay(1000).then(main);
    const uri = new URL(dom.href), urlId = _.last(uri.pathname.split('/')); if(!urlId) return;
    (async function repeat() {
        Toastify({ text: `메인노출 데이터 가져오는 중...`, }).showToast();
        const items = await NM_searchAll();
        const finds = items.filter(o=>o.url.includes('in.naver.com') && o.url.includes(`/${urlId}/`));
        if(finds.length) {
            finds.map((item)=>Toastify({ text: `[메인노출:${item.label}] ${item.url}`, duration: 15000, onClick: ()=>window.open(item.url) }).showToast());
        } else {
            Toastify({ text: `메인노출 데이터 없음`, }).showToast();
        }
        Toastify({ text: `5분 뒤 메인노출 데이터를 새로 가져옵니다...`, }).showToast();
        setTimeout(repeat, 1000 * 60 * 5);
    })();
});