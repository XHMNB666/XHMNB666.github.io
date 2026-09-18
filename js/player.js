/* ===================================================
   心痕の博客 · MD3 音乐播放器
   Material Design 3 风格 · 纯静态 · 多歌单 · 多镜像回退
   无 APlayer 依赖，仅用原生 Audio + fetch
   =================================================== */

(function () {
  'use strict';

  var PLAYLISTS = [
    { name: 'QQ歌单', id: '9160070320', server: 'tencent' },
    { name: '网易歌单', id: '14060893995', server: 'netease' }
  ];

  var MIRRORS = [
    'https://api.injahow.cn/meting/',
    'https://meting.qjqq.cn/',
    'https://api.i-meto.com/meting/api',
    'https://meting.imetyou.top/api'
  ];

  var listIdx = 0;
  var songs = [];
  var songIdx = -1;
  var audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = 0.7;

  var E = {};

  /* ---------- 图标（Material Symbols 路径） ---------- */
  var ICONS = {
    play:  'M8 5v14l11-7z',
    pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    prev:  'M6 6h2v12H6zm3.5 6l8.5 6V6z',
    next:  'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
    up:    'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
    down:  'M12 16l6-6-1.41-1.41L12 13.17l-4.59-4.58L6 10z',
    list:  'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
    swap:  'M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z'
  };

  function ic(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" aria-hidden="true"><path fill="currentColor" d="' + ICONS[name] + '"/></svg>';
  }

  /* ---------- 工具 ---------- */
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* 兼容不同镜像的字段命名：name/title、artist/author */
  function pickName(s) {
    return s.name || s.title || '未知歌曲';
  }
  function pickArtist(s) {
    return s.artist || s.author || '未知歌手';
  }

  function fetchList(pl, cb) {
    var i = 0;
    function go() {
      if (i >= MIRRORS.length) { cb(null); return; }
      var base = MIRRORS[i++];
      var sep = base.indexOf('?') >= 0 ? '&' : '?';
      var url = base + sep + 'server=' + (pl.server || 'netease') +
                '&type=playlist&id=' + pl.id;
      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var tid = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
      fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
        .then(function (r) { return r.json(); })
        .then(function (arr) {
          if (tid) clearTimeout(tid);
          if (Array.isArray(arr) && arr.length) cb(arr); else go();
        })
        .catch(function () {
          if (tid) clearTimeout(tid);
          go();
        });
    }
    go();
  }

  /* ---------- 构建 DOM ---------- */
  function build() {
    var root = document.createElement('div');
    root.id = 'hx-md3';
    root.innerHTML = [
      '<div class="md3-pill" role="button" tabindex="0">',
      '  <div class="md3-pill-cover"><img alt=""></div>',
      '  <div class="md3-pill-meta">',
      '    <div class="md3-pill-title">尚未加载</div>',
      '    <div class="md3-pill-artist">点此展开</div>',
      '  </div>',
      '  <button class="md3-iconbtn md3-pill-toggle" aria-label="播放"></button>',
      '  <button class="md3-iconbtn md3-pill-open" aria-label="展开"></button>',
      '</div>',
      '<div class="md3-sheet" role="dialog" aria-hidden="true">',
      '  <div class="md3-sheet-head">',
      '    <span class="md3-sheet-label">正在播放</span>',
      '    <button class="md3-iconbtn md3-sheet-close" aria-label="收起"></button>',
      '  </div>',
      '  <div class="md3-art"><img alt=""></div>',
      '  <div class="md3-title">—</div>',
      '  <div class="md3-artist">—</div>',
      '  <div class="md3-progress">',
      '    <span class="md3-t md3-t-cur">0:00</span>',
      '    <div class="md3-track"><div class="md3-fill"></div></div>',
      '    <span class="md3-t md3-t-total">0:00</span>',
      '  </div>',
      '  <div class="md3-controls">',
      '    <button class="md3-iconbtn md3-swap" aria-label="切换歌单"></button>',
      '    <button class="md3-iconbtn md3-prev" aria-label="上一首"></button>',
      '    <button class="md3-fab md3-play" aria-label="播放"></button>',
      '    <button class="md3-iconbtn md3-next" aria-label="下一首"></button>',
      '    <button class="md3-iconbtn md3-list-btn" aria-label="列表"></button>',
      '  </div>',
      '  <div class="md3-list"><ol></ol></div>',
      '</div>'
    ].join('');
    document.body.appendChild(root);
    return root;
  }

  function cache(root) {
    E.root = root;
    E.pill = root.querySelector('.md3-pill');
    E.pillCover = root.querySelector('.md3-pill-cover img');
    E.pillTitle = root.querySelector('.md3-pill-title');
    E.pillArtist = root.querySelector('.md3-pill-artist');
    E.pillToggle = root.querySelector('.md3-pill-toggle');
    E.pillOpen = root.querySelector('.md3-pill-open');
    E.sheet = root.querySelector('.md3-sheet');
    E.sheetClose = root.querySelector('.md3-sheet-close');
    E.art = root.querySelector('.md3-art img');
    E.title = root.querySelector('.md3-title');
    E.artist = root.querySelector('.md3-artist');
    E.tCur = root.querySelector('.md3-t-cur');
    E.tTotal = root.querySelector('.md3-t-total');
    E.track = root.querySelector('.md3-track');
    E.fill = root.querySelector('.md3-fill');
    E.swap = root.querySelector('.md3-swap');
    E.prev = root.querySelector('.md3-prev');
    E.play = root.querySelector('.md3-play');
    E.next = root.querySelector('.md3-next');
    E.listBtn = root.querySelector('.md3-list-btn');
    E.list = root.querySelector('.md3-list');
    E.ol = root.querySelector('.md3-list ol');

    E.pillToggle.innerHTML = ic('play', 22);
    E.pillOpen.innerHTML = ic('up', 20);
    E.sheetClose.innerHTML = ic('down', 22);
    E.swap.innerHTML = ic('swap', 20);
    E.prev.innerHTML = ic('prev', 26);
    E.play.innerHTML = ic('play', 30);
    E.next.innerHTML = ic('next', 26);
    E.listBtn.innerHTML = ic('list', 20);
  }

  /* ---------- 绘制 ---------- */
  function paint() {
    var s = songs[songIdx];
    if (!s) return;
    var name = pickName(s);
    var artist = pickArtist(s);
    E.title.textContent = name;
    E.artist.textContent = artist;
    E.pillTitle.textContent = name;
    E.pillArtist.textContent = artist;
    if (s.pic) { E.art.src = s.pic; E.pillCover.src = s.pic; }
  }

  function paintList() {
    E.ol.innerHTML = '';
    songs.forEach(function (s, i) {
      var li = document.createElement('li');
      li.className = (i === songIdx ? 'active' : '');
      li.innerHTML = '<span class="md3-li-idx">' + (i + 1) + '</span>' +
                     '<span class="md3-li-name">' + pickName(s) + '</span>' +
                     '<span class="md3-li-artist">' + pickArtist(s) + '</span>';
      li.addEventListener('click', function () { load(i, true); });
      E.ol.appendChild(li);
    });
  }

  function paintPlayIcon() {
    var playing = !audio.paused && !audio.ended && !!audio.src;
    E.play.innerHTML = ic(playing ? 'pause' : 'play', 30);
    E.pillToggle.innerHTML = ic(playing ? 'pause' : 'play', 22);
  }

  /* ---------- 播放控制 ---------- */
  function load(i, autoplay) {
    if (i < 0 || i >= songs.length) return;
    songIdx = i;
    audio.src = songs[i].url;
    paint();
    paintList();
    if (autoplay) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    }
    paintPlayIcon();
  }

  function toggle() {
    if (!audio.src) { if (songs.length) load(0, true); return; }
    if (audio.paused) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      audio.pause();
    }
  }

  function step(d) {
    if (!songs.length) return;
    var n = songIdx + d;
    if (n < 0) n = songs.length - 1;
    if (n >= songs.length) n = 0;
    load(n, true);
  }

  function switchList() {
    listIdx = (listIdx + 1) % PLAYLISTS.length;
    E.swap.classList.add('spin');
    setTimeout(function () { E.swap.classList.remove('spin'); }, 600);
    loadList();
  }

  function loadList() {
    var pl = PLAYLISTS[listIdx];
    E.pillTitle.textContent = '加载中…';
    E.pillArtist.textContent = pl.name;
    E.title.textContent = '加载中…';
    E.artist.textContent = pl.name;
    E.ol.innerHTML = '';
    fetchList(pl, function (arr) {
      if (!arr) {
        E.title.textContent = '歌单暂时拉不到';
        E.artist.textContent = pl.name;
        E.pillTitle.textContent = '歌单暂时拉不到';
        E.pillArtist.textContent = pl.name;
        songs = [];
        return;
      }
      songs = arr.map(function (s) {
        return {
          name: pickName(s),
          artist: pickArtist(s),
          url: s.url,
          pic: s.pic || s.cover || ''
        };
      });
      paintList();
      load(0, false);
    });
  }

  function setExpanded(on) {
    E.root.classList.toggle('expanded', on);
    E.sheet.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  /* ---------- 事件 ---------- */
  function bindAudio() {
    audio.addEventListener('timeupdate', function () {
      var d = audio.duration || 0, c = audio.currentTime || 0;
      E.tCur.textContent = fmt(c);
      E.tTotal.textContent = fmt(d);
      E.fill.style.width = (d ? (c / d) * 100 : 0) + '%';
    });
    audio.addEventListener('loadedmetadata', function () {
      E.tTotal.textContent = fmt(audio.duration);
    });
    audio.addEventListener('play', paintPlayIcon);
    audio.addEventListener('pause', paintPlayIcon);
    audio.addEventListener('ended', function () { step(1); });
    audio.addEventListener('error', function () {
      if (songIdx >= 0 && songIdx < songs.length - 1) step(1);
    });
  }

  function bindTrack() {
    E.track.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var r = E.track.getBoundingClientRect();
      var pct = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      audio.currentTime = pct * audio.duration;
    });
  }

  function bindUI() {
    E.play.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    E.pillToggle.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    E.prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    E.next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    E.swap.addEventListener('click', function (e) { e.stopPropagation(); switchList(); });
    E.listBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      E.sheet.classList.toggle('show-list');
    });
    E.pill.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      setExpanded(true);
    });
    E.pillOpen.addEventListener('click', function (e) {
      e.stopPropagation(); setExpanded(true);
    });
    E.sheetClose.addEventListener('click', function () { setExpanded(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setExpanded(false);
    });
    if (window.innerWidth < 768) E.root.classList.add('mobile');
  }

  function boot() {
    if (document.getElementById('hx-md3')) return;
    var root = build();
    cache(root);
    bindAudio();
    bindTrack();
    bindUI();
    loadList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
