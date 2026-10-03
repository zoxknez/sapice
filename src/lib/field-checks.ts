/**
 * Deterministic field checklists: reuse-material inspection and shelter placement.
 * Neither produces a certificate. They produce a user checklist state with explanations.
 */

export const reuseRejectCriteria = [
  "CHEMICAL_CONTAMINATION",
  "STRONG_CHEMICAL_SMELL",
  "OIL",
  "VISIBLE_SPILLS",
  "ROT",
  "MOULD",
  "SHARP_OR_CRACKED",
  "PROTRUDING_FASTENERS",
  "UNKNOWN_TREATED_TIMBER_CHEWABLE",
  "DISINTEGRATING"
] as const;
export type ReuseRejectCriterion = (typeof reuseRejectCriteria)[number];

export const reuseAcceptCriteria = ["CLEAN", "DRY", "UNDAMAGED", "KNOWN_USE", "NO_CHEMICALS", "SUITS_ROLE", "OWNER_PERMISSION"] as const;
export type ReuseAcceptCriterion = (typeof reuseAcceptCriteria)[number];

export type ReuseAnswers = {
  reject: Partial<Record<ReuseRejectCriterion, boolean>>;
  accept: Partial<Record<ReuseAcceptCriterion, boolean>>;
};

export type ReuseState = "REJECTED" | "CHECKLIST_PASSED" | "INCOMPLETE";

/** Any reject criterion rejects; every accept criterion must be confirmed to pass. */
export function reuseState(answers: ReuseAnswers): ReuseState {
  if (reuseRejectCriteria.some((criterion) => answers.reject[criterion])) return "REJECTED";
  if (reuseAcceptCriteria.every((criterion) => answers.accept[criterion])) return "CHECKLIST_PASSED";
  return "INCOMPLETE";
}

export const reuseCopy: Record<ReuseRejectCriterion | ReuseAcceptCriterion, {sr: string; en: string}> = {
  CHEMICAL_CONTAMINATION: {sr: "Nepoznato hemijsko zagađenje", en: "Unknown chemical contamination"},
  STRONG_CHEMICAL_SMELL: {sr: "Jak hemijski miris", en: "Strong chemical smell"},
  OIL: {sr: "Ulje ili mast", en: "Oil or grease"},
  VISIBLE_SPILLS: {sr: "Vidljive mrlje od prosutih supstanci", en: "Visible spill stains"},
  ROT: {sr: "Trulež", en: "Rot"},
  MOULD: {sr: "Buđ koju nije moguće bezbedno ukloniti", en: "Mould that cannot be safely removed"},
  SHARP_OR_CRACKED: {sr: "Oštar, ispucao ili iverast materijal", en: "Sharp, cracked or splintered material"},
  PROTRUDING_FASTENERS: {sr: "Ekseri ili šrafovi koji vire", en: "Protruding nails or screws"},
  UNKNOWN_TREATED_TIMBER_CHEWABLE: {sr: "Nepoznata stara impregnirana građa tamo gde je životinja može gristi ili lizati", en: "Unknown old treated timber where the animal could chew or lick it"},
  DISINTEGRATING: {sr: "Materijal koji se raspada ili mrvi", en: "Material that is falling apart or crumbling"},
  CLEAN: {sr: "Čist", en: "Clean"},
  DRY: {sr: "Suv", en: "Dry"},
  UNDAMAGED: {sr: "Neoštećen", en: "Undamaged"},
  KNOWN_USE: {sr: "Poznata prethodna upotreba", en: "Known previous use"},
  NO_CHEMICALS: {sr: "Bez tragova hemikalija", en: "No trace of chemicals"},
  SUITS_ROLE: {sr: "Odgovara nameni (nosivi deo, obloga, izolacija)", en: "Suits the intended role (structure, lining, insulation)"},
  OWNER_PERMISSION: {sr: "Dobijen uz dozvolu vlasnika", en: "Obtained with the owner's permission"}
};

export const placementQuestions = [
  "GROUND_WET",
  "DIRECT_WIND",
  "MIDDAY_SUN",
  "RUNOFF_TO_ENTRANCE",
  "FLOODING_RISK",
  "PREDATOR_ACCESS",
  "SNOW_BLOCKING",
  "UNSTABLE_BASE",
  "NO_MAINTENANCE_ACCESS",
  "NOISY_BUSY"
] as const;
export type PlacementQuestion = (typeof placementQuestions)[number];

export type PlacementSeverity = "CRITICAL" | "ATTENTION";
export type PlacementResult = "NO_OBVIOUS_ISSUE" | "NEEDS_ATTENTION" | "CRITICAL_ISSUE";

