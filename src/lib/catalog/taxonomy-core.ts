// Zod-free taxonomy: safe to import from client components.
import type {AppLocale} from "@/i18n/routing";

/**
 * Design class says WHAT a construction is (its constraints and intent).
 * It is deliberately independent from the validation ladder, which says how far a
 * model has actually been verified. Never present a design class as a quality grade.
 */
export const designClassValues = ["EMERGENCY", "REUSE", "BUDGET", "STANDARD_DIY", "ENGINEERED"] as const;
export type DesignClass = (typeof designClassValues)[number];
export const designClasses = designClassValues;

export const seasonValues = ["WINTER", "RAIN", "WIND", "SUMMER", "ALL_SEASON", "EMERGENCY"] as const;
export type Season = (typeof seasonValues)[number];

export const structureTypeValues = [
  "SLEEPING_SHELTER",
  "FEEDING_STATION",
  "WINDBREAK",
  "SHADE",
  "RAISED_PLATFORM",
  "ENTRANCE_VESTIBULE",
  "RETROFIT_KIT"
] as const;
export type StructureType = (typeof structureTypeValues)[number];

/**
 * Construction families select the compiler path. Geometry must match the real
 * construction: a plastic tote is not compiled as a plywood box.
 */
export const constructionFamilyValues = [
  "PANEL_BOX",
  "TOTE_IN_TOTE",
  "FOAM_CONTAINER",
  "CRATE",
  "PALLET_FRAME",
  "SHADE_STRUCTURE",
  "RAISED_PLATFORM",
  "RETROFIT",
  "EMERGENCY_WRAP"
] as const;
export type ConstructionFamily = (typeof constructionFamilyValues)[number];

export const calculationCoverageValues = [
  "GEOMETRY",
  "BOM",
  "CUT_LIST",
  "NESTING",
  "THERMAL_TRANSMISSION",
  "COST",
  "THREE_D",
  "DRAWING",
  "BUILD_GUIDE"
] as const;
export type CalculationCoverage = (typeof calculationCoverageValues)[number];
export const calculationCoverages = calculationCoverageValues;

