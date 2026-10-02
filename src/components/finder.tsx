"use client";

import {useEffect, useMemo, useState} from "react";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";
import {animalSizeClassLabel, climateProfileLabel} from "@/lib/model-labels";
import {ModelCard} from "./model-card";
import {
  finderCatCountLimits,
  finderSpaceLimits,
  matchShelterModels,
  suggestFinderRelaxations,
  type ClimateNeed,
  type FinderRelaxation,
  type HeatingNeed,
  type DogSizeNeed
} from "@/lib/finder";
import {
  defaultFinderUrlState,
  parseFinderUrlState,
  replaceBrowserSearchParams,
  serializeFinderUrlState,
  type FinderUrlState
} from "@/lib/view-url-state";

export function Finder({
  models,
  comparisonSummaries,
  locale,
  initialState = defaultFinderUrlState
}: {
  models: ShelterModel[];
  comparisonSummaries: Record<string, ModelComparisonSummary>;
  locale: AppLocale;
  initialState?: FinderUrlState;
}) {
  const isSr = locale === "sr";
  const [criteria, setCriteria] = useState<FinderUrlState>(initialState);
  const {animal, count, dogSize, heating, climate, maxWidthMm: maxWidth, maxDepthMm: maxDepth} = criteria;

  useEffect(() => {
    const syncFromLocation = () => {
      setCriteria(parseFinderUrlState(new URLSearchParams(window.location.search)));
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  useEffect(() => {
    replaceBrowserSearchParams(serializeFinderUrlState(new URLSearchParams(window.location.search), criteria));
  }, [criteria]);

  function updateCriteria<K extends keyof FinderUrlState>(key: K, value: FinderUrlState[K]) {
    setCriteria((current) => ({...current, [key]: value}));
  }

  const matches = useMemo(
    () => matchShelterModels(models, criteria),
    [models, criteria]
  );
  const relaxations = useMemo(
    () => (matches.length === 0 ? suggestFinderRelaxations(models, criteria) : []),
    [matches.length, models, criteria]
  );
  const isDefault = (Object.keys(defaultFinderUrlState) as (keyof FinderUrlState)[])
    .every((key) => criteria[key] === defaultFinderUrlState[key]);

  function setCount(next: number) {
    updateCriteria(
      "count",
      Math.min(finderCatCountLimits.max, Math.max(finderCatCountLimits.min, Math.round(next) || finderCatCountLimits.min))
    );
  }

  function climateLabel(value: ClimateNeed) {
    if (value === "moderate") return isSr ? "Umerena zima" : "Moderate winter";
    if (value === "cold") return isSr ? "Hladna zima" : "Cold winter";
    return isSr ? "Vrlo hladni projektni uslovi" : "Severe design conditions";
  }

  function modelCountLabel(value: number) {
    if (!isSr) return value === 1 ? "1 model" : `${value} models`;
    return `${value} ${value % 10 === 1 && value % 100 !== 11 ? "model" : "modela"}`;
  }

  function relaxationCopy(relaxation: FinderRelaxation) {
    switch (relaxation.kind) {
      case "space":
        return {
          title: isSr
            ? `Proširite prostor na ${relaxation.criteria.maxWidthMm} × ${relaxation.criteria.maxDepthMm} mm`
            : `Allow ${relaxation.criteria.maxWidthMm} × ${relaxation.criteria.maxDepthMm} mm of space`,
          detail: isSr
            ? "Najmanji model koji ispunjava ostale uslove ne staje u zadati prostor."
            : "The smallest model that meets the other constraints does not fit the current space."
        };
      case "capacity":
        return {
          title: isSr
            ? `Prikaži modele za ${relaxation.largestCapacity} mačaka`
            : `Show models for ${relaxation.largestCapacity} cats`,
          detail: isSr
            ? `Najveći objavljeni kapacitet je ${relaxation.largestCapacity} mačaka. Za veću koloniju planirajte više kućica.`
            : `The largest published capacity is ${relaxation.largestCapacity} cats. Plan several shelters for a larger colony.`
        };
      case "heating":
        return {
          title: isSr ? "Uključi i modele predviđene za grejanje" : "Include heating-ready models",
          detail: isSr
            ? "Za izabrane uslove postoje samo modeli sa predviđenim namenskim grejanjem."
            : "For the selected conditions, only models designed for purpose-built heating are available."
        };
      case "climate":
        return {
          title: isSr
            ? `Prikaži modele za profil „${climateLabel(relaxation.criteria.climate)}”`
            : `Show models for “${climateLabel(relaxation.criteria.climate)}”`,
          detail: isSr
            ? "Niži zimski profil je projektantski filter za blaže uslove, ne preporuka za vaše podneblje."
            : "A lower winter profile is a design filter for milder conditions, not a recommendation for your climate."
        };
    }
  }

  function summaryFor(model: ShelterModel) {
    const summary = comparisonSummaries[model.id];
    if (!summary) {
      throw new Error(`Missing finder card summary for ${model.id}`);
    }
    return summary;
  }

  function reasons(model: ShelterModel) {
    const items = [
      animal === "dog"
        ? (isSr
            ? `Veličina psa: ${animalSizeClassLabel(model.animalSizeClass, locale)}`
            : `Dog size class: ${animalSizeClassLabel(model.animalSizeClass, locale)}`)
        : (isSr
            ? `Kapacitet: do ${model.capacity.max} mačaka`
            : `Capacity: up to ${model.capacity.max} cats`),
      isSr
        ? `Staje u ${maxWidth} × ${maxDepth} mm prostor`
        : `Fits within ${maxWidth} × ${maxDepth} mm`,
      isSr
        ? `Profil: ${climateProfileLabel(model.climateProfile, locale)}`
        : `Profile: ${climateProfileLabel(model.climateProfile, locale)}`
    ];

    if (heating === "heated") {
      items.push(isSr ? "Predviđen je za namensko grejanje" : "Designed to accommodate purpose-built heating");
    }

    return items;
  }

  return (
    <div className="finder-layout">
      <section className="finder-panel" aria-label={isSr ? "Uslovi za izbor modela" : "Model matching constraints"}>
        <label>
          <span>{isSr ? "Životinja" : "Animal"}</span>
          <select value={animal} onChange={(event) => updateCriteria("animal", event.target.value as "cat" | "dog")}>
            <option value="cat">{isSr ? "Mačka" : "Cat"}</option>
            <option value="dog">{isSr ? "Pas" : "Dog"}</option>
          </select>
        </label>

        {animal === "cat" ? (
          <div className="finder-field">
            <label htmlFor="finder-cat-count">{isSr ? "Broj mačaka" : "Number of cats"}</label>
            <div className="stepper">
              <button
                type="button"
                onClick={() => setCount(count - 1)}
                disabled={count <= finderCatCountLimits.min}
                aria-label={isSr ? "Jedna mačka manje" : "One cat fewer"}
              >
                −
              </button>
              <input
                id="finder-cat-count"
                type="number"
                inputMode="numeric"
                min={finderCatCountLimits.min}
                max={finderCatCountLimits.max}
                value={count}
                onChange={(event) => {
                  if (event.target.value !== "") setCount(Number(event.target.value));
                }}
              />
              <button
                type="button"
                onClick={() => setCount(count + 1)}
                disabled={count >= finderCatCountLimits.max}
                aria-label={isSr ? "Jedna mačka više" : "One cat more"}
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <label>
            <span>{isSr ? "Veličina psa" : "Dog size"}</span>
            <select value={dogSize} onChange={(event) => updateCriteria("dogSize", event.target.value as DogSizeNeed)}>
              <option value="small">{isSr ? "Mali" : "Small"}</option>
              <option value="medium">{isSr ? "Srednji" : "Medium"}</option>
              <option value="large">{isSr ? "Veliki" : "Large"}</option>
            </select>
            <small className="field-help">
              {isSr
                ? "Klasa je početni filter, ne zamena za proveru stvarnih mera psa."
                : "The class is a starting filter, not a substitute for checking the dog's actual measurements."}
            </small>
          </label>
        )}

        <label>
          <span>{isSr ? "Zimski profil" : "Winter profile"}</span>
          <select value={climate} onChange={(event) => updateCriteria("climate", event.target.value as ClimateNeed)}>
            <option value="moderate">{isSr ? "Umerena zima" : "Moderate winter"}</option>
            <option value="cold">{isSr ? "Hladna zima" : "Cold winter"}</option>
            <option value="severe">{isSr ? "Vrlo hladni projektni uslovi" : "Severe design conditions"}</option>
          </select>
        </label>

        <label>
          <span>{isSr ? "Grejanje" : "Heating"}</span>
          <select value={heating} onChange={(event) => updateCriteria("heating", event.target.value as HeatingNeed)}>
            <option value="any">{isSr ? "Svejedno" : "Either"}</option>
            <option value="passive">{isSr ? "Bez aktivnog grejanja" : "No active heating"}</option>
            <option value="heated">{isSr ? "Model predviđen za grejanje" : "Heating-ready model"}</option>
          </select>
        </label>

        <label>
          <span>{isSr ? "Maksimalna širina" : "Maximum width"}: {maxWidth} mm</span>
          <input
            type="range"
            min={finderSpaceLimits.width.min}
            max={finderSpaceLimits.width.max}
            step={finderSpaceLimits.width.step}
            value={maxWidth}
            onChange={(event) => updateCriteria("maxWidthMm", Number(event.target.value))}
          />
        </label>

        <label>
          <span>{isSr ? "Maksimalna dubina" : "Maximum depth"}: {maxDepth} mm</span>
          <input
            type="range"
            min={finderSpaceLimits.depth.min}
            max={finderSpaceLimits.depth.max}
            step={finderSpaceLimits.depth.step}
            value={maxDepth}
            onChange={(event) => updateCriteria("maxDepthMm", Number(event.target.value))}
          />
        </label>

        <button
          type="button"
          className="finder-reset"
          onClick={() => setCriteria(defaultFinderUrlState)}
          disabled={isDefault}
        >
          {isSr ? "Vrati podrazumevane uslove" : "Reset to defaults"}
        </button>

        <div className="finder-note">
          {isSr
            ? "Model se prikazuje samo kada prolazi sva tvrda ograničenja. Zimski profil je projektantski filter, a ne sertifikovana temperaturna garancija."
            : "A model is shown only when it passes every hard constraint. The winter profile is a design filter, not a certified temperature guarantee."}
        </div>
      </section>

      <section>
        <div className="finder-results-head">
          <p className="result-summary" role="status" aria-live="polite">
            <strong>{matches.length}</strong> {isSr ? "kompatibilnih modela" : "compatible models"}
          </p>
          <small>
            {isSr
              ? "Najpre se prikazuje najmanji dovoljan kapacitet, zatim manja zauzeta površina."
              : "Results prioritize the smallest sufficient capacity, then the more compact footprint."}
          </small>
        </div>

        {matches.length > 0 ? (
          <div className="finder-results">
            {matches.map((model) => (
              <div className="finder-match" key={model.id}>
                <ModelCard model={model} locale={locale} summary={summaryFor(model)} />
                <div className="match-reasons">
                  <strong>{isSr ? "Zašto odgovara" : "Why it matches"}</strong>
                  <ul>
                    {reasons(model).map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="kicker">{isSr ? "Nema rezultata" : "0 matches"}</span>
            <h2>{isSr ? "Trenutno nema modela koji prolazi sve uslove." : "No current model passes every constraint."}</h2>
            <p>
              {isSr
                ? "Finder neće predložiti model koji ne ispunjava tvrda ograničenja. Svaki predlog ispod menja tačno jedan uslov — vi odlučujete da li je ta promena prihvatljiva."
                : "The finder will not suggest a model that fails a hard constraint. Each option below changes exactly one condition — you decide whether that change is acceptable."}
            </p>
            {relaxations.length > 0 ? (
              <ul className="relaxation-list">
                {relaxations.map((relaxation) => {
                  const copy = relaxationCopy(relaxation);
                  return (
                    <li key={relaxation.kind}>
                      <button type="button" onClick={() => setCriteria(relaxation.criteria)}>
                        <span>
                          <strong>{copy.title}</strong>
                          <small>{copy.detail}</small>
                        </span>
                        <em>{modelCountLabel(relaxation.matchCount)} <span aria-hidden="true">→</span></em>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <button type="button" className="button secondary" onClick={() => setCriteria(defaultFinderUrlState)}>
                {isSr ? "Vrati podrazumevane uslove" : "Reset to defaults"}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
