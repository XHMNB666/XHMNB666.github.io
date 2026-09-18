/* ===================================================
   移动端体验增强
   包含：目录悬浮球 + 阅读模式
   放到 source/js/ux.js
   =================================================== */

(function () {
  'use strict';

  /* ================================================
     一、目录悬浮球（移动端）
     ================================================ */
  function tocFab() {
    const isMobile = window.innerWidth < 900;
    if (!isMobile) return;
    if (document.getElementById('hx-toc-fab')) return;
    if (!document.getElementById('post')) return;

    // 拿目录数据
    const tocLinks = document.querySelectorAll('#card-toc .toc-link');
    if (!tocLinks.length) return;

    const fab = document.createElement('div');
    fab.id = 'hx-toc-fab';
    fab.innerHTML = '<i class="fas fa-list-ul"></i>';

    const panel = document.createElement('div');
    panel.id = 'hx-toc-panel';
    panel.innerHTML = `
      <div class="hx-toc-panel-mask"></div>
      <div class="hx-toc-panel-body">
        <div class="hx-toc-panel-head">
          <span>目录</span>
          <i class="fas fa-times hx-toc-panel-close"></i>
        </div>
        <div class="hx-toc-panel-list"></div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // 复制目录内容
    const list = panel.querySelector('.hx-toc-panel-list');
    tocLinks.forEach((link) => {
      const clone = link.cloneNode(true);
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        const id = decodeURIComponent(link.getAttribute('href') || '').replace('#', '');
        const target = document.getElementById(id);
        if (target) {
          const top = target.offsetTop - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        closePanel();
      });
      list.appendChild(clone);
    });

    const openPanel = () => {
      panel.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const closePanel = () => {
      panel.classList.remove('show');
      document.body.style.overflow = '';
    };

    fab.addEventListener('click', openPanel);
    panel.querySelector('.hx-toc-panel-mask').addEventListener('click', closePanel);
    panel.querySelector('.hx-toc-panel-close').addEventListener('click', closePanel);
  }

  /* ================================================
     二、阅读模式
     ================================================ */
  function readMode() {
    if (!document.getElementById('post')) return;
    if (document.getElementById('hx-read-toggle')) return;

    const btn = document.createElement('div');
    btn.id = 'hx-read-toggle';
    btn.innerHTML = '<i class="fas fa-book-open"></i>';
    btn.title = '阅读模式';
    document.body.appendChild(btn);

    const KEY = 'hx-read-mode';

    const apply = (on) => {
      document.documentElement.classList.toggle('hx-reading', on);
      btn.classList.toggle('active', on);
      btn.innerHTML = on
        ? '<i class="fas fa-compress"></i>'
        : '<i class="fas fa-book-open"></i>';
    };

    // 恢复上次状态（只在本会话）
    const saved = sessionStorage.getItem(KEY) === '1';
    apply(saved);

    btn.addEventListener('click', () => {
      const next = !document.documentElement.classList.contains('hx-reading');
      apply(next);
      sessionStorage.setItem(KEY, next ? '1' : '0');
    });

    // 键盘 R 快捷切换
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        btn.click();
      }
    });
  }

  /* ================================================
     三、初始化
     ================================================ */
  function init() {
    tocFab();
    readMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('pjax:complete', () => {
    document.getElementById('hx-toc-fab')?.remove();
    document.getElementById('hx-toc-panel')?.remove();
    document.getElementById('hx-read-toggle')?.remove();
    init();
  });
})();
