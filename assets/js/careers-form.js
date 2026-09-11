/* Careers application form: real-time validation plus Formspree submission.
   Mirrors the behaviour of the contact form so both feel identical. */
(function () {
  var form = document.getElementById('careers-form');
  if (!form) return;

  var status = document.getElementById('careers-status');
  var ENDPOINT = 'https://formspree.io/f/mdeokoel';

  var fields = [
    { el: document.getElementById('applicant-name'), label: 'your name' },
    { el: document.getElementById('applicant-email'), label: 'a valid email address' },
    { el: document.getElementById('position'), label: 'the position you are applying for' },
    { el: document.getElementById('cv-link'), label: 'a link to your CV' }
  ];

  function wrapOf(input) { return input.closest('.field'); }
  function errorOf(input) {
    var w = wrapOf(input);
    return w ? w.querySelector('.field-error') : null;
  }

  function messageFor(input, label) {
    if (!input.value.trim()) return 'Please enter ' + label + '.';
    if (input.type === 'email' && !input.checkValidity()) {
      return 'Please enter a valid email address, for example name@example.com.';
    }
    if (input.type === 'url' && !input.checkValidity()) {
      return 'Please enter a full link starting with https://';
    }
    return '';
  }

  function validate(input, label) {
    var msg = messageFor(input, label);
    var wrap = wrapOf(input);
    var err = errorOf(input);
    if (wrap) wrap.classList.toggle('invalid', !!msg);
    if (err) err.textContent = msg;
    return !msg;
  }

  fields.forEach(function (f) {
    if (!f.el) return;
    var live = false;
    f.el.addEventListener('blur', function () {
      live = true;
      validate(f.el, f.label);
    });
    f.el.addEventListener('input', function () {
      if (live) validate(f.el, f.label);
    });
  });

  function validateAll() {
    var ok = true;
    fields.forEach(function (f) {
      if (f.el && !validate(f.el, f.label)) ok = false;
    });
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateAll()) {
      status.style.color = '#C0392B';
      status.textContent = 'Please correct the highlighted fields and try again.';
      var firstBad = form.querySelector('.field.invalid input');
      if (firstBad) firstBad.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.style.color = 'var(--muted)';
    status.textContent = 'Sending your application…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          form.querySelectorAll('.field.invalid').forEach(function (w) { w.classList.remove('invalid'); });
          form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
          status.style.color = 'var(--green-700)';
          status.textContent = 'Thank you — your application has been sent. We will confirm receipt by email.';
        } else {
          var msg = (r.data && r.data.errors && r.data.errors.length)
            ? r.data.errors.map(function (x) { return x.message; }).join(' ')
            : 'Something went wrong sending your application.';
          status.style.color = '#C0392B';
          status.textContent = msg + ' You can also email info@medenxsolutions.com directly.';
        }
      })
      .catch(function () {
        status.style.color = '#C0392B';
        status.textContent = 'Your application could not be sent. Please check your connection, or email info@medenxsolutions.com directly.';
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = original;
      });
  });
})();
