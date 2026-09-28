"use client";

import {useEffect, useMemo, useState} from "react";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {ModelCard} from "./model-card";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";
import {
  defaultCatalogUrlState,
  parseCatalogUrlState,
  replaceBrowserSearchParams,
  serializeCatalogUrlState,
  type CatalogUrlState
} from "@/lib/view-url-state";

export function ModelCatalog({
  models,
  comparisonSummaries,
  locale,
  initialState = defaultCatalogUrlState
}: {
  models: ShelterModel[];
  comparisonSummaries: Record<string, ModelComparisonSummary>;
  locale: AppLocale;
  initialState?: CatalogUrlState;
}) {
  const isSr = locale === "sr";
  const [catalogState, setCatalogState] = useState<CatalogUrlState>(initialState);
  const {animal, heating, query, compareSlugs} = catalogState;
  const validSlugs = useMemo(() => models.map((model) => model.slug), [models]);

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
    () => models.filter((model) => {
      const animalOk = animal === "all" || model.animal === animal;
      const heatOk = heating === "all" || (heating === "heated" ? model.heated : !model.heated);
      const search = query.trim().toLocaleLowerCase();
      const searchOk = !search || `${model.translations[locale].name} ${model.translations[locale].description} ${model.slug}`.toLocaleLowerCase().includes(search);
      return animalOk && heatOk && searchOk;
    }),
    [models, animal, heating, query, locale]
  );

  const selected = useMemo(
    () => compareSlugs.map((slug) => models.find((model) => model.slug === slug)).filter((model): model is ShelterModel => Boolean(model)),
    [compareSlugs, models]
  );

  function summaryFor(model: ShelterModel) {
    const summary = comparisonSummaries[model.id];
    if (!summary) {
      throw new Error(`Missing comparison summary for ${model.id}`);
    }
    return summary;
  }

  function toggleCompare(slug: string) {
    setCatalogState((current) => {
      if (current.compareSlugs.includes(slug)) {
        return {...current, compareSlugs: current.compareSlugs.filter((value) => value !== slug)};
      }
      return {
        ...current,
        compareSlugs: [...current.compareSlugs, slug].slice(-3)
      };
    });
  }

  return (
    <>
      <div className="filter-bar" aria-label={isSr ? "Filteri modela" : "Model filters"}>
        <label className="catalog-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={query} onChange={(event) => setCatalogState((current) => ({...current, query: event.target.value.slice(0, 100)}))}
            placeholder={isSr ? "Pretražite modele" : "Search models"}
            aria-label={isSr ? "Pretražite modele" : "Search models"} />
        </label>
        <div className="segmented">
          {(["all", "cat", "dog"] as const).map((value) => (
            <button type="button" key={value} className={animal === value ? "active" : ""} aria-pressed={animal === value} onClick={() => setCatalogState((current) => ({...current, animal: value}))}>
              {value === "all" ? (isSr ? "Sve" : "All") : value === "cat" ? (isSr ? "Mačke" : "Cats") : (isSr ? "Psi" : "Dogs")}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(["all", "passive", "heated"] as const).map((value) => (
            <button type="button" key={value} className={heating === value ? "active" : ""} aria-pressed={heating === value} onClick={() => setCatalogState((current) => ({...current, heating: value}))}>
              {value === "all" ? (isSr ? "Sva grejanja" : "All heating") : value === "heated" ? (isSr ? "Grejane" : "Heated") : (isSr ? "Bez grejanja" : "Passive")}
            </button>
          ))}
        </div>
        <span className="result-count">{visible.length} {isSr ? "modela" : "models"}</span>
      </div>

      {selected.length >= 2 && (
        <section className="compare-panel" aria-labelledby="compare-title">
          <header>
            <div>
              <span className="kicker">Side by side</span>
              <h2 id="compare-title">{isSr ? "Poređenje modela" : "Model comparison"}</h2>
            </div>
            <button type="button" onClick={() => setCatalogState((current) => ({...current, compareSlugs: []}))}>
              {isSr ? "Očisti" : "Clear"}
            </button>
          </header>

          <div className="compare-scroll">
            <table>
              <thead>
                <tr>
                  <th>{isSr ? "Osobina" : "Property"}</th>
                  {selected.map((model) => <th key={model.id}>{model.translations[locale].name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{isSr ? "Klasa / kapacitet" : "Class / capacity"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>
                      {model.animal === "dog"
                        ? model.animalSizeClass
                        : `${model.capacity.recommended} / max ${model.capacity.max}`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Veličina životinje" : "Animal size"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>
                      {model.animal === "cat"
                        ? (isSr ? "standardna odrasla mačka" : "standard adult cat")
                        : model.animalSizeClass}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Spoljašnje mere" : "External size"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{model.dimensions.widthMm} × {model.dimensions.depthMm} × {model.dimensions.frontHeightMm} mm</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Korisna podna površina" : "Usable floor area"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{summaryFor(model).usableFloorAreaM2.toFixed(2)} m²</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Čista širina komore" : "Clear chamber width"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{summaryFor(model).chamberClearWidthMm.toFixed(0)} mm</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Površina po preporučenoj životinji" : "Area per recommended animal"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{summaryFor(model).floorAreaPerRecommendedAnimalM2.toFixed(2)} m²</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Izolacija zida" : "Wall insulation"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{summaryFor(model).wallInsulationMm} mm</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Komore / ulazi" : "Chambers / entrances"}</th>
                  {selected.map((model) => <td key={model.id}>{model.layout.chambers} / {model.layout.entrances}</td>)}
                </tr>
                <tr>
                  <th>{isSr ? "Grejanje" : "Heating"}</th>
                  {selected.map((model) => <td key={model.id}>{model.heated ? (isSr ? "Predviđeno" : "Ready") : (isSr ? "Pasivno" : "Passive")}</td>)}
                </tr>
                <tr>
                  <th>Wall U</th>
                  {selected.map((model) => <td key={model.id}>{summaryFor(model).wallU.toFixed(2)} W/m²K</td>)}
                </tr>
                <tr>
                  <th>{isSr ? "Validacija" : "Validation"}</th>
                  {selected.map((model) => <td key={model.id}>{model.validationState.replaceAll("_", " ")}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="model-grid">
        {visible.map((model) => {
          const selectedForCompare = compareSlugs.includes(model.slug);
          return (
            <div className="catalog-model" key={model.id}>
              <ModelCard model={model} locale={locale} summary={summaryFor(model)} />
              <button
                type="button"
                className={selectedForCompare ? "compare-toggle active" : "compare-toggle"}
                aria-pressed={selectedForCompare}
                onClick={() => toggleCompare(model.slug)}
              >
                <span aria-hidden="true">{selectedForCompare ? "✓" : "+"}</span>
                {selectedForCompare
                  ? (isSr ? "U poređenju" : "Comparing")
                  : (isSr ? "Uporedi" : "Compare")}
              </button>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="catalog-empty">
          <strong>{isSr ? "Nema modela za ove filtere." : "No models match these filters."}</strong>
          <button type="button" onClick={() => setCatalogState((current) => ({...current, query: "", animal: "all", heating: "all"}))}>
            {isSr ? "Prikaži sve modele" : "Show all models"}
          </button>
        </div>
      )}

      {selected.length === 1 && (
        <div className="compare-hint">
          {isSr ? "Izaberite još jedan model za poređenje." : "Select one more model to compare."}
        </div>
      )}
    </>
  );
}
