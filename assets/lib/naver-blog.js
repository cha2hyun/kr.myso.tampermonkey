// ---------------------
(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window) {
    window.NB_blogInfo = async function SE_blogInfo(blogId, action, params = {}) {
        const referer = `https://m.blog.naver.com/${blogId}`;
        const uri = new URL(`https://m.blog.naver.com/rego/${action}.naver?blogId=${blogId}&_=${Date.now()}`); _.map(params, (v, k) => uri.searchParams.set(k, v));
        const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer } });
        const data = eval(`('${res.responseText})`);
        return data && data.result;
    }
})(window);
// ---------------------
(function(window) {
    function date_format(date) {
        const time = new Date(date);
        const Y = `0000${time.getFullYear()}`.substr(-4);
        const M = `0000${time.getMonth() + 1}`.substr(-2);
        const D = `0000${time.getDate()}`.substr(-2);
        return `${Y}-${M}-${D}`;
    }
    window.NB_blogStat = async function NB_blogStat(blogId, date = Date.now()) {
        const referer = `https://m.blog.naver.com/${blogId}`;
        const uri = new URL(`https://blog.stat.naver.com/api/blog/user/referer/search?timeDimension=DATE&startDate=${date_format(date)}&exclude=&_=${Date.now()}`);
        const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer } });
        const data = eval(`(${res.responseText})`);
        return data && data.result;
    }
})(window);