// ==UserScript==
// @name         네이버 검색결과 키워드 선호 주제 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-category.analysis.user.js
// @description  네이버 검색결과에서 키워드에 대한 생산/소비 선호 주제를 확인할 수 있습니다.
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
function flatten(object, path = null, separator = '.') {
  return Object.keys(object).reduce((acc, key) => {
    const value = object[key];
    const newPath = Array.isArray(object) ? `${path ? path : ''}[${key}]` : [path, key].filter(Boolean).join(separator);
    const isObject = [typeof value === 'object', value !== null, !(value instanceof Date), !(value instanceof RegExp), !(Array.isArray(value) && value.length === 0),].every(Boolean);
    return isObject ? { ...acc, ...flatten(value, newPath, separator) } : { ...acc, [newPath]: value };
  }, {});
}
function map_categories(nlu_category = '') {
    const categories = [];
    categories.push({ name: '문학·책', id: 5 });
    categories.push({ name: '영화', id: 6 });
    categories.push({ name: '미술·디자인', id: 8 });
    categories.push({ name: '공연·전시', id: 7 });
    categories.push({ name: '음악', id: 11 });
    categories.push({ name: '드라마', id: 9 });
    categories.push({ name: '스타·연예인', id: 12 });
    categories.push({ name: '만화·애니', id: 13 });
    categories.push({ name: '방송', id: 10 });
    categories.push({ name: '일상·생각', id: 14 });
    categories.push({ name: '육아·결혼', id: 15 });
    categories.push({ name: '애완·반려동물', id: 16 });
    categories.push({ name: '좋은글·이미지', id: 17 });
    categories.push({ name: '패션·미용', id: 18 });
    categories.push({ name: '인테리어·DIY', id: 19 });
    categories.push({ name: '요리·레시피', id: 20 });
    categories.push({ name: '상품리뷰', id: 21 });
    categories.push({ name: '원예·재배', id: 36 });
    categories.push({ name: '게임', id: 22 });
    categories.push({ name: '스포츠', id: 23 });
    categories.push({ name: '사진', id: 24 });
    categories.push({ name: '자동차', id: 25 });
    categories.push({ name: '취미', id: 26 });
    categories.push({ name: '국내여행', id: 27 });
    categories.push({ name: '세계여행', id: 28 });
    categories.push({ name: '맛집', id: 29 });
    categories.push({ name: 'IT·컴퓨터', id: 30 });
    categories.push({ name: '사회·정치', id: 31 });
    categories.push({ name: '건강·의학', id: 32 });
    categories.push({ name: '비즈니스·경제', id: 33 });
    categories.push({ name: '어학·외국어', id: 35 });
    categories.push({ name: '교육·학문', id: 34 });
    return (nlu_category || '').split(' ').map((id) => categories.find((o)=>o.id == id)).filter(v=>!!v).map(o=>o.name);
}
async function main() {
    GM_donation('#container', 0);
    GM_addStyle(`
    [data-nlu_query_r_categories]::after, [data-nqx_theme_theme_main_name]::after {
      position: absolute; left: auto; right: 0; top: 100%;; margin: auto; clear: both; z-index: 100000;
      height: 1.5rem; font-size: 1em; line-height: 1em; padding: 0.5rem;
      background-color: rgba(255, 255, 0, 0.9); border: 1px solid rgba(0, 0, 0, 0.6);
      pointer-events: none;
    }
    [data-nlu_query_r_categories]::after { content: '생산선호주제: ' attr(data-nlu_query_r_categories); }
    [data-nqx_theme_theme_main_name]::after { content: '소비선호주제: ' attr(data-nqx_theme_theme_main_name); }
    .greenbox { position: relative; }
    .greenbox::after { left: auto; right: 0px; }
    .search_wrap { overflow: visible !important; }
    `);
    const wrp = document.querySelector('.greenbox, .search_input_inner'); if(!wrp) return;
    const api = document.querySelector('.review_loading[data-api], [data-loading-class="u_pg_new_loading"][data-api]'); if(!api) return;
    const url = api && api.dataset.api, uri = new URL(url);
    const map = _.mapValues(Object.fromEntries(uri.searchParams.entries()), (v)=>{ try { return JSON.parse(v) } catch(e){ return v; } });
    const cnv = flatten(map, null, '_');
    Object.assign(wrp.dataset, cnv);
    const nlu_query_r_categories = map_categories(cnv['nlu_query_r_category']).join(', ') || '(알 수 없음)';
    Object.assign(wrp.dataset, { nlu_query_r_categories });
}
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);
