(function(window) {
  window.inject_css = function inject_css(css) {
    const container = (document.head || document.body || document.documentElement);
    const element = document.createElement('style');
    element.setAttribute('type', 'text/css');
    element.textContent = css;
    container.append(element);
    element.onload = function() { container.removeChild(element); };
    setTimeout(function(){ container.removeChild(element); }, 300);
  }
  window.GM_addStyle = window.GM_addStyle || window.inject_css;
})(window);