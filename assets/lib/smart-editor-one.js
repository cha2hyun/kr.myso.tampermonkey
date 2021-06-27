(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window) {
    function get_text(el) { return el.value || el.innerText || el.nodeValue || ''; }
    function get_placeholder(el) { return el.placeholder || (el.querySelectorAll ? Array.from(el.querySelectorAll('.se-placeholder, se_editable.is-empty')).map(get_text).join('') : ''); }
    function get_text_without_placeholder(el) { return get_text(el).replace(get_placeholder(el), ''); }
    window.SE_componentParseV2 = function SE_componentParseV2(component, offset = 0) {
        // SE 2.0
        function decodeJSON(json) { try { return eval(`(${json})`); } catch(e) {} }
        function componentTypeOf(component, ...types) {
            return types.reduce((r, T)=>r || (component instanceof T), false);
        }
        function componentParse(component, root) {
            if(root || (component.childNodes && component.childNodes.length)) {
                return Array.from(component.childNodes).map((component)=>componentParse(component)).filter(v=>!!v).flat();
            }
            const section = { type: '', offset, version: 2 }; if(!component) return section;
            if(component.classList && component.classList.contains('__se_object')) {
                const json = decodeURIComponent(component.getAttribute('jsonvalue') || '');
                const data = decodeJSON(json);
                Object.assign(section, data);
                if(component instanceof HTMLImageElement) {
                    section.type = 'image';
                    section.image = [component.src || ''];
                }
            } else if(component instanceof HTMLHRElement) {
                section.type = 'line';
            } else if(componentTypeOf(component, Text)){
                section.type = 'text';
                section.text = [get_text_without_placeholder(component)];
            }
            return section;
        }
        return componentParse(component, true);
    }
    window.SE_componentParseV3 = function SE_componentParseV3(component, offset = 0) {
        const section = { type: '', offset, version: 3 }; if(!component) return section;
        // SE 3.0
        if(component.classList.contains('se_documentTitle')) {
            section.type = 'title';
            section.text = Array.from(component.querySelectorAll('.se_textarea')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se_textarea')).map(get_placeholder);
        }
        if(component.previousSibling && component.previousSibling.classList.contains('se_wrapping_slot')) {
            section.type = 'text';
            section.text = [get_text_without_placeholder(component)];
        }
        if(component.classList.contains('se_paragraph') || component.classList.contains('se_textarea')) {
            section.type = 'text';
            if(component.classList.contains('se_textarea')) {
                section.text = [get_text_without_placeholder(component)];
            } else if(component.classList.contains('paragraph_wrapping')) {
                const section1 = Object.assign({}, section, SE_componentParseV3(component.querySelector('.se_wrapping_slot .se_subComponent'), offset));
                const section2 = Object.assign({}, section, SE_componentParseV3(component.querySelector('.se_wrapping_slot + *'), offset));
                return [section1, section2];
            } else {
                section.text = Array.from(component.querySelectorAll('.se_textarea')).map(get_text_without_placeholder);
            }
        }
        if(component.classList.contains('se_image') || component.classList.contains('se_imageStrip') || component.classList.contains('se_subComponent_image')) {
            section.type = 'image';
            section.image = Array.from(component.querySelectorAll('.se_mediaImage')).map(el=>el.src || '');
            section.description = Array.from(component.querySelectorAll('.se_textarea')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se_textarea')).map(get_placeholder);
        }
        if(component.classList.contains('se_video')) {
            section.type = 'video';
            section.image = Array.from(component.querySelectorAll('.se_mediaArea > img')).map(el=>el.src || '');
            section.description = Array.from(component.querySelectorAll('.se-video-description')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se_horizontalLine')) {
            section.type = 'line';
        }
        if(component.classList.contains('se_sticker')) {
            section.type = 'sticker';
            section.image = Array.from(component.querySelectorAll('.se_sticker_area > img')).map(el=>el.src || '');;
        }
        if(component.classList.contains('se_quotation') || component.classList.contains('se_subComponent_quotation')) {
            section.type = 'quotation';
            section.title = Array.from(component.querySelectorAll('.se_textarea')).map(get_text_without_placeholder);
            section.description = [];
            section.placeholder = Array.from(component.querySelectorAll('.se_textarea')).map(get_placeholder);
        }
        if(component.classList.contains('se_map')) {
            section.type = 'places';
            section.image = Array.from(component.querySelectorAll('.se_mapImage')).map(el=>el.src || '');
            section.location = Array.from(component.querySelectorAll('.se_map_article')).map(el=>{
                const name = Array.from(el.querySelectorAll('.se_title')).map(get_text_without_placeholder);
                const addr = Array.from(el.querySelectorAll('.se_address')).map(get_text_without_placeholder);
                return { name, addr }
            });
        }
        if(component.classList.contains('se_oglink')) {
            section.type = 'link';
            section.image = Array.from(component.querySelectorAll('.se_og_thumb > img')).map(el=>el.src || '');
            section.title = Array.from(component.querySelectorAll('.se_og_tit')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se_og_desc')).map(get_text_without_placeholder);
            section.hostname = Array.from(component.querySelectorAll('.se_og_cp')).map(get_text_without_placeholder);
        }
        if(component.classList.contains('se_audio')) {
            section.type = 'file';
            section.name = Array.from(component.querySelectorAll('.se_audio_name')).map(get_text_without_placeholder);
        }
        if(component.classList.contains('se_schedule')) {
            section.type = 'schedule';
            section.title = Array.from(component.querySelectorAll('.se_schedule_titWrap')).map(get_text_without_placeholder);
            section.sdate = Array.from(component.querySelectorAll('.se_schedule_dateGroup')).map((el)=>get_text(el).split('~')[0]);
            section.edate = Array.from(component.querySelectorAll('.se_schedule_dateGroup')).map((el)=>get_text(el).split('~')[1]);
            section.image = Array.from(component.querySelectorAll('.se_mapImage')).map(el=>el.src || '');
            section.location = Array.from(component.querySelectorAll('.se_schedule_place')).map(el=>{
                const name = get_text_without_placeholder(el);
                const addr = '(알 수 없음)';
                return { name, addr }
            });
            section.url = Array.from(component.querySelectorAll('.se_schedule_link')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se_schedule_detailTxt')).map(get_text_without_placeholder);
        }
        if(component.classList.contains('se_code')) {
            section.type = 'code';
            section.text = Array.from(component.querySelectorAll('.se_textarea.se_code')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se_textarea.se_code')).map(get_placeholder);
        }
        if(component.classList.contains('se_table')) {
            section.type = 'table';
            section.table = Array.from(component.querySelectorAll('.se_table_col')).map(el=>{
                function parseTable(el) {
                    const rows = Array.from(el.querySelectorAll('tr')).map(el=>{
                        const cols = Array.from(el.querySelectorAll('td, th')).map(el=>{
                            const colspan = parseInt(el.getAttribute('colspan') || 1), rowspan = parseInt(el.getAttribute('rowspan') || 1);
                            const content = Array.from(el.querySelectorAll('.se_cellArea')).map(el=>{
                                const item = {};
                                item.type = 'text';
                                item.text = el.innerText || el.value || '';
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
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se_subjectMatter')) {
            section.type = 'material';
            section.image = Array.from(component.querySelectorAll('.subjectMatter_thumb > img')).map(el=>el.src || '');
            section.title = Array.from(component.querySelectorAll('.subjectMatter_title')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.subjectMatter_info_title, .subjectMatter_info_text')).map(get_text_without_placeholder);
        }
        return section;
    }
    window.SE_componentParseV4 = function SE_componentParseV4(component, offset = 0) {
        const section = { type: '', offset, version: 4 }; if(!component) return section;
        // SE 4.0
        if(component.classList.contains('se-documentTitle')) {
            section.type = 'title';
            section.text = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-wrappingParagraph')) {
            const section1 = Object.assign({}, section, SE_componentParseV4(component.querySelector('.se-component-slot.se-component-slot-float .se-section'), offset));
            const section2 = Object.assign({}, section, SE_componentParseV4(component.querySelector('.se-component-slot:not(.se-component-slot-float) .se-section'), offset));
            return [section1, section2];
        }
        if(component.classList.contains('se-text') || component.classList.contains('se-section-text')) {
            section.type = 'text';
            section.text = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-image') || component.classList.contains('se-section-image')) {
            section.type = 'image';
            section.image = Array.from(component.querySelectorAll('.se-image-resource')).map(el=>el.src || '');
            section.description = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-imageStrip')) {
            section.type = 'image';
            section.image = Array.from(component.querySelectorAll('.se-image-resource')).map(el=>el.src || '');
            section.description = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-video')) {
            section.type = 'video';
            section.image = Array.from(component.querySelectorAll('.se-video-thumbnail-resource')).map(el=>el.src || '');
            section.time = Array.from(component.querySelectorAll('.se-video-time')).map(get_text_without_placeholder);
            section.title = Array.from(component.querySelectorAll('.se-video-title-text')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se-video-description')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-horizontalLine')) {
            section.type = 'line';
        }
        if(component.classList.contains('se-sticker')) {
            section.type = 'sticker';
            section.image = Array.from(component.querySelectorAll('.se-sticker-image')).map(el=>el.src || '');
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-quotation') || component.classList.contains('se-section-quotation')) {
            section.type = 'quotation';
            section.title = Array.from(component.querySelectorAll('.se-quote .se-text-paragraph')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se-cite .se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-placesMap')) {
            section.type = 'places';
            section.image = Array.from(component.querySelectorAll('.se-map-image')).map(el=>el.src || '');
            section.location = Array.from(component.querySelectorAll('.se-map-info')).map(el=>{
                const name = Array.from(el.querySelectorAll('.se-map-title')).map(get_text_without_placeholder);
                const addr = Array.from(el.querySelectorAll('.se-map-address')).map(get_text_without_placeholder);
                return { name, addr }
            });
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-oglink')) {
            section.type = 'link';
            section.image = Array.from(component.querySelectorAll('.se-oglink-thumbnail-resource')).map(el=>el.src || '');
            section.title = Array.from(component.querySelectorAll('.se-oglink-title')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se-oglink-summary')).map(get_text_without_placeholder);
            section.hostname = Array.from(component.querySelectorAll('.se-oglink-url')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-file')) {
            section.type = 'file';
            section.name = Array.from(component.querySelectorAll('.se-file-name')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-schedule')) {
            section.type = 'schedule';
            section.title = Array.from(component.querySelectorAll('.se-schedule-title')).map(get_text_without_placeholder);
            section.sdate = Array.from(component.querySelectorAll('.se-schedule-duration-start')).map(el=>el.childNodes[0].nodeValue);
            section.edate = Array.from(component.querySelectorAll('.se-schedule-duration-end')).map(el=>el.childNodes[0].nodeValue);
            section.image = Array.from(component.querySelectorAll('.se-map-image')).map(el=>el.src || '');
            section.location = Array.from(component.querySelectorAll('.se-map-info')).map(el=>{
                const name = Array.from(el.querySelectorAll('.se-map-title')).map(get_text_without_placeholder);
                const addr = Array.from(el.querySelectorAll('.se-map-address')).map(get_text_without_placeholder);
                return { name, addr }
            });
            section.url = Array.from(component.querySelectorAll('.se-schedule-url')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se-schedule-description')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-code')) {
            section.type = 'code';
            section.text = Array.from(component.querySelectorAll('.se-code-source')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-table')) {
            section.type = 'table';
            section.table = Array.from(component.querySelectorAll('.se-table-content')).map(el=>{
                function parseTable(el) {
                    const rows = Array.from(el.querySelectorAll('tr')).map(el=>{
                        const cols = Array.from(el.querySelectorAll('td, th')).map(el=>{
                            const colspan = parseInt(el.getAttribute('colspan') || 1), rowspan = parseInt(el.getAttribute('rowspan') || 1);
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
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-formula')) {
            section.type = 'formula';
            section.text = Array.from(component.querySelectorAll('.mq-selectable')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-talktalk')) {
            section.type = 'talktalk';
            section.text = Array.from(component.querySelectorAll('.se-talktalk-banner-text')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-material')) {
            section.type = 'material';
            section.image = Array.from(component.querySelectorAll('.se-sidebar-material-thumbnail-resource')).map(el=>el.src || '');
            section.title = Array.from(component.querySelectorAll('.se-material-title')).map(get_text_without_placeholder);
            section.description = Array.from(component.querySelectorAll('.se-material-detail-title, .se-material-detail-description')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        return section;
    }
    window.SE_componentContent = function SE_componentContent(sections) {
        return sections.filter((section)=>['title', 'text', 'quotation', 'image', 'table', 'code'].includes(section.type)).map((section) => {
            if(section.type == 'table') {
                const thead = section.table && section.table.thead && section.table.thead.map(tr=>tr.map(td=>SE_componentContent(td.content)).flat()).flat();
                const tbody = section.table && section.table.tbody && section.table.tbody.map(tr=>tr.map(td=>SE_componentContent(td.content)).flat()).flat();
                return [thead, tbody].flat().filter(v=>!!v).join('\n');
            } else {
                return [section.title, section.text, section.description].flat().filter(v=>!!v).join('\n');
            }
        }).join("\n\n");
    }
    window.SE_components = function SE_components(document, mapper, selector) {
        return Array.from(document.querySelectorAll(selector)).filter((o,i,a)=>o && o.classList && a.indexOf(o) === i).map(mapper).flat();
    }
    window.SE_parse = function SE_parse(document, info) {
        const clipContent = document.querySelector('#__clipContent'); if(clipContent) { document = new DOMParser().parseFromString(clipContent.textContent, 'text/html'); }
        const sectionsV2 = SE_components(document, SE_componentParseV2, '.post_tit_area + #viewTypeSelector > *, body.se2_inputarea > *');
        const sectionsV3 = SE_components(document, SE_componentParseV3, '#viewTypeSelector .se_component, .se_doc_viewer .se_component, .editor-canvas-wrap .se_component, #se_canvas_wrapper .se_component, .se_card_container .se_component');
        const sectionsV4 = SE_components(document, SE_componentParseV4, '#viewTypeSelector .se-component, .se-main-container .se-component, .se-container .se-component');
        const sections = [sectionsV2, sectionsV3, sectionsV4].flat().filter(v=>!!v && v.type);
        const content = SE_componentContent(sections);
        const contentTrim = content.replace(/[\s]+/g, '');
        const contentLength = content.replace(/[\r\n]+/g, '').length;
        const contentLengthTrim = contentTrim.replace(/[\r\n]+/g, '').length;
        return {
            info,
            sections,
            content,
            contentTrim,
            contentLength,
            contentLengthTrim
        }
    }
    window.SE_parseRemote = async function SE_parseRemote(blogId, logNo) {
        const res = await GM_xmlhttpRequestAsync(`https://m.blog.naver.com/PostView.nhn?blogId=${blogId}&logNo=${logNo}`);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
        return SE_parse(doc, { blogId, logNo });
    }
})(window);