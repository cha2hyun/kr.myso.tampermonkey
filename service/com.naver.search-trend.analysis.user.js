// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 데이터랩 검색어 트렌드
// @description  네이버 검색결과에서 데이터랩의 검색어 트렌드 정보를 확인할 수 있습니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.11
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-trend.analysis.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @connect      ryo.co.kr
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/lib/naver-datalab.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/lib/naver-search-ad.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    function format_number(number) { return number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ); }
    function parsed_number(number) { return /^[\d\.]+$/.test(String(number)) ? parseFloat(number) : 0; }
    async function data_normalize(keyword) {
        const stat = await NA_search(keyword);
        const data = await ND_trend(keyword);
        const sums = data.reduce((r, o)=>r+o.value, 0);
        const tick = stat ? (stat.monthlyQcCnt / sums) : 1;
        const items = data.map((item)=>(item.value = (item.value * tick), item));
        return { items, rval: !!stat };
    }
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
})