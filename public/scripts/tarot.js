// src/scripts/tarot-services.ts
// Tarot services interactions (desktop drag + modal, mobile carousel details)

type TarotData = {
  key?: string;
  title?: string;
  subtitle?: string;
  img?: string;
  desc?: string;
};

(() => {
  const run = () => {
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

      const ds = (btn as HTMLElement).dataset;

      detailKicker.textContent = ds.subtitle || "";
      detailTitle.textContent = ds.title || "";
      detailText.textContent = ds.desc || "";
      if (detailMore) detailMore.href = `/services/#${ds.key || ""}`;

      mobileRoot
        ?.querySelectorAll(".tarot-slide.is-active")
        .forEach((el) => el.classList.remove("is-active"));

      btn.classList.add("is-active");
    };

    const initMobile = () => {
      if (!mobileRoot) return;
      const slides = Array.from(
        mobileRoot.querySelectorAll<HTMLElement>(".tarot-slide"),
      );
      if (!slides.length) return;

      slides.forEach((btn) =>
        btn.addEventListener("click", () => setDetailFromBtn(btn), {
          passive: true,
        }),
      );

      setDetailFromBtn(slides[0]); // default
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
      if (modalMore) modalMore.href = `/services/#${data.key || ""}`;

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

        const w = (c.width / s.width) * 100;
        const h = (c.height / s.height) * 100;

        const minX = w / 2 + 2;
        const maxX = 100 - w / 2 - 2;

        const minY = h / 2 + 2;
        const maxY = 100 - h / 2 - 2;

        return { minX, maxX, minY, maxY };
      };

      const setPos = (card: HTMLElement, x: number, y: number) => {
        card.style.setProperty("--x", x.toFixed(3));
        card.style.setProperty("--y", y.toFixed(3));
        card.dataset.x = String(x);
        card.dataset.y = String(y);
      };

      const getPos = (card: HTMLElement) => {
        const x =
          parseFloat(
            card.dataset.x ?? getComputedStyle(card).getPropertyValue("--x"),
          ) || 50;
        const y =
          parseFloat(
            card.dataset.y ?? getComputedStyle(card).getPropertyValue("--y"),
          ) || 60;
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

      shuffleBtn?.addEventListener("click", shuffle);

      modalShuffle?.addEventListener("click", () => {
        shuffle();
        closeModal();
      });

      modal?.addEventListener("click", (e) => {
        const t = e.target as HTMLElement | null;
        if (t && t.matches?.("[data-close]")) closeModal();
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && !(modal as any).hidden) closeModal();
      });

      const enableDrag = (card: HTMLElement) => {
        let dragging = false;
        let moved = 0;
        let startX = 0;
        let startY = 0;
        let startPos = { x: 0, y: 0 };

        const onDown = (e: PointerEvent) => {
          if (e.button === 2) return;
          dragging = true;
          moved = 0;

          card.classList.add("is-dragging");
          bringToFront(card);

          startX = e.clientX ?? 0;
          startY = e.clientY ?? 0;
          startPos = getPos(card);

          card.setPointerCapture?.(e.pointerId);
          e.preventDefault();
        };

        const onMove = (e: PointerEvent) => {
          if (!dragging) return;

          const s = stage.getBoundingClientRect();
          const dx = (e.clientX ?? 0) - startX;
          const dy = (e.clientY ?? 0) - startY;

          moved += Math.abs(dx) + Math.abs(dy);

          const dxPct = (dx / s.width) * 100;
          const dyPct = (dy / s.height) * 100;

          const b = getBoundsPercent(card);
          const x = clamp(startPos.x + dxPct, b.minX, b.maxX);
          const y = clamp(startPos.y + dyPct, b.minY, b.maxY);

          setPos(card, x, y);
          e.preventDefault();
        };

        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          card.classList.remove("is-dragging");
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

        card.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove, { passive: false });
        window.addEventListener("pointerup", onUp);

        card.addEventListener("click", () => {
          if (moved > 10) return; // evita click dopo drag
          openFromCard();
        });

        card.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFromCard();
          }
        });
      };

      cards.forEach(enableDrag);
      shuffle(); // initial composition
    };

    const boot = () => {
      if (isMobile()) initMobile();
      else initDesktop();
    };

    boot();

    // come nel tuo codice: su change breakpoint ricarica per resettare logica/layout
    mqMobile.addEventListener?.("change", () => window.location.reload());
  };

  // Evita problemi se lo script viene caricato in head
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
