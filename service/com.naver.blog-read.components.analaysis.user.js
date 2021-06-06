// ==UserScript==
// @name         네이버 블로그 문서 구성 요약
// @namespace    https://tampermonkey.myso.kr/
// @version      1.1.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-read.components.analaysis.user.js
// @description  네이버 블로그로 작성된 문서 구성을 간략하게 확인할 수 있습니다.
// @author       Won Choi
// @match        *://blog.naver.com/PostView.nhn?*
// @connect      naver.com
// @connect      pstatic.net
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://tampermonkey.myso.kr/assets/lib/naver-blog.js
// @require      https://tampermonkey.myso.kr/assets/lib/smart-editor-one.js?v=8
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js
// ==/UserScript==
// ---------------------
GM_App(async function main() {
  GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
  GM_addStyle(`
  .cursor-help { cursor: help; }
  .content-analysis-flex-row { flex-direction: row; }
  .content-analysis-flex-column { flex-direction: column; }
  .content-analysis {
    position: fixed; z-index: 100000;
    margin:auto; left: 0; top: 0; right: auto; bottom: 0;
    width:300px; height: 80%; background: #fff; color: #333;
    display: flex; flex-direction: column;
    border: 1px solid rgba(0, 0, 0, 0.4);
    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
  }
  .content-analysis:hover { width: 560px; }
  .content-analysis-body {
    flex-grow: 1; overflow-y: auto;
  }
  .content-analysis-subhead { background: #52565e; color:#fff; font-weight:bold; position: sticky; top: 0; font-size:12px; height: 30px; padding: 5px 15px; display: flex; align-items: center; justify-content: center; }
  .content-analysis-listview {}
  .content-analysis-listview li { display: flex; font-size:12px; height: 30px; padding: 5px 15px; align-items: center; justify-content: center; }
  .content-analysis-listview li > * {  }
  .content-analysis-listview li > *:nth-child(1) { flex-grow:1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; }
  .content-analysis-listview li > *:nth-child(2) { min-width: 90px; display: flex; flex-direction: column; text-align: right; line-height: auto;  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; }
  .content-analysis-listitem { }
  .content-analysis-listitem:hover { background: #efefef; }
  .content-analysis-listhead { background: #279b37; color:#fff; font-weight:bold; position: sticky; top: 40px;  }
  .content-analysis-listhead-title { background: #74d2e7; color:#fff; }
  .content-analysis-listhead-text  { background: #48a9c5; color:#fff; }
  .content-analysis-listhead-image { background: #0085ad; color:#fff; }
  .content-analysis-listhead-video { background: #8db9ca; color:#fff; }
  .content-analysis-listhead-line { background: #4298b5; color:#fff; }
  .content-analysis-listhead-sticker { background: #005670; color:#fff; }
  .content-analysis-listhead-quotation { background: #00205b; color:#fff; }
  .content-analysis-listhead-places { background: #009f4d; color:#fff; }
  .content-analysis-listhead-link { background: #84bd00; color:#fff; }
  .content-analysis-listhead-file { background: #efdf00; color:#fff; }
  .content-analysis-listhead-schedule { background: #fe5000; color:#fff; }
  .content-analysis-listhead-code { background: #e4002b; color:#fff; }
  .content-analysis-listhead-table { background: #da1884; color:#fff; }
  .content-analysis-listhead-formula { background: #a51890; color:#fff; }
  .content-analysis-listhead-talktalk { background: #0077c8; color:#fff; }
  .content-analysis-listhead-material { background: #008eaa; color:#fff; }

  @keyframes blinker {
    from { opacity: 1.0; outline: 0px solid #f00; }
    to { opacity: 0.3; outline: 1px solid #f00; }
  }
  .content-analysis-highlight {
    animation: blinker 0.3s linear infinite;
  }
  `);
  const se = SE_parse(document); if(!se.content) return;
  console.log(se);
  const wrap = document.querySelector('#content-analaysis') || document.createElement('div'); wrap.id = 'content-analaysis'; document.body.prepend(wrap);
  Handlebars.registerHelper('size', (obj) => _.size(obj));
  Handlebars.registerHelper('length', (section) => SE_componentContent([section]).replace(/[\r\n]+/g, '').length);
  Handlebars.registerHelper('lengthTrim', (section) => SE_componentContent([section]).replace(/[\r\n\s]+/g, '').length);
  GM_addScript(() => {
      function toggle(index, state) {
          const sections = Array.from(document.querySelectorAll('#se_components_wrapper .se_component, .se_component_wrap .se_component, .se_card_container .se_component, .__se_editor-content .se_component, .se-main-container .se-component, .se-container .se-component'));
          const component = sections[index]; if(component) {
              event.preventDefault();
              component.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
              component.classList.remove('content-analysis-highlight');
              void component.offsetWidth;
              if(state) component.classList.add('content-analysis-highlight');
          }
      }
      window.content_analysis_focus = function content_analysis_focus(index) { toggle(index, true); };
      window.content_analysis_focusout = function content_analysis_focusout(index) { toggle(index, false); }
  });
  const tmpl = Handlebars.compile(`
  <div class="content-analysis">
    <div class="content-analysis-body">
      <h3 class="content-analysis-subhead content-analysis-flex-column">
        <span>총 {{size sections}}개의 구성요소</span>
        <small>글자수: {{contentLength}}자 (공백제외: {{contentLengthTrim}}자)</small>
      </h3>
      <ul class="content-analysis-listview">
        {{#each sections}}
        <li class="content-analysis-listhead content-analysis-listhead-{{type}} cursor-help" onmouseover="content_analysis_focus({{@index}})" onmouseout="content_analysis_focusout({{@index}})">
          <h4>{{type}}</h4>
          <div>
            <span class="content-analysis-value">글자수: {{length this}}자 (공백제외: {{lengthTrim this}}자)</span>
          </div>
        </li>
        {{/each}}
      </ul>
    </div>
  </div>
  `);
  wrap.innerHTML = tmpl(se);
});