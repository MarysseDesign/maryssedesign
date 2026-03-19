(() => {
  // Prevent multiple boot (Astro / client navigation safety)
  if (window.__aboutRevealInit) return;
  window.__aboutRevealInit = true;

  const PAGE_SELECTOR = ".about-page";
  const ITEM_SELECTOR = ".about-page .reveal";
  const MOBILE_BP = 768;

  let observer = null;
  let currentMode = null;
  let resizeTicking = false;
  let fallbackTimer = null;

  // -------- utils --------

  function getPage() {
    return document.querySelector(PAGE_SELECTOR);
  }

  function getItems() {
    return Array.from(document.querySelectorAll(ITEM_SELECTOR));
  }

  function getViewportHeight() {
    // iOS safe viewport
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
    return window.innerHeight || document.documentElement.clientHeight;
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
  }

  // -------- core logic --------

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

        // iOS safe: mobile più permissivo
        threshold: isMobile ? 0 : 0.14,

        // evita bug viewport Safari
        rootMargin: isMobile ? "0px 0px -6% 0px" : "0px 0px -12% 0px",
      },
    );
  }

  function revealAlreadyVisible(items, isMobile) {
    const viewportH = getViewportHeight();

    items.forEach((item) => {
      if (item.dataset.revealed === "true") return;

      const rect = item.getBoundingClientRect();

      const visible =
        rect.top < viewportH * (isMobile ? 0.99 : 0.92) &&
        rect.bottom > viewportH * 0.02;

      if (visible) reveal(item);
    });
  }

  function revealAllHidden(items) {
    items.forEach((item) => reveal(item));
  }

  function initReveal({ force = false } = {}) {
    const page = getPage();
    const items = getItems();

    if (!page || !items.length) return;

    const isMobile = window.innerWidth <= MOBILE_BP;
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

    requestAnimationFrame(() => {
      page.classList.add("reveal-ready");

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

      // immediate check (critical for iOS)
      revealAlreadyVisible(items, isMobile);

      // fallback (iOS failsafe)
      fallbackTimer = window.setTimeout(
        () => {
          const viewportH = getViewportHeight();

          items
            .filter((item) => item.dataset.revealed !== "true")
            .forEach((item) => {
              const rect = item.getBoundingClientRect();

              if (rect.top < viewportH * (isMobile ? 1.05 : 0.96)) {
                reveal(item);
              }
            });
        },
        isMobile ? 900 : 1200,
      );
    });
  }

  // -------- events --------

  function onResize() {
    if (resizeTicking) return;

    resizeTicking = true;

    requestAnimationFrame(() => {
      const nextMode = window.innerWidth <= MOBILE_BP ? "mobile" : "desktop";

      if (nextMode !== currentMode) {
        initReveal({ force: true });
      } else {
        revealAlreadyVisible(getItems(), nextMode === "mobile");
      }

      resizeTicking = false;
    });
  }

  function onPageShow(event) {
    // iOS back-forward cache fix
    if (event.persisted) {
      initReveal({ force: true });
    } else {
      revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
    }
  }

  function boot() {
    // initial
    initReveal({ force: true });

    // DO NOT re-init fully on load (prevents iOS glitches)
    window.addEventListener(
      "load",
      () => {
        revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
      },
      { once: true },
    );

    window.addEventListener("resize", onResize, { passive: true });

    // iOS viewport change fix
    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        () => {
          revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
        },
        { passive: true },
      );
    }

    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        initReveal({ force: true });
      }, 250);
    });

    window.addEventListener("pageshow", onPageShow);

    // tab switch fix (Safari)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
      }
    });

    // Astro navigation
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
