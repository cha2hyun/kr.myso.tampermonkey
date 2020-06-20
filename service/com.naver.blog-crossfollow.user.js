// ==UserScript==
// @name         네이버 블로그 나만 이웃 자동 정리
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.4
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-crossfollow.user.js
// @description  네이버 블로그에 나만 이웃 중인 이웃을 자동으로 정리해줍니다.
// @author       Won Choi
// @match        https://admin.blog.naver.com/*
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=1
// @grant        GM_addStyle
// ==/UserScript==
async function search_buddy_me_page(page = 1, results = []) {
    const blogId = new URL(location.href).searchParams.get('blogId') || location.pathname.match(/^\/([^\/]+)/)[1];
    const res = await fetch(`https://admin.blog.naver.com/BuddyMeManage.nhn?relation=all&blogId=${blogId}&currentPage=${page}`).then(r=>r.text());
    const doc = document.createElement('div'); doc.innerHTML = res;
    const pagination = Array.from(doc.querySelector('div.paginate_re').children), pagenation_last = pagination[pagination.length - 1];
    const has_next = pagenation_last.tagName == 'A' && !!pagenation_last.className, has_next_valid = pagenation_last.tagName != 'STRONG';
    const usernames_rows = Array.from(doc.querySelectorAll('tr a[href*="blog.naver.com"], tr a[href*=".blog.me"]'));
    const usernames = usernames_rows.map(e=>{
        const uri = new URL(e.href);
        const id = (() => e.closest('tr').querySelector('td:first-child input').value)();
        const createdAt = (() => new Date('20'+e.closest('tr').querySelector('td:last-child').innerText))();
        const nickname = (() => {
            if(uri.hostname.includes('.blog.me')) return uri.hostname.replace('.blog.me', '');
            if(uri.hostname.includes('blog.naver.com')) return uri.pathname.replace('/', '');
            return uri.hostname;
        })();
        return { id, nickname, createdAt };
    });
    results.push(...usernames);
    return (has_next || has_next_valid) ? search_buddy_me_page(page+1, results) : results.filter((o,i)=>results.indexOf(o)==i);
}
async function search_buddy_page(page = 1, results = []) {
    const blogId = new URL(location.href).searchParams.get('blogId') || location.pathname.match(/^\/([^\/]+)/)[1];
    const res = await fetch(`https://admin.blog.naver.com/BuddyListManage.nhn?blogId=${blogId}&currentPage=${page}&searchText=&orderType=adddate`).then(r=>r.text());
    const doc = document.createElement('div'); doc.innerHTML = res;
    const pagination = Array.from(doc.querySelector('div.paginate_re').children), pagenation_last = pagination[pagination.length - 1];
    const has_next = pagenation_last.tagName == 'A' && !!pagenation_last.className, has_next_valid = pagenation_last.tagName != 'STRONG';
    const usernames_rows = Array.from(doc.querySelectorAll('tr a[href*="blog.naver.com"], tr a[href*=".blog.me"]'));
    const usernames = usernames_rows.map(e=>{
        const uri = new URL(e.href);
        const id = (() => e.closest('tr').querySelector('td:first-child input').value)();
        const createdAt = (() => new Date('20'+e.closest('tr').querySelector('td:last-child').innerText))();
        const nickname = (() => {
            if(uri.hostname.includes('.blog.me')) return uri.hostname.replace('.blog.me', '');
            if(uri.hostname.includes('blog.naver.com')) return uri.pathname.replace('/', '');
            return uri.hostname;
        })();
        return { id, nickname, createdAt };
    });
    results.push(...usernames);
    return (has_next || has_next_valid) ? search_buddy_page(page+1, results) : results.filter((o,i)=>results.indexOf(o)==i);
}
async function search_buddy_me() {
    const session_timestamp = eval(sessionStorage.getItem('search_buddy_me_timestamp') || '0');
    const session_buddy_me = JSON.parse(sessionStorage.getItem('session_buddy_me') || '[]');
    if(Date.now() - session_timestamp > 1000 * 60 * 1) {
        const followers = await search_buddy_me_page();
        sessionStorage.setItem('session_buddy_me', JSON.stringify(followers));
        sessionStorage.setItem('search_buddy_me_timestamp', Date.now())
        return followers;
    } else {
        return session_buddy_me;
    }
}
async function search_buddy() {
    const session_timestamp = eval(sessionStorage.getItem('search_buddy_timestamp') || '0');
    const session_buddy = JSON.parse(sessionStorage.getItem('session_buddy') || '[]');
    if(Date.now() - session_timestamp > 1000 * 60 * 1) {
        const following = await search_buddy_page();
        sessionStorage.setItem('session_buddy', JSON.stringify(following));
        sessionStorage.setItem('search_buddy_timestamp', Date.now())
        return following;
    } else {
        return session_buddy;
    }
}
async function delete_buddy(selfishes) {
    const uri = new URL('https://admin.blog.naver.com/BuddyDelete.nhn');
    const formData = new FormData(); selfishes.map(o=>formData.append('buddyBlogNo', o.id));
    formData.append('blogId', location.pathname.replace('/', ''));
    formData.append('on', ''); formData.append('force', 'true');
    await fetch(uri.toString(), { method: 'POST', body: formData });
}
async function main() {
    if(/\.nhn$/.test(location.pathname)) return;
    const container = document.querySelector('#nav > div:nth-child(4)');
    const container_title = container && container.querySelector('.lnb__title');
    if(!container_title || container_title.innerText.trim() != '열린이웃') return;
    GM_donation('.l__container');
    GM_addStyle(`
        .automation-loading:before {
            content: ''; position: fixed; z-index: 10000000; left: 0; top: 0; right: 0; bottom: 0; margin: auto;
            background-color: rgba(0, 0, 0, 0.5);
        }
    `);
    const menulist = container.querySelector('ul');
    const menuitem = menulist.querySelector('li.selfishes') || document.createElement('li');
    if(!menuitem.className) {
        menuitem.className = 'selfishes';
        const menulink = document.createElement('a'); menulink.className = 'lnb__item'; menulink.innerText = '이웃 정리하기'
        menulink.addEventListener('click', async (e) => {
            e.preventDefault(); if(!confirm('1주 이상 나를 이웃하지 않은 사람을 모두 정리합니다.\n계속하시겠습니까?')) return;
            document.documentElement.classList.add('automation-loading');
            const following = await search_buddy();
            const followers = await search_buddy_me();
            const selfishes = following.filter(o=>Date.now() - o.createdAt > 1000 * 60 * 60 * 24 * 7).filter(o=>!followers.find(v=>v.nickname == o.nickname));
            if(selfishes.length && confirm(`${selfishes.length}명을 나만 이웃하고 있습니다.\n작업을 계속 하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
                const groups = []; for(let i = 0; i < selfishes.length; i += 50) groups.push(selfishes.splice(0, 50));
                for(let i = 0; i < groups.length; i++) {
                    const uri = new URL('https://admin.blog.naver.com/BuddyDelete.nhn');
                    const formData = new FormData(); groups[i].map(o=>formData.append('buddyBlogNo', o.id));
                    formData.append('blogId', location.pathname.replace('/', ''));
                    formData.append('on', ''); formData.append('force', 'true');
                    await fetch(uri.toString(), { method: 'POST', body: formData });
                }
                alert(`${selfishes.length}명이 모두 정리 되었습니다.`);
            } else {
                alert(`정리할 이웃이 없습니다.`);
            }
            document.documentElement.classList.remove('automation-loading');
        });
        menuitem.append(menulink);
        menulist.append(menuitem);
    }
}
function checkForDOM() { return (document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
