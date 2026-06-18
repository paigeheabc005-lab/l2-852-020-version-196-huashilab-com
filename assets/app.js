(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
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
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        slide.classList.toggle("is-active", position === index);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle("is-active", position === index);
      });
    }

    function start() {
      stop();
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

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
    dots.forEach(function (dot, position) {
      dot.addEventListener("click", function () {
        show(position);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupLocalFilters() {
    var toolbar = document.querySelector("[data-filter-toolbar]");
    var grid = document.querySelector("[data-filter-grid]");
    if (!toolbar || !grid) {
      return;
    }
    var input = toolbar.querySelector(".local-filter");
    var yearSelect = toolbar.querySelector(".year-filter");
    var typeSelect = toolbar.querySelector(".type-filter");
    var empty = document.querySelector("[data-empty-state]");
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));

    function inYearRange(year, value) {
      if (!value) {
        return true;
      }
      year = Number(year) || 0;
      if (value === "2020") {
        return year >= 2020;
      }
      if (value === "2010") {
        return year >= 2010 && year <= 2019;
      }
      if (value === "2000") {
        return year >= 2000 && year <= 2009;
      }
      if (value === "1990") {
        return year <= 1999;
      }
      return true;
    }

    function apply() {
      var keyword = input ? input.value.trim().toLowerCase() : "";
      var yearValue = yearSelect ? yearSelect.value : "";
      var typeValue = typeSelect ? typeSelect.value : "";
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-year")
        ].join(" ").toLowerCase();
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesYear = inYearRange(card.getAttribute("data-year"), yearValue);
        var matchesType = !typeValue || (card.getAttribute("data-type") || "").indexOf(typeValue) !== -1 || (card.getAttribute("data-genre") || "").indexOf(typeValue) !== -1;
        var show = matchesKeyword && matchesYear && matchesType;
        card.hidden = !show;
        if (show) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [input, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
    apply();
  }

  function createSearchCard(movie) {
    var tags = [movie.region, movie.type, String(movie.year)].map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return [
      "<article class=\"movie-card\">",
      "<a class=\"card-cover\" href=\"" + escapeAttr(movie.url) + "\" aria-label=\"观看 " + escapeAttr(movie.title) + "\">",
      "<img src=\"" + escapeAttr(movie.cover) + "\" alt=\"" + escapeAttr(movie.title) + "\" loading=\"lazy\">",
      "<span class=\"region-badge\">" + escapeHtml(movie.region) + "</span>",
      "</a>",
      "<div class=\"card-body\">",
      "<h3><a href=\"" + escapeAttr(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>",
      "<p>" + escapeHtml(movie.oneLine) + "</p>",
      "<div class=\"card-meta\"><span>" + escapeHtml(movie.genre) + "</span><span>" + escapeHtml(movie.year) + "</span></div>",
      "<div class=\"tag-row small-tags\">" + tags + "</div>",
      "</div>",
      "</article>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function setupGlobalSearch() {
    var input = document.getElementById("global-search");
    var results = document.getElementById("search-results");
    var summary = document.getElementById("search-summary");
    if (!input || !results || typeof MovieSearchData === "undefined") {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function run() {
      var keyword = input.value.trim().toLowerCase();
      if (!keyword) {
        results.innerHTML = "";
        if (summary) {
          summary.textContent = "输入关键词后显示匹配影片。";
        }
        return;
      }
      var matched = MovieSearchData.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          (movie.tags || []).join(" "),
          movie.oneLine
        ].join(" ").toLowerCase();
        return haystack.indexOf(keyword) !== -1;
      }).slice(0, 120);
      results.innerHTML = matched.map(createSearchCard).join("");
      if (summary) {
        summary.textContent = matched.length ? "已显示匹配影片，点击卡片进入详情页。" : "没有找到匹配影片。";
      }
    }

    input.addEventListener("input", run);
    run();
  }

  window.setupMoviePlayer = function (videoId, coverId, source, poster) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    if (!video || !cover || !source) {
      return;
    }
    var attached = false;
    if (poster) {
      video.setAttribute("poster", poster);
    }

    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function play() {
      attach();
      cover.classList.add("is-hidden");
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          video.controls = true;
        });
      }
    }

    cover.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      cover.classList.add("is-hidden");
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupLocalFilters();
    setupGlobalSearch();
  });
})();
