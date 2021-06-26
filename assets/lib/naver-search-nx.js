(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window){
    async function NX_Request(keyword, start = 1, where = 'm_blog', mode = 'normal') {
        const endpoints = [];
        endpoints.push({ url: 'https://s.search.naver.com/p/review/search.naver', where: ['view', 'm_view'] });
        endpoints.push({ url: 'https://s.search.naver.com/p/blog/search.naver', where: ['blog', 'm_blog'] });
        const endpoint = endpoints.find(o=>o.where.includes(where)) || 'https://s.search.naver.com/p/blog/search.naver';
        const uri = new URL(endpoint.url);
        if(start) uri.searchParams.set('start', start);
        uri.searchParams.set('where', where);
        uri.searchParams.set('mode', mode);
        uri.searchParams.set('query', keyword);
        return GM_xmlhttpRequestAsync(uri);
    }
    window.NX_info = async function NX_info(keyword, start, where, mode) {
        const res = await NX_Request(keyword, start, where, mode);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
        const map = Array.from(doc.body.childNodes).filter(el=>el.nodeType == 8).map((nx) => Array.from(nx.nodeValue.matchAll(/^(?<k>[^\s\:]+)([\s\:]+)?(?<v>.*)$/igm)).map(o=>Object.assign({}, o.groups))).flat();
        const ret = map.reduce((r, { k, v }) => {
            if(typeof v === 'string' && v.includes(',')) v = v.split(',').map(r=>r.split(',').map(v=>decodeURIComponent(v).split(':').map(v=>decodeURIComponent(v))));
            if(typeof v === 'string' && v.includes('|')) v = v.split('|').map(r=>r.split(':').map(v=>decodeURIComponent(v)));
            if(typeof v === 'string' && v.includes(':')) v = v.split(':').map(v=>decodeURIComponent(v));
            if(typeof v === 'string') v = decodeURIComponent(v);
            return (r[k] = v, r);
        }, {});
        return ret;
    }
    window.NX_score = async function NX_score(keyword, start, where, mode) {
        const res = await NX_info(keyword, start, where, mode).catch(e=>null);
        const rnk = Object.keys(res || {}).filter(k=>/^r[\d]+$/.test(k)).map(k=>res[k]);
        return rnk.map((data)=>{
            let [[[crArea]], [[crGdid]], [[o1, a, b, c]]] = data;
            let crScoreA = parseFloat(a); if(crScoreA == 0 || crScoreA > 1600000000) crScoreA = '?';
            let crScoreB = parseFloat(b); if(crScoreB == 0 || crScoreB > 1600000000) crScoreB = '?';
            let crScoreC = parseFloat(c); if(crScoreC == 0 || crScoreC > 1600000000) crScoreC = '?';
            return { crGdid, crArea, crScoreA, crScoreB, crScoreC };
        });
    }
    window.NX_terms = async function NX_terms(keyword) {
        const res = await NX_info(keyword).catch(e=>null);
        if(!res || !res.terms) return [];
        if(typeof res.terms == 'string') return [res.terms];
        const terms = res.terms.map(item=>item && item.flat && item.flat()).flat();
        return terms.filter((word, offset, terms)=>terms.filter((item)=>item.includes(word)).length == 2);
    }
    window.NX_termsParagraph = async function NX_termsParagraph(paragraph) {
        const words = paragraph.split(/[\s]+/g);
        const chunk = words.reduce((chunk, word, offset)=>{ const index = Math.floor(offset / 5), item = chunk[index] = chunk[index] || []; item.push(word); return chunk }, []).map(item=>item.join(' '));
        const terms = []; for(let item of chunk) { terms.push(await NX_terms(item)); }
        return terms.flat();
        //return chunk.length ? (await Promise.all(chunk.map(NX_terms))).flat() : [];
    }
})(window);
// ---------------------