// ==UserScript==
// @name         네이버 포스트 맞구독 검증기
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.post-crossfollow.user.js
// @description  네이버 포스트에서 맞구독 상태를 검증합니다.
// @author       Won Choi
// @match        *://post.naver.com/my/followingList.nhn?*
// @match        *://m.post.naver.com/my/followingList.nhn?*
// @grant        GM_addStyle
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=1
// ==/UserScript==
async function search_followers(fromNo = 1, totalCount = 100000000, result = {}) {
    const loc = new URL(location.href);
    const uri = new URL('https://post.naver.com/my/followerListMore.nhn');
    uri.hostname = location.hostname;
    uri.searchParams.set('lastRowDateTime', Date.now());
    uri.searchParams.set('totalCount', totalCount);
    uri.searchParams.set('followNo', loc.searchParams.get('memberNo'));
    uri.searchParams.set('fromNo', fromNo);
    const resp = await fetch(uri.toString(), { mode: 'cors', credentials: 'include' }).then(resp=>resp.text());
    const json = eval(`(${resp})`), body = document.createElement('div'); body.innerHTML = json.html;
    const data = Array.from(body.querySelectorAll('li.user_info_item')).map((o) => {
        const uri = new URL(o.querySelector('a.user_lnk').href);
        return {
            id: uri.searchParams.get('memberNo'),
            name: o.querySelector('strong.post_tit').innerText,
        };
    });
    result = Object.assign({}, result, json); delete result.html; result.data = result.data || [];
    result.data.push(...data);
    return json.listCount <= fromNo ? result : search_followers(fromNo + 1, totalCount, result);
}
async function draw(json) {
    draw.timer = clearTimeout(draw.timer);
    draw.timer = setTimeout(() => {
        Array.from(document.body.querySelectorAll('li.user_info_item')).map((o) => {
            const uri = new URL(o.querySelector('a.user_lnk').href);
            const memberNo = uri.searchParams.get('memberNo');
            const nickName = o.querySelector('strong.post_tit').innerText;
            console.log(memberNo, nickName, json.data.find(v => v.id == memberNo || v.name == nickName));
            o.classList.remove('selfishes');
            if(!json.data.find(v=>v.id==memberNo)) o.classList.add('selfishes');
        });
    }, 300);
}
async function main() {
    GM_donation('#el_list_container');
    GM_addStyle(`.selfishes { background: #ffd900; }`);
    const json = await search_followers(); draw(json);
    console.log(json);
    document.__createElement = document.__createElement || document.createElement;
    document.createElement = (tagName) => {
        setTimeout(()=>draw(json));
        return document.__createElement(tagName);
    };
    setTimeout(()=>draw(json));
}
function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
