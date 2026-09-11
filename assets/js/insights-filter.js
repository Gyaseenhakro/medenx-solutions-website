/* Category filtering for the Insights index.
   Progressive enhancement: without JS every card stays visible, so no content
   is ever hidden behind a script that failed to load. */
(function () {
  var strip = document.querySelector('.category-strip');
  var grid = document.getElementById('article-grid');
  var status = document.getElementById('filter-status');
  if (!strip || !grid) return;

  var chips = strip.querySelectorAll('.category-chip');
  var cards = grid.querySelectorAll('.article-card');

  function apply(filter) {
    var shown = 0;

    cards.forEach(function (card) {
      var match = filter === 'all' || card.getAttribute('data-category') === filter;
      card.hidden = !match;
      if (match) shown++;
    });

    chips.forEach(function (chip) {
      var isActive = chip.getAttribute('data-filter') === filter;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (status) {
      if (shown === 0) {
        status.textContent = 'No articles published in this category yet.';
      } else if (filter === 'all') {
        status.textContent = 'Showing all ' + shown + ' articles.';
      } else {
        status.textContent = 'Showing ' + shown + ' article' + (shown === 1 ? '' : 's') + ' in ' + filter + '.';
      }
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      apply(chip.getAttribute('data-filter'));
    });
  });

  apply('all');
})();
