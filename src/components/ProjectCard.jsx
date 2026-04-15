import React from "react";

export default function ProjectCard({
  href,
  cover,
  title,
  abstract,
  meta,
  badges = [],
  rolesAria = "Roles",
}) {
  return (
    <a className="p-card" href={href}>
      <div className="p-card__media">
        <img src={cover} alt={title} loading="lazy" />
      </div>

      <div className="p-card__body">
        <h3 className="p-card__title">{title}</h3>

        {abstract && <p className="p-card__abstract">{abstract}</p>}
        {meta && <p className="p-card__meta">{meta}</p>}

        {badges?.length > 0 && (
          <div className="p-card__badges" aria-label={rolesAria}>
            {badges.map((b) => (
              <span className="p-badge" key={b}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
