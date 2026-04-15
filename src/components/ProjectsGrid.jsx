import React, { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard.jsx";

export default function ProjectsGrid({ items, categories, lang = "en" }) {
  const isIt = lang === "it";
  const allLabel = isIt ? "Tutti" : "All";

  const [active, setActive] = useState(allLabel);

  const filtered = useMemo(() => {
    if (active === allLabel) return items;
    return items.filter((p) => (p.categories || []).includes(active));
  }, [items, active, allLabel]);

  return (
    <section className="projects">
      <div
        className="projects__filters"
        role="tablist"
        aria-label={
          isIt ? "Filtra i progetti per settore" : "Filter projects by sector"
        }
      >
        {[allLabel, ...categories.filter((c) => c !== allLabel)].map((c) => {
          const isActive = c === active;
          return (
            <button
              key={c}
              type="button"
              className={`filter-chip ${isActive ? "is-active" : ""}`}
              onClick={() => setActive(c)}
              role="tab"
              aria-selected={isActive}
            >
              <span className="filter-chip__dot" aria-hidden="true" />
              {c}
            </button>
          );
        })}
      </div>

      <div className="projects__grid" aria-live="polite">
        {filtered.map((p) => (
          <ProjectCard
            key={p.slug}
            href={isIt ? `/it/progetti/${p.slug}/` : `/projects/${p.slug}/`}
            cover={p.cover}
            title={p.titolo}
            abstract={p.abstract}
            meta={p.meta}
            badges={p.badges}
            rolesAria={isIt ? "Ruoli" : "Roles"}
          />
        ))}
      </div>
    </section>
  );
}
