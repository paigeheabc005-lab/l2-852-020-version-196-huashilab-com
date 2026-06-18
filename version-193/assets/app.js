(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initNavigation() {
        var button = qs('.nav-toggle');
        if (!button) return;
        button.addEventListener('click', function () {
            document.body.classList.toggle('nav-open');
        });
    }

    function initHero() {
        var carousel = qs('.hero-carousel');
        if (!carousel) return;
        var slides = qsa('.hero-slide', carousel);
        var dots = qsa('.hero-dot', carousel);
        if (!slides.length) return;
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function play() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) window.clearInterval(timer);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                play();
            });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function initSearchForms() {
        qsa('.global-search-form').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = qs('input[name="q"]', form);
                var query = input ? input.value.trim() : '';
                var target = './search.html';
                if (query) target += '?q=' + encodeURIComponent(query);
                window.location.href = target;
            });
        });
    }

    function initCardFilter() {
        qsa('[data-card-filter]').forEach(function (input) {
            var scopeSelector = input.getAttribute('data-filter-scope') || 'body';
            var scope = qs(scopeSelector) || document;
            var cards = qsa('[data-card]', scope);
            input.addEventListener('input', function () {
                var query = input.value.trim().toLowerCase();
                cards.forEach(function (card) {
                    var haystack = [
                        card.getAttribute('data-title'),
                        card.getAttribute('data-tags'),
                        card.getAttribute('data-region'),
                        card.getAttribute('data-genre'),
                        card.getAttribute('data-year'),
                        card.textContent
                    ].join(' ').toLowerCase();
                    card.hidden = query && haystack.indexOf(query) === -1;
                });
            });
        });
    }

    function initPlayer() {
        var video = qs('video[data-hls]');
        if (!video) return;
        var src = video.getAttribute('data-hls');
        var cover = qs('.player-cover');
        var hlsInstance = null;

        function loadVideo() {
            if (video.getAttribute('data-ready') === '1') return;
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) return;
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hlsInstance.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hlsInstance.recoverMediaError();
                    } else {
                        hlsInstance.destroy();
                    }
                });
            } else {
                video.src = src;
            }
            video.setAttribute('data-ready', '1');
        }

        function begin() {
            loadVideo();
            if (cover) cover.classList.add('is-hidden');
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    video.controls = true;
                });
            }
        }

        if (cover) {
            cover.addEventListener('click', begin);
        }

        video.addEventListener('play', function () {
            if (cover) cover.classList.add('is-hidden');
        });

        video.addEventListener('click', function () {
            if (video.paused) {
                begin();
            }
        });

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) hlsInstance.destroy();
        });
    }

    function createCard(item) {
        var tags = (item.tags || []).slice(0, 3).map(function (tag) {
            return '<span class="tag">' + escapeHtml(tag) + '</span>';
        }).join('');
        return '<article class="movie-card" data-card>' +
            '<a class="poster-link" href="./' + item.file + '" aria-label="' + escapeHtml(item.title) + '">' +
            '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
            '<span class="poster-glow"></span>' +
            '</a>' +
            '<div class="card-body">' +
            '<div class="meta-row"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.year) + '</span><span>' + escapeHtml(item.genre) + '</span></div>' +
            '<h3><a href="./' + item.file + '">' + escapeHtml(item.title) + '</a></h3>' +
            '<p>' + escapeHtml(item.desc) + '</p>' +
            '<div class="tag-row">' + tags + '</div>' +
            '</div>' +
            '</article>';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function initSearchPage() {
        var results = qs('#search-results');
        if (!results || typeof SEARCH_INDEX === 'undefined') return;
        var input = qs('#search-input');
        var note = qs('#search-note');
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        if (input) input.value = initial;

        function render(query) {
            var q = query.trim().toLowerCase();
            var list = SEARCH_INDEX.filter(function (item) {
                if (!q) return true;
                return [item.title, item.region, item.genre, item.year, item.desc, (item.tags || []).join(' ')].join(' ').toLowerCase().indexOf(q) !== -1;
            }).slice(0, 120);
            if (note) {
                note.textContent = q ? '与“' + query.trim() + '”相关的影片' : '输入关键词后可按片名、地区、题材和标签浏览';
            }
            if (!list.length) {
                results.innerHTML = '<div class="empty-state">未找到相关内容</div>';
                return;
            }
            results.innerHTML = list.map(createCard).join('');
        }

        if (input) {
            input.addEventListener('input', function () {
                render(input.value);
            });
        }
        render(initial);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initNavigation();
        initHero();
        initSearchForms();
        initCardFilter();
        initPlayer();
        initSearchPage();
    });
})();
