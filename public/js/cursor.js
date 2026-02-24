(function () {
  // Evita su touch device (niente cursore) e duplicazioni con HMR
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (document.getElementById("custom-cursor")) return;

  const cursor = document.createElement("div");
  cursor.id = "custom-cursor";
  document.body.appendChild(cursor);

  // CSS inline (puoi spostarlo in tailwind/css se vuoi)
  Object.assign(cursor.style, {
    width: "20px",
    height: "20px",
    border: "2px solid #000",
    borderRadius: "50%",
    position: "fixed",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: "99999",
    transition: "transform 0.15s ease-out, background 0.3s",
  });

  // Segui il mouse
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  // Effetto hover su link e bottoni
  const hoverables = ["a", "button", '[data-hover="cursor"]'];
  document.querySelectorAll(hoverables.join(",")).forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1.5)";
      cursor.style.background = "rgba(0,0,0,0.1)";
    });
    el.addEventListener("mouseleave", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      cursor.style.background = "transparent";
    });
  });
})();
