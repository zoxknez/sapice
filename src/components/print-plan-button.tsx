"use client";

import type {AppLocale} from "@/i18n/routing";

export function PrintPlanButton({locale}: {locale: AppLocale}) {
  return (
    <button type="button" className="button secondary print-plan-button" onClick={() => window.print()}>
      {locale === "sr" ? "Štampaj / Sačuvaj PDF" : "Print / Save PDF"}
    </button>
  );
}
