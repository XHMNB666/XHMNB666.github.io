/* ===================================================
   发布热力图
   放到 source/js/heatmap.js
   只在归档页或指定容器里渲染
   =================================================== */

(function () {
  'use strict';

  // ============ 数据 ============
  // 从页面读取：window.HX_POST_DATES = ['2026-09-18', '2026-09-16', ...]
  // 如果没注入，就用下面的示例数据
  const FALLBACK = [
    '2026-09-18',
    '2026-09-18',
    '2026-09-16',
    '2026-09-10',
    '2026-08-28',
    '2026-08-15'
  ];
  // ================================

  function getDates() {
    if (window.HX_POST_DATES && Array.isArray(window.HX_POST_DATES)) {
      return window.HX_POST_DATES;
    }
    return FALLBACK;
  }

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function buildMap(dates) {
    const map = {};
    dates.forEach((d) => {
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  }

  function levelOf(count) {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  }

  function render() {
    const wrap = document.getElementById('hx-heatmap');
    if (!wrap) return;

    const map = buildMap(getDates());

    // 覆盖最近 371 天（53 周）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 起点：往前推 371 天，然后补到周日
    const start = new Date(today);
    start.setDate(start.getDate() - 370);
    start.setDate(start.getDate() - start.getDay());

    const grid = document.createElement('div');
    grid.className = 'hx-heatmap-grid';

    const cur = new Date(start);
    while (cur <= today) {
      const key = ymd(cur);
      const count = map[key] || 0;

      const cell = document.createElement('div');
      cell.className = 'hx-heatmap-cell';
      cell.setAttribute('data-level', String(levelOf(count)));
      cell.title = `${key}  ${count} 篇`;
      grid.appendChild(cell);

      cur.setDate(cur.getDate() + 1);
    }

    wrap.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'hx-heatmap-title';
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    title.textContent = `最近一年发布 ${total} 篇文章`;
    wrap.appendChild(title);

    const scroll = document.createElement('div');
    scroll.className = 'hx-heatmap-wrap';
    scroll.appendChild(grid);
    wrap.appendChild(scroll);

    // 图例
    const legend = document.createElement('div');
    legend.className = 'hx-heatmap-legend';
    legend.innerHTML = '<span>少</span>';
    for (let i = 0; i <= 4; i++) {
      const c = document.createElement('div');
      c.className = 'hx-heatmap-cell';
      c.setAttribute('data-level', String(i));
      legend.appendChild(c);
    }
    legend.innerHTML += '<span>多</span>';
    wrap.appendChild(legend);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
