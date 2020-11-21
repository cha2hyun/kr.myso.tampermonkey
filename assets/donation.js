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
    }
})(window);