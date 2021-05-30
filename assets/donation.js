(function(window) {
    let time_dif = (1000*60*60*24*3), time_now = Date.now(), time_ref = time_now - time_dif;
    let key = {};
    window.GM_addStyle = window.GM_addStyle || (function(){});
    window.GM_xmlhttpRequest = window.GM_xmlhttpRequest || (function(){});
    window.GM_addStyle(`@import url('https://tampermonkey.myso.kr/assets/donation.css?z=${Date.now()}')`);
    window.GM_donation = function(container) {
        container = (container instanceof Element) ? container : document.querySelector(container);
        if(container) {
            container.classList.add('donation-myso');
            // fullscreen
            key.fullscreen_timestamp = 'donation-myso-fullscreen-timestamp';
            let fullscreen_timestamp = parseInt(localStorage.getItem(key.fullscreen_timestamp) || 0);
            let fullscreen = fullscreen_timestamp < time_ref;
            container.classList.toggle('donation-myso-fullscreen', fullscreen);
            // events
            container.addEventListener('click', (e) => {
                if(e.target != container) return;
                let rect = container.getBoundingClientRect();
                let size = container.classList.contains('donation-myso-fullscreen') ? rect.height : 50, over = e.clientY < rect.top + size;
                if(over) window.open('https://in.naverpp.com/donation', '__blog_myso_kr__');
                // fullscreen
                container.classList.toggle('donation-myso-fullscreen', 0);
                localStorage.setItem(key.fullscreen_timestamp, Date.now());
            });
            // adframe
            let iframe = document.querySelector('.donation-myso-frame') || document.createElement('iframe');
            iframe.classList.add('donation-myso-frame');
            iframe.setAttribute('src', 'https://in.naverpp.com/ad/randomize?display');
            container.prepend(iframe);
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
    }
})(window);