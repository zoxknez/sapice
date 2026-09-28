import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {materials} from "@/data/materials";
import {sources} from "@/data/sources";
import {localizedMetadata} from "@/lib/seo";


export async function generateMetadata({
  params
}: {
  params: Promise<{locale: AppLocale}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Materijali",
    titleEn: "Materials",
    descriptionSr: "Biblioteka materijala i projektantskih termičkih vrednosti korišćenih u Šapice modelima.",
    descriptionEn: "Material library and design thermal values used by Šapice shelter models.",
    srPath: "/sr/materijali",
    enPath: "/en/materials"
  });
}

export default async function MaterialsPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{locale === "sr" ? "Biblioteka materijala" : "Material library"}</span>
        <h1>{locale === "sr" ? "Materijali" : "Materials"}</h1>
        <p className="page-lead">
          {locale === "sr"
            ? "Projektantske vrednosti su rasponi, ne univerzalne konstante. Finalni projekat treba da koristi tehnički list konkretnog proizvoda."
            : "Design values are ranges, not universal constants. Final builds should use the selected product data sheet."}
        </p>
        <div className="material-cards">
          {Object.values(materials).map((material) => (
            <article key={material.id}>
              <span className="kicker">{material.id.toUpperCase()}</span>
              <h2>{locale === "sr" ? material.nameSr : material.nameEn}</h2>
              <div className="material-thermal">
                <strong>λ ≈ {material.lambdaTypicalWmK} W/mK</strong>
                <span>{locale === "sr" ? "raspon" : "range"} {material.lambdaRangeWmK[0]}–{material.lambdaRangeWmK[1]} W/mK</span>
              </div>
              {material.lambdaByThicknessMm && (
                <div className="lambda-chips">
                  {Object.entries(material.lambdaByThicknessMm).map(([thickness, lambda]) => (
                    <span key={thickness}>{thickness} mm → {lambda} W/mK</span>
                  ))}
                </div>
              )}
              <p>{locale === "sr" ? material.notesSr : material.notesEn}</p>
              <div className="material-source-links">
                {material.sourceIds.map((sourceId) => {
                  const source = sources[sourceId];
                  if (!source) return null;
                  return (
                    <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">
                      {source.publisher} · {source.title}
                    </a>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
