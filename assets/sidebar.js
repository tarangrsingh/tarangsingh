// Explore, in the header's top-left corner: a glass button opens the four pages in a frosted panel that slides in
// from the left edge, under the header. The links are ordinary markup inside #sb-panel (without JavaScript they show
// as a plain list under the profile links); this lifts that list into the panel. The button, the dimmed page, Esc or
// a swipe to the left closes it, and keyboard focus stays inside while it is open.
(function () {
  var root = document.documentElement, btn = document.getElementById('sb-btn'), panel = document.getElementById('sb-panel');
  var header = document.querySelector('header');
  if (!btn || !panel || !header) return;
  var links = [].slice.call(panel.querySelectorAll('a'));
  var scrim = document.createElement('div'); scrim.className = 'sb-scrim'; scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim);
  [panel.querySelector('.sb-label')].concat(links).forEach(function (el, i) { if (el) el.style.setProperty('--i', i); });   // arrival order

  var woke = false;
  function isOpen() { return root.classList.contains('sb-open'); }
  function place() { root.style.setProperty('--sb-top', header.getBoundingClientRect().bottom.toFixed(0) + 'px'); }   // panel starts under the header
  function set(open, focusFirst) {
    if (open === isOpen()) return;
    if (open) place();
    root.classList.toggle('sb-open', open);
    btn.setAttribute('aria-expanded', open);
    links.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    if (!open) return;
    if (!woke) { woke = true; panel.dispatchEvent(new Event('sb-open')); }   // links.js plays the icons once, on first open
    if (focusFirst) links[0].focus({ preventScroll: true });
  }

  btn.hidden = false;
  panel.classList.add('is-ready');
  links.forEach(function (a) { a.tabIndex = -1; });
  btn.addEventListener('click', function (e) { set(!isOpen(), e.detail === 0); });   // from the keyboard, focus goes straight into the list
  scrim.addEventListener('click', function () { set(false); });
  window.addEventListener('resize', function () { if (isOpen()) place(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) set(false); });   // coming Back to this page: start closed
  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') { set(false); btn.focus(); return; }
    if (e.key !== 'Tab') return;
    var ring = [btn].concat(links), k = ring.indexOf(document.activeElement);   // focus cycles through the button and the four links
    e.preventDefault();
    ring[k < 0 ? 0 : (k + (e.shiftKey ? -1 : 1) + ring.length) % ring.length].focus();
  });

  // Touch: the panel follows a finger dragged to the left, and closes if let go far enough (or flicked)
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
  panel.addEventListener('click', function (e) { if (dragged) { e.preventDefault(); e.stopPropagation(); } dragged = false; }, true);   // a drag that began on a link is not a tap on it
})();
