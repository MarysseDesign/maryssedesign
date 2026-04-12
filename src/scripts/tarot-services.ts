// src/scripts/tarot-services.ts
// Tarot services interactions (desktop drag + modal, mobile carousel details)
// Refined mobile gesture handling:
// - robust separation between tap and swipe
// - safer pointer lifecycle
// - compatible with article[role="button"] for mobile cards

type TarotData = {
  key?: string;
  title?: string;
  subtitle?: string;
  number?: string;
  archetype?: string;
  img?: string;
  desc?: string;
};

type Cleanup = () => void;

declare global {
  interface Window {
    __tarotServicesDestroy?: Cleanup;
    __tarotServicesStarted?: boolean;
  }
}

(() => {
  const BASE_URL = (import.meta as any)?.env?.BASE_URL ?? "/";

  const joinBase = (path: string) => {
    const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
    const p = path.startsWith("/") ? path.slice(1) : path;
    return `${base}${p}`;
  };

  const slugFromKey = (key: string) => {
    const map: Record<string, string> = {
      branding: "branding",
      strategy: "creative-direction",
      advertising: "advertising",
      storytelling: "storytelling",
      web: "web-design",
      social: "social-media",
      visual: "visual-system",
      photo: "photography",
      video: "video",
      events: "experiential",
    };

    return map[key] ?? key;
  };

  const makeServicesHref = (key?: string) =>
    `${joinBase("services/")}#${slugFromKey(key ?? "")}`;

  const run = () => {
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
      closeModal();
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
    const mobileCarousel = document.getElementById("tarotCarousel");
    const detailKicker = document.getElementById("tarotDetailKicker");
    const detailTitle = document.getElementById("tarotDetailTitle");
    const detailArchetype = document.getElementById("tarotDetailArchetype");
    const detailText = document.getElementById("tarotDetailText");
    const detailMore = document.getElementById(
      "tarotDetailMore",
    ) as HTMLAnchorElement | null;

    const setDetailFromBtn = (btn: HTMLElement | null) => {
      if (!btn || !detailKicker || !detailTitle || !detailText) return;

      const ds = btn.dataset;
      detailKicker.textContent = ds.subtitle || "";
      detailTitle.textContent = ds.title || "";

      if (detailArchetype) {
        detailArchetype.textContent = ds.archetype
          ? ds.archetype.toUpperCase()
          : "";
      }

      detailText.textContent = ds.desc || "";

      if (detailMore) detailMore.href = makeServicesHref(ds.key);

      mobileRoot
        ?.querySelectorAll<HTMLElement>(".tarot-slide.is-active")
        .forEach((el) => el.classList.remove("is-active"));

      btn.classList.add("is-active");
    };

    const initMobile = () => {
      if (!mobileRoot || !mobileCarousel) return;

      const slides = Array.from(
        mobileRoot.querySelectorAll<HTMLElement>(".tarot-slide"),
      );
      if (!slides.length) return;

      const TAP_DISTANCE = 10;

      slides.forEach((slide) => {
        let pointerId: number | null = null;
        let startX = 0;
        let startY = 0;
        let moved = false;

        const resetGesture = () => {
          pointerId = null;
          startX = 0;
          startY = 0;
          moved = false;
        };

        on(
          slide,
          "pointerdown",
          (e: Event) => {
            const pe = e as PointerEvent;

            pointerId = pe.pointerId;
            startX = pe.clientX;
            startY = pe.clientY;
            moved = false;
          },
          { passive: true },
        );

        on(
          slide,
          "pointermove",
          (e: Event) => {
            const pe = e as PointerEvent;
            if (pointerId !== pe.pointerId) return;

            const dx = Math.abs(pe.clientX - startX);
            const dy = Math.abs(pe.clientY - startY);

            if (dx > TAP_DISTANCE || dy > TAP_DISTANCE) {
              moved = true;
            }
          },
          { passive: true },
        );

        on(
          slide,
          "pointerup",
          (e: Event) => {
            const pe = e as PointerEvent;
            if (pointerId !== pe.pointerId) return;
            pointerId = null;
          },
          { passive: true },
        );

        on(
          slide,
          "pointercancel",
          () => {
            resetGesture();
          },
          { passive: true },
        );

        on(
          slide,
          "click",
          () => {
            if (moved) {
              resetGesture();
              return;
            }

            setDetailFromBtn(slide);
            resetGesture();
          },
          { passive: true },
        );

        on(slide, "keydown", (e: Event) => {
          const ke = e as KeyboardEvent;
          if (ke.key === "Enter" || ke.key === " ") {
            ke.preventDefault();
            setDetailFromBtn(slide);
          }
        });
      });

      requestAnimationFrame(() => {
        setDetailFromBtn(slides[0]);
      });
    };

    // ===== DESKTOP =====
    const stage = document.getElementById("tarotStage");

    const modal = document.getElementById("tarotModal") as HTMLElement | null;
    const modalImg = document.getElementById(
      "tarotModalImg",
    ) as HTMLImageElement | null;
    const modalKicker = document.getElementById("tarotModalKicker");
    const modalTitle = document.getElementById("tarotModalTitle");
    const modalNumber = document.getElementById("tarotModalNumber");
    const modalArchetype = document.getElementById("tarotModalArchetype");
    const modalText = document.getElementById("tarotModalText");
    const modalShuffle = document.getElementById(
      "tarotModalShuffle",
    ) as HTMLButtonElement | null;
    const modalMore = document.getElementById(
      "tarotModalMore",
    ) as HTMLAnchorElement | null;

    const ensureModalPortal = () => {
      if (!modal) return;
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    };

    let lastFocusedCard: HTMLElement | null = null;

    const openModal = (data: TarotData) => {
      ensureModalPortal();
      if (!modal || !modalImg || !modalKicker || !modalTitle || !modalText) {
        return;
      }

      modalImg.src = data.img || "";
      modalImg.alt = data.title ? `${data.title} image` : "";
      modalKicker.textContent = data.subtitle || "";
      modalTitle.textContent = data.title || "";

      if (modalNumber) {
        modalNumber.textContent = data.number || "";
      }

      if (modalArchetype) {
        modalArchetype.textContent = data.archetype
          ? data.archetype.toUpperCase()
          : "";
      }

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

      window.setTimeout(() => {
        (modal as any).hidden = true;

        if (lastFocusedCard) {
          lastFocusedCard.blur();
        }

        lastFocusedCard = null;
      }, 180);
    };

    const initDesktop = () => {
      if (!stage) return;

      const cards = Array.from(
        stage.querySelectorAll<HTMLElement>(".tarot-card"),
      );
      if (!cards.length) return;

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

      on(shuffleBtn, "click", shuffle);
      on(modalShuffle, "click", () => {
        shuffle();
        closeModal();
      });

      on(modal, "click", (e: Event) => {
        const t = e.target as HTMLElement | null;
        if (t && t.matches?.("[data-close]")) closeModal();
      });

      on(window, "keydown", (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "Escape" && modal && !(modal as any).hidden) {
          closeModal();
        }
      });

      const enableDrag = (card: HTMLElement) => {
        let dragging = false;
        let moved = 0;
        let startX = 0;
        let startY = 0;
        let startPos = { x: 0, y: 0 };
        let activePointerId: number | null = null;

        const isInteractive = (el: EventTarget | null) => {
          const t = el as HTMLElement | null;
          return !!t?.closest?.("a,button,input,textarea,select,label");
        };

        const onMove = (e: PointerEvent) => {
          if (!dragging) return;
          if (activePointerId !== null && e.pointerId !== activePointerId) {
            return;
          }

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

          e.preventDefault();
        };

        const stopDrag = () => {
          if (!dragging) return;
          dragging = false;
          card.style.touchAction = "";
          card.classList.remove("is-dragging");

          if (activePointerId !== null) {
            try {
              card.releasePointerCapture?.(activePointerId);
            } catch {}
          }
          activePointerId = null;

          window.removeEventListener("pointermove", onMove as any);
          window.removeEventListener("pointerup", onUp as any);
          window.removeEventListener("pointercancel", onUp as any);
          window.removeEventListener("blur", onUp as any);
        };

        const onUp = (_e?: Event) => stopDrag();

        const onDown = (e: PointerEvent) => {
          if (isInteractive(e.target)) return;
          if (e.button === 2) return;
          if (isMobile()) return;

          dragging = true;
          moved = 0;

          card.style.touchAction = "none";
          card.classList.add("is-dragging");
          bringToFront(card);

          activePointerId = e.pointerId;
          startX = e.clientX ?? 0;
          startY = e.clientY ?? 0;
          startPos = getPos(card);

          try {
            card.setPointerCapture?.(e.pointerId);
          } catch {}

          window.addEventListener("pointermove", onMove, { passive: false });
          window.addEventListener("pointerup", onUp, { passive: true });
          window.addEventListener("pointercancel", onUp, { passive: true });
          window.addEventListener("blur", onUp);

          e.preventDefault();
        };

        const openFromCard = () => {
          lastFocusedCard = card;
          openModal({
            key: card.dataset.key,
            title: card.dataset.title,
            subtitle: card.dataset.subtitle,
            number: card.dataset.number,
            archetype: card.dataset.archetype,
            img: card.dataset.img,
            desc: card.dataset.desc,
          });
        };

        on(card, "pointerdown", onDown);

        on(card, "click", () => {
          if (moved > 10) return;
          openFromCard();
        });

        on(card, "keydown", (e: Event) => {
          const ke = e as KeyboardEvent;
          if (ke.key === "Enter" || ke.key === " ") {
            ke.preventDefault();
            openFromCard();
          }
        });
      };

      cards.forEach(enableDrag);

      requestAnimationFrame(() => shuffle());
    };

    const boot = () => {
      if (isMobile()) initMobile();
      else initDesktop();
    };

    boot();

    const onBreakpoint = () => {
      closeModal();
      destroy();
      run();
    };

    if (mqMobile.addEventListener) {
      on(mqMobile, "change", onBreakpoint);
    } else {
      // @ts-expect-error legacy fallback
      mqMobile.onchange = onBreakpoint;
      cleanups.push(() => {
        // @ts-expect-error legacy fallback
        mqMobile.onchange = null;
      });
    }

    on(document, "astro:before-swap", () => {
      window.__tarotServicesDestroy?.();
      window.__tarotServicesDestroy = undefined;
      window.__tarotServicesStarted = false;
    });
  };

  const start = () => {
    if (window.__tarotServicesStarted) return;
    window.__tarotServicesStarted = true;
    run();
  };

  document.addEventListener("astro:page-load", start);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
