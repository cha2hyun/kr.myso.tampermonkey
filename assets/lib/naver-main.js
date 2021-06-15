(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
      });
  }
})(window);
// ---------------------
(function(window){
  const NM_CATEGORIES = [];
  NM_CATEGORIES.push({ label: '뭐하지', type: "SHOP-TODO", /*params: [ { MM_TODO_SUBMENU: 'FRIENDS' }, { MM_TODO_SUBMENU: 'KIDS' } ]*/ })
  NM_CATEGORIES.push({ label: '책방', type: "CULTURE" })
  NM_CATEGORIES.push({ label: '리빙', type: "LIVINGHOME" })
  NM_CATEGORIES.push({ label: '레시피', type: "LIVING" })
  NM_CATEGORIES.push({ label: '장보기', type: "FOOD-MARKET" })
  NM_CATEGORIES.push({ label: '패션뷰티', type: "BEAUTY" })
  NM_CATEGORIES.push({ label: '선물샵', type: "GIFT-SHOP" })
  NM_CATEGORIES.push({ label: '쇼핑라이브', type: "SHOP-LIVE" })
  NM_CATEGORIES.push({ label: '쇼핑', type: "SHOP_VOGUE" })
  NM_CATEGORIES.push({ label: 'MY구독', type: "MYFEED" })
  NM_CATEGORIES.push({ label: '동물공감', type: "ANIMAL" })
  NM_CATEGORIES.push({ label: '웹툰', type: "BBOOM" })
  NM_CATEGORIES.push({ label: '뿜', type: "BOOM" })
  NM_CATEGORIES.push({ label: '비즈니스', type: "BUSINESS" })
  NM_CATEGORIES.push({ label: '자동차', type: "CARGAME" })
  NM_CATEGORIES.push({ label: '중국', type: "CHINA" })
  NM_CATEGORIES.push({ label: '경제지표', type: "DATA" })
  NM_CATEGORIES.push({ label: '디자인', type: "DESIGN" })
  NM_CATEGORIES.push({ label: '연예', type: "ENT" })
  NM_CATEGORIES.push({ label: 'FARM', type: "FARM" })
  NM_CATEGORIES.push({ label: '경제M', type: "FINANCE" })
  NM_CATEGORIES.push({ label: '게임', type: "GAMEAPP" })
  NM_CATEGORIES.push({ label: '건강', type: "HEALTH" })
  NM_CATEGORIES.push({ label: '테크', type: "ITTECH" })
  NM_CATEGORIES.push({ label: 'JOB&', type: "JOB" })
  NM_CATEGORIES.push({ label: '어학당', type: "LANGUAGE" })
  NM_CATEGORIES.push({ label: '법률', type: "LAW" })
  NM_CATEGORIES.push({ label: '부모i', type: "MOMKIDS" })
  NM_CATEGORIES.push({ label: '영화', type: "MOVIE" })
  NM_CATEGORIES.push({ label: '뉴스', type: "NEWS-CHANNEL" })
  NM_CATEGORIES.push({ label: '뉴스구독', type: "NEWS-MY" })
  NM_CATEGORIES.push({ label: '우리동네', type: "PLACE" })
  NM_CATEGORIES.push({ label: '스쿨잼', type: "SCHOOL" })
  NM_CATEGORIES.push({ label: '과학', type: "SCIENCE" })
  NM_CATEGORIES.push({ label: '쇼핑', type: "SHOPPING" })
  NM_CATEGORIES.push({ label: '공연전시', type: "SHOW" })
  NM_CATEGORIES.push({ label: '스포츠', type: "SPORTS" })
  NM_CATEGORIES.push({ label: '여행+', type: "TRAVEL" })
  NM_CATEGORIES.push({ label: '연애·결혼', type: "WEDDING" })
  NM_CATEGORIES.push({ label: '함께N', type: "WITH" })
  window.NM_search = async function NM_search(type, param = {}) {
    const cookie = Object.keys(param).map(k=>`${k}=${param[k]}`).join('; ');
    const res = await GM_xmlhttpRequestAsync(`https://m.naver.com/panels/${type}.shtml?_=${Date.now()}`, { cookie });
    const doc = new DOMParser().parseFromString(res.response, 'text/html');
    return Array.from(doc.querySelectorAll('ul > li > a')).map((el, offset)=>({ type, offset, url: el.href }));
  }
  window.NM_searchAll = async function NM_searchAll() {
    return Promise.map(NM_CATEGORIES, async (item) => (!item.params) ? NM_search(item.type) : Promise.map(item.params, (param)=>NM_search(item.type, param)).then(r=>r.flat())).then(r=>r.flat());
  }
})(window);