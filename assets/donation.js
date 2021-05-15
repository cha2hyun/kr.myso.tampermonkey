(function(window) {
    window.GM_addStyle = window.GM_addStyle || (function(){});
    window.GM_addStyle(`@import url('https://tampermonkey.myso.kr/assets/donation.css?z=${Date.now()}')`);
    window.GM_donation = function(container) {
        container = (container instanceof Element) ? container : document.querySelector(container);
        if(container) {
            container.classList.add('donation-myso');
            container.classList.add('donation-sticky-t');
            container.addEventListener('click', (e) => {
                if(e.target != container) return;
                let rect = container.getBoundingClientRect();
                let hasT = e.clientY < rect.top + 50;
                if(hasT) window.open('https://in.naverpp.com/donation', '__blog_myso_kr__');
            });
            
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