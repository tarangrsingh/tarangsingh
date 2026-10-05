// Home links row: magnetic buttons. With a mouse each icon leans toward the cursor as it approaches; a press gives a
// squish-and-pop and a ring in the button's brand colour.
(function () {
  var links = document.querySelectorAll('.links a');
  if (!links.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  links.forEach(function (a) {
    if (fine) {
      a.addEventListener('pointermove', function (e) {
        var r = a.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        a.classList.add('is-near');
        a.style.setProperty('--mx', (dx * 0.3).toFixed(1) + 'px'); a.style.setProperty('--my', (dy * 0.3).toFixed(1) + 'px');
      });
      a.addEventListener('pointerleave', function () {
        a.classList.remove('is-near'); a.style.removeProperty('--mx'); a.style.removeProperty('--my');
      });
    }
    a.addEventListener('pointerdown', function () {
      a.classList.remove('is-pop'); void a.offsetWidth; a.classList.add('is-pop');
    });
    a.addEventListener('animationend', function (e) { if (e.pseudoElement === '::after' || e.animationName === 'link-ring') a.classList.remove('is-pop'); });
  });
})();

// Explore rows: the light follows the pointer along each row; icons play their animation once as the list comes into
// view (one after another), and on touch a tap plays it before the page changes.
(function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('.home .tab-card'));
  if (!rows.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function wake(row, ms) {
    row.classList.remove('is-wake'); void row.offsetWidth; row.classList.add('is-wake');
    clearTimeout(row._wake); row._wake = setTimeout(function () { row.classList.remove('is-wake'); }, ms || 1300);
  }
  rows.forEach(function (row) {
    var pend = null, raf = 0;
    row.addEventListener('pointermove', function (e) {
      pend = e; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var r = row.getBoundingClientRect();
        row.style.setProperty('--mx', (pend.clientX - r.left).toFixed(0) + 'px'); row.style.setProperty('--my', (pend.clientY - r.top).toFixed(0) + 'px');
      });
    }, { passive: true });
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      var r = row.getBoundingClientRect();
      row.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); row.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      wake(row, 900);
    });
  });
  var grid = document.querySelector('.home .tab-grid');
  if (grid && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, ob) {
      if (!en[0].isIntersecting) return; ob.disconnect();
      rows.forEach(function (row, i) {
        setTimeout(function () { row.style.setProperty('--mx', '40px'); row.style.setProperty('--my', '50%'); wake(row, 1100); }, 350 + i * 140);
      });
    }, { threshold: 0.5 }).observe(grid);
  }
})();
