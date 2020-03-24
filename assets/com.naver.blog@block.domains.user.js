// ==UserScript==
// @name         네이버 블로그 스팸 차단글 자동화 도구 - 국제 도메인
// @namespace    https://www.myso.kr/
// @version      0.1
// @description  네이버 블로그 스팸 차단글 설정에서 손쉽게 모든 국제 도메인을 차단 키워드로 등록 할 수 있습니다.
// @author       Won Choi
// @match        https://admin.blog.naver.com/*/config/bloginfo
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    (function wait() {
        wait._timer = clearTimeout(wait._timer);
        wait._timer = setTimeout(() => {
            const $window = document.querySelector('#papermain').contentWindow;
            const $document = document.querySelector('#papermain').contentDocument;
            if(!$window || !$document) return wait();
            const domains = '.com|.org|.net|.int|.edu|.gov|.mil|.arpa|.ac|.ad|.ae|.af|.ag|.ai|.al|.am|.an|.cw|.sx|.ao|.aq|.ar|.as|.at|.au|.aw|.ax|.az|.ba|.bb|.bd|.be|.bf|.bg|.bh|.bi|.bj|.bm|.bn|.bo|.br|.bs|.bt|.bu|.mm|.bv|.bw|.by|.bz|.ca|.cc|.cd|.cf|.cg|.ch|.ci|.ck|.cl|.cm|.cn|.co|.cr|.cs|.cz|.sk|.yu|.rs|.me|.cu|.cv|.cw|.cx|.cy|.cz|.de|.dj|.dk|.dm|.do|.dz|.ec|.ee|.eg|.eh|.er|.es|.et|.eu|.fi|.fj|.fk|.fm|.fo|.fr|.ga|.gb|.uk|.gd|.ge|.gf|.gg|.gh|.gi|.gl|.gm|.gn|.gp|.gq|.gr|.gs|.gt|.gu|.gw|.gy|.hk|.hm|.hn|.hr|.ht|.hu|.id|.ie|.il|.im|.in|.io|.iq|.ir|.is|.it|.je|.jm|.jo|.jp|.ke|.kg|.kh|.ki|.km|.kn|.kp|.kr|.kw|.ky|.kz|.la|.lb|.lc|.li|.lk|.lr|.ls|.lt|.lu|.lv|.ly|.ma|.mc|.md|.me|.mg|.mh|.mk|.ml|.mm|.mn|.mo|.mp|.mq|.mr|.ms|.mt|.mu|.mv|.mw|.mx|.my|.mz|.na|.nc|.ne|.nf|.ng|.ni|.nl|.no|.np|.nr|.nu|.nz|.om|.pa|.pe|.pf|.pg|.ph|.pk|.pl|.pm|.pn|.pr|.ps|.pt|.pw|.py|.qa|.re|.ro|.rs|.ru|.rw|.sa|.sb|.sc|.sd|.se|.sg|.sh|.si|.sj|.sk|.sl|.sm|.sn|.so|.sr|.ss|.st|.su|.sv|.sx|.sy|.sz|.tc|.td|.tf|.tg|.th|.tj|.tk|.tl|.tm|.tn|.to|.tp|.tr|.tt|.t...software|.solar|.solutions|.space|.studio|.style|.sucks|.supplies|.supply|.support|.surf|.surgery|.systems|.tattoo|.tax|.taxi|.team|.store|.tech|.technology|.tel|.tennis|.theater|.tips|.tires|.today|.tools|.top|.tours|.town|.toys|.trade|.training|.travel|.university|.vacations|.vet|.video|.villas|.vision|.vodka|.vote|.voting|.voyage|.wang|.watch|.webcam|.website|.wed|.wedding|.whoswho|.wiki|.win|.wine|.work|.works|.world|.wtf|.xxx|.xyz|.yoga|.zone|.bar|.bible|.biz|.church|.club|.college|.com|.design|.download|.green|.hiv|.info|.ist|.kaufen|.kiwi|.lat|.moe|.name|.net|.ninja|.one|.OOO|.org|.pro|.wiki|.xyz|.aero|.asia|.cat|.eus|.coop|.edu|.gov|.int|.jobs|.mil|.mobi|.museum|.post|.tel|.tokyo|.travel|.xxx|.alsace|.berlin|.brussels|.bzh|.cymru|.frl|.gal|.gent|.irish|.istanbul|.kiwi|.krd|.miami|.nyc|.paris|.quebec|.saarland|.scot|.vlaanderen|.wales|.wien|.arpa|.nato|.example|.invalid|.local|.localhost|.onion|.test|.africa|.bcn|.lat|.eng|.sic|.geo|.mail|.web|.shop|.art|.eco|.kid|.kids|.music'.split('|');
            const el_kwd = $document.querySelector('._nclk\\(bas_spam\\.keyinput\\)');
            const el_btn = $document.querySelector('._nclk\\(bas_spam\\.keyadd\\)');
            const el_lst = $document.querySelectorAll('li[id^="LIST_"]');
            if(!el_kwd || !el_btn) return wait();
            if(!$document.activeElement || el_kwd != $document.activeElement) return wait();
            el_kwd.value = "";
            const tx_lst = Array.from(el_lst).map(el=>el.innerText.trim());
            const filters = domains.filter(o=>!tx_lst.includes(o));
            const keyword = filters[0];
            const keyboardEvent = (element, keyCode) => {
                const methodKD = document.createEvent("KeyboardEvent");
                const methodKU = document.createEvent("KeyboardEvent");
                const methodKI = document.createEvent("KeyboardEvent");
                const initMethod = typeof methodKU.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
                methodKD[initMethod]("keydown", true, true, window, false, false, false, false, keyCode.charCodeAt(0), 0);
                methodKU[initMethod]("keyup", true, true, window, false, false, false, false, keyCode.charCodeAt(0), 0);
                methodKI[initMethod]("input", true, true, window, false, false, false, false, keyCode.charCodeAt(0), 0);
                element.dispatchEvent(methodKD);
                element.dispatchEvent(methodKU);
                element.dispatchEvent(methodKI);
                element.value += keyCode;
            }
            if(keyword) {
                keyword.split('').forEach(o=>keyboardEvent(el_kwd, o));
                el_btn.click();
            }
            return wait();
        }, 500);
    })();
})();
