// ==UserScript==
// @name         네이버 블로그 보유키워드 분석
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.3
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-profile.keyword.counter.user.js
// @description  네이버 블로그 프로필에서 보유키워드를 확인할 수 있습니다.
// @author       Won Choi
// @match        *://blog.naver.com/profile/intro*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.js
// ==/UserScript==
async function request(url, options = { method: 'GET' }) { return new Promise((resolve, reject) => { GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options)); }); }
async function request_blog(blogId, action, params = {}) {
    const referer = `https://m.blog.naver.com/${blogId}`;
    const uri = new URL(`https://m.blog.naver.com/rego/${action}.naver?blogId=${blogId}`); _.map(params, (v, k) => uri.searchParams.set(k, v));
    const res = await request(uri.toString(), { headers: { referer } });
    const data = eval(`('${res.responseText})`);
    return data && data.result;
}
// 블로그 분석
async function get_blog(blogId) {
    const info = await request_blog(blogId, 'BlogInfo');
    const user = await request_blog(blogId, 'BlogUserInfo');
    const talk = await request_blog(blogId, 'TalkTalkAndReservationInfo');
    const category = await request_blog(blogId, 'CategoryList');
    const recommend = await request_blog(blogId, 'PopularPostBlockInfo');
    return { info, user, talk, category, recommend };
}
async function get_blog_posts(blogId, limit = 10, options) {
    let posts = [];
    for(let currentPage = 1; currentPage <= limit; currentPage++) {
        const data = await request_blog(blogId, 'PostListInfo', { currentPage }).catch(e=>null);
        const list = _.get(data, 'postViewList', []); if(!list || !list.length) break;
        posts = posts.concat(list.filter(o=>o.categoryOpenYn && o.allOpenPost && o.searchYn));
    }
    return posts;
}
async function get_post_content(blogId, logNo) {
    const res = await request(`https://m.blog.naver.com/PostView.nhn?blogId=${blogId}&logNo=${logNo}`);
    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
    return process_content(doc);
}
async function process_content(target) {
    const clipContent = target.querySelector('#__clipContent');
    if(clipContent) { target = new DOMParser().parseFromString(clipContent.textContent, 'text/html'); }
    const sections_v2 = Array.from(target.querySelectorAll('#postViewArea, body.se2_inputarea')).map((component) => {
        const filter = ['se-toast-popup', '__se_object', 'og', '_naverVideo'];
        function textContents(output, element) {
            if(filter.find(o=>element.className && element.className.includes(o))) return output;
            const textNodes = Array.from(element.childNodes).filter(o=>o instanceof Text);
            const selements = Array.from(element.childNodes).filter(o=>o instanceof HTMLElement);
            output = selements.reduce(textContents, output);
            output.push(...textNodes);
            return output;
        }
        const section = {};
        const data = Array.from(component.childNodes).reduce(textContents, []); section.data = data.map(el=>el.textContent || el.value || '');
        return section;
    });
    const sections_v3 = Array.from(target.querySelectorAll('#se_components_wrapper .se_component, .se_component_wrap .se_component, .se_card_container .se_component, .__se_editor-content .se_component, .se-main-container .se-component, .se-container .se-component')).map((component) => {
        const section = {};
        const data = Array.from(component.querySelectorAll('.se_textarea, .se-text-paragraph')); section.data = data.map(el=>el.innerText || el.value || '');
        return section;
    });
    const section = [].concat(sections_v2, sections_v3);
    const placeholders = Array.from(target.querySelectorAll('.se_textarea, .se-text-paragraph')).map((component) => {
        const section = {};
        const data = Array.from(component.querySelectorAll('.se-placeholder')); section.data = data.map(el=>el.innerText || el.value || '');
        return section;
    });

    const contentV2 = sections_v2.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l, ''), ''), contentV2Trim = contentV2.replace(/[\s]+/g, '');
    const contentV2Length = contentV2.length, contentV2LengthTrim = contentV2Trim.length;
    const contentV3 = sections_v3.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l, ''), ''), contentV3Trim = contentV3.replace(/[\s]+/g, '');
    const contentV3Length = contentV3.length, contentV3LengthTrim = contentV3Trim.length;

    const content = contentV2 + contentV3;
    const contentTrim = contentV2Trim + contentV3Trim;
    const contentLength = contentV2Length + contentV3Length;
    const contentLengthTrim = contentV2LengthTrim + contentV3LengthTrim;
    const placeholderLength = Number(placeholders.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.length, 0), 0));
    const placeholderLengthTrim = Number(placeholders.reduce((r, o)=>r + (o.data || []).reduce((r,l)=>r+=l.replace(/[\s]+/g, '').length, 0), 0));

    const contentLengthTxt = String(contentLength-placeholderLength).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    const contentLengthTrimTxt = String(contentLengthTrim-placeholderLengthTrim).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

    return { section, content, contentTrim, contentLengthTxt, contentLengthTrimTxt }
}
// 키워드 분석
async function nx_request_xhr(keyword, type = 'blog') {
    const uri = new URL(`https://s.search.naver.com/p/${type}/search.naver?where=m_view&query=&main_q=&mode=normal&ac=1&aq=0&spq=0`); uri.search = location.search;
    uri.searchParams.set('query', keyword);
    uri.searchParams.set('main_q', keyword);
    uri.searchParams.set('mode', 'normal');
    uri.searchParams.delete('api_type');
    uri.searchParams.delete('mobile_more');
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({ method: 'GET', url: uri.toString(), onerror: reject, onload: resolve, });
    });
}
async function nx_request(keyword, type) {
    const res = await nx_request_xhr(keyword, type);
    const doc = new DOMParser().parseFromString(res.responseText, 'text/html')
    const map = Array.from(doc.body.childNodes).filter(el=>el.nodeType == 8).map((nx) => Array.from(nx.nodeValue.matchAll(/^(?<k>[^\s\:]+)([\s\:]+)?(?<v>.*)$/igm)).map(o=>Object.assign({}, o.groups))).flat();
    const ret = map.reduce((r, { k, v }) => {
        if(typeof v === 'string' && v.includes(',')) v = v.split(',').map(r=>r.split(',').map(v=>decodeURIComponent(v).split(':').map(v=>decodeURIComponent(v))));
        if(typeof v === 'string' && v.includes('|')) v = v.split('|').map(r=>r.split(':').map(v=>decodeURIComponent(v)));
        if(typeof v === 'string' && v.includes(':')) v = v.split(':').map(v=>decodeURIComponent(v));
        if(typeof v === 'string') v = decodeURIComponent(v);
        return (r[k] = v, r);
    }, {});
    return ret;
}
async function nx_terms(keyword) {
    const res = await nx_request(keyword, 'blog').catch(e=>null);
    return _.flattenDeep(_.get(res, 'terms', []));
}
async function nx_items(keyword) {
    const res = await nx_request_xhr(keyword, 'review');
    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
    const listview = doc.querySelectorAll('.lst_total > li');
    return _.map(listview, (listitem, offset) => {
        const el_n = listitem.querySelector('.sub_name');
        const el_t = listitem.querySelector('.total_tit');
        const el_d = listitem.querySelector('.dsc_txt');
        if(!el_n || !el_t || !el_d) return;
        const uri = new URL(el_t.href), params = Object.fromEntries(uri.searchParams.entries());
        if(!uri.hostname.includes('blog.naver.com')) return;
        return {
            ...params,
            rank: offset + 1,
            blogId: uri.pathname.split('/')[1],
            briefContents: el_t.textContent,
            titleWithInspectMessage: el_t.textContent,
        }
    }).filter(v=>!!v);
}
// 런타임
async function main_blog(blogId) {
    Toastify({ text: "블로그 정보 가져오는 중..." }).showToast();
    const blog = await get_blog(blogId);
    return blog;
}
async function main_list(blogId, currentPage = 1, categoryNo = 0) {
    Toastify({ text: "글 가져오는 중..." }).showToast();
    Toastify({ text: `${currentPage}페이지의 글 가져오는 중...` }).showToast();
    const data = await request_blog(blogId, 'PostListInfo', { currentPage, categoryNo }).catch(e=>null);
    const list = _.get(data, 'postViewList', []);
    const posts = _.filter(list, o=>o.categoryOpenYn && o.allOpenPost && o.searchYn);
    Toastify({ text: `최근 ${posts.length}개의 글 가져옴`, duration: 3000 }).showToast();
    return posts;
}
async function main_keywords(blogId, list) {
    Toastify({ text: "키워드 가져오는 중..." }).showToast();
    const keywords = _.flattenDeep(await Promise.map(list, async (post, offset) => {
        const output = [];
        {
            Toastify({ text: `${list.length}개 중 ${offset+1}번째 글의 제목 키워드 가져오는 중...` }).showToast();
            const name = post.titleWithInspectMessage.replace(/[^0-9a-zA-Z가-힣\s]+/g, '');
            const term = (await nx_terms(name)).filter((term)=>name.replace(/\s/g, '').toLowerCase() !== term.replace(/\s/g, '').toLowerCase());
            output.push(...term);
        }
        {
            Toastify({ text: `${list.length}개 중 ${offset+1}번째 글의 본문 키워드 가져오는 중...` }).showToast();
            const body = await get_post_content(post.blogId, post.logNo);
            const lines = _.reduce(body.section, (r,o)=>r.concat(o.data), []);
            const block = _.reduce(lines, (r, o)=>r.concat(o.split(/[\s]+/g)), []);
            const chunk = _.chunk(block, 5);
            const parse = await Promise.map(chunk, (block) => nx_terms(block.join(',')), { concurrency: 10 });
            const words = _.flattenDeep(parse);
            output.push(...words);
        }
        Toastify({ text: `${list.length}개 중 ${offset+1}번째 글의 ${output.length}개 키워드 가져옴` }).showToast();
        return output;
    }, { concurrency: 5 }));
    const keywords_hold = _.orderBy(_.uniqBy(_.map(keywords, (keyword)=>({ keyword, size: keyword.length, count: keywords.filter(k=>k==keyword).length })), 'keyword'), ['count', 'size', 'keyword'], ['desc', 'asc', 'asc']);
    Toastify({ text: `${keywords_hold.length}개의 키워드 가져옴`, duration: 3000 }).showToast();
    return keywords_hold;
}
async function main() {
    GM_donation('#post-area', 0);
    GM_addStyle(`@import url(https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.css)`);
    GM_addStyle(`
      #profile h2.keyword_info { padding: 5px 0; font-family: 돋움; font-size: 12px; }
      #profile h2.keyword_info img.arw01 { margin: 0 7px 1px 5px; }
      #profile ul.keyword_info { list-style: none; clear: both; border-bottom: 1px solid #ccc; }
      #profile ul.keyword_info li.item { font-size: 12px; display: inline-block; padding: 0.2rem 0.5rem; margin-right: 0.5rem; margin-bottom: 0.5rem; background-color: #0abf53; border-radius: 50rem; color: #fff; }
      #profile ul.keyword_info li.line { dispaly:block; width: 100%; height:1px; overflow:hidden; padding: 0; margin-right: 0; background: #ccc; }
      #profile ul.keyword_info li.head { dispaly:block; width: 100%; padding: 5px 0; font-family: 돋움; font-size: 12px; font-weight: bold; }
    `);
    try {
        const uri = new URL(location.href), params = Object.fromEntries(uri.searchParams.entries()); if(!params.blogId) return;
        const blogId = params.blogId;
        const blog = await main_blog(blogId);
        const post_max = _.get(blog, 'category.mylogPostCount', 1);
        const cate = _.get(blog, 'category.mylogCategoryList', []).filter(o=>o.openYN && o.postCnt > 0);

        const wrp = document.querySelector('#profile'); if(!wrp) return;
        const h2 = document.createElement('h2'); h2.classList.add('keyword_info'); wrp.append(h2);
        const ct = document.createElement('select'); ct.classList.add('keyword_info'); wrp.append(ct); update_ct();
        function update_ct() {
            const cur = ct.selectedIndex >= 0 ? ct.selectedIndex : 0;
            const opt = document.createElement('option'); opt.checked = true; opt.value = 0; opt.dataset.postCnt = post_max; opt.textContent = `전체보기 (${post_max})`; ct.append(opt);
            _.map(cate, (o)=>{ const opt = document.createElement('option'); opt.value = o.categoryNo; Object.assign(opt.dataset, o); opt.textContent = `${o.categoryName} (${o.postCnt})`; ct.append(opt); })
            ct.selectedIndex = cur;
        }
        function current_ct_count() {
            const cur = ct.selectedIndex >= 0 ? ct.selectedIndex : 0;
            const pos = ct.options[cur];
            return (pos && pos.dataset.postCnt) || 0;
        }
        const pg = document.createElement('select'); pg.classList.add('keyword_info'); wrp.append(pg);
        function update_pg(cnt) {
            const cur = pg.selectedIndex >= 0 ? pg.selectedIndex : 0
            const max = Math.ceil(cnt / 10);
            pg.innerHTML = '';
            _.map(_.range(1, max + 1), (o, offset)=>{ const opt = document.createElement('option'); opt.value = o; opt.textContent = `${o} page`; pg.append(opt);  });
            pg.selectedIndex = cur;
        }
        const ul = document.createElement('ul'); ul.classList.add('keyword_info'); wrp.append(ul);
        async function update() {
            ct.disabled = pg.disabled = true;
            await update_ct();
            await update_pg(current_ct_count());
            const list = await main_list(blogId, pg.value, ct.value);
            const keywords = await main_keywords(blogId, list);
            h2.innerHTML = `<img src="https://blogimgs.pstatic.net/nblog/spc.gif" width="1" height="1" class="arw01" alt="">보유키워드 (${keywords.length})`;
            ul.innerHTML = '';
            const keywords_group = _.groupBy(keywords, (o)=>o.count);
            const keywords_group_index = _.keys(keywords_group).reverse();
            _.map(keywords_group_index, (count) => {
                const keywords = _.get(keywords_group, count, []);
                const hr = document.createElement('li'); hr.classList.add('line'); ul.append(hr);
                const hd = document.createElement('li'); hd.classList.add('head'); hd.textContent = `${count}회 발견 키워드 (${keywords.length})`; ul.append(hd);
                _.map(keywords, (item)=>{
                    const li = document.createElement('li'); li.classList.add('item'); li.textContent = `${item.keyword} (${item.count})`; ul.append(li);
                });
            });
            ct.disabled = pg.disabled = false;
        };
        await update();
        ct.onchange = () => update();
        pg.onchange = () => update();
    }catch(e){
        console.error(e);
    }
}
function _requestIdleCallback(callback) {
    if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
    return requestIdleCallback(callback);
}
function checkForDOM() { return (document.body) ? main() : _requestIdleCallback(checkForDOM); }
_requestIdleCallback(checkForDOM);
