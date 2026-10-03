// Research page: a little VNA screen in the "Currently" card. It draws a transmission sweep |S21|(f) of a notch-type
// microwave resonator (illustrative, not measured data): 1 - (Q/Qc)e^{iφ}/(1 + 2iQ(f-f0)/f0), with a touch of noise.
// The trace sweeps in when it scrolls into view, like an instrument taking a reading; move a pointer (or drag a finger)
// across it to ride a marker along the curve. Idle otherwise; static for reduced motion.
(function () {
  var host = document.querySelector('.vna');
  if (!host) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg', W = 400, H = 110, PAD = 6, N = 220;
  var svg = host.querySelector('svg'), trace = host.querySelector('.vna-trace'), ghost = host.querySelector('.vna-ghost');
  var head = host.querySelector('.vna-head'), mk = host.querySelector('.vna-mk'), vx = host.querySelector('.vna-vx'), hx = host.querySelector('.vna-hx');

  // grid
  var grid = host.querySelector('.vna-grid');
  for (var gx = 1; gx < 10; gx++) grid.appendChild(line(gx * W / 10, 0, gx * W / 10, H));
  for (var gy = 1; gy < 5; gy++) grid.appendChild(line(0, gy * H / 5, W, gy * H / 5));
  function line(x1, y1, x2, y2) { var l = document.createElementNS(NS, 'line'); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); return l; }

  var A = 0.9, PHI = 0.28, G = 0.032, DB0 = 7, DB1 = -23;
  function s21db(x) {                       // x in [0,1] across the span, resonance at 0.5
    var u = (x - 0.5) / G, d = 1 + u * u;
    var re = 1 - A * (Math.cos(PHI) + u * Math.sin(PHI)) / d, im = A * (u * Math.cos(PHI) - Math.sin(PHI)) / d;
    return 10 * Math.log10(re * re + im * im);
  }
  function ypx(db) { return PAD + (DB0 - db) / (DB0 - DB1) * (H - 2 * PAD); }
  var clean = [], noisy = [];
  for (var i = 0; i <= N; i++) clean.push(ypx(s21db(i / N)));
  function reroll() { noisy = clean.map(function (y) { return y + (Math.random() - 0.5) * 1.6; }); }
  function pathTo(arr, upto) {
    var n = Math.max(1, Math.min(N, Math.floor(upto))), d = 'M0,' + arr[0].toFixed(1);
    for (var i = 1; i <= n; i++) d += 'L' + (i / N * W).toFixed(1) + ',' + arr[i].toFixed(1);
    return d;
  }
  reroll();
  ghost.setAttribute('d', pathTo(noisy, N));
  trace.setAttribute('d', pathTo(noisy, N));
  if (calm) return;

  // marker
  var mx = null, mxShown = 0.5, mkOn = false;
  function yAt(x) { var f = x * N, i = Math.floor(f), t = f - i; return i >= N ? clean[N] : clean[i] * (1 - t) + clean[i + 1] * t; }
  function toX(e) { var r = svg.getBoundingClientRect(); return Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1); }
  host.addEventListener('pointermove', function (e) { mx = toX(e); if (!mkOn) { mxShown = mx; } mkOn = true; host.classList.add('is-probing'); kick(); });
  host.addEventListener('pointerdown', function (e) { mx = toX(e); mxShown = mx; mkOn = true; host.classList.add('is-probing'); kick(); });
  host.addEventListener('pointerleave', function () { mkOn = false; host.classList.remove('is-probing'); });

  // Sweep: the trace is drawn once, and revealed left to right through a clip rectangle (one attribute per frame, no
  // path rebuilding, no filters). It sweeps when it first scrolls into view and again on re-entry, then sits still,
  // so the page is idle when nobody is looking at it.
  var clip = document.createElementNS(NS, 'clipPath'), rect = document.createElementNS(NS, 'rect');
  clip.id = 'vna-clip'; rect.setAttribute('x', -2); rect.setAttribute('y', -10); rect.setAttribute('height', H + 20); rect.setAttribute('width', 0);
  clip.appendChild(rect); svg.insertBefore(clip, svg.firstChild); trace.setAttribute('clip-path', 'url(#vna-clip)');
  var SWEEP_S = 1.8, sweep = -1, raf = 0, last = 0, lastSweep = -1e9;
  function frame(t) {
    var dt = Math.min(Math.max((t - last) / 1000, 0), 0.05), busy = false; last = t;
    if (sweep >= 0) {
      sweep = Math.min(sweep + dt / SWEEP_S, 1);
      var x = sweep * W, i = Math.round(sweep * N);
      rect.setAttribute('width', (x + 2).toFixed(1));
      head.setAttribute('cx', x.toFixed(1)); head.setAttribute('cy', noisy[i].toFixed(1));
      if (sweep >= 1) { sweep = -1; host.classList.remove('is-sweeping'); ghost.setAttribute('d', trace.getAttribute('d')); }
      else busy = true;
    }
    if (mkOn && mx !== null) {
      var k = 1 - Math.exp(-dt / 0.06);
      mxShown += (mx - mxShown) * k;
      var px = mxShown * W, py = yAt(mxShown);
      mk.setAttribute('cx', px.toFixed(1)); mk.setAttribute('cy', py.toFixed(1));
      vx.setAttribute('x1', px.toFixed(1)); vx.setAttribute('x2', px.toFixed(1));
      hx.setAttribute('y1', py.toFixed(1)); hx.setAttribute('y2', py.toFixed(1));
      if (Math.abs(mx - mxShown) > 0.0005) busy = true;
    }
    raf = busy ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function startSweep() {
    var now = performance.now(); if (now - lastSweep < 6000 || sweep >= 0) return;
    lastSweep = now; reroll(); trace.setAttribute('d', pathTo(noisy, N)); rect.setAttribute('width', 0);
    sweep = 0; host.classList.add('is-sweeping'); kick();
  }
  new IntersectionObserver(function (en) { if (en[0].isIntersecting) startSweep(); }, { threshold: 0.5 }).observe(host);
})();
