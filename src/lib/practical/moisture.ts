import type {PracticalModel} from "@/lib/practical/domain";
import type {CompiledPracticalModel} from "@/lib/practical/compiler";

export type MoistureCheck = {
  id: "GROUND_CONTACT" | "SPLASH" | "ROOF_DRAINAGE" | "ENTRY_RAIN" | "DRYING" | "ABSORBENT_INTERIOR" | "MAINTENANCE_ACCESS";
  status: "OK" | "ATTENTION" | "NOT_APPLICABLE";
  sr: string;
  en: string;
};

/**
 * Qualitative water-management profile. These are explanatory design checks derived from the
 * canonical geometry, not a condensation calculation (ISO 13788-type analysis is out of scope).
 */
export function moistureProfile(model: PracticalModel, compiled: CompiledPracticalModel): MoistureCheck[] {
  const p = model.params;
  const envelope = compiled.envelope;
  const clearance = envelope.groundClearanceMm;
  const open = envelope.openSides;
  const sill = envelope.entrances[0]?.sillMm ?? null;
  const serviceable =
    (p.family === "PANEL_BOX" && p.serviceRoof) ||
    p.family === "TOTE_IN_TOTE" ||
    p.family === "FOAM_CONTAINER" ||
    p.family === "RETROFIT" ||
    open;
  const absorbent =
    (p.family === "EMERGENCY_WRAP" && p.container.materialId === "cardboard") ||
    (p.family === "PANEL_BOX" && p.shell.materialId === "scrap-lumber") ||
    p.family === "CRATE" ||
    p.family === "PALLET_FRAME";
  const slopedRoof = p.family === "PANEL_BOX" || p.family === "PALLET_FRAME" || p.family === "SHADE_STRUCTURE";

  return [
    clearance >= 50
      ? {id: "GROUND_CONTACT", status: "OK", sr: `Podignuto oko ${clearance} mm od tla.`, en: `Raised about ${clearance} mm off the ground.`}
      : {id: "GROUND_CONTACT", status: open ? "NOT_APPLICABLE" : "ATTENTION", sr: "Pod je blizu tla; podignite ga na suvu podlogu.", en: "The floor is close to the ground; raise it onto a dry base."},
    clearance >= 100
      ? {id: "SPLASH", status: "OK", sr: "Dovoljno visoko da kapi kiše sa tla ne prskaju po podu.", en: "High enough that rain splash from the ground does not hit the floor."}
      : {id: "SPLASH", status: open ? "NOT_APPLICABLE" : "ATTENTION", sr: "Kapi kiše sa tla mogu da prskaju po podu i donjim ivicama; zaštitite ivice.", en: "Rain splash from the ground can reach the floor and lower edges; protect the edges."},
    slopedRoof
      ? {id: "ROOF_DRAINAGE", status: "OK", sr: "Krov pada od ulaza ka nazad, pa voda otiče dalje od ulaza.", en: "The roof falls from the entrance to the rear, so water runs off away from the entrance."}
      : {id: "ROOF_DRAINAGE", status: "ATTENTION", sr: "Poklopac je ravan: voda otiče na strane. Poklopac mora dobro da naleže, a ulaz ne sme biti ispod ivice gde se voda sliva.", en: "The lid is flat: water runs off to the sides. It must close well and the entrance must not sit below a drip edge."},
    sill === null
      ? {id: "ENTRY_RAIN", status: "NOT_APPLICABLE", sr: "Otvorena konstrukcija bez ulaza.", en: "Open structure without an entrance."}
      : sill >= 50
        ? {id: "ENTRY_RAIN", status: "OK", sr: `Prag ulaza je ${sill} mm iznad poda.`, en: `The entrance sill is ${sill} mm above the floor.`}
        : {id: "ENTRY_RAIN", status: "ATTENTION", sr: "Nizak prag: kiša i sneg lakše ulaze; okrenite ulaz od vetra.", en: "Low sill: rain and snow get in more easily; turn the entrance away from wind."},
    serviceable
      ? {id: "DRYING", status: "OK", sr: "Može se otvoriti radi sušenja i zamene posteljine.", en: "Can be opened to dry out and change bedding."}
      : {id: "DRYING", status: "ATTENTION", sr: "Bez servisnog otvora sušenje i čišćenje su teži; posteljinu menjajte kroz ulaz.", en: "Without a service opening drying and cleaning are harder; change bedding through the entrance."},
    absorbent
      ? {id: "ABSORBENT_INTERIOR", status: "ATTENTION", sr: "Materijal upija vlagu; proveravajte ga češće i menjajte kad se navlaži.", en: "The material absorbs moisture; check it more often and replace it when damp."}
      : {id: "ABSORBENT_INTERIOR", status: "OK", sr: "Unutrašnje površine ne upijaju mnogo vlage.", en: "Interior surfaces do not absorb much moisture."},
    serviceable || p.family === "EMERGENCY_WRAP"
      ? {id: "MAINTENANCE_ACCESS", status: "OK", sr: "Pristup za proveru i čišćenje je jednostavan.", en: "Access for checks and cleaning is simple."}
      : {id: "MAINTENANCE_ACCESS", status: "ATTENTION", sr: "Ostavite prostor oko kućice za proveru i čišćenje.", en: "Leave room around the house for checks and cleaning."}
  ];
}
