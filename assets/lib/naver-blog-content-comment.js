// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.blog.content.comment
// @description   네이버 블로그 게시물 댓글 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.28

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
    window.NB_blogPostComments = async function NB_blogPostComments(blogId, blogNo, logNo, page = 1) {
        const referer = `https://m.blog.naver.com/CommentList.naver?blogId=${blogId}&logNo=${logNo}`;
        const uri = new URL(`https://apis.naver.com/commentBox/cbox/web_naver_list_jsonp.json?ticket=blog&templateId=default&pool=cbox9&_wr&_callback=&lang=ko&country=&objectId=&categoryId=&pageSize=100&indexSize=10&groupId=118182711&listType=OBJECT&pageType=more&page=1&refresh=false&sort=REVERSE_NEW&userType=MANAGER&_=1626385455629`);
        uri.searchParams.set('_', Date.now());
        uri.searchParams.set('page', page);
        uri.searchParams.set('groupId', blogNo);
        uri.searchParams.set('objectId', `${blogNo}_201_${logNo}`);
        uri.searchParams.set('_callback', `_callback`);
        const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer } });
        return new Promise(_callback=>eval(res.responseText)).then(data=>_.get(data, 'result.commentList', []));
    }
    window.NB_blogPostCommentsAll = async function NB_blogPostCommentsAll(blogId, blogNo, logNo) {
        const cmts = []
        for(let page = 1, temp; page == 1 || temp.length; page++) {
            temp = await NB_blogPostComments(blogId, blogNo, logNo, page);
            cmts.push(...temp);
        }
        return cmts;
    }
  })(window);