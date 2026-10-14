// Prototype only: the live site posts to FormSubmit. Here the submit is caught
// so the page can show the states the real form needs — sending, sent, failed.
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    status.textContent = 'Sending…';
    setTimeout(function () {
      status.textContent = 'Sent. I usually reply within a couple of days. (Prototype: nothing was actually sent.)';
      form.reset();
    }, 600);
  });
})();
