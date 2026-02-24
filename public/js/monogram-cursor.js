(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (document.getElementById("mono-cursor")) return;

  const style = document.createElement("style");
  style.textContent = `
    html.has-custom-cursor, html.has-custom-cursor body { cursor: none; }
    html.has-custom-cursor input,
    html.has-custom-cursor textarea,
    html.has-custom-cursor [contenteditable="true"] { cursor: auto; }
    #mono-cursor { will-change: transform, opacity, filter; }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add("has-custom-cursor");

  const cursor = document.createElement("div");
  cursor.id = "mono-cursor";
  document.body.appendChild(cursor);

  fetch("/images/monogram.svg")
    .then((r) => r.text())
    .then((svg) => {
      cursor.innerHTML = svg;
    });
  const SIZE = 26;
  Object.assign(cursor.style, {
    width: SIZE + "px",
    height: SIZE + "px",
    position: "fixed",
    left: "0px",
    top: "0px",
    transform: "translate3d(-50%, -50%, 0)", // base
    pointerEvents: "none",
    zIndex: "99999",
    // niente transition su transform: lo gestiamo via JS
    transition: "opacity 0.2s ease, filter 0.2s ease",
    filter: "drop-shadow(0 0 0 rgba(0,0,0,0))",
  });

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX,
    y = targetY;
  let vx = 0,
    vy = 0; // velocità per lo spring

  // parametri spring (critically damped-ish)
  const STIFFNESS = 900; // più alto = più reattivo
  const DAMPING = 2 * Math.sqrt(STIFFNESS); // ~critico

  const onMove = (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  };
  document.addEventListener("mousemove", onMove, { passive: true });

  let rafId = null;
  let last = performance.now();

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.032); // clamp 32ms
    last = now;

    // equazione molla: a = -k(x - target) - c*v
    const ax = -STIFFNESS * (x - targetX) - DAMPING * vx;
    const ay = -STIFFNESS * (y - targetY) - DAMPING * vy;

    vx += ax * dt;
    vy += ay * dt;

    x += vx * dt;
    y += vy * dt;

    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;

    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  // hover scale/shadow senza concatenare stringhe
  let scaled = false;
  const applyScale = (on) => {
    if (on === scaled) return;
    scaled = on;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0) ${
      on ? " scale(1.4)" : ""
    }`;
    cursor.style.filter = on
      ? "drop-shadow(0 4px 10px rgba(0,0,0,0.15))"
      : "drop-shadow(0 0 0 rgba(0,0,0,0))";
  };

  const hoverables = [
    "a",
    "button",
    "[role='button']",
    "[data-hover='cursor']",
  ];
  document.querySelectorAll(hoverables.join(",")).forEach((el) => {
    el.addEventListener("mouseenter", () => applyScale(true));
    el.addEventListener("mouseleave", () => applyScale(false));
  });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
  });

  window.addEventListener("beforeunload", () => {
    document.removeEventListener("mousemove", onMove);
    if (rafId) cancelAnimationFrame(rafId);
    cursor.remove();
    document.documentElement.classList.remove("has-custom-cursor");
  });
})();
