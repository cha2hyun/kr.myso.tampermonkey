(function () {
  Object.pick = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>filter.includes(key));
    return keys.reduce((out, key)=>(out[key] = object[key], out), {});
  }
  Object.omit = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>!filter.includes(key));
    return keys.reduce((out, key)=>(out[key] = object[key], out), {});
  }
  Object.conservation = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>!filter.includes(key));
    keys.map((key)=>delete object[key]);
  }
  Object.exclusion = function(object, ...filter) {
    let keys = Object.keys(object).filter((key)=>filter.includes(key));
    keys.map((key)=>delete object[key]);
  }
  Array.prototype.excludes = function(x) { return !this.includes(x); }
  function ArrayClass(Clazz) {
    let prototypeArray = Object.getOwnPropertyNames(Array.prototype);
    let prototypeClazz = Object.getOwnPropertyNames(Clazz.prototype);
    let prototype = prototypeArray.filter(prototypeClazz.excludes.bind(prototypeClazz)); prototype.push(Symbol.iterator, Symbol.unscopables);
    prototype.map(prototypeName=>{
      if(typeof Clazz.prototype[prototypeName] !== 'undefined') return;
      Clazz.prototype[prototypeName] = Array.prototype[prototypeName];
    });
  }
  ArrayClass(NodeList);
  ArrayClass(DOMTokenList);
  ArrayClass(HTMLCollection);
  DOMTokenList.prototype.startsWith = function(className) { return this.find(o=>o.startsWith(className)); }
  DOMTokenList.prototype.endsWith = function(className) { return this.find(o=>o.endsWith(className)); }
})();