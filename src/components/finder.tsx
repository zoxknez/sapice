"use client";

import {useMemo, useState} from "react";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {ModelCard} from "./model-card";

export function Finder({models, locale}: {models: ShelterModel[]; locale: AppLocale}) {
  const [animal, setAnimal] = useState<"cat" | "dog">("cat");
  const [count, setCount] = useState(2);
  const [heated, setHeated] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1400);

  const matches = useMemo(() => models.filter((model) =>
    model.animal === animal &&
    model.capacity.max >= count &&
    (!heated || model.heated) &&
    model.dimensions.widthMm <= maxWidth
  ), [models, animal, count, heated, maxWidth]);

  return (
    <div className="finder-layout">
      <section className="finder-panel">
        <label>
          <span>{locale === "sr" ? "Životinja" : "Animal"}</span>
          <select value={animal} onChange={(event) => setAnimal(event.target.value as "cat" | "dog")}>
            <option value="cat">{locale === "sr" ? "Mačka" : "Cat"}</option>
            <option value="dog">{locale === "sr" ? "Pas" : "Dog"}</option>
          </select>
        </label>
        <label>
          <span>{locale === "sr" ? "Broj životinja" : "Number of animals"}</span>
          <input type="number" min={1} max={8} value={count} onChange={(event) => setCount(Number(event.target.value))} />
        </label>
        <label>
          <span>{locale === "sr" ? "Maksimalna širina" : "Maximum width"}: {maxWidth} mm</span>
          <input type="range" min={600} max={1800} step={50} value={maxWidth} onChange={(event) => setMaxWidth(Number(event.target.value))} />
        </label>
        <label className="check-row">
          <input type="checkbox" checked={heated} onChange={(event) => setHeated(event.target.checked)} />
          <span>{locale === "sr" ? "Tražim model sa predviđenim grejanjem" : "I need a heating-ready model"}</span>
        </label>
        <div className="finder-note">
          {locale === "sr"
            ? "Rezultati koriste tvrda ograničenja. Model se ne prikazuje ako nema dovoljan kapacitet ili ne staje u zadatu širinu."
            : "Results use hard constraints. A model is excluded if it lacks capacity or exceeds the available width."}
        </div>
      </section>
      <section>
        <p className="result-summary">{matches.length} {locale === "sr" ? "kompatibilnih modela" : "compatible models"}</p>
        <div className="model-grid compact">
          {matches.map((model) => <ModelCard key={model.id} model={model} locale={locale} />)}
        </div>
      </section>
    </div>
  );
}
