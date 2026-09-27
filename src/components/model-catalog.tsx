"use client";

import {useMemo, useState} from "react";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {ModelCard} from "./model-card";
import {compileShelterModel} from "@/lib/compiler";
import {assemblyInsulationMm} from "@/data/assemblies";

export function ModelCatalog({models, locale}: {models: ShelterModel[]; locale: AppLocale}) {
  const isSr = locale === "sr";
  const [animal, setAnimal] = useState<"all" | "cat" | "dog">("all");
  const [heating, setHeating] = useState<"all" | "heated" | "passive">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visible = useMemo(
    () => models.filter((model) => {
      const animalOk = animal === "all" || model.animal === animal;
      const heatOk = heating === "all" || (heating === "heated" ? model.heated : !model.heated);
      return animalOk && heatOk;
    }),
    [models, animal, heating]
  );

  const selected = useMemo(
    () => selectedIds.map((id) => models.find((model) => model.id === id)).filter((model): model is ShelterModel => Boolean(model)),
    [selectedIds, models]
  );

  function toggleCompare(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  return (
    <>
      <div className="filter-bar" aria-label={isSr ? "Filteri modela" : "Model filters"}>
        <div className="segmented">
          {(["all", "cat", "dog"] as const).map((value) => (
            <button key={value} className={animal === value ? "active" : ""} onClick={() => setAnimal(value)}>
              {value === "all" ? (isSr ? "Sve" : "All") : value === "cat" ? (isSr ? "Mačke" : "Cats") : (isSr ? "Psi" : "Dogs")}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(["all", "passive", "heated"] as const).map((value) => (
            <button key={value} className={heating === value ? "active" : ""} onClick={() => setHeating(value)}>
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
            <button type="button" onClick={() => setSelectedIds([])}>
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
                    <td key={model.id}>{compileShelterModel(model).internal.usableFloorAreaM2.toFixed(2)} m²</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Čista širina komore" : "Clear chamber width"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{compileShelterModel(model).internal.chamberClearWidthMm.toFixed(0)} mm</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Površina po preporučenoj životinji" : "Area per recommended animal"}</th>
                  {selected.map((model) => (
                    <td key={model.id}>{compileShelterModel(model).internal.floorAreaPerRecommendedAnimalM2.toFixed(2)} m²</td>
                  ))}
                </tr>
                <tr>
                  <th>{isSr ? "Izolacija zida" : "Wall insulation"}</th>
                  {selected.map((model) => {
                    const compiled = compileShelterModel(model);
                    return <td key={model.id}>{assemblyInsulationMm(compiled.assemblies.wall)} mm</td>;
                  })}
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
                  {selected.map((model) => <td key={model.id}>{compileShelterModel(model).thermal.wallU.toFixed(2)} W/m²K</td>)}
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
          const selectedForCompare = selectedIds.includes(model.id);
          return (
            <div className="catalog-model" key={model.id}>
              <ModelCard model={model} locale={locale} />
              <button
                type="button"
                className={selectedForCompare ? "compare-toggle active" : "compare-toggle"}
                aria-pressed={selectedForCompare}
                onClick={() => toggleCompare(model.id)}
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

      {selected.length === 1 && (
        <div className="compare-hint">
          {isSr ? "Izaberite još jedan model za poređenje." : "Select one more model to compare."}
        </div>
      )}
    </>
  );
}
