// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 블로그 공감수 순위 어드밴스드
// @description  네이버 블로그의 공감수 순위 기능을 확장합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.6
// @updateURL    https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/service/com.naver.blog-manage.likes.user.js
// @author       Won Choi
// @match        https://blog.stat.naver.com/blog/rank/like*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/assets/vendor/gm-app.min.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/assets/vendor/gm-add-style.min.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/assets/vendor/gm-add-script.min.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@latest/assets/donation.min.js
// ==/UserScript==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
async function inject_js(opt) {
  return new Promise((resolve, reject) => {
      var el = document.createElement('script'); el.type = 'text/javascript';
      function resolved() {
          el.parentNode.removeChild(el); resolve();
      }
      if(typeof opt === 'string') {
          el.onload = resolved; el.src = opt;
      }
      if(typeof opt === 'object') {
          el.onload = resolved; el.src = opt.src; el.integrity = opt.integrity;
          el.setAttribute('crossorigin', 'anonymous');
      }
      if(typeof opt === 'function') el.textContent = `(${opt})();`;
      if(el.src || el.textContent) {
          el.onerror = reject;
          document.head.prepend(el);
      }else reject();
      if(typeof opt === 'function') resolved();
  });
}
GM_App(async function main() {
  GM_donation('.u_ni_stats_detail_wrap');
  document.addEventListener('GM_xmlhttpRequest', async (e) => {
    const detail = await new Promise((resolve, reject) => GM_xmlhttpRequest({ ...e.detail, onerror: reject, onload: resolve, })).catch(e=>null);
    document.dispatchEvent(new CustomEvent(`GM_xmlhttpRequest.${e.detail.uuid}`, { detail }));
  })
  await inject_js(() => {
    function GM_xmlhttpRequest(detail = {}) {
      const uuid = detail.uuid = Math.floor(Math.random() * 999999999);
      return new Promise((resolve, reject) => {
        function callback(e){
          document.removeEventListener(`GM_xmlhttpRequest.${uuid}`, callback, false);
          return e.detail ? resolve(e.detail) : reject();
        }
        document.addEventListener(`GM_xmlhttpRequest.${uuid}`, callback, false);
        document.dispatchEvent(new CustomEvent(`GM_xmlhttpRequest`, { detail }));
      })
    }
    window.GM_xmlhttpRequest = window.GM_xmlhttpRequest || GM_xmlhttpRequest;
  })
  await inject_js({ integrity: 'sha512-TFp7JOp8so/oHJrngLI0kn9diZrc0YDr1NrGj1YbzbvSBdGfligjYVRp1xtqlmNCPWpx4xJDhiWSGgUYvqCbBg==', src: 'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js' });
  await inject_js({ integrity: 'sha512-90vH1Z83AJY9DmlWa8WkjkV79yfS2n2Oxhsi2dZbIv0nC4E6m5AbH8Nh156kkM7JePmqD6tcZsfad1ueoaovww==', src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js' });
  await inject_js({ integrity: 'sha512-LGXaggshOkD/at6PFNcp2V2unf9LzFq6LE+sChH7ceMTDP0g2kn6Vxwgg7wkPP7AAtX+lmPqPdxB47A0Nz0cMQ==', src: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js' });
  await inject_js(() => {
    async function rank_like(startDate, endDate) {
      const rangeDateStart = moment(startDate).toDate();
      const rangeDateLimit = moment(endDate || startDate).add(1, 'ms').toDate();
      const rangeDate = _.range(rangeDateStart, rangeDateLimit, 1000 * 60 * 60 * 24).map(ts=>moment(ts).toDate());
      return Promise.reduce(rangeDate, async (r, date) => r.concat(await rank_like_per_date(date)), []);
    }
    async function rank_like_per_date(startDate) {
      const uri = new URL('https://blog.stat.naver.com/api/blog/rank/likePc?timeDimension=DATE&startDate=&exclude=');
      uri.searchParams.set('startDate', moment(startDate).format('YYYY-MM-DD'));
      const res = await fetch(uri).then(r=>r.json());
      const statDataList = _.get(res, 'result.statDataList', []);
      return statDataList.reduce((r, item) => {
        const columnInfo = _.get(item, 'data.columnInfo', []);
        const rows = _.get(item, 'data.rows', { rank: [] });
        _.map(rows.rank, (rank, offset) => {
          const values = columnInfo.map((column)=>_.chain(rows).get(column).nth(offset).value());
          const item = _.zipObject(columnInfo, values);
          item.createDate = moment(item.createDate, 'YYYY.MM.DD. HH.mm').toISOString(true);
          item.date = moment(item.date, 'YYYY-MM-DD').toISOString(true);
          r.push(item);
        });
        return r;
      }, []);
    }

    window.rank_like = rank_like;
    window.rank_like_per_date = rank_like_per_date;
  })
  await inject_js(() => {
    async function likes(logNo, pageNo = 1, results = []) {
      const blogId = new URL(location.href).searchParams.get('blogId') || location.pathname.split('/')[1];
      
      const ref = new URL('https://m.blog.naver.com/SympathyHistoryList.nhn?blogId=&logNo=&categoryId=POST');
      ref.searchParams.set('blogId', blogId);
      ref.searchParams.set('logNo', logNo);

      const uri = new URL('https://m.blog.naver.com/rego/SympathyHistoryListJson.nhn?blogId=&logNo=&pageNo=&categoryId=POST');
      uri.searchParams.set('blogId', blogId);
      uri.searchParams.set('logNo', logNo);
      uri.searchParams.set('pageNo', pageNo);

      const resp = await GM_xmlhttpRequest({ url: uri.toString(), headers: { 'referer': ref.toString() } });
      const res = JSON.parse(resp.responseText.replace(/^[\]\)\]\}\'\,\s\r\n]+/, ''));
      const totalPage = _.get(res, 'result.totalPage', 1);
      const sympathyHistoryList = _.get(res, 'result.sympathyHistoryList', []);
      results.push(...sympathyHistoryList);
      return (totalPage > pageNo) ? likes(logNo, pageNo + 1, results) : results;
    }

    window.likes = likes;
  })
  await inject_js(() => {
    const html = `
    <!DOCTYPE html>
    <html ng-app="app">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.0.0-beta1/css/bootstrap.min.css" integrity="sha512-thoh2veB35ojlAhyYZC0eaztTAUhxLvSZlWrNtlV01njqs/UdY3421Jg7lX0Gq9SRdGVQeL8xeBp9x1IPyL1wQ==" crossorigin="anonymous" />
        <style>.loading { pointer-events: none; opacity: 0.5; }</style>
        <title>네이버 블로그 공감수 순위 어드밴스드</title>
      </head>
      <body>
        <div ng-controller="main" class="container-fluid">
          <div class="p-1">
            <div class="row p-1">
              <div class="col">
                <div class="input-group mb-3">
                  <input type="date" ng-model="filter.start" class="form-control" aria-label="등록일 시작">
                  <input type="date" ng-model="filter.limit" class="form-control" aria-label="등록일 종료">
                </div>
              </div>
              <div class="col-2">
                <div class="d-grid">
                  <button ng-click="search()" class="btn btn-block btn-warning">조회</button>
                </div>
              </div>
            </div>
          </div>
          <div class="p-1">
            <table class="table table-striped" ng-class="{loading: loading}" ng-repeat="(date, rows) in articles">
              <thead>
                <tr>
                  <th scope="col" colspan="6"><h4>{{ date.substr(0, 10) }}</h4></th>
                </tr>
                <tr>
                  <th scope="col">순위</th>
                  <th scope="col">제목</th>
                  <th scope="col">공감수</th>
                  <th scope="col">타입</th>
                  <th scope="col">작성일</th>
                  <th scope="col">기능</th>
                </tr>
              </thead>
              <tbody ng-repeat="row in rows">
                <tr>
                  <td scope="col">{{ row.rank }}</td>
                  <td>{{ row.title }}</td>
                  <td>{{ row.event }}</td>
                  <td>{{ row.type }}</td>
                  <td>{{ row.createDate.substr(0, 10) }}</td>
                  <td>
                    <div class="d-grid">
                      <button ng-click="likes(row)" class="btn btn-sm btn-info">목록보기</button>
                    </div>
                  </td>
                </tr>
                <tr ng-if="row.likes && row.likes.length">
                  <td colspan="6">
                    <table class="table table-striped">
                      <thead>
                        <tr>
                          <th scope="col">닉네임 (아이디)</th>
                          <th scope="col">등록일</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr ng-repeat="like in row.likes | filterLikeDate:filter.start:filter.limit">
                          <td>
                            <div>{{ like.userNickName }} ({{like.userId}})</div>
                            <div><small><a target="_blank" ng-href="https://blog.naver.com/{{like.userId}}">{{like.userBlogName}}</a></small></div>
                          </td>
                          <td>{{ like.addDate }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js" integrity="sha512-LGXaggshOkD/at6PFNcp2V2unf9LzFq6LE+sChH7ceMTDP0g2kn6Vxwgg7wkPP7AAtX+lmPqPdxB47A0Nz0cMQ==" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js" integrity="sha512-90vH1Z83AJY9DmlWa8WkjkV79yfS2n2Oxhsi2dZbIv0nC4E6m5AbH8Nh156kkM7JePmqD6tcZsfad1ueoaovww==" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.0.0-beta1/js/bootstrap.bundle.min.js" integrity="sha512-q2vREMvON/xrz1KuOj5QKWmdvcHtM4XNbNer+Qbf4TOj+RMDnul0Fg3VmmYprdf3fnL1gZgzKhZszsp62r5Ugg==" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.8.2/angular.min.js" integrity="sha512-7oYXeK0OxTFxndh0erL8FsjGvrl2VMDor6fVqzlLGfwOQQqTbYsGPv4ZZ15QHfSk80doyaM0ZJdvkyDcVO7KFA==" crossorigin="anonymous"></script>
        <script>
          const app = angular.module('app', []);
          app.constant('_', window._);
          app.constant('moment', window.moment);
          app.run(($rootScope) => {
            $rootScope._ = window._;
            $rootScope.moment = window.moment;
          })
          app.filter('filterLikeDate', () => {
            return function (likes, start, limit) {
              return likes.filter((like) => {
                const addDate = (/^[\\d\\.]+$/i.test(like.addDate) ? moment(like.addDate, 'YYYY.MM.DD.') : moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })).toDate();
                return start <= addDate && addDate <= limit;
              })
            }
          })
          app.controller('main', ($scope) => {
            $scope.loading = true;
            document.addEventListener('append.start', (e)=>($scope.loading = true, $scope.$apply()), false);
            document.addEventListener('append.finish', (e)=>($scope.loading = false, $scope.$apply()), false);

            $scope.filter = $scope.filter || {};
            $scope.filter.start = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate();
            $scope.filter.limit = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate();

            $scope.articles = [];
            $scope.search = async () => {
              $scope.articles = _.groupBy(await window.opener.rank_like($scope.filter.start, $scope.filter.limit), 'date');
              $scope.$apply();
            }
            $scope.likes = async (row) => {
              row.likes = await window.opener.likes(_.last(row.uri.split('/')));
              $scope.$apply();
            }
          });
          angular.bootstrap(document, ['app']);
        </script>
      </body>
    </html>
    `;
    const $window = window.open('about:blank', '_likes_window', 'width=960,height=720');
    setTimeout(async ()=>{
      $window.document.write(html);
      setTimeout(async () => {
        $window.document.dispatchEvent(new CustomEvent('append.start'));
        $window.document.dispatchEvent(new CustomEvent('append.finish'));
      }, 300);
    }, 300);
  })
});