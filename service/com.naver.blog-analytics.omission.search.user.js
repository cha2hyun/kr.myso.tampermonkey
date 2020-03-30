// ==UserScript==
// @name         네이버 블로그 PC 통계 플러스 - 통합검색 노출누락 여부 확인
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.2
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-analytics.omission.search.user.js
// @description  네이버 블로그 통계에서 네이버 통합검색 노출 여부 확인이 가능한 버튼을 추가해줍니다.
// @author       Won Choi
// @match        https://blog.stat.naver.com/blog/article/*/cv
// @grant        none
// ==/UserScript==
async function main() {
    const container = document.querySelector('.u_ni_header_wrap > div > .u_ni_info_section > div');
    const group = document.createElement('div'); group.className = 'u_ni_btn_group'; group.style.left = 0; group.style.right = 'auto'; container.appendChild(group);
    const group_inner = document.createElement('div'); group_inner.className = 'u_ni_menu_component u_ni_ext_group'; group.appendChild(group_inner);
    const group_list = document.createElement('ul'); group_list.className = 'u_ni_menu_list'; group_list.role = 'menu'; group_inner.appendChild(group_list);
    const button_wrap_a = document.createElement('li'); button_wrap_a.className = 'u_ni_menu_item u_ni_is_active'; group_list.appendChild(button_wrap_a);
    const button_wrap_b = document.createElement('li'); button_wrap_b.className = 'u_ni_menu_item u_ni_is_active'; group_list.appendChild(button_wrap_b);
    const button_a = document.createElement('a'); button_a.href = '#'; button_a.innerText = '누락확인'; button_wrap_a.appendChild(button_a);
    const button_b = document.createElement('a'); button_b.href = '#'; button_b.innerText = '유사확인'; button_wrap_b.appendChild(button_b);
    function post_info() {
        const el_title = document.querySelector('h3.u_ni_title, span.u_ni_title');
		const el_write = document.querySelector('.u_ni_date');
		const tx_title = el_title && el_title.innerText;
		const tx_write = el_write && el_write.innerText;
		const pt_write = /^([0-9]{4}).([0-9]{2}).([0-9]{2})/.exec(tx_write);
		const qr_write = Array.from(pt_write).slice(1, 4).join('');
        return { tx_title, tx_write, qr_write };
    }
    button_a.onclick = function(e) {
        e.preventDefault();
        const info = post_info();
		const uri = new URL('https://search.naver.com/search.naver');
		uri.searchParams.set('sm', 'tab_opt');
		uri.searchParams.set('where', 'nexearch');
		uri.searchParams.set('query', `"${info.tx_title}"`);
        uri.searchParams.set('nso', `so:dd,p:from${info.qr_write}to${info.qr_write},a:all`);
		window.open(uri.toString(), 'u_ni_search');
    }
    button_b.onclick = function(e) {
        e.preventDefault();
        const info = post_info();
		const uri = new URL('https://search.naver.com/search.naver');
		uri.searchParams.set('sm', 'tab_opt');
		uri.searchParams.set('where', 'nexearch');
		uri.searchParams.set('query', `${info.tx_title}`);
		window.open(uri.toString(), 'u_ni_search');
    }
}
function checkForDOM() { return (document.head && document.body) ? main() : requestIdleCallback(checkForDOM); }
requestIdleCallback(checkForDOM);
