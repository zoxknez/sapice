"use client";

import {useEffect, useMemo, useState} from "react";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";
import {ModelCard} from "./model-card";
import {
  matchShelterModels,
  type ClimateNeed,
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
            ? `Veličina psa: ${model.animalSizeClass}`
            : `Dog size class: ${model.animalSizeClass}`)
        : (isSr
            ? `Kapacitet: do ${model.capacity.max} mačaka`
            : `Capacity: up to ${model.capacity.max} cats`),
      isSr
        ? `Staje u ${maxWidth} × ${maxDepth} mm prostor`
        : `Fits within ${maxWidth} × ${maxDepth} mm`,
      isSr
        ? `Profil: ${model.climateProfile.replaceAll("_", " ")}`
        : `Profile: ${model.climateProfile.replaceAll("_", " ")}`
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
          <label>
            <span>{isSr ? "Broj mačaka" : "Number of cats"}</span>
            <input
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(event) => updateCriteria("count", Math.min(12, Math.max(1, Math.round(Number(event.target.value) || 1))))}
            />
          </label>
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
            min={600}
            max={2400}
            step={50}
            value={maxWidth}
            onChange={(event) => updateCriteria("maxWidthMm", Number(event.target.value))}
          />
        </label>

        <label>
          <span>{isSr ? "Maksimalna dubina" : "Maximum depth"}: {maxDepth} mm</span>
          <input
            type="range"
            min={500}
            max={1800}
            step={50}
            value={maxDepth}
            onChange={(event) => updateCriteria("maxDepthMm", Number(event.target.value))}
          />
        </label>

        <div className="finder-note">
          {isSr
            ? "Model se prikazuje samo kada prolazi sva tvrda ograničenja. Zimski profil je projektantski filter, a ne sertifikovana temperaturna garancija."
            : "A model is shown only when it passes every hard constraint. The winter profile is a design filter, not a certified temperature guarantee."}
        </div>
      </section>

      <section>
        <div className="finder-results-head">
          <p className="result-summary">
            <strong>{matches.length}</strong> {isSr ? "kompatibilnih modela" : "compatible models"}
          </p>
          <small>
            {isSr
              ? "Najpre se prikazuje najmanji dovoljan kapacitet, zatim kompaktniji footprint."
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
            <span className="kicker">0 matches</span>
            <h2>{isSr ? "Trenutno nema modela koji prolazi sve uslove." : "No current model passes every constraint."}</h2>
            <p>
              {isSr
                ? "Promenite prostor, zimski profil ili zahtev za grejanjem. Finder neće predložiti model koji ne ispunjava tvrda ograničenja."
                : "Adjust available space, winter profile or heating requirement. The finder will not suggest a model that fails hard constraints."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
