// ==UserScript==
// @name         네이버 블로그&포스트 키워드 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.keyword.counter.user.js
// @description  네이버 블로그&포스트 작성 중 포함된 키워드를 분석합니다.
// @author       Won Choi
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @match        *://blog.naver.com/*/postwrite*
// @match        *://blog.naver.com/PostWriteForm.nhn?*
// @match        *://blog.naver.com/PostUpdateForm.nhn?*
// @match        *://blog.editor.naver.com/editor*
// @match        *://post.editor.naver.com/editor*
// @match        *://m.post.editor.naver.com/editor*
// @match        *://blog.naver.com/lib/smarteditor2/*/smart_editor2_inputarea.html
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==
async function request(url, options = { method: 'GET' }) { return new Promise((resolve, reject) => { GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options)); }); }
async function nx_request_xhr(keyword) {
    const uri = new URL('https://s.search.naver.com/p/blog/search.naver?where=m_view&query=&main_q=&mode=normal&ac=1&aq=0&spq=0'); uri.search = location.search;
    uri.searchParams.set('query', keyword);
    uri.searchParams.set('main_q', keyword);
    uri.searchParams.set('mode', 'normal');
    uri.searchParams.delete('api_type');
    uri.searchParams.delete('mobile_more');
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({ method: 'GET', url: uri.toString(), onerror: reject, onload: resolve, });
    });
}
async function nx_request(keyword) {
    const res = await nx_request_xhr(keyword);
    const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
    const map = Array.from(doc.body.childNodes).filter(el=>el.nodeType == 8).map((nx) => Array.from(nx.nodeValue.matchAll(/^(?<k>[^\s\:]+)([\s\:]+)?(?<v>.*)$/igm)).map(o=>Object.assign({}, o.groups))).flat();
    const ret = map.reduce((r, { k, v }) => {
        if(typeof v === 'string' && v.includes(',')) v = v.split(',').map(r=>r.split(',').map(v=>decodeURIComponent(v).split(':').map(v=>decodeURIComponent(v))));
        if(typeof v === 'string' && v.includes('|')) v = v.split('|').map(r=>r.split(':').map(v=>decodeURIComponent(v)));
        if(typeof v === 'string' && v.includes(':')) v = v.split(':').map(v=>decodeURIComponent(v));
        if(typeof v === 'string') v = decodeURIComponent(v);
        return (r[k] = v, r);
    }, {});
    return ret;
}
async function nx_terms(keyword) {
    const res = await nx_request(keyword).catch(e=>null);
    return _.flattenDeep(_.get(res, 'terms', []));
}
async function process_content(target) {
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
    const section = [].concat(sections_v2, sections_v3);
    const placeholders = Array.from(target.querySelectorAll('.se_textarea, .se-text-paragraph')).map((component) => {
        const section = {};
        const data = Array.from(component.querySelectorAll('.se-placeholder')); section.data = data.map(el=>el.innerText || el.value || '');
        return section;
    });

    const contentV2 = sections_v2.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l, ''), ''), contentV2Trim = contentV2.replace(/[\s]+/g, '');
    const contentV2Length = contentV2.length, contentV2LengthTrim = contentV2Trim.length;
    const contentV3 = sections_v3.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l, ''), ''), contentV3Trim = contentV3.replace(/[\s]+/g, '');
    const contentV3Length = contentV3.length, contentV3LengthTrim = contentV3Trim.length;

    const content = contentV2 + contentV3;
    const contentTrim = contentV2Trim + contentV3Trim;
    const contentLength = contentV2Length + contentV3Length;
    const contentLengthTrim = contentV2LengthTrim + contentV3LengthTrim;
    const placeholderLength = Number(placeholders.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.length, 0), 0));
    const placeholderLengthTrim = Number(placeholders.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.replace(/[\s]+/g, '').length, 0), 0));

    const contentLengthTxt = String(contentLength-placeholderLength).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    const contentLengthTrimTxt = String(contentLengthTrim-placeholderLengthTrim).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

    return { section, content, contentTrim, contentLengthTxt, contentLengthTrimTxt }
}
async function main() {
    GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
    GM_addStyle(`
    @keyframes spin1 { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
    .se-util-button-device-desktop { margin-top: 14px; }
    .se-util-button-keywords::before {
      display: inline-block; width: 37px; height: 37px;
      line-height: 40px; text-align: center; font-size: 18px; color: #666;
      content: '\\2049\\FE0F' !important;
    }
    .se-utils-item-keywords-loading .se-util-button-keywords::before { animation: spin1 2s infinite linear; }
    .se-utils-item-keywords[data-process-keyword-info]::after {
      display: none; position: absolute; z-index: -1; margin:auto; right: 20px; top: -240px; bottom: 0px; margin-bottom: 10px;
      padding: 15px; width: 300px; height: auto; overflow-y: auto; white-space: pre-line;
      border: 1px solid #ddd; border-radius: 8px; background-color: #fff;
      content: attr(data-process-keyword-info); line-height: 1.5rem;
    }
    .se-utils-item-keywords[data-process-keyword-info]:hover::after { display: block; }
    `);
    async function handler(e) {
        const mnu = document.querySelector('.se-ultils-list');
        if(mnu) {
            const wrp = mnu.querySelector('.se-utils-item.se-utils-item-keywords') || document.createElement('li'); wrp.classList.add('se-utils-item', 'se-utils-item-keywords'); mnu.prepend(wrp);
            const btn = wrp.querySelector('button') || document.createElement('button'); btn.classList.add('se-util-button', 'se-util-button-keywords'); btn.innerHTML = '<span class="se-utils-text">키워드 분석</span>'; wrp.append(btn);
            if(!window.__processing_content) {
                wrp.classList.toggle('se-utils-item-keywords-loading', window.__processing_content = true);
                const { section } = await process_content(document);
                const lines = _.reduce(section, (r,o)=>r.concat(o.data), []);
                const block = _.reduce(lines, (r, o)=>r.concat(o.split(/[\s]+/g)), []);
                const chunk = _.chunk(block, 5);
                const parse = await Promise.map(chunk, (block) => nx_terms(block.join(' ')), { concurrency: 10 });
                const words = _.flattenDeep(parse), uniqs = _.uniq(words);
                const count = _.orderBy(_.map(uniqs, (keyword)=>({ keyword, count: words.filter(v=>v==keyword).length })), 'count', 'desc');
                const valid = _.filter(count, (o)=>o.count > 1);
                wrp.dataset.processKeywordInfo = _.map(valid, o=>`${o.keyword} (${o.count})`).join('\n');
                wrp.classList.toggle('se-utils-item-keywords-loading', window.__processing_content = false);
            }
        }
    }
    async function handler_click(e) {
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
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);
