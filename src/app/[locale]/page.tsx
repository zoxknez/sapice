import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {shelterModels} from "@/data/models";
import {CatalogCard} from "@/components/catalog/catalog-card";
import {ModelThumbnail} from "@/components/model-thumbnail";
import {StructuredData} from "@/components/structured-data";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {siteUrl} from "@/lib/seo";
import {catalogEntries} from "@/lib/catalog/entries";
import {designClasses, taxonomyLabel} from "@/lib/catalog/taxonomy";
import {landingTopics} from "@/data/landing-topics";
import {validationStateSchema} from "@/lib/domain";
import {validationStageLabel} from "@/lib/validation-labels";
import {modelName} from "@/lib/model-presentation";

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
  const entries = catalogEntries();

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
              <Link href="/build-with-what-you-have" locale={locale} className="button secondary">{locale === "sr" ? "Napravi od onoga što imaš" : "Build with what you have"}</Link>
            </div>
            <div className="hero-secondary-links">
              <Link href="/budget" locale={locale}>{locale === "sr" ? "Budžetska skloništa" : "Budget builds"}</Link>
              <Link href="/emergency" locale={locale} className="hero-emergency-link">{locale === "sr" ? "Treba mi sklonište odmah" : "I need a shelter now"}</Link>
              <Link href="/models" locale={locale}>{t("secondary")}</Link>
            </div>
            <div className="trust-row">
              <span><strong>{entries.length}</strong>{locale === "sr" ? "modela, od hitnih do inženjerskih" : "models, emergency to engineered"}</span>
              <span><strong>SR + EN</strong>{locale === "sr" ? "dva jezika" : "two languages"}</span>
              <span><strong>{locale === "sr" ? "Vaše cene" : "Your prices"}</strong>{locale === "sr" ? "bez izmišljenih cena" : "no invented prices"}</span>
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
                  <strong>{modelName(featured[0], locale)}</strong>
                  <span>{featured[0].dimensions.widthMm} × {featured[0].dimensions.depthMm} × {featured[0].dimensions.frontHeightMm} mm</span>
                </div>
                <span className="hero-showcase-arrow" aria-hidden="true">↗</span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="journeys" aria-labelledby="journeys-title">
        <div className="shell">
          <h2 id="journeys-title" className="sr-only">{locale === "sr" ? "Odakle krećete" : "Where you are starting from"}</h2>
          <div className="journey-grid">
            <Link href="/finder" locale={locale} className="journey journey-precise">
              <span className="journey-q">{locale === "sr" ? "„Hoću gotov precizan model”" : "“I want a ready, precise model”"}</span>
              <span>{locale === "sr" ? "Pronađite sklonište po životinji, sezoni, prostoru, alatu i vremenu." : "Find a shelter by animal, season, space, tools and time."}</span>
              <strong>{locale === "sr" ? "Pronađi sklonište" : "Find a shelter"} →</strong>
            </Link>
            <Link href="/budget" locale={locale} className="journey journey-budget">
              <span className="journey-q">{locale === "sr" ? "„Imam određeni budžet”" : "“I have a set budget”"}</span>
              <span>{locale === "sr" ? "Unesite iznos i svoje cene; vidite šta staje i koliko košta po životinji." : "Enter an amount and your prices; see what fits and the cost per animal."}</span>
              <strong>{locale === "sr" ? "Budžetska skloništa" : "Budget builds"} →</strong>
            </Link>
            <Link href="/build-with-what-you-have" locale={locale} className="journey journey-reuse">
              <span className="journey-q">{locale === "sr" ? "„Imam neke materijale, šta mogu od njih?”" : "“I have some materials, what can I make?”"}</span>
              <span>{locale === "sr" ? "Palete, daske, kutije, ostaci ploča: vidite šta imate, a šta treba dokupiti." : "Pallets, boards, totes, sheet offcuts: see what you have and what to buy."}</span>
              <strong>{locale === "sr" ? "Napravi od onoga što imaš" : "Build with what you have"} →</strong>
            </Link>
            <Link href="/emergency" locale={locale} className="journey journey-emergency">
              <span className="journey-q">{locale === "sr" ? "„Treba mi nešto odmah”" : "“I need something now”"}</span>
              <span>{locale === "sr" ? "Hitno rešenje od onoga što je pri ruci, uz jasna ograničenja." : "An emergency solution from what is at hand, with clear limits."}</span>
              <strong>{locale === "sr" ? "Hitno sklonište" : "Emergency shelter"} →</strong>
            </Link>
          </div>

          <div className="class-scale">
            <span className="kicker">{locale === "sr" ? "Klase konstrukcija" : "Design classes"}</span>
            <ol>
              {designClasses.map((designClass) => (
                <li key={designClass} className={`class-border-${designClass.toLowerCase()}`}>
                  <Link href={{pathname: "/models", query: {class: designClass}}} locale={locale}>
                    <strong>{taxonomyLabel("designClass", designClass, locale)}</strong>
                    <small>{entries.filter((entry) => entry.designClass === designClass).length} {locale === "sr" ? "modela" : "models"}</small>
                  </Link>
                </li>
              ))}
            </ol>
            <p>{locale === "sr" ? "Ovo nije skala od lošeg ka dobrom: klase imaju različita ograničenja i namene. Koliko je model stvarno proveren pokazuje poseban status validacije." : "This is not a bad-to-good scale: classes have different constraints and purposes. How far a model is actually verified is shown by a separate validation status."}</p>
          </div>
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
              <strong>{validationStateSchema.options.map((state) => validationStageLabel(state, locale)).join(" → ")}</strong>
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
            {["tote-in-tote-straw", "osb-economy-dog-medium", "nordic-quad-winter"].map((slug) => entries.find((entry) => entry.slug === slug)).filter((entry) => entry !== undefined).map((entry) => (
              <CatalogCard
                key={entry.id}
                entry={entry}
                locale={locale}
                engineered={entry.kind === "ENGINEERED" ? {model: featured.find((model) => model.slug === entry.slug) ?? featured[0], summary: featuredSummaries[(featured.find((model) => model.slug === entry.slug) ?? featured[0]).id]} : undefined}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="section tone-soft">
        <div className="shell">
          <span className="kicker">{locale === "sr" ? "Tematski planovi" : "Topic plans"}</span>
          <h2>{locale === "sr" ? "Česta pitanja, gotovi planovi" : "Common questions, ready plans"}</h2>
          <ul className="topic-link-grid">
            {landingTopics.map((topic) => (
              <li key={topic.id}>
                <Link href={{pathname: "/plans/[topic]", params: {topic: locale === "sr" ? topic.slugSr : topic.slugEn}}} locale={locale}>
                  {locale === "sr" ? topic.titleSr : topic.titleEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
