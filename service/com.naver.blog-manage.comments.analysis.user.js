// ==UserScript==
// @namespace    https://tampermonkey.myso.kr/
// @name         네이버 블로그 댓글 이용자 분석
// @description  네이버 블로그의 댓글수 순위 이용자 분석 기능을 확장합니다.
// @copyright    2021, myso (https://tampermonkey.myso.kr)
// @license      Apache-2.0
// @version      1.0.5
// @updateURL    https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-manage.comments.analysis.user.js
// @downloadURL  https://github.com/myso-kr/kr.myso.tampermonkey/raw/master/service/com.naver.blog-manage.comments.analysis.user.js
// @author       Won Choi
// @connect      naver.com
// @match        https://blog.stat.naver.com/blog/rank/comment*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.14/assets/vendor/gm-app.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.14/assets/vendor/gm-add-style.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.14/assets/vendor/gm-add-script.js
// @require      https://cdn.jsdelivr.net/npm/kr.myso.tampermonkey@1.0.14/assets/donation.js
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
  await inject_js({ integrity: 'sha512-90vH1Z83AJY9DmlWa8WkjkV79yfS2n2Oxhsi2dZbIv0nC4E6m5AbH8Nh156kkM7JePmqD6tcZsfad1ueoaovww==', src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js' });
  await inject_js({ integrity: 'sha512-LGXaggshOkD/at6PFNcp2V2unf9LzFq6LE+sChH7ceMTDP0g2kn6Vxwgg7wkPP7AAtX+lmPqPdxB47A0Nz0cMQ==', src: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js' });
  await inject_js(() => {
    async function get_comments(logNo, page = 1, results = []) {
      const blogId = new URL(location.href).searchParams.get('blogId') || location.pathname.split('/')[1];

      let blogInfo = {};
      {
        const ref = new URL('https://m.blog.naver.com/');
        ref.pathname = `/${blogId}`;

        const uri = new URL('https://m.blog.naver.com/rego/BlogInfo.nhn?blogId=')
        uri.searchParams.set('blogId', blogId);
        const resp = await GM_xmlhttpRequest({ url: uri.toString(), headers: { 'cookie': document.cookie, 'referer': ref.toString() } });
        const res = JSON.parse(resp.responseText.replace(/^[\]\)\]\}\'\,\s\r\n]+/, ''));
        blogInfo = _.get(res, 'result');
        if(!blogInfo) return [];
      }
      let commentInfo = {}
      {
        const ref = new URL('https://m.blog.naver.com/CommentList.nhn?blogId=&logNo=');
        ref.searchParams.set('blogId', blogId);
        ref.searchParams.set('logNo', logNo);

        const uri = new URL('https://apis.naver.com/commentBox/cbox/web_naver_list_jsonp.json?ticket=blog&templateId=default&pool=cbox9&_callback=_callback&lang=ko&country=&objectId=&categoryId=&pageSize=100&indexSize=10&groupId=&listType=OBJECT&pageType=more&page=1&initialize=true&userType=MANAGER&useAltSort=true&replyPageSize=10&showReply=true');
        uri.searchParams.set('objectId', `${blogInfo.blogNo}_201_${logNo}`); // blogNo_201_logNo
        uri.searchParams.set('groupId', blogInfo.blogNo); //blogNo
        uri.searchParams.set('page', page);

        const resp = await GM_xmlhttpRequest({ url: uri.toString(), headers: { 'cookie': document.cookie, 'referer': ref.toString() } });
        const _callback = (res) => { commentInfo = _.get(res, 'result'); }
        eval(resp.responseText);
      }
      const commentList = _.get(commentInfo, 'commentList', []); results.push(...commentList);
      const totalPage = _.get(commentInfo, 'pageModel.lastPage', 1);
      return (totalPage > page) ? get_comments(logNo, page + 1, results) : results;
    }
    async function rank_comment(startDate, endDate) {
      const rangeDateStart = moment(startDate).toDate();
      const rangeDateLimit = moment(endDate || startDate).add(1, 'ms').toDate();
      const rangeDate = _.range(rangeDateStart, rangeDateLimit, 1000 * 60 * 60 * 24).map(ts=>moment(ts).toDate());
      const range = (await Promise.map(rangeDate, async (date) => await rank_comment_per_date(date))).flat();
      const posts = range.filter((v, i)=>i==range.findIndex((o)=>o.uri == v.uri)).map(({ uri, title })=>({ uri, title }));
      const comments = (await Promise.map(posts, async(post) => (await get_comments(post.uri.split('/').slice(-1)[0])).map((comment) => ({ ...comment, post })))).flat();
      const rangeComments = comments.filter((o)=>moment(startDate).valueOf() <= moment(o.regTime).valueOf() && moment(o.regTime).valueOf() < moment(endDate).add(1, 'day').valueOf());
      const rangeUsers = rangeComments.reduce((r, o)=>(r[o.profileUserId] = (r[o.profileUserId] || []).concat([o]), r), {})
      const items = Object.keys(rangeUsers).map((id)=>{ const comments = rangeUsers[id]; return { ...comments[0], comments }; }).sort((a, b)=>{
        const _a = a.profileUserId.localeCompare(b.profileUserId);
        const _b = b.comments.length - a.comments.length;
        return _b ? _b : _a;
      });
      return items;
    }
    async function rank_comment_per_date(startDate) {
      const uri = new URL('https://blog.stat.naver.com/api/blog/rank/commentPc?timeDimension=DATE&startDate=&exclude=');
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

    window.rank_like = rank_comment;
    window.rank_like_per_date = rank_comment_per_date;
  })
  await inject_js(() => {
    const html = `
    <!DOCTYPE html>
    <html ng-app="app">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.0.0-beta1/css/bootstrap.min.css" integrity="sha512-thoh2veB35ojlAhyYZC0eaztTAUhxLvSZlWrNtlV01njqs/UdY3421Jg7lX0Gq9SRdGVQeL8xeBp9x1IPyL1wQ==" crossorigin="anonymous" />
        <style>body { font-size: 12px; } .loading { pointer-events: none; opacity: 0.5; }</style>
        <title>네이버 블로그 댓글수 순위 이용자 분석</title>
      </head>
      <body>
        <div ng-controller="main" class="container-fluid">
          <div class="alert alert-info text-center">비공개 댓글은 표시되지 않습니다.</div>
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
            <div class="row p-1">
              <div class="col">
                <div class="input-group mb-3">
                  <span class="input-group-text">필터링단어</span>
                  <input type="text" ng-model="filter.keyword" placeholder="필터링 할 단어를 검색해주세요." class="form-control" aria-label="키워드 필터">
                </div>
              </div>
            </div>
          </div>
          <div class="p-1">
            <table class="table table-striped" ng-class="{loading: loading}">
              <thead>
                <tr>
                  <th scope="col" colspan="6"><h4>{{ date.substr(0, 10) }}</h4></th>
                </tr>
                <tr>
                  <th scope="col">닉네임 (아이디)</th>
                  <th scope="col">댓글수</th>
                  <th scope="col">기능</th>
                </tr>
              </thead>
              <tbody ng-repeat="user in users">
                <tr>
                  <td><a target="_blank" ng-href="https://blog.naver.com/{{ user.profileUserId }}">{{ user.userName }} ({{ user.profileUserId }})</a></td>
                  <td>{{ user.comments.length }}</td>
                  <td>
                    <div class="d-grid">
                      <button ng-click="comments(user)" class="btn btn-sm btn-info">목록보기</button>
                    </div>
                  </td>
                </tr>
                <tr ng-if="user.show && user.comments && user.comments.length">
                  <td colspan="6">
                    <table class="table table-striped">
                      <thead>
                        <tr>
                          <th scope="col">글</th>
                          <th scope="col">수정일</th>
                          <th scope="col">등록일</th>
                        </tr>
                      </thead>
                      <tbody ng-repeat="comment in user.comments | filterCommentDate:filter">
                        <tr>
                          <td><a target="_blank" ng-href="{{comment.post.uri}}">{{ comment.post.title }}</a></td>
                          <td>{{ comment.modTime }}</td>
                          <td>{{ comment.regTime }}</td>
                        </tr>
                        <tr>
                          <td colspan="3">
                            <p style="font-size:11px; resize: none;">{{ comment.contents }}</p>
                          </td>
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js" integrity="sha512-90vH1Z83AJY9DmlWa8WkjkV79yfS2n2Oxhsi2dZbIv0nC4E6m5AbH8Nh156kkM7JePmqD6tcZsfad1ueoaovww==" crossorigin="anonymous"></script>
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
          app.filter('filterCommentDate', () => {
            return function (comments, filter) {
              return comments
              .filter((o) => {
                const regTime = moment(o.regTime).toDate();
                return filter.start <= regTime && regTime < moment(filter.limit).add(1, 'days').toDate();
              })
              .filter((o) => {
                // filter.keywordType && filter.keyword
                const state = o[filter.keywordType];
                return !state || state.includes(filter.keyword);
              })
            }
          })
          app.controller('main', ($scope) => {
            $scope.loading = true;
            document.addEventListener('append.start', (e)=>($scope.loading = true, $scope.$apply()), false);
            document.addEventListener('append.finish', (e)=>($scope.loading = false, $scope.$apply()), false);

            $scope.filter = $scope.filter || {};
            $scope.filter.keywordType = 'contents';
            $scope.filter.keyword = '';
            $scope.filter.start = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate();
            $scope.filter.limit = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate();

            $scope.users = [];
            $scope.search = async () => {
              $scope.loading = true;
              $scope.users = await window.opener.rank_like($scope.filter.start, $scope.filter.limit);
              $scope.loading = false;
              $scope.$apply();
            }
            $scope.comments = (row) => { row.show = !row.show; }
          });
          angular.bootstrap(document, ['app']);
        </script>
      </body>
    </html>
    `;
    const $window = window.open('about:blank', '_likes_analysis_window', 'width=960,height=720');
    setTimeout(async ()=>{
      $window.document.write(html);
      setTimeout(async () => {
        $window.document.dispatchEvent(new CustomEvent('append.start'));
        $window.document.dispatchEvent(new CustomEvent('append.finish'));
      }, 300);
    }, 300);
  })
});