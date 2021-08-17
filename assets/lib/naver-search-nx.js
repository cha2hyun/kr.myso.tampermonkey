// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.search.nx
// @description   네이버 검색 NX 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.49

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
// ---------------------
(function(){Array.prototype.flat||Object.defineProperty(Array.prototype,"flat",{configurable:!0,value:function r(){var t=isNaN(arguments[0])?1:Number(arguments[0]);return t?Array.prototype.reduce.call(this,function(a,e){return Array.isArray(e)?a.push.apply(a,r.call(e,t-1)):a.push(e),a},[]):Array.prototype.slice.call(this)},writable:!0}),Array.prototype.flatMap||Object.defineProperty(Array.prototype,"flatMap",{configurable:!0,value:function(r){return Array.prototype.map.apply(this,arguments).flat()},writable:!0})})();
(function(){String.prototype.matchAll||Object.defineProperty(String.prototype,"matchAll",{configurable:!0,value:function r(){var c=[],a=[],t=arguments[0],r=(typeof t==="string")?new RegExp(t, "g"):new RegExp(t);while ((c = r.exec(this)) !== null) a.push(c || []);return a;},writable:!0})})();
(function(){Object.fromEntries||Object.defineProperty(Object,"fromEntries",{configurable:!0,value:function r(){var t=arguments[0];return [...t].reduce((o,[k,v])=>(o[k]=v,o), {})},writable:!0})})();
  // ---------------------
