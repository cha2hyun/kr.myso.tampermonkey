// ==UserScript==
// @name         네이버 크리에이터 어드바이저 어드밴스드
// @namespace    https://tampermonkey.myso.kr/
// @version      1.1.1
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
        search_head.innerHTML = `<h2 class="u_ni_title">조회수 검색</h2>`
        // content
        const search_wrap = section_rank.querySelector('.u_ni_desc_section') || document.createElement('div'); section_rank.append(search_wrap);
        const search_list = section_rank.querySelector('.u_ni_list') || document.createElement('ul'); section_rank.append(search_list);
        search_wrap.classList.add('u_ni_desc_section');
        search_wrap.style.display = 'flex';
        search_list.classList.add('u_ni_list', 'u_ni_info', 'u_ni_ranking_main');

        const search_service = search_wrap.querySelector('.u_ni_description_service') || document.createElement('select'); search_wrap.append(search_service);
        search_service.classList.add('u_ni_description', 'u_ni_description_service');
        search_service.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px; -moz-appearance: auto; appearance: auto; -webkit-appearance: auto;');
        search_service.innerHTML = '';
        search_service.innerHTML += `<option value="naver_blog">네이버 블로그</option>`;
        search_service.innerHTML += `<option value="naver_post">네이버 포스트</option>`;
        search_service.innerHTML += `<option value="influencer">네이버 인플루언서 검색</option>`;

        const search_box = search_wrap.querySelector('.u_ni_description_keyword') || document.createElement('input'); search_wrap.append(search_box);
        search_box.classList.add('u_ni_description', 'u_ni_description_keyword');
        search_box.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px; margin: 0 4px;');
        search_box.setAttribute('placeholder', '조회할 검색어를 입력한 뒤 엔터를 눌러주세요.');
        search_box.style.flex = 1;

        const search_date = search_wrap.querySelector('.u_ni_description_date') || document.createElement('input'); search_wrap.append(search_date);
        search_date.classList.add('u_ni_description', 'u_ni_description_date');
        search_date.setAttribute('style', 'padding: 2px; border: 1px solid #000; border-radius:5px;');
        search_date.setAttribute('type', 'date');
        search_date.setAttribute('placeholder', '조회할 날짜를 입력해주세요. (YYYY-MM-DD)');
        search_date.value = moment().subtract(2, 'days').format('YYYY-MM-DD');
        // ----------------
        section_rank.addEventListener('submit', async function(e) {
            e.preventDefault();
            const analysis_uri = new URL('https://in.naverpp.com/extension/api/analysis/search');
            analysis_uri.searchParams.set('date', search_date.value);
            analysis_uri.searchParams.set('keyword', search_box.value);
            const analysis = await fetch(analysis_uri).then(r=>r.json()).catch(e=>null);
            if(analysis) {
                if(analysis.error) {
                    search_head.innerHTML = `<h2 class="u_ni_title">조회수 검색 <small>- ${analysis.message}</small></h2>`
                }else if(analysis.data) {
                    search_head.innerHTML = `<h2 class="u_ni_title">조회수 검색 <small>- "${analysis.keyword}" 일일 트래픽 ${analysis.data.search}건 (네이버광고 및 데이터랩 기준)</small></h2>`
                }else{
                    search_head.innerHTML = `<h2 class="u_ni_title">조회수 검색 <small>- "${analysis.keyword}" 일일 트래픽 집계 안됨 (네이버광고 및 데이터랩 기준)</small></h2>`
                }

            }

            const populars_uri = new URL('https://creator-advisor.naver.com/api/v2/inflow-analysis/popular-contents?service=&metric=cv&contentType=text&interval=day&date=&limit=5');
            populars_uri.searchParams.set('service', search_service.value);
            populars_uri.searchParams.set('channelId', '');
            populars_uri.searchParams.set('date', search_date.value);
            populars_uri.searchParams.set('keyword', search_box.value);
            const populars = await fetch(populars_uri).then(r=>r.json()).catch(e=>null);
            if(populars) {
                const { data, parameters } = populars;
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
            }
        });
    });
  }
  function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
  requestIdleCallback(checkForDOM);
  