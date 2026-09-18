/* ===================================================
   心痕の博客 · 自定义交互脚本
   放到 source/js/custom.js
   在 _config.butterfly.yml 的 inject.bottom 引入
   =================================================== */

(function () {
  'use strict';

  /* ========== 1. 鼠标点击彩色涟漪 ========== */
  const COLORS = ['#49b1f5', '#a06cf5', '#ff6b9d', '#ffd700', '#3ddc97'];

  function createRipple(x, y) {
    const ripple = document.createElement('div');
    const size = 12;
    ripple.style.cssText = `
      position: fixed;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
      pointer-events: none;
      z-index: 99999;
      opacity: 0.85;
    `;
    document.body.appendChild(ripple);

    const anim = ripple.animate(
      [
        { transform: 'scale(1)', opacity: 0.85 },
        { transform: 'scale(6)', opacity: 0 }
      ],
      { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    anim.onfinish = () => ripple.remove();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, textarea')) return;
    createRipple(e.clientX, e.clientY);
  });

  /* ========== 2. 文章标题打字机效果（首页副标题） ========== */
  function typewriter() {
    const el = document.getElementById('subtitle');
    if (!el) return;
    const text = el.textContent.trim();
    if (!text) return;
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) clearInterval(timer);
    }, 90);
  }

  /* ========== 3. 图片懒加载淡入 ========== */
  function fadeInImages() {
    const imgs = document.querySelectorAll('#article-container img, .post_cover img');
    imgs.forEach((img) => {
      if (img.dataset.hxFaded) return;
      img.dataset.hxFaded = '1';
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.6s ease';
      if (img.complete) {
        img.style.opacity = '1';
      } else {
        img.addEventListener('load', () => { img.style.opacity = '1'; });
        img.addEventListener('error', () => { img.style.opacity = '1'; });
      }
    });
  }

  /* ========== 4. 标题滚动进入动画 ========== */
  function observeHeadings() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document
      .querySelectorAll('#article-container h2, #article-container h3')
      .forEach((h) => {
        h.style.opacity = '0';
        h.style.transform = 'translateX(-16px)';
        h.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        io.observe(h);
      });
  }

  /* ========== 5. 返回顶部小火箭 ========== */
  function enhanceGoUp() {
    const btn = document.getElementById('go-up');
    if (!btn || btn.dataset.hxDone) return;
    btn.dataset.hxDone = '1';
    btn.title = '回顶部 🚀';
  }

  /* ========== 6. 阅读时间提示 ========== */
  function readingProgress() {
    const post = document.getElementById('post');
    if (!post) return;

    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, #49b1f5, #a06cf5);
      z-index: 99998;
      transition: width 0.1s linear;
      box-shadow: 0 0 8px rgba(73,177,245,0.6);
    `;
    document.body.appendChild(bar);

    const update = () => {
      const rect = post.getBoundingClientRect();
      const total = post.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const pct = total > 0 ? Math.min(Math.max((scrolled / total) * 100, 0), 100) : 0;
      bar.style.width = pct + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ========== 7. 复制成功提示美化 ========== */
  function beautifyCopyToast() {
    const origLog = console.log;
    // Butterfly 用 Snackbar，这里只做兜底，不覆盖
  }

  /* ========== 8. 页面初始化 ========== */
  function init() {
    typewriter();
    fadeInImages();
    observeHeadings();
    enhanceGoUp();
    readingProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // PJAX 兼容（Butterfly 用 PJAX 无刷新跳转）
  document.addEventListener('pjax:complete', () => {
    fadeInImages();
    observeHeadings();
    enhanceGoUp();
    readingProgress();
  });
})();
