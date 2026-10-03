import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {localizedMetadata} from "@/lib/seo";
import {getPracticalModel} from "@/data/practical-models";
import {compilePracticalModel} from "@/lib/practical/compiler";
import {emergencyOptions} from "@/lib/emergency";
import {EmergencyChooser, type EmergencyCard} from "@/components/emergency-chooser";
import {PrintPlanButton} from "@/components/print-plan-button";
import {upgradeChain} from "@/data/upgrades";
import {catalogEntry} from "@/lib/catalog/entries";
import {sources} from "@/data/sources";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Hitno sklonište za mačke i pse",
    titleEn: "Emergency shelter for cats and dogs",
    descriptionSr: "Šta napraviti večeras od kartonske kutije, plastične kutije, stiropora ili transportera, uz jasna ograničenja hitnih rešenja.",
    descriptionEn: "What to build tonight from a cardboard box, a plastic tote, a foam box or a carrier, with the clear limits of emergency solutions.",
    srPath: "/sr/hitno",
    enPath: "/en/emergency"
  });
}

export default async function EmergencyPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";

  const cards: Record<string, EmergencyCard> = {};
  for (const option of emergencyOptions) {
    const model = getPracticalModel(option.slug);
    if (!model) continue;
    const compiled = compilePracticalModel(model);
    cards[option.slug] = {
      slug: option.slug,
      nameSr: model.translations.sr.name,
      nameEn: model.translations.en.name,
      steps: compiled.steps.map(({titleSr, titleEn, detailSr, detailEn}) => ({titleSr, titleEn, detailSr, detailEn}))
    };
  }
  const chain = upgradeChain("emergency-cardboard-dry").map((slug) => catalogEntry(slug)).filter((entry) => entry !== undefined);
  const sourceList = ["aspcapro-community-cat-winter", "alleycat-straw-not-hay", "alleycat-cold-weather"].map((id) => sources[id]);

  return (
    <article className="page-hero emergency-page">
      <div className="shell">
        <span className="kicker emergency-kicker">{isSr ? "Hitno" : "Emergency"}</span>
        <h1>{isSr ? "Treba mi sklonište odmah" : "I need a shelter now"}</h1>
        <p className="page-lead">
          {isSr
            ? "Označite šta imate pri ruci i dobićete najtrajnije rešenje koje se od toga može napraviti, sa koracima. Ovo su hitna rešenja: služe dok ne napravite pravo sklonište."
            : "Tick what you have at hand and get the most durable solution you can make from it, with steps. These are emergency solutions: they bridge the gap until you build a real shelter."}
        </p>

        <div className="emergency-only emergency-rules" role="note">
          <strong>{isSr ? "SAMO HITNO" : "EMERGENCY ONLY"}</strong>
          <ul>
            <li>{isSr ? "Mora ostati suvo; karton koji se navlaži odmah zamenite." : "It must stay dry; replace cardboard as soon as it gets damp."}</li>
            <li>{isSr ? "Podignite ga od tla (cigle, blokovi, paleta)." : "Raise it off the ground (bricks, blocks, a pallet)."}</li>
            <li>{isSr ? "Slama, ne seno, peškiri ni ćebad." : "Straw, not hay, towels or blankets."}</li>
            <li>{isSr ? "Folija ide samo spolja i nikada ne zatvara ulaz." : "Film goes only on the outside and never closes the entrance."}</li>
            <li>{isSr ? "Bez sijalica, grejača i improvizovanog grejanja." : "No light bulbs, heaters or improvised heating."}</li>
            <li>{isSr ? "Pregledajte svaki dan i što pre pređite na trajno vodootporno sklonište." : "Check every day and move to a durable waterproof shelter as soon as possible."}</li>
          </ul>
        </div>

        <EmergencyChooser locale={locale} cards={cards} />

        <section className="section-inline emergency-path">
          <span className="kicker">{isSr ? "Posle hitnog rešenja" : "After the emergency"}</span>
          <h2>{isSr ? "Putanja do trajnog skloništa" : "The path to a durable shelter"}</h2>
          <ol className="path-scale">
            {chain.map((entry) => (
              <li key={entry.slug} className={`path-step class-border-${entry.designClass.toLowerCase()}`}>
                <Link href={{pathname: "/models/[slug]", params: {slug: entry.slug}}}>{isSr ? entry.nameSr : entry.nameEn}</Link>
              </li>
            ))}
          </ol>
          <p className="section-intro">
            {isSr ? "Svaki korak dodaje zaštitu, a na stranici modela piše šta dodajete, šta dobijate i šta ostaje ograničenje." : "Each step adds protection; every model page says what you add, what you gain and what stays limited."}
          </p>
        </section>

        <section className="section-inline emergency-print" aria-labelledby="emergency-card-title">
          <div className="emergency-print-head">
            <h2 id="emergency-card-title">{isSr ? "Kartica za štampu" : "Printable card"}</h2>
            <PrintPlanButton locale={locale} />
          </div>
          <div className="emergency-cards">
            {Object.values(cards).map((card) => (
              <article key={card.slug} className="emergency-card">
                <h3>{isSr ? card.nameSr : card.nameEn}</h3>
                <ol>
                  {card.steps.map((step) => (
                    <li key={step.titleEn}><strong>{isSr ? step.titleSr : step.titleEn}.</strong> {isSr ? step.detailSr : step.detailEn}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="section-inline">
          <span className="kicker">{isSr ? "Izvori" : "Sources"}</span>
          <ul className="plain-list">
            {sourceList.map((source) => (
              <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher} · {source.title}</a></li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
