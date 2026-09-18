/* ===================================================
   相册页脚本
   放到 source/js/gallery.js
   在 _config.butterfly.yml 的 inject.bottom 引入
   =================================================== */

(function () {
  'use strict';

  // 数据来源：由 Hexo 在页面里注入 window.HX_GALLERY
  function getData() {
    if (window.HX_GALLERY && Array.isArray(window.HX_GALLERY)) {
      return window.HX_GALLERY;
    }
    return [];
  }

  /* ============ 渲染标签栏 ============ */
  function renderTabs(groups, activeIndex, onSwitch) {
    const tabs = document.getElementById('hx-tabs');
    if (!tabs) return;
    tabs.innerHTML = '';

    groups.forEach((g, i) => {
      const btn = document.createElement('button');
      btn.className = 'hx-tab' + (i === activeIndex ? ' active' : '');
      btn.textContent = g.name || `分组 ${i + 1}`;
      btn.addEventListener('click', () => onSwitch(i));
      tabs.appendChild(btn);
    });
  }

  /* ============ 渲染图片网格 ============ */
  function renderGrid(group) {
    const grid = document.getElementById('hx-grid');
    if (!grid) return;

    const photos = (group && group.photos) || [];
    if (!photos.length) {
      grid.innerHTML = '<div class="hx-gallery-empty">这个分组还没有照片</div>';
      return;
    }

    grid.innerHTML = '';
    photos.forEach((url, i) => {
      const item = document.createElement('div');
      item.className = 'hx-photo';
      item.style.animationDelay = i * 0.04 + 's';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = url;
      img.alt = group.name + ' - ' + (i + 1);

      img.addEventListener('load', () => item.classList.add('loaded'));
      img.addEventListener('error', () => {
        item.classList.add('error');
        img.src =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23aaa" font-size="16">图片加载失败</text></svg>';
      });

      item.appendChild(img);
      item.addEventListener('click', () => openLightbox(photos, i));
      grid.appendChild(item);
    });
  }

  /* ============ 灯箱 ============ */
  let lbIndex = 0;
  let lbList = [];

  function openLightbox(list, index) {
    lbList = list;
    lbIndex = index;

    let box = document.getElementById('hx-lightbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hx-lightbox';
      box.innerHTML = `
        <div class="hx-lb-mask"></div>
        <div class="hx-lb-close"><i class="fas fa-times"></i></div>
        <div class="hx-lb-prev"><i class="fas fa-chevron-left"></i></div>
        <div class="hx-lb-next"><i class="fas fa-chevron-right"></i></div>
        <div class="hx-lb-body"><img class="hx-lb-img" alt=""></div>
        <div class="hx-lb-counter"></div>
      `;
      document.body.appendChild(box);

      box.querySelector('.hx-lb-mask').addEventListener('click', closeLightbox);
      box.querySelector('.hx-lb-close').addEventListener('click', closeLightbox);
      box.querySelector('.hx-lb-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        step(-1);
      });
      box.querySelector('.hx-lb-next').addEventListener('click', (e) => {
        e.stopPropagation();
        step(1);
      });

      document.addEventListener('keydown', (e) => {
        if (!box.classList.contains('show')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      });
    }

    updateLightbox();
    requestAnimationFrame(() => box.classList.add('show'));
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    const box = document.getElementById('hx-lightbox');
    if (!box) return;
    const img = box.querySelector('.hx-lb-img');
    const counter = box.querySelector('.hx-lb-counter');

    img.style.opacity = '0';
    const tmp = new Image();
    tmp.onload = () => {
      img.src = lbList[lbIndex];
      img.style.opacity = '1';
    };
    tmp.src = lbList[lbIndex];

    counter.textContent = `${lbIndex + 1} / ${lbList.length}`;
  }

  function step(d) {
    lbIndex = (lbIndex + d + lbList.length) % lbList.length;
    updateLightbox();
  }

  function closeLightbox() {
    const box = document.getElementById('hx-lightbox');
    if (!box) return;
    box.classList.remove('show');
    document.body.style.overflow = '';
  }

  /* ============ 初始化 ============ */
  function init() {
    // 只在相册页跑
    if (!document.getElementById('hx-grid')) return;

    const groups = getData();
    if (!groups.length) {
      document.getElementById('hx-grid').innerHTML =
        '<div class="hx-gallery-empty">没有数据，检查 source/_data/gallery.yml</div>';
      return;
    }

    let active = 0;
    const switchTo = (i) => {
      active = i;
      renderTabs(groups, active, switchTo);
      renderGrid(groups[active]);
    };

    renderTabs(groups, active, switchTo);
    renderGrid(groups[active]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
