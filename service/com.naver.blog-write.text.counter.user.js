// ==UserScript==
// @name         네이버 블로그&포스트 글자수 세기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.1.8
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.text.counter.user.js
// @description  네이버 블로그&포스트에서 글자수 세기를 활성화합니다.
// @author       Won Choi
// @match        *://blog.naver.com/*/*
// @match        *://blog.naver.com/PostWriteForm*
// @match        *://blog.naver.com/PostUpdateForm*
// @match        *://blog.naver.com/PostView*
// @match        *://blog.naver.com/lib/smarteditor2/*/smart_editor2_inputarea.html
// @match        *://m.blog.naver.com/*/*
// @match        *://blog.editor.naver.com/editor*
// @match        *://post.editor.naver.com/editor*
// @match        *://post.naver.com/viewer/postView*
// @match        *://m.post.editor.naver.com/editor*
// @match        *://m.post.naver.com/viewer/postView*
// @grant        GM_addStyle
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://tampermonkey.myso.kr/assets/lib/smart-editor-one.js?v=21
// ==/UserScript==
// ---------------------
GM_App(async function main() {
    GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
    GM_addStyle(`
      head { display: block !important; }
      .se-toast-popup.content-length { position: fixed; z-index: 52; bottom: 0; left: 0; right: 0; margin: auto; }
      .se-toast-popup.content-length .se-toast-popup-container { position: absolute; bottom: 90px; right: 0; left: 0; height: 0; margin: auto; text-align: center; font-size: 0; }
      .se-toast-popup.content-length .se-toast-popup-content { position: relative; display: inline-block; height: 39px; padding-left: 22px; padding-right: 22px; background-color: #fff; -webkit-box-sizing: border-box; box-sizing: border-box; border-radius: 2px; }
      .se-toast-popup.content-length .se-toast-popup-content.se-toast-popup-content-info { -webkit-box-shadow: 1px 1px 4px 0 rgba(63,144,223,.2); box-shadow: 1px 1px 4px 0 rgba(63,144,223,.2); border: 1px solid rgba(63,144,223,.5); }
      .se-toast-popup.content-length .se-toast-popup-message { display: inline-block; margin: 0; padding: 0; border: 0; height: 100%; font-family: se-nanumgothic,\\B098\B214\ACE0\B515,nanumgothic,sans-serif,Meiryo; font-size: 12px; vertical-align: middle; padding-top: 1px; -webkit-box-sizing: border-box; box-sizing: border-box; line-height:37px !important; }
      .se-toast-popup.content-length .se-toast-popup-content-info .se-toast-popup-message { color: #0e86fb; }
      .se-toast-popup.content-length[data-cps="0"]   .se-toast-popup-content { zoom: 1.00; }
      .se-toast-popup.content-length[data-cps="100"] .se-toast-popup-content { zoom: 1.05; }
      .se-toast-popup.content-length[data-cps="200"] .se-toast-popup-content { zoom: 1.10; }
      .se-toast-popup.content-length[data-cps="300"] .se-toast-popup-content { zoom: 1.15; }
      .se-toast-popup.content-length[data-cps="400"] .se-toast-popup-content { zoom: 1.20; }
      .se-toast-popup.content-length[data-cps="500"] .se-toast-popup-content { zoom: 1.25; }
      .se-toast-popup.content-length[data-cps="600"] .se-toast-popup-content { zoom: 1.30; }
      .se-toast-popup.content-length[data-cps="700"] .se-toast-popup-content { zoom: 1.35; }
      .se-toast-popup.content-length[data-cps="800"] .se-toast-popup-content { zoom: 1.40; }
      .se-toast-popup.content-length[data-cps="900"] .se-toast-popup-content { zoom: 1.45; }
    `);
    function handler(e) {
        // 글자수 세기
        const se_editor = document.querySelector('.blog_editor');
        const se = SE_parse(document); if(!se || !se.content) return;
        const container = document.querySelector('head');
        const se_toast_popup = container.querySelector('.se-toast-popup.content-length') || document.createElement('div');
        const se_toast_popup_container = se_toast_popup.querySelector('.se-toast-popup-container') || document.createElement('div');
        const se_toast_popup_content = se_toast_popup_container.querySelector('.se-toast-popup-content') || document.createElement('div');
        const se_toast_popup_message = se_toast_popup_content.querySelector('.se-toast-popup-message') || document.createElement('p');
        if(!se_toast_popup.className) { se_toast_popup.className = 'se-toast-popup se-toast-interaction-enter content-length'; container.append(se_toast_popup); }
        if(!se_toast_popup_container.className) { se_toast_popup_container.className = 'se-toast-popup-container'; se_toast_popup.append(se_toast_popup_container); }
        if(!se_toast_popup_content.className) { se_toast_popup_content.className = 'se-toast-popup-content se-toast-popup-content-info'; se_toast_popup_container.append(se_toast_popup_content); }
        if(!se_toast_popup_message.className) { se_toast_popup_message.className = 'se-toast-popup-message'; se_toast_popup_message.setAttribute('role', 'alert'); se_toast_popup_content.append(se_toast_popup_message); }
        // 타자수 세기
        const timestamp = Date.now();
        handler.tps = handler.tps || 0;
        handler.cps = handler.cps || 0;
        handler.history = handler.history || [];
        if(e && e.type == 'keyup') {
            handler.tps++;
            handler.history = handler.history.filter((o)=>o.timestamp >= (timestamp - 60000));
            handler.history.push({ timestamp, tps: handler.tps });
            const head = handler.history[0], tail = handler.history[handler.history.length - 1];
            handler.cps = ((head && tail) ? (tail.tps - head.tps) : 0);
        }
        if(!se_editor) {
            se_toast_popup_message.innerText = `글자수 : ${se.contentLength}자 (공백제외: ${se.contentLengthTrim}자)`;
        } else {
            se_toast_popup.dataset.cps = Math.floor(handler.cps / 100) * 100;
            se_toast_popup_message.innerText = `글자수 : ${se.contentLength}자 (공백제외: ${se.contentLengthTrim}자), 타자수 : ${handler.cps}회/분`;
        }
    }
    window.addEventListener('keyup', handler, false);
    window.addEventListener('keydown', handler, false);
    window.addEventListener('keypress', handler, false);
    window.addEventListener('click', handler, false);
    handler();
});