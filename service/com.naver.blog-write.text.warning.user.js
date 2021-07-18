// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 블로그 검색제한 키워드 실시간 검사
// @description  네이버 블로그에서 작성중인 문장에서 성인, 도박 등의 검색제한 키워드를 실시간으로 검사합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.text.warning.user.js
// @downloadURL  https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.text.warning.user.js
// @author       Won Choi
// @connect      naver.com
// @match        *://blog.naver.com/*/postwrite*
// @match        *://blog.naver.com/*Redirect=Write*
// @match        *://blog.naver.com/*Redirect=Update*
// @match        *://blog.naver.com/PostWriteForm*
// @match        *://blog.naver.com/PostUpdateForm*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/lib/naver-search-ad.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/lib/naver-search-rx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.45/assets/lib/smart-editor-one.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
// ---------------------
GM_App(async function main() {
  GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
  GM_addStyle(`
  [data-terms-warn] { position: relative; outline: 1px dashed red; background-color: rgba(255,0,0,0.1); }
  [data-terms-warn]::after {
    content:'제한키워드: ' attr(data-terms-warn); font-size:12px; line-height: 1.3em;
    display: block; color: red; text-align: center; white-space: pre;
    width: 693px; max-width: 100%; margin-left: auto; margin-right: auto; padding: 0.5em; border: 1px solid red; border-radius: 0.5em;
  }
  [data-terms-warn=""] { outline: 0 !important; background-color: transparent !important; }
  [data-terms-warn=""]::after { display:none !important; }
  `);
  async function handler(e) {
      if(handler.working || e.keyCode !== 13) return;
      handler.timer = clearTimeout(handler);
      handler.tiemr = setTimeout(async () => {
          document.body.classList.toggle('se-working-keyword-warn', handler.working = true);
          const nodes = SE_parseNodes(document);
          await Promise.map(nodes, async (node)=>{
              if(node.dataset.prevData == node.textContent) { return; } else { node.dataset.prevData = node.textContent; }
              const bases = Array.from(node.querySelectorAll('p')).map(el=>el.textContent).slice(-3).join('\n');
              const words = bases.split(/[\s]+/g);
              const terms = await NX_termsParagraph(bases);
              const items = _.uniq([...words, ...terms]);
              const check = await Promise.map(items, async(query)=>({ query, block: await NA_keywordBlockCheck(query) }));
              const warns = check.filter(o=>o.block).map(o=>o.query);
              node.dataset.terms = terms.join(', ');
              node.dataset.termsWarn = warns.join(', ');
          });
          document.body.classList.toggle('se-working-keyword-warn', handler.working = false);
      }, 300);
  }
  window.addEventListener('keyup', handler, false);
  window.addEventListener('keydown', handler, false);
  window.addEventListener('keypress', handler, false);
});