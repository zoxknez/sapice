import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {sources} from "@/data/sources";
import {thermalMethod} from "@/lib/engineering";
import {localizedMetadata} from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: AppLocale}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Metodologija",
    titleEn: "Methodology",
    descriptionSr: "Kako Šapice razdvaja izvore, geometriju, proračune, pretpostavke i fizičku validaciju.",
    descriptionEn: "How Šapice separates sources, geometry, calculations, assumptions and physical validation.",
    srPath: "/sr/metodologija",
    enPath: "/en/methodology"
  });
}

export default async function MethodologyPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const isSr = locale === "sr";

  const cards = isSr
    ? [
      ["SOURCE", "Vrednost ili pravilo potiče iz spoljnog izvora koji je evidentiran u bazi izvora."],
      ["GEOMETRY", "Vrednost se izvodi direktno iz kanonske geometrije modela, bez ručnog dupliranja."],
      ["CALCULATION", "Vrednost je rezultat determinističkog proračuna nad poznatim ulazima."],
      ["ASSUMPTION", "Projektantska pretpostavka je eksplicitno označena i ne predstavlja potvrđenu činjenicu."]
    ]
    : [
      ["SOURCE", "A value or rule comes from an external source recorded in the provenance library."],
      ["GEOMETRY", "A value is derived directly from canonical model geometry without manual duplication."],
      ["CALCULATION", "A value is produced by a deterministic calculation over known inputs."],
      ["ASSUMPTION", "A design assumption is explicitly labeled and is not presented as confirmed fact."]
    ];

  return (
    <article className="page-hero methodology-page">
      <div className="shell">
        <span className="kicker">{isSr ? "Otvoreno inženjerstvo" : "Open engineering"}</span>
        <h1>{isSr ? "Metodologija" : "Methodology"}</h1>
        <p className="page-lead">
          {isSr
            ? "Šapice ne pokušava da pretvori procenu u sertifikat. Svaki model razdvaja ono što je preuzeto iz pouzdanog izvora, ono što proizilazi iz geometrije, ono što računamo i ono što još ostaje pretpostavka."
            : "Šapice does not turn an estimate into a certificate. Every model separates sourced information, geometry-derived values, calculations and remaining assumptions."}
        </p>

        <div className="method-grid">
          {cards.map(([name, description]) => (
            <section key={name}>
              <span className="kicker">{name}</span>
              <p>{description}</p>
            </section>
          ))}
        </div>

        <section className="method-copy">
          <h2>{isSr ? "Termički proračun" : "Thermal calculation"}</h2>
          <p>
            {isSr
              ? "Trenutni proračunski model procenjuje stacionarni prenos toplote kroz zidove, pod i krov. Metod v" + thermalMethod.version + " koristi površinske otpore prema smeru toka toplote, u skladu sa ISO 6946: Rsi 0,13 m²K/W za zidove, 0,10 za krov pri toku naviše i 0,17 za pod pri toku naniže, uz Rse 0,04 m²K/W. Model još ne tvrdi da pouzdano obuhvata prolaz vazduha kroz ulaz, toplotu koju stvara životinja, uticaj vetra, dvodimenzionalne termičke mostove rama ili punu higrotermalnu dinamiku. Zato prikaz nije garancija temperature."
              : "The current engine estimates steady-state transmission through walls, floor and roof. Method v" + thermalMethod.version + " uses ISO 6946 orientation-specific surface resistances: Rsi 0.13 m²K/W for walls, 0.10 for upward heat flow through the roof and 0.17 for downward heat flow through the floor, with Rse 0.04 m²K/W. The model does not yet claim validated entrance infiltration, animal metabolic heat, wind effects, 2D framing thermal bridges or full hygrothermal behavior. The result is therefore not a temperature guarantee."}
          </p>

          <h2>{isSr ? "Ventilacija" : "Ventilation"}</h2>
          <p>
            {isSr
              ? "Verzija 1 ne propisuje univerzalnu potrebnu površinu ventilacionog otvora. Kompajler predviđa rezervne zone PROVISION pri vrhu zadnjeg zida, koje se ne preklapaju sa preliminarno predviđenim elementima rama. Stvarni otvor i slobodna površina za protok vazduha zavise od izabranog podesivog ventilacionog umetka. Terenska provera mora da obuhvati kondenzaciju, vlagu i lokalnu promaju. Termički proračun ne računa protok vazduha kroz te buduće otvore."
              : "V1 does not claim a universal required ventilation-opening area. The compiler reserves high-rear PROVISION zones that avoid provisional framing, while the actual cutout and net free area depend on the selected adjustable vent insert. Field validation must include condensation, moisture and localized drafts. The thermal engine does not calculate airflow through those future openings."}
          </p>

          <h2>{isSr ? "Grejanje" : "Heating"}</h2>
          <p>
            {isSr
              ? "Aplikacija ne projektuje improvizovane električne grejače. Grejani modeli određuju prostor i ograničenja za kompatibilan namenski proizvod za grejanje životinja; deklaracije proizvoda i uputstvo proizvođača merodavni su za ugradnju."
              : "The application does not design improvised electrical heaters. Heated models define space and constraints for a compatible purpose-built pet-heating product; its declarations and manufacturer instructions remain authoritative for installation."}
          </p>

          <h2>{isSr ? "Status validacije" : "Validation status"}</h2>
          <ol>
            <li>DATA_VALIDATED</li>
            <li>GEOMETRY_VALIDATED</li>
            <li>ENGINEERING_REVIEWED</li>
            <li>PROTOTYPE_BUILT</li>
            <li>FIELD_TESTED</li>
          </ol>
          <p>
            {isSr
              ? "Status se podiže samo kada je prethodni nivo stvarno završen. Softverski testovi nikada se ne predstavljaju kao fizičko testiranje kućice."
              : "Status advances only when the preceding level has actually been completed. Software tests are never presented as physical shelter testing."}
          </p>
        </section>

        <section className="section-inline">
          <span className="kicker">{isSr ? "Izvorna biblioteka" : "Source library"}</span>
          <h2>{isSr ? "Aktuelni stručni izvori" : "Current technical sources"}</h2>
          <div className="source-list">
            {Object.values(sources).map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>{source.publisher} · {isSr ? "Nivo" : "Tier"} {source.tier}</span>
                <strong>{source.title}</strong>
                <small>{isSr ? source.notesSr : source.notes}</small>
              </a>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