export type PlacementContext = {animal: "cat" | "dog"; season: "WINTER" | "SUMMER" | "ALL"};

export function placementSeverity(question: PlacementQuestion, context: PlacementContext): PlacementSeverity {
  switch (question) {
    case "FLOODING_RISK":
    case "UNSTABLE_BASE":
      return "CRITICAL";
    case "PREDATOR_ACCESS":
      return context.animal === "cat" ? "CRITICAL" : "ATTENTION";
    case "MIDDAY_SUN":
      return context.season === "SUMMER" ? "CRITICAL" : "ATTENTION";
    default:
      return "ATTENTION";
  }
}

export function placementResult(answers: Partial<Record<PlacementQuestion, boolean>>, context: PlacementContext) {
  const issues = placementQuestions
    .filter((question) => answers[question])
    .map((question) => ({question, severity: placementSeverity(question, context)}));
  const result: PlacementResult = issues.some((issue) => issue.severity === "CRITICAL")
    ? "CRITICAL_ISSUE"
    : issues.length
      ? "NEEDS_ATTENTION"
      : "NO_OBVIOUS_ISSUE";
  return {result, issues};
}

export const placementCopy: Record<PlacementQuestion, {questionSr: string; questionEn: string; adviceSr: string; adviceEn: string}> = {
  GROUND_WET: {questionSr: "Da li je tlo vlažno ili se na njemu zadržava voda?", questionEn: "Is the ground damp or does water pool there?", adviceSr: "Podignite sklonište i proverite da li voda otiče od njega.", adviceEn: "Raise the shelter and check that water drains away from it."},
  DIRECT_WIND: {questionSr: "Da li dominantan vetar duva direktno u ulaz?", questionEn: "Does the prevailing wind blow straight into the entrance?", adviceSr: "Okrenite ulaz od vetra, postavite uz zid ili dodajte zavesu ili L-ulaz.", adviceEn: "Turn the entrance away from the wind, place it against a wall or add a flap or L-entry."},
  MIDDAY_SUN: {questionSr: "Da li je mesto na direktnom suncu u podne?", questionEn: "Is the spot in direct midday sun?", adviceSr: "Leti je potrebna puna senka; zatvorena kutija na suncu može postati opasno vruća.", adviceEn: "Summer needs full shade; a closed box in sun can become dangerously hot."},
  RUNOFF_TO_ENTRANCE: {questionSr: "Da li voda sa krova ili oluka teče ka ulazu?", questionEn: "Does water from a roof or gutter run toward the entrance?", adviceSr: "Pomerite sklonište ili okrenite ulaz; krov treba da odvodi vodu iza kućice.", adviceEn: "Move the shelter or turn the entrance; the roof should shed water behind the house."},
  FLOODING_RISK: {questionSr: "Može li mesto da bude poplavljeno?", questionEn: "Could the spot flood?", adviceSr: "Izaberite više mesto. Podizanje ne rešava poplavu.", adviceEn: "Choose higher ground. Raising does not solve flooding."},
  PREDATOR_ACCESS: {questionSr: "Mogu li psi lutalice ili predatori lako da priđu?", questionEn: "Can roaming dogs or predators easily reach it?", adviceSr: "Izaberite zaštićeno mesto; kod mačaka razmotrite drugi ulaz za bekstvo.", adviceEn: "Choose a protected spot; for cats consider a second escape entrance."},
  SNOW_BLOCKING: {questionSr: "Može li sneg da zatrpa ulaz?", questionEn: "Could snow block the entrance?", adviceSr: "Podignite ulaz i čistite sneg posle svake padavine.", adviceEn: "Raise the entrance and clear snow after every snowfall."},
  UNSTABLE_BASE: {questionSr: "Da li se podloga ili oslonci klate?", questionEn: "Do the base or supports rock?", adviceSr: "Napravite stabilnu, ravnu podlogu pre postavljanja.", adviceEn: "Make a stable, level base before placing the shelter."},
  NO_MAINTENANCE_ACCESS: {questionSr: "Da li je teško prići radi provere i čišćenja?", questionEn: "Is it hard to reach for checks and cleaning?", adviceSr: "Ostavite prostor do servisnog krova ili vrata.", adviceEn: "Leave room to reach the service roof or door."},
  NOISY_BUSY: {questionSr: "Da li je mesto bučno ili prometno?", questionEn: "Is the spot noisy or busy?", adviceSr: "Slobodnoživeće mačke biraju mirnija mesta; premestite sklonište bliže mestu gde već borave.", adviceEn: "Community cats prefer quiet spots; move the shelter closer to where they already rest."}
};
