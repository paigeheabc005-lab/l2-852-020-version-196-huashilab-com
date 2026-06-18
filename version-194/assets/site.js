(function() {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var navPanel = document.querySelector('[data-nav-panel]');

  if (menuButton && navPanel) {
    menuButton.addEventListener('click', function() {
      navPanel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-index]'));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        var index = Number(dot.getAttribute('data-hero-index'));
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function() {
        showSlide(current + 1);
      }, 5200);
    }
  }

  document.querySelectorAll('[data-filter-area]').forEach(function(area) {
    var input = area.querySelector('[data-filter-input]');
    var list = area.parentElement.querySelector('[data-filter-list]');
    var buttons = Array.prototype.slice.call(area.querySelectorAll('[data-filter-value]'));
    var activeCategory = 'all';

    function applyFilter() {
      if (!list) {
        return;
      }

      var keyword = input ? input.value.trim().toLowerCase() : '';
      var items = Array.prototype.slice.call(list.querySelectorAll('.filter-item'));

      items.forEach(function(item) {
        var text = item.getAttribute('data-filter-text') || '';
        var category = item.getAttribute('data-filter-category') || '';
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchCategory = activeCategory === 'all' || category === activeCategory;
        item.classList.toggle('is-hidden', !(matchKeyword && matchCategory));
      });
    }

    if (input) {
      input.addEventListener('input', applyFilter);
    }

    buttons.forEach(function(button) {
      button.addEventListener('click', function() {
        buttons.forEach(function(item) {
          item.classList.remove('is-active');
        });
        button.classList.add('is-active');
        activeCategory = button.getAttribute('data-filter-value') || 'all';
        applyFilter();
      });
    });
  });
})();
