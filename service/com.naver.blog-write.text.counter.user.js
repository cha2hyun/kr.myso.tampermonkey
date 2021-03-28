// ==UserScript==
// @name         네이버 블로그&포스트 글자수 세기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.23
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.text.counter.user.js
// @description  네이버 블로그&포스트에서 글자수 세기를 활성화합니다.
// @author       Won Choi
// @match        *://blog.naver.com/*/*
// @match        *://m.blog.naver.com/*/*
// @match        *://blog.naver.com/PostWriteForm.nhn?*
// @match        *://blog.naver.com/PostUpdateForm.nhn?*
// @match        *://blog.naver.com/PostView.nhn?*
// @match        *://m.blog.naver.com/PostView.nhn?*
// @match        *://blog.editor.naver.com/editor*
// @match        *://post.editor.naver.com/editor*
// @match        *://m.post.editor.naver.com/editor*
// @match        *://post.naver.com/viewer/postView.nhn?*
// @match        *://m.post.naver.com/viewer/postView.nhn?*
// @match        *://blog.naver.com/lib/smarteditor2/*/smart_editor2_inputarea.html
// @grant        GM_addStyle
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=3
// ==/UserScript==
async function main() {
    GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
    GM_addStyle(`
head { display: block !important; }
.se-toast-popup.content-length {
    position: fixed;
    z-index: 52;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
}
.se-toast-popup.content-length .se-toast-popup-contiainer {
    position: absolute;
    bottom: 90px;
    right: 0;
    left: 0;
    height: 0;
    margin: auto;
    text-align: center;
    font-size: 0;
}

.se-toast-popup.content-length .se-toast-popup-content {
    position: relative;
    display: inline-block;
    height: 39px;
    padding-left: 22px;
    padding-right: 22px;
    background-color: #fff;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    border-radius: 2px
}

.se-toast-popup.content-length .se-toast-popup-content.se-toast-popup-content-info {
    -webkit-box-shadow: 1px 1px 4px 0 rgba(63,144,223,.2);
    box-shadow: 1px 1px 4px 0 rgba(63,144,223,.2);
    border: 1px solid rgba(63,144,223,.5)
}

.se-toast-popup.content-length .se-toast-popup-message {
    display: inline-block; margin: 0; padding: 0; border: 0;
    height: 100%;
    font-family: se-nanumgothic,\\B098\B214\ACE0\B515,nanumgothic,sans-serif,Meiryo;
    font-size: 12px;
    vertical-align: middle;
    padding-top: 1px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    line-height:37px !important;
}

.se-toast-popup.content-length .se-toast-popup-content-info .se-toast-popup-message {
    color: #0e86fb
}
    `);

    function handler(e) {
        const sections_v2 = Array.from(document.querySelectorAll('#postViewArea, body.se2_inputarea')).map((component) => {
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
        const sections_v3 = Array.from(document.querySelectorAll('#se_components_wrapper .se_component, .se_component_wrap .se_component, .se_card_container .se_component, .__se_editor-content .se_component, .se-main-container .se-component, .se-container .se-component')).map((component) => {
            const section = {};
            const data = Array.from(component.querySelectorAll('.se_textarea, .se-text-paragraph')); section.data = data.map(el=>el.innerText || el.value || '');
            return section;
        });
        const placeholders = Array.from(document.querySelectorAll('.se_textarea, .se-text-paragraph')).map((component) => {
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
        const container = document.querySelector('head');
        const se_toast_popup = container.querySelector('.se-toast-popup.content-length') || document.createElement('div');
        const se_toast_popup_container = se_toast_popup.querySelector('.se-toast-popup-contiainer') || document.createElement('div');
        const se_toast_popup_content = se_toast_popup_container.querySelector('.se-toast-popup-content') || document.createElement('div');
        const se_toast_popup_message = se_toast_popup_content.querySelector('.se-toast-popup-message') || document.createElement('p');
        if(!se_toast_popup.className) { se_toast_popup.className = 'se-toast-popup se-toast-interaction-enter content-length'; container.append(se_toast_popup); }
        if(!se_toast_popup_container.className) { se_toast_popup_container.className = 'se-toast-popup-contiainer'; se_toast_popup.append(se_toast_popup_container); }
        if(!se_toast_popup_content.className) {
            se_toast_popup_content.className = 'se-toast-popup-content se-toast-popup-content-info'; se_toast_popup_container.append(se_toast_popup_content);
            se_toast_popup_content.addEventListener('click', () => {
                const content = sections.reduce((r, o)=>(r.push(...o.data),r), []).join('\r\n');
                prompt('', content.replace(/[\r\n\s\t]+/g, ''));
            }, false);
        }
        if(!se_toast_popup_message.className) { se_toast_popup_message.className = 'se-toast-popup-message'; se_toast_popup_message.setAttribute('role', 'alert'); se_toast_popup_content.append(se_toast_popup_message); }
        se_toast_popup_message.innerText = `글자수 : ${contentLengthTxt}자 (공백제외: ${contentLengthTrimTxt}자)`;
        //container.__toast_timer = clearTimeout(container.__toast_timer);
        //container.__toast_timer = setTimeout(() => container.removeChild(se_toast_popup), 3000);
    }
    function handler_click(e) {
        const el = e.target;
        if(el.className.includes('se_cardThumb')) handler(e);
        if(el.className.includes('se_textarea')) handler(e);
    }
    window.addEventListener('keyup', handler, false);
    window.addEventListener('keydown', handler, false);
    window.addEventListener('keypress', handler, false);
    // document.addEventListener('click', handler_click, false);
    handler();
}
function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
