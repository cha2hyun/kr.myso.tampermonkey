// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 블로그 진단 키트
// @description  네이버 블로그 진단을 위해 블로그 통계 지표를 저장하는 기능의 프로그램입니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.3
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-stat.analytics.exporter.user.js
// @downloadURL  https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-stat.analytics.exporter.user.js
// @author       Won Choi
// @connect      naver.com
// @connect      ryo.co.kr
// @match        *://admin.blog.naver.com/*/stat/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/polyfill/Object.fromEntries.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/polyfill/Array.prototype.flat.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/polyfill/String.prototype.matchAll.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/vendor/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-blog.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-blog-content.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-datalab.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-creator-advisor.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-search-ad.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-search-nx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/naver-search-rx.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.27/assets/lib/smart-editor-one.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.25/assets/donation.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.33/moment-timezone.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.9.0/localforage.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
GM_App(async function main() {
    GM_addStyle("@import url('https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.11.0/toastify.min.css')");
    GM_addStyle(".lnb__analytics .lnb__title { color:#0099e5 !important; } .lnb__analytics .lnb__title::after { content:'\\1F4CA'; float: right; }");
    GM_addStyle(".lnb__analytics_share .lnb__title { color:#0099e5 !important; } .lnb__analytics_share .lnb__title::after { content:'\\1F680'; float: right; }");
    GM_addStyle(".toastify { border-radius:.5rem; } .toastify.log { background:#f3f4f7; color:#000; } .toastify.info { background:#0099e5; color:#fff; } .toastify.warn { background:#ffdd00; color:#000; } .toastify.error { background:#ff4c4c; color:#fff; }");
    GM_addStyle(`
    .alt__analytics { display:none; }
    .alt__analytics h1,
    .alt__analytics h2,
    .alt__analytics h3,
    .alt__analytics h4,
    .alt__analytics h5,
    .alt__analytics h6,
    .alt__analytics p { margin: 0; padding:0; margin-bottom: 0.3rem; }
    .alt__analytics ul { list-style: none; margin: 0; padding: 0; }
    .alt__analytics[data-timestamp] {
      position:fixed; z-index:1; margin: auto; left:0; top:0; right:0; bottom:0; background:rgba(0,0,0,0.8); color:#fff;
      justify-content: center; display: flex; flex-direction:column; align-items: center; align-self: center; font-size:1rem; line-height:1.25em;
      padding-top: 5rem; content: '블로그 진단 키트가 데이터를 수집중입니다...';
    }
    .alt__analytics_body { width: 600px; }
    .alt__analytics_message { margin-bottom: 1rem; margin-top:1rem; }
    .alt__analytics_message p { display:block; width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .alt__analytics_notice { border-radius: .5rem; background: rgba(255,255,255,0.6); color: #000; font-size:0.8rem; padding: 1rem; margin-bottom: 1rem; }
    .alt__analytics_notice h2 { text-align:center; }
    .alt__analytics_alert { border-radius: .5rem; background: #f00; color: #fff; font-size:0.8rem; padding: 1rem; text-align: center; }
  `);
    moment.tz.setDefault("Asia/Seoul");
    // DOM
    const wrap = document.querySelector('#nav.lnb__local-menu'); if(!wrap) return;
    const cont = wrap.querySelector('.lnb__analytics') || document.createElement('div'); cont.classList.add('lnb__depth1', 'lnb__analytics'); wrap.append(cont);
    const contlink = cont.querySelector('.lnb__title') || document.createElement('a'); contlink.classList.add('lnb__title'); contlink.textContent = '블로그 진단 키트'; cont.append(contlink);
    const noti = wrap.querySelector('.alt__analytics') || document.createElement('div'); noti.classList.add('alt__analytics'); wrap.append(noti);
    cont.addEventListener('click', async (event)=>{ event.preventDefault(); event.stopPropagation(); GM_donationApp(main)(); });
    const more = wrap.querySelector('.lnb__analytics_share') || document.createElement('div'); more.classList.add('lnb__depth1', 'lnb__analytics_share'); wrap.append(more);
    const morelink = more.querySelector('.lnb__title') || document.createElement('a'); morelink.classList.add('lnb__title'); morelink.textContent = '블로그 진단 요청'; more.append(morelink);
    more.addEventListener('click', async (event)=>{ event.preventDefault(); event.stopPropagation(); GM_donationApp(() => window.open('https://cafe.naver.com/influencerz/menu/108'))(); });
    // Toast
    const TOAST_TYPES = ['log', 'info', 'warn', 'error'];
    function voice(text) {
        const timestamp = noti.dataset.timestamp = parseInt(noti.dataset.timestamp || Date.now());
        noti.innerHTML = `
        <div class="alt__analytics_body">
          <small>${moment(timestamp).fromNow()}</small>
          <h2>블로그 진단 키트가 통계를 수집중입니다...</h2>
          <div class="alt__analytics_message">
           <p>${text}</p>
          </div>
          <div class="alt__analytics_notice">
           <h4>진단키트 안내사항</h4>
           <ul>
             <li style="color:#00205b; font-weight:bold">- 수집이 진행되는 동안 모든 작업을 중지할 것을 권장합니다.</li>
             <li style="color:#00205b; font-weight:bold">- 수집이 진행되는 동안 진행중인 화면을 최상단에 유지해야 빠르게 완료됩니다.</li>
             <li style="color:#00205b; font-weight:bold">- 수집이 진행되는 동안 대량의 트래픽이 발생하므로, 안정적인 인터넷 환경을 권장합니다.</li>
             <li style="color:#00205b; font-weight:bold">- 수집이 완료되면 데이터를 브라우저에 저장하며, 과트래픽 방지를 위해 7일간 재사용합니다.</li>
           </ul>
         </div>
         <div class="alt__analytics_notice">
           <h4>통계지표 활용동의</h4>
           <p>이 프로그램은 블로그 진단을 위해 네이버 블로그 통계에서 아래와 같은 정보를 수집합니다.</p>
           <ul>
             <li>- 네이버 블로그에 작성된 최근 90일 분량의 모든 게시물</li>
             <li>- 네이버 블로그에 유입된 최근 90일 분량의 모든 통계</li>
           </ul>
         </div>
         <div class="alt__analytics_notice">
           <h4>오류관련 안내사항</h4>
           <ul>
             <li>- 콘텐츠 생산량 및 유입량에 따라 <b>24시간 이상 소요될 수 있습니다.</b></li>
             <li>- 수집이 진행되는 동안 진행중인 화면을 최상단에 유지해야 빠르게 완료됩니다.</li>
             <li>- 수집이 진행되는 동안 대량의 트래픽이 발생하므로, 안정적인 인터넷 환경을 권장합니다.</li>
             <li>- 수집이 진행되는 동안 오류 발생 시 다운로드되는 파일을 개발자에게 제보해주시기 바랍니다.</li>
           </ul>
         </div>
         <div class="alt__analytics_alert">
           <span>블로그 주요 지표를 모두 수집하며, 제3자를 통한 공유로 발생가능한 피해는 책임지지 않습니다.</span>
         </div>
       </div>
       `;
    };
    function toast(className, text, duration = 1000 * 60, gravity = 'bottom', position = 'right') { voice(text); return Toastify(Object.assign({ className }, { text, duration, gravity, position })).showToast(); }
    TOAST_TYPES.map((k)=>toast[k]=toast.bind(null, k));
    // Main
    async function download_report(e) {
        console.error(e); toast.error(`오류: ${e.message || e}`);
        const date = moment().format('YYYY-MM-DD');
        const zip = new JSZip();
        const zip_opts = { type:"blob" };
        const zip_name = `블로그진단지표_오류로그_${date}.zip`;
        zip.file('에러.txt', [
            '<블로그 진단 키트>의 동작과정에서 오류가 발생하였습니다. 개발자 최원(cw4196)에게 해당 내용을 전달해주시기 바랍니다.',
            '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
            '□ 배포주소 - https://blog.naver.com/cw4196',
            '□ 채팅문의 - https://help.myso.kr',
            '□ 메일문의 - help@myso.kr',
            '□ 공식카페 - https://cafe.naver.com/influencerz',
            '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
            '■ 오류내용',
            `${e.stack || e.meesage || e}`,
            '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
            'Copyright (c) Choi Won. powered by Naver Blog.',
        ].join('\r\n'));
        saveAs(await zip.generateAsync({type:"blob"}), zip_name);
    }
    async function download(data) {
        voice(`블로그 진단 지표를 저장중입니다...`);
        const { BlogInfo, BusinessInfo, BlogIntroduce, BlogStat, BlogPostList } = data;
        const date = moment(data.timestamp).format('YYYY-MM-DD');
        const zip = new JSZip();
        const zip_opts = { type:"blob" };
        const zip_name = `블로그진단지표_${BlogInfo.nickName}_${BlogInfo.blogId}_${date}.zip`;
        { // copyrigyht
            zip.file("안내사항.txt", [
                '이 진단지표는 개발자 최원(cw4196)의 <블로그 진단 키트>로 작성되었습니다.',
                '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
                '□ 배포주소 - https://blog.naver.com/cw4196',
                '□ 채팅문의 - https://help.myso.kr',
                '□ 메일문의 - help@myso.kr',
                '□ 공식카페 - https://cafe.naver.com/influencerz',
                '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
                '■ 블로그 진단 키트 사용안내',
                '각 엑셀의 시트를 기준으로, 피봇테이블, 플로우차트, 표준편차차트, 분포차트 등 다양한 조건을 바탕으로 활용하실 수 있습니다.',
                '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
                '■ 블로그 진단 키트 분석지원',
                '지표자료 분석 활용이 제한되는 분들을 위해 공식카페에서 고급진단 지원서비스를 무상 또는 유상으로 제공중입니다.',
                '카페를 통해 분석지원을 요청하시는 경우 블로그 진단 결과를 익명으로 공개하는 것에 동의한 것으로 간주합니다.',
                '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
                '■ 블로그 진단 키트 주의사항',
                '이 진단지표는 매우 민감한 통계 데이터를 대량으로 포함하고 있습니다.',
                '무분별한 공유를 통해 키워드 유입경쟁이 심화되는 등의 간접적인 피해에 대해서는 책임을 지지 않습니다.',
                '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-',
                'Copyright (c) Choi Won. powered by Naver Blog.',
            ].join('\r\n'));
        }
        { // information
            zip.file(`${BlogInfo.displayNickName}.txt`, [
                `사용자이름 - ${BlogInfo.displayNickName}`,
                `사용자소개 - ${BlogIntroduce.introduce}`,
                `등록연락처 - ${BlogIntroduce.phoneNumber}`,
                `등록주소지 - ${BlogIntroduce.address}`,
                `블로그제목 - ${BlogInfo.blogName}`,
                `블로그주제 - ${BlogInfo.blogDirectoryName}`,
                `블로그주소 - https://blog.naver.com/${BlogInfo.blogId}`,
                `누적방문자 - ${BlogInfo.totalVisitorCount}`,
                `누적이웃수 - ${BlogInfo.subscriberCount}`,
            ].join('\r\n'));
        }
        { // global analytics
            const name = `블로그진단지표_${BlogInfo.nickName}_${BlogInfo.blogId}_${date}.xlsx`;
            const file = await generate_xlsx_analytics(data); zip.file(name, file);
        }
        { // article analytics
            const dir = zip.folder("contents");
            const contents = await Promise.mapSeries(data.BlogPostList, async (item) => {
                const name = `블로그진단지표_${BlogInfo.nickName}_${BlogInfo.blogId}_${item.logNo}_${date}.xlsx`;
                const file = await generate_xlsx_article(data, item);
                return { name, file };
            });
            contents.map(item=>dir.file(item.name, item.file));
        }
        saveAs(await zip.generateAsync({type:"blob"}), zip_name);
        voice(`블로그 진단 지표 저장 완료.`);
    }
    async function generate_xlsx(sheets = {}) {
        const xlsx = XLSX.utils.book_new();
        const xlsx_opts = { bookType:'xlsx', bookSST:false, type:'array' };
        async function xlsx_sheet(data = []) {
            let xlsx_sheet_data = Array.from((typeof data === 'function') ? await data([]) : data);
            let xlsx_sheet_head = xlsx_sheet_data[0]; if(Object.prototype.toString.call(xlsx_sheet_head) === '[object Object]') { let head = Object.keys(xlsx_sheet_head), body = xlsx_sheet_data.map(item=>Object.values(item)); xlsx_sheet_data = [ head, ...body ]; }
            return xlsx_sheet_data;
        }
        async function xlsx_sheet_append(xlsx_sheet_name, xlsx_sheet_data = []) {
            let xlsx_sheet = XLSX.utils.aoa_to_sheet(xlsx_sheet_data);
            XLSX.utils.book_append_sheet(xlsx, xlsx_sheet, xlsx_sheet_name);
        }
        const xlsx_data = await Promise.map(Object.keys(sheets), async (xlsx_sheet_name)=>{ let xlsx_sheet_data = await xlsx_sheet(sheets[xlsx_sheet_name]); return { xlsx_sheet_name, xlsx_sheet_data }; });
        xlsx_data.map(({ xlsx_sheet_name, xlsx_sheet_data })=>xlsx_sheet_append(xlsx_sheet_name, xlsx_sheet_data));
        return XLSX.write(xlsx, xlsx_opts);
    }
    async function generate_xlsx_article(data, item) {
        const { BlogInfo, BlogStat, BlogPostList } = data;
        const { addDate, logNo, categoryNo, categoryName, smartEditorVersion, readCount, thisDayPostInfo, scraped, memolog } = item;
        const { commentArrowVisible, commentCnt, sympathyArrowVisible, sympathyCnt, outSideAllow, scrapType } = item;
        const { titleWithInspectMessage, titleWithInspectMessageScore, titleWithInspectMessageUniqs, titleWithInspectMessageCases, titleWithInspectMessageDetail, ownedKeywords } = item;
        const { content, contentLength, contentLengthTrim, thumbnailCount, contentSections } = item;
        const { statsReferrerTotal, statsReferrerTotalKeywords, statsReferrerTotalKeywordsDetail } = item;
        const { notOpen, buddyOpen, bothBuddyOpen, allOpenPost, searchYn, postBlocked } = item;
        return generate_xlsx({
            '요약': (rows)=>{
                // 게시글 정보
                rows.push(['■ 게시글정보']);
                rows.push(['제목', titleWithInspectMessage]);
                rows.push(['■ 발행설정']);
                rows.push(['카테고리', '게시글번호', '작성시간']);
                rows.push([categoryName, `${logNo}`, moment(addDate).format('YYYY-MM-DD hh:mm:ss')]);
                rows.push(['에디터버전', '사진수', '글자수', '글자수 (공백제외)']);
                rows.push([smartEditorVersion, thumbnailCount, contentLength, contentLengthTrim]);
                rows.push(['■ 공개설정']);
                rows.push(['공개설정', '검색허용', '블라인드', '공유허용']);
                rows.push([
                    (notOpen && '비공개') || (bothBuddyOpen && '서로이웃공개') || (buddyOpen && '이웃공개') || (allOpenPost && '전체공개') || '알 수 없음',
                    searchYn, postBlocked, outSideAllow
                ]);
                rows.push(['■ 게시글반응']);
                rows.push(['누적조회수', '누적댓글수', '누적공감수']);
                rows.push([readCount, commentCnt, sympathyCnt]);
                rows.push(['■ 지수분석']);
                rows.push(['검색순위', '전문성', '신뢰성', '관련성']);
                rows.push([
                    (titleWithInspectMessageScore && titleWithInspectMessageScore.rank) || 0,
                    (titleWithInspectMessageScore && titleWithInspectMessageScore.crScoreA) || 0,
                    (titleWithInspectMessageScore && titleWithInspectMessageScore.crScoreB) || 0,
                    (titleWithInspectMessageScore && titleWithInspectMessageScore.crScoreC) || 0
                ]);
                return rows;
            },
            '본문': (rows) => {
                return content.split(/[\r\n]+/g).map(line=>[line]);
            },
            '유입경로': (rows)=>{
                rows.push(['날짜', '검색여부', '사이트', '사이트 유입수', '사이트 유입수 비율', '유입경로', '유입수', '유입수 비율', '키워드']);
                rows.push(...statsReferrerTotal.map(item=>{
                    return item.stats.map(item=>{
                        const { date, referrerSearchEngine, referrerDomain, cv, cv_p, detail } = item; if(!cv) return;
                        const { refererDetail } = detail;
                        return refererDetail.map(item=>{
                            const { date, referrerUrl, searchQuery } = item;
                            return [date, referrerSearchEngine == 1, referrerDomain, cv, cv_p, referrerUrl, item.cv, item.cv_p, searchQuery];
                        })
                    }).flat().filter(v=>!!v)
                }).flat().filter(v=>!!v));
                return rows;
            },
            '유효키워드': (rows) => {
                const keywords_uniqs = ownedKeywords.filter((item, index, list)=>list.findIndex(o=>o.query==item.query)==index);
                const keywords_sorts = _.orderBy(keywords_uniqs, 'query');
                const keywords_sheet = keywords_sorts.map(item=>{
                    let { query, search, myown, r_category, theme } = item;
                    return {
                        '키워드': query,
                        '순위': myown.rank,
                        '전문성': myown.crScoreA,
                        '신뢰성': myown.crScoreB,
                        '관련성': myown.crScoreC,
                        '검색량': (search && search.monthlyQcCnt) || 0,
                        '검색량:데스크탑': (search && search.monthlyPcQcCnt) || 0,
                        '검색량:모바일': (search && search.monthlyMobileQcCnt) || 0,
                        '생산선호주제': (r_category) || '',
                        '메인소비주제': (theme && theme.main && theme.main.name) || '',
                        '서브소비주제': (theme && theme.sub && theme.sub.map(o=>o.name).join(', ')) || '',
                    }
                });
                return _.orderBy(keywords_sheet, ['순위', '전문성', '신뢰성', '관련성', '검색량', '키워드'], ['asc', 'desc', 'desc', 'desc', 'desc', 'asc']);
            },
        });
    }
    async function generate_xlsx_analytics(data) {
        const { BlogInfo, BlogStat, BlogPostList } = data;
        return generate_xlsx({
            '조회수': ()=>BlogStat.map(item=>item.visit.cv).flat().filter((v,i,a)=>v.total && a.findIndex(o=>o.date==v.date) == i),
            '순방문자수': ()=>BlogStat.map(item=>item.visit.uv).flat().filter((v,i,a)=>v.total && a.findIndex(o=>o.date==v.date) == i),
            '재방문수': ()=>BlogStat.map(item=>item.visit.revisit).flat().filter((v,i,a)=>v.total && a.findIndex(o=>o.date==v.date) == i),
            '방문횟수': ()=>BlogStat.map(item=>item.visit.averageVisit).flat().filter((v,i,a)=>v.total && a.findIndex(o=>o.date==v.date) == i),
            '체류시간': ()=>BlogStat.map(item=>item.visit.averageDuration).flat().filter((v,i,a)=>v.total && a.findIndex(o=>o.date==v.date) == i),
            '이웃증감': ()=>BlogStat.map(item=>item.rels.relationDelta).flat().filter((v,i,a)=>(v.add || v.friend || v.delete) && a.findIndex(o=>o.date==v.date) == i),
            '유입경로': ()=>BlogStat.map(item=>item.user.refererDetail).flat(),
            '유입키워드': ()=>BlogStat.map(item=>item.user.refererSearch).flat(),
            '유효키워드': ()=>{
                const keywords = BlogPostList.map(item=>item.ownedKeywords).flat();
                const keywords_uniqs = keywords.filter((item, index, list)=>list.findIndex(o=>o.query==item.query)==index);
                const keywords_sorts = _.orderBy(keywords_uniqs, 'query');
                const keywords_sheet = keywords_sorts.map(item=>{
                    let { query, search, myown, r_category, theme } = item;
                    return {
                        '게시글번호': myown.logNo,
                        '제목': myown.titleWithInspectMessage,
                        '키워드': query,
                        '순위': myown.rank,
                        '전문성': myown.crScoreA,
                        '신뢰성': myown.crScoreB,
                        '관련성': myown.crScoreC,
                        '검색량': (search && search.monthlyQcCnt) || 0,
                        '검색량:데스크탑': (search && search.monthlyPcQcCnt) || 0,
                        '검색량:모바일': (search && search.monthlyMobileQcCnt) || 0,
                        '생산선호주제': (r_category) || '',
                        '메인소비주제': (theme && theme.main && theme.main.name) || '',
                        '서브소비주제': (theme && theme.sub && theme.sub.map(o=>o.name).join(', ')) || '',
                    }
                });
                return _.orderBy(keywords_sheet, ['게시글번호', '순위', '전문성', '신뢰성', '관련성', '검색량', '키워드'], ['desc', 'asc', 'desc', 'desc', 'desc', 'desc', 'asc']);
            },
            '게시물분석': ()=>BlogPostList.map(item=>{
                let { addDate, logNo, categoryNo, categoryName, smartEditorVersion, readCount, thisDayPostInfo, scraped, memolog } = item;
                let { commentArrowVisible, commentCnt, sympathyArrowVisible, sympathyCnt, outSideAllow, scrapType } = item;
                let { titleWithInspectMessage, titleWithInspectMessageScore, titleWithInspectMessageUniqs, titleWithInspectMessageCases, titleWithInspectMessageDetail, ownedKeywords } = item;
                let { content, contentLength, contentLengthTrim, thumbnailCount, contentSections } = item;
                let { statsReferrerTotal, statsReferrerTotalKeywords, statsReferrerTotalKeywordsDetail } = item;
                let { notOpen, buddyOpen, bothBuddyOpen, allOpenPost, searchYn, postBlocked } = item;
                return {
                    '작성시간': moment(addDate).format('YYYY-MM-DD hh:mm:ss'),
                    '게시글번호': `${logNo}`,
                    '카테고리': categoryName,
                    '제목': titleWithInspectMessage,
                    // 유입정보
                    '유입키워드': statsReferrerTotalKeywords.join('\r\n'),
                    '유효키워드': ownedKeywords.map(o=>o.query).join('\r\n'),
                    // 편집정보
                    '에디터버전': smartEditorVersion,
                    '사진수': thumbnailCount,
                    '글자수': contentLength,
                    '글자수 (공백제외)': contentLengthTrim,
                    // 수치정보
                    '누적조회수': readCount,
                    '누적댓글수': commentCnt,
                    '누적공감수': sympathyCnt,
                    // 설정정보
                    '공개설정': (notOpen && '비공개') || (bothBuddyOpen && '서로이웃공개') || (buddyOpen && '이웃공개') || (allOpenPost && '전체공개') || '알 수 없음',
                    '검색허용': searchYn,
                    '블라인드': postBlocked,
                    '공유허용': outSideAllow,
                    // 지수정보
                    '검색순위': (titleWithInspectMessageScore && titleWithInspectMessageScore.rank) || 0,
                    '전문성': (titleWithInspectMessageScore && titleWithInspectMessageScore.crScoreA) || 0,
                    '신뢰성': (titleWithInspectMessageScore && titleWithInspectMessageScore.crScoreB) || 0,
                    '관련성': (titleWithInspectMessageScore && titleWithInspectMessageScore.crScoreC) || 0,
                };
            }),
            '게시물순위': () => BlogStat.map(item=>item.rank.article.rankCv).flat(),
            '주제순위': () => BlogStat.map(item=>item.rank.subject.rankCv).flat(),
            '공감순위': () => BlogStat.map(item=>item.rank.rankLike).flat(),
            '댓글순위': () => BlogStat.map(item=>item.rank.rankComment).flat(),
        });
    }
    async function keyword(query) {
        const name = String(query).replace(/[\s]+/g, '').toUpperCase();
        const data = await localforage.getItem(`NB_ANALYTICS_${name}`) || {};
        const time = data.time || Date.now();
        if(!data.value || Date.now() - time > 1000 * 60 * 60 * 1) { data.time = Date.now(); data.value = await NA_search(name); await localforage.setItem(`NB_ANALYTICS_${name}`, data); }
        return data.value;
    }
    async function crawler() {
        const data = await localforage.getItem('NB_ANALYTICS') || {};
        if(data.timestamp && moment().diff(data.timestamp, 'days') < 7) return download(data);
        data.timestamp = Date.now();
        const dates = _.range(90).map(o=>moment().subtract(o+1, 'days').format('YYYY-MM-DD'));
        // BlogUserInfo
        const BlogUserInfo = data.BlogUserInfo = await NB_blogInfo('', 'BlogUserInfo');
        if(!BlogUserInfo) throw new Error('네이버 계정 정보를 가져오지 못했습니다.');
        voice(`${BlogUserInfo.nickname}(${BlogUserInfo.userId})님의 블로그 진단을 시작합니다.`);
        // BlogInfo
        const BlogInfo = data.BlogInfo = await NB_blogInfo(BlogUserInfo.userId, 'BlogInfo');
        if(!BlogInfo) throw new Error('네이버 블로그 정보를 가져오지 못했습니다.');
        voice(`${BlogInfo.blogDirectoryName} 주제가 대표 주제로 설정되어 있습니다.`);
        // BusinessInfo
        const BusinessInfo = data.BusinessInfo = await NB_blogInfo(BlogInfo.blogId, 'BusinessInfo');
        if(!BusinessInfo) throw new Error('네이버 블로그 비즈니스 정보를 가져오지 못했습니다.');
        voice(BusinessInfo.existBusinessInfo ? `상업 정보가 등록된 비즈니스 블로그입니다.` : `상업 정보가 등록되지 않은 일반 블로그입니다.`);
        // BlogIntroduce
        const BlogIntroduce = data.BlogIntroduce = await NB_blogInfo(BlogInfo.blogId, 'Introduce');
        if(!BlogIntroduce) throw new Error('네이버 블로그 설명 정보를 가져오지 못했습니다.');
        voice(BlogIntroduce.phoneNumber ? `연락처 정보가 등록된 상업목적 블로그입니다.` : `연락처 정보가 등록되지 않은 일반 블로그입니다.`);
        voice(BlogIntroduce.address     ? `주소 정보가 등록된 상업목적 블로그입니다.`   : `주소 정보가 등록되지 않은 일반 블로그입니다.`);
        // BlogStat
        voice(`최근 3개월 간의 블로그 통계를 분석 중입니다...`);
        const BlogStat = data.BlogStat = await Promise.map(dates.reduce((r,o,i)=>(i % 7 == 0 && r.push(o), r), []), async (date) => {
            const item = { date };
            voice(`${date} 방문분석 지표 가져오는 중... (조회수)`);
            item.visit = Object.assign(item.visit || {}, await NB_blogStat['방문분석']['조회수'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 방문분석 지표 가져오는 중... (순방문자수)`);
            item.visit = Object.assign(item.visit || {}, await NB_blogStat['방문분석']['순방문자수'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 방문분석 지표 가져오는 중... (방문횟수)`);
            item.visit = Object.assign(item.visit || {}, await NB_blogStat['방문분석']['방문횟수'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 방문분석 지표 가져오는 중... (평균방문횟수)`);
            item.visit = Object.assign(item.visit || {}, await NB_blogStat['방문분석']['평균방문횟수'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 방문분석 지표 가져오는 중... (재방문율)`);
            item.visit = Object.assign(item.visit || {}, await NB_blogStat['방문분석']['재방문율'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 방문분석 지표 가져오는 중... (평균사용시간)`);
            item.visit = Object.assign(item.visit || {}, await NB_blogStat['방문분석']['평균사용시간'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 순위 지표 가져오는 중... (공감수)`);
            item.rank = Object.assign(item.rank || {}, await NB_blogStat['순위']['공감수'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 순위 지표 가져오는 중... (댓글수)`);
            item.rank = Object.assign(item.rank || {}, await NB_blogStat['순위']['댓글수'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 순위 지표 가져오는 중... (조회수 - 게시물)`);
            item.rank.article = Object.assign(item.rank.article || {}, await NB_blogStat['순위']['조회수']['게시물'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 순위 지표 가져오는 중... (조회수 - 주제)`);
            item.rank.subject = Object.assign(item.rank.subject || {}, await NB_blogStat['순위']['조회수']['주제'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 분석 지표 가져오는 중... (유입키워드)`);
            item.user = Object.assign(item.user || {}, await NB_blogStat['사용자분석']['유입분석']['검색'](BlogInfo.blogId, date, 'WEEK'));
            voice(`${date} 분석 지표 가져오는 중... (이웃증감수)`);
            item.rels = Object.assign(item.rels || {}, await NB_blogStat['사용자분석']['이웃증감수'](BlogInfo.blogId, date, 'WEEK'));
            return item;
        }, { concurrency: 10 });
        // BlogPostList
        voice(`최근 3개월 이내에 등록된 게시글을 가져오는 중... (최대 300개)`);
        const BlogPostList = await (async () => {
            let posts = [];
            for(let currentPage = 1, skip; currentPage <= 30 && !skip; currentPage++) {
                let data = await NB_blogInfo(BlogInfo.blogId, 'PostListInfo', { currentPage }).catch(e=>({}));
                let list = data.postViewList; if(!list || !list.length) break;
                for(let item of list) { skip = moment().diff(item.addDate, 'days') > dates.length; if(skip) { break; } else { posts.push(item); } }
                posts.push(...list.filter(v=>!!v && v.merged));
            }
            return posts;
        })();
        voice(`최근 3개월 이내에 등록된 게시글을 분석 중...`);
        data.BlogPostList = await Promise.map(BlogPostList, async (item) => {
            let { blogId, logNo } = item;
            voice(`${blogId}/${logNo} 분석 중...`);
            {
                voice(`${blogId}/${logNo} 예상 키워드 분석 중...`);
                let terms = await NX_termsParagraph(item.titleWithInspectMessage), uniqs = terms.filter((o,i,a)=>a.indexOf(o)==i);
                let cases = uniqs.reduce((function loops(index, cases, word, offset, uniqs){
                    if(index >= 1) return cases;
                    const sorts = Array.from(uniqs).sort((curr)=>curr===word?-1:1).slice(1);
                    const trans = Array.from(sorts).map((next)=>`${word} ${next}`);
                    const remap = Array.from(sorts).reduce(loops.bind(null, index+1), []).map((next)=>`${word} ${next}`);
                    cases.push(word, ...trans, ...remap);
                    return cases.sort().filter((v, i, a)=>a.indexOf(v) == i);
                }).bind(null, 0), []);
                item.titleWithInspectMessageCases = cases;
                item.titleWithInspectMessageUniqs = uniqs;
            }
            {
                voice(`${blogId}/${logNo} 유효 키워드 분석 중...`);
                item.titleWithInspectMessageScore = (await NX_items(item.titleWithInspectMessage, 1, 'view') || []).find(x=>x.blogId == blogId && x.logNo == logNo);
                item.titleWithInspectMessageDetail = await Promise.map(NR_termsAll(...item.titleWithInspectMessageUniqs), async (item) => {
                    voice(`${blogId}/${logNo} 유효 키워드 분석 중... ${item.query}`);
                    const list = await NX_items(item.query, 1, 'view');
                    item.myown = list.find(x=>x.blogId == blogId && x.logNo == logNo);
                    item.search = await keyword(item.query);
                    return item;
                }, { concurrency: 3 });
            }
            {
                voice(`${blogId}/${logNo} 본문 분석 중...`);
                let se = await SE_parseRemote(blogId, logNo);
                Object.assign(item, { content: se.content, contentLength: se.contentLength, contentLengthTrim: se.contentLengthTrim, contentSections: se.sections });
            }
            {
                voice(`${blogId}/${logNo} 유입 경로 분석 중...`);
                item.statsReferrerTotal = await Promise.map(dates, async (date) => {
                    voice(`${blogId}/${logNo} 유입 경로 분석 중... (${date})`);
                    const total = await NB_blogPostStat(logNo, 'referer/total', date, 'DATE');
                    const stats = await Promise.map(total.refererTotal, async (item) => {
                        voice(`${blogId}/${logNo} 유입 경로 분석 중... (${date}, ${item.referrerDomain || '-'})`);
                        const detail = await NB_blogPostStat(logNo, 'referer/total/detail', date, 'DATE', { searchEngine: item.referrerSearchEngine, refererDomain: item.referrerDomain })
                        if(detail && detail.refererDetail){
                            detail.refererDetail = detail.refererDetail.map((item)=>{
                                const uri = ((url)=>{ try { return new URL(url); } catch(e) {} })(item.referrerUrl);
                                const qry = item.searchQuery = ['query', 'q', 'keyword', 'searchKeyword'].reduce((r, k)=>r||(uri && uri.searchParams.get('query')), item.searchQuery) || '';
                                return item;
                            });
                        }
                        return Object.assign({}, item, { detail });
                    }, { concurrency: 10 });
                    return Object.assign({ date: moment(date).format('YYYY-MM-DD'), stats });
                });
                item.statsReferrerTotalKeywords = item.statsReferrerTotal.map(({ stats })=>stats.map(({ detail }) => (detail?detail.refererDetail:[]).map(({searchQuery})=>searchQuery)).flat()).flat().filter((o,i,a)=>o&&a.indexOf(o)==i);
                item.statsReferrerTotalKeywordsDetail = await Promise.map(NR_termsAll(...item.statsReferrerTotalKeywords), async (item) => {
                    voice(`키워드 분석하는 중... ${item.query}`);
                    item.myown = (await NX_items(item.query, 1, 'view')).find(x=>x.blogId == blogId && x.logNo == logNo);
                    item.search = await keyword(item.query);
                    return item;
                }, { concurrency: 3 });
            }
            {
                item.ownedKeywords = [...item.titleWithInspectMessageDetail, ...item.statsReferrerTotalKeywordsDetail].filter(o=>o.myown);
            }
            voice(`${blogId}/${logNo} 분석 완료.`);
            return item;
        }, { concurrency: 3 });
        voice(`블로그 진단 데이터 수집이 완료되었습니다. ${moment(data.timestamp).fromNow()} 시작 됨`);
        await localforage.setItem('NB_ANALYTICS', data);
        return download(data);
    }
    async function main() {
        if(main.loading) {
            toast.warn('이미 진단 데이터를 수집중입니다. 잠시 기다려주세요.');
        } else {
            voice(`블로그 진단 데이터를 읽어오는 중...`);
            main.loading = true;
            noti.dataset.timestamp = Date.now();
            await crawler().catch(e=>download_report(e)).catch(e=>null);
            delete noti.dataset.timestamp;
            main.loading = false;
        }
    }
});