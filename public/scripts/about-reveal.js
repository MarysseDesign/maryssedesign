(() => {
  const PAGE_SELECTOR = ".about-page";
  const ITEM_SELECTOR = ".about-page .reveal";
  const MOBILE_BP = 768;

  let observer = null;
  let currentMode = null;
  let resizeTicking = false;
  let fallbackTimer = null;
  let fallbackTimer2 = null;

  function getPage() {
    return document.querySelector(PAGE_SELECTOR);
  }

  function getItems() {
    return Array.from(document.querySelectorAll(ITEM_SELECTOR));
  }

  function getViewportHeight() {
    return window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight || document.documentElement.clientHeight;
  }

  function isMobileNow() {
    return window.innerWidth <= MOBILE_BP;
  }

  function cleanup() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (fallbackTimer2) {
      clearTimeout(fallbackTimer2);
      fallbackTimer2 = null;
    }
  }

  // Applica il delay direttamente come style.transitionDelay.
  // Su Safari/iOS le CSS custom properties (--delay) usate dentro transition-delay
  // hanno una race condition quando reveal-ready viene aggiunta via JS:
  // il valore risulta 0ms o viene ignorato del tutto.
  // Applicarlo via JS *dopo* che reveal-ready è attiva risolve il problema.
  function applyDelay(el, isMobile) {
    const rawDelay = el.style.getPropertyValue("--delay") || "0ms";
    el.style.transitionDelay = isMobile ? "0ms" : rawDelay;
  }

  function reveal(el) {
    if (!el || el.dataset.revealed === "true") return;
    el.classList.add("is-inview");
    el.dataset.revealed = "true";
    if (observer) observer.unobserve(el);
  }

  function hideOnlyUnrevealed(items) {
    items.forEach((item) => {
      if (item.dataset.revealed === "true") {
        item.classList.add("is-inview");
        return;
      }
      item.classList.remove("is-inview");
      item.removeAttribute("data-revealed");
    });
  }

  function buildObserver(isMobile) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
          }
        });
      },
      {
        root: null,
        // Safari/iOS ha un bug con rootMargin negativi in percentuale:
        // non triggera per elementi gia' parzialmente visibili al load.
        // Su mobile usiamo "0px" per sicurezza assoluta.
        threshold: isMobile ? 0 : 0.12,
        rootMargin: isMobile ? "0px" : "0px 0px -10% 0px",
      },
    );
  }

  function revealAlreadyVisible(items, isMobile) {
    const viewportH = getViewportHeight();
    items.forEach((item) => {
      if (item.dataset.revealed === "true") return;
      const rect = item.getBoundingClientRect();
      const inView =
        rect.top < viewportH * (isMobile ? 0.99 : 0.92) &&
        rect.bottom > 0;
      if (inView) reveal(item);
    });
  }

  function revealAllHidden(items) {
    items.forEach((item) => reveal(item));
  }

  function initReveal({ force = false } = {}) {
    const page = getPage();
    const items = getItems();

    if (!page || !items.length) return;

    const isMobile = isMobileNow();
    const nextMode = isMobile ? "mobile" : "desktop";

    if (
      !force &&
      currentMode === nextMode &&
      page.classList.contains("reveal-ready")
    ) {
      revealAlreadyVisible(items, isMobile);
      return;
    }

    cleanup();
    currentMode = nextMode;
    page.classList.remove("reveal-ready");
    hideOnlyUnrevealed(items);

    // Doppio rAF: il primo frame rimuove reveal-ready e resetta lo stato,
    // il secondo parte *dopo* che il browser ha dipinto il frame senza la classe,
    // garantendo che la transition parta da zero.
    // Safari comprime i rAF singoli — il doppio e' necessario.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        page.classList.add("reveal-ready");

        // Applica i delay via JS *dopo* che reveal-ready e' attiva.
        // Cosi' la custom property --delay e' gia' risolta dal browser
        // e non c'e' alcuna race condition.
        items.forEach((item) => applyDelay(item, isMobile));

        if (!("IntersectionObserver" in window)) {
          revealAllHidden(items);
          return;
        }

        buildObserver(isMobile);

        items.forEach((item) => {
          if (item.dataset.revealed !== "true") {
            observer.observe(item);
          }
        });

        // Rivela subito gli elementi gia' visibili nel viewport
        revealAlreadyVisible(items, isMobile);

        // Fallback 1: elementi visibili ma non rivelati (Safari lento al primo render)
        fallbackTimer = window.setTimeout(() => {
          const vh = getViewportHeight();
          getItems()
            .filter((item) => item.dataset.revealed !== "true")
            .forEach((item) => {
              const rect = item.getBoundingClientRect();
              if (rect.top < vh * (isMobile ? 1.05 : 0.96)) {
                reveal(item);
              }
            });
        }, isMobile ? 400 : 800);

        // Fallback 2 (solo mobile): rete lenta o rendering pesante
        if (isMobile) {
          fallbackTimer2 = window.setTimeout(() => {
            const vh = getViewportHeight();
            getItems()
              .filter((item) => item.dataset.revealed !== "true")
              .forEach((item) => {
                const rect = item.getBoundingClientRect();
                if (rect.top < vh * 1.1) reveal(item);
              });
          }, 1200);
        }
      });
    });
  }

  function onResize() {
    if (resizeTicking) return;
    resizeTicking = true;
    requestAnimationFrame(() => {
      const nextMode = isMobileNow() ? "mobile" : "desktop";
      if (nextMode !== currentMode) {
        initReveal({ force: true });
      } else {
        revealAlreadyVisible(getItems(), nextMode === "mobile");
      }
      resizeTicking = false;
    });
  }

  function onPageShow(event) {
    if (event.persisted) {
      // bfcache (back/forward su Safari): reinizializza tutto
      initReveal({ force: true });
    } else {
      revealAlreadyVisible(getItems(), isMobileNow());
    }
  }

  function boot() {
    initReveal({ force: true });

    window.addEventListener("load", () => {
      revealAlreadyVisible(getItems(), isMobileNow());
    }, { once: true });

    window.addEventListener("resize", onResize, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => {
        revealAlreadyVisible(getItems(), isMobileNow());
      }, { passive: true });
    }

    window.addEventListener("orientationchange", () => {
      // Su iOS il resize arriva prima che innerWidth sia aggiornato
      setTimeout(() => initReveal({ force: true }), 300);
    });

    window.addEventListener("pageshow", onPageShow);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        revealAlreadyVisible(getItems(), isMobileNow());
      }
    });

    document.addEventListener("astro:page-load", () => {
      initReveal({ force: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
