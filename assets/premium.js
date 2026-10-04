(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header gains depth once the page has scrolled beneath it.
  var header = document.querySelector('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Theme switch. The page's own click handler still does the real work (toggling html.light-mode); we wrap it.
  // While the theme flips, every CSS colour transition is switched off (html.theme-switching), so the page lands on its
  // final colours in one frame instead of fading element by element, which read as a washed-out blink. Where view
  // transitions exist, the new theme is then revealed as a circle growing out of the toggle button.
  var btn = document.getElementById('theme-toggle');
  if (btn) {
    var root = document.documentElement;
    var canVT = !reduce && typeof document.startViewTransition === 'function';
    var busy = false, refire = false;
    var settle = function () {                 // keep transitions off until the new colours have been painted
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('theme-switching'); }); });
    };
    btn.addEventListener('click', function (e) {
      if (refire) return;                      // our own re-fired click: let the original handler toggle the theme
      if (!canVT) { root.classList.add('theme-switching'); settle(); return; }   // instant, clean switch
      e.stopImmediatePropagation();
      if (busy) return;                        // ignore clicks while a reveal is still running
      busy = true;
      var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('theme-vt', 'theme-switching');
      var vt = document.startViewTransition(function () { refire = true; try { btn.click(); } finally { refire = false; } });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 600, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
      vt.finished.finally(function () { busy = false; root.classList.remove('theme-vt'); settle(); });
    }, true);
  }
})();
