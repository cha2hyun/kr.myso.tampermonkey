// ==UserScript==
// @name         네이버 인플루언서 모바일 메인 노출 모니터링
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.in-influencercenter.mainview.analysis.user.js
// @description  네이버 모바일 메인에서 유입될 수 있는 내 인플루언서의 글들의 노출된 현황을 모니터링 할 수 있습니다.
// @author       Won Choi
// @connect      naver.com
// @match        *://influencercenter.naver.com/my
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-cors.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://tampermonkey.myso.kr/assets/lib/naver-main.js?v=21061604
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.js
// ==/UserScript==
GM_App(async function main() {
    GM_donation('[class^="My__content___"]', 0);
    GM_addStyle("@import url('https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.css')");
    const dom = document.querySelector('[class^="MyProfile__link_t___"]'); if(!dom) return;
    const uri = new URL(dom.href), urlId = _.last(uri.pathname.split('/')); if(!urlId) return;
    (async function repeat() {
        Toastify({ text: `메인노출 데이터 가져오는 중...`, }).showToast();
        const items = await NM_searchAll(); console.log(items);
        const finds = items.filter(o=>o.url.includes('in.naver.com') && o.url.includes(`/${urlId}/`));
        if(finds.length) {
            finds.map((item)=>Toastify({ text: `[메인노출:${item.label}] ${item.url}`, onClick: ()=>window.open(item.url) }).showToast());
        } else {
            Toastify({ text: `메인노출 데이터 없음`, }).showToast();
        }
        Toastify({ text: `5분 뒤 메인노출 데이터를 새로 가져옵니다...`, }).showToast();
        setTimeout(repeat, 1000 * 60 * 5);
    })();
});