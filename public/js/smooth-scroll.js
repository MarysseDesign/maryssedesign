(function () {
  function init() {
    // Attiva solo per anchor interne (href="#qualcosa") che esistono nella pagina
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach((link) => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        const target = href ? document.querySelector(href) : null;
        if (!target) return; // se non c'è l'elemento, lascia comportamento normale

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
