// Video toggle (play/pause) — accessible + respects prefers-reduced-motion
// Based on your current script, with two micro-upgrades:
// 1) aria-controls linking button -> video (adds/ensures a video id)
// 2) icon marked aria-hidden + optional sr-only text node for extra robustness
// :contentReference[oaicite:0]{index=0}

if (typeof window !== "undefined") {
  const initVideoToggles = () => {
    document.querySelectorAll("[data-video-toggle]").forEach((container) => {
      const video = container.querySelector("video");
      if (!video) return;

      // Ensure the container is a positioning context for the overlay button
      container.style.position = "relative";

      // Ensure video has an id so aria-controls can reference it
      if (!video.id) {
        video.id = `video-${Math.random().toString(36).slice(2, 9)}`;
      }

      let button = container.querySelector(".video-toggle");

      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "video-toggle";
        button.setAttribute("aria-label", "Pause animation");
        button.setAttribute("aria-pressed", "false");

        // Optional but robust: icon is decorative, sr-only mirrors aria-label
        button.innerHTML = `
          <span class="icon" aria-hidden="true"></span>
          <span class="sr-only">Pause animation</span>
        `;

        container.appendChild(button);
      }

      // Link control -> video for assistive tech & audits
      button.setAttribute("aria-controls", video.id);

      // Avoid double-binding listeners if init runs multiple times
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";

      const srText = button.querySelector(".sr-only");

      const setState = (isPaused) => {
        if (isPaused) {
          button.classList.add("is-paused");
          button.setAttribute("aria-label", "Play animation");
          button.setAttribute("aria-pressed", "true");
          if (srText) srText.textContent = "Play animation";
        } else {
          button.classList.remove("is-paused");
          button.setAttribute("aria-label", "Pause animation");
          button.setAttribute("aria-pressed", "false");
          if (srText) srText.textContent = "Pause animation";
        }
      };

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        video.pause();
        setState(true);
      } else {
        setState(video.paused);
      }

      button.addEventListener("click", () => {
        if (video.paused) {
          video.play();
          setState(false);
        } else {
          video.pause();
          setState(true);
        }
      });
    });
  };

  document.addEventListener("DOMContentLoaded", initVideoToggles);
  window.addEventListener("load", initVideoToggles);
}
