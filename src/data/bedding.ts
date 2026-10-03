import type {Season} from "@/lib/catalog/taxonomy";

export type BeddingId = "straw" | "hay" | "blanket" | "towel" | "wood-shavings" | "washable-dog-bed" | "none";

export type BeddingContext = {
  animal: "cat" | "dog";
  season: Season;
  /** Exposed outdoor shelter (not under a roof, damp air reaches it). */
  exposedOutdoor: boolean;
};

export type BeddingVerdict = "RECOMMENDED" | "ACCEPTABLE" | "NOT_RECOMMENDED";

export type BeddingOption = {
  id: BeddingId;
  nameSr: string;
  nameEn: string;
  moistureSr: string;
  moistureEn: string;
  maintenanceSr: string;
  maintenanceEn: string;
  replacementSr: string;
  replacementEn: string;
  warningsSr: string[];
  warningsEn: string[];
  sourceIds: string[];
};

export const beddingOptions: Record<BeddingId, BeddingOption> = {
  straw: {
    id: "straw",
    nameSr: "Slama",
    nameEn: "Straw",
    moistureSr: "Odbija vlagu i ostaje rastresita.",
    moistureEn: "Repels moisture and stays loose.",
    maintenanceSr: "Rastresito napuniti do četvrtine ili polovine visine; protresti pri svakoj proveri.",
    maintenanceEn: "Loosely fill to a quarter or half of the height; fluff it at each check.",
    replacementSr: "Zameniti kada je vlažna, zbijena ili prljava, i pri promeni sezone.",
    replacementEn: "Replace when damp, compacted or soiled, and when seasons change.",
    warningsSr: ["Ne mešati sa senom: seno je zelenije, teže i upija vlagu."],
    warningsEn: ["Do not confuse with hay: hay is greener, heavier and absorbs moisture."],
    sourceIds: ["alleycat-straw-not-hay", "aspcapro-community-cat-winter", "alleycat-cold-weather"]
  },
  hay: {
    id: "hay",
    nameSr: "Seno",
    nameEn: "Hay",
    moistureSr: "Upija vlagu, postaje hladno i može da se ubuđa.",
    moistureEn: "Soaks up moisture, turns cold and can mould.",
    maintenanceSr: "Nije preporučeno za vlažna spoljna skloništa.",
    maintenanceEn: "Not recommended for damp outdoor shelters.",
    replacementSr: "Ako se već nalazi u skloništu, zameniti slamom.",
    replacementEn: "If already in a shelter, replace it with straw.",
    warningsSr: ["Nije ekvivalent slami u spoljnom zimskom skloništu za mačke."],
    warningsEn: ["Not equivalent to straw in an outdoor winter cat shelter."],
    sourceIds: ["alleycat-straw-not-hay"]
  },
  blanket: {
    id: "blanket",
    nameSr: "Ćebe",
    nameEn: "Blanket",
    moistureSr: "Upija i zadržava vlagu; vlažno ćebe hladi.",
    moistureEn: "Absorbs and holds moisture; a damp blanket chills.",
    maintenanceSr: "Prihvatljivo samo u suvom, natkrivenom prostoru uz često pranje.",
    maintenanceEn: "Acceptable only in a dry, covered space with frequent washing.",
    replacementSr: "Prati i menjati čim je vlažno.",
    replacementEn: "Wash and swap as soon as it is damp.",
    warningsSr: ["Izbegavati u izloženim zimskim skloništima za slobodnoživeće mačke."],
    warningsEn: ["Avoid in exposed winter shelters for community cats."],
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter", "alleycat-cold-weather"]
  },
  towel: {
    id: "towel",
    nameSr: "Peškir",
    nameEn: "Towel",
    moistureSr: "Upija vlagu kao ćebe.",
    moistureEn: "Absorbs moisture like a blanket.",
    maintenanceSr: "Samo u suvom, natkrivenom prostoru.",
    maintenanceEn: "Only in a dry, covered space.",
    replacementSr: "Prati i menjati čim je vlažan.",
    replacementEn: "Wash and swap as soon as it is damp.",
    warningsSr: ["Izbegavati u izloženim zimskim skloništima za slobodnoživeće mačke."],
    warningsEn: ["Avoid in exposed winter shelters for community cats."],
    sourceIds: ["aspcapro-community-cat-winter"]
  },
  "wood-shavings": {
    id: "wood-shavings",
    nameSr: "Drvena strugotina",
    nameEn: "Wood shavings",
    moistureSr: "Delimično upija vlagu.",
    moistureEn: "Partly absorbs moisture.",
    maintenanceSr: "Psi u regulisanim objektima: izvor je navodi kao primer posteljine za hladno vreme.",
    maintenanceEn: "Dogs in regulated facilities: the source lists it as an example of cold-weather bedding.",
    replacementSr: "Menjati kada je vlažna ili zbijena.",
    replacementEn: "Change when damp or compacted.",
    warningsSr: ["Izvor je regulatorni vodič za licencirane objekte, ne univerzalno pravilo.", "Ne koristiti strugotinu nepoznatog porekla ni od tretiranog drveta."],
    warningsEn: ["The source is regulatory guidance for licensed facilities, not a universal rule.", "Do not use shavings of unknown origin or from treated wood."],
    sourceIds: ["usda-aphis-dog-temperature"]
  },
  "washable-dog-bed": {
    id: "washable-dog-bed",
    nameSr: "Perivi krevet za psa",
    nameEn: "Washable dog bed",
    moistureSr: "Zavisi od materijala; tkanina upija vlagu.",
    moistureEn: "Depends on fabric; textile absorbs moisture.",
    maintenanceSr: "Za suvu, natkrivenu kućicu; redovno prati i sušiti.",
    maintenanceEn: "For a dry, covered house; wash and dry regularly.",
    replacementSr: "Sušiti ili menjati čim je vlažan.",
    replacementEn: "Dry or swap as soon as it is damp.",
    warningsSr: ["Ne ostavljati vlažan krevet u hladnoj kućici."],
    warningsEn: ["Do not leave a damp bed in a cold house."],
    sourceIds: ["humane-world-pets-cold"]
  },
  none: {
    id: "none",
    nameSr: "Bez posteljine",
    nameEn: "No bedding",
    moistureSr: "Nema šta da upije vlagu.",
    moistureEn: "Nothing to absorb moisture.",
    maintenanceSr: "Leti je čist, hladan pod često bolji izbor od posteljine.",
    maintenanceEn: "In summer a clean, cool floor is often better than bedding.",
    replacementSr: "Nije primenljivo.",
    replacementEn: "Not applicable.",
    warningsSr: ["Zimi bez posteljine životinja gubi više toplote kroz pod."],
    warningsEn: ["Without bedding in winter the animal loses more heat through the floor."],
    sourceIds: []
  }
};

