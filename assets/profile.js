// Interactive profile photo. With a mouse it tilts toward the cursor and a soft light follows it; click, tap, Enter or
// Space opens a larger view that grows out of the thumbnail (and shrinks back into it). Esc, the X, or a click
// anywhere closes it. Honours prefers-reduced-motion (no tilt, no animation).
(function () {
  var thumb = document.querySelector('.profile-photo');
  if (!thumb) return;
  var html = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LARGE = 'assets/portrait-large.jpg';

  // ---- tilt -------------------------------------------------------------------------------------------------
  if (!calm) {
    thumb.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') thumb.classList.add('is-tracking'); });
    thumb.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = thumb.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      thumb.style.setProperty('--ry', ((px - 0.5) * 22).toFixed(1) + 'deg');
      thumb.style.setProperty('--rx', ((0.5 - py) * 22).toFixed(1) + 'deg');
      thumb.style.setProperty('--sc', '1.08');
      thumb.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      thumb.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    thumb.addEventListener('pointerleave', function () {
      thumb.classList.remove('is-tracking');
      ['--rx', '--ry', '--sc', '--mx', '--my'].forEach(function (p) { thumb.style.removeProperty(p); });
    });
  }
  // Warm the larger image as soon as someone shows interest, so opening is instant.
  var warmed = false;
  function warm() { if (!warmed) { warmed = true; var i = new Image(); i.src = LARGE; } }
  thumb.addEventListener('pointerenter', warm); thumb.addEventListener('focus', warm); thumb.addEventListener('touchstart', warm, { passive: true });

  // ---- enlarged view ----------------------------------------------------------------------------------------
  var lb, fig, closeBtn, state = 'closed', pendingClose = false;
  function build() {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo of Tarang Singh');
    lb.innerHTML = '<div class="lb-backdrop"></div>' +
      '<figure class="lb-fig"><img src="' + LARGE + '" width="800" height="1000" alt="Tarang Singh">' +
      '<button type="button" class="lb-close" aria-label="Close photo"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg></button></figure>';
    document.body.appendChild(lb);
    fig = lb.querySelector('.lb-fig'); closeBtn = lb.querySelector('.lb-close');
    lb.addEventListener('click', close);
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }   // the close button is the only stop
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb && !lb.hidden) { e.preventDefault(); close(); }
    });
  }

  // Transform that makes the large figure look exactly like the thumbnail (square crop, rounded corners).
  function fromThumb() {
    var a = thumb.getBoundingClientRect(), b = fig.getBoundingClientRect();
    var s = a.width / b.width, visible = Math.min((a.height / s) / b.height, 1);
    return {
      transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + s + ')',
      clipPath: 'inset(0 0 ' + ((1 - visible) * 100).toFixed(2) + '% 0 round ' + (26 / s).toFixed(1) + 'px)'
    };
  }
  var REST = { transform: 'none', clipPath: 'inset(0 0 0% 0 round 22px)' };
  var EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

  function settle() { state = 'open'; if (pendingClose) { pendingClose = false; close(); } }

  function open() {
    if (state !== 'closed') return;
    state = 'opening'; build();
    lb.hidden = false; html.classList.add('lb-open');
    var img = fig.querySelector('img');
    var ready = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    ready.then(function () {
      closeBtn.focus({ preventScroll: true });
      if (calm || !fig.animate) { thumb.classList.add('is-hidden'); settle(); return; }
      var from = fromThumb();
      thumb.classList.add('is-hidden');
      lb.querySelector('.lb-backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
      closeBtn.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: 560, easing: 'ease-out' });
      fig.animate([from, REST], { duration: 560, easing: EASE }).finished.then(settle, settle);
    });
  }

  function close() {
    if (state === 'opening') { pendingClose = true; return; }   // honour a close that arrives mid-animation
    if (state !== 'open') return;
    state = 'closing';
    function done() {
      lb.hidden = true; html.classList.remove('lb-open');
      thumb.classList.remove('is-hidden'); thumb.focus({ preventScroll: true }); state = 'closed';
    }
    if (calm || !fig.animate) { done(); return; }
    lb.querySelector('.lb-backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
    closeBtn.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    fig.animate([REST, fromThumb()], { duration: 440, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' }).finished.then(done, done);
  }

  thumb.addEventListener('click', open);
})();
