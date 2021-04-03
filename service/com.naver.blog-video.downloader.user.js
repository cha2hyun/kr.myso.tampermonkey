// ==UserScript==
// @name         네이버 블로그 동영상 다운로더
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-video.downloader.user.js
// @description  네이버 블로그 동영상 다운로드 기능을 활성화됩니다.
// @author       Won Choi
// @match        *://serviceapi.nmv.naver.com/flash/convertIframeTag.nhn?*
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
        this.addEventListener('error', () => alert(`${this.status} 에러\n네이버에서 통신오류가 발생하였습니다 잠시 후 다시 시도해주세요.`));
        send.apply(this, arguments);
    };
};
async function main() {
    inject_xhr();
    window.addEventListener('xhrload', (e) => {
        const { url, response } = e.detail;
        if(url.includes('https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/')){
            const info = JSON.parse(response);
            const title = info.meta.subject;
            const video = info.videos.list.reduce((r, o)=>r.size < o.size ? o : r, { size: 0 });
            location.href = video.source;
        }
    }, false);
    loadUGCPlayer();
}
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.head) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);