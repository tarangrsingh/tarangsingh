// Side graph: thin horizontal lines along the y-axis whose lengths trace a smooth bell curve that peaks at the scroll
// position and swells with scroll speed. It doubles as a scrollbar: click to glide, drag to scrub (mouse or touch),
// or focus it and use the arrow / Page / Home / End keys. Springs keep every change smooth.
(function () {
  var root = document.getElementById('scrollgraph');
  var linesG = document.getElementById('sg-lines');
  if (!root || !linesG) return;
  var dot = root.querySelector('.sg-dot');
  var tip = root.querySelector('.sg-readout');
  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LINES = 64, base = 8, sigma = 100, step = 1000 / LINES, ls = [];
  for (var li = 0; li < LINES; li++) {
    var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'), yy = (step * (li + 0.5)).toFixed(1);
    ln.setAttribute('class', 'sg-line'); ln.setAttribute('x1', 60 - base); ln.setAttribute('x2', 60 - base - 3);
    ln.setAttribute('y1', yy); ln.setAttribute('y2', yy); linesG.appendChild(ln); ls.push(ln);
  }

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function maxScroll() { return Math.max(html.scrollHeight - window.innerHeight, 0); }
  function fracNow() { var m = maxScroll(); return m > 0 ? clamp(window.scrollY / m, 0, 1) : 0; }

  var peak = 0, peakV = 0, amp = 24, ampV = 0, peakT = 0, ampT = 24, raf = 0, last = 0;
  function draw() {
    for (var i = 0; i < LINES; i++) {
      var dy = step * (i + 0.5) - peak, g = Math.exp(-(dy * dy) / (2 * sigma * sigma));
      ls[i].setAttribute('x2', (60 - base - 3 - amp * g).toFixed(2));
      ls[i].style.opacity = (0.3 + 0.7 * g).toFixed(2);
    }
    var pct = (peak / 10).toFixed(2) + '%';
    if (dot) dot.style.top = pct;
    if (tip) tip.style.top = pct;
  }
  function spring(x, v, target, w, dt) {
    var e = Math.exp(-w * dt), d = x - target, j = v + w * d;
    return [target + (d + j * dt) * e, (v - j * w * dt) * e];
  }
  function frame(t) {
    var dt = clamp((t - last) / 1000, 0, 0.05), a, b;
    last = t; a = spring(peak, peakV, peakT, 22, dt); b = spring(amp, ampV, ampT, 14, dt);
    peak = a[0]; peakV = a[1]; amp = b[0]; ampV = b[1]; draw();
    raf = (Math.abs(peak - peakT) > 0.3 || Math.abs(peakV) > 0.5 || Math.abs(amp - ampT) > 0.05 || Math.abs(ampV) > 0.05) ? requestAnimationFrame(frame) : 0;
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  var dragging = false, lastY = window.scrollY, lastT = performance.now(), idleTimer = null;
  function setActive(on) { root.classList.toggle('is-active', on); }

  function syncFromScroll() {
    var y = window.scrollY, m = maxScroll(), frac = fracNow(), pct = Math.round(frac * 100);
    var scrollable = m > 2;
    root.classList.toggle('is-static', !scrollable);
    root.tabIndex = scrollable ? 0 : -1;
    root.setAttribute('aria-valuenow', pct);
    root.setAttribute('aria-valuetext', pct + '% down the page');
    if (tip) tip.textContent = pct + '%';
    peakT = frac * 1000;
    if (reduceMotion) { peak = peakT; amp = 24; draw(); return; }
    var now = performance.now(), v = Math.abs(y - lastY) / Math.max(now - lastT, 1);
    lastY = y; lastT = now; ampT = Math.min(24 + v * 46, 46);
    setActive(true); clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { if (!dragging) setActive(false); ampT = 24; start(); }, 700);
    start();
  }

  // Scroll to a fraction of the page. While scrubbing we must bypass the page's CSS smooth scrolling, otherwise the
  // page lags behind the pointer and fights the graph.
  function scrollToFrac(f, smooth) {
    var top = f * maxScroll();
    if (smooth && !reduceMotion) { window.scrollTo({ top: top, behavior: 'smooth' }); return; }
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, top);
    html.style.scrollBehavior = '';
  }
  function fracFromPointer(e) {
    var r = root.getBoundingClientRect();
    return clamp((e.clientY - r.top) / r.height, 0, 1);   // top of the graph = top of the page
  }

  var moved = false, downY = 0;
  root.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (root.classList.contains('is-static')) return;
    dragging = true; moved = false; downY = e.clientY;
    try { root.setPointerCapture(e.pointerId); } catch (err) {}
    root.classList.add('is-dragging'); setActive(true);
    scrollToFrac(fracFromPointer(e), true);             // a plain click glides there
    e.preventDefault();
  });
  root.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    if (!moved && Math.abs(e.clientY - downY) > 3) moved = true;
    if (moved) scrollToFrac(fracFromPointer(e), false);  // dragging scrubs instantly
  });
  function release(e) {
    if (!dragging) return;
    dragging = false; root.classList.remove('is-dragging');
    try { root.releasePointerCapture(e.pointerId); } catch (err) {}
    clearTimeout(idleTimer); idleTimer = setTimeout(function () { setActive(false); ampT = 24; start(); }, 700);
  }
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('lostpointercapture', release);

  root.addEventListener('keydown', function (e) {
    var vh = window.innerHeight, y = window.scrollY, m = maxScroll(), t = null;
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': t = y + 80; break;
      case 'ArrowUp': case 'ArrowLeft': t = y - 80; break;
      case 'PageDown': t = y + vh * 0.9; break;
      case 'PageUp': t = y - vh * 0.9; break;
      case 'Home': t = 0; break;
      case 'End': t = m; break;
    }
    if (t === null) return;
    e.preventDefault();
    window.scrollTo({ top: clamp(t, 0, m), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  var tick = null;
  window.addEventListener('resize', syncFromScroll);
  window.addEventListener('scroll', function () {
    if (!tick) tick = requestAnimationFrame(function () { syncFromScroll(); tick = null; });
  }, { passive: true });
  // The page can grow after load (fonts, images, expanding timeline items): keep the graph honest.
  if ('ResizeObserver' in window) new ResizeObserver(function () { syncFromScroll(); }).observe(document.body);

  peak = peakT = fracNow() * 1000; draw(); syncFromScroll();
  setActive(false);
})();
