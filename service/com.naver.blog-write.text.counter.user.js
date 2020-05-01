// ==UserScript==
// @name         네이버 블로그 글자수 세기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.text.counter.user.js
// @description  네이버 블로그 편집기에서 글자수 세기를 활성화합니다.
// @author       Won Choi
// @match        *://blog.naver.com/cw4196/postwrite?*
// @match        *://blog.naver.com/PostWriteForm.nhn?*
// ==/UserScript==
async function main() {
    window.addEventListener('keyup', (e)=>{
        const sections = Array.from(document.querySelectorAll('.se-container .se-component')).map((component) => {
            const section = {};
            if(component.classList.contains('se-text')) {
                const data = Array.from(component.querySelectorAll('.se-text-paragraph')); if(!data.length) return;
                section.type = 'text';
                section.data = data.map(el=>el.innerText);
            }
            if(component.classList.contains('se-quotation')) {
                const data = Array.from(component.querySelectorAll('.se-text-paragraph')); if(!data.length) return;
                section.type = 'quote';
                section.data = data.map(el=>el.innerText);
            }
            return section;
        });
        const contentLength = sections.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.length, 0), 0).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        const contentLengthTrim = sections.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.replace(/[\s]+/g, '').length, 0), 0).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        const container = document.querySelector('.se-wrap > .se-dnd-wrap');
        const container_header = container.querySelector('.se-header');
        const se_toast_popup = container.querySelector('.se-toast-popup.content-length') || document.createElement('div');
        const se_toast_popup_container = se_toast_popup.querySelector('.se-toast-popup-contiainer') || document.createElement('div');
        const se_toast_popup_content = se_toast_popup_container.querySelector('.se-toast-popup-content') || document.createElement('div');
        const se_toast_popup_message = se_toast_popup_content.querySelector('.se-toast-popup-message') || document.createElement('p');
        if(!se_toast_popup.className) { se_toast_popup.className = 'se-toast-popup se-toast-interaction-enter content-length'; container_header.after(se_toast_popup); }
        if(!se_toast_popup_container.className) { se_toast_popup_container.className = 'se-toast-popup-contiainer'; se_toast_popup.append(se_toast_popup_container); }
        if(!se_toast_popup_content.className) { se_toast_popup_content.className = 'se-toast-popup-content se-toast-popup-content-info'; se_toast_popup_container.append(se_toast_popup_content); }
        if(!se_toast_popup_message.className) { se_toast_popup_message.className = 'se-toast-popup-message'; se_toast_popup_message.setAttribute('role', 'alert'); se_toast_popup_content.append(se_toast_popup_message); }
        se_toast_popup_message.innerText = `글자수 : ${contentLength}자 (공백제외: ${contentLengthTrim}자)`;
        container.__toast_timer = clearTimeout(container.__toast_timer);
        container.__toast_timer = setTimeout(() => container.removeChild(se_toast_popup), 3000);
    }, false);
}
function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