(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window){
    async function NX_Request(keyword, start = 1, where = 'blog', mode = 'normal', params = {}) {
        const endpoints = [];
        endpoints.push({ url: 'https://s.search.naver.com/p/review/search.naver', where: ['view', 'm_view'] });
        endpoints.push({ url: 'https://s.search.naver.com/p/blog/search.naver', where: ['blog', 'm_blog'] });
        endpoints.push({ url: 'https://s.search.naver.com/p/cafe/search.naver', where: ['article', 'm_article'] });
        endpoints.push({ url: 'https://s.search.naver.com/p/influencer/api/v1/docs?area=ink_kit&display=30&gender=&generation=&is_index_title=0&major-subject=&minor-subject=&nlu_query=&query=&start=1&_callback=resolve', where: ['influencer', 'm_influencer'] })
        const endpoint = endpoints.find(o=>o.where.includes(where)) || 'https://s.search.naver.com/p/blog/search.naver';
        const ref = new URL('https://m.search.naver.com/search.naver?where=m_view&sm=mtb_jum&query=');
        const uri = new URL(endpoint.url);
        uri.searchParams.set('mode', mode);
        uri.searchParams.set('start', start);
        uri.searchParams.set('where', where);
        uri.searchParams.set('query', keyword);
        ref.searchParams.set('query', keyword);
        Object.keys(params).map((k)=>uri.searchParams.set(k, params[k]));
        const res = await GM_xmlhttpRequestAsync(uri, { headers: { 'referer': ref.toString() } });
        if(uri.pathname.includes('/influencer/api')) {
            const responseJson = await new Promise((resolve)=>eval(res.responseText)).then(o=>o.result).catch(e=>null);
            const responseText = (responseJson && responseJson && responseJson.itemList && responseJson.itemList && responseJson.itemList.map(o=>o.html).join('')) || res.responseText;
            return { responseJson, responseText, response: responseText };
        } else {
            const responseJson = ((resp) => { try { return eval(resp); } catch(e) { return resp; } })(res.responseText);
            const responseText = res.responseText;
            return { responseJson, responseText, response: responseText };
        }
    }
    function $NX_info(doc) {
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
    function $NX_score(doc) {
        const res = $NX_info(doc);
        const rnk = Object.keys(res || {}).filter(k=>/^r[\d]+$/.test(k)).map(k=>res[k]);
        return rnk.map((data)=>{
            let [[[crArea]], [[crGdid]], [[o1, a, b, c]]] = data;
            let crScoreA = parseFloat(a); if(crScoreA == 0 || crScoreA > 1600000000) crScoreA = '?';
            let crScoreB = parseFloat(b); if(crScoreB == 0 || crScoreB > 1600000000) crScoreB = '?';
            let crScoreC = parseFloat(c); if(crScoreC == 0 || crScoreC > 1600000000) crScoreC = '?';
            return { crGdid, crArea, crScoreA, crScoreB, crScoreC };
        });
    }
    function $NX_list(doc) {
        const listview = Array.from(doc.querySelectorAll('.lst_total > li, li[data-space-id]'));
        return listview.map((listitem, offset) => {
            const el_n = listitem.querySelector('.sub_name, .user_area .name .txt');
            const el_t = listitem.querySelector('.total_tit, .detail_box .dsc_area .name_link');
            const el_d = listitem.querySelector('.dsc_txt, .detail_box .dsc_link .dsc');
            if(!el_n || !el_t || !el_d) return;
            const uri = new URL(el_t.href), params = Object.fromEntries(uri.searchParams.entries());
            const res = {
                ...params,
                ...listitem.dataset,
                rank: offset + 1,
                channelName: el_n.textContent,
                briefContents: el_d.textContent,
                titleWithInspectMessage: el_t.textContent,
                uri: uri.toString(),
            };
            if(uri.hostname.includes('blog.naver.com')) {
                const seg = uri.pathname.split('/');
                Object.assign(res, { blogId: seg[1], logNo: uri.searchParams.get('logNo') || seg[2], });
            }
            return res;
        }).filter(v=>!!v);
    }
    async function $NX_countNaverPost(keyword, params = {}) {
        const referer = 'https://m.post.naver.com/search/default.naver';
        const uri = new URL('https://m.post.naver.com/search/post.naver?keyword=&sortType=createDate.dsc&range=&term=&navigationType=current');
        uri.searchParams.set('keyword', keyword)
        Object.keys(params).map((k)=>uri.searchParams.set(k, params[k]));
        const res = await GM_xmlhttpRequestAsync(uri, { headers: { referer } });
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
        const cnt = doc.querySelector('.sorting_area .sorting_inner_wrap .txt em');
        return cnt ? parseInt(String(cnt.textContent).replace(/[^\d]+/g, '')) : 0;
    }
    window.NX_info = async function NX_info(keyword, start, where, mode, params) {
        const res = await NX_Request(keyword, start, where, mode, params);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
        return $NX_info(doc);
    }
    window.NX_count = async function NX_count(keyword, where = 'view', mode = 'normal', params = {}) {
        const types = [];
        types.push({ params: { api_type: 11, nso: 'so:r,p:1w' }, where: ['view', 'm_view'] });
        types.push({ params: { api_type: 1, nso: 'so:r,p:1w' }, where: ['blog', 'm_blog'] });
        types.push({ params: { prmore: 1, nso: 'so:r,p:1w' }, where: ['article', 'm_article'] });
        types.push({ params: { term: 'w' }, where: ['post', 'm_post'] });
        types.push({ params: {}, where: ['influencer', 'm_influencer'] });
        const type = types.find(o=>o.where.includes(where)) || types[0];
        const prms = Object.assign({}, type.params, params);
        try {
            if(['post', 'm_post'].includes(where)) return $NX_countNaverPost(keyword, prms);
            const res = await NX_Request(keyword, 1, where, mode, prms);
            return parseInt(String(res.responseJson.total || res.responseJson.totalCount || 0).replace(/[^\d]+/g, ''));
        }catch(e){
            console.error(e);
        }
    }
    window.NX_score = async function NX_score(keyword, start, where, mode, params) {
        const res = await NX_Request(keyword, start, where, mode, params);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
        return $NX_score(doc);
    }
    window.NX_terms = async function NX_terms(keyword) {
        const res = await NX_info(keyword).catch(e=>null);
        if(!res || !res.terms) return [];
        if(typeof res.terms == 'string') return [res.terms];
        const terms = res.terms.map(item=>item && item.flat && item.flat()).flat().filter(v=>!!v);
        return terms.filter((word, offset, terms)=>terms.filter((item)=>item.includes(word)).length == 2);
    }
    window.NX_termsParagraph = async function NX_termsParagraph(paragraph) {
        const words = paragraph.split(/[\s]+/g);
        const chunk = words.reduce((chunk, word, offset)=>{ const index = Math.floor(offset / 5), item = chunk[index] = chunk[index] || []; item.push(word); return chunk }, []).map(item=>item.join(' '));
        const terms = []; while(chunk.length) { terms.push((await Promise.all(chunk.splice(0, 30).map(NX_terms))).flat()); }
        return terms.flat();
    }
    window.NX_items = async function NX_items(keyword, start, where = 'view', mode, params) {
        const res = await NX_Request(keyword, start, where, mode, params);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
        const nx_info = $NX_score(doc);
        const nx_list = $NX_list(doc);
        return nx_list.map(item=>Object.assign({}, item, nx_info.find(info=>info.crGdid == item.crGdid)));
    }
    window.NX_itemsAll = async function NX_itemsAll(...keywords) {
        const uniqs = keywords.filter((word, index, keywords)=>keywords.indexOf(word) == index);
        const items = []; while(uniqs.length) { items.push((await Promise.all(uniqs.splice(0, 5).map(async (query)=>({ query, items: await NX_items(query) })))).flat()); }
        return items.flat();
    }
})(window);