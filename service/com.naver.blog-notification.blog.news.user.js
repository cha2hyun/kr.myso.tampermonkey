// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 블로그 소식 알림
// @description  네이버 웹사이트를 열고 있는 동안, 블로그 소식을 PC에서 실시간으로 받아 볼 수 있습니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.2
// @updateURL    https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/service/com.naver.blog-notification.blog.news.user.js
// @author       Won Choi
// @match        *://*.naver.com/*
// @connect      naver.com
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/assets/vendor/gm-timer.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/assets/donation.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.7/assets/lib/naver-blog.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
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