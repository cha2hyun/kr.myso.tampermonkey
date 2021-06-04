// ==UserScript==
// @name         스마트에디터ONE Word문서(*.docx) 내보내기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.4
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-write.save.msword.user.js
// @description  네이버 블로그 스마트에디터ONE의 편집 내용을 Word문서(*.docx)로 내보낼 수 있습니다.
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
// @connect      naver.com
// @connect      pstatic.net
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/vendor.js?v=5
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://unpkg.com/docx@6.0.3/build/index.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// ==/UserScript==
window.addEventListener("message", async ({ data, origin }) => {
    const from = (!window.GM_xmlhttpRequest) ? 'foreground' : 'background';
    if(!data || origin != location.origin || from == data.from) return;
    if(from == 'background' && data.from == 'foreground' && data.type == 'xhr') {
        const req = GM_xmlhttpRequestCORS(data.url, data.options);
        req.then ((v)=>window.postMessage({ from, type: 'xhr.resolve', token: data.token, data: v }, location.origin));
        req.catch((e)=>window.postMessage({ from, type: 'xhr.reject' , token: data.token, data: e }, location.origin));
    }
}, false);
async function GM_xmlhttpRequestCORS(url, options = { method: 'GET' }) {
    const from = (!window.GM_xmlhttpRequest) ? 'foreground' : 'background';
    if(from == 'foreground') {
        return new Promise((resolve, reject) => {
            const token = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            function callback({ data, origin }) {
                if(!data || origin != location.origin || from == data.uuid || token != data.token) return;
                if(from == 'foreground' && data.from == 'background' && data.type == 'xhr.resolve') {
                    window.removeEventListener("message", callback); resolve(data.data);
                }
                if(from == 'foreground' && data.from == 'background' && data.type == 'xhr.reject') {
                    window.removeEventListener("message", callback); reject(data.data);
                }
            }
            window.addEventListener("message", callback, false);
            window.postMessage({ type: 'xhr', token, from, url, options }, location.origin);
        });
    }
    if(from == 'background') {
        const resp = await new Promise((resolve, reject) => { GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options)); });
        return resp && resp.response;
    }
}
// 블로그분석
async function request2(url, options = { method: 'GET' }) { return new Promise((resolve, reject) => { GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options)); }); }
async function request2_blog(blogId, action, params = {}) {
    const referer = `https://m.blog.naver.com/${blogId}`;
    const uri = new URL(`https://m.blog.naver.com/rego/${action}.naver?blogId=${blogId}`); _.map(params, (v, k) => uri.searchParams.set(k, v));
    const res = await request2(uri.toString(), { headers: { referer } });
    const data = eval(`('${res.responseText})`);
    return data && data.result;
}
// ------------------------------------
function transformComponent(component) {
    const section = {};
    if(component.classList.contains('se-documentTitle')) {
        section.type = 'title';
        section.text = Array.from(component.querySelectorAll('.se-text-paragraph')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-text')) {
        section.type = 'text';
        section.text = Array.from(component.querySelectorAll('.se-text-paragraph')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-image')) {
        section.type = 'image';
        section.image = Array.from(component.querySelectorAll('.se-image-resource')).map(el=>el.src || '');
        section.description = Array.from(component.querySelectorAll('.se-text-paragraph')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-imageStrip')) {
        section.type = 'image';
        section.image = Array.from(component.querySelectorAll('.se-image-resource')).map(el=>el.src || '');
        section.description = Array.from(component.querySelectorAll('.se-text-paragraph')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-video')) {
        section.type = 'video';
        section.image = Array.from(component.querySelectorAll('.se-video-thumbnail-resource')).map(el=>el.src || '');
        section.time = Array.from(component.querySelectorAll('.se-video-time')).map(el=>el.innerText || el.value || '');
        section.title = Array.from(component.querySelectorAll('.se-video-title-text')).map(el=>el.innerText || el.value || '');
        section.description = Array.from(component.querySelectorAll('.se-video-description')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-horizontalLine')) {
        section.type = 'line';
    }
    if(component.classList.contains('se-sticker')) {
        section.type = 'sticker';
        section.image = Array.from(component.querySelectorAll('.se-sticker-image')).map(el=>el.src || '');
    }
    if(component.classList.contains('se-quotation')) {
        section.type = 'quotation';
        section.title = Array.from(component.querySelectorAll('.se-quote .se-text-paragraph')).map(el=>el.innerText || el.value || '');
        section.description = Array.from(component.querySelectorAll('.se-cite .se-text-paragraph')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-placesMap')) {
        section.type = 'places';
        section.image = Array.from(component.querySelectorAll('.se-map-image')).map(el=>el.src || '');
        section.location = Array.from(component.querySelectorAll('.se-map-info')).map(el=>{
            const name = Array.from(el.querySelectorAll('.se-map-title')).map(el=>el.innerText || el.value || '');
            const addr = Array.from(el.querySelectorAll('.se-map-address')).map(el=>el.innerText || el.value || '');
            return { name, addr }
        });
    }
    if(component.classList.contains('se-oglink')) {
        section.type = 'link';
        section.image = Array.from(component.querySelectorAll('.se-oglink-thumbnail-resource')).map(el=>el.src || '');
        section.title = Array.from(component.querySelectorAll('.se-oglink-title')).map(el=>el.innerText || el.value || '');
        section.description = Array.from(component.querySelectorAll('.se-oglink-summary')).map(el=>el.innerText || el.value || '');
        section.hostname = Array.from(component.querySelectorAll('.se-oglink-url')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-file')) {
        section.type = 'file';
        section.name = Array.from(component.querySelectorAll('.se-file-name')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-schedule')) {
        section.type = 'schedule';
        section.title = Array.from(component.querySelectorAll('.se-schedule-title')).map(el=>el.innerText || el.value || '');
        section.sdate = Array.from(component.querySelectorAll('.se-schedule-duration-start')).map(el=>el.childNodes[0].nodeValue);
        section.edate = Array.from(component.querySelectorAll('.se-schedule-duration-end')).map(el=>el.childNodes[0].nodeValue);
        section.image = Array.from(component.querySelectorAll('.se-map-image')).map(el=>el.src || '');
        section.location = Array.from(component.querySelectorAll('.se-map-info')).map(el=>{
            const name = Array.from(el.querySelectorAll('.se-map-title')).map(el=>el.innerText || el.value || '');
            const addr = Array.from(el.querySelectorAll('.se-map-address')).map(el=>el.innerText || el.value || '');
            return { name, addr }
        });
        section.url = Array.from(component.querySelectorAll('.se-schedule-url')).map(el=>el.innerText || el.value || '');
        section.description = Array.from(component.querySelectorAll('.se-schedule-description')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-code')) {
        section.type = 'code';
        section.text = Array.from(component.querySelectorAll('.se-code-source')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-table')) {
        section.type = 'table';
        section.table = Array.from(component.querySelectorAll('.se-table-content')).map(el=>{
            function parseTable(el) {
                const rows = Array.from(el.querySelectorAll('tr')).map(el=>{
                    const cols = Array.from(el.querySelectorAll('td, th')).map(el=>{
                        const colspan = el.colspan || 1, rowspan = el.rowspan || 1;
                        const content = Array.from(el.querySelectorAll('.se-inline-image-resource, .se-text-paragraph')).map(el=>{
                            const item = {};
                            if(el.classList.contains('se-inline-image-resource')) {
                                item.type = 'image';
                                item.image = el.src || '';
                            }
                            if(el.classList.contains('se-text-paragraph')) {
                                item.type = 'text';
                                item.text = el.innerText || el.value || '';
                            }
                            return item;
                        });
                        return { colspan, rowspan, content };
                    });
                    return cols;
                });
                return rows;
            }
            const thead = Array.from(el.querySelectorAll('thead')).map(parseTable)[0];
            const tbody = Array.from(el.querySelectorAll('tbody')).map(parseTable)[0];
            return { thead, tbody };
        })[0];
    }
    if(component.classList.contains('se-formula')) {
        section.type = 'formula';
        section.text = Array.from(component.querySelectorAll('.mq-selectable')).map(el=>el.innerText || el.value || '');
    }
    if(component.classList.contains('se-talktalk')) {
        section.type = 'talktalk';
        section.text = Array.from(component.querySelectorAll('.se-talktalk-banner-text')).map(el=>el.innerText || el.value || '');
    }
    return section;
}
function transformContent(target, info) {
    const clipContent = target.querySelector('#__clipContent'); if(clipContent) { target = new DOMParser().parseFromString(clipContent.textContent, 'text/html'); }
    const sections = Array.from(target.querySelectorAll('#se_components_wrapper .se_component, .se_component_wrap .se_component, .se_card_container .se_component, .__se_editor-content .se_component, .se-main-container .se-component, .se-container .se-component')).map(transformComponent);
    return { info, sections }
}
async function transformDocument(content) {
    const container = (children) => {
        const width = { size: 9010, type: docx.WidthType.DXA };
        const borders = {
            top: { size: 1, color: "F6F6F5", style: docx.BorderStyle.DASH_SMALL_GAP },
            bottom: { size: 1, color: "F6F6F5", style: docx.BorderStyle.DASH_SMALL_GAP },
            left: { size: 1, color: "F6F6F5", style: docx.BorderStyle.DASH_SMALL_GAP },
            right: { size: 1, color: "F6F6F5", style: docx.BorderStyle.DASH_SMALL_GAP }
        };
        const col = new docx.TableCell({ width, borders, children });
        const row = new docx.TableRow({ children: [col] });
        return new docx.Table({ columnWidths: [9010], rows: [row] });
    };
    const container_image_blob = async (image) => {
        if(/^data:/.test(image)) {
            const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
                const byteCharacters = atob(b64Data);
                const byteArrays = [];
                for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    const slice = byteCharacters.slice(offset, offset + sliceSize);
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                const blob = new Blob(byteArrays, {type: contentType});
                return blob;
            }
            const match = /^data:(?<mime>[\w/\-\.\+]+);(?<encoding>\w+),(?<data>.*)$/.exec(image);
            return b64toBlob(match.groups.data, match.groups.mime);
        }else{
            return GM_xmlhttpRequestCORS(image, { responseType: 'blob' });
        }
    }
    const container_image = async (image, ratio = 1) => {
        const blob = await container_image_blob(image).catch(e=>null);
        if(blob) {
            return new Promise((resolve, reject) => {
                const orl = URL.createObjectURL(blob);
                const img = new Image();
                img.onerror = () => {
                    URL.revokeObjectURL(orl);
                    reject();
                };
                img.onload = () => {
                    const w = Math.floor((img.width || screen.width) * ratio);
                    const h = Math.floor((img.height || screen.height) * ratio);
                    const resp = new docx.Paragraph({ children: [ new docx.ImageRun({ data: blob, transformation: { width: w, height: h } }), ], alignment: docx.AlignmentType.CENTER });
                    URL.revokeObjectURL(orl);
                    resolve(resp);
                }
                img.src = orl;
            });
        } else {
            return new docx.Paragraph({ children: [ new docx.TextRun({ text: `<IMAGE LOAD ERROR: ${image}>` }), ], alignment: docx.AlignmentType.CENTER });
        }
    }
    const newline = new docx.Paragraph({ children: [], });
    const divider = new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, text: '──────────────────────────────────────────', });
    const items = await Promise.map(content.sections, async (item)=>{
        const children = [];
        if(item.type == 'title') {
            const items = _.zip(item.text);
            const convs = await Promise.map(items, async ([ text ]) => {
                return new docx.Paragraph({ children: [ new docx.TextRun({ text, bold: 1, size: 32 }) ] });
            });
            children.push(...convs.flat());
        }
        if(item.type == 'text') {
            const items = _.zip(item.text);
            const convs = await Promise.map(items, async ([ text ]) => {
                return new docx.Paragraph({ children: [ new docx.TextRun({ text }) ] });
            });
            children.push(...convs.flat());
        }
        if(item.type == 'image') {
            const image = await Promise.map(item.image, async (image) => {
                return [
                    await container_image(image),
                ];
            });
            children.push(...image.flat());
            const description = await Promise.map(item.description, async (description) => {
                return [
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: description }) ], alignment: docx.AlignmentType.CENTER, }),
                ];
            });
            children.push(...description.flat());
        }
        if(item.type == 'video') {
            const items = _.zip(item.image, item.title, item.description, item.time);
            const convs = await Promise.map(items, async ([ image, title, description, time ]) => {
                return [
                    await container_image(image),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: title, bold: 1 }) ] }),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: time }) ] }),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: description }) ] }),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'line') {
            children.push(divider);
        }
        if(item.type == 'sticker') {
            const items = _.zip(item.image, item.title, item.description, item.time);
            const convs = await Promise.map(items, async ([ image, title, description, time ]) => {
                return [
                    await container_image(image),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'quotation') {
            const items = _.zip(item.title, item.description);
            const convs = await Promise.map(items, async ([ title, description ]) => {
                return [
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: title, bold: 1, size: 22 }) ] }),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: description }) ] }),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'places') {
            const image = await Promise.map(item.image, async (image) => {
                return [
                    await container_image(image),
                ];
            });
            children.push(...image.flat());
            const location = await Promise.map(item.location, async (item) => {
                const items = _.zip(item.name, item.addr);
                const convs = await Promise.map(items, async ([ name, addr ]) => {
                    return [
                        new docx.Paragraph({ children: [ new docx.TextRun({ text: `장소: ${name}`, bold: 1 }) ] }),
                        new docx.Paragraph({ children: [ new docx.TextRun({ text: `주소: ${addr}` }) ] }),
                    ];
                });
                return container(convs.flat());
            });
            children.push(...location.flat());
        }
        if(item.type == 'link') {
            const items = _.zip(item.image, item.title, item.description, item.hostname);
            const convs = await Promise.map(items, async ([ image, title, description, hostname ]) => {
                return [
                    await container_image(image),
                    new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [ new docx.TextRun({ text: hostname }) ] }),
                    new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [ new docx.TextRun({ text: title, bold: 1 }) ] }),
                    new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [ new docx.TextRun({ text: description }) ] }),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'file') {
            const items = _.zip(item.name);
            const convs = await Promise.map(items, async ([ name ]) => {
                return [
                    new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [ new docx.TextRun({ text: `<파일명: ${ name }>` }) ] }),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'schedule') {
            const items = _.zip(item.title, item.sdate, item.edate, item.image, item.url, item.description);
            const convs = await Promise.map(items, async ([ title, sdate, edate, image, url, description ]) => {
                return [
                    await container_image(image),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: `이름: ${title}`, bold: 1 }) ] }),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: `설명: ${description}` }) ] }),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: `일정: ${sdate} ~ ${edate}` }) ] }),
                    new docx.Paragraph({ children: [ new docx.TextRun({ text: `링크: ${url}` }) ] }),

                ];
            });
            children.push(...convs.flat());
            const location = await Promise.map(item.location, async (item) => {
                const items = _.zip(item.name, item.addr);
                const convs = await Promise.map(items, async ([ name, addr ]) => {
                    return [
                        new docx.Paragraph({ children: [ new docx.TextRun({ text: `장소: ${name}`, bold: 1 }) ] }),
                        new docx.Paragraph({ children: [ new docx.TextRun({ text: `주소: ${addr}` }) ] }),
                    ];
                });
                return convs.flat();
            });
            children.push(container(location.flat()));
        }
        if(item.type == 'table' && item.table) {
            const width = { size: 9010, type: docx.WidthType.DXA };
            const borders = {
                top: { size: 1, color: "0000FF", style: docx.BorderStyle.DASH_SMALL_GAP },
                bottom: { size: 1, color: "0000FF", style: docx.BorderStyle.DASH_SMALL_GAP },
                left: { size: 1, color: "0000FF", style: docx.BorderStyle.DASH_SMALL_GAP },
                right: { size: 1, color: "0000FF", style: docx.BorderStyle.DASH_SMALL_GAP }
            };
            const rows = [];
            const rows_appends = async (items, row) => {
                if(!items) return [];
                const children = await Promise.map(items, async (row) => {
                    const children = await Promise.map(row, async (col) => {
                        const children = await Promise.map(col.content, async (item)=>{
                            if(item.type == 'text') return new docx.Paragraph({ children: [ new docx.TextRun({ text: item.text }) ] });
                            if(item.type == 'image') return container_image(item.image, 0.2);
                        });
                        return new docx.TableCell({ width, borders, children });
                    });
                    return new docx.TableRow({ children });
                });
                return children;
            };
            rows.push(...await rows_appends(item.table.thead));
            rows.push(...await rows_appends(item.table.tbody));
            console.log(rows);
            const table = new docx.Table({ columnWidths: [9010], rows });
            children.push(table);
        }
        if(item.type == 'code') {
            const items = _.zip(item.text);
            const convs = await Promise.map(items, async ([ text ]) => {
                const lines = text.split(/[\r\n]+/g).map(r=>r.trim());
                return [
                    ...lines.map((line) => new docx.Paragraph({ children: [ new docx.TextRun({ text: line }) ] })),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'formula') {
            const items = _.zip(item.text);
            const convs = await Promise.map(items, async ([ text ]) => {
                return [
                    new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [ new docx.TextRun({ text: `<수식: ${ text }>`, bold: 1 }) ] }),
                ];
            });
            children.push(...convs.flat());
        }
        if(item.type == 'talktalk') {
            const items = _.zip(item.text);
            const convs = await Promise.map(items, async ([ text ]) => {
                return [
                    new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [ new docx.TextRun({ text: `<톡톡: ${ text }>`, bold: 1 }) ] }),
                ];
            });
            children.push(...convs.flat());
        }
        return children.length && container(children.flat());
    });
    const children = items.filter(v=>!!v).flat();
    const properties = {};
    // metadata
    const head = content.sections.find(o=>o.type == 'title');
    const meta = {};
    meta.subject = content.info.blog.blogDirectoryName;
    meta.creator = meta.lastModifiedBy = content.info.blog.displayNickName;
    meta.title = head ? head.text.join(', ') : '알 수 없는 문서';
    meta.keywords = `naver; blog; post; 네이버; 블로그; 네이버블로그; 포스팅; ${content.info.user.nickname} ;${content.info.user.userId}`;
    meta.description = '개발자 최원의 프로그램을 이용해 저장된 문서입니다.\r\nhttps://tampermonkey.myso.kr/';
    meta.sections = [ { children, properties } ];
    return meta;
}
async function main() {
    GM_donation('#viewTypeSelector, #postListBody, #wrap_blog_rabbit, #writeTopArea, #editor_frame', 0);
    GM_addScript('https://unpkg.com/docx@6.0.3/build/index.js');
    GM_addScript('https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js');
    GM_addScript('https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js');
    GM_addScript('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js');
    GM_addScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
    GM_addScript(`()=>{ window.GM_xmlhttpRequestCORS = ${GM_xmlhttpRequestCORS}; }`);
    GM_addStyle(`
    @keyframes spin1 { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
    .se-utils > ul > li > button { margin-top: 14px !important; }
    .se-util-button-docx::before {
      display: inline-block; width: 37px; height: 37px;
      line-height: 40px; text-align: center; font-size: 16px; color: #666;
      content: '\\1F4BE' !important;
    }
    .se-utils-item-docx-loading .se-util-button-docx::before { animation: spin1 2s infinite linear; }
    .se-utils-item-docx[data-process-keyword-info]::after {
      display: none; position: absolute; z-index: -1; margin:auto; right: 20px; top: -240px; bottom: 0px; margin-bottom: 10px;
      padding: 15px; width: 300px; height: auto; overflow-y: auto; white-space: pre-line;
      border: 1px solid #ddd; border-radius: 8px; background-color: #fff;
      content: attr(data-process-keyword-info); line-height: 1.5rem;
    }
    .se-utils-item-docx[data-process-keyword-info]:hover::after { display: block; }
    `);
    const uri = new URL(location.href), params = Object.fromEntries(uri.searchParams.entries());
    const user = await request2_blog('', 'BlogUserInfo'); if(!user) return;
    const blog = await request2_blog(user.userId, 'BlogInfo'); if(!blog) return;
    async function handler(e) {
        const mnu = document.querySelector('.se-ultils-list');
        if(mnu) {
            const wrp = mnu.querySelector('.se-utils-item.se-utils-item-docx') || document.createElement('li'); wrp.classList.add('se-utils-item', 'se-utils-item-docx'); mnu.prepend(wrp);
            const btn = wrp.querySelector('button') || document.createElement('button'); btn.classList.add('se-util-button', 'se-util-button-docx'); btn.innerHTML = '<span class="se-utils-text">Word 문서로 저장</span>'; wrp.append(btn);
            if(!window.__processing_content) {
                wrp.classList.toggle('se-utils-item-docx-loading', window.__processing_content = true);
                btn.onclick = async function(){
                    const adblocked = await GM_detectAdBlock(v=>v);
                    if(adblocked) {
                        const cfrm = confirm('광고 차단 플러그인이 발견 되었습니다!\n브라우저의 광고 차단 설정을 해제해주세요.\n\n개발자 최원의 모든 프로그램은\n후원 및 광고 수익을 조건으로 무료로 제공됩니다.\n\nhttps://blog.naver.com/cw4196\n후원계좌 : 최원 3333-04-6073417 카카오뱅크');
                        if(cfrm) window.open('https://in.naverpp.com/donation');
                    } else {
                        let imgs;
                        do {
                            const cnt = document.querySelector('.se-content');
                            cnt.scrollTo({ top: 0 });
                            cnt.scrollTo({ top: cnt.scrollHeight, behavior: 'smooth' });
                            imgs = Array.from(cnt.querySelectorAll('img[src^="data:"]'));
                            await Promise.delay(1000);
                        } while (imgs.length);
                        const data = transformContent(document, { user, blog });
                        const json = JSON.stringify(data);
                        GM_addScript(`async () => {
                          try {
                            let __transformContent = ${json};
                            let __transformDocument = ${transformDocument};
                            let __transformOpts = await __transformDocument(__transformContent);
                            let __transformDocx = new docx.Document(__transformOpts);
                            let __transformBlob = await docx.Packer.toBlob(__transformDocx);
                            let head = __transformContent.sections.find(o=>o.type == 'title');
                            let name = head ? head.text.join(', ') : '알 수 없는 문서';
                            saveAs(__transformBlob, name+'.docx');
                            console.log("Document created successfully");
                          }catch(e){ console.log(e); }
                        }`);
                    }
                }
                wrp.classList.toggle('se-utils-item-docx-loading', window.__processing_content = false);
            }
        }
    }
    window.addEventListener('keyup', handler, false);
    window.addEventListener('keydown', handler, false);
    window.addEventListener('keypress', handler, false);
    handler();
}
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);
