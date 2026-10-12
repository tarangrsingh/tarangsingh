const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

// Exercise the shipped inline handler without sending mail or waiting 15 seconds.
const html = readFileSync(join(__dirname, '..', 'contact.html'), 'utf8');
const start = html.indexOf('  // Contact form:');
const source = html.slice(start, html.indexOf('</script>', start));
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function setup(fetchImpl, supportsAbort = true) {
  let submit, timeout, resets = 0, calls = 0, signal, cleared = false;
  const elements = {
    'form-status': {}, 'send-btn': { disabled: false },
    'cf-name': { value: 'Test' }, 'cf-email': { value: 'test@example.com' },
    'cf-purpose': { value: 'Test only' }, 'cf-message': { value: 'Keep this draft' },
    'contact-form': {
      querySelector: () => ({ value: '' }),
      addEventListener: (_, fn) => { submit = fn; },
      reset: () => { resets++; elements['cf-message'].value = ''; }
    }
  };
  vm.runInNewContext(source, {
    document: { getElementById: id => elements[id] },
    window: { AbortController: supportsAbort ? AbortController : undefined }, AbortController,
    fetch: (url, options) => { calls++; signal = options.signal; return fetchImpl(); },
    setTimeout: (fn, ms) => { assert.equal(ms, 15000); timeout = fn; return 1; },
    clearTimeout: () => { cleared = true; }
  });
  return {
    submit: () => submit({ preventDefault() {} }), expire: () => timeout(), elements,
    get resets() { return resets; }, get calls() { return calls; },
    get signal() { return signal; }, get cleared() { return cleared; }
  };
}
const success = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });

test('success resets the form, clears timeout and enables sending', async () => {
  const s = setup(success); s.submit(); await flush();
  assert.equal(s.resets, 1); assert.equal(s.elements['send-btn'].disabled, false);
  assert.equal(s.cleared, true); assert.match(s.elements['form-status'].textContent, /Thanks/);
});

for (const supportsAbort of [true, false]) {
  test(`stalled request preserves draft, ignores late success and allows retry (abort=${supportsAbort})`, async () => {
    let resolve;
    const s = setup(() => new Promise(r => { resolve = r; }), supportsAbort);
    s.submit(); s.submit(); await flush(); assert.equal(s.calls, 1);
    s.expire(); await flush();
    assert.equal(s.elements['send-btn'].disabled, false);
    assert.equal(s.elements['cf-message'].value, 'Keep this draft');
    assert.match(s.elements['form-status'].textContent, /delivery could not be confirmed/);
    if (supportsAbort) assert.equal(s.signal.aborted, true);
    resolve(await success()); await flush(); assert.equal(s.resets, 0);
    assert.match(s.elements['form-status'].textContent, /timed out/);
    s.submit(); await flush(); assert.equal(s.calls, 2);
    s.expire(); await flush();
  });
}

test('timeout also covers a stalled response body', async () => {
  const s = setup(() => Promise.resolve({ ok: true, json: () => new Promise(() => {}) }));
  s.submit(); await flush(); s.expire(); await flush();
  assert.equal(s.elements['send-btn'].disabled, false); assert.equal(s.resets, 0);
  assert.match(s.elements['form-status'].textContent, /timed out/);
});

for (const [name, response] of [
  ['network rejection', () => Promise.reject(new Error('offline'))],
  ['server rejection', () => Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false }) })],
  ['invalid JSON', () => Promise.resolve({ ok: true, json: () => Promise.reject(new Error('invalid JSON')) })],
  ['synchronous fetch failure', () => { throw new Error('fetch unavailable'); }]
]) {
  test(`${name} preserves draft and restores Send`, async () => {
    const s = setup(response); s.submit(); await flush();
    assert.equal(s.elements['send-btn'].disabled, false); assert.equal(s.resets, 0);
    assert.equal(s.elements['cf-message'].value, 'Keep this draft'); assert.equal(s.cleared, true);
    assert.match(s.elements['form-status'].textContent, /Something went wrong/);
  });
}
