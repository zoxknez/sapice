"use client";

import {useEffect, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {
  matchCatalog,
  suggestRelaxations,
  type FinderV2Criteria,
  type MatchCheck,
  type MatchCompromise,
  type MatchResult
} from "@/lib/catalog/matcher";
import {budgetClassValues, designClasses, difficultyValues, taxonomyLabel, tools as toolList, type DesignClass, type Tool} from "@/lib/catalog/taxonomy-core";
import {CatalogCard, type EngineeredThumbnailData} from "@/components/catalog/catalog-card";
import {readWorkshop} from "@/components/catalog/workshop-compare";
import {ownedMaterialIds} from "@/lib/catalog/inventory";
import {
  defaultFinderUrlState,
  parseFinderUrlState,
  replaceBrowserSearchParams,
  serializeFinderUrlState
} from "@/lib/view-url-state";

const checkCopy: Record<MatchCheck, {sr: string; en: string}> = {
  ANIMAL: {sr: "Životinja i veličina", en: "Animal and size"},
  CAPACITY: {sr: "Kapacitet", en: "Capacity"},
  SEASON: {sr: "Namena za izabranu sezonu", en: "Suited to the chosen season"},
  STRUCTURE: {sr: "Vrsta konstrukcije", en: "Structure type"},
  DESIGN_CLASS: {sr: "Klasa konstrukcije", en: "Design class"},
  HEATING: {sr: "Grejanje", en: "Heating"},
  CLIMATE: {sr: "Zimski profil", en: "Winter profile"},
  BUDGET: {sr: "Budžet", en: "Budget"},
  TOOLS: {sr: "Imate potreban alat", en: "You have the tools"},
  SKILL: {sr: "Odgovara vašem iskustvu", en: "Matches your experience"},
  TIME: {sr: "Staje u vaše vreme", en: "Fits your time"},
  SPACE: {sr: "Staje u prostor", en: "Fits the space"},
  LOCATION: {sr: "Odgovara lokaciji", en: "Suits the location"},
  REUSE: {sr: "Bez iskorišćenog materijala", en: "No reused material"},
  EMERGENCY_SCOPE: {sr: "Hitna rešenja samo na zahtev", en: "Emergency solutions only on request"}
};

const compromiseCopy: Record<MatchCompromise, {sr: string; en: string}> = {
  EMERGENCY_ONLY: {sr: "Samo hitno rešenje, kratkog veka", en: "Emergency durability only"},
  NO_THERMAL_ESTIMATE: {sr: "Nema termičke procene", en: "No thermal estimate"},
  PARTIAL_THERMAL: {sr: "Termička procena je delimična", en: "Partial thermal estimate"},
  FREQUENT_INSPECTION: {sr: "Traži češću proveru vlage i stanja", en: "Requires more frequent moisture and condition checks"},
  NEEDS_COVER: {sr: "Mora stajati pod krovom", en: "Must stand under a roof"},
  NOT_FOR_SLEEPING: {sr: "Nije sklonište za spavanje", en: "Not a sleeping shelter"},
  NO_WINTER_RATING: {sr: "Nema projektni zimski profil", en: "No design winter profile"},
  REUSE_INSPECTION: {sr: "Iskorišćen materijal mora proći kontrolnu listu", en: "Reused material must pass the checklist"},
  PLANNING_TIME_ESTIMATE: {sr: "Vreme izrade je planska procena", en: "Build time is a planning estimate"}
};

const timeOptions: Array<[number | null, {sr: string; en: string}]> = [
  [null, {sr: "Bez ograničenja", en: "No limit"}],
  [60, {sr: "Do 1 sat (večeras)", en: "Up to 1 hour (tonight)"}],
  [180, {sr: "Do 3 sata", en: "Up to 3 hours"}],
  [480, {sr: "Jedan dan", en: "One day"}],
  [1440, {sr: "Vikend", en: "A weekend"}]
];

export function Finder({
  entries,
  engineeredThumbnails,
  locale,
  initialState = defaultFinderUrlState
}: {
  entries: CatalogEntry[];
  engineeredThumbnails: Record<string, EngineeredThumbnailData>;
  locale: AppLocale;
  initialState?: FinderV2Criteria;
}) {
  const isSr = locale === "sr";
  const [criteria, setCriteria] = useState<FinderV2Criteria>(initialState);
  const [useWorkshop, setUseWorkshop] = useState(false);
  const {animal, count, dogSize, heating, climate, maxWidthMm: maxWidth, maxDepthMm: maxDepth} = criteria;

  useEffect(() => {
    const syncFromLocation = () => setCriteria(parseFinderUrlState(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  useEffect(() => {
    replaceBrowserSearchParams(serializeFinderUrlState(new URLSearchParams(window.location.search), criteria));
  }, [criteria]);

  const update = <K extends keyof FinderV2Criteria>(key: K, value: FinderV2Criteria[K]) => setCriteria((current) => ({...current, [key]: value}));

  function applyWorkshop(enabled: boolean) {
    setUseWorkshop(enabled);
    if (!enabled) {
      setCriteria((current) => ({...current, ownedMaterials: [], tools: []}));
      return;
    }
    const workshop = readWorkshop();
    setCriteria((current) => ({...current, ownedMaterials: ownedMaterialIds(workshop), tools: workshop.tools}));
  }

  const matches = useMemo(() => matchCatalog(entries, criteria), [entries, criteria]);
  const relaxations = useMemo(() => (matches.length === 0 ? suggestRelaxations(entries, criteria) : []), [matches.length, entries, criteria]);
  const isDefault = JSON.stringify(criteria) === JSON.stringify(defaultFinderUrlState);

  const relaxationTitle = ({check, criteria: next}: {check: MatchCheck; criteria: FinderV2Criteria}) => ({
    CAPACITY: isSr ? "Prikaži najveći dostupni kapacitet" : "Show the largest available capacity",
    SPACE: isSr ? `Dozvoli prostor ${next.maxWidthMm} × ${next.maxDepthMm} mm` : `Allow ${next.maxWidthMm} × ${next.maxDepthMm} mm of space`,
    HEATING: isSr ? "Dozvoli i grejane i pasivne modele" : "Allow heated and passive models",
    CLIMATE: isSr ? "Ukloni zimski profil" : "Remove the winter profile",
    BUDGET: isSr ? "Ukloni ograničenje budžeta" : "Remove the budget limit",
    TOOLS: isSr ? "Ne ograničavaj alat" : "Do not limit tools",
    SKILL: isSr ? "Ne ograničavaj iskustvo" : "Do not limit experience",
    TIME: isSr ? "Ne ograničavaj vreme" : "Do not limit time",
    LOCATION: isSr ? "Mesto je natkriveno" : "The spot is covered",
    DESIGN_CLASS: isSr ? "Sve klase konstrukcije" : "All design classes",
    REUSE: isSr ? "Dozvoli iskorišćen materijal" : "Allow reused material",
    STRUCTURE: isSr ? "Prikaži i pomoćne konstrukcije" : "Include auxiliary structures",
    SEASON: isSr ? "Bilo koja sezona" : "Any season",
    ANIMAL: "",
    EMERGENCY_SCOPE: ""
  })[check];

  return (
    <div className="finder-layout">
      <section className="finder-panel" aria-label={isSr ? "Uslovi za izbor modela" : "Model matching constraints"}>
        <label>
          <span>{isSr ? "Životinja" : "Animal"}</span>
          <select value={animal} onChange={(event) => update("animal", event.target.value as "cat" | "dog")}>
            <option value="cat">{isSr ? "Mačka" : "Cat"}</option>
            <option value="dog">{isSr ? "Pas" : "Dog"}</option>
          </select>
        </label>

        {animal === "cat" ? (
          <div className="finder-field">
            <label htmlFor="finder-cat-count">{isSr ? "Broj mačaka" : "Number of cats"}</label>
            <div className="stepper">
              <button type="button" onClick={() => update("count", Math.max(1, count - 1))} disabled={count <= 1} aria-label={isSr ? "Jedna mačka manje" : "One cat fewer"}>−</button>
              <input id="finder-cat-count" type="number" inputMode="numeric" min={1} max={12} value={count}
                onChange={(event) => { if (event.target.value !== "") update("count", Math.min(12, Math.max(1, Math.round(Number(event.target.value)) || 1))); }} />
              <button type="button" onClick={() => update("count", Math.min(12, count + 1))} disabled={count >= 12} aria-label={isSr ? "Jedna mačka više" : "One cat more"}>+</button>
            </div>
          </div>
        ) : (
          <label>
            <span>{isSr ? "Veličina psa" : "Dog size"}</span>
            <select value={dogSize} onChange={(event) => update("dogSize", event.target.value as FinderV2Criteria["dogSize"])}>
              <option value="small">{isSr ? "Mali" : "Small"}</option>
              <option value="medium">{isSr ? "Srednji" : "Medium"}</option>
              <option value="large">{isSr ? "Veliki" : "Large"}</option>
            </select>
            <small className="field-help">{isSr ? "Klasa je početni filter, ne zamena za proveru stvarnih mera psa." : "The class is a starting filter, not a substitute for checking the dog's actual measurements."}</small>
          </label>
        )}

        <label>
          <span>{isSr ? "Namena / sezona" : "Purpose / season"}</span>
          <select value={criteria.season} onChange={(event) => update("season", event.target.value as FinderV2Criteria["season"])}>
            <option value="WINTER">{isSr ? "Zima" : "Winter"}</option>
            <option value="EMERGENCY">{isSr ? "Treba mi nešto odmah" : "I need something now"}</option>
            <option value="RAIN">{isSr ? "Kiša" : "Rain"}</option>
            <option value="WIND">{isSr ? "Vetar" : "Wind"}</option>
            <option value="SUMMER">{isSr ? "Leto i senka" : "Summer and shade"}</option>
            <option value="ALL_SEASON">{isSr ? "Cele godine" : "All season"}</option>
            <option value="ANY">{isSr ? "Bilo koja" : "Any"}</option>
          </select>
        </label>

        <label>
          <span>{isSr ? "Gde će stajati" : "Where it will stand"}</span>
          <select value={criteria.location} onChange={(event) => update("location", event.target.value as FinderV2Criteria["location"])}>
            <option value="EXPOSED">{isSr ? "Napolju, izloženo kiši i vetru" : "Outside, exposed to rain and wind"}</option>
            <option value="SHELTERED">{isSr ? "Napolju, uz zid ili ogradu" : "Outside, against a wall or fence"}</option>
            <option value="COVERED">{isSr ? "Pod krovom (trem, šupa)" : "Under a roof (porch, shed)"}</option>
          </select>
        </label>

        <label>
          <span>{isSr ? "Grejanje" : "Heating"}</span>
          <select value={heating} onChange={(event) => update("heating", event.target.value as FinderV2Criteria["heating"])}>
            <option value="any">{isSr ? "Svejedno" : "Either"}</option>
            <option value="passive">{isSr ? "Bez aktivnog grejanja" : "No active heating"}</option>
            <option value="heated">{isSr ? "Model predviđen za grejanje" : "Heating-ready model"}</option>
          </select>
        </label>

        <label>
          <span>{isSr ? "Zimski profil" : "Winter profile"}</span>
          <select value={climate} onChange={(event) => update("climate", event.target.value as FinderV2Criteria["climate"])}>
            <option value="any">{isSr ? "Bez profila (svi modeli)" : "No profile (all models)"}</option>
            <option value="moderate">{isSr ? "Umerena zima" : "Moderate winter"}</option>
            <option value="cold">{isSr ? "Hladna zima" : "Cold winter"}</option>
            <option value="severe">{isSr ? "Vrlo hladni projektni uslovi" : "Severe design conditions"}</option>
          </select>
          <small className="field-help">{isSr ? "Profil imaju samo inženjerski modeli; ostali nisu ocenjeni." : "Only engineered models carry a profile; others are not rated."}</small>
        </label>

        <details className="finder-more" open={criteria.designClasses.length > 0 || criteria.tools.length > 0 || criteria.budgetMax !== "ANY" || criteria.skill !== "WORKSHOP" || criteria.maxTimeMinutes !== null || undefined}>
          <summary>{isSr ? "Budžet, alat, vreme i materijal" : "Budget, tools, time and materials"}</summary>

          <fieldset className="chip-fieldset">
            <legend>{isSr ? "Klasa konstrukcije" : "Design class"}</legend>
            {designClasses.map((value: DesignClass) => (
              <label key={value} className={`class-chip class-${value.toLowerCase()}${criteria.designClasses.includes(value) ? " active" : ""}`}>
                <input type="checkbox" className="sr-only" checked={criteria.designClasses.includes(value)}
                  onChange={() => update("designClasses", criteria.designClasses.includes(value) ? criteria.designClasses.filter((item) => item !== value) : [...criteria.designClasses, value])} />
                {taxonomyLabel("designClass", value, locale)}
              </label>
            ))}
          </fieldset>

          <label>
            <span>{isSr ? "Najviša klasa troška" : "Maximum cost class"}</span>
            <select value={criteria.budgetMax} onChange={(event) => update("budgetMax", event.target.value as FinderV2Criteria["budgetMax"])}>
              <option value="ANY">{isSr ? "Bez ograničenja" : "No limit"}</option>
              {budgetClassValues.map((value) => <option key={value} value={value}>{taxonomyLabel("budgetClass", value, locale)}</option>)}
            </select>
            <small className="field-help">{isSr ? "Kvalitativna klasa; za iznos u dinarima koristite Budžet." : "A qualitative class; for an amount of money use Budget builds."}</small>
          </label>

          <fieldset className="tool-fieldset">
            <legend>{isSr ? "Alat koji imate (prazno = ne ograničava)" : "Tools you have (empty = no limit)"}</legend>
            {toolList.map((tool: Tool) => (
              <label key={tool} className="check-line compact">
                <input type="checkbox" checked={criteria.tools.includes(tool)}
                  onChange={() => update("tools", criteria.tools.includes(tool) ? criteria.tools.filter((item) => item !== tool) : [...criteria.tools, tool])} />
                <span>{taxonomyLabel("tool", tool, locale)}</span>
              </label>
            ))}
          </fieldset>

          <label>
            <span>{isSr ? "Iskustvo" : "Experience"}</span>
            <select value={criteria.skill} onChange={(event) => update("skill", event.target.value as FinderV2Criteria["skill"])}>
              {difficultyValues.map((value) => <option key={value} value={value}>{taxonomyLabel("difficulty", value, locale)}</option>)}
            </select>
          </label>

          <label>
            <span>{isSr ? "Vreme za izradu" : "Time available"}</span>
            <select value={criteria.maxTimeMinutes ?? ""} onChange={(event) => update("maxTimeMinutes", event.target.value === "" ? null : Number(event.target.value))}>
              {timeOptions.map(([value, copy]) => <option key={String(value)} value={value ?? ""}>{copy[locale]}</option>)}
            </select>
          </label>

          <label>
            <span>{isSr ? "Maksimalna širina" : "Maximum width"}: {maxWidth} mm</span>
            <input type="range" min={600} max={2400} step={50} value={maxWidth} onChange={(event) => update("maxWidthMm", Number(event.target.value))} />
          </label>
          <label>
            <span>{isSr ? "Maksimalna dubina" : "Maximum depth"}: {maxDepth} mm</span>
            <input type="range" min={500} max={1800} step={50} value={maxDepth} onChange={(event) => update("maxDepthMm", Number(event.target.value))} />
          </label>

          <div className="toggle-list">
            <label className="check-line compact"><input type="checkbox" checked={useWorkshop} onChange={(event) => applyWorkshop(event.target.checked)} /><span>{isSr ? "Koristi materijal i alat iz „Moja radionica”" : "Use materials and tools from “My workshop”"}</span></label>
            <label className="check-line compact"><input type="checkbox" checked={criteria.reuseAllowed} onChange={(event) => update("reuseAllowed", event.target.checked)} /><span>{isSr ? "Dozvoli iskorišćen materijal (palete, daske, kutije)" : "Allow reused material (pallets, boards, boxes)"}</span></label>
            <label className="check-line compact"><input type="checkbox" checked={criteria.windExposed} onChange={(event) => update("windExposed", event.target.checked)} /><span>{isSr ? "Mesto je izloženo jakom vetru" : "The spot is exposed to strong wind"}</span></label>
            <label className="check-line compact"><input type="checkbox" checked={criteria.portable} onChange={(event) => update("portable", event.target.checked)} /><span>{isSr ? "Treba da bude prenosivo" : "Should be portable"}</span></label>
            <label className="check-line compact"><input type="checkbox" checked={criteria.batch} onChange={(event) => update("batch", event.target.checked)} /><span>{isSr ? "Pravim više istih (serija)" : "Building several of the same (batch)"}</span></label>
            <label className="check-line compact"><input type="checkbox" checked={criteria.structure === "ANY"} onChange={(event) => update("structure", event.target.checked ? "ANY" : "SHELTER")} /><span>{isSr ? "Prikaži i hranilišta, senke i dodatke" : "Also show feeding stations, shade and accessories"}</span></label>
          </div>
        </details>

        <button type="button" className="finder-reset" onClick={() => { setUseWorkshop(false); setCriteria(defaultFinderUrlState); }} disabled={isDefault}>
          {isSr ? "Vrati podrazumevane uslove" : "Reset to defaults"}
        </button>

        <div className="finder-note">
          {isSr
            ? "Bez AI rangiranja. Tvrdi uslovi isključuju model, a redosled je deterministički: namena, kapacitet, vaš materijal, trošak, alat, vreme, zauzeti prostor."
            : "No AI ranking. Hard constraints exclude a model and the order is deterministic: purpose, capacity, your materials, cost, tools, time, footprint."}
        </div>
      </section>

      <section>
        <div className="finder-results-head">
          <p className="result-summary" role="status" aria-live="polite">
            <strong>{matches.length}</strong> {isSr ? "kompatibilnih modela" : "compatible models"}
          </p>
          <small>{isSr ? "Ne postoji procenat „poklapanja”: svaki rezultat pokazuje koje je uslove prošao i koje kompromise nosi." : "There is no “match percentage”: each result shows the checks it passed and the compromises it carries."}</small>
        </div>

        {matches.length > 0 ? (
          <div className="finder-results">
            {matches.map((result, index) => (
              <FinderResult key={result.entry.id} result={result} position={index + 1} locale={locale} engineered={engineeredThumbnails[result.entry.slug]} criteria={criteria} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="kicker">{isSr ? "Nema rezultata" : "0 matches"}</span>
            <h2>{isSr ? "Trenutno nema modela koji prolazi sve uslove." : "No current model passes every constraint."}</h2>
            <p>{isSr ? "Finder neće predložiti model koji ne ispunjava tvrda ograničenja. Svaki predlog ispod menja tačno jedan uslov." : "The finder will not suggest a model that fails a hard constraint. Each option below changes exactly one condition."}</p>
            {relaxations.length > 0 ? (
              <ul className="relaxation-list">
                {relaxations.map((relaxation) => (
                  <li key={relaxation.check}>
                    <button type="button" onClick={() => setCriteria(relaxation.criteria)}>
                      <span><strong>{relaxationTitle(relaxation)}</strong><small>{checkCopy[relaxation.check][locale]}</small></span>
                      <em>{relaxation.matchCount} {isSr ? "modela" : "models"} <span aria-hidden="true">→</span></em>
                    </button>
                  </li>
                ))}
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

function FinderResult({result, position, locale, engineered, criteria}: {result: MatchResult; position: number; locale: AppLocale; engineered?: EngineeredThumbnailData; criteria: FinderV2Criteria}) {
  const isSr = locale === "sr";
  const shown: MatchCheck[] = ["CAPACITY", "SEASON", "LOCATION", ...(criteria.tools.length ? (["TOOLS"] as MatchCheck[]) : []), ...(criteria.budgetMax !== "ANY" ? (["BUDGET"] as MatchCheck[]) : []), ...(criteria.maxTimeMinutes !== null ? (["TIME"] as MatchCheck[]) : []), "SPACE"];
  return (
    <div className="finder-match">
      <CatalogCard entry={result.entry} locale={locale} engineered={engineered} />
      <div className="match-reasons">
        <strong>{isSr ? `#${position} · Zašto odgovara` : `#${position} · Why it matches`}</strong>
        <ul className="reason-list">
          {shown.map((check) => <li key={check}><span aria-hidden="true">✓</span>{checkCopy[check][locale]}</li>)}
          {result.ownedUsed.length > 0 && <li><span aria-hidden="true">✓</span>{isSr ? `Koristi vaš materijal (${result.ownedUsed.length})` : `Uses your material (${result.ownedUsed.length})`}</li>}
          {result.entry.tools.every((tool) => !["DRILL", "JIGSAW", "CIRCULAR_SAW", "WORKSHOP"].includes(tool)) && <li><span aria-hidden="true">✓</span>{isSr ? "Bez električnog alata" : "No power tools required"}</li>}
        </ul>
        <strong className="compromise-title">{isSr ? "Kompromisi" : "Compromises"}</strong>
        <ul className="compromise-list">
          {result.compromises.map((item) => <li key={item}>{compromiseCopy[item][locale]}</li>)}
        </ul>
      </div>
    </div>
  );
}
