import {
  practicalModelSchema,
  type FamilyParams,
  type PanelBoxParams,
  type PracticalModel,
  type ShadeParams,
  type ToteParams
} from "@/lib/practical/domain";
import type {CalculationCoverage} from "@/lib/catalog/taxonomy";

/**
 * Canonical practical models (emergency, reuse, budget, standard DIY).
 *
 * Every model starts at DATA_VALIDATED: its data is schema-checked and compiled, nothing more.
 * Dimensions of containers (totes, foam boxes, crates, cardboard boxes) are nominal envelopes and
 * explicitly marked as ASSUMPTION; the user measures the real container.
 */

const COV_FULL: CalculationCoverage[] = ["GEOMETRY", "BOM", "CUT_LIST", "NESTING", "THERMAL_TRANSMISSION", "COST", "DRAWING", "BUILD_GUIDE"];
const COV_CUT: CalculationCoverage[] = ["GEOMETRY", "BOM", "CUT_LIST", "NESTING", "COST", "DRAWING", "BUILD_GUIDE"];
const COV_CUT_NO_NEST: CalculationCoverage[] = ["GEOMETRY", "BOM", "CUT_LIST", "COST", "DRAWING", "BUILD_GUIDE"];
const COV_SIMPLE: CalculationCoverage[] = ["GEOMETRY", "BOM", "COST", "DRAWING", "BUILD_GUIDE"];

const DOG_SOURCES = ["humane-world-pets-cold", "aspca-cold-weather", "usda-aphis-dog-temperature"];
const SUMMER_CAT_SOURCES = ["alleycat-summer-weather", "humane-world-heatwave"];
const SUMMER_DOG_SOURCES = ["humane-world-heatwave", "usda-aphis-dog-temperature"];

const catEntrance = {widthMm: 150, heightMm: 180, sillMm: 80, count: 1};
const dogEntrance = {
  small: {widthMm: 220, heightMm: 300, sillMm: 100, count: 1},
  medium: {widthMm: 300, heightMm: 420, sillMm: 120, count: 1},
  large: {widthMm: 380, heightMm: 520, sillMm: 140, count: 1}
} as const;

const dogBox = {
  small: {widthMm: 760, depthMm: 900, frontHeightMm: 800, rearHeightMm: 720},
  medium: {widthMm: 930, depthMm: 1120, frontHeightMm: 980, rearHeightMm: 880},
  large: {widthMm: 1150, depthMm: 1350, frontHeightMm: 1150, rearHeightMm: 1010}
} as const;

const nominal = (lengthMm: number, widthMm: number, heightMm: number) => ({lengthMm, widthMm, heightMm, provenance: "ASSUMPTION" as const});

function panelBox(params: Partial<PanelBoxParams> & Pick<PanelBoxParams, "outer" | "shell" | "entrance">): PanelBoxParams {
  return {
    family: "PANEL_BOX",
    groundClearanceMm: 50,
    raiseWith: "BATTENS",
    insulation: null,
    lining: null,
    insulateFloor: true,
    insulateRoof: true,
    roofCoveringId: "roofing-felt",
    roofOverhangMm: 50,
    secondaryOpening: null,
    chambers: 1,
    serviceRoof: false,
    hasFloor: true,
    ...params
  };
}

function tote(params: Partial<ToteParams> & Pick<ToteParams, "outerTote" | "liningMode">): ToteParams {
  return {
    family: "TOTE_IN_TOTE",
    innerTote: null,
    foam: null,
    entrance: {widthMm: 150, heightMm: 150, sillMm: 80, count: 1},
    raiseWith: "BRICKS",
    groundClearanceMm: 100,
    ...params
  };
}

function shade(params: Partial<ShadeParams> & Pick<ShadeParams, "footprint" | "clearHeightFrontMm" | "clearHeightRearMm" | "roof">): ShadeParams {
  return {
    family: "SHADE_STRUCTURE",
    roofCoveringId: null,
    roofOverhangMm: 80,
    sides: "OPEN",
    sidePanel: null,
    platform: null,
    legProfileMm: [45, 45],
    legCount: 4,
    ...params
  };
}

type Draft = Omit<PracticalModel, "version" | "validationState" | "params"> & {params: FamilyParams};

const t = (srName: string, srDescription: string, enName: string, enDescription: string) => ({
  sr: {name: srName, description: srDescription},
  en: {name: enName, description: enDescription}
});

