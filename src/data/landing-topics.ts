import type {CatalogEntry} from "@/lib/catalog/entries";
import {budgetClassRank} from "@/lib/catalog/taxonomy-core";

/**
 * Indexable topic pages. Each topic selects canonical models with a deterministic predicate and
 * carries its own source-backed key points, so a page is never a thin keyword shell.
 */
export type LandingTopic = {
  id: string;
  slugSr: string;
  slugEn: string;
  titleSr: string;
  titleEn: string;
  leadSr: string;
  leadEn: string;
  pointsSr: string[];
  pointsEn: string[];
  sourceIds: string[];
  tool: "finder" | "emergency" | "budget" | "build-with-what-you-have" | "rescue" | "reuse" | "retrofit";
  select: (entry: CatalogEntry) => boolean;
};

const sleeping = (entry: CatalogEntry) => entry.structureType === "SLEEPING_SHELTER";

export const landingTopics: LandingTopic[] = [
  {
    id: "cheap-cat-shelter",
    slugSr: "jeftina-kucica-za-macke",
    slugEn: "cheap-cat-shelter",
    titleSr: "Jeftina kućica za mačke",
    titleEn: "Cheap cat shelter",
    leadSr: "Dobra kućica za mačke ne mora biti skupa. Mala, suva i podignuta kutija sa slamom često pomaže više od velike i lepe kućice. Ovde su modeli niske cene, od besplatnih rešenja do jednostavnih drvenih kutija.",
    leadEn: "A good cat shelter does not have to be expensive. A small, dry, raised box with straw often helps more than a large, nice-looking house. These are low-cost models, from free solutions to simple timber boxes.",
    pointsSr: [
      "Mali unutrašnji prostor pomaže mački da zadrži toplotu tela.",
      "Slama, a ne seno, ćebad ili peškiri, za spoljna zimska skloništa.",
      "Podignite kućicu od vlažnog tla; palete ili cigle su dovoljne.",
      "Cene unosite vi: Šapice ne izmišlja tržišne cene materijala."
    ],
    pointsEn: [
      "A small interior helps a cat keep its body heat.",
      "Straw, not hay, blankets or towels, for outdoor winter shelters.",
      "Raise the shelter off damp ground; pallets or bricks are enough.",
      "You enter the prices: Šapice does not invent market prices."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-straw-not-hay", "alleycat-providing-shelter"],
    tool: "budget",
    select: (entry) => entry.animal === "cat" && sleeping(entry) && !entry.emergencyOnly && budgetClassRank[entry.budgetClass] <= budgetClassRank.LOW
  },
  {
    id: "diy-cat-shelter",
    slugSr: "kucica-za-macke-uradi-sam",
    slugEn: "diy-cat-shelter",
    titleSr: "Kućica za mačke: uradi sam",
    titleEn: "DIY cat shelter",
    leadSr: "Planovi za samostalnu izradu sa merama, krojnom listom i koracima. Za svaki model se vidi koji alat je potreban, koliko je zahtevan i šta je proračunato, a šta je pretpostavka.",
    leadEn: "Plans for building it yourself with dimensions, a cut list and steps. Each model shows the tools it needs, how demanding it is and what is calculated versus assumed.",
    pointsSr: [
      "Ulaz širine oko 15 cm (izvori navode raspon od 5,5 do 8 inča), sa pragom iznad poda.",
      "Krov sa padom ka nazad, da voda ne teče ka ulazu.",
      "Pena uvek iza obloge: mačke grebu i grickaju nezaštićenu izolaciju.",
      "Servisni krov olakšava čišćenje i zamenu slame."
    ],
    pointsEn: [
      "An entrance about 15 cm wide (sources give a range of 5.5 to 8 inches), with a sill above the floor.",
      "A roof falling to the rear so water does not run toward the entrance.",
      "Foam always behind a lining: cats scratch and chew unprotected insulation.",
      "A service roof makes cleaning and straw changes easier."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter"],
    tool: "finder",
    select: (entry) => entry.animal === "cat" && sleeping(entry) && ["REUSE", "BUDGET", "STANDARD_DIY"].includes(entry.designClass)
  },
  {
    id: "winter-cat-shelter",
    slugSr: "zimska-kucica-za-macke",
    slugEn: "winter-cat-shelter",
    titleSr: "Zimska kućica za mačke",
    titleEn: "Winter cat shelter",
    leadSr: "Zimska kućica treba da bude mala, suva, zaštićena od vetra i podignuta od tla. Ovde su svi zimski modeli za mačke, od plastičnih kutija sa slamom do inženjerskih izolovanih modela.",
    leadEn: "A winter shelter should be small, dry, out of the wind and raised off the ground. These are all winter cat models, from plastic totes with straw to engineered insulated models.",
    pointsSr: [
      "Ulaz okrenite od dominantnog vetra ili dodajte zavesu ili L-ulaz.",
      "Posle snega očistite ulaze i izlaze.",
      "Topla kućica koja se vlaži može biti lošija od jednostavnije koja ostaje suva.",
      "Šapice ne objavljuje tvrdnje tipa „bezbedno do -X °C”."
    ],
    pointsEn: [
      "Face the entrance away from the prevailing wind or add a flap or L-entry.",
      "Clear entrances and exits after snow.",
      "A warm shelter that gets damp can be worse than a simpler one that stays dry.",
      "Šapice does not publish “safe to -X °C” claims."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-cold-weather", "alleycat-providing-shelter", "iso-13788-2012"],
    tool: "finder",
    select: (entry) => entry.animal === "cat" && sleeping(entry) && entry.seasons.includes("WINTER")
  },
  {
    id: "plastic-bin-cat-shelter",
    slugSr: "kucica-za-macke-od-plasticne-kutije",
    slugEn: "plastic-bin-cat-shelter",
    titleSr: "Kućica za mačke od plastične kutije",
    titleEn: "Plastic bin cat shelter",
    leadSr: "Plastična kutija je vodootporna, laka i dostupna. Sama po sebi nije izolacija, pa modeli dodaju slamu, ploče pene ili drugu kutiju. Mere kutija su nominalne: izmerite svoju pre sečenja.",
    leadEn: "A plastic tote is waterproof, light and easy to find. On its own it is not insulation, so the models add straw, foam boards or a second tote. Tote sizes are nominal: measure yours before cutting.",
    pointsSr: [
      "Alley Cat Allies opisuje kutiju u kutiji: oko 30 i oko 20 galona, pena na dnu i slama.",
      "Isečene ivice plastike su oštre; prekrijte ih spolja.",
      "Laganu kutiju opteretite ili pričvrstite.",
      "Plastika nema izvorovanu toplotnu provodljivost, pa se računa samo sloj pene."
    ],
    pointsEn: [
      "Alley Cat Allies describes a tote-in-tote: about 30 and about 20 gallons, foam on the bottom and straw.",
      "Cut plastic edges are sharp; cover them from the outside.",
      "Weight or secure the light tote.",
      "Plastic has no sourced thermal conductivity, so only the foam layer is calculated."
    ],
    sourceIds: ["alleycat-build-outdoor-shelter", "aspcapro-community-cat-winter"],
    tool: "build-with-what-you-have",
    select: (entry) => entry.family === "TOTE_IN_TOTE" || entry.slug === "eps-core-plastic-shell"
  },
  {
    id: "emergency-cat-shelter",
    slugSr: "hitno-skloniste-za-macke",
    slugEn: "emergency-cat-shelter",
    titleSr: "Hitno sklonište za mačke",
    titleEn: "Emergency cat shelter",
    leadSr: "Kada je sklonište potrebno večeras, važno je napraviti ono što ostaje suvo i podignuto, uz jasno ograničenje: hitno rešenje nije zamena za trajno vodootporno sklonište.",
    leadEn: "When a shelter is needed tonight, what matters is something that stays dry and raised, with a clear limit: an emergency solution is not a replacement for a durable waterproof shelter.",
    pointsSr: [
      "Samo hitno: mora ostati suvo i biti podignuto.",
      "Proveravajte svaki dan; vlažan ili deformisan karton odmah zamenite.",
      "Folija ide spolja i nikada ne zatvara ulaz.",
      "Što pre pređite na plastičnu kutiju ili drvenu kućicu."
    ],
    pointsEn: [
      "Emergency only: it must stay dry and raised.",
      "Check daily; replace damp or deformed cardboard immediately.",
      "Film goes outside and never closes the entrance.",
      "Move to a tote or a timber shelter as soon as possible."
    ],
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-straw-not-hay"],
    tool: "emergency",
    select: (entry) => entry.animal === "cat" && (entry.designClass === "EMERGENCY" || entry.seasons.includes("EMERGENCY"))
  },
  {
    id: "pallet-dog-house",
    slugSr: "kucica-za-psa-od-paleta",
    slugEn: "pallet-dog-house",
    titleSr: "Kućica za psa od paleta",
    titleEn: "Pallet dog house",
    leadSr: "Palete su česte i često besplatne, ali nisu svaka za upotrebu. Pre izrade svaka paleta mora proći kontrolnu listu, a oznaka ISPM 15 govori samo o fitosanitarnom tretmanu, ne o istoriji palete.",
    leadEn: "Pallets are common and often free, but not every pallet is usable. Each one must pass a checklist before building, and an ISPM 15 mark only says something about phytosanitary treatment, not about the pallet's history.",
    pointsSr: [
      "HT znači termičku obradu, MB metil-bromid; oznaka ne potvrđuje da paleta nije zagađena.",
      "Odbacite palete sa mrljama, mirisom hemikalija, uljem, truleži ili buđi.",
      "Razmake između dasaka zatvorite spolja da vetar ne prolazi.",
      "Paleta nije kontrolisan termički sloj; računaju se samo poznati slojevi."
    ],
    pointsEn: [
      "HT means heat treatment, MB methyl bromide; the mark does not confirm the pallet is uncontaminated.",
      "Reject pallets with stains, chemical smell, oil, rot or mould.",
      "Close the gaps between boards on the outside so wind cannot pass.",
      "A pallet is not a controlled thermal layer; only known layers are calculated."
    ],
    sourceIds: ["ippc-ispm-15", "epa-cca-treated-wood"],
    tool: "reuse",
    select: (entry) => entry.family === "PALLET_FRAME"
  },
  {
    id: "budget-dog-house",
    slugSr: "jeftina-kucica-za-psa",
    slugEn: "budget-dog-house",
    titleSr: "Jeftina kućica za psa",
    titleEn: "Budget dog house",
    leadSr: "Pomoćna kućica za psa od stare građe, paleta ili OSB-a. Klasa veličine je samo početni filter: pre izrade izmerite psa, jer prevelika kućica teže zadržava toplotu, a premala ne dozvoljava normalno okretanje i ležanje.",
    leadEn: "An auxiliary dog house from old timber, pallets or OSB. The size class is only a starting filter: measure the dog before building, because an oversized house holds less heat and an undersized one prevents normal turning and lying down.",
    pointsSr: [
      "Suvo, bez promaje, podignuto i odgovarajuće veličine.",
      "Spoljna kućica ne zamenjuje boravak u zatvorenom tokom velike hladnoće.",
      "Ulaz zaštićen od vetra i kiše.",
      "Mlade, stare, bolesne i neaklimatizovane životinje traže posebnu pažnju."
    ],
    pointsEn: [
      "Dry, draft-free, raised and appropriately sized.",
      "An outdoor house does not replace being indoors during severe cold.",
      "An entrance protected from wind and rain.",
      "Young, old, sick and unacclimated animals need special care."
    ],
    sourceIds: ["humane-world-pets-cold", "aspca-cold-weather", "usda-aphis-dog-temperature"],
    tool: "budget",
    select: (entry) => entry.animal === "dog" && sleeping(entry) && budgetClassRank[entry.budgetClass] <= budgetClassRank.LOW
  },
  {
    id: "insulated-dog-shelter",
    slugSr: "izolovana-kucica-za-psa",
    slugEn: "insulated-dog-shelter",
    titleSr: "Izolovana kućica za psa",
    titleEn: "Insulated dog shelter",
    leadSr: "Modeli sa kontrolisanim izolacionim slojem i potpunom termičkom procenom prenosa toplote. Procena nije garancija temperature i ne tvrdi da je kućica bezbedna do određene temperature.",
    leadEn: "Models with a controlled insulation layer and a complete thermal transmission estimate. The estimate is not a temperature guarantee and does not claim the house is safe to any temperature.",
    pointsSr: [
      "Izolacija mora biti iza obloge koju pas ne može da gricka.",
      "Servisni krov olakšava sušenje i čišćenje.",
      "Regulatorni pragovi za komercijalne odgajivačnice nisu univerzalne bezbedne temperature.",
      "Grejani modeli prihvataju samo namenske proizvode za grejanje životinja."
    ],
    pointsEn: [
      "Insulation must sit behind a lining the dog cannot chew.",
      "A service roof makes drying and cleaning easier.",
      "Regulatory thresholds for commercial kennels are not universal safe temperatures.",
      "Heated models accept only purpose-built animal heating products."
    ],
    sourceIds: ["humane-world-pets-cold", "usda-aphis-dog-temperature", "iec-60335-2-71-2018"],
    tool: "finder",
    select: (entry) => entry.animal === "dog" && sleeping(entry) && entry.thermalStatus === "COMPLETE"
  },
  {
    id: "summer-pet-shade",
    slugSr: "letnja-senka-za-ljubimce",
    slugEn: "summer-pet-shade",
    titleSr: "Letnja senka za pse i mačke",
    titleEn: "Summer pet shade",
    leadSr: "Leti je cilj senka i strujanje vazduha, ne zatvorena kutija. Zatvorena kućica za psa ne pruža olakšanje od vrućine i može je pogoršati. Najbolja je senka koja ne zaustavlja vazduh, uz svežu vodu i slobodan izlaz.",
    leadEn: "In summer the goal is shade and airflow, not a closed box. A closed doghouse gives no relief from heat and can make it worse. The best is shade that does not block air, with fresh water and freedom to leave.",
    pointsSr: [
      "Drveće i cerade su odlična senka jer ne zaustavljaju vazduh.",
      "Postavite na travu ili zemlju, ne na vreli beton.",
      "Za mačke: dva otvora da topao vazduh može da struji.",
      "Velika vrućina traži hladniji bezbedan prostor, ne „bolju” zatvorenu kućicu."
    ],
    pointsEn: [
      "Trees and tarps are excellent shade because they do not block airflow.",
      "Place it on grass or soil, not hot concrete.",
      "For cats: two openings so hot air can move through.",
      "Extreme heat needs a cooler safe space, not a “better” closed house."
    ],
    sourceIds: ["humane-world-heatwave", "alleycat-summer-weather", "usda-aphis-dog-temperature"],
    tool: "finder",
    select: (entry) => entry.seasons.includes("SUMMER")
  },
  {
    id: "community-cat-shelter",
    slugSr: "skloniste-za-slobodnozivece-macke",
    slugEn: "community-cat-shelter",
    titleSr: "Sklonište za slobodnoživeće mačke",
    titleEn: "Community cat shelter",
    leadSr: "Za kolonije su važni kapacitet, više komora ili više skloništa, mirna lokacija i redovan obilazak. Alley Cat Allies opisuje sklonište od oko 2 × 3 stope za tri do pet mačaka.",
    leadEn: "For colonies what matters is capacity, several chambers or several shelters, a quiet location and regular checks. Alley Cat Allies describes a shelter of about 2 × 3 ft for three to five cats.",
    pointsSr: [
      "Jedan ili dva ulaza: drugi ulaz daje izlaz pred predatorom, ali propušta više hladnog vazduha.",
      "Za veću koloniju bolje je više manjih skloništa nego jedno preveliko.",
      "Postavite ih bliže mestima gde mačke već borave, ali uz privatnost.",
      "Za serijsku izradu koristite planer za udruženja."
    ],
    pointsEn: [
      "One or two entrances: a second one gives an escape from predators but lets in more cold air.",
      "For a larger colony several smaller shelters beat one oversized one.",
      "Place them near where the cats already rest, with privacy.",
      "For batch builds use the rescue planner."
    ],
    sourceIds: ["alleycat-providing-shelter", "aspcapro-community-cat-winter"],
    tool: "rescue",
    select: (entry) => entry.animal === "cat" && sleeping(entry) && entry.capacity.max >= 2 && entry.seasons.includes("WINTER") && !entry.emergencyOnly
  },
  {
    id: "rescue-shelter-plans",
    slugSr: "planovi-za-udruzenja",
    slugEn: "rescue-shelter-plans",
    titleSr: "Planovi za udruženja i serijsku izradu",
    titleEn: "Rescue shelter plans",
    leadSr: "Modeli sa krojnom listom i rasporedom na pločama mogu se praviti u seriji. Planer za udruženja raspoređuje delove više istih kućica na zajedničke ploče umesto da svaku računa posebno.",
    leadEn: "Models with a cut list and sheet nesting can be built in batches. The rescue planner nests parts of several identical shelters onto shared sheets instead of planning each one separately.",
    pointsSr: [
      "Zajednički raspored na pločama smanjuje otpad.",
      "Ponovljiv redosled sečenja za ceo tim.",
      "Cene unosite vi; trošak po skloništu i po životinji računa se iz njih.",
      "Planovi su provereni samo kao podaci, ne kao fizički prototip."
    ],
    pointsEn: [
      "Shared sheet nesting reduces waste.",
      "A repeatable cutting schedule for the whole team.",
      "You enter prices; cost per shelter and per animal follows from them.",
      "Plans are data-validated only, not physically prototyped."
    ],
    sourceIds: ["alleycat-providing-shelter"],
    tool: "rescue",
    select: (entry) => entry.coverage.includes("NESTING") && sleeping(entry) && entry.kind === "PRACTICAL"
  }
];

export function landingTopicBySlug(slug: string, locale: "sr" | "en") {
  return landingTopics.find((topic) => (locale === "sr" ? topic.slugSr : topic.slugEn) === slug);
}
