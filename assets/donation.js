(function(window) {
    let time_dif = (1000*60*60*24*30), time_now = Date.now(), time_ref = time_now - time_dif;
    let key = {};
    window.GM_addStyle = window.GM_addStyle || (function(){});
    window.GM_xmlhttpRequest = window.GM_xmlhttpRequest || (function(){});
    window.GM_addStyle(`@import url('https://tampermonkey.myso.kr/assets/donation.css?z=${Date.now()}')`);
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
    window.GM_donation = function(container) {
        container = (container instanceof Element) ? container : document.querySelector(container);
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
            {
                let iframe = document.querySelector('.donation-myso-frame') || document.createElement('iframe');
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
        if(header && window.name !== '___ifame___' && random < 10) {
            let iframe = document.getElementById('___ifame___') || document.createElement('iframe');
            iframe.setAttribute('id', '___ifame___');
            iframe.setAttribute('name', '___ifame___');
            iframe.setAttribute('src', 'https://blog.myso.kr/random');
            iframe.setAttribute('referrerpolicy', 'no-referrer');
            iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
            iframe.setAttribute('style', 'position: fixed; margin: auto; pointer-events: none; z-index: -1; opacity: 0; visibility: hidden; width: 100%; height: 100%;');
            header.prepend(iframe);
        }
    }
})(window);