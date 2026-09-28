import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {shelterModels} from "@/data/models";
import {ModelCard} from "@/components/model-card";
import {ModelThumbnail} from "@/components/model-thumbnail";
import {StructuredData} from "@/components/structured-data";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {siteUrl} from "@/lib/seo";

export default async function HomePage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Home"});
  const featuredSlugs = ["nordic-quad-winter", "alpine-medium-winter", "alpine-large-heated"];
  const featured = featuredSlugs
    .map((slug) => shelterModels.find((model) => model.slug === slug))
    .filter((model): model is (typeof shelterModels)[number] => Boolean(model));
  const featuredSummaries = modelComparisonSummaryMap(featured);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Šapice",
    url: `${siteUrl}/${locale}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: locale === "sr" ? "sr-Latn" : "en",
    description: locale === "sr"
      ? "Deterministička web aplikacija za izbor i izradu unapred definisanih zimskih kućica za pse i mačke."
      : "Deterministic web application for selecting and building predefined winter shelters for cats and dogs.",
    featureList: locale === "sr"
      ? [
        "Parametarski 3D prikaz",
        "Tehničke mere",
        "Krojne liste",
        "Raspored delova na ploče",
        "Termičke procene",
        "Troškovnik",
        "Vodič za izradu u radionici"
      ]
      : [
        "Parametric 3D",
        "Technical dimensions",
        "Cut lists",
        "Sheet nesting",
        "Thermal estimates",
        "Cost profiles",
        "Workshop build mode"
      ]
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="kicker">{t("eyebrow")}</span>
            <h1>{t("title")}</h1>
            <p>{t("lead")}</p>
            <div className="hero-actions">
              <Link href="/finder" locale={locale} className="button primary">{t("primary")}</Link>
              <Link href="/models" locale={locale} className="button secondary">{t("secondary")}</Link>
            </div>
            <div className="trust-row">
              <span><strong>{shelterModels.length}</strong>{locale === "sr" ? "gotovih modela" : "ready models"}</span>
              <span><strong>SR + EN</strong>{locale === "sr" ? "dva jezika" : "two languages"}</span>
              <span><strong>3D</strong>{locale === "sr" ? "iz stvarnih mera" : "from real dimensions"}</span>
              <span><strong>0 AI</strong>{locale === "sr" ? "pri izradi plana" : "at plan runtime"}</span>
            </div>
          </div>
          {featured[0] && (
            <Link href={{pathname: "/models/[slug]", params: {slug: featured[0].slug}}} locale={locale} className="hero-showcase">
              <div className="hero-showcase-top">
                <span>{locale === "sr" ? "Iz biblioteke modela" : "From the model library"}</span>
                <span>01 / {String(shelterModels.length).padStart(2, "0")}</span>
              </div>
              <ModelThumbnail model={featured[0]} locale={locale} summary={featuredSummaries[featured[0].id]} />
              <div className="hero-showcase-bottom">
                <div>
                  <small>{locale === "sr" ? "ISTAKNUTI MODEL" : "FEATURED MODEL"}</small>
                  <strong>{featured[0].translations[locale].name}</strong>
                  <span>{featured[0].dimensions.widthMm} × {featured[0].dimensions.depthMm} × {featured[0].dimensions.frontHeightMm} mm</span>
                </div>
                <span className="hero-showcase-arrow" aria-hidden="true">↗</span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="principles">
        <div className="shell principles-grid">
          <article>
            <span>01</span>
            <h2>{locale === "sr" ? "Jedan izvor istine" : "One source of truth"}</h2>
            <p>{locale === "sr" ? "Iste dimenzije pokreću 3D, crteže, materijale i proračune." : "The same dimensions drive 3D, drawings, materials and calculations."}</p>
          </article>
          <article>
            <span>02</span>
            <h2>{locale === "sr" ? "Bez lažne preciznosti" : "No false precision"}</h2>
            <p>{locale === "sr" ? "Procene su jasno odvojene od izvora, geometrije i fizičkih testova." : "Estimates are clearly separated from sources, geometry and physical tests."}</p>
          </article>
          <article>
            <span>03</span>
            <h2>{locale === "sr" ? "Napravljeno za radionicu" : "Built for the workshop"}</h2>
            <p>{locale === "sr" ? "Planovi su namenjeni stvarnoj izradi, ne samo lepim renderima." : "Plans are intended for real builds, not just attractive renders."}</p>
          </article>
        </div>
      </section>

      <section className="section capability-section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Od modela do radionice" : "From model to workshop"}</span>
              <h2>{locale === "sr" ? "Jedan model, kompletan tok izrade" : "One model, a complete build workflow"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Nema odvojenih marketinških i tehničkih mera. Isti kanonski model pokreće prikaz, krojnu listu, proračune i vodič za izradu."
                : "There are no separate marketing and technical dimensions. The same canonical model drives the view, cut list, calculations and build guide."}
            </p>
          </div>

          <div className="capability-grid">
            <article>
              <span>01</span>
              <h3>{locale === "sr" ? "3D + tehničke mere" : "3D + technical dimensions"}</h3>
              <p>{locale === "sr" ? "Parametarski 3D prikaz kućice bez krova i u rastavljenim delovima, uz SVG tehnički crtež iz istih dimenzija." : "Parametric 3D, roof-off/exploded views and SVG technical drawings from the same dimensions."}</p>
            </article>
            <article>
              <span>02</span>
              <h3>{locale === "sr" ? "Krojna lista i raspored delova" : "Cut list + nesting"}</h3>
              <p>{locale === "sr" ? "Delovi od ploča debljine 12 mm i 9 mm i od XPS-a raspoređuju se na ploče, uz uračunatu marginu i širinu reza." : "12 mm, 9 mm and XPS parts are compiled and packed into planning stock with margins and kerf."}</p>
            </article>
            <article>
              <span>03</span>
              <h3>{locale === "sr" ? "Drveni ram i okov" : "Framing + hardware"}</h3>
              <p>{locale === "sr" ? "Dužine elemenata rama, servisni krov, šarke, zatvarači i preliminarni raspored pričvršćivača." : "Framing lengths, service roof, hinges, latches and a provisional fastening schedule."}</p>
            </article>
            <article>
              <span>04</span>
              <h3>{locale === "sr" ? "Troškovnik bez izmišljenih cena" : "Costing without fabricated prices"}</h3>
              <p>{locale === "sr" ? "Količine automatski proračunava kompajler plana, a korisnik unosi lokalne cene i valutu." : "Quantities come from the compiler while the user enters real local prices and currency."}</p>
            </article>
            <article>
              <span>05</span>
              <h3>{locale === "sr" ? "Režim izrade za radionicu" : "Workshop build mode"}</h3>
              <p>{locale === "sr" ? "Koraci izrade sa lokalno sačuvanim napretkom, fokusiranim prikazom i izlazom za štampu ili PDF." : "Build steps with locally saved progress, focus mode and print/PDF output."}</p>
            </article>
            <article>
              <span>06</span>
              <h3>{locale === "sr" ? "Rad bez mreže" : "Offline for visited plans"}</h3>
              <p>{locale === "sr" ? "Lokalna keš memorija čuva već otvorene stranice i modele kada u radionici nema stabilne internet veze." : "The PWA cache keeps previously visited models available when workshop connectivity is unreliable."}</p>
            </article>
          </div>

          <div className="validation-banner">
            <div>
              <span className="kicker">{locale === "sr" ? "Nivoi validacije" : "Validation ladder"}</span>
              <strong>DATA_VALIDATED → GEOMETRY_VALIDATED → ENGINEERING_REVIEWED → PROTOTYPE_BUILT → FIELD_TESTED</strong>
            </div>
            <Link href="/methodology" locale={locale} className="button secondary">
              {locale === "sr" ? "Kako radi validacija" : "How validation works"}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Izdvojeni modeli" : "Reference set"}</span>
              <h2>{t("catalogTitle")}</h2>
            </div>
            <p>{t("catalogLead")}</p>
          </div>
          <div className="model-grid">
            {featured.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                locale={locale}
                summary={featuredSummaries[model.id]}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
