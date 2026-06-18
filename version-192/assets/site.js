(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
      return;
    }
    document.addEventListener('DOMContentLoaded', fn);
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle('is-active', itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle('is-active', itemIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-hero-dot'), 10) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return (value || '').toString().toLowerCase().replace(/\s+/g, '');
  }

  function initFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    scopes.forEach(function (scope) {
      var input = scope.querySelector('[data-filter-input]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
      var count = scope.querySelector('[data-visible-count]');
      var empty = scope.querySelector('[data-empty-state]');
      if (!input || cards.length === 0) {
        if (count) {
          count.textContent = '';
        }
        return;
      }

      function apply() {
        var keyword = normalize(input.value);
        var visible = 0;
        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-category'),
            card.textContent
          ].join(' '));
          var matched = !keyword || text.indexOf(keyword) !== -1;
          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = visible ? '当前显示 ' + visible + ' 部影片' : '';
        }
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      input.addEventListener('input', apply);
      apply();
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.js-player'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('.video-start');
      var message = player.querySelector('[data-video-message]');
      var stream = player.getAttribute('data-stream');
      var hls;

      function showMessage(text) {
        if (!message) {
          return;
        }
        message.textContent = text;
        player.classList.add('has-message');
      }

      function attachStream() {
        if (!video || !stream) {
          showMessage('视频暂时无法播放，请稍后再试');
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              showMessage('视频暂时无法播放，请稍后再试');
            }
          });
          return;
        }
        showMessage('视频暂时无法播放，请稍后再试');
      }

      function playVideo() {
        if (!video) {
          return;
        }
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      }

      if (button) {
        button.addEventListener('click', playVideo);
      }

      if (video) {
        video.addEventListener('play', function () {
          player.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
          player.classList.remove('is-playing');
        });
        video.addEventListener('ended', function () {
          player.classList.remove('is-playing');
        });
      }

      attachStream();
      window.addEventListener('pagehide', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayers();
  });
})();
