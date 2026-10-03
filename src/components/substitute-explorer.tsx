"use client";

import {useState} from "react";
import type {AppLocale} from "@/i18n/routing";

export type SubstituteTableRow = {
  toId: string;
  toNameSr: string;
  toNameEn: string;
  kind: "THERMAL_EQUIVALENT" | "REDESIGN_REQUIRED" | "NOT_ALLOWED";
  requiredThicknessMm: number | null;
  conservativeThicknessMm: number | null;
  targetR: number | null;
  noteSr: string;
  noteEn: string;
};

export type SubstituteTable = Record<string, {nameSr: string; nameEn: string; byThickness: Record<number, SubstituteTableRow[]>}>;

export function SubstituteExplorer({locale, table, thicknesses, caveatsSr, caveatsEn}: {locale: AppLocale; table: SubstituteTable; thicknesses: number[]; caveatsSr: string[]; caveatsEn: string[]}) {
  const isSr = locale === "sr";
  const ids = Object.keys(table);
  const [from, setFrom] = useState(ids.includes("xps") ? "xps" : ids[0]);
  const [thickness, setThickness] = useState(50);
  const rows = table[from]?.byThickness[thickness] ?? [];

  return (
    <div className="substitute-explorer">
      <div className="field-context">
        <label>
          <span>{isSr ? "Nemate ovaj materijal" : "You don't have"}</span>
          <select value={from} onChange={(event) => setFrom(event.target.value)}>
            {ids.map((id) => <option key={id} value={id}>{isSr ? table[id].nameSr : table[id].nameEn}</option>)}
          </select>
        </label>
        <label>
          <span>{isSr ? "Debljina u planu" : "Thickness in the plan"}</span>
          <select value={thickness} onChange={(event) => setThickness(Number(event.target.value))}>
            {thicknesses.map((value) => <option key={value} value={value}>{value} mm</option>)}
          </select>
        </label>
      </div>
      <ul className="substitute-results" aria-live="polite">
        {rows.map((row) => (
          <li key={row.toId} className={`sub-${row.kind.toLowerCase()}`}>
            <strong>{isSr ? row.toNameSr : row.toNameEn}</strong>
            {row.kind === "THERMAL_EQUIVALENT" ? (
              <span>
                {isSr
                  ? `R ${row.targetR?.toFixed(2)} m²K/W → oko ${row.requiredThicknessMm} mm${row.conservativeThicknessMm ? `, konzervativno ${row.conservativeThicknessMm} mm` : ""}`
                  : `R ${row.targetR?.toFixed(2)} m²K/W → about ${row.requiredThicknessMm} mm${row.conservativeThicknessMm ? `, conservatively ${row.conservativeThicknessMm} mm` : ""}`}
              </span>
            ) : (
              <span>{isSr ? row.noteSr : row.noteEn}</span>
            )}
          </li>
        ))}
      </ul>
      <ul className="plain-list caveat-list">
        {(isSr ? caveatsSr : caveatsEn).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
