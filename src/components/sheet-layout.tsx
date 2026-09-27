import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel, CutPart} from "@/lib/compiler";
import {packCutParts} from "@/lib/nesting";

type StockProfile = {
  id: string;
  titleSr: string;
  titleEn: string;
  material: CutPart["material"];
  widthMm: number;
  heightMm: number;
  kerfMm: number;
  marginMm: number;
};

const stockProfiles: StockProfile[] = [
  {
    id: "plywood-12",
    titleSr: "Šperploča 12 mm",
    titleEn: "Plywood 12 mm",
    material: "plywood-12",
    widthMm: 2500,
    heightMm: 1250,
    kerfMm: 3,
    marginMm: 10
  },
  {
    id: "plywood-9",
    titleSr: "Šperploča 9 mm",
    titleEn: "Plywood 9 mm",
    material: "plywood-9",
    widthMm: 2500,
    heightMm: 1250,
    kerfMm: 3,
    marginMm: 10
  },
  {
    id: "xps",
    titleSr: "XPS izolacija",
    titleEn: "XPS insulation",
    material: "xps",
    widthMm: 1250,
    heightMm: 600,
    kerfMm: 2,
    marginMm: 5
  }
];

function StockLayout({
  profile,
  parts,
  locale
}: {
  profile: StockProfile;
  parts: CutPart[];
  locale: AppLocale;
}) {
  const sheets = packCutParts(parts, {
    sheetWidthMm: profile.widthMm,
    sheetHeightMm: profile.heightMm,
    kerfMm: profile.kerfMm,
    marginMm: profile.marginMm
  });

  const scale = Math.min(0.22, 520 / profile.widthMm);

  return (
    <section className="stock-layout">
      <header className="stock-layout-head">
        <div>
          <span className="kicker">{profile.widthMm} × {profile.heightMm} mm</span>
          <h3>{locale === "sr" ? profile.titleSr : profile.titleEn}</h3>
        </div>
        <div className="sheet-summary">
          <strong>{sheets.length}</strong>
          <span>{locale === "sr" ? "tabla / ploča" : "sheets / boards"}</span>
        </div>
      </header>

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
              aria-label={locale === "sr"
                ? `Raspored delova na tabli ${sheet.index + 1}`
                : `Part layout on sheet ${sheet.index + 1}`}
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
    </section>
  );
}

export function SheetLayout({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const layouts = stockProfiles
    .map((profile) => ({
      profile,
      parts: compiled.cutParts.filter((part) => part.material === profile.material)
    }))
    .filter((item) => item.parts.length > 0);

  return (
    <section className="section tone-soft" id="nesting">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">Sheet planning · deterministic V1</span>
            <h2>{locale === "sr" ? "Raspored na tablama" : "Sheet layout"}</h2>
          </div>
          <p>
            {locale === "sr"
              ? "Svaki materijal se pakuje posebno sa kerf-om i marginom. Trapezni delovi se trenutno pakuju po bounding-box-u, pa prikaz nije polygon-optimalni nesting. Stock formati su planerski default i treba ih proveriti kod lokalnog dobavljača."
              : "Each material is packed separately with kerf and margins. Trapezoid parts currently pack by bounding box, so this is not polygon-optimal nesting. Stock formats are planning defaults and should be checked with the local supplier."}
          </p>
        </div>

        <div className="stock-layouts">
          {layouts.map(({profile, parts}) => (
            <StockLayout
              key={profile.id}
              profile={profile}
              parts={parts}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
