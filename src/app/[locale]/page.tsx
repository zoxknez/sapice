import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {shelterModels} from "@/data/models";
import {ModelCard} from "@/components/model-card";

export default async function HomePage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Home"});
  const featured = shelterModels.slice(0, 3);

  return (
    <>
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
              <span><strong>SR + EN</strong>bilingual</span>
              <span><strong>3D</strong>parametric</span>
              <span><strong>0 AI</strong>runtime</span>
            </div>
          </div>
          <div className="hero-object" aria-hidden="true">
            <div className="house-illustration">
              <div className="house-roof" />
              <div className="house-body">
                <div className="house-door" />
                <div className="house-section-lines" />
              </div>
              <div className="dimension dimension-w">1200 mm</div>
              <div className="dimension dimension-h">650 mm</div>
            </div>
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

      <section className="section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Reference set</span>
              <h2>{t("catalogTitle")}</h2>
            </div>
            <p>{t("catalogLead")}</p>
          </div>
          <div className="model-grid">
            {featured.map((model) => <ModelCard key={model.id} model={model} locale={locale} />)}
          </div>
        </div>
      </section>
    </>
  );
}
