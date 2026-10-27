// Research page: a fluxonium qubit, solved live. A small Josephson junction (E_J) shunted by a capacitance (E_C) and a
// superinductance (E_L, a long array of larger junctions), with external flux Φ_ext through the loop:
//   H = 4 E_C n^2 - E_J cos(φ - 2π Φ_ext/Φ0) + E_L φ^2 / 2,   n = -i d/dφ
// The Hamiltonian is discretised on a phase grid (finite differences, so it is tridiagonal); the lowest levels come
// from Sturm-sequence bisection and the wavefunctions from inverse iteration. The plot shows the potential, the levels,
// and the probability density of the superposition (|0> + |1>)/√2, which tunnels coherently between the two wells at
// f01 (slowed down to be seen). The flux drifts slowly around Φ0/2, the sweet spot where the wells are symmetric and
// f01 is at its minimum; the inset traces f01(Φ_ext). Energies in GHz (E/h). Reduced motion: drawn once, at Φ0/2.
(function () {
  var fig = document.querySelector('.flx');
  if (!fig) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EJ = 4.0, EC = 1.0, EL = 0.5;                       // GHz: the usual fluxonium regime, E_L << E_J, E_J/E_C of a few
  var N = 600, SPAN = 6 * Math.PI, VIEW = 2.4 * Math.PI;  // grid over ±6π; the plot shows ±2.4π
  var hstep = 2 * SPAN / (N - 1), T = 4 * EC / (hstep * hstep);
  var X = new Float64Array(N); for (var i = 0; i < N; i++) X[i] = -SPAN + i * hstep;

  function potential(fx, out) { var a = 2 * Math.PI * fx; for (var i = 0; i < N; i++) out[i] = 0.5 * EL * X[i] * X[i] - EJ * Math.cos(X[i] - a); return out; }
  // eigenvalues of the tridiagonal H (diagonal 2T + U, off-diagonal -T) below which j levels lie: Sturm count + bisection
  function levels(U, k) {
    var lo = Infinity, hi = -Infinity, E = [];
    for (var i = 0; i < N; i++) { lo = Math.min(lo, U[i]); hi = Math.max(hi, U[i]); }
    hi = lo + 40;                                          // the lowest few levels sit far below this
    function count(lam) { var c = 0, q = 2 * T + U[0] - lam; if (q < 0) c++; for (var i = 1; i < N; i++) { q = 2 * T + U[i] - lam - T * T / (q || 1e-300); if (q < 0) c++; } return c; }
    for (var j = 0; j < k; j++) { var a = lo, b = hi; for (var it = 0; it < 44; it++) { var m = (a + b) / 2; if (count(m) > j) b = m; else a = m; } E.push((a + b) / 2); }
    return E;
  }
  // eigenvector for eigenvalue E: inverse iteration, (H - E' I) y = x solved with the Thomas algorithm
  var cp = new Float64Array(N), dp = new Float64Array(N);
  function vector(U, E) {
    var s = E + 1e-7, y = new Float64Array(N).fill(1);
    for (var it = 0; it < 3; it++) {
      var b0 = 2 * T + U[0] - s; cp[0] = -T / b0; dp[0] = y[0] / b0;
      for (var i = 1; i < N; i++) { var m = 2 * T + U[i] - s + T * cp[i - 1]; cp[i] = -T / m; dp[i] = (y[i] + T * dp[i - 1]) / m; }
      y[N - 1] = dp[N - 1]; for (var i2 = N - 2; i2 >= 0; i2--) y[i2] = dp[i2] - cp[i2] * y[i2 + 1];
      var nrm = 0; for (var i3 = 0; i3 < N; i3++) nrm += y[i3] * y[i3]; nrm = Math.sqrt(nrm * hstep); for (var i4 = 0; i4 < N; i4++) y[i4] /= nrm;
    }
    return y;
  }
  function solve(fx) {
    var U = potential(fx, new Float64Array(N)), E = levels(U, 3), p0 = vector(U, E[0]), p1 = vector(U, E[1]);
    var s0 = 0, s1 = 0; for (var i = 0; i < N; i++) { s0 += p0[i]; s1 += p1[i] * X[i]; }
    if (s0 < 0) for (var a = 0; a < N; a++) p0[a] = -p0[a];          // fix signs so the picture never jumps:
    if (s1 > 0) for (var b = 0; b < N; b++) p1[b] = -p1[b];          // ψ0 positive, ψ1 positive in the left well
    return { U: U, E: E, p0: p0, p1: p1 };
  }

  // the f01(Φ_ext) curve for the inset, once
  // the spectrum for the inset, once: f01, f12, f02 against Φ_ext/Φ0 (what two-tone spectroscopy measures); the same pass
  // fixes the energy axis so the plot holds every flux the visitor can dial in
  var SPEC = [], FMAX = 0, UMIN = Infinity, EMAX = -Infinity;
  for (var k = 0; k <= 100; k++) {
    var Uk = potential(k / 100, new Float64Array(N)), E = levels(Uk, 3);
    SPEC.push([E[1] - E[0], E[2] - E[1], E[2] - E[0]]); FMAX = Math.max(FMAX, E[2] - E[0]); EMAX = Math.max(EMAX, E[2]);
    for (var u = 0; u < N; u++) if (Math.abs(X[u]) <= VIEW) UMIN = Math.min(UMIN, Uk[u]);
  }

  var main = fig.querySelector('.flx-main'), spec = fig.querySelector('.flx-spec'), cm = main.getContext('2d'), cs = spec.getContext('2d');
  var readPhi = fig.querySelector('[data-k="phi"]'), readF = fig.querySelector('[data-k="f01"]');
  var ref = solve(0.5), Y0 = UMIN - 0.6, Y1 = EMAX + 1.1, PEAK = 0;
  [0, 0.25, 0.5].forEach(function (f) { var s = f === 0.5 ? ref : solve(f); for (var q = 0; q < N; q++) PEAK = Math.max(PEAK, s.p0[q] * s.p0[q]); });

  var W = 0, H = 0, SW = 0, SH = 0, pal = null;
  function palette() { var c = getComputedStyle(document.documentElement); return { hi: c.getPropertyValue('--copper-light').trim(), lo: c.getPropertyValue('--copper').trim(), mu: c.getPropertyValue('--muted').trim() }; }
  function fit(cv, ctx) { var dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return [w, h]; }
  function size() { var a = fit(main, cm), b = fit(spec, cs); W = a[0]; H = a[1]; SW = b[0]; SH = b[1]; pal = palette(); }
  function px(phi) { return (phi + VIEW) / (2 * VIEW) * W; }
  function py(e) { return H - 18 - (e - Y0) / (Y1 - Y0) * (H - 26); }

  function draw(s, fx, theta) {
    var c = cm; c.clearRect(0, 0, W, H);
    // axis ticks at -2π … 2π
    c.font = '11px Inter, sans-serif'; c.textAlign = 'center'; c.fillStyle = pal.mu; c.strokeStyle = pal.mu; c.globalAlpha = 0.5;
    [-2, -1, 0, 1, 2].forEach(function (m) { var x = px(m * Math.PI); c.beginPath(); c.moveTo(x, H - 16); c.lineTo(x, H - 12); c.stroke(); c.fillText(m === 0 ? '0' : (m < 0 ? '−' : '') + (Math.abs(m) === 1 ? '' : '2') + 'π', x, H - 1); });
    c.globalAlpha = 1; c.textAlign = 'right'; c.fillText('φ', W - 2, H - 1);
    // energy levels |0>, |1>, |2>
    c.setLineDash([3, 4]); c.lineWidth = 1;
    s.E.forEach(function (e, j) { var y = py(e); c.globalAlpha = j === 2 ? 0.35 : 0.6; c.strokeStyle = pal.mu; c.beginPath(); c.moveTo(0, y); c.lineTo(W - 22, y); c.stroke();
      var dy = j === 1 && py(s.E[0]) - y < 12 ? -6 : j === 0 && py(s.E[0]) - py(s.E[1]) < 12 ? 9 : 4;   // |0>, |1> sit f01 apart: stagger the labels
      c.globalAlpha = 0.8; c.fillStyle = pal.mu; c.textAlign = 'left'; c.fillText('|' + j + '⟩', W - 20, y + dy); });
    c.setLineDash([]); c.globalAlpha = 1;
    // probability density of (|0> + e^{-iθ}|1>)/√2, drawn on the mean level of the pair
    var base = py((s.E[0] + s.E[1]) / 2), amp = (H - 26) * 0.42 / (2 * PEAK), ct = Math.cos(theta);   // fully in one well ≈ 2× the ground-state peak
    c.beginPath(); c.moveTo(0, base);
    for (var i = 0; i < N; i++) { if (Math.abs(X[i]) > VIEW) continue; var d = 0.5 * (s.p0[i] * s.p0[i] + s.p1[i] * s.p1[i]) + s.p0[i] * s.p1[i] * ct; c.lineTo(px(X[i]), base - d * amp); }
    c.lineTo(W, base); c.closePath();
    var g = c.createLinearGradient(0, base - (H - 26) * 0.42, 0, base); g.addColorStop(0, pal.hi); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.32; c.fillStyle = g; c.fill(); c.globalAlpha = 0.95; c.strokeStyle = pal.hi; c.lineWidth = 1.4; c.stroke();
    // the potential
    c.beginPath(); var first = true;
    for (var i2 = 0; i2 < N; i2++) { if (Math.abs(X[i2]) > VIEW) continue; var y2 = py(s.U[i2]); c[first ? 'moveTo' : 'lineTo'](px(X[i2]), y2); first = false; }
    c.globalAlpha = 1; c.strokeStyle = pal.lo; c.lineWidth = 1.8; c.stroke();

    // inset: the spectrum f01, f12, f02 against Φ_ext/Φ0, with the current flux marked on each (drag it to tune)
    var t = cs; t.clearRect(0, 0, SW, SH);
    var ix = function (f) { return 22 + f * (SW - 30); }, iy = function (v) { return SH - 16 - v / FMAX * (SH - 26); };
    var now = [s.E[1] - s.E[0], s.E[2] - s.E[1], s.E[2] - s.E[0]], NAME = ['f\u2080\u2081', 'f\u2081\u2082', 'f\u2080\u2082'], ALPHA = [0.95, 0.55, 0.4];
    t.globalAlpha = 0.25; t.strokeStyle = pal.mu; t.lineWidth = 1; t.beginPath(); t.moveTo(ix(fx), 12); t.lineTo(ix(fx), SH - 16); t.stroke();
    t.font = '10px Inter, sans-serif';
    [2, 1, 0].forEach(function (j) {
      t.globalAlpha = ALPHA[j]; t.strokeStyle = j ? pal.lo : pal.hi; t.lineWidth = j ? 1.1 : 1.4; t.beginPath();
      SPEC.forEach(function (v, k) { t[k ? 'lineTo' : 'moveTo'](ix(k / 100), iy(v[j])); }); t.stroke();
      t.fillStyle = j ? pal.lo : pal.hi; t.textAlign = 'right'; t.fillText(NAME[j], 19, iy(SPEC[0][j]) + 4);
      t.globalAlpha = j ? 0.8 : 1; t.beginPath(); t.arc(ix(fx), iy(now[j]), j ? 2.6 : 3.4, 0, 7); t.fill();
    });
    t.globalAlpha = 1; t.fillStyle = pal.mu; t.textAlign = 'center';
    t.fillText('0', ix(0), SH - 2); t.fillText('\u00bd', ix(0.5), SH - 2); t.fillText('1', ix(1), SH - 2);
    t.textAlign = 'right'; t.fillText('\u03a6\u2091\u2093\u209c/\u03a6\u2080', SW - 4, 10);
  }

  var fx = 0.5, theta = 0, last = 0, start = 0, raf = 0, live = false, cur = ref, tick = 0, solvedAt = 0.5, manual = null, keyHold = 0;
  function read(s) {
    readPhi.textContent = fx.toFixed(3); spec.setAttribute('aria-valuenow', fx.toFixed(3));
    var f = (s.E[1] - s.E[0]) * 1000; readF.textContent = f < 1000 ? f.toFixed(0) + ' MHz' : (f / 1000).toFixed(2) + ' GHz';
  }
  function frame(t) {
    var dt = Math.min(Math.max((t - last) / 1000, 0), 0.05); last = t;
    var drift = 0.5 + 0.03 * Math.sin((t - start) / 1000 * 2 * Math.PI / 26);  // a slow drift around the sweet spot
    if (manual !== null) fx = manual;                                            // set by the visitor
    else fx += (drift - fx) * (1 - Math.exp(-dt / 0.6));                         // otherwise glide back to the drift
    if (Math.abs(fx - solvedAt) > 4e-4) { cur = solve(fx); solvedAt = fx; }   // re-solve only when the flux has moved
    var f01 = cur.E[1] - cur.E[0];
    // shown slowed down: one tunnelling period ≈ 3.2 s at Φ0/2, faster as √f01 elsewhere (capped so it stays watchable)
    theta += 2 * Math.PI * Math.min(3, Math.sqrt(f01 / (ref.E[1] - ref.E[0]))) / 3.2 * dt;
    if (++tick % 30 === 0) pal = palette();
    draw(cur, fx, theta); if (tick % 6 === 0) read(cur);
    raf = live ? requestAnimationFrame(frame) : 0;
  }
  function kick() {
    if (calm || !raf) { if (Math.abs(fx - solvedAt) > 1e-6) { cur = solve(fx); solvedAt = fx; } draw(cur, fx, theta); read(cur); }
    if (!calm && live && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function fluxAt(e) { var r = spec.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left - 22) / (r.width - 30))); }
  function setManual(v) { manual = v; if (calm || !raf) fx = v; kick(); }
  spec.addEventListener('pointerdown', function (e) { try { spec.setPointerCapture(e.pointerId); } catch (err) {} setManual(fluxAt(e)); });
  spec.addEventListener('pointermove', function (e) { if (manual !== null && spec.hasPointerCapture && spec.hasPointerCapture(e.pointerId)) setManual(fluxAt(e)); });
  function release() { if (calm) return; manual = null; }
  spec.addEventListener('pointerup', release); spec.addEventListener('pointercancel', release);
  spec.addEventListener('keydown', function (e) {
    var step = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01 }[e.key];
    if (e.key === 'Home') step = -1; if (e.key === 'End') step = 1;
    if (step === undefined) return;
    e.preventDefault(); setManual(Math.min(1, Math.max(0, (manual !== null ? manual : fx) + step)));
    clearTimeout(keyHold); keyHold = setTimeout(release, 4000);                  // the keyboard holds a value for a few seconds
  });
  size(); read(ref); draw(ref, 0.5, 0);
  window.addEventListener('resize', function () { size(); draw(cur, fx, theta); });
  if (calm || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (en) {
    live = en[0].isIntersecting;
    if (live && !raf) { last = performance.now(); if (!start) start = last; raf = requestAnimationFrame(frame); }
  }).observe(main);
})();
