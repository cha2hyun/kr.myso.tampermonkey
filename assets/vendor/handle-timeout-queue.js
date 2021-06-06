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