const drafts: Draft[] = [
  // ───────────── Emergency ─────────────
  {
    id: "emergency-cardboard-dry-01",
    slug: "emergency-cardboard-dry",
    designClass: "EMERGENCY",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 1},
    seasons: ["EMERGENCY"],
    exposure: "COVERED_ONLY",
    emergencyOnly: true,
    difficulty: "NONE",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [10, 25],
    budgetClass: "FREE_REUSED",
    coverage: COV_SIMPLE,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-straw-not-hay"],
    bedding: "straw",
    params: {family: "EMERGENCY_WRAP", container: {...nominal(500, 400, 350), materialId: "cardboard"}, wrapMaterialId: null, entrance: {widthMm: 150, heightMm: 150, sillMm: 80, count: 1}, raiseWith: "BRICKS", groundClearanceMm: 80},
    translations: t(
      "Hitna kartonska kutija za suvo mesto",
      "Kartonska kutija sa slamom za jednu noć ili par dana, isključivo pod krovom: na tremu, u ulazu ili šupi. Nije zaštita od kiše.",
      "Emergency Cardboard Dry",
      "A cardboard box with straw for a night or a few days, strictly under a roof: a porch, a doorway or a shed. It is not rain protection."
    )
  },
  {
    id: "emergency-waterproof-wrap-01",
    slug: "emergency-waterproof-wrap",
    designClass: "EMERGENCY",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 1},
    seasons: ["EMERGENCY", "RAIN"],
    exposure: "SHELTERED",
    emergencyOnly: true,
    difficulty: "NONE",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [20, 40],
    budgetClass: "FREE_REUSED",
    coverage: COV_SIMPLE,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-straw-not-hay"],
    bedding: "straw",
    params: {family: "EMERGENCY_WRAP", container: {...nominal(500, 400, 350), materialId: "cardboard"}, wrapMaterialId: "waterproof-sheet", entrance: {widthMm: 150, heightMm: 150, sillMm: 80, count: 1}, raiseWith: "BRICKS", groundClearanceMm: 100},
    translations: t(
      "Hitno sklonište od kartona i folije",
      "Kartonska kutija obmotana spolja građevinskom folijom ili debelom kesom, podignuta na cigle i sa slamom. Za veče kada nema ničeg drugog; menja se čim se navlaži.",
      "Waterproof Emergency Shelter",
      "A cardboard box wrapped outside with construction film or a heavy bag, raised on bricks and filled with straw. For an evening when nothing else is available; replace it as soon as it gets damp."
    )
  },
  {
    id: "transit-carrier-shelter-01",
    slug: "transit-carrier-shelter",
    designClass: "EMERGENCY",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 1},
    seasons: ["EMERGENCY"],
    exposure: "COVERED_ONLY",
    emergencyOnly: true,
    difficulty: "NONE",
    tools: ["NONE"],
    buildTimeMinutes: [5, 15],
    budgetClass: "FREE_REUSED",
    coverage: COV_SIMPLE,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-straw-not-hay"],
    bedding: "straw",
    params: {family: "EMERGENCY_WRAP", container: {...nominal(480, 320, 300), materialId: "pet-carrier"}, wrapMaterialId: null, entrance: {widthMm: 200, heightMm: 220, sillMm: 30, count: 1}, raiseWith: "BRICKS", groundClearanceMm: 80},
    translations: t(
      "Privremeni smeštaj u transporteru",
      "Stari transporter za ljubimce sa slamom kao prelazno sklonište pod nadstrešnicom, na primer posle hvatanja ili tokom premeštanja. Rešetka i otvori propuštaju vetar.",
      "Transit Emergency Carrier",
      "An old pet carrier with straw as a transitional shelter under cover, for example after trapping or during relocation. The grille and slots let wind through."
    )
  },
  // ───────────── Reuse / containers ─────────────
  {
    id: "foam-shipping-box-01",
    slug: "foam-shipping-box-shelter",
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "EMERGENCY"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "NONE",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [15, 40],
    budgetClass: "FREE_REUSED",
    coverage: COV_SIMPLE,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-straw-not-hay"],
    bedding: "straw",
    params: {family: "FOAM_CONTAINER", box: {...nominal(600, 400, 350), wallThicknessMm: 50}, outerShell: "WRAP", outerTote: null, entrance: {widthMm: 150, heightMm: 150, sillMm: 80, count: 1}, raiseWith: "BRICKS", groundClearanceMm: 100},
    translations: t(
      "Sklonište od stiropor transportne kutije",
      "Čista stiropor kutija (ribarnice, apoteke, laboratorije) sa ulazom, slamom i folijom preko krova. ASPCApro navodi kutije debljine oko 2 inča kao jeftino vodootporno rešenje.",
      "Foam Shipping Box Shelter",
      "A clean foam shipping box (fishmongers, pharmacies, labs) with an entrance, straw and film over the roof. ASPCApro mentions coolers about 2 inches thick as an inexpensive waterproof option."
    )
  },
  {
    id: "eps-core-tote-01",
    slug: "eps-core-plastic-shell",
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [30, 60],
    budgetClass: "ULTRA_LOW",
    coverage: COV_SIMPLE,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-build-outdoor-shelter", "alleycat-straw-not-hay"],
    bedding: "straw",
    params: {family: "FOAM_CONTAINER", box: {...nominal(600, 400, 350), wallThicknessMm: 50}, outerShell: "TOTE", outerTote: nominal(700, 480, 420), entrance: {widthMm: 150, heightMm: 150, sillMm: 80, count: 1}, raiseWith: "BRICKS", groundClearanceMm: 100},
    translations: t(
      "Stiropor jezgro u plastičnoj kutiji",
      "Stiropor kutija smeštena u veću plastičnu kutiju: plastika štiti penu od kiše, sunca i grebanja spolja, a pena daje izolaciju. Ulaz se seče poravnato kroz obe.",
      "EPS Core in Plastic Shell",
      "A foam box placed inside a larger tote: the plastic protects the foam from rain, sun and outside scratching while the foam insulates. The entrance is cut through both, aligned."
    )
  },
  {
    id: "tote-single-basic-01",
    slug: "single-plastic-tote",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 1},
    seasons: ["RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "NONE",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [15, 30],
    budgetClass: "ULTRA_LOW",
    coverage: COV_SIMPLE,
    sourceIds: ["alleycat-providing-shelter", "aspcapro-community-cat-winter"],
    bedding: "straw",
    params: tote({outerTote: nominal(600, 400, 350), liningMode: "NONE"}),
    translations: t(
      "Jedna plastična kutija",
      "Najjednostavniji zaklon od kiše i vetra: kutija sa poklopcem, ulazom i malo slame. Bez izolacije nije zimsko rešenje; služi kao početak koji se kasnije nadograđuje.",
      "Single Plastic Tote",
      "The simplest rain and wind cover: a lidded tote with an entrance and a little straw. Without insulation it is not a winter solution; it is a starting point to upgrade later."
    )
  },
  {
    id: "tote-straw-01",
    slug: "tote-with-straw",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "NONE",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [20, 40],
    budgetClass: "ULTRA_LOW",
    coverage: COV_SIMPLE,
    sourceIds: ["alleycat-straw-not-hay", "aspcapro-community-cat-winter"],
    bedding: "straw",
    params: tote({outerTote: nominal(600, 400, 350), liningMode: "STRAW_ONLY"}),
    translations: t(
      "Plastična kutija sa slamom",
      "Kutija podignuta od tla, sa visokim pragom ulaza i rastresitom slamom do polovine visine. Jeftino zimsko rešenje za jednu mačku dok se ne napravi izolovano sklonište.",
      "Tote with Straw",
      "A tote raised off the ground, with a high entrance sill and loose straw up to half the height. An inexpensive winter option for one cat until an insulated shelter is built."
    )
  },
  {
    id: "tote-eps-liner-01",
    slug: "tote-eps-lined",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [60, 120],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-build-outdoor-shelter", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: tote({outerTote: nominal(700, 480, 420), liningMode: "FOAM_LINER", foam: {materialId: "eps", thicknessMm: 30}}),
    translations: t(
      "Plastična kutija sa EPS oblogom",
      "Kutija obložena iznutra stiroporom od 30 mm sa svih strana i ispod poklopca. Pena mora biti pokrivena slamom i proveravana zbog grebanja.",
      "Tote + EPS Lining",
      "A tote lined inside with 30 mm EPS on every side and under the lid. The foam must be covered by straw and checked for scratching."
    )
  },
  {
    id: "tote-xps-liner-01",
    slug: "tote-xps-lined",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [60, 120],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["aspcapro-community-cat-winter", "fibran-xps-300", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: tote({outerTote: nominal(700, 480, 420), liningMode: "FOAM_LINER", foam: {materialId: "xps", thicknessMm: 30}}),
    translations: t(
      "Plastična kutija sa XPS oblogom",
      "Ista kutija kao EPS varijanta, ali sa XPS pločama koje bolje podnose vlagu i pritisak. Pogodna kada imate ostatke XPS-a od gradnje.",
      "Tote + XPS Lining",
      "The same tote as the EPS variant but with XPS boards that tolerate moisture and pressure better. Useful when you have XPS offcuts from construction."
    )
  },
  {
    id: "tote-in-tote-straw-01",
    slug: "tote-in-tote-straw",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [45, 90],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-build-outdoor-shelter", "alleycat-straw-not-hay"],
    bedding: "straw",
    params: tote({outerTote: nominal(760, 470, 400), innerTote: nominal(600, 380, 300), liningMode: "FOAM_SLAB_AND_INNER_TOTE", foam: {materialId: "eps", thicknessMm: 30}}),
    translations: t(
      "Kutija u kutiji sa slamom",
      "Postupak Alley Cat Allies: velika kutija od oko 30 galona, ploča pene na dnu, manja kutija od oko 20 galona unutra i slama, sa jednim ulazom kroz obe kutije.",
      "Tote-in-Tote + Straw",
      "The Alley Cat Allies method: a large tote of about 30 gallons, a foam slab on the bottom, a smaller tote of about 20 gallons inside and straw, with one entrance through both."
    )
  },
  {
    id: "double-tote-insulated-01",
    slug: "double-tote-insulated",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE"],
    buildTimeMinutes: [60, 120],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-build-outdoor-shelter", "aspcapro-community-cat-winter", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: tote({outerTote: nominal(760, 470, 400), innerTote: nominal(600, 380, 330), liningMode: "FOAM_GAP_AND_INNER_TOTE", foam: {materialId: "eps", thicknessMm: 30}}),
    translations: t(
      "Dvostruka izolovana kutija",
      "Kutija u kutiji sa pločama pene i u procepu između zidova, ne samo na dnu. Više rada i materijala od osnovne varijante, uz potpuniji izolacioni sloj.",
      "Double Tote Insulated",
      "A tote-in-tote with foam panels also in the gap between walls, not only on the bottom. More work and material than the basic version, with a more complete insulation layer."
    )
  },
  {
    id: "crate-cat-01",
    slug: "wooden-crate-shelter",
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE", "HAND_SAW"],
    buildTimeMinutes: [60, 120],
    budgetClass: "ULTRA_LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-providing-shelter", "aspcapro-community-cat-winter", "epa-cca-treated-wood"],
    bedding: "straw",
    params: {family: "CRATE", crate: nominal(600, 400, 380), outerInsulation: {materialId: "eps", thicknessMm: 30}, wrapMaterialId: "waterproof-sheet", entrance: catEntrance, raiseWith: "BRICKS", groundClearanceMm: 100},
    translations: t(
      "Sklonište od drvenog sanduka",
      "Proveren drveni sanduk sa izolacijom postavljenom spolja i vodootpornim omotačem, tako da mačka unutra dodiruje drvo, a ne penu.",
      "Wooden Crate Shelter",
      "A checked wooden crate with insulation fitted outside and a waterproof wrap, so the cat touches wood inside rather than foam."
    )
  },
  {
    id: "scrap-wood-cat-01",
    slug: "scrap-wood-cat-box",
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [180, 360],
    budgetClass: "FREE_REUSED",
    coverage: COV_CUT,
    sourceIds: ["alleycat-providing-shelter", "aspcapro-community-cat-winter", "epa-cca-treated-wood"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 750, depthMm: 550, frontHeightMm: 520, rearHeightMm: 460}, shell: {materialId: "scrap-lumber", thicknessMm: 20}, insulation: {materialId: "eps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 4}, entrance: catEntrance}),
    translations: t(
      "Kućica za mačke od starih dasaka",
      "Kutija od proverenih starih dasaka sa stiroporom i tankom unutrašnjom oblogom. Daske nepoznatog porekla, sa uljem ili starom impregnacijom se odbacuju.",
      "Scrap Wood Cat Box",
      "A box of checked old boards with EPS and a thin interior lining. Boards of unknown origin, with oil or old preservative treatment, are rejected."
    )
  },
  {
    id: "pallet-cat-mini-01",
    slug: "pallet-mini-cat-shelter",
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "WIND"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [240, 420],
    budgetClass: "FREE_REUSED",
    coverage: COV_CUT,
    sourceIds: ["alleycat-providing-shelter", "ippc-ispm-15", "epa-cca-treated-wood"],
    bedding: "straw",
    params: {
      family: "PALLET_FRAME",
      pallet: nominal(1200, 800, 144),
      sections: [
        {role: "FLOOR", sourcePallet: 0, lengthMm: 800, heightMm: 600},
        {role: "FRONT_LEFT", sourcePallet: 0, lengthMm: 300, heightMm: 400},
        {role: "BACK", sourcePallet: 1, lengthMm: 800, heightMm: 400},
        {role: "FRONT_RIGHT", sourcePallet: 1, lengthMm: 300, heightMm: 400},
        {role: "SIDE_LEFT", sourcePallet: 2, lengthMm: 600, heightMm: 400},
        {role: "SIDE_RIGHT", sourcePallet: 2, lengthMm: 600, heightMm: 400}
      ],
      cladding: {materialId: "scrap-lumber", thicknessMm: 20},
      cavityInsulation: {materialId: "eps", thicknessMm: 30},
      lining: {materialId: "plywood-interior", thicknessMm: 4},
      roof: {materialId: "osb3", thicknessMm: 12},
      roofCoveringId: "roofing-felt",
      roofOverhangMm: 60,
      roofFallMm: 40,
      entranceHeightMm: 200,
      groundClearanceMm: 144
    },
    translations: t(
      "Mala kućica za mačke od paleta",
      "Tri proverene palete isečene u pod i zidove, sa stiroporom u šupljinama, daskama preko razmaka i unutrašnjom oblogom. Paleta sama daje podizanje od tla.",
      "Pallet Mini Cat Shelter",
      "Three checked pallets cut into a floor and walls, with EPS in the cavities, boards over the gaps and an interior lining. The pallet itself raises the floor off the ground."
    )
  },
  // ───────────── Budget / DIY cat boxes ─────────────
  {
    id: "osb-economy-cat-01",
    slug: "osb-economy-cat",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [240, 420],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 700, depthMm: 550, frontHeightMm: 520, rearHeightMm: 460}, shell: {materialId: "osb3", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 4}, entrance: catEntrance}),
    translations: t(
      "Ekonomična OSB kućica za mačke",
      "Kutija od OSB/3 ploče sa stiroporom i tankom oblogom, krovnom lepenkom i padom krova ka nazad. Zaštita ivica OSB-a je obavezna.",
      "OSB Economy Cat",
      "An OSB/3 box with EPS and a thin lining, roofing felt and a roof falling to the rear. Sealing the OSB edges is mandatory."
    )
  },
  {
    id: "plywood-economy-cat-01",
    slug: "plywood-economy-cat",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 2, max: 3},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [240, 420],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter", "fibran-xps-300", "iso-10456-2007"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 800, depthMm: 600, frontHeightMm: 540, rearHeightMm: 480}, shell: {materialId: "plywood-exterior", thicknessMm: 12}, insulation: {materialId: "xps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 4}, entrance: catEntrance}),
    translations: t(
      "Ekonomična kućica od šperploče za mačke",
      "Šperploča za spoljnu upotrebu, XPS od 30 mm i unutrašnja obloga. Za dve mačke koje se slažu, bez rama i okova inženjerskih modela.",
      "Plywood Economy Cat",
      "Exterior plywood, 30 mm XPS and an interior lining. For two cats that get along, without the framing and hardware of the engineered models."
    )
  },
  {
    id: "compact-single-cat-01",
    slug: "compact-single-cat-winter",
    designClass: "STANDARD_DIY",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [360, 600],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: ["aspcapro-community-cat-winter", "fibran-xps-300", "iso-10456-2007"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 620, depthMm: 520, frontHeightMm: 520, rearHeightMm: 460}, shell: {materialId: "plywood-exterior", thicknessMm: 12}, insulation: {materialId: "xps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 6}, roofCoveringId: "bitumen-membrane", serviceRoof: true, groundClearanceMm: 80, entrance: catEntrance}),
    translations: t(
      "Kompaktna zimska kućica za jednu mačku",
      "Mali unutrašnji volumen, XPS od 50 mm, servisni krov na šarkama i bitumenska traka. Pojednostavljena verzija za samostalnu izradu bez kompajliranog rama.",
      "Compact Single Cat Winter",
      "Small interior volume, 50 mm XPS, a hinged service roof and bituminous membrane. A simplified DIY version without a compiled frame."
    )
  },
  {
    id: "two-cat-budget-01",
    slug: "two-cat-budget-winter",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 2, max: 2},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [240, 420],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 760, depthMm: 560, frontHeightMm: 540, rearHeightMm: 480}, shell: {materialId: "osb3", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 4}, entrance: catEntrance}),
    translations: t(
      "Budžetska zimska kućica za dve mačke",
      "OSB kutija sa stiroporom od 50 mm, jednim ulazom i dovoljno mesta da se dve mačke sklupčaju zajedno.",
      "Two Cat Budget Winter",
      "An OSB box with 50 mm EPS, one entrance and enough room for two cats to curl up together."
    )
  },
  {
    id: "double-chamber-budget-01",
    slug: "double-chamber-budget",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 2, max: 3},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [300, 480],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: ["aspcapro-community-cat-winter", "alleycat-providing-shelter", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 1000, depthMm: 560, frontHeightMm: 540, rearHeightMm: 480}, shell: {materialId: "osb3", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 4}, chambers: 2, entrance: {...catEntrance, count: 2}}),
    translations: t(
      "Budžetska kućica sa dve komore",
      "Dve odvojene komore sa po jednim ulazom, za mačke koje ne dele isti prostor ili za izlaz za bekstvo kod jednog ulaza.",
      "Double Chamber Budget",
      "Two separate chambers, each with one entrance, for cats that do not share a space or to keep an escape option per entrance."
    )
  },
  {
    id: "four-cat-modular-budget-01",
    slug: "four-cat-modular-budget",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 4, max: 4},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [360, 600],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: ["alleycat-providing-shelter", "aspcapro-community-cat-winter", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 1200, depthMm: 650, frontHeightMm: 600, rearHeightMm: 530}, shell: {materialId: "osb3", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 4}, chambers: 2, entrance: {...catEntrance, count: 2}}),
    translations: t(
      "Budžetski modul za četiri mačke",
      "Dve komore za po dve mačke u jednoj kutiji od OSB-a, blizu preporuke Alley Cat Allies od oko 2 × 3 stope za manju grupu.",
      "Four Cat Modular Budget",
      "Two chambers for two cats each in one OSB box, close to the Alley Cat Allies suggestion of about 2 × 3 ft for a small group."
    )
  },
  {
    id: "six-cat-colony-budget-01",
    slug: "six-cat-colony-budget",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 6, max: 6},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [480, 720],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: ["alleycat-providing-shelter", "aspcapro-community-cat-winter", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 1600, depthMm: 700, frontHeightMm: 650, rearHeightMm: 570}, shell: {materialId: "osb3", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 4}, chambers: 3, entrance: {...catEntrance, count: 3}, serviceRoof: true, roofOverhangMm: 60}),
    translations: t(
      "Budžetska kućica za koloniju od šest mačaka",
      "Tri komore sa po jednim ulazom i servisnim krovom za čišćenje. Budžetska alternativa inženjerskom modelu Alpska Kolonija Šest.",
      "Six Cat Colony Budget",
      "Three chambers with one entrance each and a service roof for cleaning. A budget alternative to the engineered Alpine Colony Six."
    )
  },
  {
    id: "stackable-colony-module-01",
    slug: "stackable-colony-module",
    designClass: "STANDARD_DIY",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [300, 480],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: ["alleycat-providing-shelter", "fibran-xps-300", "iso-10456-2007"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 600, depthMm: 500, frontHeightMm: 470, rearHeightMm: 450}, shell: {materialId: "plywood-exterior", thicknessMm: 12}, insulation: {materialId: "xps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 4}, roofCoveringId: "epdm", roofOverhangMm: 20, entrance: catEntrance}),
    translations: t(
      "Složivi modul za koloniju",
      "Isti modul koji se pravi u seriji i slaže najviše dva u visinu uz pričvršćivanje. Mali pad krova od 20 mm i dalje vodi vodu ka nazad.",
      "Stackable Colony Module",
      "The same module built in batches and stacked at most two high when secured. A small 20 mm roof fall still sends water to the rear."
    )
  },
  {
    id: "covered-porch-cat-01",
    slug: "covered-porch-cat-shelter",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["WINTER"],
    exposure: "COVERED_ONLY",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [180, 300],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: ["aspcapro-community-cat-winter", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: {widthMm: 700, depthMm: 550, frontHeightMm: 480, rearHeightMm: 440}, shell: {materialId: "osb3", thicknessMm: 9}, insulation: {materialId: "eps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 4}, roofCoveringId: null, roofOverhangMm: 10, entrance: catEntrance}),
    translations: t(
      "Kućica za mačke ispod nadstrešnice",
      "Lakša izolovana kutija bez krovnog pokrivača, samo za trem, šupu ili garažu gde ne pada kiša. Napolju bez krova ne sme da stoji.",
      "Covered Porch Cat Shelter",
      "A lighter insulated box without roof covering, only for a porch, shed or garage with no rain. It must not stand outside without a roof."
    )
  },
  {
    id: "cat-l-entry-vestibule-01",
    slug: "cat-l-entry-vestibule",
    designClass: "STANDARD_DIY",
    structureType: "ENTRANCE_VESTIBULE",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [90, 180],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-providing-shelter"],
    bedding: "none",
    params: panelBox({outer: {widthMm: 340, depthMm: 300, frontHeightMm: 320, rearHeightMm: 300}, shell: {materialId: "plywood-exterior", thicknessMm: 12}, roofCoveringId: "epdm", roofOverhangMm: 20, hasFloor: false, insulateFloor: false, insulateRoof: false, raiseWith: "NONE", groundClearanceMm: 0, entrance: catEntrance, secondaryOpening: {wall: "SIDE", widthMm: 150, heightMm: 180, sillMm: 30}}),
    translations: t(
      "L-predulaz za mačje sklonište",
      "Mala kutija bez poda koja se postavlja ispred ulaza: mačka ulazi sa strane i skreće, pa vetar ne duva direktno u sklonište. Alley Cat Allies pominje L-ulaz kao zaštitu od vremena.",
      "Cat L-Entry Vestibule",
      "A small floorless box fitted in front of the entrance: the cat enters from the side and turns, so wind does not blow straight into the shelter. Alley Cat Allies mentions an L-shaped entry as weather protection."
    )
  },
  // ───────────── Cat: wind, rain, summer, feeding ─────────────
  {
    id: "windbreak-cat-01",
    slug: "windbreak-cat-shelter",
    designClass: "BUDGET",
    structureType: "WINDBREAK",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 2, max: 4},
    seasons: ["WIND", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [120, 240],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-providing-shelter"],
    bedding: "none",
    params: shade({footprint: {widthMm: 900, depthMm: 600}, clearHeightFrontMm: 600, clearHeightRearMm: 500, roof: {materialId: "osb3", thicknessMm: 12}, roofCoveringId: "roofing-felt", sides: "BACK_AND_SIDE", sidePanel: {materialId: "osb3", thicknessMm: 12}, platform: {heightMm: 100, top: {materialId: "osb3", thicknessMm: 12}}}),
    translations: t(
      "Zaštita od vetra za mačke",
      "Krov sa zadnjim i jednim bočnim panelom okrenutim ka vetru i podignutom podlogom. Daje zaklon od vetra i kiše tokom dana, ali nije zimsko sklonište za spavanje.",
      "Windbreak Shelter",
      "A roof with a back and one side panel facing the wind and a raised base. It gives daytime cover from wind and rain but is not a winter sleeping shelter."
    )
  },
  {
    id: "rain-shelter-cat-01",
    slug: "rain-shelter-cat",
    designClass: "BUDGET",
    structureType: "SHADE",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 2, max: 4},
    seasons: ["RAIN", "ALL_SEASON"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [120, 240],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-providing-shelter"],
    bedding: "none",
    params: shade({footprint: {widthMm: 900, depthMm: 650}, clearHeightFrontMm: 650, clearHeightRearMm: 550, roof: {materialId: "osb3", thicknessMm: 12}, roofCoveringId: "bitumen-membrane", sides: "BACK", sidePanel: {materialId: "osb3", thicknessMm: 12}, platform: {heightMm: 120, top: {materialId: "osb3", thicknessMm: 12}}}),
    translations: t(
      "Nadstrešnica protiv kiše za mačke",
      "Krov sa zadnjim panelom i suvom podignutom podlogom za odmor tokom kišnih dana. Ispod nje se može postaviti i zatvoreno sklonište.",
      "Rain Shelter",
      "A roof with a back panel and a dry raised base for resting on rainy days. A closed shelter can also be placed beneath it."
    )
  },
  {
    id: "summer-shade-cat-01",
    slug: "summer-shade-cat",
    designClass: "BUDGET",
    structureType: "SHADE",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 2, max: 4},
    seasons: ["SUMMER"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [90, 180],
    budgetClass: "LOW",
    coverage: COV_CUT_NO_NEST,
    sourceIds: SUMMER_CAT_SOURCES,
    bedding: "none",
    params: shade({footprint: {widthMm: 900, depthMm: 650}, clearHeightFrontMm: 600, clearHeightRearMm: 520, roof: {materialId: "polycarbonate", thicknessMm: 10}, platform: {heightMm: 150, top: {materialId: "polycarbonate", thicknessMm: 10}}}),
    translations: t(
      "Letnja senka za mačke",
      "Otvorena konstrukcija sa neprovidnim krovom i podignutom podlogom: senka bez zatvorenog prostora u kome se skuplja toplota. Postaviti na travu, ne na beton.",
      "Summer Shade Cat Shelter",
      "An open structure with an opaque roof and a raised base: shade without an enclosed space that traps heat. Place it on grass, not concrete."
    )
  },
  {
    id: "summer-cross-vent-cat-01",
    slug: "summer-cross-vent-cat",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 1, max: 2},
    seasons: ["SUMMER", "RAIN"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [150, 300],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: SUMMER_CAT_SOURCES,
    bedding: "none",
    params: panelBox({outer: {widthMm: 750, depthMm: 550, frontHeightMm: 500, rearHeightMm: 440}, shell: {materialId: "plywood-exterior", thicknessMm: 12}, roofCoveringId: "epdm", roofOverhangMm: 80, groundClearanceMm: 80, entrance: catEntrance, secondaryOpening: {wall: "REAR", widthMm: 150, heightMm: 150, sillMm: 150}}),
    translations: t(
      "Letnje sklonište sa promajom",
      "Neizolovana kutija sa ulazom napred i drugim otvorom pozadi da topao vazduh može da struji, kako Alley Cat Allies preporučuje za leto. Mora stajati u punoj senci.",
      "Summer Cross-Vent Shelter",
      "An uninsulated box with an entrance at the front and a second opening at the rear so hot air can move through, as Alley Cat Allies recommends for summer. It must stand in full shade."
    )
  },
  {
    id: "covered-feeding-station-cat-01",
    slug: "covered-feeding-station-cat",
    designClass: "BUDGET",
    structureType: "FEEDING_STATION",
    animal: "cat",
    animalSizeClass: "standard",
    capacity: {recommended: 3, max: 6},
    seasons: ["ALL_SEASON", "RAIN"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [120, 240],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["alleycat-summer-weather", "alleycat-providing-shelter"],
    bedding: "none",
    params: shade({footprint: {widthMm: 800, depthMm: 500}, clearHeightFrontMm: 450, clearHeightRearMm: 380, roof: {materialId: "osb3", thicknessMm: 12}, roofCoveringId: "bitumen-membrane", sides: "THREE_SIDES", sidePanel: {materialId: "osb3", thicknessMm: 12}, platform: {heightMm: 100, top: {materialId: "osb3", thicknessMm: 12}}}),
    translations: t(
      "Natkriveno hranilište za mačke",
      "Hranilište sa krovom i tri zatvorene strane, podignuto od tla, da hrana i voda ostanu suve i u senci. Nije sklonište za spavanje.",
      "Covered Feeding Station",
      "A feeding station with a roof and three closed sides, raised off the ground, so food and water stay dry and shaded. It is not a sleeping shelter."
    )
  },
  // ───────────── Dogs: reuse ─────────────
  ...(["small", "medium", "large"] as const).map((size): Draft => ({
    id: `scrap-timber-dog-${size}-01`,
    slug: `scrap-timber-dog-${size}`,
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: size,
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: size === "large" ? [360, 600] : [300, 480],
    budgetClass: "FREE_REUSED",
    coverage: COV_CUT,
    sourceIds: [...DOG_SOURCES, "epa-cca-treated-wood"],
    bedding: "straw",
    params: panelBox({outer: dogBox[size], shell: {materialId: "scrap-lumber", thicknessMm: 20}, insulation: {materialId: "eps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 6}, groundClearanceMm: 80, roofOverhangMm: size === "large" ? 30 : 80, entrance: dogEntrance[size]}),
    translations: t(
      `Kućica za ${size === "small" ? "malog" : size === "medium" ? "srednjeg" : "velikog"} psa od stare građe`,
      `Kućica od proverenih starih dasaka sa stiroporom i unutrašnjom oblogom koju pas ne može da gricka, za ${size === "small" ? "malog" : size === "medium" ? "srednjeg" : "velikog"} psa. Pre izrade izmerite psa.`,
      `Scrap Timber Dog House ${size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}`,
      `A house of checked old boards with EPS and an interior lining the dog cannot chew, for a ${size} dog. Measure the dog before building.`
    )
  })),
  {
    id: "pallet-dog-basic-01",
    slug: "pallet-dog-basic",
    designClass: "REUSE",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 1},
    seasons: ["RAIN", "WIND"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [240, 420],
    budgetClass: "FREE_REUSED",
    coverage: COV_CUT,
    sourceIds: ["ippc-ispm-15", "epa-cca-treated-wood", "humane-world-pets-cold"],
    bedding: "straw",
    params: {
      family: "PALLET_FRAME",
      pallet: nominal(1200, 800, 144),
      sections: [
        {role: "FLOOR", sourcePallet: 0, lengthMm: 1200, heightMm: 800},
        {role: "BACK", sourcePallet: 1, lengthMm: 1200, heightMm: 800},
        {role: "SIDE_LEFT", sourcePallet: 2, lengthMm: 800, heightMm: 800},
        {role: "FRONT_LEFT", sourcePallet: 2, lengthMm: 400, heightMm: 800},
        {role: "SIDE_RIGHT", sourcePallet: 3, lengthMm: 800, heightMm: 800},
        {role: "FRONT_RIGHT", sourcePallet: 3, lengthMm: 400, heightMm: 800}
      ],
      cladding: {materialId: "scrap-lumber", thicknessMm: 20},
      cavityInsulation: null,
      lining: null,
      roof: {materialId: "osb3", thicknessMm: 15},
      roofCoveringId: "roofing-felt",
      roofOverhangMm: 80,
      roofFallMm: 60,
      entranceHeightMm: 600,
      groundClearanceMm: 144
    },
    translations: t(
      "Osnovna kućica za psa od paleta",
      "Četiri proverene palete, daske preko razmaka i krov sa padom ka nazad. Zaklon od kiše i vetra bez izolacije; za zimu je potrebna nadogradnja.",
      "Pallet Basic Dog House",
      "Four checked pallets, boards over the gaps and a roof falling to the rear. Rain and wind cover without insulation; winter use needs an upgrade."
    )
  },
  {
    id: "pallet-osb-dog-01",
    slug: "pallet-osb-dog",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [360, 600],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["ippc-ispm-15", "epa-cca-treated-wood", "humane-world-pets-cold", "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: {
      family: "PALLET_FRAME",
      pallet: nominal(1200, 800, 144),
      sections: [
        {role: "FLOOR", sourcePallet: 0, lengthMm: 1200, heightMm: 800},
        {role: "BACK", sourcePallet: 1, lengthMm: 1200, heightMm: 800},
        {role: "SIDE_LEFT", sourcePallet: 2, lengthMm: 800, heightMm: 800},
        {role: "FRONT_LEFT", sourcePallet: 2, lengthMm: 400, heightMm: 800},
        {role: "SIDE_RIGHT", sourcePallet: 3, lengthMm: 800, heightMm: 800},
        {role: "FRONT_RIGHT", sourcePallet: 3, lengthMm: 400, heightMm: 800}
      ],
      cladding: {materialId: "osb3", thicknessMm: 12},
      cavityInsulation: {materialId: "eps", thicknessMm: 50},
      lining: {materialId: "plywood-interior", thicknessMm: 9},
      roof: {materialId: "osb3", thicknessMm: 15},
      roofCoveringId: "bitumen-membrane",
      roofOverhangMm: 80,
      roofFallMm: 60,
      entranceHeightMm: 600,
      groundClearanceMm: 144
    },
    translations: t(
      "Kućica za psa od paleta i OSB-a",
      "Isti okvir od paleta kao osnovna verzija, sa stiroporom u šupljinama, OSB oblogom spolja i unutrašnjom oblogom. Pod i krov nisu izolovani.",
      "Pallet + OSB Dog House",
      "The same pallet frame as the basic version, with EPS in the cavities, OSB cladding outside and an interior lining. Floor and roof are not insulated."
    )
  },
  // ───────────── Dogs: budget panel boxes ─────────────
  ...(["small", "medium", "large"] as const).map((size): Draft => ({
    id: `osb-economy-dog-${size}-01`,
    slug: `osb-economy-dog-${size}`,
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: size,
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: size === "large" ? [360, 600] : [300, 480],
    budgetClass: "LOW",
    coverage: COV_FULL,
    sourceIds: [...DOG_SOURCES, "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: dogBox[size], shell: {materialId: "osb3", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 6}, groundClearanceMm: 80, roofOverhangMm: size === "large" ? 30 : 80, entrance: dogEntrance[size]}),
    translations: t(
      `Ekonomična OSB kućica za ${size === "small" ? "malog" : size === "medium" ? "srednjeg" : "velikog"} psa`,
      `OSB/3 kutija sa stiroporom od 30 mm, unutrašnjom oblogom i krovnom lepenkom, za ${size === "small" ? "malog" : size === "medium" ? "srednjeg" : "velikog"} psa. Ivice OSB-a moraju biti zaštićene.`,
      `OSB Economy Dog House ${size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}`,
      `An OSB/3 box with 30 mm EPS, an interior lining and roofing felt, for a ${size} dog. OSB edges must be protected.`
    )
  })),
  {
    id: "plywood-economy-dog-01",
    slug: "plywood-economy-dog",
    designClass: "BUDGET",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [300, 480],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: [...DOG_SOURCES, "fibran-xps-300", "iso-10456-2007"],
    bedding: "straw",
    params: panelBox({outer: dogBox.medium, shell: {materialId: "plywood-exterior", thicknessMm: 12}, insulation: {materialId: "xps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 6}, groundClearanceMm: 80, roofOverhangMm: 80, roofCoveringId: "bitumen-membrane", entrance: dogEntrance.medium}),
    translations: t(
      "Ekonomična kućica od šperploče za srednjeg psa",
      "Šperploča za spoljnu upotrebu, XPS od 30 mm i bitumenska traka na krovu. Jednostavnija od inženjerskih modela, bez rama i servisnog krova.",
      "Plywood Economy Dog House",
      "Exterior plywood, 30 mm XPS and a bituminous membrane on the roof. Simpler than the engineered models, without framing or a service roof."
    )
  },
  {
    id: "insulated-eps-dog-small-01",
    slug: "insulated-eps-dog-small",
    designClass: "STANDARD_DIY",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: "small",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [420, 720],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: [...DOG_SOURCES, "iso-10456-2007", "doe-basc-insulation-r-values"],
    bedding: "straw",
    params: panelBox({outer: dogBox.small, shell: {materialId: "plywood-exterior", thicknessMm: 12}, insulation: {materialId: "eps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 9}, groundClearanceMm: 100, roofOverhangMm: 80, roofCoveringId: "bitumen-membrane", serviceRoof: true, entrance: dogEntrance.small}),
    translations: t(
      "Izolovana EPS kućica za malog psa",
      "Šperploča, stiropor od 50 mm i obloga od 9 mm koju pas teže oštećuje, sa servisnim krovom za čišćenje.",
      "Insulated EPS Dog House Small",
      "Plywood, 50 mm EPS and a 9 mm lining that a dog damages less easily, with a service roof for cleaning."
    )
  },
  ...(["medium", "large"] as const).map((size): Draft => ({
    id: `insulated-xps-dog-${size}-01`,
    slug: `insulated-xps-dog-${size}`,
    designClass: "STANDARD_DIY",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: size,
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "INTERMEDIATE",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: size === "large" ? [540, 900] : [480, 780],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: [...DOG_SOURCES, "fibran-xps-300", "iso-10456-2007"],
    bedding: "straw",
    params: panelBox({outer: dogBox[size], shell: {materialId: "plywood-exterior", thicknessMm: 12}, insulation: {materialId: "xps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 9}, groundClearanceMm: 100, roofOverhangMm: size === "large" ? 30 : 90, roofCoveringId: "bitumen-membrane", serviceRoof: true, entrance: dogEntrance[size]}),
    translations: t(
      `Izolovana XPS kućica za ${size === "medium" ? "srednjeg" : "velikog"} psa`,
      `Šperploča, XPS od 50 mm, obloga od 9 mm i servisni krov. Alternativa za samostalnu izradu inženjerskom modelu Alpska ${size === "medium" ? "srednja" : "velika"} zimska, bez kompajliranog rama i okova.`,
      `Insulated XPS Dog House ${size === "medium" ? "Medium" : "Large"}`,
      `Plywood, 50 mm XPS, a 9 mm lining and a service roof. A DIY alternative to the engineered Alpine ${size === "medium" ? "Medium" : "Large"} Winter, without a compiled frame and hardware.`
    )
  })),
  {
    id: "serviceable-modular-dog-01",
    slug: "serviceable-modular-dog-house",
    designClass: "STANDARD_DIY",
    structureType: "SLEEPING_SHELTER",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND", "ALL_SEASON"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "ADVANCED",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [600, 960],
    budgetClass: "MEDIUM",
    coverage: COV_FULL,
    sourceIds: [...DOG_SOURCES, "fibran-xps-300", "iso-10456-2007"],
    bedding: "washable-dog-bed",
    params: panelBox({outer: {widthMm: 950, depthMm: 1150, frontHeightMm: 1000, rearHeightMm: 900}, shell: {materialId: "plywood-exterior", thicknessMm: 15}, insulation: {materialId: "xps", thicknessMm: 50}, lining: {materialId: "plywood-interior", thicknessMm: 9}, groundClearanceMm: 120, raiseWith: "LEGS", roofOverhangMm: 100, roofCoveringId: "epdm", serviceRoof: true, entrance: dogEntrance.medium}),
    translations: t(
      "Servisna modularna kućica za psa",
      "Kućica sa servisnim krovom, nogama koje je drže 120 mm od tla i EPDM krovom, projektovana tako da se čisti, suši i popravlja bez rastavljanja.",
      "Serviceable Modular Dog House",
      "A house with a service roof, legs holding it 120 mm off the ground and an EPDM roof, designed to be cleaned, dried and repaired without dismantling."
    )
  },
  // ───────────── Dogs: summer, rain, platform, retrofit ─────────────
  ...([
    ["small", 900, 700, 700, 600, 4],
    ["medium", 1200, 900, 900, 780, 4],
    ["large", 1500, 1100, 1100, 950, 6]
  ] as const).map(([size, w, d, front, rear, legs]): Draft => ({
    id: `summer-shade-dog-${size}-01`,
    slug: `summer-shade-dog-${size}`,
    designClass: "BUDGET",
    structureType: "SHADE",
    animal: "dog",
    animalSizeClass: size,
    capacity: {recommended: 1, max: 1},
    seasons: ["SUMMER"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [120, 240],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: SUMMER_DOG_SOURCES,
    bedding: "none",
    params: shade({footprint: {widthMm: w, depthMm: d}, clearHeightFrontMm: front, clearHeightRearMm: rear, roof: {materialId: "polycarbonate", thicknessMm: 10}, legCount: legs, platform: {heightMm: 150, top: {materialId: "plywood-exterior", thicknessMm: 18}}}),
    translations: t(
      `Letnja senka za ${size === "small" ? "malog" : size === "medium" ? "srednjeg" : "velikog"} psa`,
      "Otvorena nadstrešnica sa neprovidnim krovom i podignutim ležištem kroz koje struji vazduh. Zatvorena kućica nije zaštita od velike vrućine; ovo je senka, uz vodu i slobodan izlaz.",
      `Summer Shade ${size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}`,
      "An open canopy with an opaque roof and a raised bed that air can move under. A closed doghouse is no protection from extreme heat; this is shade, with water and free movement."
    )
  })),
  {
    id: "rain-wind-dog-01",
    slug: "rain-wind-dog-shelter",
    designClass: "BUDGET",
    structureType: "WINDBREAK",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 2},
    seasons: ["RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "JIGSAW", "DRILL"],
    buildTimeMinutes: [180, 300],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["usda-aphis-dog-temperature", "humane-world-pets-cold"],
    bedding: "none",
    params: shade({footprint: {widthMm: 1200, depthMm: 900}, clearHeightFrontMm: 1000, clearHeightRearMm: 880, roof: {materialId: "osb3", thicknessMm: 15}, roofCoveringId: "bitumen-membrane", sides: "BACK_AND_SIDE", sidePanel: {materialId: "osb3", thicknessMm: 15}, platform: {heightMm: 120, top: {materialId: "plywood-exterior", thicknessMm: 18}}, roofOverhangMm: 100}),
    translations: t(
      "Pomoćni zaklon od kiše i vetra za psa",
      "Krov, zadnji i jedan bočni zid okrenut ka vetru i podignuto ležište. Dnevni zaklon pored kućice; nije zimsko sklonište za spavanje.",
      "Rain + Wind Auxiliary Shelter",
      "A roof, a back wall and one side wall facing the wind, with a raised bed. A daytime cover next to the house; not a winter sleeping shelter."
    )
  },
  {
    id: "raised-sleeping-platform-dog-01",
    slug: "raised-sleeping-platform-dog",
    designClass: "BUDGET",
    structureType: "RAISED_PLATFORM",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 1},
    seasons: ["SUMMER", "ALL_SEASON"],
    exposure: "SHELTERED",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["HAND_SAW", "DRILL"],
    buildTimeMinutes: [90, 180],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: ["humane-world-heatwave", "humane-world-pets-cold"],
    bedding: "none",
    params: {family: "RAISED_PLATFORM", top: {widthMm: 900, depthMm: 700}, topLayer: {materialId: "plywood-exterior", thicknessMm: 18}, heightMm: 150, legProfileMm: [45, 70], legCount: 4},
    translations: t(
      "Podignuto ležište za psa",
      "Jednostavno ležište podignuto 150 mm od tla, dalje od vlažne ili vrele podloge. Postavlja se u senku leti ili ispod nadstrešnice.",
      "Raised Sleeping Platform",
      "A simple bed raised 150 mm off the ground, away from damp or hot surfaces. Place it in shade in summer or under a canopy."
    )
  },
  {
    id: "retrofit-dog-house-kit-01",
    slug: "retrofit-existing-dog-house",
    designClass: "BUDGET",
    structureType: "RETROFIT_KIT",
    animal: "dog",
    animalSizeClass: "medium",
    capacity: {recommended: 1, max: 1},
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "BASIC",
    tools: ["UTILITY_KNIFE", "HAND_SAW", "DRILL"],
    buildTimeMinutes: [180, 420],
    budgetClass: "LOW",
    coverage: COV_CUT,
    sourceIds: [...DOG_SOURCES, "fibran-xps-300"],
    bedding: "straw",
    params: {family: "RETROFIT", referenceHouse: {widthMm: 900, depthMm: 1100, heightMm: 900, wallThicknessMm: 18}, items: ["ROOF_MEMBRANE", "RAISED_BASE", "ENTRANCE_FLAP", "WIND_BAFFLE", "INTERIOR_INSULATION", "PROTECTIVE_LINING", "FLOOR_INSULATION", "SERVICE_ACCESS"], insulation: {materialId: "xps", thicknessMm: 30}, lining: {materialId: "plywood-interior", thicknessMm: 6}, roofCoveringId: "bitumen-membrane"},
    translations: t(
      "Komplet za unapređenje postojeće kućice za psa",
      "Redosled radova za postojeću kućicu: najpre krov i voda, zatim podizanje, zaštita ulaza, pa tek onda izolacija sa zaštitnom oblogom. Primer je za referentnu kućicu; za svoju unesite mere u alat za unapređenje.",
      "Retrofit Existing Dog House",
      "The order of work for an existing house: roof and water first, then raising, entrance protection, and only then insulation with a protective lining. Shown for a reference house; enter your own house in the retrofit tool."
    )
  }
];

export const practicalModels: PracticalModel[] = drafts.map((draft) =>
  practicalModelSchema.parse({version: "1.0.0", validationState: "DATA_VALIDATED", ...draft})
);

export function getPracticalModel(slug: string) {
  return practicalModels.find((model) => model.slug === slug);
}
