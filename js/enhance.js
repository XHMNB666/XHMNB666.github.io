/* ===================================================
   综合增强脚本
   包含：目录滚动高亮、搜索快捷键、暗色跟随时间、代码块增强
   放到 source/js/enhance.js
   =================================================== */

(function () {
  'use strict';

  /* ================================================
     一、目录滚动高亮
     ================================================ */
  function tocHighlight() {
    const tocLinks = document.querySelectorAll('#card-toc .toc-link');
    if (!tocLinks.length) return;

    const headings = [];
    tocLinks.forEach((link) => {
      const id = decodeURIComponent(link.getAttribute('href') || '').replace('#', '');
      const el = document.getElementById(id);
      if (el) headings.push({ el, link });
    });
    if (!headings.length) return;

    let lastActive = null;

    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // 当前视口上方 120px 处作为判定线
      const line = scrollY + 120;

      let current = headings[0];
      for (const h of headings) {
        if (h.el.offsetTop <= line) current = h;
        else break;
      }

      if (current.link !== lastActive) {
        tocLinks.forEach((l) => l.classList.remove('active'));
        current.link.classList.add('active');
        lastActive = current.link;

        // 让高亮项滚进可视区
        const sidebar = document.querySelector('.toc-container') || current.link.parentNode;
        if (sidebar && sidebar.scrollHeight > sidebar.clientHeight) {
          const linkTop = current.link.offsetTop;
          const contTop = sidebar.scrollTop;
          const contH = sidebar.clientHeight;
          if (linkTop < contTop || linkTop > contTop + contH - 30) {
            sidebar.scrollTop = linkTop - contH / 2;
          }
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================================================
     二、搜索增强：Ctrl+K 聚焦 + 输入框美化
     ================================================ */
  function searchEnhance() {
    // 快捷键 Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') {
        const box = document.querySelector('.search-dialog, #search-dialog');
        if (box && box.style.display !== 'none') {
          const btn = document.querySelector('.search-close-button');
          if (btn) btn.click();
        }
      }
    });

    // 给搜索按钮加提示
    const searchBtn = document.querySelector('#search-button, .search-button');
    if (searchBtn) {
      searchBtn.setAttribute('title', '搜索 (Ctrl+K)');
    }
  }

  function openSearch() {
    const btn = document.querySelector('#search-button, .search-button');
    if (btn) {
      btn.click();
      setTimeout(() => {
        const input = document.querySelector('.search-dialog input, #local-search-input');
        if (input) input.focus();
      }, 120);
    }
  }

  /* ================================================
     三、暗色模式：跟随时间自动切换
     ================================================ */
  function autoDarkByTime() {
    const HOUR = new Date().getHours();
    const shouldBeDark = HOUR < 6 || HOUR >= 19;
    const current = document.documentElement.getAttribute('data-theme');

    // 只在没有手动设置过的前提下自动切换
    const manualKey = 'hx-theme-manual';
    const lastManual = localStorage.getItem(manualKey);
    const now = Date.now();
    // 手动设置 12 小时内不覆盖
    if (lastManual && now - parseInt(lastManual, 10) < 12 * 3600 * 1000) return;

    const target = shouldBeDark ? 'dark' : 'light';
    if (current !== target) {
      document.documentElement.setAttribute('data-theme', target);
      // 同步 Butterfly 的深色按钮状态
      const btn = document.getElementById('darkmode');
      if (btn) btn.classList.toggle('darkmode--activated', shouldBeDark);
    }

    // 监听用户手动切换
    const dmBtn = document.getElementById('darkmode');
    if (dmBtn && !dmBtn.dataset.hxBound) {
      dmBtn.dataset.hxBound = '1';
      dmBtn.addEventListener('click', () => {
        localStorage.setItem(manualKey, String(Date.now()));
      });
    }
  }

  /* ================================================
     四、代码块增强：折叠 + 复制全部
     ================================================ */
  function codeBlockEnhance() {
    const blocks = document.querySelectorAll('#article-container figure.highlight');
    if (!blocks.length) return;

    const MAX_H = 500; // 超过这个高度折叠

    blocks.forEach((block) => {
      if (block.dataset.hxDone) return;
      block.dataset.hxDone = '1';

      // ---- 折叠 ----
      if (block.offsetHeight > MAX_H) {
        block.classList.add('hx-collapsed');

        const btn = document.createElement('div');
        btn.className = 'hx-code-toggle';
        btn.innerHTML = '<i class="fas fa-angle-down"></i> 展开全部';
        btn.addEventListener('click', () => {
          const collapsed = block.classList.toggle('hx-collapsed');
          btn.innerHTML = collapsed
            ? '<i class="fas fa-angle-down"></i> 展开全部'
            : '<i class="fas fa-angle-up"></i> 收起';
        });
        block.appendChild(btn);
      }

      // ---- 复制全部 ----
      const copyBtn = document.createElement('button');
      copyBtn.className = 'hx-code-copy';
      copyBtn.innerHTML = '<i class="far fa-copy"></i>';
      copyBtn.title = '复制全部代码';
      copyBtn.addEventListener('click', () => {
        const table = block.querySelector('table');
        let text = '';
        if (table) {
          // 有行号：只取代码列
          const codeCells = table.querySelectorAll('td.gutter + td.code, td:last-child');
          if (codeCells.length) {
            text = Array.from(codeCells)
              .map((c) => c.textContent)
              .join('');
          } else {
            text = table.textContent;
          }
        } else {
          text = block.textContent;
        }
        text = text.replace(/展开全部|收起/g, '').trim();

        const done = () => {
          copyBtn.innerHTML = '<i class="fas fa-check"></i>';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
            copyBtn.classList.remove('copied');
          }, 1600);
        };

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(done).catch(() => {});
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          ta.remove();
        }
      });
      block.appendChild(copyBtn);
    });
  }

  /* ================================================
     初始化
     ================================================ */
  function init() {
    tocHighlight();
    searchEnhance();
    autoDarkByTime();
    codeBlockEnhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // PJAX 兼容
  document.addEventListener('pjax:complete', () => {
    tocHighlight();
    codeBlockEnhance();
  });
})();
