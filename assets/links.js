// Home links row: magnetic buttons. With a mouse each icon leans toward the cursor as it approaches; a press gives a
// squish-and-pop and a ring in the button's brand colour.
(function () {
  var links = document.querySelectorAll('.links a');
  if (!links.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  links.forEach(function (a) {
    if (fine) {
      a.addEventListener('pointermove', function (e) {
        var r = a.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        a.classList.add('is-near');
        a.style.setProperty('--mx', (dx * 0.3).toFixed(1) + 'px'); a.style.setProperty('--my', (dy * 0.3).toFixed(1) + 'px');
      });
      a.addEventListener('pointerleave', function () {
        a.classList.remove('is-near'); a.style.removeProperty('--mx'); a.style.removeProperty('--my');
      });
    }
    a.addEventListener('pointerdown', function () {
      a.classList.remove('is-pop'); void a.offsetWidth; a.classList.add('is-pop');
    });
    a.addEventListener('animationend', function (e) { if (e.pseudoElement === '::after' || e.animationName === 'link-ring') a.classList.remove('is-pop'); });
  });
})();
