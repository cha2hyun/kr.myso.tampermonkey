// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          GM_setTimeout
// @description   GM_setTimeout, GM_setInterval 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
(function(window) {
  const global_uuid = uuidv4(), noop = ()=>{};
  function uuidv4() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }
  async function sha256(message) {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
  }
  window.GM_clearTimerAll = async function GM_clearTimerAll(uuid = global_uuid) {
      let queue = JSON.parse(GM_getValue('GM_globalTimers', '[]'));
      let equal = (o)=>o.uuid == uuid;
      let range = (o)=>Date.now() >= ((o.timestamp || 0) + (o.delay || 0));
      queue.filter(o=>equal(o)&&range(o)).map(o=>o.type == 'setTimeout' ? clearTimeout(o.handle) : clearInterval(o.handle));
      queue = queue.filter(o=>!range(o));
      GM_setValue('GM_globalTimers', JSON.stringify(queue));
  }
  window.GM_appendTimer = async function GM_appendTimer(type, callback = noop, delay, uuid = global_uuid) {
      await GM_clearTimerAll(uuid);
      let script = await sha256(`${callback}`);
      let queue = JSON.parse(GM_getValue('GM_globalTimers', '[]'));
      let equal = (o, id)=>o.id == id;
      let id = `${uuid}_${type}_${script}`;
      if(queue.find(o=>equal(o, id))) return id;
      let handle = setTimeout(() => (GM_removeTimer(id, uuid), callback()), delay);
      let timestamp = Date.now();
      queue.push({ id, type, uuid, script, handle, timestamp, delay });
      GM_setValue('GM_globalTimers', JSON.stringify(queue));
      return id;
  }
  window.GM_removeTimer = async function GM_removeTimer(id, uuid = global_uuid) {
      await GM_clearTimerAll(uuid);
      let queue = JSON.parse(GM_getValue('GM_globalTimers', '[]'));
      let equal = (o)=>o.id == id;
      queue.filter(o=>equal(o)).map(o=>o.type == 'setTimeout' ? clearTimeout(o.handle) : clearInterval(o.handle));
      queue = queue.filter(o=>!equal(o));
      GM_setValue('GM_globalTimers', JSON.stringify(queue));
  }
  window.GM_clearTimeout = GM_removeTimer;
  window.GM_clearInterval = GM_removeTimer;
  window.GM_setTimeout = async function GM_setTimeout(callback = noop, delay, uuid = global_uuid) {
      return GM_appendTimer('setTimeout', callback, delay, uuid);
  }
  window.GM_setInterval = async function GM_setInterval(callback = noop, delay, uuid = global_uuid) {
      return GM_appendTimer('setInterval', callback, delay, uuid);
  }
  window.addEventListener('load', ()=>GM_clearTimerAll(), false);
})(window);