"use client";

import {useEffect, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {packBatch, packCutParts, type NestablePart} from "@/lib/nesting";
import {emptyPriceProfile, parsePriceProfile, priceProfileStorageKey, type PriceProfile} from "@/lib/catalog/budget";
import {unitLabel} from "@/components/catalog/units";
import type {MaterialOption} from "@/lib/catalog/page-data";

/** Serbian plural for "cena": 1 cena, 2-4 cene, 5+ cena (11-14 cena). */
function pricesWordSr(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "cena";
  if (last === 1) return "cena";
  if (last >= 2 && last <= 4) return "cene";
  return "cena";
}

export function RescuePlanner({
  locale,
  entries,
  partsBySlug,
  partNamesBySlug,
  materials
}: {
  locale: AppLocale;
  entries: CatalogEntry[];
  partsBySlug: Record<string, Record<string, NestablePart[]>>;
  partNamesBySlug: Record<string, Record<string, {sr: string; en: string}>>;
  materials: MaterialOption[];
}) {
  const isSr = locale === "sr";
  const candidates = useMemo(() => entries.filter((entry) => entry.kind === "PRACTICAL" && entry.coverage.includes("NESTING") && entry.structureType === "SLEEPING_SHELTER"), [entries]);
  const [slug, setSlug] = useState(candidates.find((entry) => entry.slug === "two-cat-budget-winter")?.slug ?? candidates[0]?.slug ?? "");
  const [animals, setAnimals] = useState(12);
  const [maxUnits, setMaxUnits] = useState(10);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [stock, setStock] = useState<Record<string, {widthMm: number; heightMm: number}>>({});
  const [profile, setProfile] = useState<PriceProfile>(emptyPriceProfile);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(priceProfileStorageKey);
        if (raw) setProfile(parsePriceProfile(JSON.parse(raw)));
      } catch {
        // ignore
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const entry = candidates.find((item) => item.slug === slug);
  const materialById = useMemo(() => Object.fromEntries(materials.map((material) => [material.id, material])), [materials]);
  const parts = useMemo(() => partsBySlug[slug] ?? {}, [partsBySlug, slug]);
  // Batch instance ids look like "u3-shell-roof-1": shelter number, part id, copy number.
  const partLabel = (instanceId: string) => {
    const match = /^u(\d+)-(.+)-\d+$/.exec(instanceId);
    const names = partNamesBySlug[slug] ?? {};
    if (!match) return instanceId;
    const name = (names[match[2]]?.[locale] ?? match[2]).split(" · ")[0]; // the sheet heading already names the material
    return `${name} (${isSr ? "skl." : "shelter"} ${match[1]})`;
  };

  const plan = useMemo(() => {
    if (!entry) return null;
    const perUnit = Math.max(1, entry.capacity.recommended);
    const needed = Math.ceil(animals / perUnit);
    const units = Math.max(1, Math.min(maxUnits, needed));
    const groups = Object.entries(parts).map(([materialId, list]) => {
      const defaults = materialById[materialId]?.stock ?? {widthMm: 2500, heightMm: 1250};
      const dims = stock[materialId] ?? defaults;
      let sheets: ReturnType<typeof packCutParts> = [];
      let singleSheets = 0;
      let error: string | null = null;
      try {
        sheets = packBatch(list, units, {sheetWidthMm: dims.widthMm, sheetHeightMm: dims.heightMm, kerfMm: 3, marginMm: 10});
        singleSheets = packCutParts(list, {sheetWidthMm: dims.widthMm, sheetHeightMm: dims.heightMm, kerfMm: 3, marginMm: 10}).length;
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
      const used = sheets.reduce((sum, sheet) => sum + sheet.materialUtilization * sheet.widthMm * sheet.heightMm, 0);
      const total = sheets.reduce((sum, sheet) => sum + sheet.widthMm * sheet.heightMm, 0);
      return {materialId, dims, sheets, singleSheets, error, waste: total > 0 ? 1 - used / total : 0};
    });
    const otherLines = entry.requiredMaterials
      .filter((line) => line.unit !== "SHEET")
      .map((line) => ({...line, quantity: Math.round(line.quantity * units * 100) / 100}));
    const avgHours = (entry.buildTimeMinutes[0] + entry.buildTimeMinutes[1]) / 2 / 60;
    const perDay = Math.max(1, Math.floor(hoursPerDay / avgHours));
    const lines = [
      ...groups.map((group) => ({materialId: group.materialId, quantity: group.sheets.length, unit: "SHEET" as const})),
      ...otherLines.filter((line) => line.materialId).map((line) => ({materialId: line.materialId as string, quantity: line.quantity, unit: line.unit}))
    ];
    const missing = lines.filter((line) => !(line.materialId in profile.prices)).length;
    const cost = lines.reduce((sum, line) => sum + (profile.prices[line.materialId] ?? 0) * line.quantity, 0);
    return {needed, units, capacity: units * entry.capacity.recommended, groups, otherLines, avgHours, perDay, days: Math.ceil(units / perDay), cost, missing};
  }, [entry, animals, maxUnits, parts, stock, materialById, hoursPerDay, profile]);

  const format = (value: number) => new Intl.NumberFormat(isSr ? "sr-RS" : "en", {style: "currency", currency: profile.currency, maximumFractionDigits: profile.currency === "RSD" ? 0 : 2}).format(value);
  const nameOf = (id: string) => (isSr ? materialById[id]?.nameSr : materialById[id]?.nameEn) ?? id;

  return (
    <div className="rescue-layout">
      <section className="budget-panel rescue-panel" aria-label={isSr ? "Ulazni podaci za seriju" : "Batch inputs"}>
        <label>
          <span>{isSr ? "Model" : "Model"}</span>
          <select value={slug} onChange={(event) => setSlug(event.target.value)}>
            {candidates.map((item) => <option key={item.slug} value={item.slug}>{isSr ? item.nameSr : item.nameEn} ({item.capacity.recommended}×)</option>)}
          </select>
        </label>
        <label>
          <span>{isSr ? "Broj životinja" : "Number of animals"}</span>
          <input type="number" min={1} max={200} value={animals} onChange={(event) => setAnimals(Math.min(200, Math.max(1, Math.round(Number(event.target.value)) || 1)))} />
        </label>
        <label>
          <span>{isSr ? "Najviše skloništa" : "Maximum shelters"}</span>
          <input type="number" min={1} max={50} value={maxUnits} onChange={(event) => setMaxUnits(Math.min(50, Math.max(1, Math.round(Number(event.target.value)) || 1)))} />
        </label>
        <label>
          <span>{isSr ? "Radnih sati po danu (ceo tim)" : "Working hours per day (whole team)"}</span>
          <input type="number" min={1} max={80} value={hoursPerDay} onChange={(event) => setHoursPerDay(Math.min(80, Math.max(1, Number(event.target.value) || 1)))} />
        </label>
        {Object.keys(parts).map((materialId) => {
          const dims = stock[materialId] ?? materialById[materialId]?.stock ?? {widthMm: 2500, heightMm: 1250};
          return (
            <fieldset key={materialId} className="stock-fieldset">
              <legend>{isSr ? "Format ploče: " : "Sheet size: "}{nameOf(materialId)}</legend>
              <div className="offcut-add">
                <input type="number" min={300} value={dims.widthMm} aria-label={isSr ? "Širina ploče u mm" : "Sheet width in mm"} onChange={(event) => setStock((current) => ({...current, [materialId]: {...dims, widthMm: Math.max(300, Number(event.target.value) || dims.widthMm)}}))} />
                <span aria-hidden="true">×</span>
                <input type="number" min={300} value={dims.heightMm} aria-label={isSr ? "Visina ploče u mm" : "Sheet height in mm"} onChange={(event) => setStock((current) => ({...current, [materialId]: {...dims, heightMm: Math.max(300, Number(event.target.value) || dims.heightMm)}}))} />
              </div>
            </fieldset>
          );
        })}
        <p className="field-help">{isSr ? "Cene se čitaju iz profila cena na stranici Budžet." : "Prices are read from the price profile on the Budget page."} <Link href="/budget">{isSr ? "Uredi cene" : "Edit prices"}</Link></p>
      </section>

      {plan && entry && (
        <section className="rescue-result" aria-live="polite">
          <div className="rescue-summary">
            <div><span>{isSr ? "Skloništa" : "Shelters"}</span><strong>{plan.units}</strong>{plan.units < plan.needed && <small>{isSr ? `potrebno ${plan.needed}, ograničeno na ${plan.units}` : `${plan.needed} needed, limited to ${plan.units}`}</small>}</div>
            <div><span>{isSr ? "Kapacitet" : "Capacity"}</span><strong>{plan.capacity}</strong><small>{isSr ? `za ${animals} životinja` : `for ${animals} animals`}</small></div>
            <div><span>{isSr ? "Radnih dana (procena)" : "Working days (estimate)"}</span><strong>{plan.days}</strong><small>{isSr ? `oko ${plan.perDay} po danu` : `about ${plan.perDay} per day`}</small></div>
            <div><span>{isSr ? "Trošak (vaše cene)" : "Cost (your prices)"}</span><strong>{plan.missing ? `≥ ${format(plan.cost)}` : format(plan.cost)}</strong><small>{plan.missing ? (isSr ? `nedostaje ${plan.missing} ${pricesWordSr(plan.missing)}` : `${plan.missing} prices missing`) : `${format(plan.cost / plan.units)} / ${isSr ? "sklonište" : "shelter"} · ${format(plan.cost / Math.max(1, plan.capacity))} / ${isSr ? "životinja" : "animal"}`}</small></div>
          </div>

          <h3>{isSr ? "Ploče za celu seriju" : "Sheets for the whole batch"}</h3>
          <div className="bom-table batch-bom">
            {plan.groups.map((group) => (
              <div className="bom-row" key={group.materialId}>
                <strong>{nameOf(group.materialId)}</strong>
                <span>{group.error ? (isSr ? "deo ne staje na ploču" : "a part does not fit the sheet") : `${group.sheets.length} ${unitLabel("SHEET", locale)}`}</span>
                <span>{isSr ? `pojedinačno ${group.singleSheets * plan.units}` : `separately ${group.singleSheets * plan.units}`}</span>
                <span>{isSr ? "otpad" : "waste"} {Math.round(group.waste * 100)}%</span>
              </div>
            ))}
          </div>
          <p className="field-help">{isSr ? "„Pojedinačno” je broj ploča kada se svako sklonište planira posebno; zajednički raspored ga smanjuje ili izjednačava." : "“Separately” is the sheet count when each shelter is planned on its own; the shared layout reduces or matches it."}</p>

          <h3>{isSr ? "Ostali materijal i okov" : "Other material and hardware"}</h3>
          <ul className="bom-basis">
            {plan.otherLines.map((line, index) => (
              <li key={index}><strong>{isSr ? line.labelSr : line.labelEn}</strong><span>{line.quantity} {unitLabel(line.unit, locale)}</span></li>
            ))}
          </ul>

          <details className="cutting-schedule">
            <summary>{isSr ? "Ponovljiv raspored sečenja" : "Repeatable cutting schedule"}</summary>
            {plan.groups.map((group) => (
              <div key={group.materialId}>
                <h4>{nameOf(group.materialId)} · {group.dims.widthMm} × {group.dims.heightMm} mm</h4>
                <ol>
                  {group.sheets.map((sheet) => (
                    <li key={sheet.index}>
                      {isSr ? "Ploča" : "Sheet"} {sheet.index + 1}: {sheet.parts.map((part) => partLabel(part.partId)).join(", ")}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </details>
          <p className="metric-disclaimer">
            {isSr
              ? "Oznaka u1, u2… pokazuje kom skloništu deo pripada. Formati ploča i vreme izrade su planske pretpostavke; kosi delovi zauzimaju svoj pravougaoni omotač."
              : "The u1, u2… prefix shows which shelter a part belongs to. Sheet sizes and build time are planning assumptions; sloped parts occupy their rectangular envelope."}
          </p>
          <Link href={{pathname: "/models/[slug]", params: {slug: entry.slug}}} className="text-link">{isSr ? "Plan jednog skloništa" : "Single shelter plan"} <span aria-hidden="true">→</span></Link>
        </section>
      )}
    </div>
  );
}
