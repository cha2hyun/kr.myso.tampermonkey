// ==UserScript==
// @name         네이버 인플루언서 홈 키워드 챌린지 순위 확인
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.in-challenge.rank.user.js
// @description  네이버 인플루언서 홈에서 키워드 챌린지 순위를 확인합니다.
// @author       Won Choi
// @match        https://in.naver.com/*/challenge*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==
async function main() {
    const urlIdBase = location.pathname.split('/')[1];
    async function search_ranking_challenges(keyword, start = 1, display = 10, result = []) {
        const next = start + display;
        const uri = new URL('https://s.search.naver.com/p/influencer/search.naver?where=bridge&view=ranking&type=api'); uri.searchParams.set('query', keyword); uri.searchParams.set('start', start); uri.searchParams.set('display', display);
        const resp = await new Promise((resolve, reject) => GM_xmlhttpRequest({ url: uri.toString(), onerror: reject, onload: resolve, }));
        const json = JSON.parse(resp.responseText);
        const { html, totalCount } = json.result;
        const document$ = document.createElement('div'); document$.innerHTML = json.result.html;
        const influencers = Array.from(document$.querySelectorAll('li.ranking_bx._item')).map((el, idx)=>{
            const spaceId = parseInt(el.querySelector('a.user_thumb_wrap._user_info_trigger').getAttribute('data-query'));
            const urlId   = el.getAttribute('data-alarm-link').replace(/^https\:\/\/in\.naver\.com\/([a-z0-9\-\_\.]+)([\?\/].*?)?$/i, '$1');
            const nickname= el.getAttribute('data-alarm-name');
            const nums = el.querySelectorAll('em.num');
            return { spaceId, urlId, nickname, ranking: start + idx };
        }); result.push(...influencers);
        const data = result.find(o=>o.urlId == urlIdBase);
        return (data || totalCount < next) ? data : search_ranking_challenges(keyword, next, display, result);
    }
    const elements = Array.from(document.querySelectorAll('[class^="ChallengeHistory__list_hashtag"] a'));
    const keywords = elements.map(el=>el.innerText);
    const rankings = await Promise.all(keywords.map(o=>search_ranking_challenges(o)));
    GM_addStyle(`
        .Keyword__rank { display: inline-block; overflow: hidden; vertical-align: top; margin-right: -15px; z-index: 1; position: relative; }
        .Keyword__rank .count { display: block; padding: 9px 15px 8px; border-radius: 18px; background: rgba(255,0,0,.6); font-size: 12px; font-weight: 600; line-height: 18px; letter-spacing: -.5px; color: hsla(0,0%,100%,.7); }
    `);
    elements.map((el, i) => {
        const em = document.createElement('li'); em.className = 'Keyword__rank';
        em.innerHTML = `<em class="count">${rankings[i]?rankings[i].ranking:'100+'}</em>`;
        el.parentNode.parentNode.insertBefore(em, el.parentNode);
        el.addEventListener('click', (e)=>el.getAttribute('aria-pressed')=="true"&&window.open(`https://s.search.naver.com/p/influencer/search.naver?query=${encodeURIComponent(keywords[i])}`), false);
    });
}
function checkForDOM() { return (document.head && document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
