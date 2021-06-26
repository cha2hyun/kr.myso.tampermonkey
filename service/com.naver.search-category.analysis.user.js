// ==UserScript==
// @name         네이버 검색결과 키워드 선호 주제 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.3
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-category.analysis.user.js
// @description  네이버 검색결과에서 키워드에 대한 생산/소비 선호 주제를 확인할 수 있습니다.
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://tampermonkey.myso.kr/assets/lib/naver-search-rx.js?v=4
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
GM_App(async function main() {
  GM_donation('#container', 0);
  GM_addStyle(`
  [data-nx-status-keywords]::after {
    position: absolute; left: auto; right: 0; top: 100%;; margin: auto; clear: both; z-index: 100000;
    font-size: 12px; line-height: 1.3em; padding: 0.5em;
    background-color: rgba(255, 255, 0, 0.9); border: 1px solid rgba(0, 0, 0, 0.6);
    pointer-events: none; content: attr(data-nx-status-keywords);
    word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;
  }
  .greenbox { position: relative; }
  .greenbox::after { left: auto; right: 0px; }
  .search_wrap { overflow: visible !important; }
  `);
  const wrp = document.querySelector('.greenbox, .search_input_inner'); if(!wrp) return;
  const uri = new URL(location.href), query = uri.searchParams.get('query'); if(!query) return;
  const terms = await NR_terms(query);
  const info = [];
  if(terms.r_category) info.push(`생산선호주제: ${terms.r_category}`)
  if(terms.theme && terms.theme.main) info.push(`메인소비주제: ${terms.theme.main.name}`);
  if(terms.theme && terms.theme.sub)  info.push(`서브소비주제: ${terms.theme.sub.map(o=>o.name).join(', ')}`);
  wrp.dataset.nxStatusKeywords = info.join('\n');
})