(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
    });
  }
})(window);
// ---------------------
(function(window){
  async function NX_Request(keyword) {
      const uri = new URL('https://s.search.naver.com/p/blog/search.naver?where=m_view&query=&main_q=&mode=normal&ac=1&aq=0&spq=0');
      uri.search = location.search;
      uri.searchParams.set('query', keyword);
      uri.searchParams.set('main_q', keyword);
      uri.searchParams.set('mode', 'normal');
      uri.searchParams.delete('api_type');
      uri.searchParams.delete('mobile_more');
      return GM_xmlhttpRequestAsync(uri);
  }
  window.NX_info = async function NX_info(keyword) {
      const res = await NX_Request(keyword);
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
  window.NX_terms = async function NX_terms(keyword) {
      const res = await NX_info(keyword).catch(e=>null);
      return ((res && res.terms) || []).map(item=>item.flat()).flat();
  }
})(window);