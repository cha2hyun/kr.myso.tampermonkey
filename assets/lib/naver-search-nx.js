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
        const terms = []; while(chunk.length) { terms.push((await Promise.all(chunk.splice(0, 30).map(NX_terms))).flat()); }
        return terms.flat();
        //return chunk.length ? (await Promise.all(chunk.map(NX_terms))).flat() : [];
    }
    window.NX_items = async function NX_items(keyword, start, where = 'view', mode) {
        const res = await NX_Request(keyword, start, where, mode);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
        const listview = Array.from(doc.querySelectorAll('.lst_total > li'));
        return listview.map((listitem, offset) => {
            const el_n = listitem.querySelector('.sub_name');
            const el_t = listitem.querySelector('.total_tit');
            const el_d = listitem.querySelector('.dsc_txt');
            if(!el_n || !el_t || !el_d) return;
            const uri = new URL(el_t.href), params = Object.fromEntries(uri.searchParams.entries());
            if(!uri.hostname.includes('blog.naver.com')) return;
            return {
                ...params,
                rank: offset + 1,
                blogId: uri.pathname.split('/')[1],
                briefContents: el_t.textContent,
                titleWithInspectMessage: el_t.textContent,
            }
        }).filter(v=>!!v);
    }
    window.NX_itemsAll = async function NX_itemsAll(...keywords) {
        const uniqs = keywords.filter((word, index, keywords)=>keywords.indexOf(word) == index);
        const items = []; while(uniqs.length) { items.push((await Promise.all(uniqs.splice(0, 30).map(async (query)=>({ query, items: NX_items(query) })))).flat()); }
        return items.flat();
    }
})(window);
// ---------------------