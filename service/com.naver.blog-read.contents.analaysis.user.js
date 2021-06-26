// ==UserScript==
// @name         네이버 블로그 문단 단위 키워드 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-read.contents.analaysis.user.js
// @description  네이버 블로그로 작성된 문서를 문단 단위로 키워드를 분석하고 문장의 주요 주제를 간략하게 확인할 수 있습니다.
// @author       Won Choi
// @match        *://blog.naver.com/PostView*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://tampermonkey.myso.kr/assets/lib/naver-blog.js
// @require      https://tampermonkey.myso.kr/assets/lib/naver-search-nx.js?v=5
// @require      https://tampermonkey.myso.kr/assets/lib/naver-search-rx.js?v=2
// @require      https://tampermonkey.myso.kr/assets/lib/smart-editor-one.js?v=11
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// ==/UserScript==
GM_App(async function main() {
  GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
  GM_addStyle(`
  .se-text-paragraph[data-nx-status-loading="true"] { position: relative; }
  .se-text-paragraph[data-nx-status-loading="true"]::after { position: absolute; z-index: 1; display: block; padding: 0.2em; background: rgba(0,0,0,0.3); color: #fff; font-size: 11px; line-height: 1.3em; border-radius: 0.2em; content: '문장 내 키워드 분석 중...'; right: 0; bottom: 0; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; }
  .se-text-paragraph[data-nx-status-keywords] { position: relative; }
  .se-text-paragraph[data-nx-status-keywords]::after { position: absolute; z-index: 1; display: block; padding: 0.2em; background: rgba(0,0,0,0.3); color: #fff; font-size: 10px; line-height: 1.3em; border-radius: 0.2em; content: '분석 완료'; right: 0; bottom: 0; opacity: 0.5; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; }
  .se-text-paragraph[data-nx-status-keywords]:hover { outline: 1px solid rgba(255, 0, 0, 0.3);  }
  .se-text-paragraph[data-nx-status-keywords]:hover::after { z-index: 10000; background: #b4a996; color: #fff; font-size: 11px; content: attr(data-nx-status-keywords); overflow-y: auto; max-height: 240px; opacity: 1; }
  `);
  const se = SE_parse(document); if(!se.content) return;
  let docs = document, clip = docs.querySelector('#__clipContent'); if(clip) { docs = new DOMParser().parseFromString(clip.textContent, 'text/html'); }
  const sectionsV2 = Array.from(docs.querySelectorAll('.post_tit_area + #viewTypeSelector > *, body.se2_inputarea > *'));
  const sectionsV3 = Array.from(docs.querySelectorAll('#viewTypeSelector .se_component, .se_doc_viewer .se_component, .editor-canvas-wrap .se_component, #se_canvas_wrapper .se_component, .se_card_container .se_component'));
  const sectionsV4 = Array.from(docs.querySelectorAll('#viewTypeSelector .se-component, .se-main-container .se-component, .se-container .se-component'));
  const sections = [sectionsV2, sectionsV3, sectionsV4].flat();
  const sentences = se.sections.filter((section)=>['text'].includes(section.type));
  await Promise.map(sentences, async (sentence, index) => {
      const section = sections[sentence.offset]; if(!section) return;
      const lines = Array.from(section.querySelectorAll('.se-text-paragraph'));
      await Promise.map(sentence.text || [], async (text, offset)=>{
          const line = lines[offset]; if(!line) return;
          line.onmouseover = async function() {
              event.preventDefault();
              if(line.dataset.nxStatusKeywords || line.dataset.nxStatusLoading) return;
              line.dataset.nxStatusLoading = true;
              const terms = await NX_termsParagraph(text);
              const uniqs = terms.filter((word, index, terms)=>terms.indexOf(word) == index);
              const title = await NR_termsAll(...uniqs);
              const group = uniqs.reduce((group, query, index)=>(group[index] = Object.assign({ query, count: terms.filter(item=>item==query).length }, title.find(o=>o.query == query)), group), []).sort((a, b)=>b.count - a.count);
              line.dataset.nxStatusKeywords = group.map((item)=>{
                  const info = [`${_.padEnd(`(${item.count})`, 8)}${_.padEnd(item.query, 10)}`];
                  if(item.r_category) info.push(`생산선호주제: ${item.r_category}`)
                  if(item.theme && item.theme.main) info.push(`메인소비주제: ${item.theme.main.name}`);
                  if(item.theme && item.theme.sub)  info.push(`서브소비주제: ${item.theme.sub.map(o=>o.name).join(', ')}`);
                  return info.join('\n');
              }).join('\n\n');
              line.dataset.nxStatusLoading = false;
          };
      });
  });
});