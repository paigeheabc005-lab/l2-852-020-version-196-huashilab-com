
(function () {
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function decodeQuery(value) {
    try { return decodeURIComponent(value.replace(/\+/g, ' ')); } catch (_) { return value; }
  }
  function getSearchParams() {
    return new URLSearchParams(window.location.search || '');
  }
  function initMobileMenu() {
    const btn = qs('[data-menu-button]');
    const panel = qs('[data-mobile-menu]');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const hidden = panel.hasAttribute('hidden');
      if (hidden) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', String(hidden));
    });
  }
  function initHeroCarousel() {
    const root = qs('[data-hero-carousel]');
    if (!root) return;
    const slides = qsa('[data-hero-slide]', root);
    const dots = qsa('[data-hero-dot]', root);
    if (!slides.length) return;
    let current = Math.max(0, slides.findIndex(el => el.classList.contains('is-active')));
    if (current < 0) current = 0;
    function show(index) {
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      current = index;
    }
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    setInterval(() => show((current + 1) % slides.length), 6000);
  }
  function initSearchForms() {
    qsa('form[data-global-search]').forEach(form => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const fd = new FormData(form);
        const q = String(fd.get('q') || '').trim();
        const category = String(fd.get('category') || '').trim();
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category) params.set('category', category);
        window.location.href = (form.dataset.searchTarget || '/search/index.html') + (params.toString() ? ('?' + params.toString()) : '');
      });
    });
  }
  function initBrowseFilters() {
    qsa('[data-browse-filter]').forEach(root => {
      const input = qs('[data-filter-input]', root);
      const genre = qs('[data-filter-genre]', root);
      const type = qs('[data-filter-type]', root);
      const region = qs('[data-filter-region]', root);
      const year = qs('[data-filter-year]', root);
      const items = qsa('[data-filter-item]', root);
      function apply() {
        const q = (input && input.value || '').trim().toLowerCase();
        const g = genre && genre.value || '';
        const t = type && type.value || '';
        const r = region && region.value || '';
        const y = year && year.value || '';
        items.forEach(item => {
          const text = (item.dataset.title + ' ' + item.dataset.genre + ' ' + item.dataset.region + ' ' + item.dataset.type + ' ' + item.dataset.tags).toLowerCase();
          const pass = (!q || text.includes(q)) && (!g || item.dataset.genre.includes(g)) && (!t || item.dataset.type.includes(t)) && (!r || item.dataset.region.includes(r)) && (!y || item.dataset.year === y);
          item.style.display = pass ? '' : 'none';
        });
      }
      [input, genre, type, region, year].filter(Boolean).forEach(el => el.addEventListener('input', apply));
      apply();
    });
  }
  function initRandomNav() {
    qsa('[data-random-target]').forEach(link => {
      link.addEventListener('click', event => {
        const list = window.__MOVIES__ || [];
        if (!list.length) return;
        const pick = list[Math.floor(Math.random() * list.length)];
        if (!pick) return;
        event.preventDefault();
        const base = link.dataset.base || '';
        window.location.href = base + 'movie/' + pick.code + '.html';
      });
    });
  }
  function initPlayer() {
    qsa('[data-hls-player]').forEach(video => {
      const src = video.dataset.src || video.getAttribute('src') || (video.querySelector('source') && video.querySelector('source').src);
      if (!src) return;
      const overlayButton = video.closest('.player-wrap') && video.closest('.player-wrap').querySelector('[data-play-toggle]');
      function syncButton() {
        if (!overlayButton) return;
        const playing = !video.paused && !video.ended;
        overlayButton.setAttribute('aria-label', playing ? '暂停' : '播放');
        overlayButton.innerHTML = playing ? '❚❚' : '▶';
      }
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
      if (overlayButton) {
        overlayButton.addEventListener('click', () => {
          if (video.paused) video.play();
          else video.pause();
        });
        video.addEventListener('play', syncButton);
        video.addEventListener('pause', syncButton);
        video.addEventListener('ended', syncButton);
        syncButton();
      }
    });
  }
  function initSearchPage() {
    const root = qs('[data-search-page]');
    if (!root || !window.__MOVIES__) return;
    const input = qs('[data-search-query]', root);
    const genre = qs('[data-search-genre]', root);
    const year = qs('[data-search-year]', root);
    const region = qs('[data-search-region]', root);
    const type = qs('[data-search-type]', root);
    const grid = qs('[data-search-grid]', root);
    const count = qs('[data-search-count]', root);
    const params = getSearchParams();
    const initialQ = decodeQuery(params.get('q') || '');
    if (input && initialQ) input.value = initialQ;
    function render() {
      const q = (input && input.value || '').trim().toLowerCase();
      const g = genre && genre.value || '';
      const y = year && year.value || '';
      const r = region && region.value || '';
      const t = type && type.value || '';
      const list = window.__MOVIES__.filter(item => {
        const text = [item.title, item.genre, item.region, item.type, item.tags, item.one_line].join(' ').toLowerCase();
        return (!q || text.includes(q)) && (!g || (item.genre || '').includes(g)) && (!y || String(item.year) === y) && (!r || (item.region || '').includes(r)) && (!t || (item.type || '').includes(t));
      });
      if (count) count.textContent = String(list.length);
      if (grid) {
        grid.innerHTML = list.map(item => {
          const colors = (item.score % 360);
          const c1 = `hsl(${colors}, 78%, 58%)`;
          const c2 = `hsl(${(colors + 32) % 360}, 70%, 40%)`;
          const c3 = `hsl(${(colors + 84) % 360}, 72%, 56%)`;
          return `
            <a class="group block overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl" href="../movie/${item.code}.html" data-title="${escapeHtml(item.title)}" data-genre="${escapeHtml(item.genre)}" data-region="${escapeHtml(item.region)}" data-type="${escapeHtml(item.type)}" data-year="${item.year}" data-tags="${escapeHtml(item.tags)}">
              <div class="poster aspect-[3/4] p-4" style="--c1:${c1};--c2:${c2};--c3:${c3};">
                <div class="poster-content flex h-full flex-col justify-between text-white">
                  <div class="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                    <span>${escapeHtml(item.year)}</span>
                    <span class="rounded-full bg-white/10 px-2 py-1">${escapeHtml(item.type || '影片')}</span>
                  </div>
                  <div>
                    <div class="mb-2 text-3xl font-bold leading-tight">${escapeHtml(shortTitle(item.title))}</div>
                    <div class="line-clamp-3 text-sm leading-relaxed text-white/85">${escapeHtml(item.one_line || item.genre || '')}</div>
                  </div>
                </div>
              </div>
              <div class="p-4">
                <div class="mb-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  ${chip(item.region)}${chip(item.genre)}
                </div>
                <h3 class="line-clamp-2 text-base font-semibold text-white group-hover:text-amber-300">${escapeHtml(item.title)}</h3>
              </div>
            </a>`;
        }).join('');
      }
    }
    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    function shortTitle(title) {
      const s = String(title || '').trim();
      return s.length > 8 ? s.slice(0, 8) : s;
    }
    function chip(text) { return text ? `<span class="badge">${escapeHtml(text)}</span>` : ''; }
    [input, genre, year, region, type].filter(Boolean).forEach(el => el.addEventListener('input', render));
    render();
  }
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHeroCarousel();
    initSearchForms();
    initBrowseFilters();
    initRandomNav();
    initPlayer();
    initSearchPage();
  });
})();
