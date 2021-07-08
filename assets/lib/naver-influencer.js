// ==UserScript==
// @namespace     https://tampermonkey.myso.kr/
// @exclude       *

// ==UserLibrary==
// @name          com.naver.in
// @description   네이버 인플루언서 스크립트
// @copyright     2021, myso (https://tampermonkey.myso.kr)
// @license       Apache-2.0
// @version       1.0.25

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author myso
// ==/OpenUserJS==
// ---------------------
(function(){Object.fromEntries||Object.defineProperty(Object,"fromEntries",{configurable:!0,value:function r(){var t=arguments[0];return [...t].reduce((o,[k,v])=>(o[k]=v,o), {})},writable:!0})})();
// ---------------------
(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
    });
  }
})(window);
// ---------------------
(function(window) {
  class NaverInfluencerGraphQL {
      constructor(operationName, query, defaults) {
          this.operationName = operationName;
          this.query = query;
          this.variables = Object.assign({}, defaults);
      }
      exec(variables = {}) {
          return new Promise((resolve, reject) => {
              GM_xmlhttpRequest({
                  method: 'POST', url: 'https://in.naver.com/graphql',
                  data: JSON.stringify(Object.assign({}, this, { variables: Object.assign({}, this.variables, variables) })),
                  headers: { 'Content-Type': 'application/json' },
                  onerror: reject,
                  onload(r) { resolve(JSON.parse(r.response)) }
              });
          });
      }
  }
  class NaverInfluencerAPI {
      constructor(endpoint, defaults) {
          this.endpoint = new URL(endpoint);
          this.defaults = Object.assign({}, Object.fromEntries(this.endpoint.searchParams.entries()), defaults);
      }
      exec(data) {
          const params = Object.assign({}, this.defaults, data || {});
          const endpoint = new URL(this.endpoint.toString().replace(/\:([a-z0-9\_\-]+)/ig, (a, b) => { let c = params[b] || ''; delete params[b]; return c; }));
          Object.entries(params).map(([k,v])=>endpoint.searchParams.set(k, v));
          const headers = { 'Cookie': document.cookie, 'Referer': location.href };
          return GM_xmlhttpRequestAsync(endpoint, { headers }).then(r=>JSON.parse(r.response)).catch(e=>null);
      }
  }
  class NaverInfluencer {
      constructor() {
          this.commands = {};
          // GraphQL
          this.gql('getWhitePoolKeywords', 'getWhitePoolKeywords', 'query getWhitePoolKeywords($input: WhitePoolKeywordInput!) {\n  whitePoolKeywords(input: $input) {\n    ...Keyword\n    __typename\n  }\n}\n\nfragment Keyword on Keyword {\n  categoryId\n  challengeable\n  id\n  name\n  participantCount\n  property\n  thumbnailUrl\n  __typename\n}\n');
          this.gql('getSearchIntroInfluencers', 'getSearchIntroInfluencers', 'query getSearchIntroInfluencers($input: SearchInfluencerInput!, $paging: PagingInput!) {\n  searchIntroInfluencers(input: $input, paging: $paging) {\n    items {\n      keywords\n      space {\n        ...SimpleSpace\n        __typename\n      }\n      viewCount\n      __typename\n    }\n    paging {\n      nextCursor\n      total\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SimpleSpace on SimpleSpace {\n  id\n  lastChallengedAt\n  lastContentsCreatedAt\n  lastPostCreatedAt\n  myKeyword\n  myKeywordId\n  nickname\n  ownerId\n  penalty\n  profileImageUrl\n  showTotalFollowerCount\n  style {\n    backgroundUrl\n    paletteCode\n    paletteType\n    template\n    __typename\n  }\n  subscriberCount\n  totalFollowerCount\n  urlId\n  __typename\n}\n');
          this.gql('getRecommendKeywords', 'getRecommendKeywords', 'query getRecommendKeywords($input: RecommendKeywordInput!) {\n  recommendKeywords(input: $input) {\n    RECOMMEND_CHALLENGE {\n      ...ChallengeSectionWithRecommendContents\n      __typename\n    }\n    SC {\n      ...ChallengeSection\n      __typename\n    }\n    PARTICIPANT_COUNT {\n      ...ChallengeSection\n      __typename\n    }\n    BLUE_OCEAN {\n      ...ChallengeSection\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment ChallengeSectionWithRecommendContents on ChallengeSection {\n  id\n  items {\n    ...ChallengeKeywordWithRecommendContents\n    __typename\n  }\n  __typename\n}\n\nfragment ChallengeKeywordWithRecommendContents on ChallengeKeyword {\n  categoryId\n  challengeable\n  challengeableContentCount\n  challengedKeyword\n  id\n  name\n  participantCount\n  property\n  sc\n  thumbnailUrl\n  recommendKeywordContents {\n    ...Meta\n    __typename\n  }\n  __typename\n}\n\nfragment Meta on Meta {\n  id\n  originId\n  url\n  mobileUrl\n  type\n  title\n  gifUrl\n  playTime\n  createdAt\n  viewCount\n  likeCount\n  mediaCount\n  description\n  thumbnailUrl\n  serviceType\n  twitterScreenName\n  authorName\n  authorProfileImageUrl\n  videoId\n  inKey\n  parentTweetAuthorName\n  parentTweetAuthorProfileImageUrl\n  parentTweetCreatedAt\n  parentTweetDescription\n  parentTweetThumbnailUrl\n  parentTweetTwitterScreenName\n  parentTweetUrl\n  urlLinkMap\n  clickCodeKey\n  salePrice\n  discountedSalePrice\n  discountedRatio\n  mobileDiscountedSalePrice\n  mobileDiscountedRatio\n  isNew\n  isBest\n  contentType\n  serviceId\n  __typename\n}\n\nfragment ChallengeSection on ChallengeSection {\n  id\n  items {\n    ...ChallengeKeyword\n    __typename\n  }\n  __typename\n}\n\nfragment ChallengeKeyword on ChallengeKeyword {\n  categoryId\n  challengeable\n  challengeableContentCount\n  challengedKeyword\n  id\n  name\n  participantCount\n  property\n  sc\n  thumbnailUrl\n  __typename\n}\n');
          this.gql('getSearchableChallenges', 'getSearchableChallenges', 'query getSearchableChallenges($input: SearchableChallengesInput!) {\n  searchableChallenges(input: $input) {\n    ...ChallengeContent\n    __typename\n  }\n}\n\nfragment ChallengeContent on ChallengeContent {\n  id\n  challengeId\n  originId\n  url\n  mobileUrl\n  type\n  title\n  gifUrl\n  playTime\n  createdAt\n  viewCount\n  likeCount\n  mediaCount\n  description\n  thumbnailUrl\n  serviceType\n  twitterScreenName\n  authorName\n  authorProfileImageUrl\n  videoId\n  inKey\n  parentTweetAuthorName\n  parentTweetAuthorProfileImageUrl\n  parentTweetCreatedAt\n  parentTweetDescription\n  parentTweetThumbnailUrl\n  parentTweetTwitterScreenName\n  parentTweetUrl\n  isRetweetComment\n  urlLinkMap\n  thumbnails\n  clickCodeKey\n  salePrice\n  discountedSalePrice\n  discountedRatio\n  mobileDiscountedSalePrice\n  mobileDiscountedRatio\n  isNew\n  isBest\n  contentType\n  serviceId\n  participated\n  participatedAnotherKeyword\n  dimmed\n  __typename\n}\n');
          this.gql('getChallengeContents', 'getChallengeContents', 'query getChallengeContents($input: ChallengeContentsInput!, $paging: PagingInput!) {\n  challengeContents(input: $input, paging: $paging) {\n    items {\n      ...ChallengeContent\n      __typename\n    }\n    paging {\n      nextCursor\n      total\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment ChallengeContent on ChallengeContent {\n  id\n  challengeId\n  originId\n  url\n  mobileUrl\n  type\n  title\n  gifUrl\n  playTime\n  createdAt\n  viewCount\n  likeCount\n  mediaCount\n  description\n  thumbnailUrl\n  serviceType\n  twitterScreenName\n  authorName\n  authorProfileImageUrl\n  videoId\n  inKey\n  parentTweetAuthorName\n  parentTweetAuthorProfileImageUrl\n  parentTweetCreatedAt\n  parentTweetDescription\n  parentTweetThumbnailUrl\n  parentTweetTwitterScreenName\n  parentTweetUrl\n  isRetweetComment\n  urlLinkMap\n  thumbnails\n  clickCodeKey\n  salePrice\n  discountedSalePrice\n  discountedRatio\n  mobileDiscountedSalePrice\n  mobileDiscountedRatio\n  isNew\n  isBest\n  contentType\n  serviceId\n  participated\n  participatedAnotherKeyword\n  dimmed\n  __typename\n}\n');
          this.gql('getParticipatedKeywords', 'getParticipatedKeywords', 'query getParticipatedKeywords($input: ParticipatedKeywordsInput!, $paging: PagingInput!) {\n  participatedKeywords(input: $input, paging: $paging) {\n    items {\n      ...ParticipatedKeywordViewWithChallenges\n      __typename\n    }\n    paging {\n      nextCursor\n      total\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment ParticipatedKeywordViewWithChallenges on ParticipatedKeywordView {\n  ...ParticipatedKeywordView\n  ownerId\n  contents {\n    ...ChallengeContent\n    __typename\n  }\n  __typename\n}\n\nfragment ParticipatedKeywordView on ParticipatedKeywordView {\n  categoryId\n  id\n  lastChallengedAt\n  name\n  rank\n  viewCount\n  challengeCount\n  __typename\n}\n\nfragment ChallengeContent on ChallengeContent {\n  id\n  challengeId\n  originId\n  url\n  mobileUrl\n  type\n  title\n  gifUrl\n  playTime\n  createdAt\n  viewCount\n  likeCount\n  mediaCount\n  description\n  thumbnailUrl\n  serviceType\n  twitterScreenName\n  authorName\n  authorProfileImageUrl\n  videoId\n  inKey\n  parentTweetAuthorName\n  parentTweetAuthorProfileImageUrl\n  parentTweetCreatedAt\n  parentTweetDescription\n  parentTweetThumbnailUrl\n  parentTweetTwitterScreenName\n  parentTweetUrl\n  isRetweetComment\n  urlLinkMap\n  thumbnails\n  clickCodeKey\n  salePrice\n  discountedSalePrice\n  discountedRatio\n  mobileDiscountedSalePrice\n  mobileDiscountedRatio\n  isNew\n  isBest\n  contentType\n  serviceId\n  participated\n  participatedAnotherKeyword\n  dimmed\n  __typename\n}\n');
          this.gql('getSearchParticipatedKeywords', 'getSearchParticipatedKeywords', 'query getSearchParticipatedKeywords($input: ParticipatedKeywordsInput!, $paging: PagingInput!) {\n  searchParticipatedKeywords(input: $input, paging: $paging) {\n    items {\n      ...ParticipatedKeywordViewWithChallenges\n      __typename\n    }\n    paging {\n      nextCursor\n      total\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment ParticipatedKeywordViewWithChallenges on ParticipatedKeywordView {\n  ...ParticipatedKeywordView\n  ownerId\n  contents {\n    ...ChallengeContent\n    __typename\n  }\n  __typename\n}\n\nfragment ParticipatedKeywordView on ParticipatedKeywordView {\n  categoryId\n  id\n  lastChallengedAt\n  name\n  rank\n  viewCount\n  challengeCount\n  __typename\n}\n\nfragment ChallengeContent on ChallengeContent {\n  id\n  challengeId\n  originId\n  url\n  mobileUrl\n  type\n  title\n  gifUrl\n  playTime\n  createdAt\n  viewCount\n  likeCount\n  mediaCount\n  description\n  thumbnailUrl\n  serviceType\n  twitterScreenName\n  authorName\n  authorProfileImageUrl\n  videoId\n  inKey\n  parentTweetAuthorName\n  parentTweetAuthorProfileImageUrl\n  parentTweetCreatedAt\n  parentTweetDescription\n  parentTweetThumbnailUrl\n  parentTweetTwitterScreenName\n  parentTweetUrl\n  isRetweetComment\n  urlLinkMap\n  thumbnails\n  clickCodeKey\n  salePrice\n  discountedSalePrice\n  discountedRatio\n  mobileDiscountedSalePrice\n  mobileDiscountedRatio\n  isNew\n  isBest\n  contentType\n  serviceId\n  participated\n  participatedAnotherKeyword\n  dimmed\n  __typename\n}\n');
          this.gql('getSearchCategoryKeywords', 'getSearchCategoryKeywords', 'query getSearchCategoryKeywords($input: SearchKeywordInput!, $paging: PagingInput!) {\n  searchCategoryKeywords(input: $input, paging: $paging) {\n    items {\n      ... on Keyword {\n        categoryId\n        challengeable\n        id\n        name\n        participantCount\n        thumbnailUrl\n        challengedKeyword\n        __typename\n      }\n      __typename\n    }\n    paging {\n      nextCursor\n      total\n      __typename\n    }\n    __typename\n  }\n}\n');
          this.gql('getBoards', 'getBoards', 'query getBoards($input: BoardsGetInput!, $paging: PagingInput) {\n  boards(input: $input, paging: $paging) {\n    items {\n      ...BoardItem\n      __typename\n    }\n    paging {\n      nextCursor\n      total\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment BoardItem on Board {\n  id\n  notice\n  createdAt\n  text\n  imageUrl\n  commentCount\n  oglink {\n    align\n    description\n    domain\n    id\n    layout\n    link\n    title\n    video\n    thumbnail {\n      width\n      height\n      src\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n');
          this.gql('getBoard', 'getBoard', 'query getBoard($input: BoardGetInput!) {\n  board(input: $input) {\n    ...BoardDetail\n    __typename\n  }\n}\n\nfragment BoardDetail on Board {\n  authorId\n  block\n  commentCount\n  createdAt\n  document\n  html\n  id\n  imageUrl\n  nickName\n  notice\n  notification\n  penaltyAt\n  penaltyPolicy\n  spaceId\n  text\n  __typename\n}\n');
          this.gql('getParticipatedKeywordsByContent', 'getParticipatedKeywordsByContent', 'query getParticipatedKeywordsByContent($input: ParticipatedKeywordsByContentInput!) {\n  participatedKeywordsByContent(input: $input) {\n    ...ParticipatedKeywordView\n    __typename\n  }\n}\n\nfragment ParticipatedKeywordView on ParticipatedKeywordView {\n  categoryId\n  id\n  lastChallengedAt\n  name\n  rank\n  viewCount\n  challengeCount\n  __typename\n}\n');
          // API
          this.api('getSpaceStatistics', 'https://gw.in.naver.com/delivery/api/v1/space-statistics');
          this.api('getSpaceSubscribes', 'https://gw.in.naver.com/delivery/api/v1/subscribes');
          this.api('getSpaceByUrl', 'https://gw.in.naver.com/home/api/v1/space-by-url-id');
          this.api('getSpace', 'https://gw.in.naver.com/home/api/v1/spaces/:spaceId');
          this.api('getSuggestedSpaces', 'https://gw.in.naver.com/home/api/v1/suggested-influencers?limit=30');
          this.api('getMyKeyword', 'https://gw.in.naver.com/home/api/v1/my-keywords');
          this.api('getAdMediation', 'https://gw.in.naver.com/home/api/v1/ad-mediation');
          this.api('getCategories', 'https://gw.in.naver.com/keyword-challenge/api/v1/category-groups');
          this.api('getKeyword', 'https://gw.in.naver.com/keyword-challenge/api/v1/keywords/:keywordId');
          this.api('getSuggestedKeywords', 'https://gw.in.naver.com/keyword-challenge/api/v1/suggested-keywords?limit=30');
          this.api('getRecommendKeywords', 'https://gw.in.naver.com/keyword-challenge/api/v1/recommend-keywords?limit=6');
          this.api('getIdentityAccess', 'https://gw.in.naver.com/identity-access/api/v1/accounts/151890478729280/roles')
          //this.api('getParticipatedKeywords', 'https://gw.in.naver.com/keyword-challenge/api/v2/participated-keywords?sort=LAST_UPDATE&limit=20&cursor=');
          this.api('getContent', 'https://gw.in.naver.com/home/api/v1/spaces/:spaceId/contents/:contentId');
          this.api('getComponentContent', 'https://gw.in.naver.com/home/home-builder/api/v1/spaces/:spaceId/components/:componentId/contents/:contentId');
          this.api('getChallengeContent', 'https://gw.in.naver.com/keyword-challenge/api/v1/challenges/:challengeId/contents/:contentId');
      }
      gql(name, operationName, query, defaults) { return this.commands[name] = new NaverInfluencerGraphQL(operationName, query, defaults); }
      api(name, endpoint, defaults) { return this.commands[name] = new NaverInfluencerAPI(endpoint, defaults || {}); }
      exec(name, data) {
          const command = this.commands[name]; if(!command) throw new Error('has not command');
          return command.exec(data);
      }
  }
  window.NaverInfluencer = new NaverInfluencer();
})(window);