// Lab layer, shared by every page:
//  1. Instant-feeling navigation: internal pages are prefetched the moment you show intent (hover, focus, touch).
//  2. Command palette: Ctrl/Cmd + K or "/" jumps anywhere on the site from the keyboard.
//  3. Pointer light on cards (scholastic / research), rAF-throttled.
//  4. A hello for anyone who opens DevTools.
(function () {
  var doc = document, html = doc.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 1. prefetch ------------------------------------------------------------------------------------------
  // Chromium: speculation rules prerender on hover (moderate). Elsewhere: a plain <link rel=prefetch> on intent.
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    var sr = doc.createElement('script'); sr.type = 'speculationrules';
    sr.textContent = JSON.stringify({ prerender: [{ where: { href_matches: '/*.html' }, eagerness: 'moderate' }],
      prefetch: [{ where: { href_matches: '/*.html' }, eagerness: 'moderate' }] });
    doc.head.appendChild(sr);
  }
  var fetched = {};
  function warm(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.origin !== location.origin || !/\.html?$/.test(a.pathname) || a.pathname === location.pathname) return;
    if (fetched[a.href]) return; fetched[a.href] = 1;
    var l = doc.createElement('link'); l.rel = 'prefetch'; l.href = a.href; doc.head.appendChild(l);
  }
  doc.addEventListener('pointerover', warm, { passive: true });
  doc.addEventListener('focusin', warm);
  doc.addEventListener('touchstart', warm, { passive: true });

  // ---- 2. command palette -----------------------------------------------------------------------------------
  var ITEMS = [
    { ic: '⌂', t: 'Home', href: 'index.html', k: 'g h' },
    { ic: '★', t: 'Scholastic Achievements', href: 'scholastic.html', k: 'g s' },
    { ic: 'ψ', t: 'Research Experience', href: 'research.html', k: 'g r' },
    { ic: '∂', t: 'Ideas', href: 'ideas.html', k: 'g i' },
    { ic: '✳', t: 'Quote of the Week', href: 'star.html', k: 'g q' },
    { ic: '✉', t: 'Contact', href: 'contact.html', k: 'g c' },
    { ic: '⎙', t: 'CV', href: 'Tarang_Singh_CV.pdf', k: 'g v', blank: true },
    { ic: '◐', t: 'Toggle light / dark', run: function () { var b = doc.getElementById('theme-toggle'); if (b) b.click(); }, k: 't' }
  ];
  var kp, input, list, sel = 0, shown = [], lastFocus = null;
  function build() {
    if (kp) return;
    kp = doc.createElement('div'); kp.className = 'kp'; kp.hidden = true;
    kp.setAttribute('role', 'dialog'); kp.setAttribute('aria-modal', 'true'); kp.setAttribute('aria-label', 'Go to');
    kp.innerHTML = '<div class="kp-backdrop"></div><div class="kp-panel">' +
      '<svg class="kp-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
      '<input class="kp-input" type="text" placeholder="Go to…" aria-label="Go to" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="kp-list">' +
      '<ul class="kp-list" id="kp-list" role="listbox"></ul>' +
      '<div class="kp-foot"><span><kbd>↑</kbd> <kbd>↓</kbd></span><span><kbd>↵</kbd></span><span><kbd>esc</kbd></span></div></div>';
    doc.body.appendChild(kp);
    input = kp.querySelector('.kp-input'); list = kp.querySelector('.kp-list');
    kp.querySelector('.kp-backdrop').addEventListener('click', close);
    input.addEventListener('input', function () { sel = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); }
    });
    list.addEventListener('pointermove', function (e) {
      var li = e.target.closest('.kp-item'); if (!li) return;
      var i = +li.dataset.i; if (i !== sel) { sel = i; paint(); }
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('.kp-item'); if (li) go(shown[+li.dataset.i]); });
  }
  function score(it, q) {               // tiny fuzzy match: every query letter must appear in order
    if (!q) return 1;
    var s = it.t.toLowerCase(), j = 0, pts = 0;
    for (var i = 0; i < q.length; i++) { var f = s.indexOf(q[i], j); if (f < 0) return 0; pts += f === j ? 2 : 1; j = f + 1; }
    return pts + (s.indexOf(q) === 0 ? 10 : 0);
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    shown = ITEMS.map(function (it) { return { it: it, s: score(it, q) }; }).filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.it; });
    list.innerHTML = shown.length ? shown.map(function (it, i) {
      return '<li class="kp-item" role="option" id="kp-o' + i + '" data-i="' + i + '"><span class="kp-ic" aria-hidden="true">' + it.ic + '</span>' +
        it.t + '<span class="kp-k" aria-hidden="true">' + it.k + '</span></li>';
    }).join('') : '<li class="kp-empty">No match</li>';
    paint();
  }
  function paint() {
    Array.prototype.forEach.call(list.querySelectorAll('.kp-item'), function (li, i) {
      li.setAttribute('aria-selected', i === sel ? 'true' : 'false');
      if (i === sel) { input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
    });
  }
  function open() {
    build(); if (!kp.hidden) return;
    lastFocus = doc.activeElement; input.value = ''; sel = 0; render();
    kp.hidden = false; void kp.offsetWidth; kp.classList.add('is-in'); input.focus({ preventScroll: true });
  }
  function close() {
    if (!kp || kp.hidden) return;
    kp.classList.remove('is-in');
    setTimeout(function () { kp.hidden = true; }, calm ? 0 : 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function go(it) {
    if (!it) return;
    if (it.run) { close(); it.run(); return; }
    if (it.blank) { close(); window.open(it.href, '_blank', 'noopener'); return; }
    location.href = it.href;
  }
  function typing(t) { return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  var gPending = 0;
  doc.addEventListener('keydown', function (e) {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); (kp && !kp.hidden) ? close() : open(); return; }
    if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); open(); return; }
    // vim-ish two-key jumps: "g" then a letter
    if (e.key === 'g') { gPending = Date.now(); return; }
    if (gPending && Date.now() - gPending < 900) {
      gPending = 0;
      for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].k === 'g ' + e.key.toLowerCase()) { e.preventDefault(); go(ITEMS[i]); return; }
    }
  });
  // Footer hint (keyboard devices only, via CSS)
  var copy = doc.querySelector('.footer-copy');
  if (copy) {
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var hint = doc.createElement('button'); hint.type = 'button'; hint.className = 'kp-hint';
    hint.setAttribute('aria-label', 'Open quick navigation');
    hint.innerHTML = '<span class="kbd">' + (mac ? '⌘' : 'Ctrl') + '</span> <span class="kbd">K</span>';
    hint.addEventListener('click', open);
    copy.appendChild(hint);
  }

  // ---- 3. pointer light on cards ----------------------------------------------------------------------------
  if (!calm && window.matchMedia('(hover: hover)').matches) {
    doc.querySelectorAll('.sx-card, .sx-stat').forEach(function (c) {
      var pend = null, raf = 0;
      c.addEventListener('pointerenter', function () { c.classList.add('is-lit'); });
      c.addEventListener('pointerleave', function () { c.classList.remove('is-lit'); });
      c.addEventListener('pointermove', function (e) {
        pend = e; if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0; var r = c.getBoundingClientRect();
          c.style.setProperty('--mx', (pend.clientX - r.left).toFixed(0) + 'px');
          c.style.setProperty('--my', (pend.clientY - r.top).toFixed(0) + 'px');
        });
      }, { passive: true });
    });
  }

  // ---- 4. DevTools hello ------------------------------------------------------------------------------------
  try {
    console.log('%c∿∿∿  तरंग · tarang · wave  ∿∿∿', 'font: 600 14px Inter, sans-serif; color: #6ea0d8; padding: 6px 0;');
    console.log('%cOpen source: https://github.com/tarangrsingh/tarangsingh  ·  Press Ctrl/⌘ K to jump around.', 'color: #8b9ab0;');
  } catch (err) {}
})();
