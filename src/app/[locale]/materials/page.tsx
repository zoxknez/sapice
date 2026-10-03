import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {materialLibrary} from "@/data/material-library";
import {sources} from "@/data/sources";
import {localizedMetadata} from "@/lib/seo";
import {materialNote} from "@/lib/model-presentation";
import {evaluateSubstitute, substituteCandidates, substituteRoleFor} from "@/lib/catalog/substitutes";
import {SubstituteExplorer, type SubstituteTable} from "@/components/substitute-explorer";
import {materialCategoryLabel, unitLabel} from "@/components/catalog/units";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Materijali",
    titleEn: "Materials",
    descriptionSr: "Biblioteka materijala za skloništa: toplotna provodljivost sa izvorom ili oznakom nepoznato, ograničenja za kontakt sa životinjom, otpornost na vodu i zamene.",
    descriptionEn: "A shelter material library: sourced thermal conductivity or an explicit unknown, animal-contact limits, water resistance and substitutes.",
    srPath: "/sr/materijali",
    enPath: "/en/materials"
  });
}

const thicknesses = [20, 30, 40, 50, 60, 80, 100];

export default async function MaterialsPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";
  const list = Object.values(materialLibrary);
  const categories = [...new Set(list.map((material) => material.category))];

  const table: SubstituteTable = {};
  for (const [from, candidates] of Object.entries(substituteCandidates)) {
    const fromMaterial = materialLibrary[from];
    table[from] = {
      nameSr: fromMaterial.nameSr,
      nameEn: fromMaterial.nameEn,
      byThickness: Object.fromEntries(thicknesses.map((thickness) => [thickness, candidates.map((to) => {
        const result = evaluateSubstitute(from, to, substituteRoleFor(from), thickness);
        return {
          toId: to,
          toNameSr: materialLibrary[to].nameSr,
          toNameEn: materialLibrary[to].nameEn,
          kind: result.kind,
          requiredThicknessMm: result.kind === "THERMAL_EQUIVALENT" ? result.requiredThicknessMm : null,
          conservativeThicknessMm: result.kind === "THERMAL_EQUIVALENT" ? result.conservativeThicknessMm : null,
          targetR: result.kind === "THERMAL_EQUIVALENT" ? result.targetRm2KW : null,
          noteSr: result.kind === "THERMAL_EQUIVALENT" ? "" : result.reasonSr,
          noteEn: result.kind === "THERMAL_EQUIVALENT" ? "" : result.reasonEn
        };
      })]))
    };
  }
  const sample = evaluateSubstitute("xps", "eps", "INSULATION", 50);
  const caveatsSr = sample.kind === "THERMAL_EQUIVALENT" ? sample.caveatsSr : [];
  const caveatsEn = sample.kind === "THERMAL_EQUIVALENT" ? sample.caveatsEn : [];

  const facing = {ALLOWED: isSr ? "Može biti unutrašnja površina" : "May face the animal", PROTECTED_ONLY: isSr ? "Samo iza zaštitne obloge" : "Only behind a protective lining", NEVER: isSr ? "Nikada dostupno životinji" : "Never reachable by the animal"};
  const level = {LOW: isSr ? "niska" : "low", MEDIUM: isSr ? "srednja" : "medium", HIGH: isSr ? "visoka" : "high"};
  const durability = {SHORT_TERM: isSr ? "kratkotrajno" : "short term", SEASONAL: isSr ? "jedna do dve sezone" : "one or two seasons", MULTI_YEAR: isSr ? "više godina" : "several years"};

  return (
    <section className="page-hero materials-page">
      <div className="shell">
        <span className="kicker">{isSr ? "Biblioteka materijala" : "Material library"}</span>
        <h1>{isSr ? "Materijali" : "Materials"}</h1>
        <p className="page-lead">
          {isSr
            ? "Za svaki materijal piše šta zna izvor, a šta ne. Kada toplotna provodljivost nije izvorovana, piše „nepoznato” i takav sloj se ne računa. Tehnički list konkretnog proizvoda uvek ima prednost."
            : "Each material states what a source knows and what it does not. When thermal conductivity is not sourced it says “unknown” and that layer is not calculated. A specific product datasheet always takes precedence."}
        </p>

        <section className="section-inline">
          <span className="kicker">{isSr ? "Zamene" : "Substitutes"}</span>
          <h2>{isSr ? "Nemate ovaj materijal?" : "Don't have this material?"}</h2>
          <p className="section-intro">{isSr ? "Za izolaciju sa izvorovanom λ računa se debljina za približno isti otpor sloja (R = d / λ). To nije ista konstrukcija." : "For insulation with a sourced λ the thickness for about the same layer resistance (R = d / λ) is calculated. That is not the same construction."}</p>
          <SubstituteExplorer locale={locale} table={table} thicknesses={thicknesses} caveatsSr={caveatsSr} caveatsEn={caveatsEn} />
        </section>

        {categories.map((category) => (
          <section key={category} className="section-inline">
            <h2 className="material-category">{materialCategoryLabel(category, locale)}</h2>
            <div className="material-cards">
              {list.filter((material) => material.category === category).map((material) => (
                <article key={material.id} id={`material-${material.id}`}>
                  <span className="kicker">{unitLabel(material.inventoryUnit, locale)}</span>
                  <h3>{isSr ? material.nameSr : material.nameEn}</h3>
                  <div className="material-thermal">
                    {material.thermal.status === "KNOWN" ? (
                      <>
                        <strong>λ ≈ {material.thermal.lambdaPlanningWmK} W/mK</strong>
                        <span>
                          {material.thermal.lambdaRangeWmK ? `${isSr ? "raspon" : "range"} ${material.thermal.lambdaRangeWmK[0]}–${material.thermal.lambdaRangeWmK[1]} W/mK · ` : ""}
                          {material.thermal.basis === "PRODUCT_DECLARED" ? (isSr ? "deklarisano za proizvod" : "product declared") : (isSr ? "generička planska vrednost" : "generic planning value")}
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>{material.thermal.status === "UNKNOWN" ? (isSr ? "λ nepoznato" : "λ unknown") : (isSr ? "Ne računa se" : "Not modelled")}</strong>
                        <span>{isSr ? material.thermal.reasonSr : material.thermal.reasonEn}</span>
                      </>
                    )}
                  </div>
                  <dl className="material-props">
                    <div><dt>{isSr ? "Kontakt sa životinjom" : "Animal contact"}</dt><dd className={`facing-${material.animalFacing.toLowerCase()}`}>{facing[material.animalFacing]}</dd></div>
                    <div><dt>{isSr ? "Otpornost na vodu" : "Water resistance"}</dt><dd>{level[material.waterResistance]}</dd></div>
                    <div><dt>{isSr ? "Osetljivost na vlagu" : "Moisture sensitivity"}</dt><dd>{level[material.moistureSensitivity]}</dd></div>
                    <div><dt>{isSr ? "Trajnost" : "Durability"}</dt><dd>{durability[material.durability]}</dd></div>
                  </dl>
                  {(isSr ? material.limitationsSr : material.limitationsEn).length > 0 && (
                    <ul className="plain-list warn-list">{(isSr ? material.limitationsSr : material.limitationsEn).map((item) => <li key={item}>{item}</li>)}</ul>
                  )}
                  <p>{materialNote(material.id, locale) ?? (isSr ? material.notesSr : material.notesEn)}</p>
                  {material.reuseInspectionRequired && <Link href="/reuse" className="text-link">{isSr ? "Kontrolna lista za iskorišćen materijal" : "Reused material checklist"} <span aria-hidden="true">→</span></Link>}
                  <div className="material-source-links">
                    {[...new Set([...(material.thermal.status === "KNOWN" ? material.thermal.sourceIds : []), ...material.sourceIds])].map((sourceId) => {
                      const source = sources[sourceId];
                      return source ? <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">{source.publisher} · {source.title}</a> : null;
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <p className="metric-disclaimer">{isSr ? "Kvalitativne osobine (otpornost na vodu, trajnost, težina sečenja) su projektantske pretpostavke Šapica, osim gde je naveden izvor." : "Qualitative properties (water resistance, durability, cutting difficulty) are Šapice design assumptions unless a source is listed."}</p>
      </div>
    </section>
  );
}
