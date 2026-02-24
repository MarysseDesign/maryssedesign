(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (document.getElementById("custom-cursor")) return;

  const cursor = document.createElement("div");
  cursor.id = "custom-cursor";
  document.body.appendChild(cursor);

  Object.assign(cursor.style, {
    width: "20px",
    height: "20px",
    border: "2px solid #000",
    borderRadius: "50%",
    position: "fixed",
    left: "0px",
    top: "0px",
    transform: "translate(-50%, -50%) scale(1)",
    pointerEvents: "none",
    zIndex: "99999",
    willChange: "left, top, transform",
    // 👇 IMPORTANT: niente transition sul transform (Firefox flicker)
    transition: "background 0.3s ease",
  });

  let x = -9999,
    y = -9999;
  let scale = 1;
  let raf = 0;

  function render() {
    raf = 0;
    cursor.style.left = x + "px";
    cursor.style.top = y + "px";
    cursor.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  function onMove(e) {
    x = e.clientX;
    y = e.clientY;
    if (!raf) raf = requestAnimationFrame(render);
  }

  window.addEventListener("pointermove", onMove, { passive: true });

  const hoverables = ["a", "button", '[data-hover="cursor"]'];
  document.querySelectorAll(hoverables.join(",")).forEach((el) => {
    el.addEventListener("mouseenter", () => {
      scale = 1.5;
      cursor.style.background = "rgba(0,0,0,0.1)";
      if (!raf) raf = requestAnimationFrame(render);
    });
    el.addEventListener("mouseleave", () => {
      scale = 1;
      cursor.style.background = "transparent";
      if (!raf) raf = requestAnimationFrame(render);
    });
  });

  // Cleanup safety: se tab perde focus, evita “stati strani”
  window.addEventListener("blur", () => {
    scale = 1;
    cursor.style.background = "transparent";
  });
})();
