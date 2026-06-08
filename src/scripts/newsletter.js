/* Newsletter forms — POST to /api/subscribe and save subscriber emails. */
(function () {
  'use strict';

  function setFormState(form, state) {
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.news-status');

    if (state === 'loading') {
      if (btn) {
        btn.disabled = true;
        btn.dataset.prevText = btn.textContent;
        btn.textContent = 'Subscribing…';
      }
      if (msg) msg.textContent = '';
      return;
    }

    if (btn) {
      btn.disabled = false;
      if (btn.dataset.prevText) btn.textContent = btn.dataset.prevText;
    }

    if (state === 'success') {
      if (input) {
        input.value = '';
        input.placeholder = "You're on the list";
      }
      if (btn) btn.textContent = 'Thanks ✓';
      if (msg) msg.textContent = "You'll receive new blog posts by email.";
      return;
    }

    if (state === 'error' && msg) {
      msg.textContent = 'Something went wrong. Please try again.';
    }
  }

  document.querySelectorAll('.news-row').forEach(function (form) {
    if (!form.querySelector('.news-status')) {
      var status = document.createElement('p');
      status.className = 'news-status';
      status.setAttribute('aria-live', 'polite');
      form.insertAdjacentElement('afterend', status);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var email = input && input.value ? input.value.trim() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        var msg = form.nextElementSibling;
        if (msg && msg.classList.contains('news-status')) {
          msg.textContent = 'Please enter a valid work email.';
        }
        if (input) input.focus();
        return;
      }

      setFormState(form, 'loading');

      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            setFormState(form, 'success');
          } else {
            setFormState(form, 'error');
          }
        })
        .catch(function () {
          setFormState(form, 'error');
        });
    });
  });
})();
