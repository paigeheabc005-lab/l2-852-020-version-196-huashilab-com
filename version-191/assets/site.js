(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function bindNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function bindBackTop() {
    var button = document.querySelector("[data-back-top]");
    if (!button) {
      return;
    }
    var refresh = function () {
      if (window.scrollY > 320) {
        button.classList.add("show");
      } else {
        button.classList.remove("show");
      }
    };
    window.addEventListener("scroll", refresh, { passive: true });
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    refresh();
  }

  function bindHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var next = hero.querySelector("[data-hero-next]");
    var prev = hero.querySelector("[data-hero-prev]");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;
    var show = function (nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    };
    var start = function () {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    };
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function bindFilters() {
    var pages = Array.prototype.slice.call(document.querySelectorAll(".filter-page"));
    if (!pages.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    pages.forEach(function (page) {
      var input = page.querySelector("[data-filter-input]");
      var selects = Array.prototype.slice.call(page.querySelectorAll("[data-filter-select]"));
      var cards = Array.prototype.slice.call(page.querySelectorAll("[data-movie-card]"));
      if (input && params.get("q")) {
        input.value = params.get("q");
      }
      var apply = function () {
        var query = normalize(input ? input.value : "");
        var values = {};
        selects.forEach(function (select) {
          values[select.getAttribute("data-filter-select")] = normalize(select.value);
        });
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-year"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags")
          ].join(" "));
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesSelects = Object.keys(values).every(function (key) {
            var value = values[key];
            if (!value) {
              return true;
            }
            return normalize(card.getAttribute("data-" + key)).indexOf(value) !== -1;
          });
          card.classList.toggle("is-hidden", !(matchesQuery && matchesSelects));
        });
      };
      if (input) {
        input.addEventListener("input", apply);
      }
      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });
      apply();
    });
  }

  function bindPlayer(shellId, source) {
    var shell = document.getElementById(shellId);
    if (!shell) {
      return;
    }
    var video = shell.querySelector("video");
    var button = shell.querySelector("[data-player-button]");
    var loaded = false;
    var instance = null;
    if (!video) {
      return;
    }
    var attach = function () {
      if (loaded) {
        video.play().catch(function () {});
        return;
      }
      loaded = true;
      shell.classList.add("is-playing");
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        instance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        instance.loadSource(source);
        instance.attachMedia(video);
      } else {
        video.src = source;
      }
      var start = function () {
        video.play().catch(function () {});
      };
      if (video.readyState > 0) {
        start();
      } else {
        video.addEventListener("loadedmetadata", start, { once: true });
        window.setTimeout(start, 450);
      }
    };
    if (button) {
      button.addEventListener("click", attach);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        attach();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (instance && instance.destroy) {
        instance.destroy();
      }
    });
  }

  window.StaticMovieSite = {
    bindPlayer: bindPlayer
  };

  ready(function () {
    bindNavigation();
    bindBackTop();
    bindHero();
    bindFilters();
  });
})();
