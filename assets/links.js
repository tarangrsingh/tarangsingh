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
  function playAll(start) {
    rows.forEach(function (row, i) {
      setTimeout(function () { row.style.setProperty('--mx', '40px'); row.style.setProperty('--my', '50%'); wake(row, 1100); }, start + i * 140);
    });
  }
  var pop = grid && grid.closest('.sb-panel');
  if (pop) pop.addEventListener('sb-open', function () { playAll(420); }, { once: true });   // in the Explore panel: the first time it opens, once the rows have arrived
  else if (grid && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, ob) {
      if (!en[0].isIntersecting) return; ob.disconnect(); playAll(350);
    }, { threshold: 0.5 }).observe(grid);
  }
})();

// Updates: anything posted since the reader's last visit gets a small dot beside its date (kept for the rest of that
// visit, so it does not vanish on the next page), and each date shows in full, in the reader's own date format, on
// hover: 07/10 is 7 October here but reads as July 10 in the US. A first visit marks nothing, since all of it is new.
(function () {
  var entries = document.querySelectorAll('.home .update-entry');
  if (!entries.length) return;
  var base = null, newest = '';
  try { base = sessionStorage.getItem('updates-base'); if (base === null) { base = localStorage.getItem('updates-seen') || ''; sessionStorage.setItem('updates-base', base); } } catch (e) {}
  var full = window.Intl && new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  Array.prototype.forEach.call(entries, function (en) {
    var el = en.querySelector('.update-date'), m = el && /(\d{2})\/(\d{2})\/(\d{4})/.exec(el.textContent);
    if (!m) return;
    var iso = m[3] + '-' + m[2] + '-' + m[1];
    if (iso > newest) newest = iso;
    if (full) el.title = full.format(new Date(+m[3], +m[2] - 1, +m[1]));
    if (base && iso > base) el.insertAdjacentHTML('beforeend', '<span class="update-new"><span class="sr-only">New since your last visit</span></span>');
  });
  try { if (newest > (localStorage.getItem('updates-seen') || '')) localStorage.setItem('updates-seen', newest); } catch (e) {}
})();

// Updates on narrow screens: the squares scroll sideways, so the right edge fades out while there is more to see,
// and the fade lifts once the reader reaches the last card.
(function () {
  var list = document.querySelector('.home .updates-list');
  if (!list) return;
  function edge() {
    var more = list.scrollWidth - list.clientWidth - list.scrollLeft > 4;
    list.classList.toggle('has-more', more);
  }
  list.addEventListener('scroll', edge, { passive: true });
  window.addEventListener('resize', edge);
  edge();
})();
