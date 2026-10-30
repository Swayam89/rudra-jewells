/* =============================================================================
   jewel.js · window.JewelScene: the fixed WebGL stage behind the page.

   One canvas, one context, three set pieces:
     hero      a round brilliant diamond turns under a moving light; the camera
               dives into its table and lands on the statement
     approach  a ring is made in five scrubbed stages: sketch (wireframe),
               band, setting (prongs rise), stone (drops in), finish (light sweep)
     late      metal preview (drag to turn, swatches) and the visit finale

   Everything is procedural: no models, no photographs, no textures from disk,
   so it runs from file://. ScrollTriggers are created synchronously in the
   inits (DOM order); THREE arrives later and only READS the scrubbed proxies.

   DOM HOOKS
     [data-stage] > [data-stage-canvas], [data-stage-fallback], [data-stage-halo], [data-stage-word]
     #hero [data-hero-letterbox] [data-hero-fade] .hero__copy
     #statement (gets .is-in at hero p ≥ .95; html.has-handoff while the hand-over is active)
     #approach .approach__step[data-step] .approach__rail [data-rail]
     #metal [data-metal-hit] .swatch[data-metal]
     #visit [data-visit-line]
   EVENTS  emits product:firstframe (opens the preloader gate), webgl:unsupported
   ========================================================================== */
