"use client";

import {useEffect, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {defaultFinderV2Criteria, matchCatalog, type FinderV2Criteria} from "@/lib/catalog/matcher";
import {emptyWorkshop, inventoryReport, ownedMaterialIds, parseWorkshop, workshopStorageKey, type InventoryItem, type Workshop} from "@/lib/catalog/inventory";
import {taxonomyLabel, tools as toolList, type Tool} from "@/lib/catalog/taxonomy-core";
import type {NestablePart} from "@/lib/nesting";
import type {MaterialOption} from "@/lib/catalog/page-data";
import {materialCategoryLabel, unitLabel} from "@/components/catalog/units";
import {DesignClassTag} from "@/components/catalog/badges";

type Preset = {id: string; sr: string; en: string; items: Array<Omit<InventoryItem, "offcuts"> & {offcuts?: InventoryItem["offcuts"]}>; tools: Tool[]; animal?: "cat" | "dog"; count?: number};

const presets: Preset[] = [
  {id: "cardboard", sr: "Nemam novca, ali imam kartonsku kutiju", en: "No money, but I have a cardboard box", items: [{materialId: "cardboard", quantity: 1, unit: "PIECE"}, {materialId: "waterproof-sheet", quantity: 1, unit: "AREA_M2"}, {materialId: "tape", quantity: 1, unit: "PACK"}], tools: ["UTILITY_KNIFE"], animal: "cat", count: 1},
  {id: "two-totes", sr: "Imam dve plastične kutije i slamu", en: "I have two plastic totes and straw", items: [{materialId: "plastic-tote", quantity: 2, unit: "PIECE"}, {materialId: "straw", quantity: 1, unit: "BALE"}], tools: ["UTILITY_KNIFE"], animal: "cat", count: 1},
  {id: "pallets", sr: "Imam tri palete", en: "I have three pallets", items: [{materialId: "pallet", quantity: 3, unit: "PIECE"}], tools: ["HAND_SAW", "DRILL"]},
  {id: "osb-half", sr: "Ostalo mi je pola table OSB-a", en: "I have half a sheet of OSB left", items: [{materialId: "osb3", quantity: 0, unit: "SHEET", offcuts: [{widthMm: 1250, heightMm: 1250}]}], tools: ["HAND_SAW", "JIGSAW", "DRILL"], animal: "cat", count: 1},
  {id: "xps-site", sr: "Imam XPS od gradnje", en: "I have XPS left from a build", items: [{materialId: "xps", quantity: 2, unit: "SHEET"}], tools: ["UTILITY_KNIFE", "HAND_SAW"]},
  {id: "boards", sr: "Imam stare daske", en: "I have old boards", items: [{materialId: "scrap-lumber", quantity: 20, unit: "LINEAR_M"}], tools: ["HAND_SAW", "DRILL"]}
];

export function WorkshopBuilder({
  locale,
  entries,
  materials,
  partsBySlug
}: {
  locale: AppLocale;
  entries: CatalogEntry[];
  materials: MaterialOption[];
  partsBySlug: Record<string, Record<string, NestablePart[]>>;
}) {
  const isSr = locale === "sr";
  const [workshop, setWorkshop] = useState<Workshop>(emptyWorkshop);
  const [ready, setReady] = useState(false);
  const [picker, setPicker] = useState(materials[0]?.id ?? "");
  const [criteria, setCriteria] = useState<FinderV2Criteria>({...defaultFinderV2Criteria, count: 1, season: "ANY"});
  const [scrapOnly, setScrapOnly] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(workshopStorageKey);
        if (raw) setWorkshop(parseWorkshop(JSON.parse(raw)));
      } catch {
        // Ignore unreadable local data.
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(workshopStorageKey, JSON.stringify(workshop));
    } catch {
      // Storage may be unavailable (private mode); the page keeps working in memory.
    }
  }, [workshop, ready]);

  const materialById = useMemo(() => Object.fromEntries(materials.map((material) => [material.id, material])), [materials]);
  const name = (id: string) => (isSr ? materialById[id]?.nameSr : materialById[id]?.nameEn) ?? id;

  function addMaterial(id: string) {
    const material = materialById[id];
    if (!material || workshop.items.some((item) => item.materialId === id)) return;
    setWorkshop((current) => ({...current, items: [...current.items, {materialId: id, quantity: 1, unit: material.unit, offcuts: []}]}));
  }
  function updateItem(id: string, patch: Partial<InventoryItem>) {
    setWorkshop((current) => ({...current, items: current.items.map((item) => (item.materialId === id ? {...item, ...patch} : item))}));
  }
  function removeItem(id: string) {
    setWorkshop((current) => ({...current, items: current.items.filter((item) => item.materialId !== id)}));
  }
  function toggleTool(tool: Tool) {
    setWorkshop((current) => ({...current, tools: current.tools.includes(tool) ? current.tools.filter((item) => item !== tool) : [...current.tools, tool]}));
  }
  function applyPreset(preset: Preset) {
    setWorkshop({version: 1, items: preset.items.map((item) => ({...item, offcuts: item.offcuts ?? []})), tools: preset.tools});
    setCriteria((current) => ({...current, animal: preset.animal ?? current.animal, count: preset.count ?? current.count}));
  }

  const results = useMemo(() => {
    const matched = matchCatalog(entries, {...criteria, ownedMaterials: ownedMaterialIds(workshop), tools: workshop.tools, reuseAllowed: true});
    return matched
      .map((match) => ({match, report: inventoryReport(match.entry, workshop, partsBySlug[match.entry.slug] ?? {})}))
      .filter(({report}) => report.missingTools.length === 0 || workshop.tools.length === 0)
      .filter(({report, match}) => {
        if (!scrapOnly) return true;
        return report.lines.every((line) => {
          const category = line.required.materialId ? materialById[line.required.materialId]?.category : null;
          const structural = category === "SHEET_WOOD" || category === "RIGID_FOAM" || category === "REUSED_WOOD" || category === "CONTAINER" || category === "SOLID_WOOD";
          return !structural || line.status === "OWNED" || line.status === "OFFCUTS_FIT";
        }) && match.entry.kind === "PRACTICAL";
      })
      .sort((a, b) => Number(b.report.fullyOwned) - Number(a.report.fullyOwned) || b.report.ownedLineCount - a.report.ownedLineCount || a.report.buyLineCount - b.report.buyLineCount)
      .slice(0, 12);
  }, [entries, criteria, workshop, partsBySlug, scrapOnly, materialById]);

  const groups = useMemo(() => {
    const byCategory = new Map<string, MaterialOption[]>();
    for (const material of materials) byCategory.set(material.category, [...(byCategory.get(material.category) ?? []), material]);
    return [...byCategory];
  }, [materials]);

  return (
    <div className="workshop-layout">
      <section className="workshop-panel" aria-label={isSr ? "Moja radionica" : "My workshop"}>
        <h2>{isSr ? "Moja radionica" : "My workshop"}</h2>
        <p className="field-help">{isSr ? "Čuva se samo u ovom pregledaču. Finder i troškovnik koriste isti spisak." : "Stored only in this browser. The finder and budget use the same list."}</p>

        <div className="preset-list" role="group" aria-label={isSr ? "Brzi primeri" : "Quick examples"}>
          {presets.map((preset) => (
            <button key={preset.id} type="button" className="preset-chip" onClick={() => applyPreset(preset)}>{isSr ? preset.sr : preset.en}</button>
          ))}
        </div>

        <div className="material-adder">
          <label>
            <span>{isSr ? "Dodaj materijal" : "Add material"}</span>
            <select value={picker} onChange={(event) => setPicker(event.target.value)}>
              {groups.map(([category, list]) => (
                <optgroup key={category} label={materialCategoryLabel(category, locale)}>
                  {list.map((material) => <option key={material.id} value={material.id}>{isSr ? material.nameSr : material.nameEn}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <button type="button" className="button secondary" onClick={() => addMaterial(picker)} disabled={workshop.items.some((item) => item.materialId === picker)}>
            {isSr ? "Dodaj" : "Add"}
          </button>
        </div>

        {workshop.items.length === 0 ? (
          <p className="workshop-empty">{isSr ? "Još niste dodali materijal." : "No materials added yet."}</p>
        ) : (
          <ul className="inventory-list">
            {workshop.items.map((item) => (
              <li key={item.materialId}>
                <div className="inventory-row">
                  <strong>{name(item.materialId)}</strong>
                  <label className="qty-input">
                    <span className="sr-only">{isSr ? `Količina: ${name(item.materialId)}` : `Quantity: ${name(item.materialId)}`}</span>
                    <input type="number" min={0} step="any" inputMode="decimal" value={item.quantity}
                      onChange={(event) => updateItem(item.materialId, {quantity: Math.max(0, Number(event.target.value) || 0)})} />
                    <span>{unitLabel(item.unit, locale)}</span>
                  </label>
                  <button type="button" className="icon-button" onClick={() => removeItem(item.materialId)} aria-label={isSr ? `Ukloni ${name(item.materialId)}` : `Remove ${name(item.materialId)}`}>×</button>
                </div>
                {item.unit === "SHEET" && (
                  <OffcutEditor locale={locale} offcuts={item.offcuts} onChange={(offcuts) => updateItem(item.materialId, {offcuts})} />
                )}
                {materialById[item.materialId]?.reuseInspection && (
                  <small className="reuse-note">
                    {isSr ? "Pre upotrebe: " : "Before use: "}
                    <Link href="/reuse">{isSr ? "kontrolna lista za iskorišćen materijal" : "reused material checklist"}</Link>
                  </small>
                )}
              </li>
            ))}
          </ul>
        )}

        <fieldset className="tool-fieldset">
          <legend>{isSr ? "Alat" : "Tools"}</legend>
          {toolList.map((tool) => (
            <label key={tool} className="check-line compact">
              <input type="checkbox" checked={workshop.tools.includes(tool)} onChange={() => toggleTool(tool)} />
              <span>{taxonomyLabel("tool", tool, locale)}</span>
            </label>
          ))}
        </fieldset>
        <button type="button" className="finder-reset" onClick={() => setWorkshop(emptyWorkshop)} disabled={!workshop.items.length && !workshop.tools.length}>
          {isSr ? "Isprazni radionicu" : "Clear workshop"}
        </button>
      </section>

      <section>
        <div className="workshop-criteria" role="group" aria-label={isSr ? "Za koga pravite" : "Who you are building for"}>
          <label>
            <span>{isSr ? "Životinja" : "Animal"}</span>
            <select value={criteria.animal} onChange={(event) => setCriteria((current) => ({...current, animal: event.target.value as "cat" | "dog"}))}>
              <option value="cat">{isSr ? "Mačka" : "Cat"}</option>
              <option value="dog">{isSr ? "Pas" : "Dog"}</option>
            </select>
          </label>
          {criteria.animal === "cat" ? (
            <label>
              <span>{isSr ? "Broj mačaka" : "Number of cats"}</span>
              <input type="number" min={1} max={12} value={criteria.count} onChange={(event) => setCriteria((current) => ({...current, count: Math.min(12, Math.max(1, Number(event.target.value) || 1))}))} />
            </label>
          ) : (
            <label>
              <span>{isSr ? "Veličina psa" : "Dog size"}</span>
              <select value={criteria.dogSize} onChange={(event) => setCriteria((current) => ({...current, dogSize: event.target.value as FinderV2Criteria["dogSize"]}))}>
                <option value="small">{isSr ? "Mali" : "Small"}</option>
                <option value="medium">{isSr ? "Srednji" : "Medium"}</option>
                <option value="large">{isSr ? "Veliki" : "Large"}</option>
              </select>
            </label>
          )}
          <label>
            <span>{isSr ? "Namena" : "Purpose"}</span>
            <select value={criteria.season} onChange={(event) => setCriteria((current) => ({...current, season: event.target.value as FinderV2Criteria["season"]}))}>
              <option value="ANY">{isSr ? "Bilo koja" : "Any"}</option>
              <option value="WINTER">{isSr ? "Zima" : "Winter"}</option>
              <option value="EMERGENCY">{isSr ? "Treba mi odmah" : "Needed now"}</option>
              <option value="SUMMER">{isSr ? "Leto i senka" : "Summer and shade"}</option>
              <option value="RAIN">{isSr ? "Kiša" : "Rain"}</option>
            </select>
          </label>
          <label>
            <span>{isSr ? "Gde će stajati" : "Where it will stand"}</span>
            <select value={criteria.location} onChange={(event) => setCriteria((current) => ({...current, location: event.target.value as FinderV2Criteria["location"]}))}>
              <option value="EXPOSED">{isSr ? "Napolju, izloženo" : "Outside, exposed"}</option>
              <option value="SHELTERED">{isSr ? "Uz zid ili ogradu" : "Against a wall or fence"}</option>
              <option value="COVERED">{isSr ? "Pod krovom" : "Under a roof"}</option>
            </select>
          </label>
          <label className="check-line compact">
            <input type="checkbox" checked={scrapOnly} onChange={(event) => setScrapOnly(event.target.checked)} />
            <span>{isSr ? "Napravi od ostataka (bez kupovine ploča i kutija)" : "Build from leftovers (no buying boards or containers)"}</span>
          </label>
        </div>

        <p className="result-summary" role="status" aria-live="polite">
          <strong>{results.length}</strong> {isSr ? "izvodljivih modela, poređanih po tome koliko materijala već imate" : "feasible models, ordered by how much material you already have"}
        </p>

        {results.length === 0 && (
          <div className="empty-state">
            <h2>{isSr ? "Sa ovim materijalom i alatom nema izvodljivog modela." : "No feasible model with these materials and tools."}</h2>
            <p>{isSr ? "Dodajte alat, isključite „Napravi od ostataka” ili promenite lokaciju." : "Add tools, turn off “Build from leftovers” or change the location."}</p>
          </div>
        )}

        <div className="inventory-results">
          {results.map(({match, report}) => (
            <article key={match.entry.id} className="inventory-result">
              <header>
                <DesignClassTag designClass={match.entry.designClass} locale={locale} />
                <Link href={{pathname: "/models/[slug]", params: {slug: match.entry.slug}}}>{isSr ? match.entry.nameSr : match.entry.nameEn}</Link>
                {report.fullyOwned && <span className="flag flag-owned">{isSr ? "Imate sve" : "You have everything"}</span>}
              </header>
              <div className="owned-buy">
                <div>
                  <strong>{isSr ? "Već imate" : "You have"}</strong>
                  <ul>
                    {report.lines.filter((line) => line.status === "OWNED" || line.status === "OFFCUTS_FIT").map((line, index) => (
                      <li key={index}>{isSr ? line.required.labelSr : line.required.labelEn}{line.status === "OFFCUTS_FIT" ? (isSr ? " (iz ostataka)" : " (from offcuts)") : ""}</li>
                    ))}
                    {report.ownedLineCount === 0 && <li className="muted">{isSr ? "ništa od potrebnog" : "none of the required items"}</li>}
                  </ul>
                </div>
                <div>
                  <strong>{isSr ? "Treba nabaviti" : "To obtain"}</strong>
                  <ul>
                    {report.lines.filter((line) => line.status === "BUY" || line.status === "PARTIAL" || line.status === "OFFCUTS_SHORT" || line.status === "CHECK_MANUALLY").map((line, index) => (
                      <li key={index}>
                        {isSr ? line.required.labelSr : line.required.labelEn}
                        {line.toBuy !== null ? `: ${line.toBuy} ${unitLabel(line.required.unit, locale)}` : line.status === "OFFCUTS_SHORT" ? (isSr ? ": ostaci nisu dovoljni" : ": offcuts are not enough") : (isSr ? ": proverite ručno" : ": check manually")}
                      </li>
                    ))}
                    {report.buyLineCount === 0 && <li className="muted">{isSr ? "ništa" : "nothing"}</li>}
                  </ul>
                </div>
              </div>
              <p className="inventory-meta">
                {isSr ? "Alat: " : "Tools: "}{match.entry.tools.map((tool) => taxonomyLabel("tool", tool, locale)).join(", ")}
                {report.missingTools.length > 0 && <span className="warn-text">{isSr ? ` · nedostaje: ${report.missingTools.map((tool) => taxonomyLabel("tool", tool, locale)).join(", ")}` : ` · missing: ${report.missingTools.map((tool) => taxonomyLabel("tool", tool, locale)).join(", ")}`}</span>}
                {" · "}{taxonomyLabel("difficulty", match.entry.difficulty, locale)}
              </p>
            </article>
          ))}
        </div>
        <p className="metric-disclaimer">
          {isSr
            ? "Ostaci se proveravaju pravougaonim omotačima delova sa 3 mm za rez; kosi delovi i otvori su konzervativno uračunati. Iskorišćen materijal mora proći kontrolnu listu."
            : "Offcuts are checked with rectangular part envelopes and a 3 mm kerf; sloped parts and openings are counted conservatively. Reused material must pass the checklist."}
        </p>
      </section>
    </div>
  );
}

function OffcutEditor({locale, offcuts, onChange}: {locale: AppLocale; offcuts: InventoryItem["offcuts"]; onChange: (offcuts: InventoryItem["offcuts"]) => void}) {
  const isSr = locale === "sr";
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  return (
    <div className="offcut-editor">
      <span>{isSr ? "Ostaci (mm)" : "Offcuts (mm)"}</span>
      <ul>
        {offcuts.map((cut, index) => (
          <li key={index}>
            {cut.widthMm} × {cut.heightMm}
            <button type="button" className="icon-button" onClick={() => onChange(offcuts.filter((_, i) => i !== index))} aria-label={isSr ? "Ukloni ostatak" : "Remove offcut"}>×</button>
          </li>
        ))}
      </ul>
      <div className="offcut-add">
        <input type="number" min={10} inputMode="numeric" placeholder={isSr ? "širina" : "width"} value={w} onChange={(event) => setW(event.target.value)} aria-label={isSr ? "Širina ostatka u mm" : "Offcut width in mm"} />
        <span aria-hidden="true">×</span>
        <input type="number" min={10} inputMode="numeric" placeholder={isSr ? "visina" : "height"} value={h} onChange={(event) => setH(event.target.value)} aria-label={isSr ? "Visina ostatka u mm" : "Offcut height in mm"} />
        <button type="button" className="button secondary" disabled={!(Number(w) > 0 && Number(h) > 0)} onClick={() => { onChange([...offcuts, {widthMm: Math.round(Number(w)), heightMm: Math.round(Number(h))}]); setW(""); setH(""); }}>
          {isSr ? "Dodaj ostatak" : "Add offcut"}
        </button>
      </div>
    </div>
  );
}
