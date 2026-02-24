// src/scripts/tarot-services.ts
// Tarot services interactions (desktop drag + modal, mobile carousel details)
// Robust for Astro dev/build + client-side navigations (View Transitions) with full cleanup.

console.log("✅ tarot-services loaded");

type TarotData = {
  key?: string;
  title?: string;
  subtitle?: string;
  img?: string;
  desc?: string;
};

type Cleanup = () => void;

declare global {
  interface Window {
    __tarotServicesDestroy?: Cleanup;
  }
}

(() => {
  const BASE_URL = (import.meta as any)?.env?.BASE_URL ?? "/";

  const joinBase = (path: string) => {
    const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
    const p = path.startsWith("/") ? path.slice(1) : path;
    return `${base}${p}`;
  };

  const makeServicesHref = (key?: string) =>
    `${joinBase("services/")}#${key ?? ""}`;

  const run = () => {
    // Se Astro rimpiazza il DOM (View Transitions), evitiamo doppio init
    window.__tarotServicesDestroy?.();
    window.__tarotServicesDestroy = undefined;

    const cleanups: Cleanup[] = [];
    const on = <T extends EventTarget>(
      target: T | null | undefined,
      type: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (!target) return;
      target.addEventListener(type, handler as any, options as any);
      cleanups.push(() =>
        target.removeEventListener(type, handler as any, options as any),
      );
    };

    const destroy = () => {
      for (const c of cleanups.splice(0)) c();
    };

    window.__tarotServicesDestroy = destroy;

    const mqMobile = window.matchMedia("(max-width: 900px)");
    const isMobile = () => mqMobile.matches;

    // ===== Common =====
    const shuffleBtn = document.getElementById(
      "tarotShuffle",
    ) as HTMLButtonElement | null;

    // ===== MOBILE =====
    const mobileRoot = document.getElementById("tarotMobile");
    const detailKicker = document.getElementById("tarotDetailKicker");
    const detailTitle = document.getElementById("tarotDetailTitle");
    const detailText = document.getElementById("tarotDetailText");
    const detailMore = document.getElementById(
      "tarotDetailMore",
    ) as HTMLAnchorElement | null;

    const setDetailFromBtn = (btn: HTMLElement | null) => {
      if (!btn || !detailKicker || !detailTitle || !detailText) return;

      const ds = btn.dataset;
      detailKicker.textContent = ds.subtitle || "";
      detailTitle.textContent = ds.title || "";
      detailText.textContent = ds.desc || "";

      if (detailMore) detailMore.href = makeServicesHref(ds.key);

      mobileRoot
        ?.querySelectorAll<HTMLElement>(".tarot-slide.is-active")
        .forEach((el) => el.classList.remove("is-active"));

      btn.classList.add("is-active");
    };

    const initMobile = () => {
      if (!mobileRoot) return;

      const slides = Array.from(
        mobileRoot.querySelectorAll<HTMLElement>(".tarot-slide"),
      );
      if (!slides.length) return;

      slides.forEach((btn) => {
        on(btn, "click", () => setDetailFromBtn(btn), { passive: true });
        // Accessibilità (Enter/Space)
        on(btn, "keydown", (e: Event) => {
          const ke = e as KeyboardEvent;
          if (ke.key === "Enter" || ke.key === " ") {
            ke.preventDefault();
            setDetailFromBtn(btn);
          }
        });
      });

      setDetailFromBtn(slides[0]);
    };

    // ===== DESKTOP =====
    const stage = document.getElementById("tarotStage");

    // Modal elements
    const modal = document.getElementById("tarotModal") as HTMLElement | null;
    const modalImg = document.getElementById(
      "tarotModalImg",
    ) as HTMLImageElement | null;
    const modalKicker = document.getElementById("tarotModalKicker");
    const modalTitle = document.getElementById("tarotModalTitle");
    const modalText = document.getElementById("tarotModalText");
    const modalShuffle = document.getElementById(
      "tarotModalShuffle",
    ) as HTMLButtonElement | null;
    const modalMore = document.getElementById(
      "tarotModalMore",
    ) as HTMLAnchorElement | null;

    const openModal = (data: TarotData) => {
      if (!modal || !modalImg || !modalKicker || !modalTitle || !modalText)
        return;

      modalImg.src = data.img || "";
      modalImg.alt = data.title ? `${data.title} image` : "";
      modalKicker.textContent = data.subtitle || "";
      modalTitle.textContent = data.title || "";
      modalText.textContent = data.desc || "";

      if (modalMore) modalMore.href = makeServicesHref(data.key);

      (modal as any).hidden = false;

      requestAnimationFrame(() => {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("tarot-modal-lock");
      });
    };

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("tarot-modal-lock");
      window.setTimeout(() => ((modal as any).hidden = true), 180);
    };

    const initDesktop = () => {
      if (!stage) return;

      const cards = Array.from(
        stage.querySelectorAll<HTMLElement>(".tarot-card"),
      );
      if (!cards.length) return;

      // Optional but helps pointer stability on some browsers (Firefox/trackpad)
      // If you already set these in CSS, you can ignore.
      stage.style.userSelect = "none";

      let z = 20;

      const clamp = (v: number, min: number, max: number) =>
        Math.min(max, Math.max(min, v));

      const bringToFront = (card: HTMLElement) => {
        z += 1;
        card.style.zIndex = String(z);
      };

      const getBoundsPercent = (card: HTMLElement) => {
        const s = stage.getBoundingClientRect();
        const c = card.getBoundingClientRect();

        // Evita divisioni strane se stage non ha dimensioni (edge cases)
        const sw = Math.max(1, s.width);
        const sh = Math.max(1, s.height);

        const w = (c.width / sw) * 100;
        const h = (c.height / sh) * 100;

        const pad = 2;
        const minX = w / 2 + pad;
        const maxX = 100 - w / 2 - pad;
        const minY = h / 2 + pad;
        const maxY = 100 - h / 2 - pad;

        return { minX, maxX, minY, maxY };
      };

      const setPos = (card: HTMLElement, x: number, y: number) => {
        card.style.setProperty("--x", x.toFixed(3));
        card.style.setProperty("--y", y.toFixed(3));
        card.dataset.x = String(x);
        card.dataset.y = String(y);
      };

      const getPos = (card: HTMLElement) => {
        const css = getComputedStyle(card);
        const x =
          parseFloat(card.dataset.x ?? css.getPropertyValue("--x")) || 50;
        const y =
          parseFloat(card.dataset.y ?? css.getPropertyValue("--y")) || 60;
        return { x, y };
      };

      const shuffle = () => {
        cards.forEach((card) => {
          const b = getBoundsPercent(card);
          const x = Math.random() * (b.maxX - b.minX) + b.minX;
          const y = Math.random() * (b.maxY - b.minY) + b.minY;
          setPos(card, x, y);
          bringToFront(card);
        });
      };

      // Shuffle buttons
      on(shuffleBtn, "click", shuffle);
      on(modalShuffle, "click", () => {
        shuffle();
        closeModal();
      });

      // Modal close
      on(modal, "click", (e: Event) => {
        const t = e.target as HTMLElement | null;
        if (t && t.matches?.("[data-close]")) closeModal();
      });

      on(window, "keydown", (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "Escape" && modal && !(modal as any).hidden)
          closeModal();
      });

      /**
       * ✅ Drag handler (fixed):
       * - Adds global pointermove/up listeners ONLY while dragging
       * - Releases pointer capture (Firefox stability)
       * - Handles pointercancel + blur
       * - Keeps original behavior on other browsers
       */
      const enableDrag = (card: HTMLElement) => {
        let dragging = false;
        let moved = 0;
        let startX = 0;
        let startY = 0;
        let startPos = { x: 0, y: 0 };
        let activePointerId: number | null = null;

        // Migliora UX: non trascinare se target è link/btn interno (se mai ce ne fossero)
        const isInteractive = (el: EventTarget | null) => {
          const t = el as HTMLElement | null;
          return !!t?.closest?.("a,button,input,textarea,select,label");
        };

        // For smoother behavior on touchpads + consistent pointer stream
        // (Doesn't affect click-to-open)
        card.style.touchAction = "none";

        const onMove = (e: PointerEvent) => {
          if (!dragging) return;
          if (activePointerId !== null && e.pointerId !== activePointerId)
            return;

          const s = stage.getBoundingClientRect();
          const sw = Math.max(1, s.width);
          const sh = Math.max(1, s.height);

          const dx = (e.clientX ?? 0) - startX;
          const dy = (e.clientY ?? 0) - startY;

          moved += Math.abs(dx) + Math.abs(dy);

          const dxPct = (dx / sw) * 100;
          const dyPct = (dy / sh) * 100;

          const b = getBoundsPercent(card);
          const x = clamp(startPos.x + dxPct, b.minX, b.maxX);
          const y = clamp(startPos.y + dyPct, b.minY, b.maxY);

          setPos(card, x, y);

          // During drag: prevent selection / default gestures
          e.preventDefault();
        };

        const stopDrag = () => {
          if (!dragging) return;
          dragging = false;
          card.classList.remove("is-dragging");

          // Release pointer capture (important for Firefox)
          if (activePointerId !== null) {
            try {
              card.releasePointerCapture?.(activePointerId);
            } catch {}
          }
          activePointerId = null;

          // Remove global listeners
          window.removeEventListener("pointermove", onMove as any);
          window.removeEventListener("pointerup", onUp as any);
          window.removeEventListener("pointercancel", onUp as any);
          window.removeEventListener("blur", onUp as any);
        };

        const onUp = (_e?: Event) => stopDrag();

        const onDown = (e: PointerEvent) => {
          if (isInteractive(e.target)) return;
          if (e.button === 2) return; // no right click
          if (isMobile()) return; // safety

          dragging = true;
          moved = 0;

          card.classList.add("is-dragging");
          bringToFront(card);

          activePointerId = e.pointerId;
          startX = e.clientX ?? 0;
          startY = e.clientY ?? 0;
          startPos = getPos(card);

          // Capture pointer
          try {
            card.setPointerCapture?.(e.pointerId);
          } catch {}

          // Attach global listeners only now
          window.addEventListener("pointermove", onMove, { passive: false });
          window.addEventListener("pointerup", onUp, { passive: true });
          window.addEventListener("pointercancel", onUp, { passive: true });
          window.addEventListener("blur", onUp);

          // Avoid selection / default behavior
          e.preventDefault();
        };

        const openFromCard = () => {
          openModal({
            key: card.dataset.key,
            title: card.dataset.title,
            subtitle: card.dataset.subtitle,
            img: card.dataset.img,
            desc: card.dataset.desc,
          });
        };

        on(card, "pointerdown", onDown);

        // Click only if not a drag
        on(card, "click", () => {
          if (moved > 10) return;
          openFromCard();
        });

        // Accessibilità
        on(card, "keydown", (e: Event) => {
          const ke = e as KeyboardEvent;
          if (ke.key === "Enter" || ke.key === " ") {
            ke.preventDefault();
            openFromCard();
          }
        });
      };

      cards.forEach(enableDrag);

      // Initial layout once stage has real size
      requestAnimationFrame(() => shuffle());
    };

    const boot = () => {
      console.log("RUN ✅", {
        isMobile: isMobile(),
        hasStage: !!document.getElementById("tarotStage"),
        cards: document.querySelectorAll(".tarot-card").length,
      });

      if (isMobile()) initMobile();
      else initDesktop();
    };

    boot();

    // Breakpoint change: reinizializza senza reload, pulendo i listener
    const onBreakpoint = () => {
      // chiude modale se cambi viewport
      closeModal();

      // cleanup listeners e re-init
      destroy();
      // reinstalla un nuovo ciclo (ripristina destroy su window)
      run();
    };

    // addEventListener su MediaQueryList è supportato moderno; fallback a onchange per safety
    if (mqMobile.addEventListener) {
      on(mqMobile, "change", onBreakpoint);
    } else {
      // @ts-expect-error legacy
      mqMobile.onchange = onBreakpoint;
      cleanups.push(() => {
        // @ts-expect-error legacy
        mqMobile.onchange = null;
      });
    }

    // In Astro con View Transitions: prima dello swap pulisci
    on(document, "astro:before-swap", () => {
      window.__tarotServicesDestroy?.();
      window.__tarotServicesDestroy = undefined;
    });
  };

  const start = () => run();

  // Astro event (se presente) + fallback
  document.addEventListener("astro:page-load", start, { once: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
