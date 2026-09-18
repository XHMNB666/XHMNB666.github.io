/* ===================================================
   心痕の博客 · 音乐播放器
   双歌单切换 + Meting 多镜像回退 + APlayer 就绪等待
   放到 source/js/player.js
   =================================================== */

(function () {
  'use strict';

  var PLAYLISTS = [
    { name: 'Jay ok心痕', id: '17860954244' },
    { name: '单曲循环',   id: '14060893995' }
  ];

  var CONFIG = {
    server: 'netease',
    type: 'playlist',
    autoplay: false,
    theme: '#49b1f5',
    lrc: true,
    volume: 0.7,
    mirrors: [
      'https://api.injahow.cn/meting/',
      'https://api.i-meto.com/meting/api',
      'https://meting.imetyou.top/api',
      'https://meting.qjqq.cn/'
    ]
  };

  var APLAYER_CSS = 'https://cdn.staticfile.org/aplayer/1.10.1/APlayer.min.css';
  var APLAYER_JS = 'https://cdn.staticfile.org/aplayer/1.10.1/APlayer.min.js';

  var current = 0;
  var ap = null;

  function loadCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function loadJS(src) {
    if (document.querySelector('script[src="' + src + '"]')) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  /* 等待 window.APlayer 真正可用，避免脚本仍在加载时初始化失败 */
  function ensureAPlayer() {
    return new Promise(function (resolve, reject) {
      if (window.APlayer) return resolve();
      var tries = 0;
      var timer = setInterval(function () {
        if (window.APlayer) {
          clearInterval(timer);
          resolve();
        } else if (++tries > 120) {
          clearInterval(timer);
          reject(new Error('APlayer 等待超时'));
        }
      }, 100);
    });
  }

  /* 依次尝试镜像，取第一个有内容的歌单 */
  function fetchPlaylist(pl, cb) {
    var i = 0;
    function next() {
      if (i >= CONFIG.mirrors.length) {
        console.warn('[player] 所有 Meting 镜像均不可用:', pl.name);
        cb(null);
        return;
      }
      var base = CONFIG.mirrors[i++];
      var sep = base.indexOf('?') >= 0 ? '&' : '?';
      var url = base + sep + 'server=' + CONFIG.server +
                '&type=' + CONFIG.type + '&id=' + pl.id;

      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;

      fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
        .then(function (r) { return r.json(); })
        .then(function (list) {
          if (timer) clearTimeout(timer);
          if (Array.isArray(list) && list.length) cb(list);
          else next();
        })
        .catch(function () {
          if (timer) clearTimeout(timer);
          next();
        });
    }
    next();
  }

  function toAudios(list) {
    return list.map(function (s) {
      return {
        name: s.name || '未知歌曲',
        artist: s.artist || '未知歌手',
        url: s.url,
        cover: s.pic || s.cover || '',
        lrc: s.lrc || '',
        theme: CONFIG.theme
      };
    });
  }

  function loadList() {
    if (!ap) return;
    var pl = PLAYLISTS[current];
    ap.list.clear();
    ap.list.add([{
      name: '加载中...', artist: pl.name,
      url: '', cover: '', lrc: '', theme: CONFIG.theme
    }]);

    fetchPlaylist(pl, function (list) {
      if (!ap) return;
      if (!list) {
        ap.list.clear();
        ap.list.add([{
          name: '歌单暂时拉不到', artist: pl.name,
          url: '', cover: '', lrc: '', theme: CONFIG.theme
        }]);
        return;
      }
      ap.list.clear();
      ap.list.add(toAudios(list));
      ap.list.switch(0);
    });
  }

  function buildSwitcher(wrap) {
    var bar = document.createElement('div');
    bar.id = 'hx-pl-switch';
    PLAYLISTS.forEach(function (pl, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = pl.name;
      if (idx === current) b.className = 'active';
      b.addEventListener('click', function () {
        if (idx === current) return;
        current = idx;
        var all = bar.querySelectorAll('button');
        for (var k = 0; k < all.length; k++) all[k].classList.remove('active');
        b.classList.add('active');
        loadList();
      });
      bar.appendChild(b);
    });
    wrap.appendChild(bar);
  }

  function initPlayer() {
    if (document.getElementById('hx-aplayer')) return;
    if (!window.APlayer) return;

    var wrap = document.createElement('div');
    wrap.id = 'hx-aplayer';
    document.body.appendChild(wrap);

    buildSwitcher(wrap);

    var box = document.createElement('div');
    wrap.appendChild(box);

    ap = new APlayer({
      container: box,
      fixed: false,
      mini: false,
      autoplay: CONFIG.autoplay,
      theme: CONFIG.theme,
      loop: 'all',
      order: 'list',
      preload: 'none',
      volume: CONFIG.volume,
      mutex: true,
      listFolded: true,
      listMaxHeight: '240px',
      lrcType: CONFIG.lrc ? 3 : 0,
      audio: [{
        name: '加载中...', artist: PLAYLISTS[current].name,
        url: '', cover: '', lrc: '', theme: CONFIG.theme
      }]
    });

    loadList();

    if (window.innerWidth < 768) wrap.classList.add('aplayer-narrow');

    window.ap = ap;
  }

  function boot() {
    loadCSS(APLAYER_CSS);
    loadJS(APLAYER_JS)
      .then(ensureAPlayer)
      .then(initPlayer)
      .catch(function (e) {
        console.warn('[player] 初始化失败：', e && e.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
