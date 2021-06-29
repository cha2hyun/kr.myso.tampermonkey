// ==UserScript==
// @name         네이버 블로그 동영상 다운로더
// @namespace    https://tampermonkey.myso.kr/
// @version      1.1.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-video.downloader.user.js
// @description  네이버 블로그 동영상 다운로드 기능을 활성화됩니다.
// @author       Won Choi
// @grant        GM_addStyle
// @match        *://blog.naver.com/PostView*
// @match        *://blog.naver.com/PostList*
// @match        *://serviceapi.nmv.naver.com/flash/convertIframeTag*
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/donation.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.js
// ==/UserScript==
async function inject_xhr() {
    const XHR = XMLHttpRequest.prototype, send = XHR.send, open = XHR.open;
    XHR.open = function(method, url) { this.url = url; return open.apply(this, arguments); }
    XHR.send = function() {
        this.addEventListener('load', () => {
            var detail_keys = ['url', 'readyState', 'response', 'responseText', 'responseType', 'responseURL', 'responseXML', 'status', 'statusText', 'timeout', 'withCredentials'];
            var detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), {});
            var event = new CustomEvent('xhrload', { detail });
            window.dispatchEvent(event);
        });
        //this.addEventListener('error', () => alert(`${this.status} 에러\n네이버에서 통신오류가 발생하였습니다 잠시 후 다시 시도해주세요.`));
        send.apply(this, arguments);
    };
};
async function main() {
    GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
    GM_addStyle("@import url('https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.css')");
    inject_xhr();
    window.addEventListener('xhrload', (e) => {
        const { url, response } = e.detail;
        if(url.includes('https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/')){
            const info = JSON.parse(response);
            const title = info.meta.subject;
            const video = info.videos.list.reduce((r, o)=>r.size < o.size ? o : r, { size: 0 });
            const toast = Toastify({
                duration: 1000 * 60,
                text: `${title}\n첨부 영상이 발견 됨 (새 창으로 열기)`,
                onClick: () => window.open(video.source),
            }).showToast();
        }
    }, false);
    if(typeof loadUGCPlayer !== 'undefined') loadUGCPlayer();
}
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.head) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);