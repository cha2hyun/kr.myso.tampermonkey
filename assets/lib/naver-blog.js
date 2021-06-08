(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window) {
    window.NB_blogInfo = async function NB_blogInfo(blogId, action, params = {}) {
        const referer = `https://m.blog.naver.com/${blogId}`;
        const uri = new URL(`https://m.blog.naver.com/rego/${action}.naver`);
        uri.searchParams.set('_', Date.now());
        uri.searchParams.set('blogId', blogId);
        Object.keys(params).map((k)=>uri.searchParams.set(k, params[k]));
        const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer } });
        const data = eval(`('${res.responseText})`);
        return data && data.result;
    }
})(window);
// ---------------------
(function(window) {
    const days = (1000 * 60 * 60 * 24), week = days * 7;
    const curr = Date.now(), prev = curr - days, prev_week = curr - week;
    function date_format(date) {
        const time = new Date(date);
        const Y = `0000${time.getFullYear()}`.substr(-4);
        const M = `0000${time.getMonth() + 1}`.substr(-2);
        const D = `0000${time.getDate()}`.substr(-2);
        return `${Y}-${M}-${D}`;
    }
    window.NB_blogStat = async function NB_blogStat(blogId, action, date = curr, dimension = 'DATE', params = {}) {
        const referer = `https://m.blog.naver.com/${blogId}`;
        const uri = new URL(`https://blog.stat.naver.com/api/blog/${action}`);
        uri.searchParams.set('timeDimension', dimension.toUpperCase());
        uri.searchParams.set('startDate', date_format(date));
        uri.searchParams.set('exclude', '');
        Object.keys(params).map((k)=>uri.searchParams.set(k, params[k]));
        uri.searchParams.set('_', Date.now());
        console.info('loading...', uri.toString());
        const res = await GM_xmlhttpRequestAsync(uri.toString(), { headers: { referer } });
        const data = eval(`(${res.responseText})`);
        return data && data.result && data.result.statDataList;
    }
    window.NB_blogStatFuncGroup = function(defaultDate, dimensionDefault, defaults = {}) {
        const group = async function(blogId, date = defaultDate, dimension = dimensionDefault, params) {
            const data = {};
            if(dimensionDefault == 'WEEK'  && dimension == 'DATE') dimension = dimensionDefault;
            if(dimensionDefault == 'MONTH' && dimension == 'DATE') dimension = dimensionDefault;
            if(dimensionDefault == 'MONTH' && dimension == 'WEEK') dimension = dimensionDefault;
            for(let k in group) { data[k] = await group[k](blogId, date, dimension, params); }
            return data;
        }
        return group;
    }
    window.NB_blogStatFunc = function(action, defaultDate, dimensionDefault, defaults = {}) {
        return async function(blogId, date = defaultDate, dimension = dimensionDefault, params) {
            return window.NB_blogStat(blogId, action, date, dimension, Object.assign({}, defaults, params));
        }
    }
    // 요약
    window.NB_blogStat['요약'] = NB_blogStatFunc('daily/weekAndMonthAnalysis');
    // 일간현황
    window.NB_blogStat['일간현황'] = NB_blogStatFuncGroup();
    window.NB_blogStat['일간현황']['조회수'] = NB_blogStatFunc('daily/cv', { additionalTimeDimension: 'WEEK', exclude: 'dashboard,weekAndMonthAnalysis,rank_play_cnt,rankCv,refererTotal,refererDetail,refererTotalCount' });
    window.NB_blogStat['일간현황']['방문횟수'] = NB_blogStatFunc('daily/visit', { additionalTimeDimension: 'WEEK', exclude: 'dashboard,weekAndMonthAnalysis,rank_play_cnt,rankCv,refererTotal,refererDetail,refererTotalCount' });
    window.NB_blogStat['일간현황']['조회수순위'] = NB_blogStatFunc('daily/rankCv', { additionalTimeDimension: 'WEEK', exclude: 'dashboard,weekAndMonthAnalysis' });
    window.NB_blogStat['일간현황']['유입경로'] = NB_blogStatFunc('daily/referer/total', { additionalTimeDimension: 'WEEK', exclude: 'dashboard,weekAndMonthAnalysis' });
    window.NB_blogStat['일간현황']['성별연령별분포'] = NB_blogStatFunc('daily/demo', { additionalTimeDimension: 'WEEK', exclude: 'dashboard,weekAndMonthAnalysis,rank_play_cnt,rankCv,refererTotal,refererDetail,refererTotalCount' });
    // 방문분석
    window.NB_blogStat['방문분석'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['방문분석']['조회수'] = NB_blogStatFunc('visit/cv', prev_week, 'WEEK');
    window.NB_blogStat['방문분석']['순방문자수'] = NB_blogStatFunc('visit/uv', prev_week, 'WEEK');
    window.NB_blogStat['방문분석']['방문횟수'] = NB_blogStatFunc('visit/visit', prev_week, 'WEEK');
    window.NB_blogStat['방문분석']['평균방문횟수'] = NB_blogStatFunc('visit/averageVisit', prev_week, 'WEEK');
    window.NB_blogStat['방문분석']['재방문율'] = NB_blogStatFunc('visit/revisit', prev_week, 'WEEK');
    window.NB_blogStat['방문분석']['평균사용시간'] = NB_blogStatFunc('visit/averageDuration', prev_week, 'WEEK');
    // 사용자분석
    window.NB_blogStat['사용자분석'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['유입분석'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['유입분석']['전체'] = NB_blogStatFunc('user/referer/total', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['유입분석']['검색'] = NB_blogStatFunc('user/referer/search', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['유입분석']['사이트'] = NB_blogStatFunc('user/referer/site', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['성별연령별분포'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['성별연령별분포']['조회수'] = NB_blogStatFunc('user/demoCv', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['성별연령별분포']['순방문자수'] = NB_blogStatFunc('user/demoUv', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['기기별분포'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['기기별분포']['모바일'] = NB_blogStatFunc('user/device/mobile', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['기기별분포']['PC'] = NB_blogStatFunc('user/device/pc', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃방문현황'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃방문현황']['조회수'] = NB_blogStatFunc('user/relationVisitCv', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃방문현황']['순방문자수'] = NB_blogStatFunc('user/relationVisitUv', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃증감수'] = NB_blogStatFunc('user/relationDelta', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃증감분석'] = NB_blogStatFuncGroup(prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃증감분석']['추가'] = NB_blogStatFunc('user/relationDemoAdd', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃증감분석']['삭제'] = NB_blogStatFunc('user/relationDemoDelete', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['이웃증감분석']['서로이웃'] = NB_blogStatFunc('user/relationDemoFriend', prev_week, 'WEEK');
    window.NB_blogStat['사용자분석']['국가별분포'] = NB_blogStatFunc('user/country', prev_week, 'WEEK');
    // 사용자분석:시간대분석
    window.NB_blogStat['사용자분석']['시간대분석'] = NB_blogStatFuncGroup(prev, 'DATE');
    window.NB_blogStat['사용자분석']['시간대분석']['조회수분포'] = NB_blogStatFunc('user/hour/cv', prev, undefined, { hour: '12' });
    window.NB_blogStat['사용자분석']['시간대분석']['조회수'] = NB_blogStatFuncGroup(prev);
    Array(24).fill(null).map((nil, idx, arr, hour) => (hour = `00${idx}`.substr(-2), window.NB_blogStat['사용자분석']['시간대분석']['조회수'][hour] =  NB_blogStatFunc('user/hour/hourCv', prev, undefined, { hour })));
    window.NB_blogStat['사용자분석']['시간대분석']['유입경로'] = NB_blogStatFuncGroup(prev);
    window.NB_blogStat['사용자분석']['시간대분석']['유입경로']['전체'] = NB_blogStatFuncGroup(prev);
    window.NB_blogStat['사용자분석']['시간대분석']['유입경로']['검색'] = NB_blogStatFuncGroup(prev);
    window.NB_blogStat['사용자분석']['시간대분석']['유입경로']['사이트'] = NB_blogStatFuncGroup(prev);
    Array(24).fill(null).map((nil, idx, arr, hour) => (hour = `00${idx}`.substr(-2), window.NB_blogStat['사용자분석']['시간대분석']['유입경로']['전체'][hour] =  NB_blogStatFunc('user/hour/referer/total', prev, undefined, { hour })));
    Array(24).fill(null).map((nil, idx, arr, hour) => (hour = `00${idx}`.substr(-2), window.NB_blogStat['사용자분석']['시간대분석']['유입경로']['검색'][hour] =  NB_blogStatFunc('user/hour/referer/search', prev, undefined, { hour })));
    Array(24).fill(null).map((nil, idx, arr, hour) => (hour = `00${idx}`.substr(-2), window.NB_blogStat['사용자분석']['시간대분석']['유입경로']['사이트'][hour] =  NB_blogStatFunc('user/hour/referer/site', prev, undefined, { hour })));
    window.NB_blogStat['사용자분석']['시간대분석']['성별연령별분포'] = NB_blogStatFuncGroup(prev);
    Array(24).fill(null).map((nil, idx, arr, hour) => (hour = `00${idx}`.substr(-2), window.NB_blogStat['사용자분석']['시간대분석']['성별연령별분포'][hour] =  NB_blogStatFunc('user/hour/demo', prev, undefined, { hour })));
    window.NB_blogStat['사용자분석']['시간대분석']['조회수순위'] = NB_blogStatFuncGroup(prev);
    Array(24).fill(null).map((nil, idx, arr, hour) => (hour = `00${idx}`.substr(-2), window.NB_blogStat['사용자분석']['시간대분석']['조회수순위'][hour] =  NB_blogStatFunc('user/hour/rankCv', prev, undefined, { hour })));
    // 순위
    window.NB_blogStat['순위'] = NB_blogStatFuncGroup(prev);
    window.NB_blogStat['순위']['조회수'] = NB_blogStatFuncGroup(prev);
    window.NB_blogStat['순위']['조회수']['게시물'] = NB_blogStatFunc('rank/cvContentPc', prev);
    window.NB_blogStat['순위']['조회수']['주제'] = NB_blogStatFunc('rank/cvSubjectPc', prev);
    window.NB_blogStat['순위']['공감수'] = NB_blogStatFunc('rank/likePc', prev);
    window.NB_blogStat['순위']['댓글수'] = NB_blogStatFunc('rank/commentPc', prev);
})(window);