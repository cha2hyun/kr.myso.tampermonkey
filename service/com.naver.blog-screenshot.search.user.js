// ==UserScript==
// @name         네이버 블로그 검색결과 캡쳐도구
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-screenshot.search.user.js
// @description  네이버 블로그에서 발행한 포스팅의 검색결과를 손쉽게 캡쳐하는 도구입니다.
// @author       Won Choi
// @match        https://blog.naver.com/PostView.nhn?*
// @match        https://search.naver.com/search.naver?*
// @match        https://m.search.naver.com/search.naver?*
// @grant        GM_openInTab
// @grant        GM_download
// @grant        GM_addStyle
// ==/UserScript==
async function inject_js(opt) {
    return new Promise((resolve, reject) => {
        var el = document.createElement('script'); el.type = 'text/javascript';
        function resolved() {
            el.parentNode.removeChild(el); resolve();
        }
        if(typeof opt === 'string') {
            el.onload = resolved; el.src = opt;
        }
        if(typeof opt === 'object') {
            el.onload = resolved; el.src = opt.src; el.integrity = opt.integrity;
            el.setAttribute('crossorigin', 'anonymous');
        }
        if(typeof opt === 'function') el.innerHTML = `(${opt})();`;
        if(el.src || el.innerHTML) {
            el.onerror = reject;
            document.head.prepend(el);
        }else reject();
        if(typeof opt === 'function') resolved();
    });
}
async function main() {
    if(location.hostname.endsWith('search.naver.com')) {
        if(window.name !== 'nblog_screenshot') return;
        document.title = '스크린샷 촬영 중입니다. 종료하지 말아주세요.';
        const uri = new URL(location.href), highlight = uri.searchParams.get('highlight'), query = uri.searchParams.get('query');
        const matches = /^\/([a-z0-9\-\_\.]+)\/([\d]+)/.exec(highlight);
        GM_addStyle(`
            a[href*="${highlight}"],
            a[href*="logNo=${matches[2]}"] {
                display:block; position: relative;
            }
            a[href*="${highlight}"]:after,
            a[href*="logNo=${matches[2]}"]:after {
                content:''; position: absolute; z-index: 1; background: rgba(255, 0, 0, 0.3); border: 3px solid red; margin: auto; left: 0; top: 0; right: 0; bottom: 0;
            }
        `);
        async function screenshot() {
            screenshot.timer = clearTimeout(screenshot.timer);
            screenshot.timer = setTimeout(async () => {
                if(!document.querySelector('#naver-splugin-wrap, #wrap')) return screenshot();
                await inject_js({ src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.4.1/html2canvas.min.js', integrity: 'sha256-c3RzsUWg+y2XljunEQS0LqWdQ04X1D3j22fd/8JCAKw=' });
                await inject_js(async function () {
                    async function screenshot() { return new Promise((resolve)=>html2canvas(document.body, { allowTaint: false, onrendered: resolve })); }
                    const canvas = await screenshot(), dataURL = canvas.toDataURL("image/png");
                    postMessage({ action:'screenshot.dataURL', dataURL });
                });
            }, 1000);
        }
        window.addEventListener('message', (e)=>{
            const { action, dataURL } = e.data;
            if(action === 'screenshot.dataURL') {
                GM_download(dataURL, `screenshot_${query}_${Date.now()}_${location.hostname}.png`);
                window.close();
            }
        });
        screenshot();
    } else {
        async function screenshot(url) {
            return new Promise((resolve)=>{
                const win = window.open(url, 'nblog_screenshot', 'width=640, height=1');
                (function delay() {
                    screenshot.timer = clearTimeout(screenshot);
                    screenshot.timer = setTimeout(() => {
                        if(!win.closed) return delay();
                        resolve();
                    }, 100);
                })();
            });
        }
        const container = document.querySelector('.blog2_post_function');
        const anchor = document.createElement('a'); anchor.href = '#';
        anchor.className = 'url pcol2 _returnFalse _transPosition _se3screenshotbtn';
        anchor.style.cursor = 'pointer';
        anchor.style.marginRight = '11px';
        anchor.innerText = '상위노출 캡처';
        anchor.onclick = async function(e) {
            e.preventDefault();
            const query = prompt('검색 할 키워드를 입력하세요.'); if(!query) return;
            const uri_m = new URL('https://m.search.naver.com/search.naver?ie=UTF-8&sm=chr_hty');
            const uri_d = new URL('https://search.naver.com/search.naver?ie=UTF-8&sm=chr_hty');
            uri_m.searchParams.set('query', query); uri_m.searchParams.set('highlight', window.top.location.pathname);
            uri_d.searchParams.set('query', query); uri_d.searchParams.set('highlight', window.top.location.pathname);
            await screenshot(uri_m.toString());
            await screenshot(uri_d.toString());
        }
        container.prepend(anchor);
    }
}
function checkForDOM() { return (document.head) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
