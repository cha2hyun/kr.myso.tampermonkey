// ==UserScript==
// @name         네이버 크리에이터 어드바이저 어드밴스드
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.creator-advisor.user.js
// @description  네이버 크리에이터 어드바이저에 새로운 기능을 추가합니다.
// @author       Won Choi
// @require      https://tampermonkey.myso.kr/assets/vendor.js?v=218
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=5
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js
// @grant        GM_addStyle
// @match        *://creator-advisor.naver.com/*
// ==/UserScript==
async function main() {
  window.GM_donation('#root');
  window.addEventListener('locationchange',function() {
      if(location.pathname != '/') return;
      const section_wrap = document.querySelector('.u_ni_section_wrap');
      const section_rank = section_wrap.querySelector('.u_ni_section_rank') || document.createElement('form'); section_wrap.prepend(section_rank);
      section_rank.classList.add('u_ni_section_rank', 'u_ni_section_unit', 'u_ni_ranking_component');
      section_rank.style.marginTop = '15px';
      // header
      const search_head = section_rank.querySelector('.u_ni_title_section') || document.createElement('div'); section_rank.append(search_head);
      search_head.classList.add('u_ni_title_section');
      search_head.innerHTML = `<h2 class="u_ni_title">인플루언서 실시간 조회수 검색</h2>`
      // content
      const search_wrap = section_rank.querySelector('.u_ni_desc_section') || document.createElement('div'); section_rank.append(search_wrap);
      const search_list = section_rank.querySelector('.u_ni_list') || document.createElement('ul'); section_rank.append(search_list);
      search_wrap.classList.add('u_ni_desc_section');
      search_wrap.style.display = 'flex';
      search_list.classList.add('u_ni_list', 'u_ni_info', 'u_ni_ranking_main');
      const search_box = search_wrap.querySelector('.u_ni_description') || document.createElement('input'); search_wrap.append(search_box);
      search_box.classList.add('u_ni_description');
      search_box.setAttribute('placeholder', '조회할 검색어를 입력해주세요.');
      search_box.style.flex = 1;
      // ----------------
      section_rank.addEventListener('submit', function(e) {
          e.preventDefault();
          const keyword = search_box.value;
          const uri = new URL('https://creator-advisor.naver.com/api/v2/inflow-analysis/popular-contents?service=influencer&metric=cv&contentType=text&interval=day&date=2020-11-20&limit=5');
          uri.searchParams.set('channelId', '');
          uri.searchParams.set('keyword', keyword);
          fetch(uri).then(r=>r.json()).then((json)=>{
              const { data, parameters } = json;
              const { date, keyword } = parameters;
              search_list.innerHTML = '';
              if(data && data.length) {
                  data.map((item) => {
                      const { channelName, contentId, createdAt, metricValue, rank, title } = item;
                      const li = document.createElement('li'); li.classList.add('u_ni_item');
                      const t = document.createElement('a'); li.append(t); t.classList.add('u_ni_title');
                      t.setAttribute('href', contentId);
                      t.setAttribute('target', '_blank');
                      t.setAttribute('rel', 'noopener noreferrer');
                      t.textContent = `#${rank}. ${title}`;
                      const b = document.createElement('div'); li.append(b); b.classList.add('u_ni_info_box');
                      const c = document.createElement('span'); b.append(c); c.classList.add('u_ni_info_txt', 'u_ni_ico_view');
                      const d = document.createElement('span'); b.append(d); d.classList.add('u_ni_info_txt');
                      const e = document.createElement('span'); b.append(e); e.classList.add('u_ni_info_txt');
                      const f = document.createElement('span'); b.append(f); f.classList.add('u_ni_info_txt');
                      c.textContent = metricValue;
                      d.textContent = moment(createdAt).format('YYYY. MM. DD. HH:mm');
                      e.textContent = channelName;
                      f.textContent = `${date} 기준`;
                      search_list.append(li);
                  })
              } else {
                  const li = document.createElement('li'); li.classList.add('u_ni_item');
                  li.textContent = '검색결과가 없습니다';
                  search_list.append(li);
              }
          }).catch(console.error);
      });


      console.log(section_wrap);

  });
  window.handleElementRecursive = function handleElementRecursive(element, ...props) {
      /*if(element.classList.contains('u_ni_container')){

      }*/
  }
}
function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
