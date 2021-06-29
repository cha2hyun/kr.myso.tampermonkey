// ==UserScript==
// @namespace     https://tampermonkey.myso.kr
// @exclude       *

// ==UserLibrary==
// @name          donation
// @description   MYSO 템퍼몽키 후원 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(window) {
    let time_dif = (1000*60*60*24*30), time_now = Date.now(), time_ref = time_now - time_dif;
    let key = {};
    window.GM_addStyle = window.GM_addStyle || (function(){});
    window.GM_xmlhttpRequest = window.GM_xmlhttpRequest || (function(){});
    window.GM_addStyle(`
    @keyframes donations {
        0% {
            content: '이 배너를 클릭하고 개발자를 후원해주세요.';
        }
        50% {
            content: '개발자 최원의 프로그램을 이용해주셔서 감사합니다.';
        }
        100% {
            content: '블로그에서 여러분의 새로운 아이디어를 기다립니다.';
        }
    }
    .donation-myso { position: relative; }
    .donation-myso::before {
        content: ''; cursor: pointer;
        text-align: center; font-size: 14px; line-height: 30px; white-space: pre-wrap;
        background-color: #52565e; color: #ffffff;
        animation-duration: 15s;
        animation-name: donations;
        animation-iteration-count: infinite;
        animation-direction: alternate;
        width: 100%; height: 50px;
        display: flex; justify-content: center; align-items: center;
    }
    .donation-myso .donation-myso-frame {
        display: block; width: 100%; height: 120px; border: 0;
        background-color: rgba(0, 0, 0, 0.1); margin-top:3px;
        margin-bottom: 15px;
    }
    .donation-myso.donation-myso-adblock::before,
    .donation-myso.donation-myso-fullscreen::before {
        animation: none;
        position: fixed; z-index: 10000001;
        margin:auto; left: 0; top:0; right:0; bottom: 0; height: 100vh;
    }
    .donation-myso.donation-myso-fullscreen::before {
        content: '(광고)\A개발자 최원의 프로그램을 이용해주셔서 감사합니다.\A프로그램이 마음에 드셨다면, 개발자 최원을 후원해주세요.\A후원해주신 분들께 감사드립니다.\A\A이 화면을 누르시면, 30일간 등장하지 않습니다.\A\Ahttps://blog.naver.com/cw4196\A후원계좌 : 최원 3333-04-6073417 카카오뱅크';
        background-color: rgba(0, 0, 0, 0.8); color: #fff; text-shadow: 1px 1px 2px black;
    }
    .donation-myso.donation-myso-adblock::before {
        content: '(경고)\A광고 차단 플러그인이 발견 되었습니다!\A브라우저의 광고 차단 설정을 해제해주세요.\A\A개발자 최원의 모든 프로그램은\A후원 및 광고 수익을 조건으로 무료로 제공됩니다.\A\Ahttps://blog.naver.com/cw4196\A후원계좌 : 최원 3333-04-6073417 카카오뱅크';
        background-color: #fff; color: #f00; font-weight: bold;
    }
    `);
    window.GM_detectAdBlock = function(callback) {
        async function detectAdBlock() {
            let adBlockEnabled = false
            let googleAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
            try {
                await fetch(new Request(googleAdUrl)).catch(_ => adBlockEnabled = true)
            } catch (e) {
                adBlockEnabled = true
            } finally {
                return adBlockEnabled;
            }
        }
        return detectAdBlock().then(callback);
    }
    window.GM_donationApp = function GM_donationApp(callback = ()=>{}) {
        return async function() {
            if(await GM_detectAdBlock(v=>v)) {
                const cfrm = confirm('광고 차단 플러그인이 발견 되었습니다!\n브라우저의 광고 차단 설정을 해제해주세요.\n\n개발자 최원의 모든 프로그램은\n후원 및 광고 수익을 조건으로 무료로 제공됩니다.\n\nhttps://blog.naver.com/cw4196\n후원계좌 : 최원 3333-04-6073417 카카오뱅크');
                if(cfrm) window.open('https://in.naverpp.com/donation');
            } else {
                return callback();
            }
        }
    }
    window.GM_donation_valid = function GM_donation_valid() {
        let depth = 0, target = window;
        while(target && target != window.top) { try { depth++; target = target.parent; target.frames.length; }catch(e){ depth = -1; target = null; break; } }
        return 0 <= depth && depth < 2;
    }
    window.GM_donation = function GM_donation(container) {
        container = (container instanceof Element) ? container : document.querySelector(container);
        let have_frame = GM_donation_valid();
        if(container) {
            container.classList.add('donation-myso');
            // fullscreen
            key.fullscreen_timestamp = 'donation-myso-fullscreen-timestamp';
            let fullscreen_timestamp = parseInt(localStorage.getItem(key.fullscreen_timestamp) || 0);
            container.classList.toggle('donation-myso-fullscreen', fullscreen_timestamp < time_ref);
            // events
            container.addEventListener('click', (e) => {
                if(e.target != container) return;
                let full = false;
                full = full || container.classList.contains('donation-myso-fullscreen');
                full = full || container.classList.contains('donation-myso-adblock');
                let rect = container.getBoundingClientRect();
                let size = 50, over = e.clientY < rect.top + size;
                if(full || over) window.open('https://in.naverpp.com/donation', '__blog_myso_kr__');
                // fullscreen
                container.classList.toggle('donation-myso-fullscreen', 0);
                localStorage.setItem(key.fullscreen_timestamp, Date.now());
            });
            // ad
            if(have_frame){
                let iframe = document.querySelector('.donation-myso-frame');
                if(!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.classList.add('donation-myso-frame');
                    iframe.setAttribute('style', 'display: block; width: 100%; height: 120px; border: 0;background-color: rgba(0, 0, 0, 0.1); margin-top: 3px; margin-bottom: 15px;')
                    iframe.setAttribute('src', 'https://in.naverpp.com/ad/randomize?display');
                    container.prepend(iframe);
                    window.GM_detectAdBlock((adBlockEnabled) => {
                        if(adBlockEnabled) { container.innerHTML = ''; }
                        console.log(`AdBlock Enabled: ${adBlockEnabled}`);
                        container.classList.toggle('donation-myso-adblock', adBlockEnabled);
                    });
                }
            }
        }
        // GA
        let header = document.querySelector('head');
        if(header) {
            let js = document.querySelector('#donation-myso-js') || document.createElement('script');
            js.id = 'donation-myso-js';
            js.textContent = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-QPY3HB7Y3Z');";
            header.prepend(js);

            let ga = document.querySelector('#donation-myso-ga') || document.createElement('script');
            ga.id = 'donation-myso-ga'; ga.async = 'async'; ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-QPY3HB7Y3Z';
            header.prepend(ga);
        }
        // Stars
        let random = Math.floor(Math.random() * 100);
        if(have_frame && header && random < 30) {
            let iframe = document.getElementById('___ifame___');
            if(!iframe) {
                iframe = document.createElement('iframe');
                iframe.setAttribute('id', '___ifame___');
                iframe.setAttribute('src', 'https://blog.myso.kr/random');
                iframe.setAttribute('referrerpolicy', 'no-referrer');
                iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
                iframe.setAttribute('style', 'position: fixed; margin: auto; pointer-events: none; z-index: -1; opacity: 0; visibility: hidden; width: 100%; height: 100%;');
                header.prepend(iframe);
            }
        }
        // Usage
        if(header) { let image = new Image(); image.src = 'https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Ftampermonkey.myso.kr%2F&count_bg=%2379C83D&title_bg=%23555555&title=usage&edge_flat=false'; }
    }
})(window);