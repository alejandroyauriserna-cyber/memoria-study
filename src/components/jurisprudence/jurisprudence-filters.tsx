"use client";

import type { JurisprudenceFilterState } from "@/lib/jurisprudence/filters";
import {
  countActiveFilters,
  EMPTY_JURISPRUDENCE_FILTERS,
  toggleFilterValue,
} from "@/lib/jurisprudence/filters";
import {
  JURISPRUDENCE_MATERIA_LABELS,
  JURISPRUDENCE_TIPO_LABELS,
} from "@/lib/jurisprudence/labels";
import { JURISPRUDENCE_MATERIAS, JURISPRUDENCE_TIPOS } from "@/types/jurisprudence";
import { Filter, RotateCcw, Star } from "lucide-react";

type Props = {
  filters: JurisprudenceFilterState;
  onChange: (next: JurisprudenceFilterState) => void;
  organos: string[];
  years: number[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function JurisprudenceFilters({
  filters,
  onChange,
  organos,
  years,
  collapsed,
  onToggleCollapse,
}: Props) {
  const activeCount = countActiveFilters(filters);

  const clearAll = () => onChange({ ...EMPTY_JURISPRUDENCE_FILTERS });

  return (
    <aside className={`bj-filters${collapsed ? " is-collapsed" : ""}`}>
      <div className="bj-filters__head">
        <div className="bj-filters__title">
          <Filter size={16} />
          Filtros
          {activeCount > 0 ? <span className="bj-filters__count">{activeCount}</span> : null}
        </div>
        {onToggleCollapse ? (
          <button type="button" className="bj-filters__collapse" onClick={onToggleCollapse}>
            {collapsed ? "Mostrar" : "Ocultar"}
          </button>
        ) : null}
      </div>

      {activeCount > 0 ? (
        <button type="button" className="bj-filters__clear" onClick={clearAll}>
          <RotateCcw size={13} />
          Limpiar filtros
        </button>
      ) : null}

      <section className="bj-filters__section">
        <h3>Materia</h3>
        <div className="bj-filters__chips">
          {JURISPRUDENCE_MATERIAS.map((materia) => (
            <button
              key={materia}
              type="button"
              className={`bj-filters__chip${filters.materias.includes(materia) ? " is-active" : ""}`}
              onClick={() =>
                onChange({
                  ...filters,
                  materias: toggleFilterValue(filters.materias, materia),
                })
              }
            >
              {JURISPRUDENCE_MATERIA_LABELS[materia]}
            </button>
          ))}
        </div>
      </section>

      <section className="bj-filters__section">
        <h3>Tipo</h3>
        <div className="bj-filters__chips">
          {JURISPRUDENCE_TIPOS.map((tipo) => (
            <button
              key={tipo}
              type="button"
              className={`bj-filters__chip${filters.tipos.includes(tipo) ? " is-active" : ""}`}
              onClick={() =>
                onChange({
                  ...filters,
                  tipos: toggleFilterValue(filters.tipos, tipo),
                })
              }
            >
              {JURISPRUDENCE_TIPO_LABELS[tipo]}
            </button>
          ))}
        </div>
      </section>

      <section className="bj-filters__section">
        <h3>Año</h3>
        <div className="bj-filters__chips bj-filters__chips--scroll">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              className={`bj-filters__chip${filters.years.includes(year) ? " is-active" : ""}`}
              onClick={() =>
                onChange({
                  ...filters,
                  years: toggleFilterValue(filters.years, year),
                })
              }
            >
              {year}
            </button>
          ))}
        </div>
      </section>

      <section className="bj-filters__section">
        <h3>Órgano</h3>
        <div className="bj-filters__list">
          {organos.map((organo) => (
            <label key={organo} className="bj-filters__check">
              <input
                type="checkbox"
                checked={filters.organos.includes(organo)}
                onChange={() =>
                  onChange({
                    ...filters,
                    organos: toggleFilterValue(filters.organos, organo),
                  })
                }
              />
              <span>{organo}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="bj-filters__section">
        <button
          type="button"
          className={`bj-filters__favorites${filters.favoritesOnly ? " is-active" : ""}`}
          onClick={() =>
            onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })
          }
        >
          <Star size={14} fill={filters.favoritesOnly ? "currentColor" : "none"} />
          Solo guardados
        </button>
      </section>
    </aside>
  );
}
