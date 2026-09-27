"use client";

import {useMemo, useState} from "react";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {ModelCard} from "./model-card";

export function ModelCatalog({models, locale}: {models: ShelterModel[]; locale: AppLocale}) {
  const [animal, setAnimal] = useState<"all" | "cat" | "dog">("all");
  const [heating, setHeating] = useState<"all" | "heated" | "passive">("all");

  const visible = useMemo(
    () => models.filter((model) => {
      const animalOk = animal === "all" || model.animal === animal;
      const heatOk = heating === "all" || (heating === "heated" ? model.heated : !model.heated);
      return animalOk && heatOk;
    }),
    [models, animal, heating]
  );

  return (
    <>
      <div className="filter-bar" aria-label={locale === "sr" ? "Filteri modela" : "Model filters"}>
        <div className="segmented">
          {(["all", "cat", "dog"] as const).map((value) => (
            <button key={value} className={animal === value ? "active" : ""} onClick={() => setAnimal(value)}>
              {value === "all" ? (locale === "sr" ? "Sve" : "All") : value === "cat" ? (locale === "sr" ? "Mačke" : "Cats") : (locale === "sr" ? "Psi" : "Dogs")}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(["all", "passive", "heated"] as const).map((value) => (
            <button key={value} className={heating === value ? "active" : ""} onClick={() => setHeating(value)}>
              {value === "all" ? (locale === "sr" ? "Sva grejanja" : "All heating") : value === "heated" ? (locale === "sr" ? "Grejane" : "Heated") : (locale === "sr" ? "Bez grejanja" : "Passive")}
            </button>
          ))}
        </div>
        <span className="result-count">{visible.length} {locale === "sr" ? "modela" : "models"}</span>
      </div>
      <div className="model-grid">
        {visible.map((model) => <ModelCard key={model.id} model={model} locale={locale} />)}
      </div>
    </>
  );
}
