/* Poll /api/blog-feed and reload when CMS publishes or updates a post. */
(function () {
  'use strict';

  var root = document.querySelector('[data-blog-feed]');
  if (!root) return;

  var fingerprint = root.getAttribute('data-blog-feed');
  var pollMs = parseInt(root.getAttribute('data-blog-poll') || '8000', 10);
  var checking = false;

  function checkForUpdates() {
    if (checking || document.hidden) return;
    checking = true;

    fetch('/api/blog-feed', { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('feed unavailable');
        return res.json();
      })
      .then(function (data) {
        if (data.fingerprint && data.fingerprint !== fingerprint) {
          window.location.reload();
        }
      })
      .catch(function () {
        /* ignore transient errors while dev server syncs content */
      })
      .finally(function () {
        checking = false;
      });
  }

  setInterval(checkForUpdates, pollMs);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkForUpdates();
  });
  window.addEventListener('focus', checkForUpdates);
})();
