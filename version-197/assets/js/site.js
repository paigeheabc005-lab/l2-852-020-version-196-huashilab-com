(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function openMobileMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function bindSearchForms() {
    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        if (!value) {
          event.preventDefault();
          return;
        }
      });
    });
  }

  function bindHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
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
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function bindFilters() {
    var grid = document.querySelector("[data-grid]");
    var input = document.querySelector("[data-filter-input]");
    var select = document.querySelector("[data-filter-select]");
    var note = document.querySelector("[data-result-count]");
    if (!grid || (!input && !select)) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get("q") || "";
    if (input && q) {
      input.value = q;
    }

    function apply() {
      var query = input ? normalize(input.value) : "";
      var selected = select ? normalize(select.value) : "";
      var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-text") + " " + card.getAttribute("data-title"));
        var passQuery = !query || text.indexOf(query) !== -1;
        var passSelect = !selected || text.indexOf(selected) !== -1;
        var showCard = passQuery && passSelect;
        card.classList.toggle("is-hidden", !showCard);
        if (showCard) {
          visible += 1;
        }
      });

      if (note) {
        note.textContent = query || selected ? "符合条件：" + visible : "";
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    if (select) {
      select.addEventListener("change", apply);
    }
    apply();
  }

  function bindPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (frame) {
      var video = frame.querySelector("video");
      var cover = frame.querySelector(".player-cover");
      var source = video ? video.getAttribute("data-url") : "";
      var loaded = false;
      var hls = null;

      if (!video || !source) {
        return;
      }

      function load() {
        if (loaded) {
          return Promise.resolve();
        }
        loaded = true;
        return new Promise(function (resolve) {
          if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              resolve();
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                resolve();
              }
            });
          } else {
            video.src = source;
            resolve();
          }
        });
      }

      function play() {
        load().then(function () {
          var attempt = video.play();
          if (attempt && typeof attempt.then === "function") {
            attempt.then(function () {
              if (cover) {
                cover.classList.add("is-hidden");
              }
            }).catch(function () {
              if (cover) {
                cover.classList.remove("is-hidden");
              }
            });
          } else if (cover) {
            cover.classList.add("is-hidden");
          }
        });
      }

      if (cover) {
        cover.addEventListener("click", play);
      }

      frame.addEventListener("click", function (event) {
        if (event.target === video && !loaded) {
          play();
        }
      });

      video.addEventListener("play", function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
      });

      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    openMobileMenu();
    bindSearchForms();
    bindHero();
    bindFilters();
    bindPlayers();
  });
})();
