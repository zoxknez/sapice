"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {emptyWorkshop, inventoryReport, parseWorkshop, workshopStorageKey, type Workshop} from "@/lib/catalog/inventory";
import type {NestablePart} from "@/lib/nesting";
import {taxonomyLabel} from "@/lib/catalog/taxonomy-core";
import {unitLabel} from "@/components/catalog/units";

export function readWorkshop(): Workshop {
  try {
    const raw = window.localStorage.getItem(workshopStorageKey);
    return raw ? parseWorkshop(JSON.parse(raw)) : emptyWorkshop;
  } catch {
    return emptyWorkshop;
  }
}

const statusCopy = {
  OWNED: {sr: "Imate", en: "Owned"},
  PARTIAL: {sr: "Delimično", en: "Partly owned"},
  BUY: {sr: "Kupiti", en: "Buy"},
  OFFCUTS_FIT: {sr: "Staje u vaše ostatke", en: "Fits your offcuts"},
  OFFCUTS_SHORT: {sr: "Ostaci nisu dovoljni", en: "Offcuts not enough"},
  CHECK_MANUALLY: {sr: "Proverite ručno", en: "Check manually"},
  NOT_IN_LIBRARY: {sr: "Proizvod ili potrošni materijal", en: "Product or consumable"}
} as const;

/** Owned-versus-buy table for one model, using the local "My workshop" inventory. */
export function WorkshopCompare({entry, locale, partsByMaterial}: {entry: CatalogEntry; locale: AppLocale; partsByMaterial: Record<string, NestablePart[]>}) {
  const isSr = locale === "sr";
  const [workshop, setWorkshop] = useState<Workshop | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setWorkshop(readWorkshop()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const report = inventoryReport(entry, workshop ?? emptyWorkshop, partsByMaterial);
  const hasWorkshop = Boolean(workshop && (workshop.items.length || workshop.tools.length));

  return (
    <div className="workshop-compare">
      <div className="workshop-compare-head">
        <p>
          {hasWorkshop
            ? (isSr ? `Iz vaše radionice: ${report.ownedLineCount} stavki imate, ${report.buyLineCount} treba nabaviti.` : `From your workshop: ${report.ownedLineCount} items owned, ${report.buyLineCount} to obtain.`)
            : (isSr ? "Unesite šta imate u „Moja radionica” da vidite šta treba dokupiti." : "Fill in “My workshop” to see what you still need to buy.")}
        </p>
        <Link href="/build-with-what-you-have" className="button secondary">{isSr ? "Moja radionica" : "My workshop"}</Link>
      </div>
      <div className="bom-table" role="table" aria-label={isSr ? "Materijal: imate ili kupiti" : "Materials: owned or to buy"}>
        <div className="bom-row bom-head" role="row">
          <span role="columnheader">{isSr ? "Materijal" : "Material"}</span>
          <span role="columnheader">{isSr ? "Potrebno" : "Needed"}</span>
          <span role="columnheader">{isSr ? "Imate" : "Owned"}</span>
          <span role="columnheader">{isSr ? "Status" : "Status"}</span>
        </div>
        {report.lines.map((line, index) => (
          <div className="bom-row" role="row" key={`${line.required.materialId ?? "x"}-${index}`}>
            <strong role="cell">{isSr ? line.required.labelSr : line.required.labelEn}</strong>
            <span role="cell">{line.required.quantity} {unitLabel(line.required.unit, locale)}</span>
            <span role="cell">{hasWorkshop ? `${line.ownedQuantity} ${unitLabel(line.required.unit, locale)}` : "–"}</span>
            <span role="cell" className={`owned-status status-${line.status.toLowerCase()}`}>{hasWorkshop ? statusCopy[line.status][locale] : statusCopy[line.status === "NOT_IN_LIBRARY" ? "NOT_IN_LIBRARY" : "BUY"][locale]}</span>
          </div>
        ))}
      </div>
      {hasWorkshop && report.missingTools.length > 0 && (
        <p className="workshop-missing-tools">
          {isSr ? "Nedostaje alat: " : "Missing tools: "}
          {report.missingTools.map((tool) => taxonomyLabel("tool", tool, locale)).join(", ")}
        </p>
      )}
    </div>
  );
}
