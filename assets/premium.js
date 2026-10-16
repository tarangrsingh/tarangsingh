// Visitor number for this browser session (see the footer counter below). Shared with basic.html via window.siteVisitor.
// The count lives with Abacus (no server on GitHub Pages). The first page of a session records a hit; if that fails or
// is slow, it falls back to reading the current total, so the footer still shows a number. Add #counter-debug to any
// page's address to see, in the footer, exactly why the number is missing.
window.siteVisitor = function (show, fail) {
  var KEY = 'visitor-number', BASE = 'https://abacus.jasoncameron.dev/', NS = 'tarangrsingh-github-io/visits', n = null;
  var debug = /counter-debug/.test(location.hash);
  try { n = parseInt(sessionStorage.getItem(KEY), 10); } catch (e) {}
  if (n > 0) { show(n); return; }
  if (!window.fetch) { if (debug && fail) fail('this browser has no fetch()'); return; }
  function ask(path, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    return fetch(BASE + path + NS, Object.assign({ cache: 'no-store', mode: 'cors' }, ctl ? { signal: ctl.signal } : {}))
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error(path + ' answered HTTP ' + r.status); return r.json(); })
      .then(function (d) { var v = parseInt(d && d.value, 10); if (!(v > 0)) throw new Error(path + ' gave no number: ' + JSON.stringify(d).slice(0, 80)); return v; })
      .catch(function (e) { clearTimeout(timer); throw new Error(e && e.name === 'AbortError' ? path + ' took longer than ' + ms / 1000 + ' s' : (e && e.message) || String(e)); });
  }
  var first = '';
  ask('hit/', 10000)
    .catch(function (e) { first = e.message; return ask('get/', 8000); })
    .then(function (v) {
      try { sessionStorage.setItem(KEY, String(v)); } catch (e) {}
      show(v);
    })
    .catch(function (e) {
      var why = (first ? first + '; then ' : '') + e.message + (/fetch|NetworkError|Load failed/i.test(e.message) ? ' (blocked: CORS, an ad blocker or the network)' : '');
      if (window.console) console.warn('Visitor counter unavailable: ' + why);
      if (debug && fail) fail(why);
    });
};

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header gains depth once the page has scrolled beneath it.
  var header = document.querySelector('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Scroll reveal (each page's own script) staggers sections with an inline transition-delay. Once a section is in,
  // drop that delay, otherwise every later hover transition on the card starts late.
  document.addEventListener('transitionend', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('reveal') && t.classList.contains('in-view') && t.style.transitionDelay) t.style.transitionDelay = '';
  });

  // Footer: the time in Varanasi, and how it relates to the reader's own clock. Researchers write from every time
  // zone; this answers "is it a sensible hour to expect a reply?" without asking.
  var copy = document.querySelector('.footer-copy');
  if (copy && window.Intl && Intl.DateTimeFormat) {
    var lt = document.createElement('span'); lt.className = 'local-time';
    copy.appendChild(lt);
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    var rel = function () {
      var d = 330 + new Date().getTimezoneOffset();          // minutes IST is ahead of the reader (IST = UTC+5:30)
      if (!d) return 'same time as you';
      var a = Math.abs(d), h = Math.floor(a / 60), m = a % 60;
      return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : '') + (d > 0 ? ' ahead of you' : ' behind you');
    };
    var tick = function () {
      lt.innerHTML = 'Varanasi ' + fmt.format(new Date()) + ' IST <span class="lt-rel">(' + rel() + ')</span>';
      setTimeout(tick, 60000 - Date.now() % 60000 + 50);   // update on the minute
    };
    tick();
  }

  // Visitor counter. GitHub Pages has no server, so the count lives with a free counter service (Abacus). A visitor is
  // counted once per browser session: the first page they open records a hit and remembers their number, every later
  // page in that session just shows it. If the service is slow or down, nothing is shown.
  var footerCopy = document.querySelector('.footer-copy');
  if (footerCopy) {
    var place = function (text) {
      var vc = document.createElement('span'); vc.className = 'visit-count';
      vc.textContent = text;
      var after = footerCopy.querySelector('.local-time');   // sits right after the local time, before the Ctrl K hint
      footerCopy.insertBefore(vc, after ? after.nextSibling : footerCopy.querySelector('.kp-hint'));
    };
    window.siteVisitor(function (n) { place('Visitor #' + n.toLocaleString('en-US')); },
                       function (why) { place('Visitor counter: ' + why); });
  }

  // Theme switch. The page's own click handler still does the real work (toggling html.light-mode); we wrap it.
  // While the theme flips, every CSS colour transition is switched off (html.theme-switching), so the page lands on its
  // final colours in one frame instead of fading element by element, which read as a washed-out blink. Where view
  // transitions exist, the new theme is then revealed as a circle growing out of the toggle button.
  var btn = document.getElementById('theme-toggle');
  if (btn) {
    var root = document.documentElement;
    var canVT = !reduce && typeof document.startViewTransition === 'function';
    var busy = false, refire = false;
    var settle = function () {                 // keep transitions off until the new colours have been painted
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('theme-switching'); }); });
    };
    btn.addEventListener('click', function (e) {
      if (refire) return;                      // our own re-fired click: let the original handler toggle the theme
      if (!canVT) { root.classList.add('theme-switching'); settle(); return; }   // instant, clean switch
      e.stopImmediatePropagation();
      if (busy) return;                        // ignore clicks while a reveal is still running
      busy = true;
      var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('theme-vt', 'theme-switching');
      var vt = document.startViewTransition(function () { refire = true; try { btn.click(); } finally { refire = false; } });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 600, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
      vt.finished.finally(function () { busy = false; root.classList.remove('theme-vt'); settle(); });
    }, true);
  }
})();
