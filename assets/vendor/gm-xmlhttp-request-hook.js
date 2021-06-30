// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          GM_xmlhttpRequestHook
// @description   GM_xmlhttpRequestHook 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.8

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function (window) {
  window.GM_xmlhttpRequestHook = (callback) => window.GM_xmlhttpRequestHook.tracking = callback || window.GM_xmlhttpRequestHook.tracking;
  window.GM_xmlhttpRequestHook.tracking = (data, origin) => origin;
  window.fetch = ((fetch) => {
    return function(url) {
      window.GM_xmlhttpRequestHook.tracking({ type: 'xhr', target: this.url = url });
      return fetch.apply(this, arguments);
    };
  })(window.fetch$ = window.fetch$ || window.fetch);
  window.Response = ((Response) => {
    const Res = Response.prototype, text = Res.text, json = Res.json;
    Res.text = async function() {
      const res = await text.apply(this, arguments), txt = res;
      const detail_keys = ['url', 'status', 'statusText'];
      const detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), { response: txt, responseText: txt, responseJson: undefined });
      try { detail.responseJson = JSON.parse(res); } catch(e) {}
      return window.GM_xmlhttpRequestHook.tracking({ type: 'xhrload', target: this.url, detail }, res);
    };
    Res.json = async function() {
      const res = await json.apply(this, arguments), txt = JSON.stringify(res);
      const detail_keys = ['url', 'status', 'statusText'];
      const detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), { response: txt, responseText: txt, responseJson: res, });
      return window.GM_xmlhttpRequestHook.tracking({ type: 'xhrload', target: this.url, detail }, res);
    };
  })(window.Response$ = window.Response$ || window.Response)
  window.XMLHttpRequest = ((XMLHttpRequest)=> {
    const XHR = XMLHttpRequest.prototype, send = XHR.send, open = XHR.open;
    XHR.open = function(method, url) { this.url = url; return open.apply(this, arguments); }
    XHR.send = function() {
      this.addEventListener('load', function () {
        const detail_keys = ['url', 'response', 'status', 'statusText'];
        const detail = detail_keys.reduce((r, o)=>(r[o] = this[o], r), { responseText: undefined, responseJson: undefined });
        try { detail.responseText = detail.response; } catch(e) {};
        try { detail.responseJson = JSON.parse(detail.response); } catch(e) {}
        window.GM_xmlhttpRequestHook.tracking({ type: 'xhrload', target: this.url, detail });
      });
      window.GM_xmlhttpRequestHook.tracking({ type: 'xhr', target: this.url });
      send.apply(this, arguments);
    };
    return XMLHttpRequest;
  })(window.XMLHttpRequest$ = window.XMLHttpRequest$ || window.XMLHttpRequest);
})(window);