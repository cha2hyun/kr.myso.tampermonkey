// ==UserScript==
// @namespace     https://tampermonkey.myso.kr
// @exclude       *

// ==UserLibrary==
// @name          setTimeoutQueue
// @description   setTimeoutQueue 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(window) {
  window.__queueDelay = 1000 * 15;
  window.__queueTimer;
  window.__queues = [];
  window.setTimeoutQueue = function(handler, timeout = window.__queueDelay) { window.__queues.push({ handler, timeout }); }
  window.clearTimeoutQueue = function(){
    window.__queueTimer = clearTimeout(window.__queueTimer);
    window.__queues.splice(0, window.__queues.length - 1);
    window.runTimeoutQueue();
  }
  window.runTimeoutQueue = function() {
    window.__queueTimer = clearTimeout(window.__queueTimer);
    window.__queueTimer = setTimeout(function() {
      window.__queueTimer = clearTimeout(window.__queueTimer);
      let now = Date.now();
      let queue = window.__queues.shift();
      let timeout = queue ? (queue.timeout || window.__queueDelay) : window.__queueDelay;
      if(queue && queue.handler) { queue.handler.apply(this); }
      let dif = Date.now() - now;
      let handle = setTimeout(function() {
          handle = clearTimeout(handle);
          window.runTimeoutQueue();
      }, Math.max(window.__queueDelay, timeout - dif));
    });
  }
  window.runTimeoutQueue();
})(window);