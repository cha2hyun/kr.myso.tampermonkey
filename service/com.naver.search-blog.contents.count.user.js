// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 노출량 및 발행량 모니터링
// @description  네이버 검색결과에서 기간별 노출량 및 발행량 정보를 확인할 수 있습니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.3
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-blog.contents.count.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.24/assets/lib/naver-search-nx.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    GM_donation('#container', 0);
    function format_number(number) { return number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ); }
    const keyword = (new URL(location.href)).searchParams.get('query'); if(!keyword) return;
    const pack = document.querySelector('#main_pack, #snb');
    const wrap = pack.querySelector('.section.count') || document.createElement('section'); wrap.classList.add('section', 'count'); wrap.setAttribute('style', 'margin-top: 9px'); pack.prepend(wrap);
    const canv = wrap.querySelector('.section-item') || document.createElement('div'); canv.setAttribute('style', 'padding:1em; background:#fff; border-radius:6px; border: 1px solid #eee; font-size: 12px;'); wrap.append(canv);
    canv.innerHTML = '생산량 불러오는 중...';
    const data = await Promise.props({
        blog_count_tt: NX_count(keyword, 'blog', 'normal', { api_type: 1 }),
        blog_count_1m: NX_count(keyword, 'blog', 'normal', { api_type: 1, nso: 'so:r,p:1m' }),
        blog_count_1w: NX_count(keyword, 'blog', 'normal', { api_type: 1, nso: 'so:r,p:1w' }),
        blog_count_1d: NX_count(keyword, 'blog', 'normal', { api_type: 1, nso: 'so:r,p:1d' }),
        blog_count_1h: NX_count(keyword, 'blog', 'normal', { api_type: 1, nso: 'so:r,p:1h' }),
        view_count_tt: NX_count(keyword, 'view', 'normal', { api_type: 11 }),
        view_count_1m: NX_count(keyword, 'view', 'normal', { api_type: 11, nso: 'so:r,p:1m' }),
        view_count_1w: NX_count(keyword, 'view', 'normal', { api_type: 11, nso: 'so:r,p:1w' }),
        view_count_1d: NX_count(keyword, 'view', 'normal', { api_type: 11, nso: 'so:r,p:1d' }),
        view_count_1h: NX_count(keyword, 'view', 'normal', { api_type: 11, nso: 'so:r,p:1h' }),
        cafe_count_tt: NX_count(keyword, 'article', 'normal', { prmore: 1 }),
        cafe_count_1m: NX_count(keyword, 'article', 'normal', { prmore: 1, nso: 'so:r,p:1m' }),
        cafe_count_1w: NX_count(keyword, 'article', 'normal', { prmore: 1, nso: 'so:r,p:1w' }),
        cafe_count_1d: NX_count(keyword, 'article', 'normal', { prmore: 1, nso: 'so:r,p:1d' }),
        cafe_count_1h: NX_count(keyword, 'article', 'normal', { prmore: 1, nso: 'so:r,p:1h' }),
    });
    canv.innerHTML = `
    <h4 style="text-align: center; padding-bottom:6px;">검색어 노출량 및 생산량</h4>
    <table style="font-size:12px; width: 100%;">
      <thead>
        <tr>
          <th style="text-align: left;">구분</th>
          <th style="text-align: right;">일간</th>
          <th style="text-align: right;">주간</th>
          <th style="text-align: right;">월간</th>
          <th style="text-align: right;">전체</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style="text-align: left;">VIEW</th>
          <td style="text-align: right;">${format_number(data.view_count_1d || 0)}건 노출</td>
          <td style="text-align: right;">${format_number(data.view_count_1w || 0)}건 노출</td>
          <td style="text-align: right;">${format_number(data.view_count_1m || 0)}건 노출</td>
          <td style="text-align: right;">${format_number(data.view_count_tt || 0)}건 노출</td>
        </tr>
        <tr>
          <th style="text-align: left;">BLOG</th>
          <td style="text-align: right;">${format_number(data.blog_count_1d || 0)}건 생산</td>
          <td style="text-align: right;">${format_number(data.blog_count_1w || 0)}건 생산</td>
          <td style="text-align: right;">${format_number(data.blog_count_1m || 0)}건 생산</td>
          <td style="text-align: right;">${format_number(data.blog_count_tt || 0)}건 생산</td>
        </tr>
        <tr>
          <th style="text-align: left;">CAFE</th>
          <td style="text-align: right;">${format_number(data.cafe_count_1d || 0)}건 생산</td>
          <td style="text-align: right;">${format_number(data.cafe_count_1w || 0)}건 생산</td>
          <td style="text-align: right;">${format_number(data.cafe_count_1m || 0)}건 생산</td>
          <td style="text-align: right;">${format_number(data.cafe_count_tt || 0)}건 생산</td>
        </tr>
      </tbody>
    </table>
    `;
})