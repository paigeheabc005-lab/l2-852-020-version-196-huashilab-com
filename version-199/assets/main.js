(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-button]");
    var panel = document.querySelector("[data-nav-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupImages() {
    document.querySelectorAll("img.cover-img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.style.display = "none";
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    show(0);
    restart();
  }

  function setupFilters() {
    document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
      var bar = scope.querySelector("[data-filter-bar]");
      if (!bar) {
        return;
      }
      var textInput = bar.querySelector("[data-filter-text]");
      var typeSelect = bar.querySelector("[data-filter-type]");
      var yearSelect = bar.querySelector("[data-filter-year]");
      var reset = bar.querySelector("[data-filter-reset]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
      var empty = scope.querySelector("[data-no-results]");
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";
      if (initialQuery && textInput) {
        textInput.value = initialQuery;
      }

      function matchCard(card) {
        var query = textInput ? textInput.value.trim().toLowerCase() : "";
        var type = typeSelect ? typeSelect.value : "";
        var year = yearSelect ? yearSelect.value : "";
        var haystack = [
          card.dataset.title || "",
          card.dataset.region || "",
          card.dataset.type || "",
          card.dataset.year || "",
          card.dataset.tags || ""
        ].join(" ").toLowerCase();
        var ok = true;
        if (query) {
          ok = haystack.indexOf(query) !== -1;
        }
        if (ok && type) {
          ok = (card.dataset.type || "").indexOf(type) !== -1 || (card.dataset.tags || "").indexOf(type) !== -1;
        }
        if (ok && year) {
          var cardYear = parseInt(card.dataset.year || "0", 10);
          if (year === "old") {
            ok = cardYear < 2020;
          } else {
            ok = String(cardYear) === year;
          }
        }
        return ok;
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var matched = matchCard(card);
          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [textInput, typeSelect, yearSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      if (reset) {
        reset.addEventListener("click", function () {
          if (textInput) {
            textInput.value = "";
          }
          if (typeSelect) {
            typeSelect.value = "";
          }
          if (yearSelect) {
            yearSelect.value = "";
          }
          apply();
        });
      }
      apply();
    });
  }

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) {
      return "0:00";
    }
    var minutes = Math.floor(value / 60);
    var seconds = Math.floor(value % 60);
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function setupPlayer() {
    var player = document.querySelector("[data-player]");
    if (!player) {
      return;
    }
    var video = player.querySelector("video");
    var streamUrl = player.getAttribute("data-stream");
    var poster = player.querySelector("[data-player-poster]");
    var toggle = player.querySelector("[data-player-toggle]");
    var mute = player.querySelector("[data-player-mute]");
    var full = player.querySelector("[data-player-fullscreen]");
    var progress = player.querySelector("[data-player-progress]");
    var progressValue = player.querySelector("[data-player-progress-value]");
    var time = player.querySelector("[data-player-time]");
    var loaded = false;
    var hlsInstance = null;

    if (!video || !streamUrl) {
      return;
    }

    function prepare() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      prepare();
      if (poster) {
        poster.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    function togglePlay() {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    }

    function syncState() {
      var playing = !video.paused && !video.ended;
      player.classList.toggle("is-playing", playing);
      if (toggle) {
        toggle.textContent = playing ? "❚❚" : "▶";
      }
    }

    function syncTime() {
      var duration = video.duration || 0;
      var current = video.currentTime || 0;
      if (progressValue) {
        progressValue.style.width = duration ? Math.min(100, current / duration * 100) + "%" : "0%";
      }
      if (time) {
        time.textContent = formatTime(current) + " / " + formatTime(duration);
      }
    }

    if (poster) {
      poster.addEventListener("click", play);
    }
    if (toggle) {
      toggle.addEventListener("click", togglePlay);
    }
    video.addEventListener("click", togglePlay);
    video.addEventListener("play", syncState);
    video.addEventListener("pause", syncState);
    video.addEventListener("ended", syncState);
    video.addEventListener("timeupdate", syncTime);
    video.addEventListener("loadedmetadata", syncTime);

    if (mute) {
      mute.addEventListener("click", function () {
        video.muted = !video.muted;
        mute.textContent = video.muted ? "🔇" : "🔊";
      });
    }
    if (full) {
      full.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (player.requestFullscreen) {
          player.requestFullscreen();
        }
      });
    }
    if (progress) {
      progress.addEventListener("click", function (event) {
        if (!video.duration) {
          return;
        }
        var rect = progress.getBoundingClientRect();
        var ratio = (event.clientX - rect.left) / rect.width;
        video.currentTime = Math.max(0, Math.min(1, ratio)) * video.duration;
      });
    }

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
    syncState();
    syncTime();
  }

  ready(function () {
    setupMenu();
    setupImages();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();\n