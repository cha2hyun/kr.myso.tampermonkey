// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.blog.content
// @description   네이버 블로그 게시물 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.14

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
      });
  }
})(window);
// ---------------------
(function(window) {
  const days = (1000 * 60 * 60 * 24), week = days * 7;
  const curr = Date.now(), prev = curr - days, prev_week = curr - week;
  function date_format(date) {
      const time = new Date(date);
      const Y = `0000${time.getFullYear()}`.substr(-4);
      const M = `0000${time.getMonth() + 1}`.substr(-2);
      const D = `0000${time.getDate()}`.substr(-2);
      return `${Y}-${M}-${D}`;
  }
  function NB_blogPostStatFuncGroup(defaultDate, dimensionDefault, defaults = {}) {
      const group = async function(contentId, date = defaultDate, dimension = dimensionDefault, params) {
          const data = {};
          if(dimensionDefault == 'WEEK'  && dimension == 'DATE') dimension = dimensionDefault;
          if(dimensionDefault == 'MONTH' && dimension == 'DATE') dimension = dimensionDefault;
          if(dimensionDefault == 'MONTH' && dimension == 'WEEK') dimension = dimensionDefault;
          for(let k in group) { data[k] = await group[k](contentId, date, dimension, Object.assign({}, defaults, params)); }
          return data;
      }
      return group;
  }
  function NB_blogPostStatFunc(action, defaultDate, dimensionDefault, defaults = {}) {
      return async function(contentId, date = defaultDate, dimension = dimensionDefault, params) {
          return NB_blogPostStatObject(await NB_blogPostStat(contentId, action, date, dimension, Object.assign({}, defaults, params)));
      }
  }
  function NB_blogPostStatObject(resp) {
      resp && resp.map((item)=>{
          const data = item.data || {};
          const rows = data.rows || {};
          const cols = Object.keys(rows);
          const head = cols[0], headdata = rows[head];
          resp[item.dataId] = headdata ? headdata.map((nil, idx) => cols.reduce((r, key)=>(r[key] = rows[key][idx], r), {})) : data;
      });
      return resp;
  }
  window.NB_blogPostStat = async function NB_blogPostStat(contentId, action, date = curr, dimension = 'DATE', params = {}) {
      const referer = `https://blog.stat.naver.com/blog/article/${contentId}`;
      const uri = new URL(`https://blog.stat.naver.com/api/blog/article/${action}`);
      uri.searchParams.set('_', Date.now());
      uri.searchParams.set('timeDimension', dimension.toUpperCase());
      uri.searchParams.set('startDate', date_format(date));
      uri.searchParams.set('contentId', contentId);
      Object.keys(params).map((k)=>uri.searchParams.set(k, params[k]));
      console.info('loading...', uri.toString());
      const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer } });
      const data = eval(`(${res.responseText})`);
      return NB_blogPostStatObject(data && data.result && data.result.statDataList);
  }
})(window);