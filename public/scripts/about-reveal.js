(() => {
  const PAGE_SELECTOR = ".about-page";
  const ITEM_SELECTOR = ".about-page .reveal";
  const MOBILE_BP = 768;

  let observer = null;
  let resizeHandler = null;
  let currentMode = null;

  function getPage() {
    return document.querySelector(PAGE_SELECTOR);
  }

  function getItems() {
    return Array.from(document.querySelectorAll(ITEM_SELECTOR));
  }

  function resetItems(items) {
    items.forEach((item) => {
      item.classList.remove("is-inview");
      item.dataset.revealed = "false";
    });
  }

  function destroyObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function destroyResizeHandler() {
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
  }

  function revealDesktop(items) {
    resetItems(items);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        items.forEach((item) => {
          item.classList.add("is-inview");
          item.dataset.revealed = "true";
        });
      });
    });
  }

  function revealMobile(items) {
    resetItems(items);

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;

          if (entry.isIntersecting) {
            el.classList.add("is-inview");
            el.dataset.revealed = "true";
            observer.unobserve(el);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    items.forEach((item) => observer.observe(item));

    // Safari / iPhone: forzo un controllo extra dopo assestamento layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        items.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const viewportH =
            window.innerHeight || document.documentElement.clientHeight;

          const visible =
            rect.top < viewportH * 0.92 && rect.bottom > viewportH * 0.08;
          if (visible) {
            item.classList.add("is-inview");
            item.dataset.revealed = "true";
            if (observer) observer.unobserve(item);
          }
        });
      });
    });
  }

  function initReveal() {
    const page = getPage();
    const items = getItems();

    if (!page || !items.length) return;

    destroyObserver();
    destroyResizeHandler();

    const isMobile = window.innerWidth <= MOBILE_BP;
    currentMode = isMobile ? "mobile" : "desktop";

    // attivo il sistema solo quando il DOM è realmente pronto
    requestAnimationFrame(() => {
      page.classList.add("reveal-ready");

      if (isMobile) {
        revealMobile(items);
      } else {
        revealDesktop(items);
      }
    });

    resizeHandler = () => {
      const nextMode = window.innerWidth <= MOBILE_BP ? "mobile" : "desktop";
      if (nextMode !== currentMode) {
        initReveal();
      }
    };

    window.addEventListener("resize", resizeHandler, { passive: true });
  }

  function boot() {
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("load", initReveal);
  window.addEventListener("pageshow", initReveal);
  window.addEventListener("orientationchange", () => {
    setTimeout(initReveal, 180);
  });

  document.addEventListener("astro:page-load", initReveal);
})();
