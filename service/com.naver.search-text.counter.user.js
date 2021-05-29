// ==UserScript==
// @name         네이버 검색결과 블로그&포스트 글자수 세기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.3
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-text.counter.user.js
// @description  네이버 검색결과에서 블로그&포스트 글자수 세기를 활성화합니다.
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
async function request(url) {
  return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({ method: 'GET', url, onerror: reject, onload: resolve, });
  });
}
async function contentLength(target) {
  const clipContent = target.querySelector('#__clipContent');
  if(clipContent) { target = new DOMParser().parseFromString(clipContent.textContent, 'text/html'); }
  const sections_v2 = Array.from(target.querySelectorAll('#postViewArea, body.se2_inputarea')).map((component) => {
      const filter = ['se-toast-popup', '__se_object', 'og', '_naverVideo'];
      function textContents(output, element) {
          if(filter.find(o=>element.className && element.className.includes(o))) return output;
          const textNodes = Array.from(element.childNodes).filter(o=>o instanceof Text);
          const selements = Array.from(element.childNodes).filter(o=>o instanceof HTMLElement);
          output = selements.reduce(textContents, output);
          output.push(...textNodes);
          return output;
      }
      const section = {};
      const data = Array.from(component.childNodes).reduce(textContents, []); section.data = data.map(el=>el.textContent || el.value || '');
      return section;
  });
  const sections_v3 = Array.from(target.querySelectorAll('#se_components_wrapper .se_component, .se_component_wrap .se_component, .se_card_container .se_component, .__se_editor-content .se_component, .se-main-container .se-component, .se-container .se-component')).map((component) => {
      const section = {};
      const data = Array.from(component.querySelectorAll('.se_textarea, .se-text-paragraph')); section.data = data.map(el=>el.innerText || el.value || '');
      return section;
  });
  const placeholders = Array.from(target.querySelectorAll('.se_textarea, .se-text-paragraph')).map((component) => {
      const section = {};
      const data = Array.from(component.querySelectorAll('.se-placeholder')); section.data = data.map(el=>el.innerText || el.value || '');
      return section;
  });

  const contentV2Length = Number(sections_v2.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.length, 0), 0));
  const contentV2LengthTrim = Number(sections_v2.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.replace(/[\s]+/g, '').length, 0), 0));
  const contentV3Length = Number(sections_v3.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.length, 0), 0));
  const contentV3LengthTrim = Number(sections_v3.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.replace(/[\s]+/g, '').length, 0), 0));

  const contentLength = contentV2Length + contentV3Length;
  const contentLengthTrim = contentV2LengthTrim + contentV3LengthTrim;
  const placeholderLength = Number(placeholders.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.length, 0), 0));
  const placeholderLengthTrim = Number(placeholders.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.replace(/[\s]+/g, '').length, 0), 0));

  if(!contentLength) return;

  const contentLengthTxt = String(contentLength-placeholderLength).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  const contentLengthTrimTxt = String(contentLengthTrim-placeholderLengthTrim).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

  return { contentLengthTxt, contentLengthTrimTxt }
}
async function parse(target) {
  if(!target || !target.querySelector) return;
  const anchor = target.querySelector('a.total_tit[href*="blog.naver.com"], a.total_tit[href*="post.naver.com"]'); if(!anchor) return;
  const uri = new URL(anchor.href);
  if(uri.hostname.includes('blog.naver.com')) { uri.hostname = 'm.blog.naver.com'; }
  const res = await request(uri.toString());
  const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
  const len = await contentLength(doc);
  Object.assign(target.dataset, len);
}
async function observe(target) {
  const observer = new MutationObserver(function(mutations) {
      mutations.map(function(mutation) {
          const { type, addedNodes } = mutation;
          if(type == 'childList' && addedNodes.length) {
              Promise.mapSeries(addedNodes, parse);
          }
      });
  });
  const config = { attributes: true, childList: true, characterData: true };
  observer.observe(target, config);
}
async function main() {
  GM_donation('#container', 0);
  GM_addStyle(`
  [data-content-length-txt][data-content-length-trim-txt]::before {
    display: block; margin: 15px 15px 0px; padding: 0.5rem 1rem; font-size: 12px; color: #000;
    background-color: #efefef; border-radius: 8px;
    content: '글자수 : ' attr(data-content-length-txt) '자 (공백제외: ' attr(data-content-length-trim-txt) '자)';
  }
  `);
  const views = document.querySelector('ul.lst_total'); observe(views);
  const links = document.querySelectorAll('ul.lst_total > li');
  Promise.mapSeries(links, parse);
}
function _requestIdleCallback(callback) {
  if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
  return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);