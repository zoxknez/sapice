"use client";

import {useEffect, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {defaultFinderV2Criteria, matchCatalog, type FinderV2Criteria} from "@/lib/catalog/matcher";
import {budgetEstimate, budgetFit, emptyPriceProfile, parsePriceProfile, priceProfileStorageKey, type PriceProfile} from "@/lib/catalog/budget";
import {emptyWorkshop, type Workshop} from "@/lib/catalog/inventory";
import {taxonomyLabel} from "@/lib/catalog/taxonomy-core";
import {readWorkshop} from "@/components/catalog/workshop-compare";
import {unitLabel} from "@/components/catalog/units";
import {DesignClassTag} from "@/components/catalog/badges";
import type {MaterialOption} from "@/lib/catalog/page-data";

const presetsRsd = [0, 1000, 2500, 5000, 10000];

export type UpgradeHint = {from: string; to: string | null; nameSr: string; nameEn: string};

/** Serbian plural for "cena": 1 cena, 2-4 cene, 5+ cena (11-14 cena). */
function pricesWordSr(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "cena";
  if (last === 1) return "cena";
  if (last >= 2 && last <= 4) return "cene";
  return "cena";
}

export function BudgetBuilder({
  locale,
  entries,
  materials,
  upgrades
}: {
  locale: AppLocale;
  entries: CatalogEntry[];
  materials: MaterialOption[];
  upgrades: Record<string, UpgradeHint>;
}) {
  const isSr = locale === "sr";
  const [profile, setProfile] = useState<PriceProfile>(emptyPriceProfile);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState(2500);
  const [units, setUnits] = useState(1);
  const [useWorkshop, setUseWorkshop] = useState(true);
  const [workshop, setWorkshop] = useState<Workshop>(emptyWorkshop);
  const [criteria, setCriteria] = useState<FinderV2Criteria>({...defaultFinderV2Criteria, count: 1, season: "ANY"});

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(priceProfileStorageKey);
        if (raw) setProfile(parsePriceProfile(JSON.parse(raw)));
      } catch {
        // Unreadable local prices are ignored.
      }
      setWorkshop(readWorkshop());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(priceProfileStorageKey, JSON.stringify(profile));
    } catch {
      // Storage unavailable: keep working in memory.
    }
  }, [profile, ready]);

  const materialById = useMemo(() => Object.fromEntries(materials.map((material) => [material.id, material])), [materials]);
  const candidates = useMemo(() => matchCatalog(entries, {...criteria, reuseAllowed: true}).map((match) => match.entry), [entries, criteria]);
  const pricedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of candidates) for (const line of entry.requiredMaterials) if (line.materialId) ids.add(line.materialId);
    return [...ids].sort((a, b) => (materialById[a]?.category ?? "").localeCompare(materialById[b]?.category ?? "") || a.localeCompare(b));
  }, [candidates, materialById]);

  const results = useMemo(() => {
    const owned = useWorkshop ? workshop : emptyWorkshop;
    const order = {WITHIN: 0, UNKNOWN: 1, OVER: 2} as const;
    return candidates
      .map((entry) => {
        const estimate = budgetEstimate(entry, profile, owned, units);
        return {entry, estimate, fit: budgetFit(estimate, amount)};
      })
      .sort((a, b) => order[a.fit] - order[b.fit] || a.estimate.missingPriceCount - b.estimate.missingPriceCount || a.estimate.requiredPurchaseCost - b.estimate.requiredPurchaseCost || a.entry.slug.localeCompare(b.entry.slug));
  }, [candidates, profile, workshop, useWorkshop, units, amount]);

  const format = (value: number) => new Intl.NumberFormat(isSr ? "sr-RS" : "en", {style: "currency", currency: profile.currency, maximumFractionDigits: profile.currency === "RSD" ? 0 : 2}).format(value);
  const within = results.filter((result) => result.fit === "WITHIN").length;

  return (
    <div className="budget-layout">
      <section className="budget-panel" aria-label={isSr ? "Budžet i cene" : "Budget and prices"}>
        <label>
          <span>{isSr ? "Valuta" : "Currency"}</span>
          <select value={profile.currency} onChange={(event) => setProfile((current) => ({...current, currency: event.target.value as PriceProfile["currency"]}))}>
            {(["RSD", "EUR", "USD", "GBP"] as const).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </label>
        <fieldset className="amount-presets">
          <legend>{isSr ? "Koliko možete da potrošite" : "How much you can spend"}</legend>
          {profile.currency === "RSD" && presetsRsd.map((preset) => (
            <button key={preset} type="button" className={amount === preset ? "preset-chip active" : "preset-chip"} aria-pressed={amount === preset} onClick={() => setAmount(preset)}>
              {preset === 0 ? (isSr ? "0 (besplatno)" : "0 (free)") : format(preset)}
            </button>
          ))}
          <label className="custom-amount">
            <span>{isSr ? "Iznos" : "Amount"}</span>
            <input type="number" min={0} step="any" inputMode="decimal" value={amount} onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))} />
          </label>
        </fieldset>
        <label>
          <span>{isSr ? "Broj skloništa" : "Number of shelters"}</span>
          <input type="number" min={1} max={50} value={units} onChange={(event) => setUnits(Math.min(50, Math.max(1, Math.round(Number(event.target.value)) || 1)))} />
        </label>
        <label>
          <span>{isSr ? "Životinja" : "Animal"}</span>
          <select value={criteria.animal} onChange={(event) => setCriteria((current) => ({...current, animal: event.target.value as "cat" | "dog"}))}>
            <option value="cat">{isSr ? "Mačka" : "Cat"}</option>
            <option value="dog">{isSr ? "Pas" : "Dog"}</option>
          </select>
        </label>
        {criteria.animal === "dog" && (
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
            <option value="SUMMER">{isSr ? "Leto" : "Summer"}</option>
            <option value="RAIN">{isSr ? "Kiša" : "Rain"}</option>
            <option value="EMERGENCY">{isSr ? "Hitno" : "Emergency"}</option>
          </select>
        </label>
        <label className="check-line compact">
          <input type="checkbox" checked={useWorkshop} onChange={(event) => setUseWorkshop(event.target.checked)} />
          <span>{isSr ? "Oduzmi materijal iz „Moja radionica”" : "Subtract materials from “My workshop”"}</span>
        </label>

        <details className="price-editor">
          <summary>{isSr ? `Moje cene (${Object.keys(profile.prices).length} uneto)` : `My prices (${Object.keys(profile.prices).length} entered)`}</summary>
          <p className="field-help">{isSr ? "Unesite cene koje stvarno plaćate. Šapice ne izmišlja tržišne cene; prazno polje znači da cena nije poznata." : "Enter the prices you actually pay. Šapice does not invent market prices; an empty field means the price is unknown."}</p>
          {pricedIds.map((id) => (
            <label key={id} className="price-row">
              <span>{isSr ? materialById[id]?.nameSr : materialById[id]?.nameEn} <small>/ {unitLabel(materialById[id]?.unit ?? "PIECE", locale)}</small></span>
              <input type="number" min={0} step="any" inputMode="decimal" value={profile.prices[id] ?? ""} placeholder="?"
                onChange={(event) => {
                  const raw = event.target.value;
                  setProfile((current) => {
                    const prices = {...current.prices};
                    if (raw === "" || !Number.isFinite(Number(raw))) delete prices[id];
                    else prices[id] = Math.max(0, Number(raw));
                    return {...current, prices};
                  });
                }} />
            </label>
          ))}
          <button type="button" className="finder-reset" onClick={() => setProfile((current) => ({...current, prices: {}}))}>{isSr ? "Obriši moje cene" : "Clear my prices"}</button>
        </details>
      </section>

      <section>
        <p className="result-summary" role="status" aria-live="polite">
          <strong>{within}</strong> {isSr ? `modela staje u ${format(amount)}` : `models fit within ${format(amount)}`}
          {" · "}{results.filter((result) => result.fit === "UNKNOWN").length} {isSr ? "bez dovoljno cena" : "without enough prices"}
        </p>
        <div className="budget-results">
          {results.slice(0, 18).map(({entry, estimate, fit}) => {
            const next = upgrades[entry.slug];
            return (
              <article key={entry.id} className={`budget-result fit-${fit.toLowerCase()}`}>
                <header>
                  <DesignClassTag designClass={entry.designClass} locale={locale} />
                  <Link href={{pathname: "/models/[slug]", params: {slug: entry.slug}}}>{isSr ? entry.nameSr : entry.nameEn}</Link>
                  <span className={`fit-badge fit-${fit.toLowerCase()}`}>
                    {fit === "WITHIN" ? (isSr ? "Staje u budžet" : "Within budget") : fit === "OVER" ? (isSr ? "Preko budžeta" : "Over budget") : (isSr ? `${pricesWordSr(estimate.missingPriceCount) === "cene" ? "Nedostaju" : "Nedostaje"} ${estimate.missingPriceCount} ${pricesWordSr(estimate.missingPriceCount)}` : `${estimate.missingPriceCount} prices missing`)}
                  </span>
                </header>
                <dl className="budget-figures">
                  <div><dt>{isSr ? "Za kupovinu" : "Purchase cost"}</dt><dd>{estimate.complete ? format(estimate.requiredPurchaseCost) : `≥ ${format(estimate.requiredPurchaseCost)}`}</dd></div>
                  <div><dt>{isSr ? "Po skloništu" : "Per shelter"}</dt><dd>{estimate.costPerShelter === null ? "?" : format(estimate.costPerShelter)}</dd></div>
                  <div><dt>{isSr ? "Po životinji" : "Per animal"}</dt><dd>{estimate.costPerAnimal === null ? "?" : format(estimate.costPerAnimal)}</dd></div>
                  <div><dt>{isSr ? "Vrednost vašeg materijala (nije uračunata)" : "Value of your material (not counted)"}</dt><dd>{format(estimate.ownedValueIgnored)}</dd></div>
                  <div><dt>{isSr ? "Otpad ploča (plan)" : "Sheet waste (plan)"}</dt><dd>{entry.sheetWaste === null ? "–" : `${Math.round(entry.sheetWaste * 100)}%`}</dd></div>
                  <div><dt>{isSr ? "Klasa troška" : "Cost class"}</dt><dd>{taxonomyLabel("budgetClass", entry.budgetClass, locale)}</dd></div>
                </dl>
                {next && (
                  <p className="budget-upgrade">
                    {isSr ? "Sledeći korak: " : "Next step: "}
                    {next.to ? <Link href={{pathname: "/models/[slug]", params: {slug: next.to}}}>{isSr ? next.nameSr : next.nameEn}</Link> : (isSr ? next.nameSr : next.nameEn)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
        <p className="metric-disclaimer">
          {isSr
            ? "Iznosi su zbir vaših cena puta količine iz modela. Dostava, alat, rad i porezi nisu uključeni. Ako je materijal već vaš, njegova cena se ne dodaje kupovini, ali se prikazuje odvojeno."
            : "Amounts are your prices times the model quantities. Delivery, tools, labour and taxes are not included. Material you already own is not added to the purchase but is shown separately."}
        </p>
      </section>
    </div>
  );
}
