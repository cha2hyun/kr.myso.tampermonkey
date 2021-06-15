// ==UserScript==
// @name         네이버 블로그 모바일 메인 노출 모니터링
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-prologue.mainview.analysis.user.js
// @description  네이버 모바일 메인에서 유입될 수 있는 내 블로그의 글들의 노출된 현황을 모니터링 할 수 있습니다.
// @author       Won Choi
// @connect      naver.com
// @match        *://blog.naver.com/prologue/PrologueList*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-cors.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://tampermonkey.myso.kr/assets/lib/naver-blog.js
// @require      https://tampermonkey.myso.kr/assets/lib/naver-main.js?v=21061604
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.js
// ==/UserScript==
GM_App(async function main() {
    GM_donation('#post-area', 0);
    GM_addStyle("@import url('https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.css')");
    const uri = new URL(location.href), params = Object.fromEntries(uri.searchParams.entries());
    const blogId = params.blogId; if(!blogId) return;
    (async function repeat() {
        Toastify({ text: `메인노출 데이터 가져오는 중...`, }).showToast();
        const items = await NM_searchAll();
        const finds = items.filter(o=>o.url.includes('blog.naver.com') && o.url.includes(`/${blogId}/`));
        if(finds.length) {
            finds.map((item)=>Toastify({ text: `[메인노출:${item.label}] ${item.url}`, onClick: ()=>window.open(item.url) }).showToast());
        } else {
            Toastify({ text: `메인노출 데이터 없음`, }).showToast();
        }
        setTimeout(repeat, 1000 * 60 * 5);
    })();
});