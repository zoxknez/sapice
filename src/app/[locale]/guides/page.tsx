import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {localizedMetadata} from "@/lib/seo";
import {sources} from "@/data/sources";
import {beddingRecommendations} from "@/data/bedding";
import {PlacementChecklist} from "@/components/field/placement-checklist";
import {Link} from "@/i18n/navigation";

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
      "Kod slobodnoživećih mačaka procenite rizik od predatora pre odluke o jednom ili dva ulaza.",
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
      "Za slobodnoživeće mačke koristite slamu; peškiri i ćebad mogu zadržavati vlagu.",
      "Obezbedite odvod vode sa krova dalje od ulaza.",
      "Kontrolišite spojeve i ivice posle jakog vetra, snega ili kiše.",
      "Zamenite mokru ili zaprljanu posteljinu.",
      "Ventilaciju ne svodite na nasumično bušenje rupa: trenutni modeli koriste ulaz kao dominantan put razmene vazduha dok dimenzionisanje ventilacije ne bude posebno validirano."
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
    introSr: "Grejana varijanta nije dozvola za samostalno pravljen grejač na mrežni napon. Šapice modelira prostor i ograničenja, ne električni uređaj.",
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
  },
  {
    id: "community-cat-winter",
    titleSr: "Zimska skloništa za slobodnoživeće mačke",
    titleEn: "Winter shelters for community cats",
    introSr: "Izvori se slažu oko osnova: malo, suvo, podignuto, zaštićeno od vetra i sa slamom. Mere ulaza navode se kao raspon, ne kao jedan standard.",
    introEn: "Sources agree on the basics: small, dry, raised, out of the wind and with straw. Entrance sizes are given as a range, not a single standard.",
    pointsSr: [
      "Mali unutrašnji prostor pomaže mački da zadrži toplotu tela; prevelika kućica se teže zagreva.",
      "Ulaz: ASPCApro navodi oko 5,5 do 6 inča, Alley Cat Allies oko 6 do 8 inča. Šapice koristi oko 15 cm i prag iznad poda.",
      "Jedan ili dva ulaza: drugi ulaz daje izlaz pred predatorom, ali propušta više hladnog vazduha; odluka zavisi od lokacije.",
      "Okrenite ulaz od dominantnog vetra ili dodajte zavesu ili L-ulaz.",
      "Posle snega očistite ulaze i izlaze; lagana skloništa opteretite ili pričvrstite.",
      "Slama, ne seno, peškiri ni ćebad: oni upijaju vlagu i hlade."
    ],
    pointsEn: [
      "A small interior helps a cat keep its body heat; an oversized house warms up less easily.",
      "Entrance: ASPCApro gives about 5.5 to 6 inches, Alley Cat Allies about 6 to 8 inches. Šapice uses about 15 cm with a sill above the floor.",
      "One or two entrances: a second one offers an escape from predators but lets in more cold air; the choice depends on the location.",
      "Turn the entrance away from the prevailing wind or add a flap or L-entry.",
      "After snow clear entrances and exits; weight or secure lightweight shelters.",
      "Straw, not hay, towels or blankets: they absorb moisture and chill."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter", "alleycat-straw-not-hay", "alleycat-cold-weather"]
  },
  {
    id: "dog-principles",
    titleSr: "Pomoćna kućica za psa: šta izvori stvarno kažu",
    titleEn: "Auxiliary dog houses: what sources actually say",
    introSr: "Šapice razdvaja smernice za kućne ljubimce, regulatorne zahteve za komercijalne odgajivačnice i sopstvene projektantske pretpostavke.",
    introEn: "Šapice separates companion-pet welfare guidance, regulatory requirements for commercial kennels and its own design assumptions.",
    pointsSr: [
      "Smernice za kućne ljubimce: suvo, bez promaje, podignuto, odgovarajuće veličine; kada je moguće, pas boravi u zatvorenom.",
      "Regulativa za licencirane objekte (USDA APHIS): zaštita od vetra i kiše na ulazu, suva posteljina po hladnoći, senka van kućice, stalna voda. Njeni temperaturni pragovi nisu univerzalna „bezbedna temperatura” za malu kućicu koju pravite sami.",
      "Projektantska pretpostavka Šapica: klasa veličine je početni filter; pre izrade izmerite psa da može normalno da stoji, okrene se i legne.",
      "Mladi, stari, bolesni, neaklimatizovani i psi osetljivi na temperaturu traže posebnu pažnju i zaštićeniji prostor.",
      "Spoljna kućica nikada ne zamenjuje zatvoren prostor u ekstremnim uslovima."
    ],
    pointsEn: [
      "Companion-pet guidance: dry, draft-free, raised and appropriately sized; when possible the dog stays indoors.",
      "Regulation for licensed facilities (USDA APHIS): wind and rain break at the entrance, dry bedding in cold, shade outside the shelter, continuous water. Its temperature thresholds are not a universal “safe temperature” for a small DIY house.",
      "Šapice design assumption: the size class is a starting filter; measure the dog so it can stand, turn and lie down normally.",
      "Young, old, sick, unacclimated and temperature-sensitive dogs need special care and a more protected space.",
      "An outdoor house never replaces an indoor space in extreme conditions."
    ],
    sourceIds: ["humane-world-pets-cold", "aspca-cold-weather", "usda-aphis-dog-temperature"]
  },
  {
    id: "summer-heat",
    titleSr: "Leto i vrućina",
    titleEn: "Summer and heat",
    introSr: "Leti je cilj senka i strujanje vazduha. Zatvorena kućica za psa ne pruža olakšanje od vrućine i može je pogoršati.",
    introEn: "In summer the goal is shade and airflow. A closed doghouse gives no relief from heat and can make it worse.",
    pointsSr: [
      "Puna senka tokom najtoplijeg dela dana; drveće i cerade ne zaustavljaju vazduh.",
      "Postavite na travu ili zemlju, ne na vreli beton ili lim.",
      "Za mačke: sklonište sa dva otvora da topao vazduh može da struji.",
      "Sveža voda u senci i mogućnost da životinja slobodno ode na hladnije mesto.",
      "Velika vrućina traži hladniji bezbedan prostor, a ne „bolju” zatvorenu kućicu.",
      "Kratkonose rase, mlade, stare i gojazne životinje su ugroženije."
    ],
    pointsEn: [
      "Full shade through the hottest part of the day; trees and tarps do not block airflow.",
      "Place it on grass or soil, not on hot concrete or metal.",
      "For cats: a shelter with two openings so hot air can move through.",
      "Fresh water in shade and freedom for the animal to move somewhere cooler.",
      "Extreme heat needs a cooler safe space, not a “better” closed house.",
      "Short-muzzled breeds and young, old or overweight animals are at higher risk."
    ],
    sourceIds: ["humane-world-heatwave", "alleycat-summer-weather", "usda-aphis-dog-temperature"]
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

        <section className="section-inline">
          <span className="kicker">{isSr ? "Posteljina" : "Bedding"}</span>
          <h2>{isSr ? "Šta staviti u sklonište" : "What to put inside"}</h2>
          <div className="bedding-matrix">
            {([["cat", "WINTER", true], ["dog", "WINTER", true], ["dog", "WINTER", false], ["cat", "SUMMER", true]] as const).map(([animal, season, exposed]) => (
              <div key={animal + season + exposed} className="bedding-column">
                <h3>{animal === "cat" ? (isSr ? "Mačka" : "Cat") : (isSr ? "Pas" : "Dog")} · {season === "WINTER" ? (isSr ? "zima" : "winter") : (isSr ? "leto" : "summer")} · {exposed ? (isSr ? "napolju" : "outdoors") : (isSr ? "pod krovom" : "under a roof")}</h3>
                <ul className="bedding-list">
                  {beddingRecommendations({animal, season, exposedOutdoor: exposed}).map(({option, verdict}) => (
                    <li key={option.id} className={`bedding-${verdict.toLowerCase()}`}>
                      <span className="verdict">{verdict === "RECOMMENDED" ? (isSr ? "Preporučeno" : "Recommended") : verdict === "ACCEPTABLE" ? (isSr ? "Prihvatljivo" : "Acceptable") : (isSr ? "Ne preporučuje se" : "Not recommended")}</span>
                      <strong>{isSr ? option.nameSr : option.nameEn}</strong>
                      <small>{isSr ? option.moistureSr : option.moistureEn}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section-inline">
          <span className="kicker">{isSr ? "Postavljanje" : "Placement"}</span>
          <h2>{isSr ? "Kontrolna lista za mesto" : "Placement checklist"}</h2>
          <PlacementChecklist locale={locale} context={{animal: "cat", season: "WINTER"}} />
          <p className="section-intro">
            {isSr ? "Treba vam materijal ili sklonište odmah? " : "Need material or a shelter right now? "}
            <Link href="/emergency">{isSr ? "Hitno" : "Emergency"}</Link>{" · "}<Link href="/reuse">{isSr ? "Ponovna upotreba" : "Reuse"}</Link>
          </p>
        </section>
      </div>
    </section>
  );
}
