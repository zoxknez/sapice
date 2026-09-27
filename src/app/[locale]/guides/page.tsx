import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";

export default async function GuidesPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const guides = locale === "sr"
    ? [
      ["Zašto veća kućica nije uvek toplija", "Kako zapremina, vetar, ulaz i izolacija utiču na zimsko sklonište."],
      ["Vlaga je jednako važna kao hladnoća", "Krov, podignut pod, ventilacija i suva zona za ležanje."],
      ["Grejanje bez improvizacije", "Zašto model predviđa samo namenski grejni proizvod sa pravilima proizvođača."]
    ]
    : [
      ["Why a larger shelter is not always warmer", "How volume, wind, entrances and insulation affect a winter shelter."],
      ["Moisture matters as much as cold", "Roofing, raised floors, ventilation and a dry sleeping zone."],
      ["Heating without improvisation", "Why designs only accommodate purpose-built heating products under manufacturer rules."]
    ];

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">Knowledge base</span>
        <h1>{locale === "sr" ? "Vodiči" : "Guides"}</h1>
        <div className="guide-grid">
          {guides.map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
