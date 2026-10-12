// Explore, beside the name: a glass button that opens the pages in a dropdown. The links are ordinary markup inside
// #xp-pop (they show as a plain list without JavaScript); this turns that list into a dropdown and gives the button
// a little life: a comet circles its rim (CSS), the letters ripple like a wave ("tarang") when you reach for it, a
// ring spreads out when it is pressed, and the panel pours out from under the pill instead of just appearing.
(function () {
  var btn = document.getElementById('xp-btn'), pop = document.getElementById('xp-pop');
  if (!btn || !pop) return;
  var links = [].slice.call(pop.querySelectorAll('a'));
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canMorph = !calm && !!pop.animate && window.CSS && CSS.supports('clip-path', 'inset(0px round 4px)');

  // letters of "Explore" become spans so they can ripple one after another
  var word = document.createElement('span'); word.className = 'xp-word'; word.setAttribute('aria-hidden', 'true');
  var label = btn.firstChild && btn.firstChild.nodeType === 3 ? btn.firstChild : null;
  var text = label ? label.textContent.trim() : 'Explore';
  Array.from(text).forEach(function (ch, i) { var s = document.createElement('span'); s.className = 'xp-ch'; s.style.setProperty('--i', i); s.textContent = ch; word.appendChild(s); });
  if (label) btn.replaceChild(word, label); else btn.insertBefore(word, btn.firstChild);
  btn.setAttribute('aria-label', text);
  var waving = false;
  function wave() {
    if (calm || waving) return;
    waving = true; btn.classList.add('is-waving');
    setTimeout(function () { btn.classList.remove('is-waving'); waving = false; }, 900);
  }
  function ripple() {
    if (calm) return;
    btn.classList.remove('is-ripple'); void btn.offsetWidth; btn.classList.add('is-ripple');
    setTimeout(function () { btn.classList.remove('is-ripple'); }, 700);
  }

  // the panel pours out of the pill: a pill-wide sliver at the panel's top edge grows to the full panel
  var anim = null;
  function sliver() {
    var p = pop.getBoundingClientRect(), b = btn.getBoundingClientRect();
    return 'inset(0px ' + Math.max(0, p.right - b.right) + 'px ' + (p.height - 10) + 'px ' + Math.max(0, b.left - p.left) + 'px round 18px)';
  }
  function show(open) {
    if (anim) { anim.cancel(); anim = null; }
    if (!canMorph) { pop.classList.toggle('is-open', open); return; }
    if (open) pop.classList.add('is-open');
    var from = sliver(), to = 'inset(0px 0px 0px 0px round 16px)';
    anim = pop.animate({ clipPath: open ? [from, to] : [to, from] },
      { duration: open ? 560 : 340, easing: open ? 'cubic-bezier(0.3, 0.9, 0.25, 1.08)' : 'cubic-bezier(0.5, 0, 0.75, 0)' });
    if (open) pop.querySelectorAll('.tab-card').forEach(function (r, i) {
      r.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 200 + i * 45, easing: 'ease-out', fill: 'backwards' });
    });
    anim.onfinish = function () { anim = null; if (!open) pop.classList.remove('is-open'); };
  }

  function set(open, focusFirst) {
    if (open === (btn.getAttribute('aria-expanded') === 'true') && pop.classList.contains('is-open') === open) return;
    show(open);
    btn.setAttribute('aria-expanded', open);
    links.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    if (open) { ripple(); wave(); pop.dispatchEvent(new Event('xp-open')); }   // links.js plays the icons once, on first open
    if (open && focusFirst) links[0].focus({ preventScroll: true });
  }
  btn.hidden = false;
  pop.classList.add('is-ready');
  if (canMorph) pop.classList.add('is-morph');
  links.forEach(function (a) { a.tabIndex = -1; });
  btn.addEventListener('click', function (e) { set(btn.getAttribute('aria-expanded') !== 'true', e.detail === 0); });   // keyboard opens straight into the list
  btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') wave(); });
  document.addEventListener('click', function (e) { if (!pop.contains(e.target) && !btn.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pop.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  // on touch screens nothing hovers, so the button says hello once, shortly after it comes into view
  if (!calm && 'IntersectionObserver' in window && !window.matchMedia('(hover: hover)').matches) {
    new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { ob.disconnect(); setTimeout(wave, 1200); } }, { threshold: 1 }).observe(btn);
  }
})();
