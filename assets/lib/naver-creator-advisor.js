// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.creator-advisor
// @description   네이버 크리에이터 어드바이저 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.48

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
// ---------------------
(function(){Object.fromEntries||Object.defineProperty(Object,"fromEntries",{configurable:!0,value:function r(){var t=arguments[0];return [...t].reduce((o,[k,v])=>(o[k]=v,o), {})},writable:!0})})();
// ---------------------
(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
      });
  }
})(window);
// ---------------------
(function(window) {
  class CreatorAdvisorApi {
      constructor(endpoint, defaults) {
          this.endpoint = new URL('https://creator-advisor.naver.com/api/v4' + endpoint);
          this.defaults = Object.assign({}, Object.fromEntries(this.endpoint.searchParams.entries()), defaults);
      }
      exec(data) {
          const endpoint = new URL(this.endpoint);
          const params = Object.assign({}, this.defaults, data || {}); Object.entries(params).map(([k,v])=>endpoint.searchParams.set(k, v));
          const referer = 'https://creator-advisor.naver.com/';
          const headers = { 'Cookie': document.cookie, 'Referer': referer };
          return GM_xmlhttpRequestAsync(referer, { headers }).then(xhr=>(xhr.status == 200) && GM_xmlhttpRequestAsync(endpoint, { headers }).then(r=>JSON.parse(r.response))).catch(e=>null);
      }
  }
  class CreatorAdvisor {
      constructor() {
          this.commands = {};
          this.command('channels', '/accounts/channels');
          this.command('revenue-summary', '/home/revenue-summary');
          this.command('cv-summary', '/home/cv-summary');
          this.command('query-compare', '/inflow-analysis/query-compare?service=&channelId=&metric=cv&interval=day&date=&contentType=text&limit=10');
          this.command('popular-contents', '/inflow-analysis/popular-contents?service=&channelId=&metric=cv&contentType=text&interval=day&date=&limit=5&keyword=');
          this.command('referrer-query-trends', '/inflow-analysis/referrer-query-trends?service=&channelId=&metric=cv&interval=day&startDate=&endDate=&queries=&contentId=&ct=');
          this.command('referrer-query-summary', '/inflow-analysis/referrer-query-summary?service=&channelId=&metric=cv&interval=day&date=&limit=');
          this.command('view-count', '/integrated-analysis/view-count?service=&channelId=&interval=day&startDate=&endDate=&contentId=');
          this.command('channel-ranks', '/integrated-analysis/channel-ranks?service=&channelId=&interval=day&date=&limit=20&keywordCount=5');
          this.command('referrer-query', '/integrated-analysis/referrer-query?service=&channelId=&metric=cv&interval=day&date=&limit=2&referrerDomain=&etc=&etcSize=&contentId=');
          this.command('content-demo-trend', '/integrated-analysis/content-demo-trend?service=&channelId=&metric=cv&interval=day&startDate=&endDate=&contentId=');
      }
      command(name, endpoint, defaults) { return this.commands[name] = new CreatorAdvisorApi(endpoint, defaults || {}); }
      exec(name, data) {
          const command = this.commands[name]; if(!command) throw new Error('has not command');
          return command.exec(data);
      }
  }
  window.CreatorAdvisor = new CreatorAdvisor();
})(window);