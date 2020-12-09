// ==UserScript==
// @name         네이버 크리에이터 어드바이저 어드밴스드
// @namespace    https://tampermonkey.myso.kr/
// @version      2.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.creator-advisor.user.js
// @description  네이버 크리에이터 어드바이저에 새로운 기능을 추가합니다.
// @author       Won Choi
// @require      https://tampermonkey.myso.kr/assets/vendor.js?v=218
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://tampermonkey.myso.kr/assets/lib/creator-advisor.js?v=2
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js
// @require      https://cdn.amcharts.com/lib/4/core.js
// @require      https://cdn.amcharts.com/lib/4/charts.js
// @require      https://cdn.amcharts.com/lib/4/themes/animated.js
// @grant        GM_addStyle
// @match        *://creator-advisor.naver.com/*
// ==/UserScript==
async function main() {
    window.GM_donation('#root');
    window.addEventListener('locationchange', async function() {
        if(location.pathname != '/') return;
        const channels = await window.CreatorAdvisor.exec('channels');
        // wrap
        const section_wrap = document.querySelector('.u_ni_section_wrap');
        const section_rank = section_wrap.querySelector('.u_ni_section_rank') || document.createElement('form'); section_wrap.prepend(section_rank);
        section_rank.classList.add('u_ni_section_rank', 'u_ni_section_unit', 'u_ni_ranking_component');
        section_rank.style.marginTop = '15px';
        // header
        const search_head = section_rank.querySelector('.u_ni_title_section') || document.createElement('div'); section_rank.append(search_head);
        search_head.classList.add('u_ni_title_section');
        search_head.innerHTML = `<h2 class="u_ni_title">조회수 검색</h2>`
        // content
        const search_wrap = section_rank.querySelector('.u_ni_desc_section') || document.createElement('div'); section_rank.append(search_wrap);
        search_wrap.classList.add('u_ni_desc_section');
        search_wrap.style.display = 'flex';
        // chrat
        const search_chart = section_rank.querySelector('.u_ni_chrat') || document.createElement('div'); section_rank.append(search_chart);
        search_chart.classList.add('u_ni_chrat');
        search_chart.setAttribute('id', 'chartdiv');
        search_chart.setAttribute('style', 'height: 100px; margin: 15px;');
        // list
        const search_list = section_rank.querySelector('.u_ni_list') || document.createElement('ul'); section_rank.append(search_list);
        search_list.classList.add('u_ni_list', 'u_ni_info', 'u_ni_ranking_main', 'u_ni_ranking_component');

        const search_service = search_wrap.querySelector('.u_ni_description_service') || document.createElement('select'); search_wrap.append(search_service);
        search_service.classList.add('u_ni_description', 'u_ni_description_service');
        search_service.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px; -moz-appearance: auto; appearance: auto; -webkit-appearance: auto;');
        search_service.innerHTML = '';
        search_service.innerHTML += `<option value="naver_blog">네이버 블로그</option>`;
        search_service.innerHTML += `<option value="naver_post">네이버 포스트</option>`;
        search_service.innerHTML += `<option value="influencer">네이버 인플루언서 검색</option>`;

        const search_date_start = search_wrap.querySelector('.u_ni_description_date') || document.createElement('input'); search_wrap.append(search_date_start);
        search_date_start.classList.add('u_ni_description', 'u_ni_description_date');
        search_date_start.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px; margin-left: 4px;');
        search_date_start.setAttribute('type', 'date');
        search_date_start.setAttribute('placeholder', '조회할 날짜를 입력해주세요. (YYYY-MM-DD)');
        search_date_start.value = moment().subtract(2, 'days').format('YYYY-MM-DD');

        const search_date_limit = search_wrap.querySelector('.u_ni_description_date2') || document.createElement('input'); search_wrap.append(search_date_limit);
        search_date_limit.classList.add('u_ni_description', 'u_ni_description_date2');
        search_date_limit.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px; margin-left: 4px;');
        search_date_limit.setAttribute('type', 'date');
        search_date_limit.setAttribute('placeholder', '조회할 날짜를 입력해주세요. (YYYY-MM-DD)');
        search_date_limit.value = moment().format('YYYY-MM-DD');

        const search_box = search_wrap.querySelector('.u_ni_description_keyword') || document.createElement('input'); search_wrap.append(search_box);
        search_box.classList.add('u_ni_description', 'u_ni_description_keyword');
        search_box.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px; margin-left: 4px;');
        search_box.setAttribute('placeholder', '조회할 검색어를 입력한 뒤 엔터를 눌러주세요.');
        search_box.style.flex = 1;
        // ----------------
        section_rank.addEventListener('submit', async function(e) {
            e.preventDefault();
            const type = channels.find(o=>o.service == search_service.value);
            const date_range = _.range(new Date(search_date_start.value), new Date(search_date_limit.value), 1000 * 60 * 60 * 24).map((o)=>moment(o).format('YYYY-MM-DD')).concat([search_date_limit.value]);
            const analysis_uri = new URL('https://in.naverpp.com/extension/api/analysis/search');
            analysis_uri.searchParams.set('startDate', search_date_start.value);
            analysis_uri.searchParams.set('endDate', search_date_limit.value);
            analysis_uri.searchParams.set('keyword', search_box.value);
            const analysis = await fetch(analysis_uri).then(r=>r.json()).catch(e=>null);
            const contents = await Promise.map(date_range, async (date) => {
                const contents = await window.CreatorAdvisor.exec('popular-contents', { service: type.service, channelId: type.channelId, date, keyword: search_box.value });
                return { date, data: contents.data }
            });
            // Themes begin
            am4core.useTheme(am4themes_animated);
            // Themes end

            // Create chart instance
            var container = am4core.create("chartdiv", am4core.Container);
            container.layout = "grid";
            container.fixedWidthGrid = false;
            container.width = am4core.percent(100);
            container.height = am4core.percent(100);

            // Color set
            var colors = new am4core.ColorSet();

            // Functions that create various sparklines
            function createLine(title, data, color) {
                var chart = container.createChild(am4charts.XYChart);
                chart.width = am4core.percent(100);
                chart.height = am4core.percent(70);

                chart.data = data;

                chart.titles.template.fontSize = 16;
                chart.titles.template.textAlign = "left";
                chart.titles.template.isMeasured = false;
                chart.titles.create().text = title;

                var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
                dateAxis.renderer.grid.template.disabled = true;
                dateAxis.renderer.labels.template.disabled = true;
                dateAxis.startLocation = 0.5;
                dateAxis.endLocation = 0.7;
                dateAxis.cursorTooltipEnabled = false;

                var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxis.min = 0;
                valueAxis.renderer.grid.template.disabled = true;
                valueAxis.renderer.baseGrid.disabled = true;
                valueAxis.renderer.labels.template.disabled = true;
                valueAxis.cursorTooltipEnabled = false;

                chart.cursor = new am4charts.XYCursor();
                chart.cursor.lineY.disabled = true;
                chart.cursor.behavior = "none";

                var series = chart.series.push(new am4charts.LineSeries());
                series.tooltipText = "{date}: [bold]{value}";
                series.dataFields.dateX = "date";
                series.dataFields.valueY = "value";
                series.tensionX = 0.8;
                series.strokeWidth = 2;
                series.stroke = color;

                // render data points as bullets
                var bullet = series.bullets.push(new am4charts.CircleBullet());
                bullet.circle.opacity = 0;
                bullet.circle.fill = color;
                bullet.circle.propertyFields.opacity = "opacity";
                bullet.circle.radius = 3;

                return chart;
            }
            createLine("일일 검색량", analysis.data.map((item)=>({ date: new Date(item.date), value: item.search })), colors.getIndex(0));
            search_list.innerHTML = '';
            contents.map(({ date, data }) => {
                if('heading'){
                    const li = document.createElement('li'); li.classList.add('u_ni_item');
                    const t = document.createElement('h3'); li.append(t); t.classList.add('u_ni_title');
                    t.textContent = date;
                    search_list.append(li);
                }
                if(data && data.length) {
                    data.map((item) => {
                        const { channelName, contentId, createdAt, metricValue, rank, title } = item;
                        const li = document.createElement('li'); li.classList.add('u_ni_item');
                        const a = document.createElement('em'); li.append(a); a.classList.add('u_ni_num');
                        a.textContent = rank;

                        const b = document.createElement('div'); li.append(b); b.classList.add('u_ni_info_box');
                        const w = document.createElement('div'); b.append(w); w.classList.add('u_ni_link');

                        const t = document.createElement('a'); w.append(t); t.classList.add('u_ni_title');
                        t.setAttribute('href', contentId);
                        t.setAttribute('target', '_blank');
                        t.setAttribute('rel', 'noopener noreferrer');
                        t.textContent = title;

                        const i = document.createElement('div'); w.append(i); i.classList.add('u_ni_figure_desc');
                        const c = document.createElement('span'); i.append(c); c.classList.add('u_ni_info_txt', 'u_ni_ico_view');
                        c.textContent = metricValue;
                        const d = document.createElement('span'); i.append(d); d.classList.add('u_ni_info_txt');
                        d.textContent = moment(createdAt).format('YYYY. MM. DD. HH:mm');
                        const e = document.createElement('span'); i.append(e); e.classList.add('u_ni_info_txt');
                        e.textContent = channelName;
                        search_list.append(li);
                    })
                } else {
                    const li = document.createElement('li'); li.classList.add('u_ni_item');
                    li.textContent = '검색결과가 없습니다';
                    search_list.append(li);
                }
            });
            /*
            const contents = await window.CreatorAdvisor.exec('popular-contents', { service: type.service, channelId: type.channelId, date: search_date.value, keyword: search_box.value });
            if(!contents.data || !contents.data.length) {

            } else {
                const { data, parameters } = contents;
                const { date, keyword } = parameters;
                search_list.innerHTML = '';

            }*/
        });
    });
}
function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
