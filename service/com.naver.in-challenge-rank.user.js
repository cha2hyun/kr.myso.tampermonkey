// ==UserScript==
// @name         네이버 인플루언서 홈 키워드 챌린지 순위 확인
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.1
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.in-challenge-rank.user.js
// @description  네이버 인플루언서 홈에서 키워드 챌린지 순위를 확인합니다.
// @author       Won Choi
// @match        https://in.naver.com/*/challenge*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
async function main() {

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
        const data = result.find(o=>o.urlId == 'homi');
        return (data || totalCount < next) ? data : search_ranking_challenges(keyword, next, display, result);
    }
    const elements = Array.from(document.querySelectorAll('[class^="ChallengeHistory__list_hashtag"] a'));
    const keywords = elements.map(el=>el.innerText);
    const rankings = await Promise.all(keywords.map(o=>search_ranking_challenges(o)));
    elements.map((el, i) => {
        el.style.position = 'relative';
        el.style.overflow = 'auto';
        el.innerHTML = `<em style="display:inline-block; background-color:red; border-radius:50%; width:28px; height: 28px; overflow: hidden; text-align:center; line-height: 28px;">${rankings[i]?rankings[i].ranking:'100+'}</em> ${keywords[i]} `
        el.addEventListener('click', (e)=>el.getAttribute('aria-pressed')=="true"&&window.open(`https://s.search.naver.com/p/influencer/search.naver?query=${encodeURIComponent(keywords[i])}`), false);
    });
}
function checkForDOM() { return (document.head && document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
