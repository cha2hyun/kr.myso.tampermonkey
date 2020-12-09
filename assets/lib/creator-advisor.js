(function(window) {
  class CreatorAdvisorApi {
      constructor(endpoint, defaults) {
          this.endpoint = new URL('https://creator-advisor.naver.com/api/v3/' + endpoint);
          this.defaults = Object.assign({}, Object.fromEntries(this.endpoint.searchParams.entries()), defaults);
      }
      exec(data) {
          const endpoint = new URL(this.endpoint);
          const params = Object.assign({}, this.defaults, data || {});
          Object.entries(params).map(([k,v])=>endpoint.searchParams.set(k, v));
          return fetch(endpoint).then(r=>r.json()).catch(e=>null);
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