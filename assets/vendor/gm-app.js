(function(window) {
  window.GM_App = function(callback, preload) {
    function _requestIdleCallback(callback) {
        if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
        return requestIdleCallback(callback);
    }
    function checkForDOM() {
      let container = document.body;
      if(preload == 1) container = document.head;
      if(preload == 2) container = document.documentElement;
      return container ? callback() : _requestIdleCallback(checkForDOM);
    }
    _requestIdleCallback(checkForDOM);
  }
})(window);