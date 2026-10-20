// Explore, on every page: the glass button in the header's top-left corner (#sb-btn, in each page's markup) opens the
// four pages in a frosted panel that slides in from the left edge, under the header. This builds the panel, marks the
// page you are on, and handles it: the button, the dimmed page, Esc or a swipe to the left closes it, and keyboard
// focus stays inside while it is open. The rows keep the old Explore cards' touches: a light that follows the pointer,
// icons that move on hover (and play once, one after another, the first time the panel opens), and a qubit whose
// state vector precesses while the panel is open.
(function () {
  var root = document.documentElement, btn = document.getElementById('sb-btn'), header = document.querySelector('header');
  if (!btn || !header) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PAGES = [
    { href: 'research.html', name: 'Research Experience', icon: '<svg class="sb-ic qubit" viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="21" fill="var(--avatar-bg)" stroke="var(--copper)" stroke-width="1.8"/>' +
      '<path d="M11 32 A21 7.9 0 0 1 53 32" fill="none" stroke="var(--copper)" stroke-width="1.1" stroke-dasharray="2 2.4" opacity="0.6"/>' +
      '<path d="M32 12.5 V51.5" fill="none" stroke="var(--copper)" stroke-width="1" stroke-dasharray="1.5 2.2" opacity="0.6"/>' +
      '<path d="M11 32 A21 7.9 0 0 0 53 32" fill="none" stroke="var(--copper)" stroke-width="1.3" opacity="0.9"/>' +
      '<ellipse class="bl-orbit" cx="32" cy="32" rx="0" ry="0" fill="none" stroke="var(--copper-light)" stroke-width="1" stroke-dasharray="1.6 2" opacity="0.6"/>' +
      '<circle class="bl-pole0" cx="32" cy="12.5" r="2" fill="var(--copper-light)"/><circle class="bl-pole1" cx="32" cy="51.5" r="2" fill="var(--copper)"/>' +
      '<line class="bl-vec" x1="32" y1="32" x2="32" y2="32" stroke="var(--copper-light)" stroke-width="2" stroke-linecap="round"/>' +
      '<circle class="bl-halo" cx="32" cy="32" r="6" fill="var(--copper-glow)"/><circle class="bl-tip" cx="32" cy="32" r="3" fill="var(--copper-light)"/>' +
      '<circle cx="32" cy="32" r="1.5" fill="var(--copper)"/></svg>' },
    { href: 'scholastic.html', name: 'Scholastic Achievements', icon: '<svg class="sb-ic medal" viewBox="0 0 64 64" aria-hidden="true"><g class="swing">' +
      '<path d="M17 3 H28 L37 27 H26 Z" fill="var(--copper)"/><path d="M47 3 H36 L27 27 H38 Z" fill="var(--copper-light)"/>' +
      '<circle cx="32" cy="41" r="15" fill="var(--avatar-bg)" stroke="var(--copper-light)" stroke-width="2.4"/>' +
      '<circle cx="32" cy="41" r="10.5" fill="none" stroke="var(--copper)" stroke-width="1.2" opacity="0.7"/>' +
      '<path class="m-star" d="M32 35 l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6Z" fill="var(--copper-light)"/></g>' +
      '<path class="spark" style="--d:0s" d="M53 16 L54.2 19.8 L58 21 L54.2 22.2 L53 26 L51.8 22.2 L48 21 L51.8 19.8 Z" fill="var(--copper-light)"/>' +
      '<path class="spark" style="--d:.45s" d="M11 30 L11.9 33.1 L15 34 L11.9 34.9 L11 38 L10.1 34.9 L7 34 L10.1 33.1 Z" fill="var(--copper-light)"/></svg>' },
    { href: 'ideas.html', name: 'Ideas', icon: '<svg class="sb-ic bulb" viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle class="bulb-glow" cx="32" cy="25" r="19"/><g class="bulb-rays" stroke-linecap="round">' +
      '<path pathLength="1" d="M32 2v5"/><path pathLength="1" d="M11 12l3.5 3.5"/><path pathLength="1" d="M53 12l-3.5 3.5"/>' +
      '<path pathLength="1" d="M5 28h5"/><path pathLength="1" d="M54 28h5"/></g>' +
      '<path class="bulb-glass" d="M32 8c-9 0-16 7-16 15 0 6.5 3.3 10.5 7 13.3L24 42h16l1-5.7c3.7-2.8 7-6.8 7-13.3 0-8-7-15-16-15Z"/>' +
      '<path class="bulb-filament" d="M27 38 V29 c0 -4.5 2 -4.5 2 0 c0 -4.5 2 -4.5 2 0 c0 -4.5 2 -4.5 2 0 c0 -4.5 2 -4.5 2 0 c0 -4.5 2 -4.5 2 0 V38"/>' +
      '<rect class="bulb-base" x="25.5" y="42" width="13" height="7" rx="1.6"/><path class="bulb-thread" d="M25.5 45.3h13M25.5 48.6h11"/></svg>' },
    { href: 'contact.html', name: 'Contact', icon: '<svg class="sb-ic envelope" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect x="8" y="20" width="48" height="34" rx="2" fill="var(--avatar-bg)" stroke="var(--copper)" stroke-width="2"/>' +
      '<path class="flap-open" d="M8 20 L32 4 L56 20 Z" fill="var(--avatar-bg)" stroke="var(--copper)" stroke-width="2" stroke-linejoin="round"/>' +
      '<g class="letter"><rect x="15" y="24" width="34" height="22" rx="1.5" fill="var(--copper-light)"/>' +
      '<path d="M20 30 H44 M20 35 H36" stroke="var(--avatar-bg)" stroke-width="2" stroke-linecap="round"/></g>' +
      '<path d="M8 20 L32 40 L56 20 V52 H8 Z" fill="var(--avatar-bg)" stroke="var(--copper)" stroke-width="2" stroke-linejoin="round"/>' +
      '<path class="flap-closed" d="M8 20 L32 40 L56 20 Z" fill="var(--avatar-bg)" stroke="var(--copper-light)" stroke-width="2" stroke-linejoin="round"/></svg>' }
  ];
  var here = location.pathname.split('/').pop() || 'index.html';

  var panel = document.createElement('nav'); panel.className = 'sb-panel'; panel.id = 'sb-panel'; panel.setAttribute('aria-label', 'Explore');
  panel.innerHTML = '<p class="sb-label" aria-hidden="true" style="--i:0">Explore</p><div class="sb-list">' + PAGES.map(function (p, i) {
    return '<a class="sb-row" href="' + p.href + '"' + (p.href === here ? ' aria-current="page"' : '') + ' style="--i:' + (i + 1) + '">' +
      p.icon + '<span class="sb-name">' + p.name + '</span><span class="sb-go" aria-hidden="true"></span></a>';
  }).join('') + '</div>';
  var scrim = document.createElement('div'); scrim.className = 'sb-scrim'; scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim); document.body.appendChild(panel);
  var rows = [].slice.call(panel.querySelectorAll('.sb-row'));

  // ---- open / close ------------------------------------------------------------------------------------------
  var woke = false;
  function isOpen() { return root.classList.contains('sb-open'); }
  function place() { root.style.setProperty('--sb-top', Math.max(0, header.getBoundingClientRect().bottom).toFixed(0) + 'px'); }   // under the header
  function set(open, focusFirst) {
    if (open === isOpen()) return;
    if (open) place();
    root.classList.toggle('sb-open', open);
    btn.setAttribute('aria-expanded', open);
    rows.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    qubit(open);
    if (!open) return;
    if (!woke) { woke = true; if (!calm) playAll(420); }
    if (focusFirst) rows[0].focus({ preventScroll: true });
  }
  btn.hidden = false;
  rows.forEach(function (a) { a.tabIndex = -1; });
  btn.addEventListener('click', function (e) { set(!isOpen(), e.detail === 0); });   // from the keyboard, focus goes straight into the list
  scrim.addEventListener('click', function () { set(false); });
  rows.forEach(function (a) { if (a.hasAttribute('aria-current')) a.addEventListener('click', function (e) { e.preventDefault(); set(false); }); });   // already here
  window.addEventListener('resize', function () { if (isOpen()) place(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) set(false); });   // coming Back to this page: start closed
  window.addEventListener('keydown', function (e) {                                     // capture, ahead of the page's own Esc handling
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.stopPropagation(); set(false); btn.focus(); return; }
    if (e.key !== 'Tab') return;
    var ring = [btn].concat(rows), k = ring.indexOf(document.activeElement);            // focus cycles through the button and the rows
    e.preventDefault();
    ring[k < 0 ? 0 : (k + (e.shiftKey ? -1 : 1) + ring.length) % ring.length].focus();
  }, true);

  // ---- touch: the panel follows a finger dragged to the left, and closes if let go far enough (or flicked) --------
  var drag = null, dragged = false;
  panel.addEventListener('pointerdown', function (e) {
    dragged = false;
    if (e.pointerType === 'mouse' || !isOpen()) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, live: false };
  });
  panel.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.live) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }   // a vertical move is not a dismiss
      if (dx > -8) return;
      drag.live = true; dragged = true; panel.classList.add('is-dragging');
      try { panel.setPointerCapture(e.pointerId); } catch (err) {}
    }
    drag.dx = Math.min(0, dx);
    root.style.setProperty('--sb-drag', drag.dx.toFixed(1) + 'px');
    scrim.style.opacity = Math.max(0, 1 + drag.dx / panel.offsetWidth).toFixed(3);
  });
  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if (!d.live) return;
    panel.classList.remove('is-dragging'); scrim.style.opacity = ''; root.style.removeProperty('--sb-drag');
    var flick = d.dx / Math.max(1, e.timeStamp - d.t) < -0.45;
    if (d.dx < -panel.offsetWidth * 0.3 || flick) set(false);   // otherwise it springs back
  }
  panel.addEventListener('pointerup', release);
  panel.addEventListener('pointercancel', release);
  panel.addEventListener('click', function (e) { if (dragged) { e.preventDefault(); e.stopPropagation(); } dragged = false; }, true);   // a drag that began on a row is not a tap on it

  // ---- rows: the light follows the pointer; icons move on hover, and on touch a tap plays them before the page changes
  function wake(row, ms) {
    row.classList.remove('is-wake'); void row.offsetWidth; row.classList.add('is-wake');
    clearTimeout(row._wake); row._wake = setTimeout(function () { row.classList.remove('is-wake'); }, ms || 1300);
  }
  function playAll(start) {
    rows.forEach(function (row, i) {
      setTimeout(function () { row.style.setProperty('--mx', '40px'); row.style.setProperty('--my', '50%'); wake(row, 1100); }, start + i * 140);
    });
  }
  rows.forEach(function (row) {
    var pend = null, raf = 0;
    row.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') row.classList.add('is-hover'); });
    row.addEventListener('pointerleave', function () { row.classList.remove('is-hover'); });
    row.addEventListener('pointermove', function (e) {
      pend = e; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var r = row.getBoundingClientRect();
        row.style.setProperty('--mx', (pend.clientX - r.left).toFixed(0) + 'px'); row.style.setProperty('--my', (pend.clientY - r.top).toFixed(0) + 'px');
      });
    }, { passive: true });
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || calm) return;
      var r = row.getBoundingClientRect();
      row.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); row.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      wake(row, 900);
    });
  });

  // ---- the qubit: a Bloch-sphere state vector that precesses while the panel is open; the pointer on its row steers
  // the polar angle (top of the row = |0>, bottom = |1>) and speeds the precession up
  var qubit = (function () {
    var svg = panel.querySelector('.qubit'), card = svg.closest('.sb-row');
    function el(c) { return svg.querySelector(c); }
    var vec = el('.bl-vec'), tip = el('.bl-tip'), halo = el('.bl-halo'), orbit = el('.bl-orbit'), pole0 = el('.bl-pole0'), pole1 = el('.bl-pole1');
    var R = 21, SE = Math.sin(22 * Math.PI / 180), CE = Math.cos(22 * Math.PI / 180), TAU = Math.PI * 2;
    var IDLE_TH = 1.05, IDLE_SPIN = 0.9;
    var th = IDLE_TH, thT = IDLE_TH, ph = 0.6, spin = IDLE_SPIN, spinT = IDLE_SPIN, raf = 0, last = 0, live = false;
    function put(node, o) { for (var k in o) node.setAttribute(k, o[k].toFixed(2)); }
    function draw() {
      var st = Math.sin(th), ct = Math.cos(th), y = st * Math.sin(ph);
      var sx = 32 + R * st * Math.cos(ph), sy = 32 - R * (ct * CE + y * SE), depth = 0.55 + 0.45 * (1 - y) / 2;
      put(vec, { x2: sx, y2: sy, opacity: depth }); put(tip, { cx: sx, cy: sy, opacity: depth }); put(halo, { cx: sx, cy: sy, opacity: depth * 0.9 });
      put(orbit, { cy: 32 - R * ct * CE, rx: R * st, ry: R * st * SE });
      put(pole0, { r: 2 + 2.4 * Math.pow(Math.max(ct, 0), 6) }); put(pole1, { r: 2 + 2.4 * Math.pow(Math.max(-ct, 0), 6) });
    }
    function frame(t) {
      var dt = Math.min(Math.max((t - last) / 1000, 0), 0.05), k = 1 - Math.exp(-dt / 0.12);
      last = t; th += (thT - th) * k; spin += (spinT - spin) * k; ph = (ph + spin * dt) % TAU; draw();
      raf = live ? requestAnimationFrame(frame) : 0;
    }
    draw();
    function rest() { thT = IDLE_TH; spinT = IDLE_SPIN; }
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      thT = 0.18 + Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1) * (Math.PI - 0.36); spinT = 3.4;
    });
    card.addEventListener('mouseleave', rest);
    card.addEventListener('focus', function () { thT = Math.PI / 2; spinT = 3.4; });
    card.addEventListener('blur', rest);
    return function (on) {
      live = on && !calm;
      if (live && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
  })();
})();
