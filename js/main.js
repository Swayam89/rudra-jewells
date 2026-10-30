/* ==========================================================================
   Rudra Jewells v2: nav, hero carousel, collections gallery, lightbox.
   Plain JS, no dependencies. Reads window.RUDRA (config.js) and
   window.RUDRA_CATALOGUE (catalogue.js).
   ========================================================================== */
(function () {
  "use strict";

  var R = window.RUDRA || {};
  var CATALOGUE = window.RUDRA_CATALOGUE || [];
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var CAT_LABEL = { necklaces: "Necklaces", rings: "Rings", earrings: "Earrings", bangles: "Bangles", bridal: "Bridal" };

  doc.classList.add("js");
  if (R.showSampleTags !== false) doc.classList.add("show-sample-tags");

  /* ---------- Contact bindings from config ---------- */
  if (R.waLink) {
    $$("[data-wa]").forEach(function (a) {
      a.href = R.waLink(a.getAttribute("data-wa") || undefined);
      a.target = "_blank";
      a.rel = "noopener";
    });
  }
  $$("[data-bind]").forEach(function (el) {
    var v = R[el.getAttribute("data-bind")];
    if (v) el.textContent = v;
  });
  $$("[data-href]").forEach(function (el) {
    var v = R[el.getAttribute("data-href")];
    if (v) el.href = v;
  });
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Image URLs: Unsplash placeholder or local file ---------- */
  function imgUrl(src, w, h) {
    if (/^photo-/.test(src)) {
      return "https://images.unsplash.com/" + src + "?auto=format&fit=crop&w=" + w + (h ? "&h=" + h : "") + "&q=70";
    }
    return src;
  }
  function isStock(src) { return /^photo-/.test(src); }

  /* ==========================================================================
     NAV
     ========================================================================== */
  var nav = $("#nav");
  var menu = $("#menu");
  var menuBtn = $(".nav__menu");

  function setMenu(open) {
    if (!menu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    $(".nav__menu-label", menuBtn).textContent = open ? "Close" : "Menu";
    document.body.classList.toggle("menu-open", open);
    if (open) {
      menu.hidden = false;
      menu.classList.add("is-open");
      var first = $("a", menu);
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.hidden = true;
      menu.classList.remove("is-open");
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && menuBtn.getAttribute("aria-expanded") === "true") setMenu(false);
    });
  }

  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Highlight the nav link of the section in view
  if ("IntersectionObserver" in window) {
    var navLinks = $$(".nav__links a");
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove("is-current"); });
        if (byId[en.target.id]) byId[en.target.id].classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });
  }

  /* ==========================================================================
     HERO CAROUSEL
     ========================================================================== */
  (function hero() {
    var root = $(".hero");
    if (!root) return;
    var slides = $$(".slide", root);
    var dots = $$(".hero__dots button", root);
    var pauseBtn = $("[data-hero='pause']", root);
    var DURATION = 6500;
    var index = 0, timer = null;
    var userPaused = reduceMotion, hovered = false, focused = false;

    root.style.setProperty("--hero-ms", DURATION + "ms");

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var on = n === index;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", String(!on));
        if (on) {
          var img = $("img", s);
          if (img && img.loading === "lazy") img.loading = "eager";
        }
      });
      dots.forEach(function (d, n) {
        d.removeAttribute("aria-current");
        if (n === index) {
          void d.offsetWidth; // restart the progress bar animation
          d.setAttribute("aria-current", "true");
        }
      });
      schedule();
    }
    function playing() { return !userPaused && !hovered && !focused && !document.hidden; }
    function schedule() {
      clearTimeout(timer);
      var on = playing();
      root.classList.toggle("is-playing", on);
      if (on) timer = setTimeout(function () { show(index + 1); }, DURATION);
    }
    function setPaused(p) {
      userPaused = p;
      pauseBtn.setAttribute("aria-pressed", String(p));
      pauseBtn.setAttribute("aria-label", p ? "Play slideshow" : "Pause slideshow");
      schedule();
    }

    $("[data-hero='prev']", root).addEventListener("click", function () { show(index - 1); });
    $("[data-hero='next']", root).addEventListener("click", function () { show(index + 1); });
    dots.forEach(function (d, n) { d.addEventListener("click", function () { show(n); }); });
    pauseBtn.addEventListener("click", function () { setPaused(!userPaused); });

    root.addEventListener("mouseenter", function () { hovered = true; schedule(); });
    root.addEventListener("mouseleave", function () { hovered = false; schedule(); });
    root.addEventListener("focusin", function () { focused = true; schedule(); });
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) { focused = false; schedule(); }
    });
    document.addEventListener("visibilitychange", schedule);

    // Swipe on touch screens
    var x0 = null, y0 = null;
    root.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    // Preload the other slides once the page has loaded
    window.addEventListener("load", function () {
      slides.forEach(function (s) { var img = $("img", s); if (img) img.loading = "eager"; });
    });

    if (reduceMotion) setPaused(true);
    show(0);
  })();

  /* ==========================================================================
     COLLECTIONS GALLERY
     ========================================================================== */
  var grid = $("#products");
  var tabs = $$(".tabs [role='tab']");
  var moreBtn = $("#show-more");
  var LIMIT = 12;
  var state = { cat: "all", expanded: false, list: [] };

  function enquiryText(item) {
    return "Hello Rudra Jewells, I saw the " + item.title + " (" + CAT_LABEL[item.cat] +
      ") on your website and would like to know more / book an appointment.";
  }

  function render() {
    if (!grid) return;
    state.list = state.cat === "all" ? CATALOGUE.slice() : CATALOGUE.filter(function (p) { return p.cat === state.cat; });
    var shown = (state.cat === "all" && !state.expanded) ? state.list.slice(0, LIMIT) : state.list;

    var frag = document.createDocumentFragment();
    shown.forEach(function (item, i) {
      var li = document.createElement("li");
      li.className = "product";
      li.style.animationDelay = Math.min(i, 8) * 40 + "ms";

      var open = document.createElement("button");
      open.type = "button";
      open.className = "product__open" + (isStock(item.src) ? " ph" : "");
      open.setAttribute("aria-label", "View " + item.title);
      open.dataset.index = i;
      var img = document.createElement("img");
      img.src = imgUrl(item.src, 600, 600);
      if (isStock(item.src)) {
        img.srcset = imgUrl(item.src, 360, 360) + " 360w, " + imgUrl(item.src, 600, 600) + " 600w, " + imgUrl(item.src, 900, 900) + " 900w";
        img.sizes = "(min-width: 1024px) 300px, (min-width: 700px) 32vw, 48vw";
      }
      img.alt = item.alt || item.title;
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 600; img.height = 600;
      var zoom = document.createElement("span");
      zoom.className = "product__zoom";
      zoom.setAttribute("aria-hidden", "true");
      zoom.textContent = "View";
      open.appendChild(img);
      open.appendChild(zoom);

      var body = document.createElement("div");
      body.className = "product__body";
      body.innerHTML =
        '<p class="product__cat"></p><h3 class="product__title"></h3>' +
        '<div class="product__foot"><span class="product__price">Price on request</span>' +
        '<a class="product__wa" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg>Enquire</a></div>';
      $(".product__cat", body).textContent = CAT_LABEL[item.cat] || item.cat;
      $(".product__title", body).textContent = item.title;
      var wa = $(".product__wa", body);
      wa.href = R.waLink ? R.waLink(enquiryText(item)) : "#visit";
      wa.setAttribute("aria-label", "Enquire about " + item.title + " on WhatsApp");

      li.appendChild(open);
      li.appendChild(body);
      frag.appendChild(li);
    });
    grid.textContent = "";
    grid.appendChild(frag);

    if (moreBtn) {
      var hasMore = state.cat === "all" && !state.expanded && state.list.length > LIMIT;
      moreBtn.hidden = !hasMore;
      moreBtn.textContent = "Show all " + state.list.length + " pieces";
    }
  }

  function setCat(cat, focusTab) {
    state.cat = CAT_LABEL[cat] ? cat : "all";
    state.expanded = false;
    tabs.forEach(function (t) {
      var on = t.dataset.cat === state.cat;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
      if (on) {
        // keep the active tab visible in the horizontally scrolling row on phones
        var row = t.parentNode;
        if (row.scrollWidth > row.clientWidth) row.scrollLeft = t.offsetLeft - (row.clientWidth - t.offsetWidth) / 2;
      }
    });
    render();
  }

  tabs.forEach(function (t, n) {
    t.addEventListener("click", function () { setCat(t.dataset.cat); });
    t.addEventListener("keydown", function (e) {
      var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (e.key === "Home") step = -n;
      if (e.key === "End") step = tabs.length - 1 - n;
      if (!step) return;
      e.preventDefault();
      setCat(tabs[(n + step + tabs.length) % tabs.length].dataset.cat, true);
    });
  });
  if (moreBtn) moreBtn.addEventListener("click", function () {
    state.expanded = true;
    render();
    var next = grid.children[LIMIT];
    if (next) $("button", next).focus({ preventScroll: true });
  });

  // Any link with data-filter (categories, banners, footer) picks the tab, then the anchor scrolls
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-filter]");
    if (a) setCat(a.getAttribute("data-filter"));
  });

  setCat("all");

  /* ==========================================================================
     LIGHTBOX
     ========================================================================== */
  var lb = $("#lightbox");
  var lbIndex = 0;
  var lbReturn = null;

  function fillLightbox(i) {
    var list = state.list;
    lbIndex = (i + list.length) % list.length;
    var item = list[lbIndex];
    var img = $("#lb-img");
    img.src = imgUrl(item.src, 1000, 1000);
    img.alt = item.alt || item.title;
    $(".lightbox__media", lb).classList.toggle("ph", isStock(item.src));
    $("#lb-cat").textContent = CAT_LABEL[item.cat] || "";
    $("#lb-title").textContent = item.title;
    $("#lb-wa").href = R.waLink ? R.waLink(enquiryText(item)) : "#visit";
  }
  function openLightbox(i, from) {
    lbReturn = from;
    fillLightbox(i);
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    document.body.classList.add("menu-open");
  }
  function closeLightbox() {
    if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open");
  }

  if (lb && grid) {
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".product__open");
      if (b) openLightbox(+b.dataset.index, b);
    });
    lb.addEventListener("close", function () {
      document.body.classList.remove("menu-open");
      if (lbReturn) lbReturn.focus({ preventScroll: true });
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest("[data-close]")) closeLightbox();
    });
    $("[data-lb='prev']", lb).addEventListener("click", function () { fillLightbox(lbIndex - 1); });
    $("[data-lb='next']", lb).addEventListener("click", function () { fillLightbox(lbIndex + 1); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") fillLightbox(lbIndex - 1);
      if (e.key === "ArrowRight") fillLightbox(lbIndex + 1);
      if (e.key === "Escape" && typeof lb.showModal !== "function") closeLightbox();
    });
  }

  /* ==========================================================================
     REVEAL ON SCROLL
     ========================================================================== */
  var reveals = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
