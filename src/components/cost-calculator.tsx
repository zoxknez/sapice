"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import type {CostLine} from "@/lib/costing";
import {costLineCopy} from "@/lib/model-presentation";

type Currency = "RSD" | "EUR" | "USD" | "GBP";
type PriceMap = Record<string, number>;

function unitLabel(unit: "sheet" | "m2" | "m" | "item", locale: AppLocale, quantity: number) {
  if (unit === "sheet") {
    if (locale === "en") return quantity === 1 ? "sheet" : "sheets";
    return serbianCountLabel(quantity, "ploča", "ploče", "ploča");
  }
  if (unit === "m2") return "m²";
  if (unit === "m") return "m";
  if (locale === "en") return quantity === 1 ? "item" : "items";
  return serbianCountLabel(quantity, "stavka", "stavke", "stavki");
}

function serbianCountLabel(quantity: number, singular: string, paucal: string, plural: string) {
  const count = Math.round(Math.abs(quantity));
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return plural;
  const lastDigit = count % 10;
  if (lastDigit === 1) return singular;
  if (lastDigit >= 2 && lastDigit <= 4) return paucal;
  return plural;
}

export function CostCalculator({
  modelId,
  lines,
  locale
}: {
  modelId: string;
  lines: CostLine[];
  locale: AppLocale;
}) {
  const isSr = locale === "sr";
  const [currency, setCurrency] = useState<Currency>("RSD");
  const [prices, setPrices] = useState<PriceMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const raw = window.localStorage.getItem(`sapice:cost:${modelId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {currency?: Currency; prices?: PriceMap};
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.prices) setPrices(parsed.prices);
        } catch {
          // Invalid local draft is ignored.
        }
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [modelId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      `sapice:cost:${modelId}`,
      JSON.stringify({currency, prices})
    );
  }, [currency, prices, modelId, hydrated]);

  const total = lines.reduce((sum, line) => {
    const price = prices[line.id] ?? 0;
    return sum + line.quantity * price;
  }, 0);
  const pricedCount = lines.filter((line) => (prices[line.id] ?? 0) > 0).length;
  const pricedPercent = lines.length === 0 ? 0 : Math.round((pricedCount / lines.length) * 100);

  const formatter = new Intl.NumberFormat(locale === "sr" ? "sr-RS" : "en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "RSD" ? 0 : 2
  });

  return (
    <section className="section cost-section" id="cost">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">{isSr ? "Lokalne cene materijala" : "Local price profile"}</span>
            <h2>{isSr ? "Troškovnik" : "Cost estimate"}</h2>
          </div>
          <p>
            {isSr
              ? "Količine dolaze iz modela. Cene nisu izmišljene: unesite ono što stvarno plaćate lokalno, a procena se čuva samo u vašem pregledaču."
              : "Quantities come from the model. Prices are not fabricated: enter what you actually pay locally and the estimate stays in your browser."}
          </p>
        </div>

        <div className="cost-toolbar">
          <label>
            <span>{isSr ? "Valuta" : "Currency"}</span>
            <select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
              <option value="RSD">RSD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          <div className="cost-progress" role="status" aria-live="polite">
            <span>
              {isSr
                ? `Uneto cena: ${pricedCount} / ${lines.length}`
                : `Prices entered: ${pricedCount} / ${lines.length}`}
            </span>
            <span className="cost-progress-track" aria-hidden="true">
              <span style={{width: `${pricedPercent}%`}} />
            </span>
          </div>
          <button type="button" onClick={() => setPrices({})} disabled={pricedCount === 0 && Object.keys(prices).length === 0}>
            {isSr ? "Obriši moje cene" : "Clear my prices"}
          </button>
        </div>

        <div className="cost-table">
          {lines.map((line) => {
            const copy = costLineCopy(line, locale);
            const lineTotal = line.quantity * (prices[line.id] ?? 0);
            const share = total > 0 ? lineTotal / total : 0;
            return (
              <div className={lineTotal > 0 ? "cost-row priced" : "cost-row"} key={line.id}>
                <div>
                  <strong>{copy.label}</strong>
                  <small>{copy.note}</small>
                </div>
                <span className="cost-qty">
                  {line.quantity.toFixed(line.unit === "item" || line.unit === "sheet" ? 0 : 2)} {unitLabel(line.unit, locale, line.quantity)}
                </span>
                <label>
                  <span>{isSr ? "Cena po jedinici" : "Unit price"}</span>
                  <div className="price-input">
                    <input
                      inputMode="decimal"
                      type="number"
                      min="0"
                      step="any"
                      value={prices[line.id] ?? ""}
                      placeholder="0"
                      onChange={(event) => {
                        const raw = event.target.value;
                        setPrices((current) => {
                          const next = {...current};
                          const value = Number(raw);
                          if (raw === "" || !Number.isFinite(value)) delete next[line.id];
                          else next[line.id] = Math.max(0, value);
                          return next;
                        });
                      }}
                    />
                    <span>{currency}</span>
                  </div>
                </label>
                <strong className="cost-line-total">
                  {formatter.format(lineTotal)}
                  {share > 0 && (
                    <span className="cost-share" aria-label={isSr ? `${Math.round(share * 100)}% ukupne procene` : `${Math.round(share * 100)}% of the estimate`}>
                      <span style={{width: `${Math.max(2, share * 100)}%`}} />
                    </span>
                  )}
                </strong>
              </div>
            );
          })}
        </div>

        <div className="cost-total">
          <span>{isSr ? "Procena na osnovu unetih cena" : "Estimate from entered prices"}</span>
          <strong>{formatter.format(total)}</strong>
        </div>
        <p className="cost-disclaimer">
          {isSr
            ? "Količine za ploče, XPS, ram i okov dolaze iz kompajlera. Troškovnik ne uključuje dostavu, alat, rad, lokalne poreze ni nepredviđene gubitke izvan navedenih rezervi. Privremene stavke i stavke vezane za konkretan proizvod ostaju jasno označene."
            : "Sheet, XPS, framing and hardware quantities come from the compiler. The estimate still excludes delivery, tools, labor, local taxes and unforeseen losses beyond the stated allowances. PROVISIONAL and product-specific items remain explicitly labeled."}
        </p>
      </div>
    </section>
  );
}
