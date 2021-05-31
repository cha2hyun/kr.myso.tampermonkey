// ==UserScript==
// @name         네이버 검색결과 데이터랩 검색어 트렌드
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-trend.analysis.user.js
// @description  네이버 검색결과에서 데이터랩의 검색어 트렌드 정보를 확인할 수 있습니다.
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @connect      ryo.co.kr
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// ==/UserScript==
function format_number(number) { return number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ); }
function parsed_number(number) { return /^[\d\.]+$/.test(String(number)) ? parseFloat(number) : 0; }
function json_parse(text) { try { return JSON.parse(text); } catch(e) { return text; } }
async function request(url, options = { method: 'GET' }) { return new Promise((resolve, reject) => { GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options)); }); }
async function get_hash_keyword_trend(keyword, options = { gender: '', age: '', device: '' }) {
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
    const resp = await request('https://datalab.naver.com/qcHash.naver', { headers, method: 'POST', data });
    return json_parse(resp.responseText);
}
async function get_keyword_trend(keyword, options = {}) {
    if(!options.limit) options.limit = moment();
    if(!options.start) options.start = moment(options.limit).subtract(1, 'days').subtract(1, 'months');
    const sdate = moment(options.start);
    const edate = moment(options.limit);
    const trend = _.range(edate.diff(sdate, 'days')).map((v)=>moment(options.start).add(v, 'days').format('YYYYMMDD'));
    const headers = {
      "referer": 'https://datalab.naver.com/keyword/trendSearch.naver',
    };
    const hash = await get_hash_keyword_trend(keyword);
    if(hash.message) throw new Error(hash.message);
    if(hash.success) {
        const resp = await request(`https://datalab.naver.com/qc.naver?hashKey=${hash.hashKey}`, { headers });
        const json = json_parse(resp.responseText);
        if(json.message) throw new Error(json.message);
        if(json.success) {
            const data = _.get(json, 'result[0].data', []);
            return _.reduce(trend, (r, period)=>(r.push(_.find(data, o=>o.period == period) || ({ period, value: 0 })), r), []);
        }
    }
}
async function get_keyword_count(keyword) {
    const uri = new URL('https://www.ryo.co.kr/naver/keyword?position=main&callback=update_keyword_analysis&dn=&keyword='); uri.searchParams.set('keyword', keyword);
    const res = await request(uri.toString());
    function update_keyword_analysis(data){
        const resp = {}; if(!data) return;
        resp.monthlyPcQcCnt = parsed_number(data && data.monthlyPcQcCnt);
        resp.monthlyMobileQcCnt = parsed_number(data && data.monthlyMobileQcCnt);
        resp.monthlyQcCnt = resp.monthlyPcQcCnt + resp.monthlyMobileQcCnt;
        return resp;
    }
    return eval(res.responseText);
}
async function data_normalize(keyword) {
    const stat = await get_keyword_count(keyword);
    const data = await get_keyword_trend(keyword);
    const sums = data.reduce((r, o)=>r+o.value, 0);
    const tick = stat ? (stat.monthlyQcCnt / sums) : 1;
    const items = data.map((item)=>(item.value = (item.value * tick), item));
    return { items, rval: !!stat };
}
async function main() {
    GM_donation('#container', 0);
    const keyword = (new URL(location.href)).searchParams.get('query'); if(!keyword) return;
    const data = await data_normalize(keyword);
    const pack = document.querySelector('#main_pack, #snb');
    const wrap = pack.querySelector('.section.trend') || document.createElement('section'); wrap.classList.add('section', 'trend'); pack.prepend(wrap);
    const canv = wrap.querySelector('canvas') || document.createElement('canvas'); canv.style.width = '100%'; canv.style.height = '120px'; wrap.append(canv);
    const config = {
        type: 'line',
        data: {
            labels: _.map(data.items, o=>o.period),
            datasets: [{ backgroundColor: '#74d2e7', borderColor: '#48a9c5', data: _.map(data.items, o=>o.value), }],
        },
        options: {
            scales: { x: { display: false, } },
            plugins: {
                title: {
                    display: true,
                    text(context) {
                        if(data.rval) {
                            return '검색어 트렌드 (실 검색량)';
                        } else {
                            return '검색어 트렌드';
                        }
                    }
                },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            if(data.rval) {
                                return `${format_number(context.parsed.y.toFixed(0))}회 검색 됨`
                            } else {
                                return `${format_number(context.parsed.y.toFixed(2))}%`
                            }
                        }
                    }
                }
            },
        }
    };
    const chart = new Chart(canv, config);
}
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);
