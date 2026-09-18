/* ===================================================
   文章分享按钮
   放到 source/js/share.js
   在 _config.butterfly.yml 的 inject.bottom 引入
   =================================================== */

(function () {
  'use strict';

  function buildShareBar() {
    const post = document.getElementById('post');
    if (!post) return;
    if (document.getElementById('hx-share-bar')) return;

    const url = encodeURIComponent(location.href);
    const title = encodeURIComponent(document.title);

    const links = [
      {
        name: '微博',
        icon: 'fab fa-weibo',
        color: '#e6162d',
        href: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`
      },
      {
        name: 'QQ',
        icon: 'fab fa-qq',
        color: '#12b7f5',
        href: `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`
      },
      {
        name: 'Telegram',
        icon: 'fab fa-telegram',
        color: '#0088cc',
        href: `https://t.me/share/url?url=${url}&text=${title}`
      },
      {
        name: 'X',
        icon: 'fab fa-x-twitter',
        color: '#000000',
        href: `https://twitter.com/intent/tweet?url=${url}&text=${title}`
      }
    ];

    const bar = document.createElement('div');
    bar.id = 'hx-share-bar';
    bar.innerHTML = `
      <span class="hx-share-label">分享到</span>
      ${links
        .map(
          (l) =>
            `<a class="hx-share-btn" href="${l.href}" target="_blank" rel="noopener" 
                title="${l.name}" style="--brand:${l.color}">
               <i class="${l.icon}"></i>
             </a>`
        )
        .join('')}
      <a class="hx-share-btn hx-share-copy" href="javascript:void(0)" title="复制链接">
        <i class="fas fa-link"></i>
      </a>
    `;

    // 插到文章末尾
    const footer = post.querySelector('#post-info') || post;
    footer.parentNode.insertBefore(bar, footer.nextSibling);

    // 复制链接
    bar.querySelector('.hx-share-copy').addEventListener('click', () => {
      const text = location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          const btn = bar.querySelector('.hx-share-copy');
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => (btn.innerHTML = orig), 1500);
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    });
  }

  function init() {
    buildShareBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('pjax:complete', buildShareBar);
})();
