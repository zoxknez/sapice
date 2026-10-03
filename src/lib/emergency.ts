/**
 * Deterministic "what can I make tonight?" chooser. Options are ordered from the most durable
 * to the least durable solution the user's items allow; nothing is ranked by a score.
 */
export const emergencyItems = ["CARDBOARD_BOX", "PLASTIC_TOTE", "FOAM_BOX", "PET_CARRIER", "PLASTIC_SHEET", "TAPE", "STRAW", "BRICKS_OR_PALLET", "COVERED_SPOT", "KNIFE"] as const;
export type EmergencyItem = (typeof emergencyItems)[number];

type Option = {slug: string; needs: EmergencyItem[]; helpful: EmergencyItem[]};

/** Most durable first. */
export const emergencyOptions: Option[] = [
  {slug: "eps-core-plastic-shell", needs: ["PLASTIC_TOTE", "FOAM_BOX", "KNIFE"], helpful: ["STRAW", "BRICKS_OR_PALLET", "TAPE"]},
  {slug: "tote-with-straw", needs: ["PLASTIC_TOTE", "STRAW", "KNIFE"], helpful: ["BRICKS_OR_PALLET", "TAPE"]},
  {slug: "foam-shipping-box-shelter", needs: ["FOAM_BOX", "KNIFE"], helpful: ["PLASTIC_SHEET", "STRAW", "BRICKS_OR_PALLET", "TAPE"]},
  {slug: "single-plastic-tote", needs: ["PLASTIC_TOTE", "KNIFE"], helpful: ["STRAW", "BRICKS_OR_PALLET"]},
  {slug: "transit-carrier-shelter", needs: ["PET_CARRIER", "COVERED_SPOT"], helpful: ["STRAW", "BRICKS_OR_PALLET"]},
  {slug: "emergency-waterproof-wrap", needs: ["CARDBOARD_BOX", "PLASTIC_SHEET", "TAPE", "KNIFE"], helpful: ["STRAW", "BRICKS_OR_PALLET"]},
  {slug: "emergency-cardboard-dry", needs: ["CARDBOARD_BOX", "COVERED_SPOT", "KNIFE"], helpful: ["STRAW", "BRICKS_OR_PALLET", "TAPE"]}
];

export type EmergencyRecommendation = {slug: string; missing: EmergencyItem[]; helpfulMissing: EmergencyItem[]; possible: boolean};

export function emergencyRecommendations(have: EmergencyItem[]): EmergencyRecommendation[] {
  return emergencyOptions.map((option) => {
    const missing = option.needs.filter((item) => !have.includes(item));
    return {slug: option.slug, missing, helpfulMissing: option.helpful.filter((item) => !have.includes(item)), possible: missing.length === 0};
  }).sort((a, b) => Number(b.possible) - Number(a.possible) || a.missing.length - b.missing.length || emergencyOptions.findIndex((option) => option.slug === a.slug) - emergencyOptions.findIndex((option) => option.slug === b.slug));
}

export const emergencyItemCopy: Record<EmergencyItem, {sr: string; en: string}> = {
  CARDBOARD_BOX: {sr: "Kartonska kutija", en: "Cardboard box"},
  PLASTIC_TOTE: {sr: "Plastična kutija sa poklopcem", en: "Plastic tote with a lid"},
  FOAM_BOX: {sr: "Stiropor kutija (ribarnica, apoteka)", en: "Foam box (fishmonger, pharmacy)"},
  PET_CARRIER: {sr: "Transporter za ljubimce", en: "Pet carrier"},
  PLASTIC_SHEET: {sr: "Folija ili debela kesa", en: "Plastic sheet or heavy bag"},
  TAPE: {sr: "Lepljiva traka", en: "Tape"},
  STRAW: {sr: "Slama", en: "Straw"},
  BRICKS_OR_PALLET: {sr: "Cigle, blokovi ili paleta", en: "Bricks, blocks or a pallet"},
  COVERED_SPOT: {sr: "Mesto pod krovom (trem, šupa)", en: "A spot under a roof (porch, shed)"},
  KNIFE: {sr: "Skalpel ili nož", en: "Utility knife"}
};
