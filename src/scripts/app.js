/* =============================================================
   TAVALI — Interactions
   ============================================================= */
(function () {
  'use strict';

  /* ---------- Dot-matrix icon renderer ----------
     Every icon is literally drawn from the brand's 5x5 dot grid.
     Pattern: 25 chars. 0 = dim/background dot, 1 = solid, 2 = "lit" accent.
     Palette chosen by container class: .dots--on-dark / .dots--on-accent,
     default is on-light.                                                */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function renderDots(el) {
    var pattern = (el.getAttribute('data-dots') || '').replace(/[^0-2]/g, '');
    if (pattern.length < 25) return;
    var size = parseInt(el.getAttribute('data-size') || '44', 10);
    var cols = 5, gap = size / 5, off = gap / 2, r = size / 14;

    var pal;
    if (el.classList.contains('dots--on-dark')) {
      pal = { 0: ['#FFFFFF', 0.18], 1: ['#FFFFFF', 0.92], 2: ['#5B8AC0', 1] };
    } else if (el.classList.contains('dots--on-accent')) {
      pal = { 0: ['#FFFFFF', 0.32], 1: ['#FFFFFF', 1], 2: ['#13294B', 1] };
    } else {
      pal = { 0: ['#9AA7B5', 0.28], 1: ['#0F2A4A', 1], 2: ['#4A7DB5', 1] };
    }

    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    for (var i = 0; i < 25; i++) {
      var v = pattern[i];
      var row = Math.floor(i / cols), col = i % cols;
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', off + col * gap);
      c.setAttribute('cy', off + row * gap);
      c.setAttribute('r', v === '0' ? r * 0.82 : r);
      c.setAttribute('fill', pal[v][0]);
      c.setAttribute('fill-opacity', pal[v][1]);
      svg.appendChild(c);
    }
    el.appendChild(svg);
  }
  document.querySelectorAll('[data-dots]').forEach(renderDots);

  /* ---------- Hero animated dot-matrix ----------
     A living grid behind the headline: dim base dots, a few pulsing
     accent "lit" dots, and a slow data-sweep that lights dots as it
     passes — reads as AI / connectivity. Static frame if reduced motion. */
  (function heroDots() {
    var canvas = document.querySelector('.hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hero = canvas.closest('.hero');
    var STEP = 28, R = 1.6, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cols = 0, rows = 0, lit = [];
    var ACCENT = '74,125,181', ACCENT_BR = '91,138,192', WHITE = '255,255,255';

    function seedLit() {
      lit = [];
      var n = Math.max(6, Math.round(cols * rows * 0.012));
      for (var i = 0; i < n; i++) {
        lit.push({
          c: Math.floor(Math.random() * cols),
          r: Math.floor(Math.random() * Math.min(rows, Math.ceil(rows * 0.7))),
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 0.8,
          bright: Math.random() > 0.55
        });
      }
    }
    function resize() {
      var rect = hero.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / STEP) + 1;
      rows = Math.ceil(H / STEP) + 1;
      seedLit();
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      // base grid — with a gentle diagonal shimmer wave rippling across it
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = c * STEP + 6, y = r * STEP + 6;
          // diagonal phase: dots brighten in a slow travelling wave
          var sh = 0.5 + 0.5 * Math.sin(t * 0.0011 - (c * 0.55 + r * 0.4));
          var a = 0.09 + sh * 0.13;        // opacity oscillates ~0.09–0.22
          ctx.beginPath();
          ctx.arc(x, y, R + sh * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + WHITE + ',' + a + ')';
          ctx.fill();
        }
      }
      // data-sweep: a soft vertical wavefront travelling left→right, looping
      var sweepX = ((t * 0.045) % (W + 240)) - 120;
      for (var r2 = 0; r2 < rows; r2++) {
        for (var c2 = 0; c2 < cols; c2++) {
          var sx = c2 * STEP + 6;
          var d = Math.abs(sx - sweepX);
          if (d < 70) {
            var k = 1 - d / 70;
            var sy = r2 * STEP + 6;
            ctx.beginPath();
            ctx.arc(sx, sy, R + k * 1.7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + ACCENT_BR + ',' + (k * 0.5) + ')';
            ctx.fill();
          }
        }
      }
      // pulsing lit accent dots
      for (var i = 0; i < lit.length; i++) {
        var L = lit[i];
        var px = L.c * STEP + 6, py = L.r * STEP + 6;
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.001 * L.speed + L.phase);
        var col = L.bright ? ACCENT_BR : ACCENT;
        // glow
        ctx.beginPath();
        ctx.arc(px, py, R + 3.2 + pulse * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + col + ',' + (0.10 + pulse * 0.14) + ')';
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.arc(px, py, R + 0.7 + pulse * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + col + ',' + (0.55 + pulse * 0.4) + ')';
        ctx.fill();
      }
    }

    var raf = null, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }

    resize();
    if (reduce) {
      draw(1400); // single representative static frame
    } else {
      raf = requestAnimationFrame(loop);
    }
    var rz;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () { resize(); if (reduce) draw(1400); }, 150);
    }, { passive: true });

    // Pause when hero off-screen to save cycles
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); }
          else if (raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(hero);
    }
  })();

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Desktop dropdowns (click + hover + keyboard) ---------- */
  var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-dd'));
  function closeAllDD(except) {
    navItems.forEach(function (it) {
      if (it !== except) {
        it.classList.remove('open');
        var t = it.querySelector('.nav-link');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  }
  navItems.forEach(function (item) {
    var trigger = item.querySelector('.nav-link');
    var closeTimer;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = item.classList.contains('open');
      closeAllDD(item);
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
    item.addEventListener('mouseenter', function () {
      clearTimeout(closeTimer);
      closeAllDD(item);
      item.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('mouseleave', function () {
      closeTimer = setTimeout(function () {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 120);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item.has-dd')) closeAllDD(null);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAllDD(null); closeMobile(); }
  });

  /* ---------- Mobile menu ---------- */
  var body = document.body;
  var burger = document.querySelector('.hamburger');
  var scrim = document.querySelector('.scrim');
  function openMobile() {
    body.classList.add('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
  }
  function closeMobile() {
    body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) burger.addEventListener('click', function () {
    body.classList.contains('menu-open') ? closeMobile() : openMobile();
  });
  if (scrim) scrim.addEventListener('click', closeMobile);

  document.querySelectorAll('.m-section.has-sub > button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sec = btn.parentElement;
      var open = sec.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.querySelectorAll('.mobile-menu a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', closeMobile);
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Newsletter (no-op demo) ---------- */
  var news = document.querySelector('.news-row');
  if (news) news.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = news.querySelector('input');
    var btn = news.querySelector('button');
    if (input && input.value) { btn.textContent = 'Thanks ✓'; input.value = ''; input.placeholder = "You're on the list"; }
  });

  /* ---------- Reveal on scroll (progressive enhancement) ----------
     Important: CSS transitions are paused while a document isn't being
     painted (some embedded / preview / prerender contexts). So we never
     let visibility DEPEND on a transition completing. If the observer
     doesn't actually fire, we snap content visible with transition off. */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  function snapAll() {
    revealEls.forEach(function (el) { el.style.transition = 'none'; el.classList.add('in'); });
  }

  if (reduce || !('IntersectionObserver' in window)) {
    snapAll();
  } else {
    var ioFired = false;
    var io = new IntersectionObserver(function (entries) {
      ioFired = true; // a working observer always delivers an initial callback
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    // If the observer never fires (paused/hidden context), reveal everything
    // instantly so the page is never stuck blank.
    setTimeout(function () { if (!ioFired) snapAll(); }, 1200);
    // Absolute backstop: anything still hidden after 3s gets snapped on.
    setTimeout(function () {
      var stuck = document.querySelectorAll('[data-reveal]:not(.in)');
      if (stuck.length) stuck.forEach(function (el) { el.style.transition = 'none'; el.classList.add('in'); });
    }, 3000);
  }
})();
