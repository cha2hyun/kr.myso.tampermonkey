// ---------------------
(function(window) {
    function get_text(el) { return el.innerText || el.value || ''; }
    function get_placeholder(el) { return Array.from(el.querySelectorAll('.se-placeholder')).map((el)=>el.innerText || el.value || '').join(''); }
    function get_text_without_placeholder(el) { return get_text(el).replace(new RegExp(`${get_placeholder(el)}$`), ''); }
    window.SE_parseComponent = function SE_parseComponent(component) {
        const section = {};
        if(component.classList.contains('se-documentTitle')) {
            section.type = 'title';
            section.text = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-text')) {
            section.type = 'text';
            section.text = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_text_without_placeholder);
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-image')) {
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
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-sticker')) {
            section.type = 'sticker';
            section.image = Array.from(component.querySelectorAll('.se-sticker-image')).map(el=>el.src || '');
            section.placeholder = Array.from(component.querySelectorAll('.se-text-paragraph')).map(get_placeholder);
        }
        if(component.classList.contains('se-quotation')) {
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
    window.SE_parse = function SE_parse(document, info) {
        const clipContent = document.querySelector('#__clipContent'); if(clipContent) { document = new DOMParser().parseFromString(clipContent.textContent, 'text/html'); }
        const sections = Array.from(document.querySelectorAll('#se_components_wrapper .se_component, .se_component_wrap .se_component, .se_card_container .se_component, .__se_editor-content .se_component, .se-main-container .se-component, .se-container .se-component')).map(window.SE_parseComponent);
        const content = SE_componentContent(sections);
        const contentLength = content.replace(/[\r\n]+/g, '').length;
        const contentLengthTrim = content.replace(/[\s\r\n]+/g, '').length;
        return {
            info,
            sections,
            content,
            contentLength,
            contentLengthTrim
        }
    }
})(window);