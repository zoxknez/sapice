import type {AppLocale} from "@/i18n/routing";
import type {NestingGroup} from "@/lib/practical/compiler";
import {getLibraryMaterial} from "@/data/material-library";

/** Deterministic sheet layouts for nested materials (rectangular packing envelopes). */
export function PracticalSheets({groups, locale}: {groups: NestingGroup[]; locale: AppLocale}) {
  const isSr = locale === "sr";
  return (
    <div className="practical-sheets">
      {groups.map((group) => {
        const material = getLibraryMaterial(group.materialId);
        return (
          <div key={`${group.materialId}-${group.thicknessMm}`} className="practical-sheet-group">
            <h3>
              {isSr ? material.nameSr : material.nameEn} · {group.thicknessMm} mm
              <small>{group.sheets.length} × {group.stockWidthMm} × {group.stockHeightMm} mm</small>
            </h3>
            <div className="practical-sheet-list">
              {group.sheets.map((sheet) => {
                const scale = 300 / sheet.widthMm;
                return (
                  <figure key={sheet.index}>
                    <svg viewBox={`0 0 ${sheet.widthMm * scale} ${sheet.heightMm * scale}`} role="img"
                      aria-label={isSr
                        ? `Ploča ${sheet.index + 1}: ${sheet.parts.length} delova, iskorišćenost ${Math.round(sheet.materialUtilization * 100)}%`
                        : `Sheet ${sheet.index + 1}: ${sheet.parts.length} parts, utilisation ${Math.round(sheet.materialUtilization * 100)}%`}>
                      <rect x="0" y="0" width={sheet.widthMm * scale} height={sheet.heightMm * scale} className="sheet-stock" />
                      {sheet.parts.map((part) => (
                        <g key={part.partId}>
                          <rect x={part.x * scale} y={part.y * scale} width={part.widthMm * scale} height={part.heightMm * scale} className="sheet-part" />
                          {part.widthMm * scale > 46 && part.heightMm * scale > 14 && (
                            <text x={(part.x + part.widthMm / 2) * scale} y={(part.y + part.heightMm / 2) * scale + 3} textAnchor="middle" className="sheet-part-label">
                              {part.partId.replace(/-\d+$/, "")}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>
                    <figcaption>
                      {isSr ? "Ploča" : "Sheet"} {sheet.index + 1} · {Math.round(sheet.materialUtilization * 100)}% {isSr ? "iskorišćeno" : "used"}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
