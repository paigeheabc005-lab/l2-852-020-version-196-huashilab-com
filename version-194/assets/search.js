(function() {
  var input = document.getElementById('searchInput');
  var category = document.getElementById('searchCategory');
  var results = document.getElementById('searchResults');
  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get('q') || '';

  function createCard(movie) {
    var tags = [movie.category, movie.region].concat(movie.tags || []).slice(0, 4).map(function(tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return '<article class="movie-card">' +
      '<a class="movie-cover" href="' + movie.url + '" aria-label="' + escapeHtml(movie.title) + '">' +
      '<img src="' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
      '<span class="cover-badge">' + escapeHtml(movie.category) + '</span>' +
      '<span class="cover-views">' + Number(movie.views || 0).toLocaleString() + '</span>' +
      '</a>' +
      '<div class="movie-card-body">' +
      '<h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>' +
      '<p>' + escapeHtml(movie.oneLine) + '</p>' +
      '<div class="movie-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>' +
      '<div class="tag-list">' + tags + '</div>' +
      '</div>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function(char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function render() {
    if (!results) {
      return;
    }

    var query = input ? input.value.trim().toLowerCase() : '';
    var selected = category ? category.value : 'all';
    var filtered = SEARCH_INDEX.filter(function(movie) {
      var text = [movie.title, movie.region, movie.type, movie.genre, movie.category, movie.oneLine].concat(movie.tags || []).join(' ').toLowerCase();
      var matchText = !query || text.indexOf(query) !== -1;
      var matchCategory = selected === 'all' || movie.category === selected;
      return matchText && matchCategory;
    }).slice(0, 80);

    if (!filtered.length) {
      results.innerHTML = '<div class="empty-state">没有找到相关影片</div>';
      return;
    }

    results.innerHTML = filtered.map(createCard).join('');
  }

  if (input) {
    input.value = initialQuery;
    input.addEventListener('input', render);
  }

  if (category) {
    category.addEventListener('change', render);
  }

  render();
})();
