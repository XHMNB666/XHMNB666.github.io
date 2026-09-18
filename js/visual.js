/* ===================================================
   视觉动效增强
   包含：鼠标光晕 + 打字机副标题
   放到 source/js/visual.js
   =================================================== */

(function () {
  'use strict';

  /* ================================================
     一、鼠标跟随光晕
     ================================================ */
  function cursorGlow() {
    // 移动端不启用
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (document.getElementById('hx-glow')) return;

    const glow = document.createElement('div');
    glow.id = 'hx-glow';
    document.body.appendChild(glow);

    let mouseX = -1000;
    let mouseY = -1000;
    let curX = -1000;
    let curY = -1000;
    let raf = null;

    const lerp = (a, b, t) => a + (b - a) * t;

    const loop = () => {
      curX = lerp(curX, mouseX, 0.12);
      curY = lerp(curY, mouseY, 0.12);
      glow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!raf) loop();
    });

    document.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });
  }

  /* ================================================
     二、打字机副标题
     ================================================ */
  function typewriter() {
    // 只在首页
    const isHome =
      location.pathname === '/' ||
      location.pathname === '/index.html' ||
      document.querySelector('#page-header.full_page');
    if (!isHome) return;

    // 找副标题元素（Butterfly 里是 #subtitle 或 .site-subtitle）
    const el =
      document.getElementById('subtitle') ||
      document.querySelector('.site-subtitle') ||
      document.querySelector('#site-subtitle');
    if (!el) return;

    // 已经处理过
    if (el.dataset.hxTyped) return;
    el.dataset.hxTyped = '1';

    const text = el.textContent.trim();
    if (!text) return;

    el.textContent = '';
    el.classList.add('hx-typing');

    let i = 0;
    const speed = 90;

    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed);
      } else {
        // 打完后 3 秒去掉光标
        setTimeout(() => el.classList.remove('hx-typing'), 3000);
      }
    };

    // 首次延迟 600ms，避免和页面动画打架
    setTimeout(tick, 600);
  }

  /* ================================================
     初始化
     ================================================ */
  function init() {
    cursorGlow();
    typewriter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
