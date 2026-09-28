import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {localizedMetadata} from "@/lib/seo";
import {sources} from "@/data/sources";

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: AppLocale}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Vodiči",
    titleEn: "Guides",
    descriptionSr: "Praktični vodiči o zimskim skloništima, vlazi, izolaciji, ulazima i bezbednom korišćenju grejanja.",
    descriptionEn: "Practical guides on winter shelters, moisture, insulation, entrances and safe heating use.",
    srPath: "/sr/vodici",
    enPath: "/en/guides"
  });
}

type Guide = {
  id: string;
  titleSr: string;
  titleEn: string;
  introSr: string;
  introEn: string;
  pointsSr: string[];
  pointsEn: string[];
  sourceIds: string[];
};

const guides: Guide[] = [
  {
    id: "winter-placement",
    titleSr: "Postavljanje zimskog skloništa",
    titleEn: "Winter shelter placement",
    introSr: "Dobra konstrukcija gubi vrednost ako stoji na mokrom tlu, direktnom vetru ili mestu gde životinja ne može bezbedno da uđe i izađe.",
    introEn: "A good structure loses much of its value if it sits on wet ground, direct wind or a location the animal cannot enter and leave safely.",
    pointsSr: [
      "Podignite sklonište od hladnog i mokrog tla.",
      "Okrenite ulaz ka zaštićenoj strani kada je to moguće.",
      "Obezbedite stabilnost da vetar ne može da pomeri konstrukciju.",
      "Kod community mačaka procenite predator risk pre odluke o jednom ili dva ulaza.",
      "Redovno čistite sneg i led oko ulaza."
    ],
    pointsEn: [
      "Raise the shelter above cold and wet ground.",
      "Face the entrance toward a protected side where practical.",
      "Secure the structure so wind cannot move it.",
      "For community cats, assess predator risk before choosing one or two entrances.",
      "Regularly clear snow and ice around entrances."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "humane-world-pets-cold"]
  },
  {
    id: "moisture-bedding",
    titleSr: "Vlaga, posteljina i održavanje",
    titleEn: "Moisture, bedding and maintenance",
    introSr: "Zimsko sklonište mora da ostane suvo. Mokra posteljina i prodor vode mogu poništiti korist izolacije.",
    introEn: "A winter shelter has to remain dry. Wet bedding and water ingress can erase much of the benefit of insulation.",
    pointsSr: [
      "Za community mačke koristite slamu; peškiri i ćebad mogu zadržavati vlagu.",
      "Obezbedite odvod vode sa krova dalje od ulaza.",
      "Kontrolišite spojeve i ivice posle jakog vetra, snega ili kiše.",
      "Zamenite mokru ili zaprljanu posteljinu.",
      "Ventilaciju ne svodite na nasumično bušenje rupa: trenutni modeli koriste ulaz kao dominantan put razmene vazduha dok vent sizing ne bude posebno validiran."
    ],
    pointsEn: [
      "For community cats, use straw; towels and blankets can retain moisture.",
      "Direct roof runoff away from entrances.",
      "Inspect joints and edges after strong wind, snow or heavy rain.",
      "Replace wet or soiled bedding.",
      "Do not treat ventilation as random hole drilling: current models use the entrance as the dominant air-exchange path until vent sizing is separately validated."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "iso-13788-2012"]
  },
  {
    id: "heating",
    titleSr: "Grejanje bez improvizacije",
    titleEn: "Heating without improvisation",
    introSr: "Grejana varijanta nije dozvola za DIY mrežni grejač. Šapice modelira prostor i ograničenja, ne električni uređaj.",
    introEn: "A heated variant is not permission to build a DIY mains heater. Šapice models space and constraints, not the electrical appliance.",
    pointsSr: [
      "Koristite samo namenski proizvod predviđen za životinje i odgovarajuće okruženje.",
      "Uputstvo i ograničenja proizvođača konkretnog proizvoda imaju prednost nad generičkim planom.",
      "Adapteri, nezaštićeni spojevi i improvizovano 230 V ožičenje ne pripadaju prostoru životinje.",
      "Životinja treba da ima mogućnost da se pomeri sa grejane površine na negrejani deo.",
      "Spoljna električna instalacija mora da poštuje lokalne propise i odgovarajuću zaštitu od vlage i strujnog udara."
    ],
    pointsEn: [
      "Use only a purpose-built product intended for animals and the relevant environment.",
      "The selected product's manufacturer instructions and limitations take priority over the generic plan.",
      "Adapters, exposed connections and improvised mains wiring do not belong in the animal space.",
      "The animal should be able to move away from the heated surface to an unheated area.",
      "The external electrical installation must comply with local electrical rules and appropriate moisture/shock protection."
    ],
    sourceIds: ["iec-60335-2-71-2018", "aspca-cold-weather"]
  }
];

export default async function GuidesPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const isSr = locale === "sr";

  return (
    <section className="page-hero guides-page">
      <div className="shell">
        <span className="kicker">{isSr ? "Baza vodiča" : "Knowledge base"}</span>
        <h1>{isSr ? "Vodiči" : "Guides"}</h1>
        <p className="page-lead">
          {isSr
            ? "Praktična pravila koja dopunjuju tehnički plan. Svaki vodič navodi izvore i jasno odvaja smernice za dobrobit životinja potkrepljene izvorima od projektantskih pretpostavki."
            : "Practical rules that complement the technical plan. Each guide lists sources and separates sourced welfare guidance from design assumptions."}
        </p>

        <div className="guide-articles">
          {guides.map((guide, index) => (
            <details key={guide.id} className="guide-article" open={index === 0}>
              <summary>
                <span>0{index + 1}</span>
                <div>
                  <h2>{isSr ? guide.titleSr : guide.titleEn}</h2>
                  <p>{isSr ? guide.introSr : guide.introEn}</p>
                </div>
                <strong aria-hidden="true">+</strong>
              </summary>
              <div className="guide-article-body">
                <ol>
                  {(isSr ? guide.pointsSr : guide.pointsEn).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ol>
                <div className="guide-source-row">
                  {guide.sourceIds.map((sourceId) => {
                    const source = sources[sourceId];
                    return source ? (
                      <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">
                        {source.publisher} · {source.title} ↗
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
