(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header gains depth once the page has scrolled beneath it.
  var header = document.querySelector('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Theme switch as a circular reveal from the toggle button. The page's own click handler still does the real work:
  // we intercept the click, run a view transition, and re-fire the same click inside it.
  var btn = document.getElementById('theme-toggle');
  if (btn && !reduce && typeof document.startViewTransition === 'function') {
    var busy = false;
    btn.addEventListener('click', function (e) {
      if (busy) return;                       // the re-fired click falls through to the original handler
      e.stopImmediatePropagation();
      busy = true;
      var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.documentElement.classList.add('theme-vt');
      var vt = document.startViewTransition(function () { btn.click(); });
      vt.ready.then(function () {
        document.documentElement.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 650, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
      vt.finished.finally(function () { busy = false; document.documentElement.classList.remove('theme-vt'); });
    }, true);
  }
})();
