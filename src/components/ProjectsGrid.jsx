import React, { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard.jsx";

const pretty = (s) => s;

export default function ProjectsGrid({ items, categories }) {
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    if (active === "All") return items;
    return items.filter((p) => (p.categories || []).includes(active));
  }, [items, active]);

  return (
    <section className="projects">
      <div
        className="projects__filters"
        role="tablist"
        aria-label="Filter projects by sector"
      >
        {categories.map((c) => {
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
              {pretty(c)}
            </button>
          );
        })}
      </div>

      <div className="projects__grid" aria-live="polite">
        {filtered.map((p) => (
          <ProjectCard
            key={p.slug}
            href={`/projects/${p.slug}/`}
            cover={p.cover}
            title={p.titolo}
            abstract={p.abstract}
            meta={p.meta}
            badges={p.badges}
          />
        ))}
      </div>
    </section>
  );
}
