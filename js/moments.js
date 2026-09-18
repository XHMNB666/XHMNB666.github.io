/* ===================================================
   说说 / 碎碎念
   放到 source/js/moments.js
   =================================================== */

(function () {
  'use strict';

  // ============ 数据 ============
  // 直接在这里维护，一条一个对象
  const MOMENTS = [
    {
      date: '2026-09-18 11:00',
      content: '把博客重新捡起来了。停了两年多，这次想换个心态——写给自己看。',
      images: [],
      mood: '平静',
      location: '家里'
    },
    {
      date: '2026-09-17 22:30',
      content: '折腾了一晚上 Magisk 模块，终于把 LSPosed 作用域理清楚了。十二个模块，开机慢 8 秒，值。',
      images: [],
      mood: '满足',
      location: '书桌前'
    },
    {
      date: '2026-09-16 15:20',
      content: 'Termux 终于跑通了，手机上写脚本的感觉很奇妙。',
      images: [],
      mood: '兴奋',
      location: '咖啡馆'
    }
  ];

  // ================================

  function fmtTime(str) {
    const d = new Date(str.replace(/-/g, '/'));
    if (isNaN(d)) return str;
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return y === now.getFullYear()
      ? `${m}-${day} ${hh}:${mm}`
      : `${y}-${m}-${day} ${hh}:${mm}`;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function renderItem(item, index) {
    const li = document.createElement('div');
    li.className = 'hx-moment';
    li.style.animationDelay = index * 0.06 + 's';

    const imgs = (item.images || [])
      .map(
        (url, i) =>
          `<div class="hx-moment-img" data-src="${esc(url)}" data-idx="${i}">
             <img loading="lazy" src="${esc(url)}" alt="">
           </div>`
      )
      .join('');

    const meta = [];
    if (item.mood) meta.push(`<span class="hx-meta-item">😊 ${esc(item.mood)}</span>`);
    if (item.location) meta.push(`<span class="hx-meta-item">📍 ${esc(item.location)}</span>`);

    li.innerHTML = `
      <div class="hx-moment-dot"></div>
      <div class="hx-moment-card">
        <div class="hx-moment-time">${fmtTime(item.date)}</div>
        <div class="hx-moment-content">${esc(item.content).replace(/\n/g, '<br>')}</div>
        ${imgs ? `<div class="hx-moment-imgs">${imgs}</div>` : ''}
        ${meta.length ? `<div class="hx-moment-meta">${meta.join('')}</div>` : ''}
      </div>
    `;

    // 图片点击放大
    li.querySelectorAll('.hx-moment-img').forEach((box) => {
      box.addEventListener('click', () => {
        const src = box.getAttribute('data-src');
        openViewer(src, item.images || [], parseInt(box.getAttribute('data-idx'), 10));
      });
    });

    return li;
  }

  /* ============ 图片查看器 ============ */
  let viewerList = [];
  let viewerIdx = 0;

  function openViewer(_, list, idx) {
    viewerList = list;
    viewerIdx = idx;

    let v = document.getElementById('hx-viewer');
    if (!v) {
      v = document.createElement('div');
      v.id = 'hx-viewer';
      v.innerHTML = `
        <div class="hx-v-mask"></div>
        <img class="hx-v-img" alt="">
        <div class="hx-v-close"><i class="fas fa-times"></i></div>
      `;
      document.body.appendChild(v);
      v.querySelector('.hx-v-mask').addEventListener('click', closeViewer);
      v.querySelector('.hx-v-close').addEventListener('click', closeViewer);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && v.classList.contains('show')) closeViewer();
      });
    }

    v.querySelector('.hx-v-img').src = viewerList[viewerIdx];
    requestAnimationFrame(() => v.classList.add('show'));
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    const v = document.getElementById('hx-viewer');
    if (!v) return;
    v.classList.remove('show');
    document.body.style.overflow = '';
  }

  /* ============ 初始化 ============ */
  function init() {
    const wrap = document.getElementById('hx-moments');
    if (!wrap) return;

    if (!MOMENTS.length) {
      wrap.innerHTML = '<div class="hx-moments-empty">还没有说说</div>';
      return;
    }

    // 按时间倒序
    const sorted = MOMENTS.slice().sort(
      (a, b) => new Date(b.date.replace(/-/g, '/')) - new Date(a.date.replace(/-/g, '/'))
    );

    sorted.forEach((item, i) => wrap.appendChild(renderItem(item, i)));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
