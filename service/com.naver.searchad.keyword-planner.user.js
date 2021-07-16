// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 광고관리자 키워드 도구 확장
// @description  네이버 광고관리자 키워드 도구의 기능을 확장하는 프로그램입니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.searchad.keyword-planner.user.js
// @downloadURL  https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.searchad.keyword-planner.user.js
// @author       Won Choi
// @connect      naver.com
// @connect      ryo.co.kr
// @match        *://manage.searchad.naver.com/customers/*/tool/keyword-planner
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/polyfill/Object.fromEntries.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/polyfill/Array.prototype.flat.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/polyfill/String.prototype.matchAll.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/lib/naver-search-ad.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.20/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/lib/naver-creator-advisor.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.38/assets/donation.js
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
    .custom-table {}
    .custom-basic-column { font-size: 12px; height: 31px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; white-space: nowrap; color: #4c4c4c; text-align: right; vertical-align: middle !important; border-bottom: 0 !important; position: relative; }
    .custom-basic-column-header { font-weight: 700; text-align: center; }
    .custom-basic-column-item { display: flex; flex-direction: row; }
    .custom-basic-column-item > * { flex-grow: 1; }
    .custom-basic-column[data-tooltip=""]::after { display: none !important; }
    .custom-basic-column[data-tooltip]:hover { outline: 3px solid red; }
    .custom-basic-column[data-tooltip]:hover::after {
      content: attr(data-tooltip); white-space: pre;
      position: absolute; z-index: 100000; right: 50%; top: 50%;
      font-size: 11px; background-color: #c4dff6; border: 1px solid #333;
      min-width: 600px; max-height: 200px; overflow-y: auto; text-align: left;
    }
    .custom-keyword-planner-loading { pointer-events: none !important; cursor: wait !important; opacity: 0.8 !important; }
    `);
    // --------------------
    function hsl_col_perc(percent, start, end) { if(typeof percent !== 'number'){ return ''; } let a = percent / 50, b = (end - start) * a, c = b + start; return `hsl(${c}, 100%, 50%)`; }
    function hsla_col_perc(alpha, percent, start, end) { if(typeof percent !== 'number'){ return ''; } let a = percent / 50, b = (end - start) * a, c = b + start; return `hsla(${c}, 100%, 50%, ${alpha})`; }
    function format_number(number) { return typeof number === 'number' ? number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ) : number; }
    // --------------------
    const wrap = document.querySelector('elena-tool-wrap'); if(!wrap) return;
    const obsv = new MutationObserver(redraw); obsv.observe(wrap, { childList: true, subtree: true, characterData: true });
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
            }
            col.innerHTML = `<div class="custom-basic-column-item">${label}</div>`;
            element.append(col);
            return col;
        }
        const thead_append = (element, className, label, options = {}) => { return table_append(element, className, label, options, ['custom-basic-column', 'custom-basic-column-header']); }
        const tbody_append = (element, className, label, options = {}) => { return table_append(element, className, label, options, ['custom-basic-column']); }
        thead_append(thead1, 'col-view-clicks', '<span>VIEW주간조회수</span>', { colspan: 3 });
        thead_append(thead2, 'col-view-clicks-nblog', '<span>블로그</span>');
        thead_append(thead2, 'col-view-clicks-npost', '<span>포스트</span>');
        thead_append(thead2, 'col-view-clicks-ninfl', '<span>인플루언서</span>');
        await Promise.map(tbody.reverse(), async (row, i) => {
            const keyword = row.getAttribute('row-id'), keyword_last = row.dataset.lastRowId;
            if(!keyword || keyword == keyword_last) { return; } else { row.dataset.lastRowId = keyword; }
            const keyword_visit_blog_old = tbody_append(row, 'col-view-clicks-nblog', ''); keyword_visit_blog_old.style.backgroundColor = '';
            const keyword_visit_post_old = tbody_append(row, 'col-view-clicks-npost', ''); keyword_visit_post_old.style.backgroundColor = '';
            const keyword_visit_infl_old = tbody_append(row, 'col-view-clicks-ninfl', ''); keyword_visit_infl_old.style.backgroundColor = '';
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
            const keyword_visit_blog_per = ((keyword_visit_blog_all / (keyword_qc / 30 * 7)) * 100);
            const keyword_visit_post_per = ((keyword_visit_post_all / (keyword_qc / 30 * 7)) * 100);
            const keyword_visit_infl_per = ((keyword_visit_infl_all / (keyword_qc_m / 30 * 7)) * 100);
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
        }, { concurrency: 5 });
    }
    async function redraw(mutations) {
        if(redraw.busy) return;
        redraw.timer = clearTimeout(redraw.timer);
        redraw.timer = setTimeout(async () => {
            const elena = wrap.querySelector('elena-keyword-planner'); if(!elena) return;
            elena.classList.toggle('custom-keyword-planner-loading', redraw.busy = true);
            await update();
            elena.classList.toggle('custom-keyword-planner-loading', redraw.busy = false);
        }, 300);
    }
});