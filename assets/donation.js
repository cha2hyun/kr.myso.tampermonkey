(function(window) {
    window.GM_addStyle = window.GM_addStyle || (function(){});
    window.GM_addStyle(`@import url('https://tampermonkey.myso.kr/assets/donation.css?z=${Date.now()}')`);
    window.GM_donation = function(container, bottom) {
        container = (container instanceof Element) ? container : document.querySelector(container);
        if(container) {
            container.classList.add('donation-myso');
            container.classList.add(bottom ? 'donation-sticky-b' : 'donation-sticky-t');
            container.addEventListener('click', (e) => {
                if(e.target != container) return;
                const rect = container.getBoundingClientRect();
                const hasT = (!bottom && e.clientY < rect.top + 50);
                const hasB = ( bottom && e.clientY > rect.bottom - 50);
                if(hasT || hasB) window.open('https://blog.myso.kr/', '__blog_myso_kr__');
            });
        }
        // GA
        var header = document.querySelector('head');
        if(header) {
            var ga = document.querySelector('#donation-myso-ga') || document.createElement('script');
            ga.id = 'donation-myso-ga'; ga.async = 'async'; ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-QPY3HB7Y3Z';
            header.appendChild(ga);

            var js = document.querySelector('#donation-myso-js') || document.createElement('script');
            js.id = 'donation-myso-js';
            js.textContent = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-QPY3HB7Y3Z');";
            header.appendChild(js);            
        }
    }
})(window);