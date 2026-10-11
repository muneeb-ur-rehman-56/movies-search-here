/* Adsterra ads - all ad codes live in this one file.
   Banner units use document.write, so ads.js must load in <head> before the pages calls adBanner(). */
(function () {
  var HOST = 'https://bancadeltempoidea.org/22/';
  var UNITS = {
    '300x250': ['7194b9f266f4ab743351cb3368ebae55', 300, 250],
    '468x60':  ['5016a91e929d2cace0ab2cfd4f496f53', 468, 60],
    '160x300': ['e8fd867974b31598403409728b74bc05', 160, 300],
    '160x600': ['1d80833ea78de22d4fc7e9098c26f37a', 160, 600],
    '320x50':  ['7bba92a9e4f78cf24d6dacb79482d030', 320, 50],
    '728x90':  ['97465e58f5b077becf7fe56e2bab3359', 728, 90]
  };

  // Smartlink (Smartlink_1) - used for the "Sponsored" links
  window.ADS_SMARTLINK = 'https://directyp.org/4/3801ddb201341d0ad241925664bb0ab1';

  // Writes one banner where the call is placed, only when the screen width is between min and max.
  // This avoids loading (and hiding) banners that do not fit the visitor's screen.
  window.adBanner = function (size, min, max) {
    var w = window.innerWidth;
    if (w < (min || 0) || w >= (max || 99999)) return;
    var u = UNITS[size];
    document.write(
      '<div class="ad-box"><span class="ad-label">Advertisement</span>' +
      '<div style="width:' + u[1] + 'px;max-width:100%;min-height:' + u[2] + 'px">' +
      '<scr' + 'ipt>atOptions={"key":"' + u[0] + '","format":"iframe","height":' + u[2] + ',"width":' + u[1] + ',"params":{}};</scr' + 'ipt>' +
      '<scr' + 'ipt src="' + HOST + u[0] + '"></scr' + 'ipt></div></div>'
    );
  };
})();
