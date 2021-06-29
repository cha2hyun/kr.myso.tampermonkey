// ==UserScript==
// @name         네이버 블로그 통계 어드밴스드
// @namespace    https://tampermonkey.myso.kr/
// @version      1.1.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-analytics.advanced.user.js
// @description  네이버 블로그 통계 그래프에 분석 및 예측에 필요한 다양한 요소를 추가해줍니다.
// @author       Won Choi
// @connect      naver.com
// @match        https://blog.stat.naver.com/blog/*
// @match        https://blog.stat.naver.com/m/blog/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/vendor/gm-xmlhttp-request-cors.js
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/vendor/gm-xmlhttp-request-hook.js
// @require      https://cdn.jsdelivr.net/gh/myso-kr/kr.myso.tampermonkey/assets/donation.js?v=210613
// @require      https://cdn.amcharts.com/lib/4/core.js
// @require      https://cdn.amcharts.com/lib/4/charts.js
// @require      https://cdn.amcharts.com/lib/4/themes/animated.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/regression/2.0.1/regression.min.js
// ==/UserScript==
GM_App(async function main() {
    const root = document.querySelector('#_root'); if(!root) return;
    GM_donation('#_root');
    GM_addStyle(`html, body { height: 100%; overflow:hidden; } #_root { overflow-y: scroll; height: 100%; }`);
    GM_addStyle(`.u_ni_chart_amchart + * { display: none; }`);
    GM_addStyle(`.u_ni_chart_amchart { width: 100%; height: 480px; }`);
    GM_xmlhttpRequestHook((event, res) => {
        // parse data
        function NB_blogStatObject(resp) {
            resp && resp.map((item)=>{
                const data = item.data || {};
                const rows = data.rows || {};
                const cols = Object.keys(rows);
                const head = cols[0], headdata = rows[head];
                resp[item.dataId] = headdata ? headdata.map((nil, idx) => cols.reduce((r, key)=>(r[key] = rows[key][idx], r), {})) : data;
            });
            return resp;
        }
        const dataset = NB_blogStatObject(res.result.statDataList);
        const head = ['total', 'cv', 'uv', 'visit', 'averageVisit', 'revisit', 'averageDuration', 'relationVisit', 'relationDelta', 'play_cnt'];
        const temp = head.reduce((r, k)=>_.get(dataset, k, r), ''); if(!temp) return res;
        const poly = regression.linear(_.map(temp, (item, offset, dataset) => {
            const name = head.reduce((r, k)=>_.has(item, k) ? k : r, '');
            const curr = item[name], prev = (dataset[offset - 1] || {})[name] || curr;
            return [prev, curr];
        }));
        const data = _.map(temp, (item, offset)=>(item.polynomial = poly.points[offset][1], item));
        const keys = Object.keys(data[0] || {}).filter(k=>!['date'].includes(k));
        // create chart
        const component = document.querySelector('.u_ni_chart_component'); if(!component) return res;
        const canvas = component.querySelector('.u_ni_chart_amchart') || document.createElement('div');
        if(!canvas.className) { canvas.className = 'u_ni_chart_amchart'; component.append(canvas); }
        am4core.useTheme(am4themes_animated);
        const chart = am4core.create(canvas, am4charts.XYChart);
        chart.data = _.map(data, (item)=>(item.date = moment(item.date).toDate(), item));
        const categoryAxis = chart.xAxes.push(new am4charts.DateAxis());
        categoryAxis.renderer.grid.template.location = 0;
        categoryAxis.renderer.minGridDistance = 30;

        const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        function createSeriesAndAxis(field, name, topMargin, bottomMargin) {
            const series = chart.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = field;
            series.dataFields.dateX = "date";
            series.name = name;
            series.tooltipText = "{dateX}: [b]{valueY}[/]";
            series.strokeWidth = 2;
            series.yAxis = valueAxis;

            valueAxis.renderer.line.strokeOpacity = 1;
            valueAxis.renderer.line.stroke = series.stroke;
            valueAxis.renderer.grid.template.stroke = series.stroke;
            valueAxis.renderer.grid.template.strokeOpacity = 0.1;
            valueAxis.renderer.labels.template.fill = series.stroke;
            valueAxis.renderer.minGridDistance = 20;
            valueAxis.align = "right";

            if (topMargin && bottomMargin) {
                valueAxis.marginTop = 10;
                valueAxis.marginBottom = 10;
            }
            else {
                if (topMargin) {
                    valueAxis.marginTop = 20;
                }
                if (bottomMargin) {
                    valueAxis.marginBottom = 20;
                }
            }

            var bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.stroke = am4core.color("#fff");
            bullet.circle.strokeWidth = 2;
        }
        keys.map((key)=>createSeriesAndAxis(key, key, false, false));

        chart.legend = new am4charts.Legend();
        chart.cursor = new am4charts.XYCursor();

        chart.leftAxesContainer.layout = "vertical";
        return res;
    });
});