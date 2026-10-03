"use client";

import {useEffect, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {designClasses, taxonomyLabel, type DesignClass, type Season} from "@/lib/catalog/taxonomy-core";
import {validationStageLabel} from "@/lib/validation-labels";
import {animalSizeClassLabel} from "@/lib/model-labels";
import {CatalogCard, formatBuildTime, insulationLabel, toolsLabel, type EngineeredThumbnailData} from "@/components/catalog/catalog-card";
import {
  defaultCatalogUrlState,
  parseCatalogUrlState,
  replaceBrowserSearchParams,
  serializeCatalogUrlState,
  type CatalogUrlState
} from "@/lib/view-url-state";

const seasons: Array<Season | "all"> = ["all", "WINTER", "RAIN", "WIND", "SUMMER", "EMERGENCY"];

export function ModelCatalog({
  entries,
  engineeredThumbnails,
  locale,
  initialState = defaultCatalogUrlState
}: {
  entries: CatalogEntry[];
  engineeredThumbnails: Record<string, EngineeredThumbnailData>;
  locale: AppLocale;
  initialState?: CatalogUrlState;
}) {
  const isSr = locale === "sr";
  const [catalogState, setCatalogState] = useState<CatalogUrlState>(initialState);
  const {animal, heating, query, compareSlugs, designClasses: selectedClasses, season} = catalogState;
  const validSlugs = useMemo(() => entries.map((entry) => entry.slug), [entries]);

  useEffect(() => {
    const syncFromLocation = () => {
      setCatalogState(parseCatalogUrlState(new URLSearchParams(window.location.search), validSlugs));
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [validSlugs]);

  useEffect(() => {
    replaceBrowserSearchParams(
      serializeCatalogUrlState(new URLSearchParams(window.location.search), catalogState, validSlugs)
    );
  }, [catalogState, validSlugs]);

  const visible = useMemo(
    () => entries.filter((entry) => {
      const animalOk = animal === "all" || entry.animal === animal;
      const heatOk = heating === "all" || (heating === "heated" ? entry.heated : !entry.heated);
      const classOk = selectedClasses.length === 0 || selectedClasses.includes(entry.designClass);
      const seasonOk = season === "all" || entry.seasons.includes(season);
      const search = query.trim().toLocaleLowerCase();
      const searchOk = !search || `${entry.nameSr} ${entry.nameEn} ${isSr ? entry.descriptionSr : entry.descriptionEn} ${entry.slug}`.toLocaleLowerCase().includes(search);
      return animalOk && heatOk && classOk && seasonOk && searchOk;
    }),
    [entries, animal, heating, selectedClasses, season, query, isSr]
  );

  const selected = useMemo(
    () => compareSlugs.map((slug) => entries.find((entry) => entry.slug === slug)).filter((entry): entry is CatalogEntry => Boolean(entry)),
    [compareSlugs, entries]
  );

  const update = (patch: Partial<CatalogUrlState>) => setCatalogState((current) => ({...current, ...patch}));

  function toggleCompare(slug: string) {
    setCatalogState((current) => {
      if (current.compareSlugs.includes(slug)) {
        return {...current, compareSlugs: current.compareSlugs.filter((value) => value !== slug)};
      }
      return {...current, compareSlugs: [...current.compareSlugs, slug].slice(-3)};
    });
  }

  function toggleClass(value: DesignClass) {
    update({designClasses: selectedClasses.includes(value) ? selectedClasses.filter((item) => item !== value) : [...selectedClasses, value]});
  }

  const name = (entry: CatalogEntry) => (isSr ? entry.nameSr : entry.nameEn);
  const rows: Array<[string, (entry: CatalogEntry) => string]> = [
    [isSr ? "Klasa konstrukcije" : "Design class", (entry) => taxonomyLabel("designClass", entry.designClass, locale)],
    [isSr ? "Klasa / kapacitet" : "Class / capacity", (entry) => entry.animal === "dog" ? animalSizeClassLabel(entry.animalSizeClass, locale) : `${entry.capacity.recommended} / ${isSr ? "maks." : "max"} ${entry.capacity.max}`],
    [isSr ? "Spoljašnje mere" : "External size", (entry) => `${entry.footprint.widthMm} × ${entry.footprint.depthMm} × ${entry.footprint.heightMm} mm`],
    [isSr ? "Sezona" : "Season", (entry) => entry.seasons.map((item) => taxonomyLabel("season", item, locale)).join(", ")],
    [isSr ? "Izolacija" : "Insulation", (entry) => insulationLabel(entry, locale)],
    [isSr ? "Grejanje" : "Heating", (entry) => entry.heated ? (isSr ? "Predviđeno" : "Ready") : (isSr ? "Pasivno" : "Passive")],
    [isSr ? "Težina izrade" : "Build difficulty", (entry) => taxonomyLabel("difficulty", entry.difficulty, locale)],
    [isSr ? "Alat" : "Tools", (entry) => toolsLabel(entry, locale)],
    [isSr ? "Vreme izrade (procena)" : "Build time (estimate)", (entry) => formatBuildTime(entry.buildTimeMinutes)],
    [isSr ? "Proračuni" : "Calculations", (entry) => entry.coverage.map((item) => taxonomyLabel("coverage", item, locale)).join(", ")],
    [isSr ? "Termička procena" : "Thermal estimate", (entry) => ({
      COMPLETE: isSr ? "Potpuna" : "Complete",
      INCOMPLETE: isSr ? "Delimična (nepoznati slojevi)" : "Partial (unknown layers)",
      UNAVAILABLE: isSr ? "Nije dostupna" : "Unavailable",
      NOT_APPLICABLE: isSr ? "Ne primenjuje se" : "Not applicable"
    })[entry.thermalStatus]],
    [isSr ? "Validacija" : "Validation", (entry) => validationStageLabel(entry.validationState, locale)]
  ];

  return (
    <>
      <div className="filter-bar" aria-label={isSr ? "Filteri modela" : "Model filters"}>
        <label className="catalog-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={query} onChange={(event) => update({query: event.target.value.slice(0, 100)})}
            placeholder={isSr ? "Pretražite modele" : "Search models"}
            aria-label={isSr ? "Pretražite modele" : "Search models"} />
        </label>
        <div className="segmented">
          {(["all", "cat", "dog"] as const).map((value) => (
            <button type="button" key={value} className={animal === value ? "active" : ""} aria-pressed={animal === value} onClick={() => update({animal: value})}>
              {value === "all" ? (isSr ? "Sve" : "All") : value === "cat" ? (isSr ? "Mačke" : "Cats") : (isSr ? "Psi" : "Dogs")}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(["all", "passive", "heated"] as const).map((value) => (
            <button type="button" key={value} className={heating === value ? "active" : ""} aria-pressed={heating === value} onClick={() => update({heating: value})}>
              {value === "all" ? (isSr ? "Svi tipovi" : "All heating") : value === "heated" ? (isSr ? "Grejani" : "Heated") : (isSr ? "Pasivni" : "Passive")}
            </button>
          ))}
        </div>
        <label className="season-select">
          <span>{isSr ? "Sezona" : "Season"}</span>
          <select value={season} onChange={(event) => update({season: event.target.value as Season | "all"})}>
            {seasons.map((value) => (
              <option key={value} value={value}>{value === "all" ? (isSr ? "Sve sezone" : "All seasons") : taxonomyLabel("season", value, locale)}</option>
            ))}
          </select>
        </label>
        <span className="result-count" role="status">{visible.length} {isSr ? "modela" : "models"}</span>
      </div>

      <div className="class-filter" role="group" aria-label={isSr ? "Klasa konstrukcije" : "Design class"}>
        {designClasses.map((value) => (
          <button
            key={value}
            type="button"
            className={`class-chip class-${value.toLowerCase()}${selectedClasses.includes(value) ? " active" : ""}`}
            aria-pressed={selectedClasses.includes(value)}
            onClick={() => toggleClass(value)}
            title={taxonomyLabel("designClassHint", value, locale)}
          >
            {taxonomyLabel("designClass", value, locale)}
          </button>
        ))}
        <small>{isSr ? "Klasa opisuje vrstu konstrukcije, ne nivo provere." : "The class describes the kind of construction, not how far it is verified."}</small>
      </div>

      {selected.length >= 2 && (
        <section className="compare-panel" id="compare" aria-labelledby="compare-title" tabIndex={-1}>
          <header>
            <div>
              <span className="kicker">{isSr ? "Uporedni prikaz" : "Side by side"}</span>
              <h2 id="compare-title">{isSr ? "Poređenje modela" : "Model comparison"}</h2>
            </div>
            <button type="button" onClick={() => update({compareSlugs: []})}>
              {isSr ? "Očisti" : "Clear"}
            </button>
          </header>
          <div className="compare-scroll">
            <table>
              <thead>
                <tr>
                  <th>{isSr ? "Osobina" : "Property"}</th>
                  {selected.map((entry) => (
                    <th key={entry.id} scope="col">
                      <Link href={{pathname: "/models/[slug]", params: {slug: entry.slug}}}>{name(entry)}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    {selected.map((entry) => <td key={entry.id}>{value(entry)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="model-grid">
        {visible.map((entry) => {
          const selectedForCompare = compareSlugs.includes(entry.slug);
          return (
            <div className="catalog-model" key={entry.id}>
              <CatalogCard entry={entry} locale={locale} engineered={engineeredThumbnails[entry.slug]} />
              <button
                type="button"
                className={selectedForCompare ? "compare-toggle active" : "compare-toggle"}
                aria-pressed={selectedForCompare}
                onClick={() => toggleCompare(entry.slug)}
              >
                <span aria-hidden="true">{selectedForCompare ? "✓" : "+"}</span>
                {selectedForCompare ? (isSr ? "U poređenju" : "Comparing") : (isSr ? "Uporedi" : "Compare")}
              </button>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="catalog-empty">
          <strong>{isSr ? "Nema modela za ove filtere." : "No models match these filters."}</strong>
          <button type="button" onClick={() => setCatalogState(defaultCatalogUrlState)}>
            {isSr ? "Prikaži sve modele" : "Show all models"}
          </button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="compare-tray" role="region" aria-label={isSr ? "Izbor za poređenje" : "Comparison selection"}>
          <ul>
            {selected.map((entry) => (
              <li key={entry.id}>
                <span>{name(entry)}</span>
                <button
                  type="button"
                  onClick={() => toggleCompare(entry.slug)}
                  aria-label={isSr ? `Ukloni ${name(entry)} iz izbora` : `Remove ${name(entry)} from selection`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {selected.length >= 2 ? (
            <button
              type="button"
              className="compare-tray-go"
              onClick={() => {
                const panel = document.getElementById("compare");
                panel?.scrollIntoView({block: "start"});
                panel?.focus({preventScroll: true});
              }}
            >
              {isSr ? "Prikaži tabelu" : "View table"} <span aria-hidden="true">↑</span>
            </button>
          ) : (
            <small>{isSr ? "Izaberite još jedan model (do 3)." : "Select one more model (up to 3)."}</small>
          )}
        </div>
      )}
    </>
  );
}
