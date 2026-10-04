// Cursor field: an invisible grid of tiny pixels. Around the pointer they light up in colour, swirl and lean away,
// then fade behind it as a short trail. A click sends a ripple (a wave: "tarang") through the grid.
// Mouse/trackpad only; nothing runs on touch screens or with prefers-reduced-motion. The loop sleeps when idle.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var cv = document.createElement('canvas');
  cv.className = 'cursor-field'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  root.classList.add('has-cursor-field');            // retires the older "atoms" cursor (see premium.css)

  var GAP = 16, R = 132, PUSH = 18, SWIRL = 10, TRAIL = 0.5;
  var HUES = [217, 4, 45, 140, 268, 190];              // blue, red, amber, green, violet, cyan
  var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, N = 0;
  var bx, by, ox, oy, vx, vy, al, hue, tint, on, act = [];

  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function resize() {
    W = innerWidth; H = innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1; N = cols * rows;
    bx = new Float32Array(N); by = new Float32Array(N); ox = new Float32Array(N); oy = new Float32Array(N);
    vx = new Float32Array(N); vy = new Float32Array(N); al = new Float32Array(N); hue = new Uint16Array(N); tint = new Int16Array(N).fill(-1); on = new Uint8Array(N);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c;
      bx[i] = c * GAP + (hash(i) - 0.5) * 6; by[i] = r * GAP + (hash(i + 7919) - 0.5) * 6;   // a little organic jitter
      hue[i] = HUES[Math.floor(hash(i + 104729) * HUES.length)];
    }
    act = []; ctx.clearRect(0, 0, W, H);
  }

  var mx = -1e4, my = -1e4, pvx = 0, pvy = 0, lastMove = -1e4, inside = false, ripples = [];
  function wake(i) { if (!on[i]) { on[i] = 1; act.push(i); } }
  function touchBox(x0, y0, x1, y1) {                  // activate every grid point inside a box
    var c0 = Math.max(0, Math.floor(x0 / GAP)), c1 = Math.min(cols - 1, Math.ceil(x1 / GAP));
    var r0 = Math.max(0, Math.floor(y0 / GAP)), r1 = Math.min(rows - 1, Math.ceil(y1 / GAP));
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) wake(r * cols + c);
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var now = performance.now(), dt = Math.max(now - lastMove, 8);
    if (inside) { pvx += ((e.clientX - mx) / dt * 16 - pvx) * 0.3; pvy += ((e.clientY - my) / dt * 16 - pvy) * 0.3; }
    mx = e.clientX; my = e.clientY; lastMove = now; inside = true;
    touchBox(mx - R, my - R, mx + R, my + R); kick();
  }, { passive: true });
  root.addEventListener('mouseleave', function () { inside = false; });
  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    var src = e.target.closest && e.target.closest('[data-ripple-hue]');   // a branded button tints its ripple
    ripples.push({ x: e.clientX, y: e.clientY, t: performance.now(), hue: src ? +src.getAttribute('data-ripple-hue') : -1 }); kick();
  }, { passive: true });

  var raf = 0, last = 0, prevBox = null;
  function kick() { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function frame(t) {
    raf = 0;
    var dt = Math.min(Math.max((t - last) / 1000, 0), 0.05); last = t;
    var live = inside && t - lastMove < 900;
    var light = root.classList.contains('light-mode'), L = light ? 48 : 66, S = light ? 88 : 95;
    var kS = 1 - Math.exp(-dt / 0.11), kIn = 1 - Math.exp(-dt / 0.05), kOut = Math.exp(-dt / TRAIL);

    // ripples: an expanding ring that lights and nudges the points it passes
    for (var q = ripples.length - 1; q >= 0; q--) {
      var rp = ripples[q], age = (t - rp.t) / 1000, rr = age * 620;
      if (age > 0.9) { ripples.splice(q, 1); continue; }
      touchBox(rp.x - rr - 30, rp.y - rr - 30, rp.x + rr + 30, rp.y + rr + 30);
    }

    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, keep = [];
    for (var n = 0; n < act.length; n++) {
      var i = act[n], dx = bx[i] - mx, dy = by[i] - my, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var tx = 0, ty = 0, ta = 0;
      if (live && d < R) {
        var f = 1 - d / R; f = f * f * (3 - 2 * f);                // smooth falloff
        tx = dx / d * PUSH * f - dy / d * SWIRL * f + pvx * 0.5 * f;
        ty = dy / d * PUSH * f + dx / d * SWIRL * f + pvy * 0.5 * f;
        ta = f;
      }
      for (var q2 = 0; q2 < ripples.length; q2++) {
        var rp2 = ripples[q2], age2 = (t - rp2.t) / 1000, ring = age2 * 620;
        var ex = bx[i] - rp2.x, ey = by[i] - rp2.y, e = Math.sqrt(ex * ex + ey * ey) || 1, band = 1 - Math.abs(e - ring) / 34;
        if (band > 0) { var fade = 1 - age2 / 0.9; tx += ex / e * 12 * band * fade; ty += ey / e * 12 * band * fade; ta = Math.max(ta, band * fade * 0.9); if (rp2.hue >= 0) tint[i] = rp2.hue; }
      }
      // springy offset, quick to light, slow to fade (that is the trail)
      vx[i] += ((tx - ox[i]) * 90 - vx[i] * 13) * dt; vy[i] += ((ty - oy[i]) * 90 - vy[i] * 13) * dt;
      ox[i] += vx[i] * dt; oy[i] += vy[i] * dt;
      al[i] = ta > al[i] ? al[i] + (ta - al[i]) * kIn : al[i] * kOut;
      if (al[i] < 0.012 && Math.abs(ox[i]) < 0.3 && Math.abs(oy[i]) < 0.3 && ta === 0) { on[i] = 0; al[i] = 0; tint[i] = -1; ox[i] = oy[i] = vx[i] = vy[i] = 0; continue; }
      keep.push(i);
      var px = bx[i] + ox[i], py = by[i] + oy[i];
      if (px < x0) x0 = px; if (py < y0) y0 = py; if (px > x1) x1 = px; if (py > y1) y1 = py;
    }
    act = keep;

    // clear only what changed (last frame's box and this frame's box), then draw
    var box = act.length ? [x0 - 4, y0 - 4, x1 + 4, y1 + 4] : null;
    if (prevBox) ctx.clearRect(prevBox[0], prevBox[1], prevBox[2] - prevBox[0], prevBox[3] - prevBox[1]);
    if (box) ctx.clearRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
    for (var m = 0; m < act.length; m++) {
      var j = act[m], a = al[j]; if (a < 0.02) continue;
      var s = 1.6 + 2.6 * a, h = tint[j] >= 0 ? tint[j] : (hue[j] + t * 0.012) % 360;
      ctx.fillStyle = 'hsla(' + h.toFixed(0) + ',' + S + '%,' + L + '%,' + Math.min(a * 1.1, 1).toFixed(2) + ')';
      ctx.fillRect(bx[j] + ox[j] - s / 2, by[j] + oy[j] - s / 2, s, s);
    }
    prevBox = box;
    if (act.length || ripples.length || live) raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', function () { resize(); kick(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
})();
