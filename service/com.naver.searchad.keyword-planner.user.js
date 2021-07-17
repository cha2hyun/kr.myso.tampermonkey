// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 광고관리자 키워드 도구 확장
// @description  네이버 광고관리자 키워드 도구의 기능을 확장하는 프로그램입니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.9
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.searchad.keyword-planner.user.js
// @downloadURL  https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.searchad.keyword-planner.user.js
// @author       Won Choi
// @connect      naver.com
// @connect      ryo.co.kr
// @match        *://manage.searchad.naver.com/customers/*/tool/keyword-planner*
// @match        *://manage.searchad.naver.com/customers/*/tool/keyword-planner?*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/polyfill/Object.fromEntries.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/polyfill/Array.prototype.flat.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/polyfill/String.prototype.matchAll.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/lib/naver-search-ad.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/lib/naver-search-rx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/lib/naver-creator-advisor.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.42/assets/donation.js
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
    .custom-keyword-planner .custom-table table { table-layout: fixed; width: 100%; }
    .custom-keyword-planner .custom-table table colgroup col:nth-child(1) { display: none; }
    .custom-keyword-planner .custom-table thead > tr:nth-child(1) > th:nth-child(2),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(1) { width: 300px !important; }
    .custom-keyword-planner .custom-table thead > tr:nth-child(1) > th:nth-child(1),
    .custom-keyword-planner .custom-table thead > tr:nth-child(1) > th:nth-child(4),
    .custom-keyword-planner .custom-table thead > tr:nth-child(1) > th:nth-child(5),
    .custom-keyword-planner .custom-table thead > tr:nth-child(1) > th:nth-child(6),
    .custom-keyword-planner .custom-table thead > tr:nth-child(1) > th:nth-child(7),
    .custom-keyword-planner .custom-table thead > tr:nth-child(2) > th:nth-child(3),
    .custom-keyword-planner .custom-table thead > tr:nth-child(2) > th:nth-child(4),
    .custom-keyword-planner .custom-table thead > tr:nth-child(2) > th:nth-child(5),
    .custom-keyword-planner .custom-table thead > tr:nth-child(2) > th:nth-child(6),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(1),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(5),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(6),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(7),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(8),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(9),
    .custom-keyword-planner .custom-table tbody > tr > td:nth-child(10) { display: none; }
    .custom-keyword-planner .custom-basic-column { font-size: 12px; height: 31px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; white-space: nowrap; color: #4c4c4c; text-align: right; vertical-align: middle !important; border-bottom: 0 !important; position: relative; }
    .custom-keyword-planner .custom-basic-column span { overflow: hidden !important; display: block !important; }
    .custom-keyword-planner .custom-basic-column-header { font-weight: 700; text-align: center; }
    .custom-keyword-planner .custom-basic-column-item { display: flex; flex-direction: row; }
    .custom-keyword-planner .custom-basic-column-item > * { flex-grow: 1; overflow: hidden !important; display: block !important; }
    .custom-keyword-planner .custom-basic-column[data-tooltip]:hover { outline: 3px solid red; }
    .custom-keyword-planner .custom-basic-column[data-tooltip]:hover::after { content: attr(data-tooltip); white-space: pre; padding: 1em; position: absolute; z-index: 100000; right: 50%; top: 50%; font-size: 12px; background-color: #c4dff6; border: 1px solid #333; max-width: 400px; max-height: 200px; overflow-y: auto; text-align: left; }
    .custom-keyword-planner .custom-basic-column.custom-tooltip-right[data-tooltip]:hover::after { right: auto; left: 50%; }
    .custom-keyword-planner .custom-basic-column::before { content: ''; position: absolute; top: 0; left: 0; border-color: transparent; border-style: solid; color: #fff; font-size: 12px; text-align:center; justify-content: center; align-items: center; display: flex; }
    .custom-keyword-planner .custom-basic-column[data-tooltip]::before { border-width: 0.25em; border-left-color: red; border-top-color: red; }
    .custom-keyword-planner .custom-basic-column[data-tooltip=""]::before { display: none !important; }
    .custom-keyword-planner .custom-basic-column[data-tooltip=""]:hover { outline: 0; }
    .custom-keyword-planner .custom-basic-column[data-tooltip=""]:hover::after { display: none !important; }
    .custom-keyword-planner .custom-basic-column[data-warning="true"]::before { content: ''; border-width: 0.25em; border-left-color: red; border-top-color: red; width: 100%; height: 100%; background-color:rgba(255,0,0,0.2); dipslay: block !important; }
    .custom-keyword-planner .custom-basic-column[data-warning="true"][data-tooltip]:hover::after { color:#fff; background-color: #fd5c63; content: '* 위험! 비정상수치가 발견되었습니다.\\A* 검색유입 트래픽 조작이 의심되는 키워드입니다.\\A* 네이버 데이터랩 검색어 트렌드 추가 검증이 필요합니다.\\A------------\\A\\A' attr(data-tooltip); }
    .custom-keyword-planner .col-keyword-query { max-width: 100% !important; flex: 0 0 100% !important; }
    .custom-keyword-planner .col-keyword-select { display: none !important; }
    .custom-keyword-planner .custom-table thead tr:nth-child(1) th:nth-child(1) > *,
    .custom-keyword-planner .custom-table tbody tr td:nth-child(1) > * { display: none !important; }
    .custom-keyword-planner .table-holder { overflow-y: visible !important; }
    `);
    // --------------------
    function valid_percent(percent) { return percent >= 0 && percent <= 100; }
    function hsl_col_perc(percent, start, end) { if(typeof percent !== 'number'){ return ''; } let a = Math.max(0, Math.min(100, percent)) / 100, b = (end - start) * a, c = b + start; return `hsl(${c}, 100%, 50%)`; }
    function hsla_col_perc(alpha, percent, start, end) { if(typeof percent !== 'number'){ return ''; } let a = Math.max(0, Math.min(100, percent)) / 100, b = (end - start) * a, c = b + start; return `hsla(${c}, 100%, 50%, ${Math.max(0, Math.min(1, alpha * (valid_percent(percent) ? 1 : 2)))})`; }
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
        const group = table.querySelector('colgroup'); if(group) group.remove();
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
        const thead_view_clicks = thead_append(thead1, 'col-view-clicks', '<span>주간조회수</span>', { colspan: 3 });
        const thead_view_clicks_nblog = thead_append(thead2, 'col-view-clicks-nblog', '<span>블로그</span>');
        const thead_view_clicks_npost = thead_append(thead2, 'col-view-clicks-npost', '<span>포스트</span>');
        const thead_view_clicks_ninfl = thead_append(thead2, 'col-view-clicks-ninfl', '<span>인플검</span>');
        const thead_view_writes = thead_append(thead1, 'col-view-writes', '<span>주간생산량</span>', { colspan: 4 });
        const thead_view_writes_nblog = thead_append(thead2, 'col-view-writes-nblog', '<span>블로그</span>');
        const thead_view_writes_npost = thead_append(thead2, 'col-view-writes-npost', '<span>포스트</span>');
        const thead_view_writes_ncafe = thead_append(thead2, 'col-view-writes-ncafe', '<span>카페</span>');
        const thead_view_writes_ratio = thead_append(thead2, 'col-view-writes-ratio', '<span>경쟁률</span>');
        const thead_view_subject = thead_append(thead1, 'col-view-subject', '<span>검색어주제</span>', { colspan: 2 });
        const thead_view_subject_prod = thead_append(thead2, 'col-view-subject-prod', '<span>생산</span>');
        const thead_view_subject_view = thead_append(thead2, 'col-view-subject-view', '<span>소비</span>');
        const thead_view_ranking = thead_append(thead1, 'col-view-ranking', '<span>통합노출순위</span>', { colspan: 3 });
        const thead_view_ranking_nblog = thead_append(thead2, 'col-view-ranking-nblog', '<span>블로그</span>');
        const thead_view_ranking_npost = thead_append(thead2, 'col-view-ranking-npost', '<span>포스트</span>');
        const thead_view_ranking_ninfl = thead_append(thead2, 'col-view-ranking-ninfl', '<span>인플검</span>');
        thead_view_clicks.dataset.tooltip = '※ 조회 불가 시 creator-advisor.naver.com 접속 후 새로고침';
        thead_view_clicks_nblog.dataset.tooltip = '네이버 블로그를 개설한 네이버 계정으로 로그인 되어있어야,\n실 조회수 통계를 조회 가능합니다. (크리에이터 어드바이저 권한제한)';
        thead_view_clicks_npost.dataset.tooltip = '네이버 포스트를 개설한 네이버 계정으로 로그인 되어있어야,\n실 조회수 통계를 조회 가능합니다. (크리에이터 어드바이저 권한제한)';
        thead_view_clicks_ninfl.dataset.tooltip = '네이버 인플루언서를 개설한 네이버 계정으로 로그인 되어있어야,\n실 조회수 통계를 조회 가능합니다. (크리에이터 어드바이저 권한제한)';
        thead_view_writes_ratio.dataset.tooltip = '생산된 글이 VIEW탭 상위 5위안에 포함되기 위한 경쟁률입니다.\n- 배경색상: VIEW탭 등록 난이도 (녹색: 쉬움, 적색: 어려움)';
        thead_view_ranking.dataset.tooltip = '※ 조회 불가 시 creator-advisor.naver.com 접속 후 새로고침';
        thead_view_ranking_nblog.dataset.tooltip = '네이버 블로그를 개설한 네이버 계정으로 로그인 되어있어야,\n순위 통계를 조회 가능합니다. (크리에이터 어드바이저 권한제한)';
        thead_view_ranking_npost.dataset.tooltip = '네이버 포스트를 개설한 네이버 계정으로 로그인 되어있어야,\n순위 통계를 조회 가능합니다. (크리에이터 어드바이저 권한제한)';
        thead_view_ranking_ninfl.dataset.tooltip = '네이버 인플루언서를 개설한 네이버 계정으로 로그인 되어있어야,\n순위 통계를 조회 가능합니다. (크리에이터 어드바이저 권한제한)';
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
            reset(row, 'col-view-ranking-nblog');
            reset(row, 'col-view-ranking-npost');
            reset(row, 'col-view-ranking-ninfl');
        });
        // update
        await Promise.map(tbody.reverse(), async (row, i) => {
            const keyword = row.getAttribute('row-id'), keyword_last = row.dataset.lastRowId;
            if(!keyword || keyword == keyword_last) { return; } else { row.dataset.lastRowId = keyword; }
            const keyword_norm = await NA_keywordAutocompleteNormalize(keyword);
            async function viewRelKeywords(){
                const el = row.querySelector('.elenaColumn-relKeyword'); el.classList.add('custom-basic-column', 'custom-tooltip-right');
                const msgs = [`[자동교정] ${keyword_norm}`];
                const auto = await NA_keywordAutocomplete(keyword_norm);
                const rels = await NA_keywordRelations(keyword_norm);
                if(auto.length) msgs.push(`[자동완성] ${auto.join(', ')}`);
                if(rels.length) msgs.push(`[연관검색] ${rels.join(', ')}`);
                el.dataset.tooltip = msgs.join('\n');
            }
            async function viewVisitsWeek(){
                const keyword_qc_p = parseInt(row.querySelector('.elenaColumn-monthlyPcQcCnt').textContent.replace(/[^\d]+/g, ''));
                const keyword_qc_m = parseInt(row.querySelector('.elenaColumn-monthlyMobileQcCnt').textContent.replace(/[^\d]+/g, ''));
                const keyword_qc = keyword_qc_p + keyword_qc_m;
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
                const keyword_visit_blog_per = (keyword_visit_blog_all / (keyword_qc / 30 * 7)) * 100;
                const keyword_visit_post_per = (keyword_visit_post_all / (keyword_qc / 30 * 7)) * 100;
                const keyword_visit_infl_per = (keyword_visit_infl_all / (keyword_qc_m / 30 * 7)) * 100;
                const keyword_visit_blog_msg = `<span style="text-align:left"><small >${keyword_visit_blog_per.toFixed(2)}%</small></span><span>${format_number(keyword_visit_blog_all)}</span>`;
                const keyword_visit_post_msg = `<span style="text-align:left"><small>${keyword_visit_post_per.toFixed(2)}%</small></span><span>${format_number(keyword_visit_post_all)}</span>`;
                const keyword_visit_infl_msg = `<span style="text-align:left"><small>${keyword_visit_infl_per.toFixed(2)}%</small></span><span>${format_number(keyword_visit_infl_all)}</span>`;
                const keyword_visit_blog_col = tbody_append(row, 'col-view-clicks-nblog', keyword_visit_blog_msg);
                const keyword_visit_post_col = tbody_append(row, 'col-view-clicks-npost', keyword_visit_post_msg);
                const keyword_visit_infl_col = tbody_append(row, 'col-view-clicks-ninfl', keyword_visit_infl_msg);
                keyword_visit_blog_col.style.backgroundColor = hsla_col_perc(0.2, keyword_visit_blog_per, 0, 128);
                keyword_visit_post_col.style.backgroundColor = hsla_col_perc(0.2, keyword_visit_post_per, 0, 128);
                keyword_visit_infl_col.style.backgroundColor = hsla_col_perc(0.2, keyword_visit_infl_per, 0, 128);
                keyword_visit_blog_col.dataset.warning = !valid_percent(keyword_visit_blog_per);
                keyword_visit_post_col.dataset.warning = !valid_percent(keyword_visit_post_per);
                keyword_visit_infl_col.dataset.warning = !valid_percent(keyword_visit_infl_per);
                keyword_visit_blog_col.dataset.tooltip = keyword_visit_blog_grp.map(o=>`채널명: ${o.channelName}\n글제목: ${o.title}\n글주소: ${o.contentId}\n조회수: ${o.metricValue}`).join('\n------------\n\n');
                keyword_visit_post_col.dataset.tooltip = keyword_visit_post_grp.map(o=>`채널명: ${o.channelName}\n글제목: ${o.title}\n글주소: ${o.contentId}\n조회수: ${o.metricValue}`).join('\n------------\n\n');
                keyword_visit_infl_col.dataset.tooltip = keyword_visit_infl_grp.map(o=>`채널명: ${o.channelName}\n글제목: ${o.title}\n글주소: ${o.contentId}\n조회수: ${o.metricValue}`).join('\n------------\n\n');
            }
            async function viewWritesWeek(){
                const data = await Promise.props({
                    view_count_1w: NX_count(keyword_norm, 'view', 'normal', { api_type: 11, nso: 'so:r,p:1w' }),
                    blog_count_1w: NX_count(keyword_norm, 'blog', 'normal', { api_type: 1, nso: 'so:r,p:1w' }),
                    post_count_1w: NX_count(keyword_norm, 'post', 'normal', { term: 'w' }),
                    cafe_count_1w: NX_count(keyword_norm, 'article', 'normal', { prmore: 1, nso: 'so:r,p:1w' }),
                });
                const keyword_write_item_all = data.blog_count_1w + data.post_count_1w + data.cafe_count_1w;
                const keyword_write_item_per = (data.view_count_1w / keyword_write_item_all) * 100;
                const keyword_write_blog_msg = `<span>${format_number(data.blog_count_1w)}</span>`;
                const keyword_write_post_msg = `<span>${format_number(data.post_count_1w)}</span>`;
                const keyword_write_cafe_msg = `<span>${format_number(data.cafe_count_1w)}</span>`;
                const keyword_write_item_msg = `<span>${Math.max(1, Math.ceil(keyword_write_item_all / 5)).toFixed(0)}:1</span>`;
                const keyword_write_blog_col = tbody_append(row, 'col-view-writes-nblog', keyword_write_blog_msg);
                const keyword_write_post_col = tbody_append(row, 'col-view-writes-npost', keyword_write_post_msg);
                const keyword_write_cafe_col = tbody_append(row, 'col-view-writes-ncafe', keyword_write_cafe_msg);
                const keyword_write_item_col = tbody_append(row, 'col-view-writes-ratio', keyword_write_item_msg);
                keyword_write_item_col.style.backgroundColor = hsla_col_perc(0.2, keyword_write_item_per, 0, 128);
            }
            async function relSubject() {
                const terms = await NR_terms(keyword_norm);
                const prod = [], view = [];
                if(terms.r_category) prod.push(terms.r_category)
                if(terms.theme && terms.theme.main) view.push(terms.theme.main.name);
                if(terms.theme && terms.theme.sub)  view.push(...terms.theme.sub.map(o=>o.name));
                const keyword_subject_prod_col = tbody_append(row, 'col-view-subject-prod', `<span>${prod.join(', ')}</span>`); keyword_subject_prod_col.dataset.tooltip = prod.join('\n');
                const keyword_subject_view_col = tbody_append(row, 'col-view-subject-view', `<span>${view.join(', ')}</span>`); keyword_subject_view_col.dataset.tooltip = view.join('\n');
            }
            async function viewRanking() {
                const props = await Promise.props({
                    view: NX_items(keyword_norm, 1, 'view'),
                    infl: NX_items(keyword_norm, 1, 'influencer'),
                });
                const channel_nblog = channels.filter(o=>['naver_blog'].includes(o.service));
                const channel_npost = channels.filter(o=>['naver_post'].includes(o.service));
                const channel_ninfl = channels.filter(o=>['influencer'].includes(o.service));
                const ranking_nblog = _.minBy(channel_nblog.map(o=>props.view.filter(p=>p.blogId == o.channelId)).flat(), 'rank') || { rank: 0 };
                const ranking_npost = _.minBy(channel_npost.map(o=>props.view.filter(p=>p.memberNo == o.channelId)).flat(), 'rank') || { rank: 0 };
                const ranking_ninfl = _.minBy(channel_ninfl.map(o=>props.infl.filter(p=>p.spaceId == o.channelId)).flat(), 'rank') || { rank: 0 };
                const ranking_nblog_per = (ranking_nblog.rank / 30) * 100;
                const ranking_npost_per = (ranking_npost.rank / 30) * 100;
                const ranking_ninfl_per = (ranking_ninfl.rank / 30) * 100;
                const ranking_nblog_msg = `<span>${ranking_nblog.rank}위</span>`;
                const ranking_npost_msg = `<span>${ranking_npost.rank}위</span>`;
                const ranking_ninfl_msg = `<span>${ranking_ninfl.rank}위</span>`;
                const ranking_nblog_col = tbody_append(row, 'col-view-ranking-nblog', ranking_nblog_msg);
                const ranking_npost_col = tbody_append(row, 'col-view-ranking-npost', ranking_npost_msg);
                const ranking_ninfl_col = tbody_append(row, 'col-view-ranking-ninfl', ranking_ninfl_msg);
                ranking_nblog_col.style.backgroundColor = hsla_col_perc(0.2, ranking_nblog_per, 0, 128);
                ranking_npost_col.style.backgroundColor = hsla_col_perc(0.2, ranking_npost_per, 0, 128);
                ranking_ninfl_col.style.backgroundColor = hsla_col_perc(0.2, ranking_ninfl_per, 0, 128);
                ranking_nblog_col.dataset.warning = !valid_percent(ranking_nblog_per);
                ranking_npost_col.dataset.warning = !valid_percent(ranking_npost_per);
                ranking_nblog_col.dataset.warning = !valid_percent(ranking_ninfl_per);
                if(ranking_nblog.rank) ranking_nblog_col.dataset.tooltip = `채널명: ${ranking_nblog.channelName}\n글제목: ${ranking_nblog.titleWithInspectMessage}\n글주소: ${ranking_nblog.uri}\n전문성: ${ranking_nblog.crScoreA}\n신뢰성: ${ranking_nblog.crScoreB}\n관련성: ${ranking_nblog.crScoreC}`;
                if(ranking_npost.rank) ranking_npost_col.dataset.tooltip = `채널명: ${ranking_npost.channelName}\n글제목: ${ranking_npost.titleWithInspectMessage}\n글주소: ${ranking_npost.uri}`;
                if(ranking_ninfl.rank) ranking_ninfl_col.dataset.tooltip = `채널명: ${ranking_ninfl.channelName}\n글제목: ${ranking_ninfl.titleWithInspectMessage}\n글주소: ${ranking_ninfl.uri}`;
            }
            await Promise.all([viewRelKeywords(), viewVisitsWeek(), viewWritesWeek(), relSubject(), viewRanking()]);
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