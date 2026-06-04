// legal-toc.js — table-of-contents scroll-spy for the Privacy/Terms pages.
// Highlights the .legal-toc link whose section is currently in view.
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('.legal-toc a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) map[id] = a;
  });
  var current = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        if (current) current.classList.remove('is-active');
        current = map[e.target.id];
        if (current) current.classList.add('is-active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
})();
