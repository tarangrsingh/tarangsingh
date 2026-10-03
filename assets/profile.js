// Interactive profile photo. With a mouse it tilts toward the cursor and a soft light follows it; click, tap, Enter or
// Space opens a larger view that grows out of the thumbnail and shrinks back into it. Close with Esc, the X, or a click
// on the dark backdrop (clicking the photo itself does nothing). Honours prefers-reduced-motion.
//
// Design notes (these were the bugs): the grow-from rectangle is always measured with the tilt cleared, and opening
// and closing are the SAME Animation played forwards / in reverse, so nothing is left filled on the element and an
// interrupted open reverses smoothly from wherever it got to.
(function () {
  var thumb = document.querySelector('.profile-photo');
  if (!thumb) return;
  var html = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LARGE = 'assets/portrait-large.jpg';

  // ---- tilt -------------------------------------------------------------------------------------------------
  function resetTilt() {
    thumb.classList.remove('is-tracking');
    ['--rx', '--ry', '--sc', '--mx', '--my'].forEach(function (p) { thumb.style.removeProperty(p); });
  }
  if (!calm) {
    thumb.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && state === 'closed') thumb.classList.add('is-tracking'); });
    thumb.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || state !== 'closed') return;
      var r = thumb.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      thumb.style.setProperty('--ry', ((px - 0.5) * 22).toFixed(1) + 'deg');
      thumb.style.setProperty('--rx', ((0.5 - py) * 22).toFixed(1) + 'deg');
      thumb.style.setProperty('--sc', '1.08');
      thumb.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      thumb.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    thumb.addEventListener('pointerleave', resetTilt);
  }
  // Warm the larger image as soon as someone shows interest, so opening is instant.
  var warmed = false;
  function warm() { if (!warmed) { warmed = true; var i = new Image(); i.src = LARGE; } }
  thumb.addEventListener('pointerenter', warm); thumb.addEventListener('focus', warm); thumb.addEventListener('touchstart', warm, { passive: true });
  // ...and fetch it anyway once the page has settled, so a tap on a phone opens it with no wait.
  window.addEventListener('load', function () { setTimeout(warm, 1200); });

  // ---- enlarged view ----------------------------------------------------------------------------------------
  var lb, fig, closeBtn, anim = null, state = 'closed', openedAt = 0;   // closed | opening | open | closing
  var GUARD_MS = 400;                                                    // ignore accidental double-click closes

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
    lb.addEventListener('click', function (e) {
      if (e.target.closest('.lb-close')) { close(true); return; }
      if (e.target.closest('.lb-fig')) return;                          // clicking the photo does not close it
      close(false);                                                      // backdrop
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }    // the close button is the only stop
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb && !lb.hidden) { e.preventDefault(); close(true); }
    });
  }

  // Where the thumbnail really is, with tilt/zoom/press effects switched off so the answer is the same every time.
  function thumbRect() {
    resetTilt();
    thumb.classList.add('is-measuring');
    var r = thumb.getBoundingClientRect();
    thumb.classList.remove('is-measuring');
    return r;
  }
  // Transform + clip that make the large figure look exactly like the thumbnail (square crop, rounded corners).
  function fromThumb() {
    var a = thumbRect(), b = fig.getBoundingClientRect();
    var s = a.width / b.width, visible = Math.min((a.height / s) / b.height, 1);
    return {
      transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + s + ')',
      clipPath: 'inset(0 0 ' + ((1 - visible) * 100).toFixed(2) + '% 0 round ' + (26 / s).toFixed(1) + 'px)'
    };
  }
  var REST = { transform: 'none', clipPath: 'inset(0 0 0% 0 round 22px)' };

  function open() {
    if (state !== 'closed') return;
    state = 'opening'; openedAt = performance.now(); build(); resetTilt();
    lb.hidden = false; html.classList.add('lb-open');
    var img = fig.querySelector('img');
    var ready = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    ready.then(function () {
      if (state !== 'opening') return;                                   // closed while the image was decoding
      closeBtn.focus({ preventScroll: true });
      var from = (calm || !fig.animate) ? null : fromThumb();
      thumb.classList.add('is-hidden');
      lb.setAttribute('data-ready', '');
      void lb.offsetWidth;                                               // commit the starting style so the fades run
      lb.classList.add('is-in');
      if (!from) { state = 'open'; return; }
      anim = fig.animate([from, REST], { duration: 560, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      anim.onfinish = function () { if (state === 'opening') state = 'open'; };
    });
  }

  function finish() {
    if (anim) { anim.onfinish = null; anim.cancel(); anim = null; }     // cancel() leaves nothing filled behind
    lb.removeAttribute('data-ready'); lb.hidden = true; html.classList.remove('lb-open');
    thumb.classList.remove('is-hidden'); state = 'closed';
    thumb.focus({ preventScroll: true });
  }

  // `deliberate` = Esc or the X button. A backdrop click right after opening is treated as a stray double-click.
  function close(deliberate) {
    if (state !== 'open' && state !== 'opening') return;
    if (!deliberate && performance.now() - openedAt < GUARD_MS) return;
    state = 'closing';
    lb.classList.remove('is-in');
    if (!anim) { finish(); return; }
    anim.onfinish = null;
    anim.updatePlaybackRate(-1.25); anim.play();                         // reverse from wherever it currently is
    anim.onfinish = finish;
  }

  thumb.addEventListener('click', open);
})();
