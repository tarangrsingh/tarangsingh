// Explore, beside the name: a glass button that opens the five pages in a dropdown. The links are ordinary markup
// inside #xp-pop (they show as a plain list without JavaScript); this only turns that list into a dropdown.
(function () {
  var btn = document.getElementById('xp-btn'), pop = document.getElementById('xp-pop');
  if (!btn || !pop) return;
  var links = [].slice.call(pop.querySelectorAll('a'));
  function set(open, focusFirst) {
    pop.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    links.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    if (open) pop.dispatchEvent(new Event('xp-open'));                 // links.js plays the icons once, on first open
    if (open && focusFirst) links[0].focus({ preventScroll: true });
  }
  btn.hidden = false;
  pop.classList.add('is-ready');
  set(false);
  btn.addEventListener('click', function (e) { set(btn.getAttribute('aria-expanded') !== 'true', e.detail === 0); });   // keyboard opens straight into the list
  document.addEventListener('click', function (e) { if (!pop.contains(e.target) && !btn.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pop.classList.contains('is-open')) { set(false); btn.focus(); }
  });
})();
