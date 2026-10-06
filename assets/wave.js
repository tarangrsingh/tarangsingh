// Header wave (home page). "Tarang" means wave, so the mark behaves like one: scrolling plucks it. Scroll speed drives
// a lightly damped oscillator; its displacement swells the wave's amplitude and hurries its travel, and when the page
// stops it rings down and settles back to rest. Nothing runs while the page is still.
(function () {
  var mark = document.querySelector('.wave-mark');
  if (!mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var svg = mark.querySelector('svg'), flow = mark.querySelector('.wave-flow');
  var W = 9, ZETA = 0.32;                  // natural frequency (rad/s) and damping ratio: a couple of soft overshoots
  var x = 0, v = 0, drive = 0, lastY = window.scrollY, lastT = 0, raf = 0;
  function anim() { return flow && flow.getAnimations ? flow.getAnimations()[0] : null; }
  function frame(t) {
    var dt = Math.min(Math.max((t - (lastT || t)) / 1000, 0), 0.05); lastT = t;
    drive *= Math.exp(-dt / 0.3);          // the push fades soon after scrolling stops
    var a = -W * W * (x - drive) - 2 * ZETA * W * v;
    v += a * dt; x += v * dt;
    svg.style.transform = 'scaleY(' + Math.min(1 + 0.7 * x, 1.75).toFixed(3) + ')';
    var an = anim(); if (an) an.playbackRate = 1 + 2.5 * Math.max(x, 0);
    if (Math.abs(x) < 0.002 && Math.abs(v) < 0.002 && drive < 0.002) {
      x = v = drive = 0; svg.style.transform = ''; if (an) an.playbackRate = 1; raf = 0; lastT = 0; return;
    }
    raf = requestAnimationFrame(frame);
  }
  var lastEv = performance.now();
  window.addEventListener('scroll', function () {
    var now = performance.now(), y = window.scrollY, dt = Math.max(now - lastEv, 8) / 1000;
    var speed = Math.abs(y - lastY) / dt;  // px/s
    lastY = y; lastEv = now;
    drive = Math.max(drive, Math.min(speed / 2200, 1));
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
})();
