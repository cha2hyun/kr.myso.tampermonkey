// ==UserScript==
// @name         네이버 검색결과 지수 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.6
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-rank.analysis.user.js
// @description  네이버 검색결과에서 상대평가 지수를 확인할 수 있습니다.
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
async function observe(target) {
  let keyword = (new URL(location.href)).searchParams.get('query'); if(!keyword) return;
  let observer = new MutationObserver(async function(mutations) {
      let start = (30 * (Math.ceil(Math.max(0, target.children.length) / 30) - 1)) + 1;
      await update(keyword, start);
      await update_unknown();
  });
  let config = { attributes: true, childList: true, characterData: true };
  observer.observe(target, config);
  await update(keyword);
  await update_unknown();
}
async function request(keyword, start = 1) {
  let dom = document.querySelector('.review_loading[data-api], [data-loading-class="u_pg_new_loading"][data-api]');
  let url = (dom && dom.dataset && dom.dataset.api) || ('https://s.search.naver.com/p/review/search.naver?where=m_view&query=&main_q=&mode=normal&ac=1&aq=0&spq=0');
  let uri = new URL(url); uri.search = location.search;
  uri.searchParams.set('query', keyword);
  uri.searchParams.set('main_q', keyword);
  uri.searchParams.set('start', start);
  uri.searchParams.set('prank', start);
  uri.searchParams.delete('api_type');
  uri.searchParams.delete('mobile_more');
  return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({ method: 'GET', url: uri.toString(), onerror: reject, onload: resolve, });
  });
}
async function update_unknown() {
  let items = Array.from(document.querySelectorAll('[data-cr-rank]:not([data-cr-score-a])'));
  await Promise.map(items, async (item) => {
      let title = item.querySelector('.total_tit'); if(!title) return;
      await update(title.textContent, 1, true);
  });
}
async function update(keyword, start = 1, crUnknown) {
  let res = await request(keyword, start);
  let doc = new DOMParser().parseFromString(res.responseText, 'text/html')
  let map = Array.from(doc.body.childNodes).filter(el=>el.nodeType == 8).map((nx) => Array.from(nx.nodeValue.matchAll(/^(?<k>[^\s\:]+)([\s\:]+)?(?<v>.*)$/igm)).map(o=>Object.assign({}, o.groups))).flat();
  let ret = map.reduce((r, { k, v }) => {
      if(typeof v === 'string' && v.includes(',')) v = v.split(',').map(r=>r.split(',').map(v=>decodeURIComponent(v).split(':').map(v=>decodeURIComponent(v))));
      if(typeof v === 'string' && v.includes('|')) v = v.split('|').map(r=>r.split(':').map(v=>decodeURIComponent(v)));
      if(typeof v === 'string' && v.includes(':')) v = v.split(':').map(v=>decodeURIComponent(v));
      if(typeof v === 'string') v = decodeURIComponent(v);
      return (r[k] = v, r);
  }, {});
  let rnk = Object.keys(ret).filter(k=>/^r[\d]+$/.test(k)).map(k=>ret[k]);
  rnk.map((data)=>{
      let [[[crArea]], [[crGdid]], [[o1, a, b, c, d, e]]] = data;
      let crScoreA = parseFloat(a); if(crScoreA == 0 || crScoreA > 1600000000) crScoreA = '?';
      let crScoreB = parseFloat(b); if(crScoreB == 0 || crScoreB > 1600000000) crScoreB = '?';
      let crScoreC = parseFloat(c); if(crScoreC == 0 || crScoreC > 1600000000) crScoreC = '?';
      let crScoreD = parseFloat(d); if(crScoreD == 0 || crScoreD > 1600000000) crScoreD = '?';
      let crScoreE = parseFloat(e); if(crScoreE == 0 || crScoreE > 1600000000) crScoreE = '?';
      let crElement = document.querySelector(`[data-cr-gdid="${crGdid}"]`);
      if(crElement && !crElement.dataset.crUnknown) {
          Object.assign(crElement.dataset, { crUnknown, crScoreA, crScoreB, crScoreC, crScoreD, crScoreE });
      }
  });
}
async function main() {
  GM_donation('#container', 0);
  GM_addStyle(`
  [data-cr-rank][data-cr-area*="rvw"]::after { display: block; margin: 0px 15px 15px; padding: 0.5rem 1rem; font-size: 14px; color: #000; font-weight: bold;  border-radius: 8px; }
  [data-cr-rank][data-cr-area*="rvw"][data-cr-score-a][data-cr-score-b][data-cr-score-c][data-cr-score-d][data-cr-score-e]::after {
    background-color: #ffdd00;
    content: '전문성: ' attr(data-cr-score-a) ' / 신뢰성: ' attr(data-cr-score-b) ' / 관련성: ' attr(data-cr-score-c) ' / 최신성: ' attr(data-cr-score-d);
  }
  [data-cr-rank][data-cr-area*="rvw"][data-cr-score-a][data-cr-score-b][data-cr-score-c][data-cr-score-d][data-cr-score-e][data-cr-unknown="true"]::after {
    background-color: #f48924; color: #fff;
    content: '전문성: ' attr(data-cr-score-a) ' / 신뢰성: ' attr(data-cr-score-b) ' - 주의: 제목으로 점수를 가져옴';
  }
  [data-cr-rank][data-cr-area*="rvw"]:not([data-cr-score-a])::after {
    background-color: #e4002b; color: #fff;
    content: '오류 : 분석 결과를 알 수 없음.';
  }
  `);
  const wrp = document.querySelector('ul.lst_total'); if(wrp) observe(wrp);
}
function _requestIdleCallback(callback) {
  if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
  return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);
