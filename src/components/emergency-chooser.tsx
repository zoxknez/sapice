"use client";

import {useId, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {emergencyItemCopy, emergencyItems, emergencyRecommendations, type EmergencyItem} from "@/lib/emergency";

export type EmergencyCard = {
  slug: string;
  nameSr: string;
  nameEn: string;
  steps: Array<{titleSr: string; titleEn: string; detailSr: string; detailEn: string}>;
};

export function EmergencyChooser({locale, cards}: {locale: AppLocale; cards: Record<string, EmergencyCard>}) {
  const isSr = locale === "sr";
  const id = useId();
  const [have, setHave] = useState<EmergencyItem[]>([]);
  const recommendations = useMemo(() => emergencyRecommendations(have), [have]);
  const possible = recommendations.filter((item) => item.possible);
  const best = possible[0];

  return (
    <div className="emergency-chooser">
      <fieldset className="have-grid">
        <legend>{isSr ? "Šta imate pri ruci?" : "What do you have at hand?"}</legend>
        {emergencyItems.map((item) => (
          <label key={item} className={`have-chip${have.includes(item) ? " active" : ""}`} htmlFor={`${id}-${item}`}>
            <input
              id={`${id}-${item}`}
              type="checkbox"
              checked={have.includes(item)}
              onChange={() => setHave((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]))}
            />
            <span>{emergencyItemCopy[item][locale]}</span>
          </label>
        ))}
      </fieldset>

      <div className="emergency-result" role="status" aria-live="polite">
        {best ? (
          <>
            <span className="kicker">{isSr ? "Najtrajnije što možete napraviti sada" : "The most durable thing you can make now"}</span>
            <h3>{isSr ? cards[best.slug]?.nameSr : cards[best.slug]?.nameEn}</h3>
            {best.helpfulMissing.length > 0 && (
              <p className="helpful-missing">
                {isSr ? "Pomoglo bi i: " : "Also helpful: "}
                {best.helpfulMissing.map((item) => emergencyItemCopy[item][locale]).join(", ")}
              </p>
            )}
            <ol className="emergency-steps">
              {cards[best.slug]?.steps.map((step) => (
                <li key={step.titleEn}>
                  <strong>{isSr ? step.titleSr : step.titleEn}</strong>
                  <span>{isSr ? step.detailSr : step.detailEn}</span>
                </li>
              ))}
            </ol>
            <Link href={{pathname: "/models/[slug]", params: {slug: best.slug}}} className="button primary">
              {isSr ? "Otvori ceo plan" : "Open the full plan"}
            </Link>
          </>
        ) : (
          <>
            <span className="kicker">{isSr ? "Još nemate dovoljno" : "Not enough yet"}</span>
            <p>
              {isSr
                ? "Označite šta imate. Najbrže besplatno rešenje je čista stiropor kutija ili suva kartonska kutija sa slamom na mestu pod krovom. Pitajte ribarnice, apoteke i restorane za čiste stiropor kutije, uvek uz dozvolu."
                : "Tick what you have. The fastest free option is a clean foam box or a dry cardboard box with straw at a spot under a roof. Ask fishmongers, pharmacies and restaurants for clean foam boxes, always with permission."}
            </p>
          </>
        )}
      </div>

      {possible.length > 1 && (
        <div className="emergency-alternatives">
          <strong>{isSr ? "Druge mogućnosti sa onim što imate" : "Other options with what you have"}</strong>
          <ul>
            {possible.slice(1).map((item) => (
              <li key={item.slug}>
                <Link href={{pathname: "/models/[slug]", params: {slug: item.slug}}}>{isSr ? cards[item.slug]?.nameSr : cards[item.slug]?.nameEn}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recommendations.some((item) => !item.possible && item.missing.length === 1) && (
        <div className="emergency-alternatives">
          <strong>{isSr ? "Nedostaje vam samo jedna stvar za" : "You are one item away from"}</strong>
          <ul>
            {recommendations.filter((item) => !item.possible && item.missing.length === 1).map((item) => (
              <li key={item.slug}>
                {isSr ? cards[item.slug]?.nameSr : cards[item.slug]?.nameEn}: <em>{emergencyItemCopy[item.missing[0]][locale]}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
