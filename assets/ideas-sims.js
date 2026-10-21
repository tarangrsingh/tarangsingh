// Ideas map: each field's panel opens with a small live simulation from that field's own world. Tap (or click) it to
// perturb it. ideas.js calls IDEA_SIMS.mount(id, host) when a field is opened and the returned stop() when it closes.
// With prefers-reduced-motion each one is advanced off-screen and drawn once; a tap advances and redraws it.
(function () {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var H = 168;

  function palette() {
    var cs = getComputedStyle(document.documentElement);
    return { hi: cs.getPropertyValue('--copper-light').trim() || '#a9cbf0', lo: cs.getPropertyValue('--copper').trim() || '#6ea0d8',
      bg: 'rgba(' + (cs.getPropertyValue('--bg-rgb').trim() || '8, 17, 31') + ', ', light: document.documentElement.classList.contains('light-mode') };
  }

  // ---- the simulations: each has init(w, h), step(), draw(ctx, w, h, pal), tap(x, y) --------------------------------
  var SIMS = {
    physics: { name: 'Double pendulum, two starts 0.001 rad apart', make: function () {
      var g = 9.81, P = [], trail = [[], []];
      function deriv(s) {
        var t1 = s[0], w1 = s[1], t2 = s[2], w2 = s[3], d = t1 - t2, den = 3 - Math.cos(2 * d);
        return [w1, (-3 * g * Math.sin(t1) - g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den,
          w2, (2 * Math.sin(d) * (2 * w1 * w1 + 2 * g * Math.cos(t1) + w2 * w2 * Math.cos(d))) / den];
      }
      function rk4(s, h) {
        var k1 = deriv(s), k2 = deriv(s.map(function (v, i) { return v + h / 2 * k1[i]; })), k3 = deriv(s.map(function (v, i) { return v + h / 2 * k2[i]; })), k4 = deriv(s.map(function (v, i) { return v + h * k3[i]; }));
        return s.map(function (v, i) { return v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
      }
      function reset() { var a = 1.9 + Math.random() * 0.7, b = 2.2 + Math.random() * 0.8; P = [[a, 0, b, 0], [a + 0.001, 0, b, 0]]; trail = [[], []]; }
      reset();
      return {
        step: function () { for (var k = 0; k < 4; k++) P = P.map(function (s) { return rk4(s, 1 / 240); }); },
        draw: function (c, w, h, pal) {
          var L = h * 0.24, ox = w / 2, oy = h * 0.5 - L * 0.1;
          P.forEach(function (s, i) {
            var x1 = ox + L * Math.sin(s[0]), y1 = oy + L * Math.cos(s[0]), x2 = x1 + L * Math.sin(s[2]), y2 = y1 + L * Math.cos(s[2]);
            var tr = trail[i]; tr.push([x2, y2]); if (tr.length > 260) tr.shift();
            c.strokeStyle = i ? pal.lo : pal.hi; c.lineWidth = 1.2;
            for (var j = 1; j < tr.length; j++) { c.globalAlpha = (j / tr.length) * 0.7; c.beginPath(); c.moveTo(tr[j - 1][0], tr[j - 1][1]); c.lineTo(tr[j][0], tr[j][1]); c.stroke(); }
            c.globalAlpha = i ? 0.55 : 0.95; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ox, oy); c.lineTo(x1, y1); c.lineTo(x2, y2); c.stroke();
            c.fillStyle = i ? pal.lo : pal.hi; [[x1, y1], [x2, y2]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 3.2, 0, 7); c.fill(); });
          });
          c.globalAlpha = 1; c.fillStyle = pal.hi; c.beginPath(); c.arc(ox, oy, 2, 0, 7); c.fill();
        },
        tap: reset
      };
    } },

    math: { name: 'Lissajous figure', make: function () {
      var R = [[3, 2], [5, 4], [3, 4], [5, 6], [1, 2], [7, 6]], r = 0, phase = 0, t = 0, self;
      self = {
        caption: function () { return 'Lissajous figure ' + R[r][0] + ' : ' + R[r][1]; },
        step: function () { phase += 0.004; t += 0.03; },
        draw: function (c, w, h, pal) {
          var a = R[r][0], b = R[r][1], cx = w / 2, cy = h / 2, sx = Math.min(w * 0.42, h * 0.62), sy = h * 0.4;
          c.strokeStyle = pal.hi; c.lineWidth = 1.3; c.globalAlpha = 0.85; c.beginPath();
          for (var i = 0; i <= 720; i++) { var u = i / 720 * Math.PI * 2; c[i ? 'lineTo' : 'moveTo'](cx + sx * Math.sin(a * u + phase), cy + sy * Math.sin(b * u)); }
          c.stroke(); c.globalAlpha = 1;
          c.fillStyle = pal.hi; c.beginPath(); c.arc(cx + sx * Math.sin(a * t + phase), cy + sy * Math.sin(b * t), 3.4, 0, 7); c.fill();
        },
        tap: function () { r = (r + 1) % R.length; }
      };
      return self;
    } },

    chemistry: { name: 'Gray–Scott reaction–diffusion', make: function () {
      var W = 120, Hh = 64, U, V, U2, V2, img = null, F = 0.0367, K = 0.0649;
      function seed(gx, gy, r) { for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) { var i = ((gy + y + Hh) % Hh) * W + (gx + x + W) % W; U[i] = 0.5; V[i] = 0.25 + Math.random() * 0.02; } }
      function reset() { U = new Float32Array(W * Hh).fill(1); V = new Float32Array(W * Hh); U2 = new Float32Array(W * Hh); V2 = new Float32Array(W * Hh);
        for (var k = 0; k < 7; k++) seed(Math.random() * W | 0, Math.random() * Hh | 0, 3); }
      reset();
      return {
        step: function () {
          for (var n = 0; n < 10; n++) {
            for (var y = 0; y < Hh; y++) { var ym = ((y - 1 + Hh) % Hh) * W, yp = ((y + 1) % Hh) * W, yr = y * W;
              for (var x = 0; x < W; x++) { var xm = (x - 1 + W) % W, xp = (x + 1) % W, i = yr + x, u = U[i], v = V[i], uvv = u * v * v;
                U2[i] = u + (0.16 * (U[yr + xm] + U[yr + xp] + U[ym + x] + U[yp + x] - 4 * u) - uvv + F * (1 - u));
                V2[i] = v + (0.08 * (V[yr + xm] + V[yr + xp] + V[ym + x] + V[yp + x] - 4 * v) + uvv - (F + K) * v); } }
            var t = U; U = U2; U2 = t; t = V; V = V2; V2 = t;
          }
        },
        draw: function (c, w, h, pal) {
          if (!img) img = c.createImageData(W, Hh);
          var col = pal.light ? [150, 59, 0] : [169, 203, 240], d = img.data;
          for (var i = 0; i < W * Hh; i++) { var a = Math.min(1, V[i] * 3.2); d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = a * 255; }
          var off = this._off || (this._off = document.createElement('canvas')); off.width = W; off.height = Hh; off.getContext('2d').putImageData(img, 0, 0);
          c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, w, h);
        },
        tap: function (x, y, w, h) { seed(x / w * W | 0, y / h * Hh | 0, 3); }
      };
    } },

    biology: { name: 'Conway’s Game of Life', make: function () {
      var W = 72, Hh = 36, A, B, age, tick = 0;
      function reset() { A = new Uint8Array(W * Hh); B = new Uint8Array(W * Hh); age = new Float32Array(W * Hh); for (var i = 0; i < A.length; i++) A[i] = Math.random() < 0.24 ? 1 : 0; }
      reset();
      return {
        step: function () {
          if (++tick % 6) return;
          for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) {
            var n = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (dx || dy) n += A[((y + dy + Hh) % Hh) * W + (x + dx + W) % W];
            var i = y * W + x; B[i] = n === 3 || (n === 2 && A[i]) ? 1 : 0; age[i] = B[i] ? 1 : age[i] * 0.7;
          }
          var t = A; A = B; B = t;
        },
        draw: function (c, w, h, pal) {
          var cw = w / W, ch = h / Hh;
          for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) { var i = y * W + x, a = A[i] ? 0.9 : age[i] * 0.35; if (a < 0.02) continue;
            c.globalAlpha = a; c.fillStyle = A[i] ? pal.hi : pal.lo; c.fillRect(x * cw + 0.6, y * ch + 0.6, cw - 1.2, ch - 1.2); }
          c.globalAlpha = 1;
        },
        tap: function (x, y, w, h) { var gx = x / w * W | 0, gy = y / h * Hh | 0;   // a glider, heading down-right
          [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].forEach(function (p) { A[((gy + p[1]) % Hh) * W + (gx + p[0]) % W] = 1; }); }
      };
    } },

    philosophy: { name: 'Langton’s ant', make: function () {
      var W = 120, Hh = 60, G, ants;
      function reset() { G = new Uint8Array(W * Hh); ants = [{ x: W / 2 | 0, y: Hh / 2 | 0, d: 0 }]; }
      reset();
      return {
        step: function () {
          for (var n = 0; n < 24; n++) ants.forEach(function (a) {
            var i = a.y * W + a.x; a.d = (a.d + (G[i] ? 3 : 1)) % 4; G[i] ^= 1;
            a.x = (a.x + [0, 1, 0, -1][a.d] + W) % W; a.y = (a.y + [-1, 0, 1, 0][a.d] + Hh) % Hh;
          });
        },
        draw: function (c, w, h, pal) {
          var cw = w / W, ch = h / Hh; c.fillStyle = pal.lo; c.globalAlpha = 0.75;
          for (var i = 0; i < G.length; i++) if (G[i]) c.fillRect((i % W) * cw, (i / W | 0) * ch, cw, ch);
          c.globalAlpha = 1; c.fillStyle = pal.hi; ants.forEach(function (a) { c.beginPath(); c.arc((a.x + 0.5) * cw, (a.y + 0.5) * ch, 2.6, 0, 7); c.fill(); });
        },
        tap: function (x, y, w, h) { if (ants.length > 5) ants.shift(); ants.push({ x: x / w * W | 0, y: y / h * Hh | 0, d: Math.random() * 4 | 0 }); }
      };
    } },

    metaphysics: { name: 'Lorenz attractor, two starts 10⁻⁵ apart', make: function () {
      var S, trails, rot = 0;
      function reset() { S = [[1, 1, 20], [1 + 1e-5, 1, 20]]; trails = [[], []]; }
      function f(p) { return [10 * (p[1] - p[0]), p[0] * (28 - p[2]) - p[1], p[0] * p[1] - 8 / 3 * p[2]]; }
      reset();
      return {
        step: function () { rot += 0.002;
          for (var k = 0; k < 4; k++) S = S.map(function (p) { var h = 0.004, a = f(p), b = f(p.map(function (v, i) { return v + h / 2 * a[i]; })), cc = f(p.map(function (v, i) { return v + h / 2 * b[i]; })), d = f(p.map(function (v, i) { return v + h * cc[i]; }));
            return p.map(function (v, i) { return v + h / 6 * (a[i] + 2 * b[i] + 2 * cc[i] + d[i]); }); });
          S.forEach(function (p, i) { trails[i].push(p.slice()); if (trails[i].length > 900) trails[i].shift(); });
        },
        draw: function (c, w, h, pal) {
          var cr = Math.cos(rot), sr = Math.sin(rot), sc = h / 56;
          function px(p) { return [w / 2 + (p[0] * cr - p[1] * sr) * sc * 1.25, h - 6 - p[2] * sc]; }
          trails.forEach(function (tr, i) {
            c.strokeStyle = i ? pal.lo : pal.hi; c.lineWidth = 1.1;
            for (var j = 1; j < tr.length; j++) { var a = px(tr[j - 1]), b = px(tr[j]); c.globalAlpha = (j / tr.length) * (i ? 0.6 : 0.85); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
            var e = px(tr[tr.length - 1]); c.globalAlpha = 1; c.fillStyle = i ? pal.lo : pal.hi; c.beginPath(); c.arc(e[0], e[1], 2.8, 0, 7); c.fill();
          });
          c.globalAlpha = 1;
        },
        tap: reset
      };
    } }
  };

  window.IDEA_SIMS = {
    mount: function (id, host) {
      var def = SIMS[id]; if (!def) return null;
      var sim = def.make(), fig = document.createElement('figure'); fig.className = 'ip-sim';
      var cv = document.createElement('canvas'); cv.setAttribute('role', 'img'); cv.title = 'Tap to stir it';
      var cap = document.createElement('figcaption');
      fig.appendChild(cv); fig.appendChild(cap); host.appendChild(fig);
      var c = cv.getContext('2d'), w = 0, raf = 0, frame = 0, pal = palette(), dead = false;
      function caption() { var t = sim.caption ? sim.caption() : def.name; cap.textContent = t; cv.setAttribute('aria-label', t); }
      function size() { var dpr = Math.min(2, window.devicePixelRatio || 1); w = fig.clientWidth || 300; cv.width = w * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
      function paint() { if (++frame % 60 === 0) pal = palette(); c.clearRect(0, 0, w, H); sim.draw(c, w, H, pal); }
      function loop() { if (dead) return; sim.step(); paint(); raf = requestAnimationFrame(loop); }
      function still() { for (var i = 0; i < 400; i++) sim.step(); pal = palette(); paint(); }
      cv.addEventListener('pointerdown', function (e) { var r = cv.getBoundingClientRect(); sim.tap(e.clientX - r.left, e.clientY - r.top, r.width, r.height); caption(); if (calm) still(); });
      var onResize = function () { size(); if (calm) paint(); };
      window.addEventListener('resize', onResize);
      caption(); size();
      if (calm) still(); else raf = requestAnimationFrame(loop);
      return function stop() { dead = true; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
    }
  };
})();
