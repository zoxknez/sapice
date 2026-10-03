import type {PracticalModel} from "@/lib/practical/domain";

export type InspectionFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "SEASONAL" | "AFTER_STORM";

export type InspectionItem = {
  id: string;
  frequency: InspectionFrequency;
  sr: string;
  en: string;
};

export const inspectionFrequencyLabel: Record<InspectionFrequency, {sr: string; en: string}> = {
  DAILY: {sr: "Svaki dan", en: "Daily"},
  WEEKLY: {sr: "Jednom nedeljno", en: "Weekly"},
  MONTHLY: {sr: "Jednom mesečno", en: "Monthly"},
  SEASONAL: {sr: "Na početku sezone", en: "Each season"},
  AFTER_STORM: {sr: "Posle nevremena", en: "After storms"}
};

/**
 * Deterministic maintenance plan. Emergency and reused constructions get more frequent checks
 * because their materials degrade faster and their history is less known.
 */
export function inspectionPlan(model: PracticalModel): InspectionItem[] {
  const family = model.params.family;
  const frequent = model.designClass === "EMERGENCY" || model.emergencyOnly;
  const reused = model.designClass === "REUSE";
  const often = (normal: InspectionFrequency): InspectionFrequency => (frequent ? "DAILY" : reused && normal === "MONTHLY" ? "WEEKLY" : normal);
  const enclosed = model.structureType === "SLEEPING_SHELTER";
  const winter = model.seasons.includes("WINTER") || model.seasons.includes("EMERGENCY");
  const summer = model.seasons.includes("SUMMER");
  const plastic = family === "TOTE_IN_TOTE" || (family === "EMERGENCY_WRAP" && model.params.container.materialId === "pet-carrier");
  const foam = family === "FOAM_CONTAINER" || family === "CRATE" || (family === "TOTE_IN_TOTE" && model.params.foam !== null);
  const wood = family === "PANEL_BOX" || family === "PALLET_FRAME" || family === "SHADE_STRUCTURE" || family === "RAISED_PLATFORM" || family === "RETROFIT" || family === "CRATE";

  const items: InspectionItem[] = [];
  const push = (item: InspectionItem) => items.push(item);

  if (enclosed && model.bedding === "straw") {
    push({id: "bedding", frequency: often("WEEKLY"), sr: "Proverite da li je slama suva i rastresita; vlažnu ili zbijenu zamenite.", en: "Check that the straw is dry and loose; replace it when damp or compacted."});
  }
  if (enclosed) {
    push({id: "water-ingress", frequency: often("WEEKLY"), sr: "Proverite ima li vode ili vlage na podu i zidovima, naročito ispod ulaza.", en: "Check for water or dampness on the floor and walls, especially under the entrance."});
    push({id: "water-ingress-storm", frequency: "AFTER_STORM", sr: "Posle kiše ili snega proverite unutrašnjost i podlogu ispod skloništa.", en: "After rain or snow check the interior and the ground under the shelter."});
  }
  if (family === "EMERGENCY_WRAP" && model.params.container.materialId === "cardboard") {
    push({id: "cardboard-state", frequency: "DAILY", sr: "Karton koji je omekšao, navlažen ili deformisan odmah zamenite.", en: "Replace cardboard immediately if it is soft, damp or deformed."});
  }
  if (family !== "TOTE_IN_TOTE" && family !== "FOAM_CONTAINER" && family !== "EMERGENCY_WRAP") {
    push({id: "roof", frequency: often("MONTHLY"), sr: "Proverite krovni pokrivač, preklope i da li voda otiče pozadi, dalje od ulaza.", en: "Check the roof covering, overlaps and that water runs off at the rear, away from the entrance."});
  }
  if (wood) {
    push({id: "fasteners", frequency: often("MONTHLY"), sr: "Proverite da li su šrafovi i ekseri čvrsti i da nijedan vrh ne viri.", en: "Check that screws and nails are tight and no tip protrudes."});
    push({id: "edges", frequency: often("MONTHLY"), sr: "Proverite ivice: bez iverja, pukotina i nabubrelih delova.", en: "Check edges: no splinters, cracks or swollen areas."});
  }
  if (foam) {
    push({id: "chew", frequency: often("WEEKLY"), sr: "Proverite tragove grebanja ili grickanja pene; oštećene delove zaštitite ili zamenite.", en: "Check for scratching or chewing of the foam; protect or replace damaged parts."});
  }
  if (plastic || family === "FOAM_CONTAINER") {
    push({id: "cracking", frequency: often("MONTHLY"), sr: "Proverite pukotine na plastici i oštre ivice oko otvora.", en: "Check the plastic for cracks and sharp edges around the opening."});
    push({id: "uv", frequency: "SEASONAL", sr: "Kvalitativno: plastika i pena na suncu postaju krte; zamenite ih kada izblede ili se mrve.", en: "Qualitative: plastic and foam become brittle in sunlight; replace them when they fade or crumble."});
    push({id: "secured", frequency: often("WEEKLY"), sr: "Proverite da je lagano sklonište i dalje opterećeno ili pričvršćeno.", en: "Check that the lightweight shelter is still weighted or secured."});
  }
  if (winter && enclosed) {
    push({id: "snow", frequency: "AFTER_STORM", sr: "Očistite sneg sa ulaza i izlaza da životinja ne bi ostala zatvorena.", en: "Clear snow from entrances and exits so the animal cannot be snowed in."});
  }
  if (summer) {
    push({id: "shade", frequency: "WEEKLY", sr: "Proverite da li je mesto i dalje u punoj senci u najtoplijem delu dana i da li ima sveže vode u blizini.", en: "Check that the spot is still fully shaded in the hottest part of the day and that fresh water is nearby."});
  }
  push({id: "cleaning", frequency: frequent ? "WEEKLY" : "SEASONAL", sr: "Očistite unutrašnjost; servisni pristup mora omogućiti čišćenje bez rastavljanja.", en: "Clean the interior; service access must allow cleaning without dismantling."});
  return items;
}
