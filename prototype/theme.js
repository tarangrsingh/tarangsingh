// Theme toggle. Dark is the default; light follows the OS until the reader
// chooses, after which the choice is remembered. The button is labelled with a
// word rather than a glyph, so nobody has to guess what it does.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  function current() { return root.dataset.theme || (mq.matches ? 'light' : 'dark'); }
  function label() {
    var next = current() === 'dark' ? 'light' : 'dark';
    btn.textContent = next === 'dark' ? 'Dark' : 'Light';
    btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
  }
  label();
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
  mq.addEventListener('change', label);
})();
