import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {localizedMetadata} from "@/lib/seo";
import {sources} from "@/data/sources";
import {catalogEntries} from "@/lib/catalog/entries";
import {ReuseChecklist} from "@/components/field/reuse-checklist";
import {DesignClassTag} from "@/components/catalog/badges";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Palete, stare daske i iskorišćen materijal",
    titleEn: "Pallets, old boards and reused material",
    descriptionSr: "Kako proveriti palete (ISPM 15, HT, MB), stare daske, sanduke i kutije pre izrade skloništa i kako bez novca i uz dozvolu nabaviti materijal.",
    descriptionEn: "How to check pallets (ISPM 15, HT, MB), old boards, crates and containers before building a shelter and how to source material for free with permission.",
    srPath: "/sr/ponovna-upotreba",
    enPath: "/en/reuse"
  });
}

export default async function ReusePage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";
  const reuseModels = catalogEntries().filter((entry) => entry.designClass === "REUSE");
  const cite = (id: string) => sources[id];

  return (
    <article className="page-hero reuse-page">
      <div className="shell">
        <span className="kicker">{isSr ? "Ponovna upotreba" : "Reuse"}</span>
        <h1>{isSr ? "Palete, daske, sanduci i kutije" : "Pallets, boards, crates and containers"}</h1>
        <p className="page-lead">
          {isSr
            ? "Iskorišćen materijal može biti odličan za sklonište, ali samo ako znate odakle je i u kakvom je stanju. Kontrolna lista je vaša provera, ne sertifikat."
            : "Reused material can make a great shelter, but only if you know where it came from and what state it is in. The checklist is your own check, not a certificate."}
        </p>

        <section className="section-inline reuse-grid">
          <div>
            <span className="kicker">ISPM 15</span>
            <h2>{isSr ? "Šta znače oznake na paleti" : "What pallet marks mean"}</h2>
            <dl className="data-list">
              <div><dt>HT</dt><dd>{isSr ? "termička obrada (zagrevanje drveta)" : "heat treatment"}</dd></div>
              <div><dt>MB</dt><dd>{isSr ? "fumigacija metil-bromidom" : "methyl bromide fumigation"}</dd></div>
              <div><dt>{isSr ? "Ostale oznake" : "Other codes"}</dt><dd>{isSr ? "postoje i drugi odobreni tretmani; proverite važeći ISPM 15" : "other approved treatments exist; check the current ISPM 15"}</dd></div>
            </dl>
            <div className="notice" role="note">
              <p>{isSr ? "ISPM 15 oznaka potvrđuje fitosanitarni tretman drveta za ambalažu u međunarodnom prometu." : "An ISPM 15 mark confirms a phytosanitary treatment of wood packaging for international trade."}</p>
              <p>{isSr ? "Ona ne potvrđuje kasniju istoriju palete i ne garantuje da paleta nikada nije bila izložena ulju, hemikalijama ili drugom zagađenju." : "It does not confirm the pallet's later history and does not guarantee it was never exposed to oil, chemicals or other contamination."}</p>
            </div>
            <p className="source-line"><a href={cite("ippc-ispm-15").url} target="_blank" rel="noreferrer">{cite("ippc-ispm-15").publisher} · {cite("ippc-ispm-15").title}</a></p>
          </div>
          <div>
            <span className="kicker">{isSr ? "Stara impregnirana građa" : "Old treated timber"}</span>
            <h2>{isSr ? "Kada drvo ne koristiti" : "When not to use timber"}</h2>
            <p>
              {isSr
                ? "Stare konstrukcije mogu sadržati drvo tretirano CCA sredstvom (hrom, bakar, arsen). Takvo drvo se ne pali, pri sečenju se koristi zaštita od prašine, a Šapice odbija nepoznatu staru impregniranu građu svuda gde bi je životinja mogla gristi ili lizati."
                : "Old structures may contain CCA-treated wood (chromium, copper, arsenic). It must not be burned, sawing needs dust protection, and Šapice rejects unknown old treated timber wherever an animal could chew or lick it."}
            </p>
            <p className="source-line"><a href={cite("epa-cca-treated-wood").url} target="_blank" rel="noreferrer">{cite("epa-cca-treated-wood").publisher} · {cite("epa-cca-treated-wood").title}</a></p>
          </div>
        </section>

        <section className="section-inline">
          <span className="kicker">{isSr ? "Kontrolna lista" : "Checklist"}</span>
          <h2>{isSr ? "Proverite materijal pre upotrebe" : "Check the material before use"}</h2>
          <ReuseChecklist locale={locale} />
        </section>

        <section className="section-inline reuse-grid">
          <div>
            <span className="kicker">{isSr ? "Bez novca, uz dozvolu" : "Free, with permission"}</span>
            <h2>{isSr ? "Gde naći materijal" : "Where to find material"}</h2>
            <ul className="plain-list">
              <li>{isSr ? "Čiste stiropor kutije: ribarnice, apoteke, laboratorije, restorani." : "Clean foam boxes: fishmongers, pharmacies, labs, restaurants."}</li>
              <li>{isSr ? "Plastične kutije: donacije, oglasi, sugrađani." : "Plastic totes: donations, classifieds, neighbours."}</li>
              <li>{isSr ? "Ostaci građe: prodavnice građevinskog materijala, stolarske radionice, izvođači radova." : "Lumber offcuts: building supply stores, joinery workshops, contractors."}</li>
              <li>{isSr ? "Udruženja za zaštitu životinja i TNR grupe često imaju materijal ili znaju ko ga ima." : "Animal welfare groups and TNR teams often have material or know who does."}</li>
            </ul>
            <p className="warn-text">{isSr ? "Nikada ne uzimajte materijal bez dozvole vlasnika." : "Never take material without the owner's permission."}</p>
            <p className="source-line"><a href={cite("alleycat-providing-shelter").url} target="_blank" rel="noreferrer">{cite("alleycat-providing-shelter").publisher} · {cite("alleycat-providing-shelter").title}</a></p>
          </div>
          <div>
            <span className="kicker">{isSr ? "Pre nego što uzmete" : "Before you take it"}</span>
            <h2>{isSr ? "Kratka provera" : "Quick check"}</h2>
            <ul className="plain-list">
              <li>{isSr ? "Čisto" : "Clean"}</li>
              <li>{isSr ? "Suvo" : "Dry"}</li>
              <li>{isSr ? "Neoštećeno" : "Undamaged"}</li>
              <li>{isSr ? "Poznata prethodna upotreba" : "Known previous use"}</li>
              <li>{isSr ? "Bez hemijskog zagađenja" : "No chemical contamination"}</li>
              <li>{isSr ? "Odgovara nameni (nosivi deo, obloga, izolacija)" : "Suits the intended role (structure, lining, insulation)"}</li>
            </ul>
            <Link href="/build-with-what-you-have" className="button secondary">{isSr ? "Unesi u „Moja radionica”" : "Add to “My workshop”"}</Link>
          </div>
        </section>

        <section className="section-inline">
          <span className="kicker">{isSr ? "Modeli od iskorišćenog materijala" : "Models from reused material"}</span>
          <ul className="reuse-model-list">
            {reuseModels.map((entry) => (
              <li key={entry.slug}>
                <DesignClassTag designClass={entry.designClass} locale={locale} />
                <Link href={{pathname: "/models/[slug]", params: {slug: entry.slug}}}>{isSr ? entry.nameSr : entry.nameEn}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
