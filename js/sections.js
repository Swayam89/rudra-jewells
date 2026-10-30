/* =============================================================================
   sections.js · every chapter that is not the WebGL stage.
   Each init creates its ScrollTriggers synchronously, registered in DOM order
   (order = section position × 10). Copy reveals that sit inside a pinned
   section register just BEFORE that section's pin (order − 1) so they measure
   the unpinned page.
   ========================================================================== */
(function (win, doc) {
  'use strict';
  var APP = win.APP;
  if (!APP || typeof APP.register !== 'function') return;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }

  /* ------------------------------------------------------- 01 · hero intro */
  function initHeroIntro(A) {
    var gsap = A.gsap;
    if (!gsap) return;
    A.bus.when('preloader:done', function () {
      A.splitReveal('.hero__name', { type: 'chars', trigger: false, stagger: 0.045, duration: 1.5, from: { yPercent: 115 } });
      if (A.reducedMotion) return;
      gsap.from(['.hero__mono', '.hero__eyebrow', '.hero__tag', '.hero__actions'], {
        y: 26, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, delay: 0.2, clearProps: 'transform'
      });
    });
  }
  APP.register('hero-intro', initHeroIntro, { order: 11 });

  /* -------------------------------------------------------- 02 · statement */
  function initStatement(A) {
    var sec = $('#statement');
    var gsap = A.gsap, ST = A.ScrollTrigger;
    if (!sec || !gsap) return;
    var lead = $('[data-statement-lead]', sec), body = $('[data-split-words]', sec);
    var handoff = doc.documentElement.classList.contains('has-handoff');

    if (handoff) {
      A.bus.when('statement:handoff', function () {
        A.splitReveal(lead, { type: 'lines', trigger: false, duration: 1.3, stagger: 0.12 });
        gsap.from([$('.statement__eyebrow', sec), $('.statement__sign', sec)], { autoAlpha: 0, y: 14, duration: 1.1, ease: 'expo.out', stagger: 0.3 });
      });
    } else {
      A.splitReveal(lead, { type: 'lines', start: 'top 80%' });
    }
    if (!A.reducedMotion) {
      A.splitReveal(body, { type: 'words', mask: false, scrub: 0.6, from: { opacity: 0.14 }, stagger: 0.1, start: 'top 88%', end: 'bottom 52%' });
    }

    // Phones: the floating booking button shows between the hero and the visit section.
    var fab = $('[data-fab]');
    if (fab && ST) {
      ST.create({
        id: 'fab', trigger: sec, start: 'top 60%', endTrigger: '#visit', end: 'top 75%', refreshPriority: -1,
        onToggle: function (s) { fab.classList.toggle('is-on', s.isActive); }
      });
    }
  }
  APP.register('statement', initStatement, { order: 20 });

  /* ------------------------------------------------------------ 03 · craft */
  function initCraft(A) {
    var sec = $('#craft');
    var gsap = A.gsap, ST = A.ScrollTrigger;
    if (!sec || !gsap || !ST) return;
    A.splitReveal($('h2', sec), { type: 'lines', start: 'top 78%' });

    var track = $('[data-craft-track]', sec);
    var panels = $$('.craft__panel', sec);
    var rail = !A.reducedMotion && !A.isMobile && win.innerWidth > 768;

    // Line drawings: each stroke draws itself in.
    var draws = panels.map(function (p) {
      var list = $$('[data-draw] > *', p);
      if (!A.reducedMotion) list.forEach(function (el) {
        var L = el.getTotalLength ? Math.ceil(el.getTotalLength()) + 1 : 0;
        if (L) gsap.set(el, { strokeDasharray: L, strokeDashoffset: L });
      });
      return list;
    });
    // Depth: halo behind, glints in front of the drawing.
    panels.forEach(function (p) {
      gsap.set($('.piece', p), { transformPerspective: 1000, transformStyle: 'preserve-3d' });
      gsap.set($('.piece__halo', p), { z: -60 });
      gsap.set($('.piece__glints', p), { z: 80 });
    });
    if (A.reducedMotion) return;

    var tween = null;
    if (rail && track) {
      var dist = function () { return Math.max(0, track.scrollWidth - win.innerWidth); };
      tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          id: 'craft', trigger: sec, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true
        }
      });
    }
    panels.forEach(function (p, i) {
      var piece = $('.piece', p);
      var base = tween
        ? { trigger: p, containerAnimation: tween }
        : { trigger: p };
      gsap.to(draws[i], {
        strokeDashoffset: 0, ease: 'none', stagger: 0.06,
        scrollTrigger: Object.assign({ start: tween ? 'left 92%' : 'top 88%', end: tween ? 'left 38%' : 'top 40%', scrub: 0.6 }, base)
      });
      gsap.fromTo(piece, { rotationY: 32 }, {
        rotationY: -32, ease: 'none',
        scrollTrigger: Object.assign({ start: tween ? 'left right' : 'top bottom', end: tween ? 'right left' : 'bottom top', scrub: true }, base)
      });
      gsap.fromTo($('.craft__num', p), { autoAlpha: 0, x: -16 }, {
        autoAlpha: 1, x: 0, ease: 'none',
        scrollTrigger: Object.assign({ start: tween ? 'left 85%' : 'top 85%', end: tween ? 'left 60%' : 'top 60%', scrub: 0.6 }, base)
      });
      // Pointer tilt (rotationX only, so it never fights the scroll's rotationY).
      if (A.isFine && piece) {
        var rx = gsap.quickTo(piece, 'rotationX', { duration: 0.8, ease: 'power3.out' });
        piece.addEventListener('pointermove', function (e) {
          var r = piece.getBoundingClientRect();
          rx(-((e.clientY - r.top) / r.height - 0.5) * 22);
        });
        piece.addEventListener('pointerleave', function () { rx(0); });
      }
    });
  }
  APP.register('craft', initCraft, { order: 30 });

  /* --------------------------------------------- 04 · approach copy (pre-pin) */
  function initApproachCopy(A) {
    var sec = $('#approach');
    if (!sec || !A.gsap) return;
    A.splitReveal($('.approach__title', sec), { type: 'lines', start: 'top 75%' });
    if (!A.reducedMotion) {
      A.gsap.from([$('.approach__eyebrow', sec), $('.approach__rail', sec)], {
        autoAlpha: 0, y: 16, duration: 1.1, ease: 'expo.out', stagger: 0.15,
        scrollTrigger: { trigger: sec, start: 'top 70%' }
      });
    }
  }
  APP.register('approach-copy', initApproachCopy, { order: 39 });

  /* ------------------------------------------------------- 05 · the house */
  function initHouse(A) {
    var sec = $('#house');
    var gsap = A.gsap;
    if (!sec || !gsap) return;
    A.splitReveal($('h2', sec), { type: 'lines', start: 'top 75%' });
    A.splitReveal($('.house__body', sec), { type: 'lines', start: 'top 85%', stagger: 0.06 });
    if (A.reducedMotion) return;
    var mono = $('[data-house-mono]', sec), ghost = $('.house__ghost', sec);
    var range = { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.8 };
    if (mono) gsap.fromTo(mono, { rotationY: -55, transformPerspective: 1400 }, { rotationY: 55, ease: 'none', scrollTrigger: range });
    if (ghost) {
      gsap.set(ghost, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
      gsap.fromTo(ghost, { x: function () { return -win.innerWidth * 0.1; } }, { x: function () { return win.innerWidth * 0.1; }, ease: 'none', scrollTrigger: Object.assign({ invalidateOnRefresh: true }, range) });
    }
    gsap.from($('.house__sign', sec), { autoAlpha: 0, y: 20, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: $('.house__sign', sec), start: 'top 90%' } });
  }
  APP.register('house', initHouse, { order: 50 });

  /* ------------------------------------------------ 06 · metal copy (pre-pin) */
  function initMetalCopy(A) {
    var sec = $('#metal');
    if (!sec || !A.gsap) return;
    A.splitReveal($('h2', sec), { type: 'lines', start: 'top 70%' });
  }
  APP.register('metal-copy', initMetalCopy, { order: 59 });

  /* ------------------------------------------------------------ 07 · visit */
  function initVisit(A) {
    var sec = $('#visit');
    var gsap = A.gsap;
    if (!sec || !gsap) return;
    A.splitReveal($('h2', sec), { type: 'lines', start: 'top 72%' });
    if (A.reducedMotion) return;
    gsap.from([$('.visit__lead', sec), $('.visit__copy .btn', sec)], {
      autoAlpha: 0, y: 18, duration: 1.1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: $('.visit__lead', sec), start: 'top 88%' }
    });
    gsap.from($$('.visit__details > div', sec), {
      autoAlpha: 0, y: 18, duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: $('[data-visit-details]', sec), start: 'top 90%' }
    });
  }
  APP.register('visit-copy', initVisit, { order: 71 });
})(window, document);
