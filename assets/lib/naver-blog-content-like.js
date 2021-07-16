// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.blog.content.like
// @description   네이버 블로그 게시물 댓글 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.31

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
    window.NB_blogPostLikes = async function NB_blogPostLikes(blogId, logNo, pageNo = 1) {
        const ref = new URL('https://m.blog.naver.com/SympathyHistoryList.nhn?blogId=&logNo=&categoryId=POST');
        ref.searchParams.set('blogId', blogId);
        ref.searchParams.set('logNo', logNo);
        const uri = new URL('https://m.blog.naver.com/rego/SympathyHistoryListJson.nhn?blogId=&logNo=&pageNo=&categoryId=POST');
        uri.searchParams.set('blogId', blogId);
        uri.searchParams.set('logNo', logNo);
        uri.searchParams.set('pageNo', pageNo);
        const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer: ref.toString() } });
        return Promise.resolve(eval(`('${res.responseText})`)).then(data=>_.get(data, 'result.sympathyHistoryList', []));
    }
    window.NB_blogPostLikesAll = async function NB_blogPostLikesAll(blogId, logNo) {
        const cmts = []
        for(let page = 1, temp; page == 1 || temp.length; page++) {
            temp = await NB_blogPostLikes(blogId, logNo, page);
            cmts.push(...temp);
        }
        return cmts;
    }
  })(window);