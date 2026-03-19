(() => {
  const PAGE_SELECTOR = ".about-page";
  const ITEM_SELECTOR = ".about-page .reveal";
  const MOBILE_BP = 768;

  let observer = null;
  let currentMode = null;
  let resizeTicking = false;
  let fallbackTimer = null;

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
        // Su Safari/iOS i rootMargin negativi con % hanno un bug noto:
        // quando l'elemento è già parzialmente visibile al caricamento
        // l'observer non triggera mai. Su mobile usiamo margini positivi
        // o zero per evitarlo del tutto.
        threshold: isMobile ? 0 : 0.14,
        rootMargin: isMobile ? "0px 0px 0px 0px" : "0px 0px -12% 0px",
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

      revealAlreadyVisible(items, isMobile);

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

          // Secondo fallback su mobile: se ci sono ancora elementi nascosti
          // dopo altri 600ms (es. rendering lento su Safari) li riveliamo tutti
          if (isMobile) {
            window.setTimeout(() => {
              getItems()
                .filter((item) => item.dataset.revealed !== "true")
                .forEach((item) => {
                  const rect = item.getBoundingClientRect();
                  const vh = getViewportHeight();
                  if (rect.top < vh * 1.1) reveal(item);
                });
            }, 600);
          }
        },
        isMobile ? 400 : 1200,
      );
    });
  }

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
    if (event.persisted) {
      initReveal({ force: true });
    } else {
      revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
    }
  }

  function boot() {
    initReveal({ force: true });

    window.addEventListener(
      "load",
      () => {
        revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
      },
      { once: true },
    );

    window.addEventListener("resize", onResize, { passive: true });

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
      setTimeout(() => initReveal({ force: true }), 250);
    });

    window.addEventListener("pageshow", onPageShow);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        revealAlreadyVisible(getItems(), window.innerWidth <= MOBILE_BP);
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
