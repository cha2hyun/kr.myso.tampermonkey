// ==UserScript==
// @name         네이버 블로그 통계 어드밴스드
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-analytics.advanced.user.js
// @description  네이버 블로그 통계 그래프에 분석 및 예측에 필요한 다양한 요소를 추가해줍니다.
// @author       Won Choi
// @grant        GM_addStyle
// @match        https://blog.stat.naver.com/blog/*
// @match        https://blog.stat.naver.com/m/blog/*
// @require      https://cdn.amcharts.com/lib/4/core.js
// @require      https://cdn.amcharts.com/lib/4/charts.js
// @require      https://cdn.amcharts.com/lib/4/themes/animated.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/regression/2.0.1/regression.min.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=4
// @require      https://tampermonkey.myso.kr/assets/vendor.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// ==/UserScript==
async function main() {
    const root = document.querySelector('#_root'); if(!root) return;
    GM_donation('#_root', 0);
    GM_addStyle(`.c3 { height: auto !important; max-height: inherit !important }`);
    GM_xmlhttpRequestHook((event, res) => {
        setTimeout(() => {
            // Chart Finds
            const stat_chart = {};
            stat_chart.cv = document.querySelector('#stat_chart_cv');
            stat_chart.uv = document.querySelector('#stat_chart_uv');
            stat_chart.visit = document.querySelector('#stat_chart_visit');
            stat_chart.averageVisit = document.querySelector('#stat_chart_averageVisit');
            stat_chart.revisit = document.querySelector('#stat_chart_revisit');
            stat_chart.averageDuration = document.querySelector('#stat_chart_averageDuration');
            stat_chart.hour = document.querySelector('#stat_chart_hour');
            stat_chart.demo = document.querySelector('#stat_chart_demo');
            stat_chart.relationVisit = document.querySelector('#stat_chart_relationVisit');
            stat_chart.relationDelta = document.querySelector('#stat_chart_relationDelta');
            stat_chart.relationDemo = document.querySelector('#stat_chart_relationDemo');
            stat_chart.play_cnt = document.querySelector('#stat_chart_play_cnt');
            stat_chart.play_time = document.querySelector('#stat_chart_play_time');
            stat_chart.device_demo = document.querySelector('#stat_chart_device_demo');
            stat_chart.uniq_watcher = document.querySelector('#stat_chart_uniq_watcher');
            stat_chart.retention_uniq_watcher = document.querySelector('#stat_chart_retention_uniq_watcher');
            stat_chart.new_uniq_watcher = document.querySelector('#stat_chart_new_uniq_watcher');
            stat_chart.like_cnt = document.querySelector('#stat_chart_like_cnt');
            stat_chart.global = _.reduce(stat_chart, (global, chart)=>global||chart);
            stat_chart.global_key = _.findKey(stat_chart, stat_chart.global);
            if(!stat_chart.global) return;
            // Chart Types
            const type_chart = {};
            type_chart.cv = { types: {}, ignores: [] };
            type_chart.uv = { types: {}, ignores: [] };
            type_chart.visit = { types: {}, ignores: [] };
            type_chart.averageVisit = { types: {}, ignores: [] };
            type_chart.revisit = { types: {}, ignores: [] };
            type_chart.averageDuration = { types: {}, ignores: [] };
            type_chart.hour = { types: {}, ignores: [] };
            type_chart.demo = { types: {}, ignores: [] };
            type_chart.relationVisit = { types: {}, ignores: [] };
            type_chart.relationDelta = { types: {}, ignores: [] };
            type_chart.relationDemo = { types: {}, ignores: [] };
            type_chart.play_cnt = { types: {}, ignores: [] };
            type_chart.play_time = { types: {}, ignores: [] };
            type_chart.device_demo = { types: {}, ignores: [] };
            type_chart.uniq_watcher = { types: {}, ignores: [] };
            type_chart.retention_uniq_watcher = { types: {}, ignores: [] };
            type_chart.new_uniq_watcher = { types: {}, ignores: [] };
            type_chart.like_cnt = { types: {}, ignores: [] };
            type_chart.global = type_chart[stat_chart.global_key];
            type_chart.global_key = stat_chart.global_key;
            if(!type_chart.global) return;
            // Chart Original DOM
            const stat_chart_wrap = stat_chart.global.closest('.u_ni_stats_detail_wrap > div, .u_ni_chart_area > div');
            const stat_chart_select = stat_chart_wrap.querySelector('[class^="u_ni_select_section"]')
            const stat_chart_legend = stat_chart_wrap.querySelector('[class^="u_ni_legend_layer"]')
            const stat_chart_graphs = stat_chart.global.querySelector('svg');
            const stat_chart_axis_x = stat_chart_wrap.querySelector('.u_ni_axis_x');
            const stat_chart_axis_y = stat_chart_wrap.querySelector('.u_ni_axis_y');
            // Chart Create
            am4core.useTheme(am4themes_animated);
            const canvas_rect = stat_chart.global.getBoundingClientRect();
            const canvas = document.createElement('div'); stat_chart.global.appendChild(canvas);
            canvas.style.width = '100%';
            canvas.style.height = `${canvas_rect.height}px`;
            canvas.style.display = 'none';
            stat_chart.global.onmouseover = () => {
                canvas.style.display = 'block';
                canvas.style.height = `${canvas_rect.height*2}px`;
                // Chart Original Hide
                if(stat_chart_select) stat_chart_select.style.display = 'none';
                if(stat_chart_legend) stat_chart_legend.style.display = 'none';
                if(stat_chart_graphs) stat_chart_graphs.style.display = 'none';
                if(stat_chart_axis_x) stat_chart_axis_x.style.display = 'none';
                if(stat_chart_axis_y) stat_chart_axis_y.style.display = 'none';
            }
            stat_chart.global.onmouseleave = () => {
                canvas.style.display = 'none';
                canvas.style.height = `${canvas_rect.height*1}px`;
                // Chart Original Hide
                if(stat_chart_select) stat_chart_select.style.display = '';
                if(stat_chart_legend) stat_chart_legend.style.display = '';
                if(stat_chart_graphs) stat_chart_graphs.style.display = '';
                if(stat_chart_axis_x) stat_chart_axis_x.style.display = '';
                if(stat_chart_axis_y) stat_chart_axis_y.style.display = '';
            }
            const chart = am4core.create(canvas, am4charts.XYChart);
            const dataset = _.find(res.result.statDataList, (o)=>[type_chart.global_key].includes(o.dataId)); if(!dataset || !dataset.data || !dataset.data.rows) return;
            const dataset_labels = _.map(['date', 'age', 'hour'], (k)=>dataset.data.rows[k]).find(v=>!!v); if(!dataset_labels) return;
            const dataset_labels_key = _.map(['date', 'age', 'hour'], (k)=>dataset.data.rows[k] && k).find(v=>!!v);
            const dataset_series = Object.keys(dataset.data.rows);
            const dataset_series_values = dataset_series.filter((v)=>v!=dataset_labels_key);
            const data = _.orderBy(_.map(dataset_labels, (label, offset) => _.reduce(dataset_series, (item, name) => (item[name] = dataset.data.rows[name][offset], item), {})), [dataset_labels_key], ['asc']);
            const poly = regression.polynomial(_.map(data, (item, offset, dataset) => {
                const name = _.has(item, 'total') ? 'total' : type_chart.global_key;
                const curr = item[name], prev = (dataset[offset - 1] || {})[name] || curr;
                return [prev, curr];
            }));
            console.log(data, poly);
            chart.data = _.map(data, (item, offset)=>(item.polynomial = poly.points[offset][1],item));
            chart.colors.step = 2;
            // Create axes
            var valueAxisX = chart.xAxes.push(new am4charts.DateAxis());
            valueAxisX.renderer.minGridDistance = 100;
            valueAxisX.renderer.tooltipLocation = 0;
            function createAxisAndSeries(field, name, opposite, bullet) {
                var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
                if(chart.yAxes.indexOf(valueAxis) != 0){ valueAxis.syncWithAxis = chart.yAxes.getIndex(0); }
                var series = chart.series.push(new am4charts.LineSeries());
                series.dataFields.valueY = field;
                series.dataFields.dateX = dataset_labels_key;
                series.strokeWidth = 2;
                series.yAxis = valueAxis;
                series.name = name;
                series.tooltipText = "{name}: [bold]{valueY}[/]";
                series.tensionX = 0.9;
                series.showOnInit = true;
                var interfaceColors = new am4core.InterfaceColorSet();
                switch(bullet) {
                    case "triangle": {
                        let bullet = series.bullets.push(new am4charts.Bullet());
                        bullet.width = 12;
                        bullet.height = 12;
                        bullet.horizontalCenter = "middle";
                        bullet.verticalCenter = "middle";

                        var triangle = bullet.createChild(am4core.Triangle);
                        triangle.stroke = interfaceColors.getFor("background");
                        triangle.strokeWidth = 2;
                        triangle.direction = "top";
                        triangle.width = 12;
                        triangle.height = 12;
                        break;
                    }
                    case "rectangle": {
                        let bullet = series.bullets.push(new am4charts.Bullet());
                        bullet.width = 10;
                        bullet.height = 10;
                        bullet.horizontalCenter = "middle";
                        bullet.verticalCenter = "middle";

                        var rectangle = bullet.createChild(am4core.Rectangle);
                        rectangle.stroke = interfaceColors.getFor("background");
                        rectangle.strokeWidth = 2;
                        rectangle.width = 10;
                        rectangle.height = 10;
                        break;
                    }
                    case "circle": {
                        let bullet = series.bullets.push(new am4charts.CircleBullet());
                        bullet.circle.stroke = interfaceColors.getFor("background");
                        bullet.circle.strokeWidth = 2;
                        break;
                    }
                }
                valueAxis.renderer.disabled = true;
                valueAxis.renderer.tooltip.disabled = true;
                valueAxis.renderer.line.strokeOpacity = 1;
                valueAxis.renderer.line.strokeWidth = 2;
                valueAxis.renderer.line.stroke = series.stroke;
                valueAxis.renderer.labels.template.fill = series.stroke;
                valueAxis.renderer.opposite = opposite;
            }
            createAxisAndSeries('polynomial', '성장추세', true, "circle");
            dataset_series_values.map((label, offset) => createAxisAndSeries(label, label, true, "circle"));
            chart.legend = new am4charts.Legend();
            //chart.cursor = new am4charts.XYCursor();
        });
        return res;
    });
}
function _requestIdleCallback(callback) {
  if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
  return requestIdleCallback(callback);
}
function checkForDOM() { return (document.head) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);