export const difficultyValues = ["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "WORKSHOP"] as const;
export type Difficulty = (typeof difficultyValues)[number];
export const difficultyRank: Record<Difficulty, number> = {
  NONE: 0,
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  WORKSHOP: 4
};

export const toolValues = [
  "NONE",
  "UTILITY_KNIFE",
  "HAND_SAW",
  "SCREWDRIVER",
  "DRILL",
  "JIGSAW",
  "CIRCULAR_SAW",
  "WORKSHOP"
] as const;
export type Tool = (typeof toolValues)[number];
export const tools = toolValues.filter((tool) => tool !== "NONE");

export const budgetClassValues = ["FREE_REUSED", "ULTRA_LOW", "LOW", "MEDIUM", "ENGINEERED"] as const;
export type BudgetClass = (typeof budgetClassValues)[number];
export const budgetClassRank: Record<BudgetClass, number> = {
  FREE_REUSED: 0,
  ULTRA_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  ENGINEERED: 4
};

/** Where the structure may be placed without relying on an extra roof above it. */
export const exposureRequirementValues = ["COVERED_ONLY", "SHELTERED", "EXPOSED_OK"] as const;
export type ExposureRequirement = (typeof exposureRequirementValues)[number];

const labels = {
  designClass: {
    EMERGENCY: {sr: "Hitno", en: "Emergency"},
    REUSE: {sr: "Ponovna upotreba", en: "Reuse"},
    BUDGET: {sr: "Budžet", en: "Budget"},
    STANDARD_DIY: {sr: "Standardna izrada", en: "Standard DIY"},
    ENGINEERED: {sr: "Inženjerski", en: "Engineered"}
  },
  designClassHint: {
    EMERGENCY: {
      sr: "Privremeno rešenje od onoga što je pri ruci, za kratak period i uz svakodnevnu proveru.",
      en: "A temporary solution from what is at hand, for a short period and with daily checks."
    },
    REUSE: {
      sr: "Napravljeno od iskorišćenog materijala posle provere njegovog stanja i porekla.",
      en: "Built from reused material after checking its condition and history."
    },
    BUDGET: {
      sr: "Trajna konstrukcija sa malo kupljenog materijala i osnovnim alatom.",
      en: "A durable build with little purchased material and basic tools."
    },
    STANDARD_DIY: {
      sr: "Potpuna izolovana konstrukcija za iskusnijeg majstora sa električnim alatom.",
      en: "A complete insulated build for a more experienced maker with power tools."
    },
    ENGINEERED: {
      sr: "Višeslojni kompajlirani model sa ramom, okovom, krojnom listom i termičkom procenom.",
      en: "A multi-layer compiled model with framing, hardware, cut list and thermal estimate."
    }
  },
  season: {
    WINTER: {sr: "Zima", en: "Winter"},
    RAIN: {sr: "Kiša", en: "Rain"},
    WIND: {sr: "Vetar", en: "Wind"},
    SUMMER: {sr: "Leto", en: "Summer"},
    ALL_SEASON: {sr: "Cele godine", en: "All season"},
    EMERGENCY: {sr: "Hitna situacija", en: "Emergency"}
  },
  structureType: {
    SLEEPING_SHELTER: {sr: "Sklonište", en: "Shelter"},
    FEEDING_STATION: {sr: "Hranilište", en: "Feeding station"},
    WINDBREAK: {sr: "Zaštita od vetra", en: "Windbreak"},
    SHADE: {sr: "Senka", en: "Shade"},
    RAISED_PLATFORM: {sr: "Podignuto ležište", en: "Raised platform"},
    ENTRANCE_VESTIBULE: {sr: "Predulaz", en: "Entrance vestibule"},
    RETROFIT_KIT: {sr: "Unapređenje postojeće kućice", en: "Retrofit kit"}
  },
  family: {
    PANEL_BOX: {sr: "Kutija od ploča", en: "Panel box"},
    TOTE_IN_TOTE: {sr: "Plastična kutija", en: "Plastic tote"},
    FOAM_CONTAINER: {sr: "Stiropor kutija", en: "Foam container"},
    CRATE: {sr: "Drveni sanduk", en: "Wooden crate"},
    PALLET_FRAME: {sr: "Paleta", en: "Pallet frame"},
    SHADE_STRUCTURE: {sr: "Nadstrešnica", en: "Shade structure"},
    RAISED_PLATFORM: {sr: "Podignuta platforma", en: "Raised platform"},
    RETROFIT: {sr: "Unapređenje", en: "Retrofit"},
    EMERGENCY_WRAP: {sr: "Hitna obloga", en: "Emergency wrap"}
  },
  coverage: {
    GEOMETRY: {sr: "Geometrija", en: "Geometry"},
    BOM: {sr: "Spisak materijala", en: "Bill of materials"},
    CUT_LIST: {sr: "Krojna lista", en: "Cut list"},
    NESTING: {sr: "Raspored na pločama", en: "Sheet nesting"},
    THERMAL_TRANSMISSION: {sr: "Termička procena", en: "Thermal estimate"},
    COST: {sr: "Troškovnik", en: "Cost estimate"},
    THREE_D: {sr: "3D prikaz", en: "3D view"},
    DRAWING: {sr: "Crtež", en: "Drawing"},
    BUILD_GUIDE: {sr: "Uputstvo za izradu", en: "Build guide"}
  },
  difficulty: {
    NONE: {sr: "Bez veštine", en: "No skill needed"},
    BASIC: {sr: "Početnik", en: "Beginner"},
    INTERMEDIATE: {sr: "Srednje", en: "Intermediate"},
    ADVANCED: {sr: "Napredno", en: "Advanced"},
    WORKSHOP: {sr: "Radionica", en: "Workshop"}
  },
  tool: {
    NONE: {sr: "Bez alata", en: "No tools"},
    UTILITY_KNIFE: {sr: "Skalpel", en: "Utility knife"},
    HAND_SAW: {sr: "Ručna testera", en: "Hand saw"},
    SCREWDRIVER: {sr: "Odvijač", en: "Screwdriver"},
    DRILL: {sr: "Bušilica", en: "Drill"},
    JIGSAW: {sr: "Ubodna testera", en: "Jigsaw"},
    CIRCULAR_SAW: {sr: "Cirkular", en: "Circular saw"},
    WORKSHOP: {sr: "Radionica", en: "Workshop"}
  },
  budgetClass: {
    FREE_REUSED: {sr: "Besplatno / iskorišćeno", en: "Free / reused"},
    ULTRA_LOW: {sr: "Vrlo nizak", en: "Ultra low"},
    LOW: {sr: "Nizak", en: "Low"},
    MEDIUM: {sr: "Srednji", en: "Medium"},
    ENGINEERED: {sr: "Inženjerski", en: "Engineered"}
  },
  exposure: {
    COVERED_ONLY: {sr: "Samo pod nadstrešnicom", en: "Covered location only"},
    SHELTERED: {sr: "Zaklonjeno mesto napolju", en: "Sheltered outdoor spot"},
    EXPOSED_OK: {sr: "Može na otvorenom", en: "Exposed outdoor spot"}
  }
} as const;

type LabelGroup = keyof typeof labels;

export function taxonomyLabel<G extends LabelGroup>(
  group: G,
  value: keyof (typeof labels)[G],
  locale: AppLocale
): string {
  const entry = labels[group][value] as {sr: string; en: string};
  return entry[locale];
}