(function (win, doc) {
  'use strict';
  var APP = win.APP;
  if (!APP || typeof APP.register !== 'function') return;

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }

  /* ---------------------------------------------------------------- state */
  // Scrubbed proxies (one per set piece). Timelines write them; the renderer reads them.
  var PX = { hero: { p: 0 }, approach: { p: 0 }, metal: { p: 0 }, visit: { p: 0 } };
  // ScrollTriggers that define when the stage is on screen (filled by the inits).
  var R = { hero: null, approach: null, approachPinned: false, metal: null, metalPinned: false, visit: null };
  var drag = { y: 0, v: 0, active: false };
  var pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  var METALS = { yellow: 0xF0C46A, rose: 0xEFB39A, white: 0xE2E3E0 };
  var metalTarget = 'yellow';
  var stageEl = null, canvasEl = null, haloEl = null;
  var webgl = false, threeDead = false, stillDirty = true;

  win.JewelScene = {
    PX: PX,
    setMetal: function (name) { if (METALS[name] != null) { metalTarget = name; stillDirty = true; } },
    nudge: function (v) { drag.v += v; stillDirty = true; }
  };

  /* ------------------------------------------------- which set piece is up */
  function scrollPos() { return win.pageYOffset || doc.documentElement.scrollTop || 0; }
  function inRange(st, pinned, y, vh) {
    if (!st) return false;
    return pinned ? (y >= st.start - vh && y <= st.end + vh) : (y >= st.start && y <= st.end);
  }
  function currentMode() {
    var y = scrollPos(), vh = win.innerHeight;
    if (!R.hero) return y < vh ? 'hero' : null;
    if (y <= R.hero.end + 1) return 'hero';
    if (threeDead) return null;                     // the SVG fallback belongs to the hero only
    if (inRange(R.approach, R.approachPinned, y, vh)) return 'approach';
    if (R.metal && R.visit) {
      var from = R.metalPinned ? R.metal.start - vh : R.metal.start;
      if (y >= from && y <= R.visit.end) return 'late';
    }
    return null;
  }

  /* ============================================================ INIT · hero */
  function initHero(A) {
    var hero = $('#hero');
    stageEl = $('[data-stage]');
    canvasEl = $('[data-stage-canvas]');
    haloEl = $('[data-stage-halo]');
    var gsap = A.gsap, ST = A.ScrollTrigger;
    if (!hero || !gsap || !ST) return;

    var word = $('[data-stage-word]');
    gsap.set(word, { xPercent: -50, yPercent: -52, x: 0, y: 0 });
    gsap.set(haloEl, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    // Stage visibility + the stage-wide loop (runs with or without WebGL).
    // Under reduced motion time stands still and frames are drawn only when something changed.
    var lastMode = 'init', drawnMode = null;
    A.loop(function (dt, ms) {
      var mode = currentMode();
      if (mode !== lastMode) {
        lastMode = mode;
        if (stageEl) stageEl.classList.toggle('is-hidden', !mode);
      }
      if (!mode || !webgl) return;
      if (A.reducedMotion) {
        if (mode === drawnMode && !stillDirty) return;
        drawnMode = mode; stillDirty = false;
        render(mode, 1, 0);
        return;
      }
      render(mode, dt, ms / 1000);
    });

    if (A.reducedMotion) {
      R.hero = ST.create({ trigger: hero, start: 'top top', end: 'bottom top' });
      PX.hero.p = 0.18;
      return;
    }

    doc.documentElement.classList.add('has-handoff');
    var statement = $('#statement');
    var copy = $('.hero__copy', hero);
    var handed = false;

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'hero', trigger: hero, start: 'top top', end: A.pinEnd(3.5),
        pin: true, scrub: 1, invalidateOnRefresh: true
      },
      onUpdate: function () {
        var on = PX.hero.p >= 0.95;
        if (statement && on !== statement.classList.contains('is-in')) {
          statement.classList.toggle('is-in', on);
          if (on && !handed) { handed = true; A.bus.emit('statement:handoff', {}); }
        }
      }
    });
    R.hero = tl.scrollTrigger;
    tl.to(PX.hero, { p: 1, duration: 1 }, 0)
      .to($$('[data-hero-fade]', hero), { autoAlpha: 0, duration: 0.08 }, 0)
      .to(copy, { yPercent: -14, autoAlpha: 0, duration: 0.22, ease: 'power1.in' }, 0.12)
      .to(word, { scale: 1.4, autoAlpha: 0, duration: 0.5 }, 0.04)
      .to($$('[data-hero-letterbox]', hero), { scaleY: 1, duration: 0.12, ease: 'power2.out' }, 0.46)
      .to($$('[data-hero-letterbox]', hero), { scaleY: 0, duration: 0.1, ease: 'power2.in' }, 0.84);
    tl.set({}, {}, 1);

    // Pointer: the stone leans toward it; the hero type layers drift by depth.
    if (A.isFine) {
      win.addEventListener('pointermove', function (e) {
        pointer.x = (e.clientX / win.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / win.innerHeight) * 2 - 1;
      }, { passive: true });
      A.loop(function (dt) {
        var nx = A.util.damp(pointer.sx, pointer.x, 4, dt), ny = A.util.damp(pointer.sy, pointer.y, 4, dt);
        if (Math.abs(nx - pointer.sx) + Math.abs(ny - pointer.sy) < 1e-4) return;
        pointer.sx = nx; pointer.sy = ny;
        hero.style.setProperty('--px', nx.toFixed(4));
        hero.style.setProperty('--py', ny.toFixed(4));
      });
    }
  }
  APP.register('jewel-hero', initHero, { order: 10, gate: true });

  /* ======================================================== INIT · approach */
  function initApproach(A) {
    var sec = $('#approach');
    var gsap = A.gsap, ST = A.ScrollTrigger;
    if (!sec || !gsap || !ST) return;
    var steps = $$('[data-step]', sec), rail = $$('[data-rail]', sec);
    var cur = -1;
    function setStep(i) {
      if (i === cur) return;
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      rail.forEach(function (s, k) { s.classList.toggle('is-on', k <= i); });
    }
    if (A.reducedMotion) {
      PX.approach.p = 1;
      setStep(4);
      R.approach = ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top' });
      R.approachPinned = false;
      return;
    }
    sec.classList.add('is-live');
    setStep(0);
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'approach', trigger: sec, start: 'top top', end: A.pinEnd(5),
        pin: true, scrub: 1, invalidateOnRefresh: true
      },
      onUpdate: function () { setStep(Math.min(4, Math.floor(PX.approach.p * 5 + 0.04))); }
    });
    tl.to(PX.approach, { p: 1, duration: 1 }, 0);
    tl.set({}, {}, 1);
    R.approach = tl.scrollTrigger;
    R.approachPinned = true;
  }
  APP.register('jewel-approach', initApproach, { order: 40 });

  /* =========================================================== INIT · metal */
  function initMetal(A) {
    var sec = $('#metal');
    var gsap = A.gsap, ST = A.ScrollTrigger;
    if (!sec || !gsap || !ST) return;

    // Swatches: a radio group with arrow-key support.
    var sw = $$('[data-metal]', sec);
    function pick(btn, focus) {
      sw.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      win.JewelScene.setMetal(btn.getAttribute('data-metal'));
      if (focus) btn.focus();
    }
    sw.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        pick(sw[(i + d + sw.length) % sw.length], true);
      });
    });

    // Drag to turn, with inertia; arrow keys nudge.
    var hit = $('[data-metal-hit]', sec);
    if (hit) {
      var lastX = 0;
      hit.addEventListener('pointerdown', function (e) {
        drag.active = true; lastX = e.clientX; drag.v = 0;
        try { hit.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      });
      hit.addEventListener('pointermove', function (e) {
        if (!drag.active) return;
        var dx = e.clientX - lastX; lastX = e.clientX;
        drag.y += dx * 0.009;
        drag.v = dx * 0.009;
        stillDirty = true;
      });
      function end() { drag.active = false; }
      hit.addEventListener('pointerup', end);
      hit.addEventListener('pointercancel', end);
      hit.addEventListener('lostpointercapture', end);
      hit.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { drag.v += 0.06; stillDirty = true; e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { drag.v -= 0.06; stillDirty = true; e.preventDefault(); }
      });
    }

    if (A.reducedMotion) {
      R.metal = ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top' });
      R.metalPinned = false;
      PX.metal.p = 0.5;
      return;
    }
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'metal', trigger: sec, start: 'top top', end: A.pinEnd(1.2),
        pin: true, scrub: 0.8, invalidateOnRefresh: true,
        onLeaveBack: function () { drag.y = 0; drag.v = 0; }
      }
    });
    tl.to(PX.metal, { p: 1, duration: 1 }, 0);
    tl.set({}, {}, 1);
    R.metal = tl.scrollTrigger;
    R.metalPinned = true;
  }
  APP.register('jewel-metal', initMetal, { order: 60 });

  /* =========================================================== INIT · visit */
  function initVisit(A) {
    var sec = $('#visit');
    var gsap = A.gsap, ST = A.ScrollTrigger;
    if (!sec || !gsap || !ST) return;
    R.visit = ST.create({ id: 'visit:range', trigger: sec, start: 'top bottom', end: 'bottom top' });
    if (A.reducedMotion) { PX.visit.p = 1; return; }
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { id: 'visit', trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true }
    });
    tl.to(PX.visit, { p: 1, duration: 1 }, 0)
      .fromTo($('[data-visit-line]', sec), { scaleX: 0.08 }, { scaleX: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, 0.7);
    tl.set({}, {}, 1);
  }
  APP.register('jewel-visit', initVisit, { order: 70 });

  /* ================================================================ THREE */
  var THREE, renderer, scene, camera;
  var heroD, heroMat, heroGlints = [];
  var ring, band, bandMat, wire, wireMat, prongs, ringStone, ringStoneMat, ringGlints = [];
  var dust, dustMat;
  var metalGoal = null;
  var CAM_Z = 7, FOV = 30;
  var size = { w: 0, h: 0 }, shiftNow = { x: 0, y: 0 };
  var stageAlpha = -1, haloScale = -1;
  var perf = { acc: 0, n: 0, since: 0, dpr: 0 };

  function fallback(why) {
    threeDead = true;
    doc.documentElement.classList.add('no-webgl');
    var f = $('[data-stage-fallback]');
    if (f) f.hidden = false;
    APP.bus.emit('webgl:unsupported', { module: 'product', reason: why });
  }

  APP.whenThree().then(function (res) {
    if (!res) return fallback('three unavailable');
    THREE = res.THREE;
    canvasEl = canvasEl || $('[data-stage-canvas]');
    if (!canvasEl) return fallback('no canvas');
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return fallback('renderer'); }
    if (!renderer.getContext()) return fallback('context');
    try { build(res.ADDONS || {}); }
    catch (e) { console.info('[jewel] scene build failed; showing the drawing instead.', e); return fallback('build'); }
  });

  /* ------------------------------------------------------------ geometry */
  // Round brilliant, girdle radius 1. Proportions follow a classic cut:
  // table 56%, crown 15% of the diameter, pavilion 43%, thin girdle.
  function brilliantGeometry() {
    var V = THREE.Vector3, pos = [];
    var g = 0.035, crownH = 0.3, pavD = 0.86, rt = 0.56;
    var T = [], M = [], G = [], B = [], P = [];
    var i, a;
    for (i = 0; i < 8; i++) {
      a = i * Math.PI / 4;
      T.push(new V(Math.cos(a) * rt, g + crownH, Math.sin(a) * rt));
      a = (i + 0.5) * Math.PI / 4;
      M.push(new V(Math.cos(a) * 0.79, g + crownH * 0.5, Math.sin(a) * 0.79));
      a = i * Math.PI / 4;
      P.push(new V(Math.cos(a) * 0.27, -g - pavD * 0.7, Math.sin(a) * 0.27));
    }
    for (i = 0; i < 16; i++) {
      a = i * Math.PI / 8;
      G.push(new V(Math.cos(a), g, Math.sin(a)));
      B.push(new V(Math.cos(a), -g, Math.sin(a)));
    }
    var C = new V(0, -g - pavD, 0), TOP = new V(0, g + crownH, 0);
    var ref = new V(0, -0.15, 0);
    var e1 = new V(), e2 = new V(), n = new V(), c = new V();
    function tri(p0, p1, p2) {
      e1.subVectors(p1, p0); e2.subVectors(p2, p0); n.crossVectors(e1, e2);
      c.copy(p0).add(p1).add(p2).multiplyScalar(1 / 3).sub(ref);
      if (n.dot(c) < 0) { var t = p1; p1 = p2; p2 = t; }
      pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }
    function m(k, n2) { return ((k % n2) + n2) % n2; }
    for (i = 0; i < 8; i++) {
      tri(TOP, T[i], T[m(i + 1, 8)]);                     // table
      tri(T[i], T[m(i + 1, 8)], M[i]);                    // star facets
      tri(T[i], M[m(i - 1, 8)], G[2 * i]);                // bezel (kite), two halves
      tri(T[i], G[2 * i], M[i]);
      tri(M[i], G[2 * i], G[2 * i + 1]);                  // upper girdle facets
      tri(M[i], G[2 * i + 1], G[m(2 * i + 2, 16)]);
    }
    for (i = 0; i < 16; i++) {                            // girdle band
      tri(G[i], B[i], B[m(i + 1, 16)]);
      tri(G[i], B[m(i + 1, 16)], G[m(i + 1, 16)]);
    }
    for (i = 0; i < 8; i++) {                             // pavilion
      var p0 = P[i], p1 = P[m(i + 1, 8)];
      tri(B[2 * i], B[2 * i + 1], p0);
      tri(B[2 * i + 1], B[m(2 * i + 2, 16)], p1);
      tri(B[2 * i + 1], p1, p0);
      tri(p0, p1, C);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();                           // non-indexed → flat facet normals
    return { geo: geo, crown: T.concat(M) };
  }

  // Ring band: a comfort-fit profile revolved, standing upright (hole facing the camera).
  function bandGeometry() {
    var V2 = THREE.Vector2, pts = [], ri = 0.86, ro = 1.0, hw = 0.12, r = 0.045, i, a;
    function arc(cx, cy, a0, a1) {
      for (i = 0; i <= 5; i++) { a = a0 + (a1 - a0) * i / 5; pts.push(new V2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
    }
    arc(ri + r, -hw + r, Math.PI, Math.PI * 1.5);            // inner bottom
    arc(ro - r, -hw + r, -Math.PI / 2, 0);                  // outer bottom
    arc(ro - r, hw - r, 0, Math.PI / 2);                    // outer top
    arc(ri + r, hw - r, Math.PI / 2, Math.PI);              // inner top
    pts.push(pts[0].clone());
    var geo = new THREE.LatheGeometry(pts, 128);
    geo.rotateX(Math.PI / 2);
    return { geo: geo, profile: pts };
  }

  function glintTexture() {
    var cv = doc.createElement('canvas'); cv.width = cv.height = 128;
    var g = cv.getContext('2d');
    var rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,250,1)'); rg.addColorStop(0.12, 'rgba(255,246,220,.55)'); rg.addColorStop(0.4, 'rgba(255,230,170,.08)'); rg.addColorStop(1, 'rgba(255,230,170,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'lighter';
    function ray(w, len, ang) {
      g.save(); g.translate(64, 64); g.rotate(ang);
      var lg = g.createLinearGradient(-len, 0, len, 0);
      lg.addColorStop(0, 'rgba(255,240,210,0)'); lg.addColorStop(0.5, 'rgba(255,252,240,.95)'); lg.addColorStop(1, 'rgba(255,240,210,0)');
      g.fillStyle = lg; g.fillRect(-len, -w / 2, len * 2, w); g.restore();
    }
    ray(2.2, 62, 0); ray(2.2, 62, Math.PI / 2); ray(1.2, 34, Math.PI / 4); ray(1.2, 34, -Math.PI / 4);
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ------------------------------------------------------------- shaders */
  var DIAMOND_VS = [
    'varying vec3 vObjPos;',
    'varying vec3 vObjN;',
    'varying vec3 vCamObj;',
    'void main(){',
    '  vObjPos = position;',
    '  vObjN = normal;',
    '  vCamObj = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;',
    '  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  // An analytic studio (forest void, a top softbox, strip lights, a warm gold card,
  // two hard points for fire) seen through a two-bounce internal path with
  // per-channel IOR, which is what makes the facets flash colour as it turns.
  var DIAMOND_FS = [
    'uniform mat4 modelMatrix;',
    'uniform float uEnvRot;',
    'uniform float uOpacity;',
    'uniform float uGain;',
    'varying vec3 vObjPos;',
    'varying vec3 vObjN;',
    'varying vec3 vCamObj;',
    'vec3 rotY(vec3 d, float a){ float c = cos(a), s = sin(a); return vec3(c*d.x - s*d.z, d.y, s*d.x + c*d.z); }',
    'vec3 env(vec3 d){',
    '  d = rotY(normalize(d), uEnvRot);',
    '  float y = d.y;',
    '  vec3 col = mix(vec3(0.010, 0.035, 0.024), vec3(0.055, 0.14, 0.095), smoothstep(-0.6, 0.8, y));',
    '  col += vec3(3.0, 2.95, 2.8) * smoothstep(0.80, 0.9, y);',
    '  float a = atan(d.z, d.x);',
    '  float strips = pow(max(0.0, cos(a * 4.0)), 70.0) * smoothstep(-0.35, 0.25, y) * (1.0 - smoothstep(0.7, 0.85, y));',
    '  col += vec3(2.5, 2.45, 2.3) * strips;',
    '  col += vec3(2.4, 1.55, 0.55) * pow(max(dot(d, normalize(vec3(-0.7, 0.25, 0.65))), 0.0), 36.0);',
    '  col += vec3(0.45, 0.42, 0.34) * (1.0 - smoothstep(-0.95, -0.55, y));',
    '  col += vec3(7.0) * pow(max(dot(d, normalize(vec3(0.5, 0.6, 0.62))), 0.0), 700.0);',
    '  col += vec3(6.0) * pow(max(dot(d, normalize(vec3(-0.45, 0.45, -0.77))), 0.0), 600.0);',
    '  return col;',
    '}',
    'vec3 pavN(vec3 dir){ vec2 r = normalize(dir.xz + vec2(1e-4, 0.0)); return normalize(vec3(r.x * 0.76, -0.65, r.y * 0.76)); }',
    'vec3 trace(vec3 V, vec3 N, float ior, mat3 M){',
    '  vec3 T = refract(V, N, 1.0 / ior);',
    '  vec3 R1 = T.y < 0.0 ? reflect(T, pavN(T)) : reflect(T, vec3(0.0, 1.0, 0.0));',
    '  vec3 R2 = R1.y < 0.0 ? reflect(R1, pavN(R1)) : R1;',
    '  vec3 nOut = normalize(vec3(0.0, 1.0, 0.0) + N * 0.45);',
    '  vec3 O = refract(R2, -nOut, ior);',
    '  if (dot(O, O) < 1e-4) O = reflect(R2, -nOut);',
    '  return env(normalize(M * O));',
    '}',
    'void main(){',
    '  vec3 N = normalize(vObjN);',
    '  vec3 V = normalize(vObjPos - vCamObj);',
    '  mat3 M = mat3(modelMatrix);',
    '  float cosT = clamp(dot(-V, N), 0.0, 1.0);',
    '  float F = 0.17 + 0.83 * pow(1.0 - cosT, 5.0);',
    '  vec3 refl = env(normalize(M * reflect(V, N)));',
    '  vec3 inner = vec3(trace(V, N, 2.36, M).r, trace(V, N, 2.42, M).g, trace(V, N, 2.50, M).b);',
    '  vec3 col = (refl * F + inner * (1.0 - F)) * uGain;',
    '  gl_FragColor = vec4(col, uOpacity);',
    '  #include <tonemapping_fragment>',
    '  #include <colorspace_fragment>',
    '}'
  ].join('\n');

  var DUST_VS = [
    'attribute float aSeed;',
    'uniform float uTime;',
    'uniform float uScroll;',
    'uniform float uPx;',
    'varying float vA;',
    'void main(){',
    '  vec3 p = position;',
    '  float depth = 0.25 + 0.75 * aSeed;',
    '  p.y = mod(position.y + uTime * 0.05 * (0.4 + aSeed) + uScroll * 1.6 * depth + 5.0, 10.0) - 5.0;',
    '  p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.08;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  gl_PointSize = (1.2 + 2.6 * fract(aSeed * 13.7)) * uPx * (6.0 / max(0.5, -mv.z));',
    '  vA = (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 60.0), 3.0)) * smoothstep(0.4, 2.0, -mv.z);',
    '}'
  ].join('\n');
  var DUST_FS = [
    'uniform float uOpacity;',
    'uniform vec3 uColor;',
    'varying float vA;',
    'void main(){',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = (1.0 - smoothstep(0.0, 0.5, d)) * vA * uOpacity;',
    '  gl_FragColor = vec4(uColor * a, a);',
    '  #include <colorspace_fragment>',
    '}'
  ].join('\n');

  function diamondMaterial() {
    return new THREE.ShaderMaterial({
      vertexShader: DIAMOND_VS, fragmentShader: DIAMOND_FS, transparent: true,
      uniforms: { uEnvRot: { value: 0 }, uOpacity: { value: 1 }, uGain: { value: 1 } }
    });
  }
  function addGlints(parent, pts, scale, list, tex) {
    for (var i = 0; i < pts.length; i++) {
      var sm = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      var s = new THREE.Sprite(sm);
      s.position.copy(pts[i]).multiplyScalar(1.02);
      s.scale.setScalar(scale);
      s.userData.phase = i * 2.39996;
      parent.add(s);
      list.push(s);
    }
  }

  /* --------------------------------------------------------------- build */
  function build(ADD) {
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    perf.dpr = APP.util.dprCap();
    renderer.setPixelRatio(perf.dpr);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);

    if (ADD.RoomEnvironment) {
      var pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(new ADD.RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    // A low warm key for the metal's edges; lights never change count at runtime.
    var key = new THREE.DirectionalLight(0xfff1d6, 1.2);
    key.position.set(3, 4, 5);
    scene.add(key);

    var tex = glintTexture();
    var D = brilliantGeometry();
    var pick = [0, 2, 5, 9, 12, 14];   // a few crown corners that flash

    // Hero diamond
    heroMat = diamondMaterial();
    heroD = new THREE.Mesh(D.geo, heroMat);
    heroD.rotation.order = 'XYZ';
    scene.add(heroD);
    addGlints(heroD, pick.map(function (k) { return D.crown[k]; }), 0.55, heroGlints, tex);

    // Ring
    ring = new THREE.Group();
    var inner = new THREE.Group();
    inner.position.y = -0.22;
    ring.add(inner);
    metalGoal = new THREE.Color(METALS.yellow);
    bandMat = new THREE.MeshPhysicalMaterial({ color: METALS.yellow, metalness: 1, roughness: 0.17, envMapIntensity: 1.25, transparent: true, opacity: 1 });
    var BG = bandGeometry();
    band = new THREE.Mesh(BG.geo, bandMat);
    inner.add(band);

    // Setting: gallery rail + six prongs, grown from the top of the band.
    prongs = new THREE.Group();
    prongs.position.y = 0.99;
    inner.add(prongs);
    var gal = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 12, 48), bandMat);
    gal.rotation.x = Math.PI / 2;
    gal.position.y = 0.12;
    prongs.add(gal);
    var gal2 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 36), bandMat);
    gal2.rotation.x = Math.PI / 2;
    gal2.position.y = 0.02;
    prongs.add(gal2);
    var stoneS = 0.36, seatY = 0.33;               // girdle height above the band top
    var i;
    for (i = 0; i < 6; i++) {
      var a = i * Math.PI / 3 + Math.PI / 6, ca = Math.cos(a), sa = Math.sin(a);
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ca * 0.09, 0.0, sa * 0.09),
        new THREE.Vector3(ca * 0.2, 0.14, sa * 0.2),
        new THREE.Vector3(ca * 0.35, seatY - 0.01, sa * 0.35),
        new THREE.Vector3(ca * 0.33, seatY + 0.08, sa * 0.33)
      ]);
      prongs.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.022, 8, false), bandMat));
      var tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), bandMat);
      tip.position.set(ca * 0.33, seatY + 0.08, sa * 0.33);
      prongs.add(tip);
    }

    // The stone for the ring (same cut, smaller).
    ringStoneMat = diamondMaterial();
    ringStone = new THREE.Group();
    var rs = new THREE.Mesh(D.geo, ringStoneMat);
    rs.scale.setScalar(stoneS);
    ringStone.add(rs);
    ringStone.position.y = 0.99 + seatY;
    inner.add(ringStone);
    addGlints(rs, pick.map(function (k) { return D.crown[k]; }), 0.7, ringGlints, tex);

    // The sketch: CAD-like gold lines for band sections, the stone and the setting.
    var lines = [];
    var prof = BG.profile, k, j;
    for (k = 0; k < 28; k++) {
      var ang = k / 28 * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
      for (j = 0; j < prof.length - 1; j++) {
        var p0 = prof[j], p1 = prof[j + 1];
        // lathe: (x, y) → (x cos, y, x sin), then rotateX(90°): (x', y', z') = (x, -z, y)
        lines.push(p0.x * c, -p0.x * s, p0.y, p1.x * c, -p1.x * s, p1.y);
      }
    }
    var wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    wireMat = new THREE.LineBasicMaterial({ color: 0xE9CF8C, transparent: true, opacity: 0, depthWrite: false });
    wire = new THREE.Group();
    wire.add(new THREE.LineSegments(wireGeo, wireMat));
    wire.add(new THREE.LineSegments(new THREE.EdgesGeometry(BG.geo, 30), wireMat));
    var stoneEdges = new THREE.LineSegments(new THREE.EdgesGeometry(D.geo, 1), wireMat);
    stoneEdges.scale.setScalar(stoneS);
    stoneEdges.position.y = 0.99 + seatY;
    wire.add(stoneEdges);
    inner.add(wire);
    scene.add(ring);

    // Gold dust: depth-layered points that drift and move with the scroll at their own depth.
    var N = APP.isMobile ? 260 : 650, rnd = APP.util.rng(7), dp = new Float32Array(N * 3), ds = new Float32Array(N);
    for (i = 0; i < N; i++) {
      dp[i * 3] = (rnd() * 2 - 1) * 7;
      dp[i * 3 + 1] = (rnd() * 2 - 1) * 5;
      dp[i * 3 + 2] = -6 + rnd() * 9.5;
      ds[i] = rnd();
    }
    var dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uPx: { value: perf.dpr }, uOpacity: { value: 1 }, uColor: { value: new THREE.Color(0xE9CF8C) } }
    });
    dust = new THREE.Points(dg, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    resize();
    APP.bus.on('resize', resize);

    // Compile every material while everything is visible, then show the first frame.
    var first = function () {
      try {
        webgl = true;
        render(currentMode() || 'hero', 0, 0);
      } catch (e) {
        console.info('[jewel] first frame failed; showing the drawing instead.', e);
        webgl = false;
        return fallback('first frame');
      }
      APP.bus.emit('product:firstframe', {});
    };
    var p = null;
    try { p = renderer.compileAsync ? renderer.compileAsync(scene, camera) : null; } catch (e) { p = null; }
    if (p && p.then) p.then(first, first); else first();
  }

  function resize() {
    if (!renderer) return;
    var w = win.innerWidth, h = win.innerHeight;
    size.w = w; size.h = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    shiftNow.x = shiftNow.y = 1e9;   // force the view offset to re-apply
    camera.updateProjectionMatrix();
    stillDirty = true;
  }

  function setShift(sx, sy) {
    if (Math.abs(sx - shiftNow.x) < 1e-4 && Math.abs(sy - shiftNow.y) < 1e-4) return;
    shiftNow.x = sx; shiftNow.y = sy;
    if (Math.abs(sx) < 1e-4 && Math.abs(sy) < 1e-4) camera.clearViewOffset();
    else camera.setViewOffset(size.w, size.h, -sx * size.w, sy * size.h, size.w, size.h);
    camera.updateProjectionMatrix();
  }

  function setStageAlpha(a) {
    a = Math.round(a * 100) / 100;
    if (a === stageAlpha) return;
    stageAlpha = a;
    APP.gsap.set(canvasEl, { opacity: a });
    if (haloEl) APP.gsap.set(haloEl, { opacity: a });
  }
  function setHaloScale(s) {
    s = Math.round(s * 100) / 100;
    if (s === haloScale || !haloEl) return;
    haloScale = s;
    APP.gsap.set(haloEl, { scale: s });
  }

  function glint(list, t, spin, strength) {
    for (var i = 0; i < list.length; i++) {
      var g = list[i], ph = g.userData.phase;
      var v = Math.max(0, Math.sin(t * 1.1 + ph + spin * 2.6));
      g.material.opacity = Math.pow(v, 14) * strength;
    }
  }

  /* -------------------------------------------------------------- render */
  function render(mode, dt, t) {
    var U = APP.util, sstep = U.sstep, lerp = U.lerp;
    var portrait = camera.aspect < 0.85;
    var visH = 2 * CAM_Z * Math.tan(FOV * Math.PI / 360), visW = visH * camera.aspect;
    var y = scrollPos();
    dustMat.uniforms.uTime.value = t;
    dustMat.uniforms.uScroll.value = y / Math.max(1, size.h);

    // Metal colour eases toward the picked swatch.
    metalGoal.setHex(METALS[metalTarget]);
    bandMat.color.lerp(metalGoal, 1 - Math.exp(-6 * dt));

    if (mode === 'hero') {
      var p = PX.hero.p, dive = sstep(0.7, 1, p), diveE = dive * dive;
      heroD.visible = true; ring.visible = false;
      // Framed in the top half: the name and the booking button own the lower half.
      var fit = Math.min(1, visW * (portrait ? 0.78 : 0.5) / 2, visH * 0.3 / 1.23);
      heroD.scale.setScalar(fit * (1 + 0.1 * sstep(0, 0.6, p)));
      var lift = visH * 0.2;
      heroD.position.set(0, lift * (1 - sstep(0.55, 0.9, p)) + Math.sin(t * 0.8) * 0.035 * (1 - dive), lerp(0, 5.9, diveE));
      heroD.rotation.x = lerp(0.36 + pointer.sy * 0.12, Math.PI / 2, sstep(0.58, 0.92, p));
      heroD.rotation.y = t * 0.16 + p * Math.PI * 1.6 + pointer.sx * 0.35;
      heroMat.uniforms.uEnvRot.value = p * Math.PI * 2.4 + t * 0.05;
      heroMat.uniforms.uGain.value = 1 + dive * 0.5;
      glint(heroGlints, t, heroD.rotation.y, 1 - dive);
      dustMat.uniforms.uOpacity.value = 1 - dive * 0.6;
      setShift(0, 0);
      setStageAlpha(1 - sstep(0.94, 1, p));
      setHaloScale(1 + dive * 1.4);
    } else {
      heroD.visible = false; ring.visible = true;
      var fitR = portrait ? Math.min(visW * 0.78 / 2.3, visH * 0.42 / 2.9) : Math.min(1, visH * 0.7 / 2.9, visW * 0.4 / 2.3);
      var spin = 0, tilt = 0.2, sx = 0, sy = 0, sc = fitR, yOff = 0;
      if (mode === 'approach') {
        var q = PX.approach.p;
        wireMat.opacity = 0.9 * sstep(0.0, 0.1, q) * (1 - sstep(0.36, 0.5, q));
        bandMat.opacity = sstep(0.2, 0.36, q);
        band.visible = bandMat.opacity > 0.001;
        var grow = sstep(0.42, 0.56, q);
        prongs.visible = grow > 0.001;
        prongs.scale.set(1, Math.max(0.001, grow), 1);
        var drop = sstep(0.6, 0.76, q);
        ringStone.visible = q > 0.58;
        ringStoneMat.uniforms.uOpacity.value = sstep(0.58, 0.64, q);
        ringStone.position.y = 0.99 + 0.33 + (1 - drop) * (1 - drop) * 2.2;
        ringStoneMat.uniforms.uEnvRot.value = sstep(0.8, 1, q) * Math.PI * 2 + t * 0.05;
        ringStoneMat.uniforms.uGain.value = 1 + 0.35 * sstep(0.8, 0.9, q) * (1 - sstep(0.92, 1, q));
        spin = -0.6 + q * Math.PI * 1.4 + t * 0.12;
        tilt = 0.22;
        sx = portrait ? 0 : 0.2;
        sy = portrait ? 0.2 : 0;
        dustMat.uniforms.uOpacity.value = 0.55;
        glint(ringGlints, t, spin, sstep(0.78, 0.9, q));
      } else {
        var mp = PX.metal.p, v = PX.visit.p, w = sstep(0, 0.5, v);
        wireMat.opacity = 0; bandMat.opacity = 1; band.visible = true;
        prongs.visible = true; prongs.scale.set(1, 1, 1);
        ringStone.visible = true; ringStoneMat.uniforms.uOpacity.value = 1;
        ringStone.position.y = 0.99 + 0.33;
        ringStoneMat.uniforms.uGain.value = 1;
        ringStoneMat.uniforms.uEnvRot.value = t * 0.08 + drag.y * 0.5;
        if (!drag.active) {
          drag.y += drag.v;
          drag.v *= Math.pow(0.9, dt * 60);
          if (Math.abs(drag.v) < 1e-5) drag.v = 0;
        }
        spin = 0.5 + drag.y + mp * 0.9 + t * 0.1;
        tilt = 0.2 + sstep(0.5, 1, v) * 0.15;
        sx = portrait ? 0 : lerp(0.14, 0.24, w);
        sy = portrait ? lerp(0.1, 0.27, w) : 0;
        sc = fitR * lerp(1, portrait ? 0.62 : 0.86, w);
        yOff = -0.25 * sstep(0.6, 1, v);
        dustMat.uniforms.uOpacity.value = 0.45;
        glint(ringGlints, t, spin, 0.9);
      }
      ring.scale.setScalar(sc);
      ring.position.set(0, yOff + Math.sin(t * 0.7) * 0.02, 0);
      ring.rotation.set(tilt, spin, 0);
      setShift(sx, sy);
      setStageAlpha(1);
      setHaloScale(1);
    }

    renderer.render(scene, camera);
    if (!APP.reducedMotion && dt > 0) adapt(dt);
  }

  // Adaptive resolution: if frames run long for two windows in a row, step the DPR down.
  function adapt(dt) {
    perf.since += dt;
    if (perf.since < 3) return;
    perf.acc += dt; perf.n++;
    if (perf.n < 60) return;
    var avg = perf.acc / perf.n;
    perf.acc = 0; perf.n = 0;
    if (avg > 0.024 && perf.dpr > 1) {
      perf.slow = (perf.slow || 0) + 1;
      if (perf.slow >= 2) {
        perf.slow = 0;
        perf.dpr = Math.max(1, Math.round((perf.dpr - 0.25) * 100) / 100);
        renderer.setPixelRatio(perf.dpr);
        renderer.setSize(size.w, size.h, false);
        dustMat.uniforms.uPx.value = perf.dpr;
        APP.bus.emit('perf:dpr', { module: 'jewel', dpr: perf.dpr });
      }
    } else perf.slow = 0;
  }
})(window, document);
