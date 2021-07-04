// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 크리에이터 어드바이저 키워드 유입수 분석
// @description  네이버 검색결과에서 상위 5개 게시글에 대한 공백을 구분하는 키워드 유입수 통계를 제공합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-views.analysis.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.18/assets/lib/naver-creator-advisor.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.33/moment-timezone.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    moment.tz.setDefault("Asia/Seoul");
    GM_donation('#container', 0);
    GM_addStyle(`
    .search_adviser { margin-bottom:15px; background: #fcfcfc; padding: 6px; }
    .search_adviser .adviser_info { font-size:12px; text-align: center; margin: 0; padding-bottom:6px; }
    .search_adviser .adviser_info.adviser_info_empty { color: #d3d3d3; }
    .search_adviser .adviser_info.adviser_info_loading {}
    .search_adviser .adviser_view_listview { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 11px; }
    .search_adviser .adviser_view_listitem { display: grid; grid-template-columns: 2fr 1fr 1fr; outline: 1px solid #fff; padding: 8px; }
    .search_adviser .adviser_view_listitem:hover { background: rgba(0,0,255, 0.1); }
    `);
    function parse_nso(rule) {
        const nso = (rule || '').split(',').map(item=>item.split(':')).reduce((nso, item)=>(nso[item[0]] = item[1], nso), {});
        const rng = /^(?<type>(all|1h|1d|1w|1m|3m|6m|1y))|(from(?<edate>[\d]+)to(?<sdate>[\d]+))$/.exec(nso.p || '');
        let edate = ((rng && rng.groups && rng.groups.edate) ? moment(rng.groups.edate, 'YYYYMMDD') : moment().subtract(1, 'days')).format('YYYY-MM-DD');
        let sdate = ((rng && rng.groups && rng.groups.sdate) ? moment(rng.groups.sdate, 'YYYYMMDD') : moment(edate).subtract(7, 'days')).format('YYYY-MM-DD');
        if(rng && rng.groups && rng.groups.type == '1m') sdate = moment(edate).subtract(1, 'months').format('YYYY-MM-DD');
        if(rng && rng.groups && rng.groups.type == '3m') sdate = moment(edate).subtract(3, 'months').format('YYYY-MM-DD');
        if(rng && rng.groups && rng.groups.type == '6m') sdate = moment(edate).subtract(3, 'months').format('YYYY-MM-DD');
        if(rng && rng.groups && rng.groups.type == '1y') sdate = moment(edate).subtract(3, 'months').format('YYYY-MM-DD');
        return { edate, sdate };
    }
    function get_nso() {
        const uri = new URL(location.href);
        const data = Object.assign({}, Object.fromEntries(uri.searchParams));
        return parse_nso(data.nso);
    }
    function find_channels(where) {
        const list = [];
        list.push({ where: ['nexearch', 'm'], channels: ['naver_blog', 'naver_post'] });
        list.push({ where: ['view', 'm_view'], channels: ['naver_blog', 'naver_post'] });
        list.push({ where: ['blog', 'm_blog'], channels: ['naver_blog'] });
        const item = list.find(item=>item.where.includes(where));
        return item ? item.channels : [];
    }
    async function find_popular_contents() {
        if(find_popular_contents.cache) return find_popular_contents.cache;
        const uri = new URL(location.href);
        const data = Object.assign({}, Object.fromEntries(uri.searchParams));
        const date = parse_nso(data.nso);
        const channels_find = find_channels(data.where);
        const channels = await CreatorAdvisor.exec('channels');
        const channels_uniq = _.uniqBy(channels, 'service').filter(item=>channels_find.includes(item.service));
        const channels_data = await Promise.mapSeries(channels_uniq, async (channel) => {
            const popularContents = await Promise.map(_.range(moment(date.edate).diff(date.sdate, 'days') + 1).map((o)=>moment(date.edate).subtract(o, 'days').format('YYYY-MM-DD')), async (date) => {
                const params = { service: channel.service, channelId: channel.channelId, date, keyword: data.query };
                if(params.service == 'influencer') Object.assign(params, { metric: 'cv', contentType: 'text', interval: 'day', limit: 5 });
                if(params.service == 'naver_blog') Object.assign(params, { metric: 'cv', contentType: 'text', interval: 'day', limit: 5 });
                if(params.service == 'naver_post') Object.assign(params, { metric: 'cv', contentType: 'text', interval: 'day', limit: 5 });
                if(params.service == 'ntv') Object.assign(params, { metric: 'play_count', contentType: 'video', interval: 'day', limit: 5 });
                const contents = await window.CreatorAdvisor.exec('popular-contents', params);
                return { date, data: contents.data }
            }, { concurrency: 2 });
            return { ...channel, popularContents };
        });
        return find_popular_contents.cache = channels_data;
    }
    async function observe(target) {
        const uri = new URL(location.href), query = uri.searchParams.get('query'); if(!query) return;
        const observer = new MutationObserver(async function(mutations) {
            let start = (30 * (Math.ceil(Math.max(0, target.children.length) / 30) - 1)) + 1;
            await update(query, start);
        });
        const config = { attributes: true, childList: true, characterData: true };
        observer.observe(target, config);
        await update(query);
    }
    async function update(keyword, start = 1) {
        const nso = get_nso();
        const items = Array.from(document.querySelectorAll('[data-cr-gdid][data-cr-rank]'));
        await Promise.map(items, async (item) => {
            const title = item.querySelector('a.total_tit'); if(!title) return;
            const cnv = item.querySelector('div.search_adviser') || document.createElement('div'); cnv.classList.add('search_adviser'); item.append(cnv);
            cnv.innerHTML = `<h2 class="adviser_info adviser_info_loading">${nso.sdate} ~ ${nso.edate} 기간 내의 "${keyword}" 키워드 유입량을 가져오는 중입니다...</h2>`;
        });
        const finds = await find_popular_contents();
        const flats = finds.map(o=>o.popularContents).map(o=>o.map(a=>a.data.map((info)=>({ date: a.date, ...info }))).flat()).flat();
        await Promise.map(items, async (item) => {
            const title = item.querySelector('a.total_tit'); if(!title) return;
            const cnv = item.querySelector('div.search_adviser') || document.createElement('div'); cnv.classList.add('search_adviser'); item.append(cnv);
            const contentUrl = ((el)=>el && el.href && new URL(el.href))(title);
            const channelName = ((el)=>el && el.textContent && el.textContent.trim())(item.querySelector('.source_txt, .sub_txt.sub_name'));
            const popularContents = flats.filter(o=>o.contentId.includes(`${contentUrl.pathname}${contentUrl.search}`) || o.channelName == channelName);
            if(!popularContents.length) {
                cnv.innerHTML = `<h2 class="adviser_info adviser_info_empty">${nso.sdate} ~ ${nso.edate} 기간 내에 "${keyword}" 키워드 유입이 없습니다.</h2>`;
                return;
            }
            const popularContentsHead = _.head(popularContents);
            const popularContentsLast = _.last(popularContents);
            const popularContentsTotal = _.sumBy(popularContents, 'metricValue');
            const data = { popularContents, popularContentsTotal, popularContentsHead, popularContentsLast };
            const tmpl = Handlebars.compile(`
              <h2 class="adviser_info">키워드 유입량 분석 ({{popularContentsLast.date}} ~ {{popularContentsHead.date}}) - 누적 {{popularContentsTotal}}건</h2>
              <div class="adviser_view_listview">
                {{#each popularContents}}
                <div class="adviser_view_listitem">
                  <div style="text-align:left; font-weight: bold;">{{date}}</div>
                  <div style="text-align:right">{{rank}}위</div>
                  <div style="text-align:right">{{metricValue}}건</div>
                </div>
                {{/each}}
              </div>
            `);
            cnv.innerHTML = tmpl(data);
        });
    }
    const wrp = document.querySelector('ul.lst_total'); if(wrp) observe(wrp);
  })