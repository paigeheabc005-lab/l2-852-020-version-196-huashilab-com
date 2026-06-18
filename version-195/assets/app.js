(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function markMissingImages() {
    document.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.classList.add("is-missing-image");
      });
    });
  }

  function initMobileMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHeroSlider() {
    var hero = document.querySelector("[data-hero-slider]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (slides.length <= 1) {
      return;
    }

    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        restart();
      });
    });

    show(0);
    restart();
  }

  function initFilters() {
    var grid = document.querySelector("[data-filter-grid]");
    var form = document.querySelector("[data-filter-form]");
    if (!grid || !form) {
      return;
    }

    var items = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
    var keywordInput = form.querySelector("[data-filter-keyword]");
    var categorySelect = form.querySelector("[data-filter-category]");
    var regionSelect = form.querySelector("[data-filter-region]");
    var yearSelect = form.querySelector("[data-filter-year]");
    var countNode = document.querySelector("[data-filter-count]");

    var params = new URLSearchParams(window.location.search);
    if (keywordInput && params.get("q")) {
      keywordInput.value = params.get("q");
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function apply() {
      var keyword = normalize(keywordInput && keywordInput.value);
      var category = normalize(categorySelect && categorySelect.value);
      var region = normalize(regionSelect && regionSelect.value);
      var year = normalize(yearSelect && yearSelect.value);
      var visible = 0;

      items.forEach(function (item) {
        var text = normalize(item.dataset.searchText);
        var itemCategory = normalize(item.dataset.category);
        var itemRegion = normalize(item.dataset.region);
        var itemYear = normalize(item.dataset.year);
        var ok = true;

        if (keyword && text.indexOf(keyword) === -1) {
          ok = false;
        }
        if (category && itemCategory !== category) {
          ok = false;
        }
        if (region && itemRegion.indexOf(region) === -1) {
          ok = false;
        }
        if (year && itemYear !== year) {
          ok = false;
        }

        item.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = String(visible);
      }
    }

    form.addEventListener("input", apply);
    form.addEventListener("change", apply);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });
    apply();
  }

  function initPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (box) {
      var video = box.querySelector("video");
      var button = box.querySelector("[data-play-button]");
      var overlay = box.querySelector(".player-overlay");
      var message = box.querySelector("[data-player-message]");
      var source = box.dataset.video;
      var poster = box.dataset.poster;
      var hlsInstance = null;

      if (!video || !button || !source) {
        return;
      }

      if (poster) {
        video.poster = poster;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text;
        }
      }

      function attachSource() {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          if (hlsInstance) {
            return Promise.resolve();
          }
          hlsInstance = new window.Hls({
            maxBufferLength: 30,
            enableWorker: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          return new Promise(function (resolve, reject) {
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, resolve);
            hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
              if (data && data.fatal) {
                reject(new Error("视频源加载失败"));
              }
            });
          });
        }

        return Promise.reject(new Error("当前浏览器暂不支持 HLS 播放"));
      }

      button.addEventListener("click", function () {
        button.disabled = true;
        setMessage("正在初始化播放源...");
        attachSource()
          .then(function () {
            if (overlay) {
              overlay.classList.add("is-hidden");
            }
            setMessage("播放源已绑定，可以正常观看。若浏览器拦截自动播放，请再次点击视频区域。");
            return video.play();
          })
          .catch(function (error) {
            button.disabled = false;
            setMessage(error && error.message ? error.message : "播放失败，请稍后重试。");
          });
      });
    });
  }

  ready(function () {
    markMissingImages();
    initMobileMenu();
    initHeroSlider();
    initFilters();
    initPlayers();
  });
})();
