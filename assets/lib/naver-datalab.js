// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.datalab
// @description   네이버 데이터랩 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.15

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
    function json_parse(text) { try { return JSON.parse(text); } catch(e) { return text; } }
    window.ND_getHash = async function ND_getHash(keyword, options = { gender: '', age: '', device: '' }) {
        if(!options.limit) options.limit = moment();
        if(!options.start) options.start = moment(options.limit).subtract(1, 'days').subtract(1, 'months');
        const headers = {
            "content-type": 'application/x-www-form-urlencoded',
            "referer": 'https://datalab.naver.com/keyword/trendSearch.naver',
        };
        const form = new URLSearchParams();
        form.append('queryGroups', `${keyword}__SZLIG__${keyword}`);
        form.append('startDate', moment(options.start).format('YYYYMMDD'));
        form.append('endDate', moment(options.limit).format('YYYYMMDD'));
        form.append('timeUnit', 'date');
        form.append('gender', options.gender);
        form.append('age', options.age);
        form.append('device', options.device);
        const data = form.toString();
        const resp = await GM_xmlhttpRequestAsync('https://datalab.naver.com/qcHash.naver', { headers, method: 'POST', data });
        return json_parse(resp.responseText);
    }
    window.ND_trend = async function ND_trend(keyword, options = {}) {
        if(!options.limit) options.limit = moment();
        if(!options.start) options.start = moment(options.limit).subtract(1, 'days').subtract(1, 'months');
        const sdate = moment(options.start);
        const edate = moment(options.limit);
        const trend = _.range(edate.diff(sdate, 'days')).map((v)=>moment(options.start).add(v, 'days').format('YYYYMMDD'));
        const headers = {
          "referer": 'https://datalab.naver.com/keyword/trendSearch.naver',
        };
        const hash = await ND_getHash(keyword);
        if(hash.message) throw new Error(hash.message);
        if(hash.success) {
            const resp = await GM_xmlhttpRequestAsync(`https://datalab.naver.com/qc.naver?hashKey=${hash.hashKey}`, { headers });
            const json = json_parse(resp.responseText);
            if(json.message) throw new Error(json.message);
            if(json.success) {
                const data = _.get(json, 'result[0].data', []);
                return _.reduce(trend, (r, period)=>(r.push(_.find(data, o=>o.period == period) || ({ period, value: 0 })), r), []);
            }
        }
    }
})(window);