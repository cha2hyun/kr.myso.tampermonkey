// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 광고관리자 키워드 도구 확장
// @description  네이버 광고관리자 키워드 도구의 기능을 확장하는 프로그램입니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.searchad.keyword-planner.user.js
// @downloadURL  https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.searchad.keyword-planner.user.js
// @author       Won Choi
// @connect      naver.com
// @connect      ryo.co.kr
// @match        *://manage.searchad.naver.com/customers/*/tool/keyword-planner*
// @match        *://manage.searchad.naver.com/customers/*/tool/keyword-planner?*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/polyfill/Object.fromEntries.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/polyfill/Array.prototype.flat.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/polyfill/String.prototype.matchAll.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/lib/naver-search-ad.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/lib/naver-search-rx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/lib/naver-creator-advisor.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.40/assets/donation.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.33/moment-timezone.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    moment.tz.setDefault("Asia/Seoul");
    GM_donation('elena-tool-wrap');
    GM_addStyle('elena-tool-wrap > .content {margin-top:-100px !important;}');
    GM_addStyle(`
    .custom-keyword-planner {}
    .custom-keyword-planner.custom-keyword-planner-loading { pointer-events: none !important; cursor: wait !important; opacity: 0.8 !important; }
    .custom-keyword-planner .custom-table {}
    .custom-keyword-planner .custom-basic-column { font-size: 12px; height: 31px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; white-space: nowrap; color: #4c4c4c; text-align: right; vertical-align: middle !important; border-bottom: 0 !important; position: relative; }
    .custom-keyword-planner .custom-basic-column-header { font-weight: 700; text-align: center; }
    .custom-keyword-planner .custom-basic-column-item { display: flex; flex-direction: row; }
    .custom-keyword-planner .custom-basic-column-item > * { flex-grow: 1; }
    .custom-keyword-planner .custom-basic-column[data-tooltip]:hover { outline: 3px solid red; }
    .custom-keyword-planner .custom-basic-column[data-tooltip]:hover::after { content: attr(data-tooltip); white-space: pre; padding: 1rem; position: absolute; z-index: 100000; right: 50%; top: 50%; font-size: 11px; background-color: #c4dff6; border: 1px solid #333; max-width: 720px; max-height: 200px; overflow-y: auto; text-align: left; }
    .custom-keyword-planner .custom-basic-column.custom-tooltip-right[data-tooltip]:hover::after { right: auto; left: 50%; }
    .custom-keyword-planner .custom-basic-column[data-tooltip]::before { content: ''; width: 0; height: 0; border-style: solid; border-width: 0 5px 5px 0; border-color: transparent #f00 transparent transparent; right: 0; top: 0; position: absolute; }
    .custom-keyword-planner .custom-basic-column[data-tooltip=""]::before { display: none !important; }
    .custom-keyword-planner .custom-basic-column[data-tooltip=""]:hover { outline: 0; }
    .custom-keyword-planner .custom-basic-column[data-tooltip=""]:hover::after { display: none !important; }
    .custom-keyword-planner .col-keyword-query { max-width: 100% !important; flex: 0 0 100% !important; }
    .custom-keyword-planner .col-keyword-select { display: none !important; }
    .custom-keyword-planner .custom-table thead tr:nth-child(1) th:nth-child(1) > *,
    .custom-keyword-planner .custom-table tbody tr td:nth-child(1) > * { display: none !important; }
    .custom-keyword-planner .table-holder { overflow-y: visible !important; }
    `);
    // --------------------
    function hsl_col_perc(percent, start, end) { if(typeof percent !== 'number'){ return ''; } let a = percent / 50, b = (end - start) * a, c = b + start; return `hsl(${c}, 100%, 50%)`; }
    function hsla_col_perc(alpha, percent, start, end) { if(typeof percent !== 'number'){ return ''; } let a = percent / 50, b = (end - start) * a, c = b + start; return `hsla(${c}, 100%, 50%, ${alpha})`; }
    function format_number(number) { return typeof number === 'number' ? number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ) : number; }
    // --------------------
    const wrap = document.querySelector('elena-tool-wrap'); if(!wrap) return;
    const channels = await CreatorAdvisor.exec('channels'); if(!channels) return;
    const range = _.range(7).map((i)=>moment().subtract(i + 1, 'days').format('YYYY-MM-DD'));
    async function creator_advisor_visits(keyword, date, service = 'naver_blog') {
        const channel = _.find(channels, { service }); if(!channel) return;
        const params = { service: channel.service, channelId: channel.channelId, keyword, date };
        if(params.service == 'influencer') Object.assign(params, { metric: 'cv', contentType: 'text', interval: 'day', limit: 5 });
        if(params.service == 'naver_blog') Object.assign(params, { metric: 'cv', contentType: 'text', interval: 'day', limit: 5 });
        if(params.service == 'naver_post') Object.assign(params, { metric: 'cv', contentType: 'text', interval: 'day', limit: 5 });
        if(params.service == 'ntv') Object.assign(params, { metric: 'play_count', contentType: 'video', interval: 'day', limit: 5 });
        const contents = await CreatorAdvisor.exec('popular-contents', params);
        return { date, data: contents.data }
    }
    async function update() {
        const elena = wrap.querySelector('elena-keyword-planner'); if(!elena) return;
        elena.classList.add('custom-keyword-planner');
        const table = elena.querySelector('elena-table table'); if(!table) return;
        table.classList.add('custom-table');
        const thead1 = table.querySelector('thead tr:nth-child(1)');
        const thead2 = table.querySelector('thead tr:nth-child(2)');
        const tbody = Array.from(table.querySelectorAll('elena-keyword-planner elena-table table tbody tr'));
        const table_append = (element, className, label, options = {}, classes = []) => {
            const col = element.querySelector(`.${className}`) || document.createElement('td');
            if(!col.classList.contains(className)) {
                col.setAttribute('colspan', options.colspan || 1);
                col.setAttribute('rowspan', options.rowspan || 1);
                col.classList.add(className, ...classes);
                element.append(col);
            }
            col.innerHTML = `<div class="custom-basic-column-item">${label}</div>`;
            return col;
        }
        const thead_append = (element, className, label, options = {}) => { return table_append(element, className, label, options, ['custom-basic-column', 'custom-basic-column-header']); }
        const tbody_append = (element, className, label, options = {}) => { return table_append(element, className, label, options, ['custom-basic-column']); }
        thead_append(thead1, 'col-view-clicks', '<span>VIEW주간조회수</span>', { colspan: 3 });
        thead_append(thead2, 'col-view-clicks-nblog', '<span>블로그</span>');
        thead_append(thead2, 'col-view-clicks-npost', '<span>포스트</span>');
        thead_append(thead2, 'col-view-clicks-ninfl', '<span>인플루언서</span>');
        thead_append(thead1, 'col-view-writes', '<span>VIEW주간생산량</span>', { colspan: 4 });
        thead_append(thead2, 'col-view-writes-nblog', '<span>블로그</span>');
        thead_append(thead2, 'col-view-writes-npost', '<span>포스트</span>');
        thead_append(thead2, 'col-view-writes-ncafe', '<span>카페</span>');
        thead_append(thead2, 'col-view-writes-ratio', '<span>콘텐츠포화도</span>');
        thead_append(thead1, 'col-view-subject', '<span>검색어주제</span>', { colspan: 2 });
        thead_append(thead2, 'col-view-subject-prod', '<span>생산선호주제</span>');
        thead_append(thead2, 'col-view-subject-view', '<span>소비선호주제</span>');
        // reset
        await Promise.map(tbody, async (row, i) => {
            const keyword = row.getAttribute('row-id'), keyword_last = row.dataset.lastRowId;
            if(!keyword || keyword == keyword_last) { return; }
            function reset(row, className) { const col = tbody_append(row, className, ''); col.style.backgroundColor = ''; col.dataset.tooltip = ''; }
            const relKeyword = row.querySelector('.elenaColumn-relKeyword'); if(relKeyword) relKeyword.dataset.tooltip = '';
            reset(row, 'col-view-clicks-nblog');
            reset(row, 'col-view-clicks-npost');
            reset(row, 'col-view-clicks-ninfl');
            reset(row, 'col-view-writes-nblog');
            reset(row, 'col-view-writes-npost');
            reset(row, 'col-view-writes-ncafe');
            reset(row, 'col-view-writes-ratio');
            reset(row, 'col-view-subject-prod');
            reset(row, 'col-view-subject-view');
        });
        // update
        await Promise.map(tbody.reverse(), async (row, i) => {
            const keyword = row.getAttribute('row-id'), keyword_last = row.dataset.lastRowId;
            if(!keyword || keyword == keyword_last) { return; } else { row.dataset.lastRowId = keyword; }
            async function viewRelKeywords(){
                const el = row.querySelector('.elenaColumn-relKeyword'); el.classList.add('custom-basic-column', 'custom-tooltip-right');
                const msgs = [];
                const auto = await NA_keywordAutocomplete(keyword);
                const rels = await NA_keywordRelations(keyword);
                if(auto.length) msgs.push(`[자동] ${auto.join(', ')}`);
                if(rels.length) msgs.push(`[연관] ${rels.join(', ')}`);
                el.dataset.tooltip = msgs.join('\n');
            }
            async function viewVisitsWeek(){
                const keyword_qc_p = parseInt(row.querySelector('.elenaColumn-monthlyPcQcCnt').textContent.replace(/[^\d]+/g, ''));
                const keyword_qc_m = parseInt(row.querySelector('.elenaColumn-monthlyMobileQcCnt').textContent.replace(/[^\d]+/g, ''));
                const keyword_qc = keyword_qc_p + keyword_qc_m;
                const keyword_norm = await NA_keywordAutocompleteNormalize(keyword);
                const keyword_visit = await Promise.map(range, async (date)=>{
                    const data = await Promise.props({
                        blog: await creator_advisor_visits(keyword_norm, date, 'naver_blog'),
                        post: await creator_advisor_visits(keyword_norm, date, 'naver_post'),
                        infl: await creator_advisor_visits(keyword_norm, date, 'influencer'),
                    });
                    return { keyword, date, ...data }
                });
                const keyword_visit_blog = keyword_visit.map(o=>o.blog && o.blog.data).flat().filter(v=>!!v);
                const keyword_visit_post = keyword_visit.map(o=>o.post && o.post.data).flat().filter(v=>!!v);
                const keyword_visit_infl = keyword_visit.map(o=>o.infl && o.infl.data).flat().filter(v=>!!v);
                const keyword_visit_blog_grp = _.orderBy(_.map(_.groupBy(keyword_visit_blog, 'contentId'), (items)=>({ ..._.head(items), metricValue: _.sumBy(items, 'metricValue'), items })), 'metricValue', 'desc');
                const keyword_visit_post_grp = _.orderBy(_.map(_.groupBy(keyword_visit_post, 'contentId'), (items)=>({ ..._.head(items), metricValue: _.sumBy(items, 'metricValue'), items })), 'metricValue', 'desc');
                const keyword_visit_infl_grp = _.orderBy(_.map(_.groupBy(keyword_visit_infl, 'contentId'), (items)=>({ ..._.head(items), metricValue: _.sumBy(items, 'metricValue'), items })), 'metricValue', 'desc');
                const keyword_visit_blog_one = keyword_visit.map(o=>o.blog && o.blog.data && o.blog.data[0]).filter(v=>!!v);
                const keyword_visit_post_one = keyword_visit.map(o=>o.post && o.post.data && o.post.data[0]).filter(v=>!!v);
                const keyword_visit_infl_one = keyword_visit.map(o=>o.infl && o.infl.data && o.infl.data[0]).filter(v=>!!v);
                const keyword_visit_blog_all = _.sumBy(keyword_visit_blog_one, 'metricValue');
                const keyword_visit_post_all = _.sumBy(keyword_visit_post_one, 'metricValue');
                const keyword_visit_infl_all = _.sumBy(keyword_visit_infl_one, 'metricValue');
                const keyword_visit_blog_per = Math.max(0, Math.min(100, ((keyword_visit_blog_all / (keyword_qc / 30 * 7)) * 100)));
                const keyword_visit_post_per = Math.max(0, Math.min(100, ((keyword_visit_post_all / (keyword_qc / 30 * 7)) * 100)));
                const keyword_visit_infl_per = Math.max(0, Math.min(100, ((keyword_visit_infl_all / (keyword_qc_m / 30 * 7)) * 100)));
                const keyword_visit_blog_msg = `<span style="text-align:left"><small >${keyword_visit_blog_per.toFixed(2)}%</small></span><span>${format_number(keyword_visit_blog_all)}</span>`;
                const keyword_visit_post_msg = `<span style="text-align:left"><small>${keyword_visit_post_per.toFixed(2)}%</small></span><span>${format_number(keyword_visit_post_all)}</span>`;
                const keyword_visit_infl_msg = `<span style="text-align:left"><small>${keyword_visit_infl_per.toFixed(2)}%</small></span><span>${format_number(keyword_visit_infl_all)}</span>`;
                const keyword_visit_blog_col = tbody_append(row, 'col-view-clicks-nblog', keyword_visit_blog_msg);
                const keyword_visit_post_col = tbody_append(row, 'col-view-clicks-npost', keyword_visit_post_msg);
                const keyword_visit_infl_col = tbody_append(row, 'col-view-clicks-ninfl', keyword_visit_infl_msg);
                keyword_visit_blog_col.style.backgroundColor = hsla_col_perc(0.2, keyword_visit_blog_per, 60, 240);
                keyword_visit_post_col.style.backgroundColor = hsla_col_perc(0.2, keyword_visit_post_per, 60, 240);
                keyword_visit_infl_col.style.backgroundColor = hsla_col_perc(0.2, keyword_visit_infl_per, 60, 240);
                keyword_visit_blog_col.dataset.tooltip = keyword_visit_blog_grp.map(o=>`채널명: ${o.channelName}\n글제목: ${o.title}\n글주소: ${o.contentId}\n조회수: ${o.metricValue}`).join('\n------------\n\n');
                keyword_visit_post_col.dataset.tooltip = keyword_visit_post_grp.map(o=>`${o.channelName}\n${o.title}\n${o.contentId}\n주간조회수: ${o.metricValue}`).join('\n------------\n\n');
                keyword_visit_infl_col.dataset.tooltip = keyword_visit_infl_grp.map(o=>`${o.channelName}\n${o.title}\n${o.contentId}\n주간조회수: ${o.metricValue}`).join('\n------------\n\n');
            }
            async function viewWritesWeek(){
                const data = await Promise.props({
                    view_count_1w: NX_count(keyword, 'view', 'normal', { api_type: 11, nso: 'so:r,p:1w' }),
                    blog_count_1w: NX_count(keyword, 'blog', 'normal', { api_type: 1, nso: 'so:r,p:1w' }),
                    post_count_1w: NX_count(keyword, 'post', 'normal', { term: 'w' }),
                    cafe_count_1w: NX_count(keyword, 'article', 'normal', { prmore: 1, nso: 'so:r,p:1w' }),
                });
                const keyword_write_item_per = Math.max(0, Math.min(100, (data.view_count_1w / (data.blog_count_1w + data.post_count_1w + data.cafe_count_1w)) * 100));
                const keyword_write_blog_msg = `<span>${format_number(data.blog_count_1w)}</span>`;
                const keyword_write_post_msg = `<span>${format_number(data.post_count_1w)}</span>`;
                const keyword_write_cafe_msg = `<span>${format_number(data.cafe_count_1w)}</span>`;
                const keyword_write_item_msg = `<span style="text-align:left"><small>${(100 - keyword_write_item_per).toFixed(2)}%</small></span><span>${format_number(data.view_count_1w)}</span>`;
                const keyword_write_blog_col = tbody_append(row, 'col-view-writes-nblog', keyword_write_blog_msg);
                const keyword_write_post_col = tbody_append(row, 'col-view-writes-npost', keyword_write_post_msg);
                const keyword_write_cafe_col = tbody_append(row, 'col-view-writes-ncafe', keyword_write_cafe_msg);
                const keyword_write_item_col = tbody_append(row, 'col-view-writes-ratio', keyword_write_item_msg);
                keyword_write_item_col.style.backgroundColor = hsla_col_perc(0.2, keyword_write_item_per, 0, 240);
            }
            async function relSubject() {
                const terms = await NR_terms(keyword);
                const prod = [], view = [];
                if(terms.r_category) prod.push(terms.r_category)
                if(terms.theme && terms.theme.main) view.push(terms.theme.main.name);
                if(terms.theme && terms.theme.sub)  view.push(...terms.theme.sub.map(o=>o.name));
                const keyword_subject_prod_col = tbody_append(row, 'col-view-subject-prod', `<span>${prod.join(', ')}</span>`); keyword_subject_prod_col.dataset.tooltip = prod.join('\n');
                const keyword_subject_view_col = tbody_append(row, 'col-view-subject-view', `<span>${view.join(', ')}</span>`); keyword_subject_view_col.dataset.tooltip = view.join('\n');
            }
            await Promise.all([viewRelKeywords(), viewVisitsWeek(), viewWritesWeek(), relSubject()]);
        }, { concurrency: 5 });
    }
    async function redraw(mutations) {
        if(redraw.busy) return;
        redraw.timer = clearTimeout(redraw.timer);
        redraw.timer = setTimeout(async () => {
            const mixed = location.search.includes('view=mixed');
            const elena = wrap.querySelector('elena-keyword-planner'); if(!elena) return;
            elena.classList.toggle('custom-keyword-planner-loading', redraw.busy = true);
            const wrp = elena.querySelector('.col-keyword-query > .card:nth-child(1) .card-footer'); if(!wrp) return;
            const btn = wrp.querySelector('button.btn-mixed') || document.createElement('button'); btn.style.width = '180px';
            if(!mixed) {
                if(!btn.className) {
                    btn.classList.add('btn', 'btn-warning', 'btn-mixed', 'ml-2');
                    btn.innerHTML = `<span>확장모드 켜기</span>`; btn.onclick = () => location.search = '?view=mixed'; wrp.append(btn);
                }
            } else {
                if(!btn.className) {
                    btn.classList.add('btn', 'btn-secondary', 'btn-mixed', 'ml-2');
                    btn.innerHTML = `<span>확장모드 끄기</span>`; btn.onclick = () => location.search = ''; wrp.append(btn);
                }
                await update();
            }
            elena.classList.toggle('custom-keyword-planner-loading', redraw.busy = false);
        }, 300);
    }
    const obsv = new MutationObserver(redraw); obsv.observe(wrap, { childList: true, subtree: true, characterData: true }); setTimeout(redraw, 1000);
});