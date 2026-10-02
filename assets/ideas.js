// The idea map. One point (God) at the centre, fields branching out, ideas branching from them, and every branch
// finally reaching the same rim (Death). Content lives in ideas-data.js; this file only draws and wires it.
//
// Drawing is a canvas (branches, ripples, travelling lights, rim); the points themselves are real <button>s so they are
// focusable, labelled and clickable. Everything breathes a little, nothing is rigid, and with prefers-reduced-motion
// the map is simply drawn once, fully grown.
(function () {
  'use strict';
  var DATA = window.IDEAS;
  var space = document.getElementById('space');
  var stage = document.getElementById('space-stage');
  var canvas = document.getElementById('space-canvas');
  var nodesWrap = document.getElementById('space-nodes');
  var panel = document.getElementById('idea-panel');
  if (!DATA || !space || !stage || !canvas || !nodesWrap || !panel) return;

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rand = mulberry32(1729);                       // seeded: the "spontaneous" shape is the same on every visit

  // ================================================================ model
  var nodes = [], byId = {}, edges = [], tips = [];
  function mk(o) { o.kids = []; o.x = 0; o.y = 0; o.ox = 0; o.oy = 0; o.shown = false; nodes.push(o); byId[o.id] = o; return o; }

  var god = mk({ id: DATA.root.id, type: 'god', data: DATA.root, parent: null, ang: 0, rad: 0 });
  var nB = DATA.branches.length, ideaIndex = 0;
  DATA.branches.forEach(function (b, i) {
    var ang = (-60 + i * (360 / nB) + (rand() - 0.5) * 10) * DEG;
    var disc = mk({ id: b.id, type: 'disc', data: b, parent: god, ang: ang, rad: 0.30 + (rand() - 0.5) * 0.04 });
    god.kids.push(disc);
    var k = b.children.length, span = Math.min(52, (k - 1) * 13) * DEG;
    b.children.forEach(function (c, j) {
      var t = k === 1 ? 0 : j / (k - 1) - 0.5;
      var idea = mk({
        id: c.id, type: 'idea', data: c, parent: disc, idx: ideaIndex++,
        ang: ang + t * span + (rand() - 0.5) * 3 * DEG,
        rad: 0.62 + (j % 2 ? 0.045 : -0.02) + (rand() - 0.5) * 0.04
      });
      disc.kids.push(idea);
    });
  });
  var death = mk({ id: DATA.rim.id, type: 'death', data: DATA.rim, parent: god, ang: 90 * DEG, rad: 1 });

  var ideas = nodes.filter(function (n) { return n.type === 'idea'; });
  var edgeIn = {}, edgeTip = {};
  function mkEdge(from, to, kind, delay, dur) {
    var e = { from: from, to: to, kind: kind, curl: (rand() - 0.5) * (kind === 'root' ? 0.3 : 0.44), delay: delay, dur: dur,
              p: 0, alpha: 1, alphaT: 1, hot: 0, hotT: 0, c1x: 0, c1y: 0, c2x: 0, c2y: 0 };
    edges.push(e); return e;
  }
  god.kids.forEach(function (d, i) {
    edgeIn[d.id] = mkEdge(god, d, 'root', 0.35 + i * 0.09, 1.0);
    d.inAt = edgeIn[d.id].delay + 0.8;
    d.kids.forEach(function (n) {
      edgeIn[n.id] = mkEdge(d, n, 'branch', 1.0 + n.idx * 0.045, 0.9);
      n.inAt = edgeIn[n.id].delay + 0.72;
      var tip = { id: n.id + '~tip', type: 'tip', ang: n.ang + (rand() - 0.5) * 2 * DEG, x: 0, y: 0, kids: [] };
      tips.push(tip);
      edgeTip[n.id] = mkEdge(n, tip, 'tendril', 1.9 + n.idx * 0.035, 0.7);
    });
  });
  god.inAt = 0.15; death.inAt = 2.2;
  var STYLE = { root: { w0: 2.6, w1: 1.8, a: 0.75, n: 16 }, branch: { w0: 1.7, w1: 1.1, a: 0.6, n: 16 }, tendril: { w0: 1.0, w1: 0.6, a: 0.42, n: 10 } };

  // ================================================================ geometry
  var W = 0, H = 0, cx = 0, cy = 0, R = 0, small = false, dpr = 1;
  function wob(a, t) { return 1 + 0.010 * Math.sin(5 * a + 0.6 + 0.15 * t) + 0.006 * Math.sin(9 * a - 0.08 * t); }

  function layout() {
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    small = W < 560;
    R = small ? Math.min(W / 2 - 14, H / 2 - 58) : Math.min(W, H) / 2 - 70;
    cx = W / 2; cy = H / 2 - (small ? 16 : 20);
    stage.style.setProperty('--u', (small ? 0.92 : clamp(R / 310, 0.78, 1.15)).toFixed(3));
    nodes.forEach(function (n) {
      if (n.type === 'god') { n.bx = cx; n.by = cy; return; }
      var rad = n.rad * (small ? (n.type === 'disc' ? 1.22 : 0.97) : 1);   // phones: fields sit further from the centre
      n.bx = cx + Math.cos(n.ang) * rad * R; n.by = cy + Math.sin(n.ang) * rad * R;
    });
    return true;
  }

  // ================================================================ DOM: one real button per point
  var ARIA = { god: ' (the origin of every branch)', disc: ' (field)', idea: '', death: ' (where every branch ends)' };
  function buildNode(n) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'node node--' + n.type; b.setAttribute('data-id', n.id);
    b.setAttribute('aria-label', n.data.label + ARIA[n.type]);
    b.innerHTML = '<span class="hit"></span><span class="dot"></span><span class="lbl-rot"><span class="lbl"></span></span>';
    b.querySelector('.lbl').textContent = n.data.label;
    var flip = Math.cos(n.ang) < -0.02;
    if (n.type === 'disc' && Math.abs(Math.sin(n.ang)) < 0.35) b.setAttribute('data-above', '');
    if (n.type === 'idea' || n.type === 'disc') {
      if (flip) b.setAttribute('data-flip', '');
      if (n.type === 'idea') b.querySelector('.lbl-rot').style.transform = 'rotate(' + ((n.ang / DEG) + (flip ? 180 : 0)).toFixed(1) + 'deg)';
    }
    n.el = b; nodesWrap.appendChild(b);
    b.addEventListener('click', function () { select(n.id, true); });
    b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') setHover(n.id); });
    b.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') setHover(null); });
    b.addEventListener('focus', function () { if (b.matches(':focus-visible')) setHover(n.id); });
    b.addEventListener('blur', function () { setHover(null); });
  }
  buildNode(god);
  god.kids.forEach(function (d) { buildNode(d); d.kids.forEach(buildNode); });
  buildNode(death);

  // ================================================================ focus (hover / selection) highlighting
  var hoverId = null, selId = null, chain = {};
  function chainOf(id) {
    var set = {}, n = byId[id];
    if (!n) return set;
    function down(m) { set[m.id] = true; if (m.type === 'idea') set[m.id + '~tip'] = true; m.kids.forEach(down); }
    if (n.type === 'death' || n.type === 'god') { nodes.forEach(function (m) { set[m.id] = true; }); tips.forEach(function (t) { set[t.id] = true; }); return set; }
    for (var a = n.parent; a; a = a.parent) set[a.id] = true;
    down(n);
    return set;
  }
  function refreshFocus() {
    var id = hoverId || selId;
    chain = id ? chainOf(id) : {};
    space.classList.toggle('has-focus', !!id);
    nodes.forEach(function (n) { n.el.classList.toggle('is-on', !!chain[n.id]); });
    edges.forEach(function (e) {
      var on = !id || (chain[e.from.id] && chain[e.to.id]);
      e.alphaT = on ? 1 : 0.14; e.hotT = id && on ? 1 : 0;
      if (reduce) { e.alpha = e.alphaT; e.hot = e.hotT; }
    });
    invalidate();
  }
  function setHover(id) { if (hoverId === id) return; hoverId = id; refreshFocus(); }

  // ================================================================ panel
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  var introView = panel.querySelector('.ip-intro'), detailView = panel.querySelector('.ip-detail');
  if (DATA.intro) {                                     // the HTML holds a fallback copy; the data file is the source of truth
    var iT = document.getElementById('ip-intro-title'), iX = document.getElementById('ip-intro-text'), iH = document.getElementById('ip-intro-hint');
    if (iT && DATA.intro.title) iT.textContent = DATA.intro.title;
    if (iX && DATA.intro.text) iX.textContent = DATA.intro.text;
    if (iH && DATA.intro.hint) iH.textContent = DATA.intro.hint;
  }
  var KICKER = { god: 'The origin', disc: 'A field', idea: 'An idea', death: 'The edge' };
  function replay(node) { node.classList.remove('ip-view'); void node.offsetWidth; node.classList.add('ip-view'); }

  function renderPanel(id) {
    if (!id) { introView.hidden = false; detailView.hidden = true; replay(introView); return; }
    var n = byId[id], d = n.data;
    introView.hidden = true; detailView.hidden = false; detailView.textContent = '';
    var trail = [];
    for (var a = n.parent; a; a = a.parent) trail.unshift(a);
    if (trail.length && n.type !== 'death') {
      var cr = el('nav', 'ip-crumbs'); cr.setAttribute('aria-label', 'Path from the origin');
      trail.forEach(function (p) {
        var b = el('button', null, p.data.label); b.type = 'button';
        b.addEventListener('click', function () { select(p.id, true); });
        cr.appendChild(b); cr.appendChild(el('span', null, '›'));
      });
      cr.appendChild(el('span', null, d.label));
      detailView.appendChild(cr);
    }
    detailView.appendChild(el('p', 'ip-kicker', KICKER[n.type]));
    detailView.appendChild(el('h2', 'ip-title', d.title || d.label));
    if (d.prompt) detailView.appendChild(el('p', 'ip-prompt', d.prompt));
    if (d.body && d.body.length) { var body = el('div', 'ip-body'); d.body.forEach(function (t) { body.appendChild(el('p', null, t)); }); detailView.appendChild(body); }
    if (d.listLabel) detailView.appendChild(el('p', 'ip-text', d.listLabel));
    if (d.list && d.list.length) { var ul = el('ul', 'ip-list'); d.list.forEach(function (t) { ul.appendChild(el('li', null, t)); }); detailView.appendChild(ul); }
    if (d.source) { var s = el('a', 'ip-source', d.source.text); s.href = d.source.href; s.target = '_blank'; s.rel = 'noopener'; detailView.appendChild(s); }
    if (!(d.body && d.body.length) && !d.list && n.type !== 'death') detailView.appendChild(el('p', 'ip-hint', 'Nothing written here yet — this branch is still growing.'));
    var back = el('button', 'ip-back', '← The whole map'); back.type = 'button';
    back.addEventListener('click', function () { select(null); });
    detailView.appendChild(back);
    replay(detailView);
  }

  function select(id, fromUser) {
    selId = id && byId[id] ? id : null;
    nodes.forEach(function (n) { n.el.classList.toggle('is-selected', n.id === selId); if (n.id === selId) n.el.setAttribute('aria-current', 'true'); else n.el.removeAttribute('aria-current'); });
    renderPanel(selId); refreshFocus();
    try { history.replaceState(null, '', selId ? '#' + selId : location.pathname + location.search); } catch (e) {}
    if (selId && fromUser && window.innerWidth <= 960) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && selId && !document.documentElement.classList.contains('lb-open')) select(null); });
  window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (h !== (selId || '') && (byId[h] || !h)) select(h || null); });

  // ================================================================ colours (read from the theme, re-read when it flips)
  var C = { accent: '#a9cbf0', accent2: '#6ea0d8', lighter: true }, sprite = null;
  function rgbOf(str) { var c = document.createElement('canvas'); c.width = c.height = 1; var g = c.getContext('2d'); g.fillStyle = str; g.fillRect(0, 0, 1, 1); var d = g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; }
  function readColors() {
    var cs = getComputedStyle(stage);
    C.accent = cs.getPropertyValue('--copper-light').trim() || C.accent;
    C.accent2 = cs.getPropertyValue('--copper').trim() || C.accent2;
    C.lighter = !document.documentElement.classList.contains('light-mode');
    var rgb = rgbOf(C.accent), s = document.createElement('canvas'); s.width = s.height = 64;
    var g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb.join(',') + ',0.95)'); gr.addColorStop(0.35, 'rgba(' + rgb.join(',') + ',0.35)'); gr.addColorStop(1, 'rgba(' + rgb.join(',') + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprite = s;
  }
  new MutationObserver(function () { readColors(); invalidate(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // ================================================================ travelling lights: God -> field -> idea -> rim
  var parts = [];
  function respawn(p, initial) {
    var leaf = ideas[(rand() * ideas.length) | 0];
    p.path = [edgeIn[leaf.parent.id], edgeIn[leaf.id], edgeTip[leaf.id]];
    p.s = initial ? rand() * 3 : -rand() * 1.4; p.v = 0.15 + rand() * 0.12; p.sz = 1.2 + rand() * 1.3;
  }
  for (var pi = 0, PN = window.innerWidth < 560 ? 18 : 34; pi < PN; pi++) { var pp = {}; respawn(pp, true); parts.push(pp); }
  var ripples = [], lastRipple = -9;

  // ================================================================ per-frame
  var t = 0, gt = reduce ? 99 : 0, ptr = null;
  stage.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var r = stage.getBoundingClientRect(); ptr = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  stage.addEventListener('pointerleave', function () { ptr = null; });

  function bez(e, u) {
    var a = e.from, b = e.to, m = 1 - u, w0 = m * m * m, w1 = 3 * m * m * u, w2 = 3 * m * u * u, w3 = u * u * u;
    return [w0 * a.x + w1 * e.c1x + w2 * e.c2x + w3 * b.x, w0 * a.y + w1 * e.c1y + w2 * e.c2y + w3 * b.y];
  }
  function prep(e) {
    var ax = e.from.x, ay = e.from.y, dx = e.to.x - ax, dy = e.to.y - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    e.c1x = ax + dx * 0.33 + nx * L * e.curl; e.c1y = ay + dy * 0.33 + ny * L * e.curl;
    e.c2x = ax + dx * 0.68 - nx * L * e.curl * 0.45; e.c2y = ay + dy * 0.68 - ny * L * e.curl * 0.45;
  }

  function step(dt) {
    t += dt; if (!reduce) gt += dt;
    // positions: a gentle breathing drift, plus a soft pull toward the pointer
    nodes.forEach(function (n) {
      if (n.type === 'god') { n.x = n.bx; n.y = n.by; return; }
      if (n.type === 'death') { var w = wob(n.ang, t); n.x = cx + Math.cos(n.ang) * R * w; n.y = cy + Math.sin(n.ang) * R * w; return; }
      if (n.fx === undefined) { n.fx = 0.25 + rand() * 0.35; n.fy = 0.25 + rand() * 0.35; n.px = rand() * TAU; n.py = rand() * TAU; n.amp = n.type === 'idea' ? 3.4 : 1.8; }
      var dx = reduce ? 0 : Math.sin(t * n.fx + n.px) * n.amp, dy = reduce ? 0 : Math.cos(t * n.fy + n.py) * n.amp, tx = 0, ty = 0;
      if (ptr && !reduce) { var ddx = ptr.x - (n.bx + dx), ddy = ptr.y - (n.by + dy), d = Math.hypot(ddx, ddy); if (d < 130 && d > 0.1) { var f = 1 - d / 130; tx = ddx / d * f * 10; ty = ddy / d * f * 10; } }
      var k = Math.min(1, dt * 6); n.ox += (tx - n.ox) * k; n.oy += (ty - n.oy) * k;
      n.x = n.bx + dx + n.ox; n.y = n.by + dy + n.oy;
    });
    tips.forEach(function (tp) { var w = wob(tp.ang, t); tp.x = cx + Math.cos(tp.ang) * R * w; tp.y = cy + Math.sin(tp.ang) * R * w; });
    edges.forEach(function (e) {
      e.p = clamp((gt - e.delay) / e.dur, 0, 1); e.p = ease(e.p);
      var k = reduce ? 1 : Math.min(1, dt * 7);
      e.alpha += (e.alphaT - e.alpha) * k; e.hot += (e.hotT - e.hot) * k;
      prep(e);
    });
    nodes.forEach(function (n) { if (!n.shown && gt >= n.inAt) { n.shown = true; n.el.classList.add('is-in'); } });
    if (!reduce && gt > 0.3 && t - lastRipple > 3.4) { ripples.push(t); lastRipple = t; if (ripples.length > 4) ripples.shift(); }
    if (!reduce) parts.forEach(function (p) { p.s += p.v * dt; if (p.s > 3) respawn(p, false); });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // rim: a faint, slightly irregular ring that sweeps out from the bottom (Death) in both directions
    var rp = ease(clamp((gt - 2.1) / 1.4, 0, 1));
    if (rp > 0.001) {
      var hw = rp * Math.PI, a0 = 90 * DEG - hw;
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1;
      for (var pass = 0; pass < 2; pass++) {
        ctx.globalAlpha = pass ? 0.5 : 0.14; ctx.setLineDash(pass ? [2, 9] : []); ctx.lineDashOffset = pass ? -t * 4 : 0;
        ctx.beginPath();
        for (var a = a0; a <= a0 + hw * 2 + 0.0001; a += 3 * DEG) { var r = R * wob(a, t); var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; if (a === a0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // ripples from the origin: the wave
    ripples.forEach(function (t0) {
      var age = t - t0, k = age / 7; if (k >= 1) return;
      ctx.globalAlpha = 0.24 * Math.pow(1 - k, 1.5); ctx.strokeStyle = C.accent; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, ease(k) * R * 0.98, 0, TAU); ctx.stroke();
    });

    // glow at the origin
    if (sprite) {
      var gs = (230 + Math.sin(t * 1.3) * 18) * (R / 310 + 0.35), ga = clamp(gt / 0.8, 0, 1) * (0.55 + 0.1 * Math.sin(t * 1.3));
      ctx.globalAlpha = ga; ctx.drawImage(sprite, cx - gs / 2, cy - gs / 2, gs, gs);
    }

    // branches (tapered: three strokes of decreasing width)
    ctx.strokeStyle = C.accent;
    edges.forEach(function (e) {
      if (e.p < 0.002) return;
      var st = STYLE[e.kind], N = st.n, pts = [];
      for (var i = 0; i <= N; i++) pts.push(bez(e, e.p * i / N));
      ctx.globalAlpha = clamp((st.a + 0.35 * e.hot) * e.alpha, 0, 1);
      for (var g = 0; g < 3; g++) {
        var i0 = Math.floor(g * N / 3), i1 = Math.floor((g + 1) * N / 3);
        ctx.lineWidth = lerp(st.w0, st.w1, (g + 0.5) / 3) * (1 + 0.6 * e.hot);
        ctx.beginPath(); ctx.moveTo(pts[i0][0], pts[i0][1]);
        for (var q = i0 + 1; q <= i1; q++) ctx.lineTo(pts[q][0], pts[q][1]);
        ctx.stroke();
      }
    });

    // lights travelling from God toward death
    if (!reduce && gt > 3.3 && sprite) {
      ctx.globalCompositeOperation = C.lighter ? 'lighter' : 'source-over';
      parts.forEach(function (p) {
        if (p.s < 0) return;
        var i = Math.min(2, Math.floor(p.s)), e = p.path[i], pos = bez(e, p.s - i);
        var a = Math.pow(Math.sin(Math.PI * p.s / 3), 0.6) * 0.9 * e.alpha;
        if (a < 0.02) return;
        ctx.globalAlpha = a * 0.7; var hs = 12 * p.sz; ctx.drawImage(sprite, pos[0] - hs / 2, pos[1] - hs / 2, hs, hs);
        ctx.globalAlpha = a; ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(pos[0], pos[1], p.sz * 0.75, 0, TAU); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function place() {
    nodes.forEach(function (n) { n.el.style.transform = 'translate3d(' + n.x.toFixed(1) + 'px,' + n.y.toFixed(1) + 'px,0)'; });
  }

  // ================================================================ loop (runs only while the map is on screen)
  var raf = 0, last = 0, visible = true, queued = false;
  function loop(ts) {
    raf = 0; if (!visible || document.hidden) return;
    var dt = clamp((ts - last) / 1000, 0, 0.05); last = ts;
    step(dt); draw(); place();
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (reduce || raf || !visible || document.hidden) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  function invalidate() {                      // reduced motion: draw once per change; otherwise the loop is already running
    if (!reduce) { kick(); return; }
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; if (W) { step(0.016); draw(); place(); } });
  }
  document.addEventListener('visibilitychange', kick);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(stage);

  function onResize() { if (layout()) invalidate(); }
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage); else window.addEventListener('resize', onResize);

  // ================================================================ go
  readColors();
  if (layout()) { step(0.016); draw(); place(); }
  var h0 = location.hash.slice(1);
  select(byId[h0] ? h0 : null);
  if (reduce) nodes.forEach(function (n) { n.shown = true; n.el.classList.add('is-in'); });
  kick();
})();
