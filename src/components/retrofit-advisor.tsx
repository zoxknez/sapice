"use client";

import {useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {retrofitInsulationSheets, retrofitPlan, type RetrofitInput} from "@/lib/retrofit";
import type {MaterialOption} from "@/lib/catalog/page-data";

const initial: RetrofitInput = {
  animal: "dog",
  dogSize: "medium",
  season: "WINTER",
  widthMm: null,
  depthMm: null,
  heightMm: null,
  wallMaterial: "WOOD",
  wallThicknessMm: null,
  floor: "WOOD_ON_GROUND",
  roof: "UNKNOWN",
  leaks: false,
  onGround: true,
  entrances: 1,
  entranceWidthMm: null,
  insulated: false,
  insulationExposed: false,
  ventilated: false,
  woodCondition: "GOOD",
  location: "EXPOSED",
  removableRoof: false
};

export function RetrofitAdvisor({locale, materials}: {locale: AppLocale; materials: MaterialOption[]}) {
  const isSr = locale === "sr";
  const [input, setInput] = useState<RetrofitInput>(initial);
  const plan = useMemo(() => retrofitPlan(input), [input]);
  const sheets = useMemo(() => retrofitInsulationSheets(input), [input]);
  const nameOf = (id: string) => {
    const material = materials.find((item) => item.id === id);
    return material ? (isSr ? material.nameSr : material.nameEn) : id;
  };
  const set = <K extends keyof RetrofitInput>(key: K, value: RetrofitInput[K]) => setInput((current) => ({...current, [key]: value}));
  const num = (value: string) => (value === "" ? null : Math.max(0, Math.round(Number(value)) || 0));

  const select = <K extends keyof RetrofitInput>(key: K, label: string, options: Array<[RetrofitInput[K], string]>) => (
    <label>
      <span>{label}</span>
      <select value={String(input[key])} onChange={(event) => set(key, options.find(([value]) => String(value) === event.target.value)![0])}>
        {options.map(([value, text]) => <option key={String(value)} value={String(value)}>{text}</option>)}
      </select>
    </label>
  );
  const yesNo = (key: "leaks" | "onGround" | "insulated" | "insulationExposed" | "ventilated" | "removableRoof", label: string) => (
    <label className="check-line compact">
      <input type="checkbox" checked={input[key]} onChange={(event) => set(key, event.target.checked)} />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="retrofit-layout">
      <form className="retrofit-form" onSubmit={(event) => event.preventDefault()} aria-label={isSr ? "Opis postojeće kućice" : "Existing house description"}>
        <fieldset>
          <legend>{isSr ? "Životinja i sezona" : "Animal and season"}</legend>
          {select("animal", isSr ? "Životinja" : "Animal", [["dog", isSr ? "Pas" : "Dog"], ["cat", isSr ? "Mačka" : "Cat"]])}
          {input.animal === "dog" && select("dogSize", isSr ? "Veličina psa" : "Dog size", [["small", isSr ? "Mali" : "Small"], ["medium", isSr ? "Srednji" : "Medium"], ["large", isSr ? "Veliki" : "Large"]])}
          {select("season", isSr ? "Za koju sezonu" : "Which season", [["WINTER", isSr ? "Zima" : "Winter"], ["SUMMER", isSr ? "Leto" : "Summer"], ["ALL", isSr ? "Cele godine" : "All year"]])}
          {select("location", isSr ? "Lokacija" : "Location", [["EXPOSED", isSr ? "Napolju, izloženo" : "Outside, exposed"], ["SHELTERED", isSr ? "Uz zid ili ogradu" : "Against a wall or fence"], ["COVERED", isSr ? "Pod krovom" : "Under a roof"]])}
        </fieldset>
        <fieldset>
          <legend>{isSr ? "Mere (ako ih znate)" : "Size (if known)"}</legend>
          <div className="retrofit-dims">
            <label><span>{isSr ? "Širina (mm)" : "Width (mm)"}</span><input type="number" min={0} inputMode="numeric" value={input.widthMm ?? ""} onChange={(event) => set("widthMm", num(event.target.value))} /></label>
            <label><span>{isSr ? "Dubina (mm)" : "Depth (mm)"}</span><input type="number" min={0} inputMode="numeric" value={input.depthMm ?? ""} onChange={(event) => set("depthMm", num(event.target.value))} /></label>
            <label><span>{isSr ? "Visina (mm)" : "Height (mm)"}</span><input type="number" min={0} inputMode="numeric" value={input.heightMm ?? ""} onChange={(event) => set("heightMm", num(event.target.value))} /></label>
            <label><span>{isSr ? "Debljina zida (mm)" : "Wall thickness (mm)"}</span><input type="number" min={0} inputMode="numeric" value={input.wallThicknessMm ?? ""} onChange={(event) => set("wallThicknessMm", num(event.target.value))} /></label>
            <label><span>{isSr ? "Širina ulaza (mm)" : "Entrance width (mm)"}</span><input type="number" min={0} inputMode="numeric" value={input.entranceWidthMm ?? ""} onChange={(event) => set("entranceWidthMm", num(event.target.value))} /></label>
            <label><span>{isSr ? "Broj ulaza" : "Entrances"}</span><input type="number" min={1} max={4} value={input.entrances} onChange={(event) => set("entrances", Math.min(4, Math.max(1, Number(event.target.value) || 1)))} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>{isSr ? "Konstrukcija i stanje" : "Construction and condition"}</legend>
          {select("wallMaterial", isSr ? "Materijal zida" : "Wall material", [["WOOD", isSr ? "Daske ili drvo" : "Boards or timber"], ["OSB", "OSB"], ["PLASTIC", isSr ? "Plastika" : "Plastic"], ["METAL", isSr ? "Lim" : "Metal"], ["UNKNOWN", isSr ? "Ne znam" : "Unknown"]])}
          {select("floor", isSr ? "Pod" : "Floor", [["WOOD_RAISED", isSr ? "Drveni, podignut" : "Wooden, raised"], ["WOOD_ON_GROUND", isSr ? "Drveni, na zemlji" : "Wooden, on the ground"], ["NONE", isSr ? "Nema poda" : "No floor"], ["CONCRETE", isSr ? "Beton" : "Concrete"], ["PLASTIC", isSr ? "Plastika" : "Plastic"]])}
          {select("roof", isSr ? "Krov" : "Roof", [["SLOPED_AWAY", isSr ? "Kos, voda ide od ulaza" : "Sloped, water runs away from the entrance"], ["SLOPED_TO_ENTRANCE", isSr ? "Kos, voda ide ka ulazu" : "Sloped toward the entrance"], ["FLAT", isSr ? "Ravan" : "Flat"], ["UNKNOWN", isSr ? "Ne znam" : "Unknown"]])}
          {select("woodCondition", isSr ? "Stanje drveta" : "Wood condition", [["GOOD", isSr ? "Dobro" : "Good"], ["WEATHERED", isSr ? "Isprano, ispucalo" : "Weathered, cracked"], ["ROTTEN", isSr ? "Trulo" : "Rotten"], ["NOT_WOOD", isSr ? "Nije drvo" : "Not wood"]])}
          {yesNo("leaks", isSr ? "Prokišnjava" : "It leaks")}
          {yesNo("onGround", isSr ? "Stoji direktno na zemlji" : "Stands directly on the ground")}
          {yesNo("insulated", isSr ? "Ima izolaciju" : "Has insulation")}
          {input.insulated && yesNo("insulationExposed", isSr ? "Izolacija je dostupna životinji" : "Insulation is reachable by the animal")}
          {yesNo("ventilated", isSr ? "Ima ventilacioni otvor" : "Has a ventilation opening")}
          {yesNo("removableRoof", isSr ? "Krov se može otvoriti ili skinuti" : "The roof can be opened or removed")}
        </fieldset>
      </form>

      <section className="retrofit-result" aria-live="polite">
        <span className="kicker">{isSr ? "Redosled radova" : "Order of work"}</span>
        <h2>{isSr ? "Šta uraditi i kojim redom" : "What to do and in which order"}</h2>
        <ol className="priority-list">
          {plan.priorities.map((item) => (
            <li key={item.id} className={`priority-${item.severity.toLowerCase()}`}>
              <span className="priority-rank">{isSr ? "PRIORITET" : "PRIORITY"} {item.rank}</span>
              <strong>{isSr ? item.titleSr : item.titleEn}</strong>
              <p>{isSr ? item.whySr : item.whyEn}</p>
              {item.materialIds.length > 0 && <small>{isSr ? "Materijal: " : "Materials: "}{item.materialIds.map(nameOf).join(", ")}</small>}
            </li>
          ))}
        </ol>
        {sheets && input.season !== "SUMMER" && (
          <p className="retrofit-estimate">
            {isSr
              ? `Planska procena za unutrašnju izolaciju: oko ${sheets.areaM2} m² površine, odnosno ${sheets.sheets} XPS ploča 1250 × 600 mm sa 15% rezerve.`
              : `Planning estimate for interior insulation: about ${sheets.areaM2} m² of surface, or ${sheets.sheets} XPS boards of 1250 × 600 mm with a 15% allowance.`}
          </p>
        )}
        <ul className="plain-list retrofit-notes">
          {(isSr ? plan.notesSr : plan.notesEn).map((note) => <li key={note}>{note}</li>)}
        </ul>
        <p>
          <Link href={{pathname: "/models/[slug]", params: {slug: "retrofit-existing-dog-house"}}} className="text-link">
            {isSr ? "Primer kompleta za unapređenje sa krojnom listom" : "Example retrofit kit with a cut list"} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    </div>
  );
}
