(function(window) {
  window.GM_App = function(callback) {
    function _requestIdleCallback(callback) {
        if(typeof requestIdleCallback == 'undefined') return setTimeout(callback, 1000);
        return requestIdleCallback(callback);
    }
    function checkForDOM() { return (document.body) ? callback() : _requestIdleCallback(checkForDOM); }
    _requestIdleCallback(checkForDOM);
  }
})(window);