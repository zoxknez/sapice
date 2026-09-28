import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel, CutPart} from "@/lib/compiler";
import {packCutParts, type PackedPart} from "@/lib/nesting";

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

function PackedPartShape({
  part,
  scale
}: {
  part: PackedPart;
  scale: number;
}) {
  const x = part.x * scale;
  const y = part.y * scale;
  const sourceW = part.sourceWidthMm * scale;
  const sourceH = part.sourceHeightMm * scale;
  const transform = part.rotated
    ? `translate(${x + sourceH} ${y}) rotate(90)`
    : `translate(${x} ${y})`;

  const shape =
    part.shape === "trapezoid" &&
    part.trapezoidRearHeightMm !== undefined ? (
      <polygon
        points={[
          "0,0",
          `${sourceW},${(part.sourceHeightMm - part.trapezoidRearHeightMm) * scale}`,
          `${sourceW},${sourceH}`,
          `0,${sourceH}`
        ].join(" ")}
        className="packed-part packed-part-actual"
      />
    ) : (
      <rect
        x="0"
        y="0"
        width={sourceW}
        height={sourceH}
        className="packed-part packed-part-actual"
      />
    );

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={part.widthMm * scale}
        height={part.heightMm * scale}
        className="packed-envelope"
      />
      <g transform={transform}>
        {shape}
        {(part.cutouts ?? []).map((cutout, index) => (
          <rect
            key={index}
            x={cutout.xMm * scale}
            y={(part.sourceHeightMm - cutout.yMm - cutout.heightMm) * scale}
            width={cutout.widthMm * scale}
            height={cutout.heightMm * scale}
            rx={cutout.radiusMm * scale}
            className="packed-cutout"
          />
        ))}
        <text
          x={sourceW / 2}
          y={sourceH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="packed-label"
        >
          {part.partId}
        </text>
      </g>
    </g>
  );
}

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
          <span className="kicker">
            {profile.widthMm} × {profile.heightMm} mm · {locale === "sr" ? "širina reza" : "kerf"} {profile.kerfMm} mm · {locale === "sr" ? "margina" : "margin"} {profile.marginMm} mm
          </span>
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
              <span>
                {Math.round(sheet.materialUtilization * 100)}% {locale === "sr" ? "materijal" : "material"} ·{" "}
                {Math.round(sheet.packingEnvelopeUtilization * 100)}% {locale === "sr" ? "rezervisani prostor" : "envelope"}
              </span>
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
                <PackedPartShape key={part.partId} part={part} scale={scale} />
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
            <span className="kicker">
              {locale === "sr" ? "Planiranje materijala · deterministički V1" : "Sheet planning · deterministic V1"}
            </span>
            <h2>{locale === "sr" ? "Raspored na tablama" : "Sheet layout"}</h2>
          </div>
          <p>
            {locale === "sr"
              ? "Stvarna geometrija dela prikazana je punom linijom, a isprekidani pravougaonik predstavlja konzervativni prostor potreban za pakovanje. V1 slaže trapeze prema pravougaoniku koji ih obuhvata, pa raspored nije optimalan prema obliku poligona. Procenat materijala meri stvarnu površinu delova, a procenat rezervisanog prostora meri prostor koji koristi algoritam."
              : "Actual part geometry is shown with a solid outline while the dashed rectangle is the conservative packing envelope. V1 still packs trapezoids by bounding box, so it is not polygon-optimal nesting. Material % measures actual part area; envelope % is the space reserved by the algorithm."}
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