/**
 * Deterministic bedding verdicts. The community-cat outdoor winter case follows the sources:
 * straw is the default, hay/towels/blankets are not equivalent alternatives.
 */
export function beddingVerdict(id: BeddingId, context: BeddingContext): BeddingVerdict {
  const coldSeason = context.season === "WINTER" || context.season === "EMERGENCY" || context.season === "ALL_SEASON";
  if (context.season === "SUMMER") {
    if (id === "none") return "RECOMMENDED";
    if (id === "hay" || id === "blanket") return "NOT_RECOMMENDED";
    return "ACCEPTABLE";
  }
  if (id === "straw") return coldSeason || context.exposedOutdoor ? "RECOMMENDED" : "ACCEPTABLE";
  if (id === "hay") return "NOT_RECOMMENDED";
  if (id === "none") return coldSeason ? "NOT_RECOMMENDED" : "ACCEPTABLE";
  if (context.exposedOutdoor) return "NOT_RECOMMENDED";
  if (id === "wood-shavings") return context.animal === "dog" ? "ACCEPTABLE" : "NOT_RECOMMENDED";
  return "ACCEPTABLE";
}

export function beddingRecommendations(context: BeddingContext) {
  const order: BeddingVerdict[] = ["RECOMMENDED", "ACCEPTABLE", "NOT_RECOMMENDED"];
  return (Object.keys(beddingOptions) as BeddingId[])
    .map((id) => ({option: beddingOptions[id], verdict: beddingVerdict(id, context)}))
    .sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
}
