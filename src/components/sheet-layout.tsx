import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";
import {packCutParts} from "@/lib/nesting";

export function SheetLayout({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const parts = compiled.cutParts.filter((part) => part.material === "plywood-12");
  const sheets = packCutParts(parts);
  const scale = 0.22;

  return (
    <section className="section tone-soft" id="nesting">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">Sheet planning · V1</span>
            <h2>{locale === "sr" ? "Raspored na tablama" : "Sheet layout"}</h2>
          </div>
          <p>
            {locale === "sr"
              ? "Deterministički raspored za table 2500 × 1250 mm, sa 3 mm kerf-a i 10 mm margine. Trapezni delovi se za sada pakuju po svom bounding-box-u, pa ovo nije polygon-optimalni nesting."
              : "Deterministic layout for 2500 × 1250 mm sheets with a 3 mm kerf and 10 mm margin. Trapezoid parts currently pack by bounding box, so this is not polygon-optimal nesting."}
          </p>
        </div>

        <div className="sheet-summary">
          <strong>{sheets.length}</strong>
          <span>{locale === "sr" ? "potrebnih tabla za prikazane 12 mm delove" : "sheets required for the shown 12 mm parts"}</span>
        </div>

        <div className="sheet-grid">
          {sheets.map((sheet) => (
            <article key={sheet.index} className="sheet-card">
              <header>
                <strong>{locale === "sr" ? "Tabla" : "Sheet"} {sheet.index + 1}</strong>
                <span>{Math.round(sheet.utilization * 100)}% {locale === "sr" ? "iskorišćeno" : "utilized"}</span>
              </header>
              <svg
                viewBox={`0 0 ${sheet.widthMm * scale} ${sheet.heightMm * scale}`}
                role="img"
                aria-label={locale === "sr" ? `Raspored delova na tabli ${sheet.index + 1}` : `Part layout on sheet ${sheet.index + 1}`}
              >
                <rect
                  x="0"
                  y="0"
                  width={sheet.widthMm * scale}
                  height={sheet.heightMm * scale}
                  className="sheet-outline"
                />
                {sheet.parts.map((part) => (
                  <g key={part.partId}>
                    <rect
                      x={part.x * scale}
                      y={part.y * scale}
                      width={part.widthMm * scale}
                      height={part.heightMm * scale}
                      className={part.shape === "trapezoid" ? "packed-part trapezoid-part" : "packed-part"}
                    />
                    <text
                      x={(part.x + part.widthMm / 2) * scale}
                      y={(part.y + part.heightMm / 2) * scale}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {part.partId}
                    </text>
                  </g>
                ))}
              </svg>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
