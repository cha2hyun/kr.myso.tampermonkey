// ==UserScript==
// @name         네이버 블로그 소식 알림
// @namespace    https://tampermonkey.myso.kr/
// @version      1.0.0
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-notification.blog.news.user.js
// @description  네이버 웹사이트를 열고 있는 동안, 블로그 소식을 PC에서 실시간으로 받아 볼 수 있습니다.
// @author       Won Choi
// @match        *://*.naver.com/*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-app.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-timer.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-style.js
// @require      https://tampermonkey.myso.kr/assets/vendor/gm-add-script.js
// @require      https://tampermonkey.myso.kr/assets/donation.js?v=210613
// @require      https://tampermonkey.myso.kr/assets/lib/naver-blog.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// ==/UserScript==
GM_App(async function main() {
  if(window.top !== window.self) return;
  (GM_donationApp(async function repeat() {
      repeat.uuid = 'NS_newsNotification';
      repeat.timer = await GM_clearTimeout(repeat.timer, repeat.uuid);
      repeat.timer = await GM_setTimeout(async () => {
          const timestamp = GM_getValue(repeat.uuid, 0);
          const user = await NB_blogInfo('', 'BlogUserInfo');
          if(user && user.userId) {
              const news = await NB_blogInfo(user.userId, 'NewsList');
              const list = _.get(news, 'newsList', []).filter(o=>o.createTime > timestamp);
              if(list.length) {
                  GM_notification(`${list.length}건의 새로운 소식이 있습니다.`, '네이버 블로그 소식 알림', 'https://blog.naver.com/favicon.ico', () => window.open('https://noti.naver.com/', repeat.uuid));
              }
              GM_setValue('NS_newsNotification', Date.now());
          }
          return repeat();
      }, 1000 * 60 * 30, repeat.uuid);
  }))();
});