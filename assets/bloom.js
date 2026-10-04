// Explore: a single dot on a hairline. Press it and five threads grow out of it, one page at the end of each; press again
// and they fold back. The links are ordinary <a>s in a list (that list is what shows without JavaScript); this script
// only measures the column, lays the fan out and draws the threads. Open/closed is remembered for the visit.
(function () {
  var nav = document.getElementById('bloom');
  if (!nav) return;
  var seed = nav.querySelector('.bloom-seed'), svg = nav.querySelector('.bloom-threads'), list = nav.querySelector('.bloom-list');
  var items = [].slice.call(list.querySelectorAll('a'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEED_Y = 28, CLOSED_H = 76;
  // the fan hangs below the dot: first page on the far left, last on the far right
  var ANGLES = [164, 127, 90, 53, 16].map(function (d) { return d * Math.PI / 180; });
  var threads = items.map(function () {
    var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('class', 'bloom-thread');
    svg.appendChild(l);
    return l;
  });
  var open = false, openH = 300, settleT;
  try { open = sessionStorage.getItem('bloom') === '1'; } catch (e) {}

  function layout() {
    var w = nav.clientWidth, cx = w / 2, lab = 0;
    items.forEach(function (a) { lab = Math.max(lab, a.querySelector('.bloom-l').offsetWidth); });
    var rx = Math.max(56, Math.min(w / 2 - lab - 26, 230)), ry = w < 560 ? 168 : 150;
    openH = SEED_Y + ry + 52;
    items.forEach(function (a, i) {
      var t = ANGLES[i], x = cx + rx * Math.cos(t), y = SEED_Y + ry * Math.sin(t);
      var side = Math.abs(x - cx) < 4 ? 'below' : x < cx ? 'left' : 'right';
      a.dataset.side = side;
      a.style.setProperty('--x', x.toFixed(1) + 'px'); a.style.setProperty('--y', y.toFixed(1) + 'px');
      a.style.setProperty('--x0', (cx + (x - cx) * 0.55).toFixed(1) + 'px'); a.style.setProperty('--y0', (SEED_Y + (y - SEED_Y) * 0.55).toFixed(1) + 'px');
      var L = Math.hypot(x - cx, y - SEED_Y), th = threads[i];
      th.setAttribute('x1', cx); th.setAttribute('y1', SEED_Y); th.setAttribute('x2', x.toFixed(1)); th.setAttribute('y2', y.toFixed(1));
      th.style.strokeDasharray = L.toFixed(1); th.style.setProperty('--len', L.toFixed(1));
    });
    nav.style.setProperty('--h', (open ? openH : CLOSED_H) + 'px');
  }

  function set(next, animate) {
    open = next;
    clearTimeout(settleT); nav.classList.remove('is-settled');
    if (open) settleT = setTimeout(function () { nav.classList.add('is-settled'); }, animate ? 1000 : 0);
    if (!animate) nav.classList.add('is-instant');
    nav.classList.toggle('is-open', open);
    seed.setAttribute('aria-expanded', open);
    list.inert = !open;
    nav.style.setProperty('--h', (open ? openH : CLOSED_H) + 'px');
    try { sessionStorage.setItem('bloom', open ? '1' : '0'); } catch (e) {}
    if (!animate) requestAnimationFrame(function () { requestAnimationFrame(function () { nav.classList.remove('is-instant'); }); });
  }

  // hovering or focusing one page brings its thread forward and lets the others recede
  items.forEach(function (a, i) {
    function on() { nav.classList.add('is-dim'); a.classList.add('is-on'); threads[i].classList.add('is-on'); }
    function off() { nav.classList.remove('is-dim'); a.classList.remove('is-on'); threads[i].classList.remove('is-on'); }
    a.addEventListener('pointerenter', on); a.addEventListener('pointerleave', off);
    a.addEventListener('focus', on); a.addEventListener('blur', off);
  });
  seed.addEventListener('click', function (e) {
    set(!open, !reduce);
    if (open && e.detail === 0) items[0].focus({ preventScroll: true });   // opened from the keyboard: go straight in
  });
  nav.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { set(false, !reduce); seed.focus(); }
  });

  seed.hidden = false;
  nav.classList.add('is-live');
  layout();
  set(open, false);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 100); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);   // label widths settle once Inter loads
})();
