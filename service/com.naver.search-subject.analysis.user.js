// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 검색결과 검색어 주제 적합성 분석
// @description  네이버 검색결과에서 제목 또는 문장을 검색하면, 세부 키워드를 추출하여 주제 적합도를 검사해줍니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.search-subject.analysis.user.js
// @author       Won Choi
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.22/assets/lib/naver-search-rx.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
  GM_donation('#container', 0);
  function format_number(number) { return number.toString().split( /(?=(?:\d{3})+(?:\.|$))/g ).join( "," ); }
  const keyword = (new URL(location.href)).searchParams.get('query'); if(!keyword) return;
  const pack = document.querySelector('#main_pack, #snb');
  const wrap = pack.querySelector('.section.subject-analysis') || document.createElement('section'); wrap.classList.add('section', 'subject-analysis'); wrap.setAttribute('style', 'margin-top: 9px'); pack.prepend(wrap);
  const canv = wrap.querySelector('.section-item') || document.createElement('div'); canv.setAttribute('style', 'padding:1em; background:#fff; border-radius:6px; border: 1px solid #eee; font-size: 12px;'); wrap.append(canv);
  canv.innerHTML = '검색어 주제 적합성 분석 중...';
  const term = await NX_termsParagraph(keyword);
  const role = await NR_termsAll(...term);
  const kg_w = role.reduce((r, o)=>(r.push(...o.r_category ? o.r_category.split(',').map(c=>({ query: o.query, category: c.trim() })) : []), r), []);
  const kg_c = role.reduce((r, o)=>(o.theme && o.theme.main && r.push({ query: o.query, theme: o.theme.main.name }), o.theme && o.theme.sub && r.push(...o.theme.sub.map(t=>({ query: o.query, theme: t.name }))), r), []);
  const ka_w = _.orderBy(_.map(_.groupBy(kg_w, 'category'), (a, k)=>({ category: k, items: a, count: a.length, score: ((a.length / role.length) * 100).toFixed(2) })), ['count', 'category'], ['desc', 'asc']);
  const ka_c = _.orderBy(_.map(_.groupBy(kg_c, 'theme'), (a, k)=>({ theme: k, items: a, count: a.length, score: ((a.length / role.length) * 100).toFixed(2) })), ['count', 'theme'], ['desc', 'asc']);
  const data = { role, ka_w, ka_c }
  const tmpl = Handlebars.compile(`
  <div style="display: flex; flex-direction: row">
    <div style="flex-grow: 1; padding: 1rem; border-right: 1px solid #eee;">
      <h4 style="text-align: center; padding-bottom:6px;">검색어 생산 주제 적합성</h4>
      <table style="font-size:12px; width: 100%;">
        <thead>
          <tr>
            <th style="text-align: left;">주제</th>
            <th style="text-align: right;">적합도</th>
          </tr>
        </thead>
        <tbody>
          {{#each ka_w}}
          <tr>
            <td style="text-align: left;">{{category}}</td>
            <td style="text-align: right;">{{score}}%</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
    <div style="flex-grow: 1; padding: 1rem;">
      <h4 style="text-align: center; padding-bottom:6px;">검색어 소비 주제 적합성</h4>
      <table style="font-size:12px; width: 100%;">
        <thead>
          <tr>
            <th style="text-align: left;">주제</th>
            <th style="text-align: right;">적합도</th>
          </tr>
        </thead>
        <tbody>
          {{#each ka_c}}
          <tr>
            <td style="text-align: left;">{{theme}}</td>
            <td style="text-align: right;">{{score}}%</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
  </div>
  `);
  canv.innerHTML = tmpl(data);
})