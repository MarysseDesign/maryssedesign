(() => {
  const PAGE_SELECTOR = ".about-page";
  const ITEM_SELECTOR = ".about-page .reveal";
  const MOBILE_BP = 768;

  let observer = null;
  let currentMode = null;
  let resizeTicking = false;

  function getPage() {
    return document.querySelector(PAGE_SELECTOR);
  }

  function getItems() {
    return Array.from(document.querySelectorAll(ITEM_SELECTOR));
  }

  function cleanup() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function markHidden(items) {
    items.forEach((item) => {
      item.classList.remove("is-inview");
      item.dataset.revealed = "false";
    });
  }

  function reveal(el) {
    if (!el || el.dataset.revealed === "true") return;
    el.classList.add("is-inview");
    el.dataset.revealed = "true";
    if (observer) observer.unobserve(el);
  }

  function buildObserver(isMobile) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      {
        root: null,
        threshold: isMobile ? 0.08 : 0.14,
        rootMargin: isMobile ? "0px 0px -8% 0px" : "0px 0px -12% 0px",
      },
    );
  }

  function revealAlreadyVisible(items, isMobile) {
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const visible =
        rect.top < viewportH * (isMobile ? 0.96 : 0.92) &&
        rect.bottom > viewportH * 0.04;

      if (visible) reveal(item);
    });
  }

  function initReveal() {
    const page = getPage();
    const items = getItems();
    if (!page || !items.length) return;

    cleanup();

    const isMobile = window.innerWidth <= MOBILE_BP;
    currentMode = isMobile ? "mobile" : "desktop";

    page.classList.remove("reveal-ready");
    markHidden(items);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        page.classList.add("reveal-ready");

        buildObserver(isMobile);
        items.forEach((item) => observer.observe(item));

        revealAlreadyVisible(items, isMobile);
      });
    });
  }

  function onResize() {
    if (resizeTicking) return;
    resizeTicking = true;

    requestAnimationFrame(() => {
      const nextMode = window.innerWidth <= MOBILE_BP ? "mobile" : "desktop";
      if (nextMode !== currentMode) {
        initReveal();
      }
      resizeTicking = false;
    });
  }

  function boot() {
    initReveal();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", () => {
      setTimeout(initReveal, 200);
    });
    window.addEventListener("pageshow", initReveal);

    document.addEventListener("astro:page-load", initReveal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
