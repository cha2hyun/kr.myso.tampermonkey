// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.search.ad
// @description   네이버 검색 RX 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.19

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
    function parsed_number(number) { return /^[\d\.]+$/.test(String(number)) ? parseFloat(number) : 0; }
    window.NA_search = async function NA_search(keyword, errors = 0) {
        try {
            const key = keyword.replace(/[\s]+/g, '').toUpperCase();
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
  })(window);