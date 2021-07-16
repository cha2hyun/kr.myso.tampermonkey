// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.search.ad
// @description   네이버 검색 RX 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.38

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
  })(window);
  // ---------------------
  (function(window){
    function normalize(keyword) { return keyword.replace(/[\s]+/g, '').toUpperCase(); }
    function parsed_number(number) { return /^[\d\.]+$/.test(String(number)) ? parseFloat(number) : 0; }
    window.NA_search = async function NA_search(keyword, errors = 0) {
        try {
            const key = normalize(keyword);
            const ref = new URL('https://search.naver.com/search.naver?where=view&sm=tab_jum&query=')
            const uri = new URL('http://www.ryo.co.kr/naver/keyword?position=main&callback=update_keyword_analysis&dn=&keyword=');
            ref.searchParams.set('keyword', key);
            uri.searchParams.set('keyword', key);
            const res = await GM_xmlhttpRequestAsync(uri, { headers: { 'referer': ref.toString() } });
            function update_keyword_analysis(data){
                const resp = {}; if(!data) return;
                resp.monthlyPcQcCnt = parsed_number(data && data.monthlyPcQcCnt);
                resp.monthlyMobileQcCnt = parsed_number(data && data.monthlyMobileQcCnt);
                resp.monthlyQcCnt = resp.monthlyPcQcCnt + resp.monthlyMobileQcCnt;
                return resp;
            }
            return eval(res.responseText);
        } catch(e) {
            console.error(e);
            if(errors) return Promise.delay(500).then(()=>NA_search(keyword, --errors));
        }
    }
    window.NA_keywordAutocomplete = async function NA_keywordAutocomplete(keyword) {
        const referer = 'https://m.naver.com/';
        const uri = new URL('https://mac.search.naver.com/mobile/ac?q=&con=1&q_enc=UTF-8&st=1&frm=mobile_nv&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2');
        uri.searchParams.set('q', keyword);
        const res = await GM_xmlhttpRequestAsync(uri, { headers: { referer } });
        const rev = eval(`(${res.responseText})`);
        return ((rev && rev.items) || []).flat().flat();
    }
    window.NA_keywordAutocompleteNormalize = async function NA_keywordAutocompleteNormalize(keyword) {
        let item, trim = keyword.trim(), norm = normalize(keyword);
        if(!item) {
            const items = await NA_keywordAutocomplete(trim.substr(0, keyword.length - 1));
            item = items.find(value=>typeof value === 'string' && normalize(value) == norm);
        }
        if(!item) {
            const items = await NA_keywordAutocomplete(trim);
            item = items.find(value=>typeof value === 'string' && normalize(value) == norm);
        }
        return item || keyword;
    }
  })(window);