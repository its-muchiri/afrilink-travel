/* ============================================================
   AfriLink Travel — Motion System Controller
   Elegant · Calm · Cinematic
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const DUR_CONTENT = 750;

  /* ---------- utils ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const once = (el, type, fn) => el.addEventListener(type, fn, { once: true });
  const rAF = (fn) => requestAnimationFrame(fn);

  /* ---------- Page transition overlay ---------- */
  const pageTransition = $("#af-page-transition");
  const pagePanel = pageTransition ? $(".af-page__panel", pageTransition) : null;

  function initPageTransitions() {
    if (!pageTransition) return;
    // Entering this page: sweep the green panel away
    rAF(() => {
      pageTransition.classList.remove("af-page-transition--enter");
      if (pagePanel) pagePanel.style.transform = "scaleX(0)";
      setTimeout(() => {
        pageTransition.classList.add("af-page-transition--removed");
        setTimeout(() => pageTransition.remove(), 700);
      }, 700);
    });
    once(window, "pageshow", () => {
      if (pageTransition) pageTransition.classList.remove("af-page-transition--enter");
      if (pagePanel) pagePanel.style.transform = "scaleX(0)";
      setTimeout(() => {
        pageTransition.classList.add("af-page-transition--removed");
        setTimeout(() => pageTransition.remove(), 700);
      }, 700);
    });

    // Intercept cross-page clicks: fade out, sweep panel in, then navigate
    $$("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
      } catch { return; }
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = href;
        pageTransition.classList.add("af-page-transition--exit");
        pageTransition.classList.remove("af-page-transition--removed");
        pageTransition.style.opacity = "1";
        if (pagePanel) pagePanel.style.transform = "scaleX(1)";
        setTimeout(() => {
          window.location.href = target;
        }, 700);
      });
    });
  }

  /* ---------- Splash screen ---------- */
  function initSplash() {
    const splash = $("#af-splash");
    if (!splash) return;

    const finish = () => {
      splash.classList.add("af-splash--exit");
      splash.style.pointerEvents = "none";
      // Guarantee removal even if transitionend never fires
      setTimeout(() => {
        splash.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }, 900);
      once(splash, "transitionend", () => {
        splash.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      });
    };

    if (prefersReduced) {
      // Simple fade instead of draw/curtain motion
      const paths = $$(".af-splash__path, .af-route-line");
      paths.forEach((p) => { p.style.strokeDashoffset = "0"; });
      $$(".af-map-pin").forEach((p) => { p.style.opacity = "1"; p.style.transform = "none"; });
      $$(".af-wordmark-main, .af-wordmark-sub").forEach((p) => { p.style.opacity = "1"; p.style.transform = "none"; });
      setTimeout(finish, 1200);
      return;
    }

    setTimeout(() => {
      const wordmarkMain = $(".af-wordmark-main");
      const wordmarkSub = $(".af-wordmark-sub");
      if (wordmarkMain) once(wordmarkMain, "animationend", () => {
        if (wordmarkSub) once(wordmarkSub, "animationend", finish);
      });
      setTimeout(finish, 3100);
    }, 2000);

    // Safety net: never let the splash permanently block the page
    setTimeout(() => {
      const s = $("#af-splash");
      if (s) { s.remove(); document.documentElement.style.overflow = ""; document.body.style.overflow = ""; }
    }, 9000);
  }

  /* ---------- Header scroll state ---------- */
  function initHeader() {
    const header = $("header, .af-header");
    const wrap = $(".af-header-wrap");
    if (!header || !wrap) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      rAF(() => {
        const scrolled = window.scrollY > 80;
        header.classList.toggle("af-header--scrolled", scrolled);
        wrap.classList.toggle("af-header--scrolled", scrolled);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const btn = $(".af-menu-btn");
    const menu = $(".af-mobile-menu");
    if (!btn || !menu) return;
    const links = $$("a", menu);
    const lines = $$(".af-menu-btn__line", btn);

    function open() {
      btn.classList.add("af-menu-btn--open");
      btn.setAttribute("aria-expanded", "true");
      menu.classList.add("af-mobile-menu--open");
      document.body.style.overflow = "hidden";
      links.forEach((el, i) => {
        el.style.transitionDelay = `${60 + i * 90}ms`;
      });
    }
    function close() {
      btn.classList.remove("af-menu-btn--open");
      btn.setAttribute("aria-expanded", "false");
      menu.classList.remove("af-mobile-menu--open");
      document.body.style.overflow = "";
    }
    btn.addEventListener("click", () => (menu.classList.contains("af-mobile-menu--open") ? close() : open()));
    links.forEach((el) => el.addEventListener("click", close));
    // Escape key closes
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add("af-reveal--visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.10, rootMargin: "-8% 0px -8% 0px" }
    );

    $$(".af-reveal").forEach((el) => observer.observe(el));

    // Stagger groups: index-based delays
    $$(".af-reveal-stagger > .af-reveal").forEach((el, i) => {
      const group = el.parentElement;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.style.setProperty("--af-index", `${i * 100}ms`);
              e.target.classList.add("af-reveal--visible");
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.10, rootMargin: "-8% 0px -8% 0px" }
      );
      obs.observe(el);
    });

    // Image wipe reveals
    $$(".af-reveal--img img").forEach((img) => {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("af-reveal--visible");
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "-6% 0px -6% 0px" }
      );
      obs.observe(img.parentElement);
    });

    // Counters
    $$(".af-counter[data-target]").forEach((el) => {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              countUp(el);
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "-8% 0px -8% 0px" }
      );
      obs.observe(el);
    });
  }

  function countUp(el) {
    const target = +(el.getAttribute("data-target") || 0);
    const suffix = el.getAttribute("data-suffix") || "";
    const prefix = el.getAttribute("data-prefix") || "";
    const duration = DUR_CONTENT;
    let start = 0;
    if (prefersReduced) {
      el.textContent = prefix + target + suffix;
      return;
    }
    const startTime = performance.now();
    function frame(now) {
      const p = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(p * target);
      el.textContent = prefix + value + suffix;
      if (p < 1) rAF(frame);
      else el.textContent = prefix + target + suffix;
    }
    rAF(frame);
  }

  /* ---------- Hero: word-by-word reveal ---------- */
  function initHeroWords() {
    const container = $(".af-split-words");
    if (!container) return;
    const text = container.textContent.trim();
    container.innerHTML = "";
    const words = text.split(/\s+/);
    words.forEach((word, i) => {
      const wrap = document.createElement("span");
      wrap.className = "af-word-wrap";
      wrap.textContent = word;
      container.appendChild(wrap);
      if (i > 0) container.append(document.createTextNode(" "));
    });
    const wraps = $$(".af-word-wrap", container);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            wraps.forEach((w, i) => {
              w.style.setProperty("--af-index", `${i * 90}ms`);
              w.classList.add("af-word-wrap--visible");
            });
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "-10% 0px" }
    );
    obs.observe(container);
  }

  /* ---------- Hero crossfade photos ---------- */
  function initHeroCrossfade() {
    const photos = $$(".af-hero-photo");
    if (photos.length < 2) return;
    photos.forEach((p, i) => {
      p.style.opacity = i === 0 ? "1" : "0";
      p.style.transition = "opacity 1400ms var(--af-ease)";
    });
    let current = 0;
    setInterval(() => {
      const next = (current + 1) % photos.length;
      photos[current].style.opacity = "0";
      photos[next].style.opacity = "1";
      current = next;
    }, 7000);
  }

  /* ---------- Hero parallax + Ken Burns ---------- */
  function initHeroParallax() {
    const wrap = $(".af-hero__parallax");
    if (!wrap) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      rAF(() => {
        const p = Math.min(window.scrollY / 500, 1);
        wrap.style.transform = `translateY(${p * 14}px) scale(${1 - p * 0.02})`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Ambient gold dust particles ---------- */
  function initParticles() {
    const container = $(".af-hero__wrap");
    if (!container || isTouch || prefersReduced) return;
    const count = 22;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "af-particle";
      const size = 2 + Math.random() * 4;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.opacity = 0.25 + Math.random() * 0.45;
      p.style.animationDuration = `${14 + Math.random() * 16}s`;
      p.style.animationDelay = `${Math.random() * 20}s`;
      frag.appendChild(p);
    }
    const layer = document.createElement("div");
    layer.className = "af-particles";
    layer.appendChild(frag);
    container.appendChild(layer);
  }

  /* ---------- Custom soft gold cursor ---------- */
  function initCursor() {
    if (isTouch || prefersReduced) return;
    const cursor = $(".af-cursor");
    if (!cursor) return;
    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    function tick() {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate(${curX - 7}px, ${curY - 7}px) scale(1)`;
      rAF(tick);
    }
    rAF(tick);
    const growables = $$("a, button, [role='button'], .af-card-dest, .af-card-exp, .af-social, input, select, label, .af-field");
    growables.forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("af-cursor--grow"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("af-cursor--grow"));
    });
  }

  /* ---------- Timeline: line draws down as scroll, steps pop ---------- */
  function initTimeline() {
    const line = $(".af-timeline__line");
    const steps = $$(".af-timeline__step");
    if (!line || steps.length === 0) return;
    const section = $(".af-timeline");
    if (!section) return;

    const revealSteps = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("af-timeline__step--visible");
            revealSteps.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "-6% 0px -14% 0px" }
    );
    steps.forEach((s) => revealSteps.observe(s));

    let ticking = false;
    function updateLine() {
      if (ticking) return;
      ticking = true;
      rAF(() => {
        const rect = section.getBoundingClientRect();
        const viewH = window.innerHeight;
        const start = rect.top;
        const end = rect.bottom;
        const progress = (viewH - start) / (end - start + viewH);
        const p = Math.min(Math.max(progress, 0), 1);
        line.style.height = `${p * 100}%`;
        ticking = false;
      });
    }
    window.addEventListener("scroll", updateLine, { passive: true });
    updateLine();
  }

  /* ---------- Forms ---------- */
  function initForms() {
    $$("form").forEach((form) => {
      // Float labels + focus states
      $$(".af-field__input, .af-field__select, .af-field__textarea", form).forEach((input) => {
        const field = input.closest(".af-field");
        const label = $(".af-field__label", field);
        const update = () => {
          field.classList.toggle("af-field--focused", document.activeElement === input);
          field.classList.toggle("af-field--has-value", input.value.trim() !== "");
        };
        input.addEventListener("focus", update);
        input.addEventListener("blur", update);
        input.addEventListener("input", update);
        update();

        // Validation on blur / input
        const validate = () => {
          const isValid = input.checkValidity();
          field.classList.toggle("af-field--valid", isValid && input.value.trim() !== "");
          field.classList.toggle("af-field--error", !isValid && input.value.trim() !== "");
          return isValid;
        };
        input.addEventListener("blur", validate);
        input.addEventListener("input", validate);
      });

      // Custom dropdowns
      $$(".af-select", form).forEach((select) => {
        const wrap = select.closest(".af-select-wrap");
        const trigger = $(".af-select__trigger", wrap);
        const list = $(".af-select__list", wrap);
        const options = $$(".af-select__option", list);
        const hiddenInput = $("select", select) || select;

        function setTriggerText(value) {
          const opt = options.find((o) => o.getAttribute("data-value") === value);
          if (opt) trigger.textContent = opt.textContent;
        }

        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          const open = !select.classList.contains("af-select--open");
          $$(".af-select").forEach((s) => s.classList.remove("af-select--open"));
          if (open) select.classList.add("af-select--open");
        });

        options.forEach((opt) => {
          opt.addEventListener("click", () => {
            const val = opt.getAttribute("data-value");
            select.classList.remove("af-select--open");
            setTriggerText(val);
            if (hiddenInput.tagName === "SELECT") hiddenInput.value = val;
            trigger.classList.add("af-select__trigger--focused");
          });
        });

        window.addEventListener("click", () => select.classList.remove("af-select--open"));
      });

      // Submit flow
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = $("button[type='submit']", form);
        if (!btn) return;
        let valid = true;
        $$(".af-field__input, .af-field__select, .af-field__textarea", form).forEach((input) => {
          if (!input.checkValidity() || input.value.trim() === "") valid = false;
          const field = input.closest(".af-field");
          field.classList.toggle("af-field--error", !(input.checkValidity() && input.value.trim() !== ""));
        });
        if (!valid) return;

        const textEl = $(".af-btn-submit--text", btn);
        const spinner = $(".af-spinner", btn);
        const check = $(".af-check-draw", btn);
        btn.classList.add("af-btn-submit--loading");

        setTimeout(() => {
          btn.classList.remove("af-btn-submit--loading");
          btn.classList.add("af-btn-submit--success");
          setTimeout(() => {
            const success = form.closest(".af-form") ? $(".af-success", form.closest(".af-form")) : null;
            if (success) {
              form.style.opacity = "0";
              form.style.pointerEvents = "none";
              setTimeout(() => {
                form.style.display = "none";
                success.classList.add("af-success--show");
                window.scrollTo({ top: success.offsetTop - 120, behavior: "smooth" });
              }, 350);
            } else {
              btn.classList.remove("af-btn-submit--success");
            }
          }, 900);
        }, 900);
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFAQ() {
    $$(".af-faq__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const panel = btn.nextElementSibling;
        // Close others in same group
        const group = btn.closest(".faq-group, .af-faq-grid") || btn.parentElement;
        $$(".af-faq__btn", group).forEach((b) => {
          if (b !== btn) {
            b.setAttribute("aria-expanded", "false");
            const p = b.nextElementSibling;
            if (p) p.classList.remove("af-faq__panel--open");
          }
        });
        btn.setAttribute("aria-expanded", String(!expanded));
        if (panel) panel.classList.toggle("af-faq__panel--open", !expanded);
      });
    });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    const btn = $("#af-back-to-top");
    if (!btn) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      rAF(() => {
        btn.classList.toggle("af-back-to-top--show", window.scrollY > 300);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    const gallery = $("#af-gallery");
    if (!gallery) return;
    const lightbox = $("#af-lightbox");
    const close = $(".af-lightbox__close", lightbox);
    const img = $(".af-lightbox__img", lightbox);
    $$(".af-lightbox-target", gallery).forEach((el) => {
      el.addEventListener("click", () => {
        img.src = el.currentSrc || el.src;
        lightbox.classList.add("af-lightbox--open");
      });
    });
    function closeLB() { lightbox.classList.remove("af-lightbox--open"); }
    close.addEventListener("click", closeLB);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLB(); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLB(); });
  }

  /* ---------- Country tiles strip + map ---------- */
  function initCountryStrip() {
    const strip = $(".af-strip");
    if (!strip) return;
    let isDown = false;
    let startX;
    let scrollLeft;
    strip.addEventListener("mousedown", (e) => {
      isDown = true;
      strip.classList.add("af-dragging");
      startX = e.pageX - strip.offsetLeft;
      scrollLeft = strip.scrollLeft;
    });
    strip.addEventListener("mouseleave", () => { isDown = false; strip.classList.remove("af-dragging"); });
    strip.addEventListener("mouseup", () => { isDown = false; strip.classList.remove("af-dragging"); });
    strip.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - strip.offsetLeft;
      const walk = (x - startX) * 1.1;
      strip.scrollLeft = scrollLeft - walk;
    });
  }

  function initMap() {
    const map = $(".af-route-map");
    if (!map) return;
    $$(".af-map-marker").forEach((marker) => {
      const country = marker.getAttribute("data-country");
      const info = $(`.af-country-info[data-country="${country}"]`);
      const pin = $(".af-map-marker__pin", marker);
      function show() {
        marker.setAttribute("r", marker.getAttribute("data-r") || "5");
        $$(".af-map-marker").forEach((m) => { if (m !== marker) m.setAttribute("r", m.dataset.r || "3.5"); });
        if (info) {
          $$(".af-country-info").forEach((i) => i.classList.remove("af-country-info--show"));
          info.classList.add("af-country-info--show");
        }
      }
      marker.addEventListener("mouseenter", show);
      marker.addEventListener("focus", show);
    });
  }

  /* ---------- Boot ---------- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(() => {
    initPageTransitions();
    initSplash();
    initHeader();
    initMobileMenu();
    initReveals();
    initHeroWords();
    initHeroCrossfade();
    initHeroParallax();
    initParticles();
    initCursor();
    initTimeline();
    initForms();
    initFAQ();
    initBackToTop();
    initLightbox();
    initCountryStrip();
    initMap();

    // Remove no-js class if present
    document.documentElement.classList.remove("no-js");
  });
})();
