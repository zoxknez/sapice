import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {packCutParts} from "@/lib/nesting";
import {assemblyInsulationMm} from "@/data/assemblies";

export type CostLine = {
  id: string;
  labelSr: string;
  labelEn: string;
  quantity: number;
  unit: "sheet" | "m2" | "m" | "item";
  noteSr: string;
  noteEn: string;
};

export function costLinesForModel(model: ShelterModel): CostLine[] {
  const compiled = compileShelterModel(model);

  const sheets12 = packCutParts(
    compiled.cutParts.filter((part) => part.material === "plywood-12"),
    {sheetWidthMm: 2500, sheetHeightMm: 1250, kerfMm: 3, marginMm: 10}
  ).length;

  const sheets9 = packCutParts(
    compiled.cutParts.filter((part) => part.material === "plywood-9"),
    {sheetWidthMm: 2500, sheetHeightMm: 1250, kerfMm: 3, marginMm: 10}
  ).length;

  const xpsBoards = packCutParts(
    compiled.cutParts.filter((part) => part.material === "xps"),
    {sheetWidthMm: 1250, sheetHeightMm: 600, kerfMm: 2, marginMm: 5}
  ).length;

  const insulationMm = assemblyInsulationMm(compiled.assemblies.wall);
  const roofMembraneM2 = compiled.roofPanel.areaM2 * 1.15;

  const lines: CostLine[] = [
    {
      id: "plywood-12-sheet",
      labelSr: "Šperploča 12 mm",
      labelEn: "Plywood 12 mm",
      quantity: sheets12,
      unit: "sheet",
      noteSr: "Broj tabla iz nesting rasporeda 2500 × 1250 mm.",
      noteEn: "Sheet count from the 2500 × 1250 mm nesting layout."
    },
    {
      id: "plywood-9-sheet",
      labelSr: "Šperploča 9 mm",
      labelEn: "Plywood 9 mm",
      quantity: sheets9,
      unit: "sheet",
      noteSr: "Broj tabla iz nesting rasporeda 2500 × 1250 mm.",
      noteEn: "Sheet count from the 2500 × 1250 mm nesting layout."
    },
    {
      id: "xps-board",
      labelSr: `XPS ${insulationMm} mm`,
      labelEn: `XPS ${insulationMm} mm`,
      quantity: xpsBoards,
      unit: "sheet",
      noteSr: "Broj ploča iz planerskog stock formata 1250 × 600 mm. Proveriti dimenzije kod lokalnog dobavljača.",
      noteEn: "Board count from the planning stock size 1250 × 600 mm. Verify dimensions with the local supplier."
    },
    {
      id: "roof-membrane",
      labelSr: "Hidroizolacija krova",
      labelEn: "Roof waterproofing",
      quantity: roofMembraneM2,
      unit: "m2",
      noteSr: "Površina kompletnog kosog krovnog panela + 15% rezerve za preklop i otpad.",
      noteEn: "Full sloped roof panel area + 15% allowance for overlap and waste."
    },
    {
      id: "timber-frame",
      labelSr: `Drvene letve ${compiled.framing.frameProfileMm[0]} × ${compiled.framing.frameProfileMm[1]} mm + baza ${compiled.framing.baseProfileMm[0]} × ${compiled.framing.baseProfileMm[1]} mm`,
      labelEn: `Timber framing ${compiled.framing.frameProfileMm[0]} × ${compiled.framing.frameProfileMm[1]} mm + base ${compiled.framing.baseProfileMm[0]} × ${compiled.framing.baseProfileMm[1]} mm`,
      quantity: compiled.framing.totalLinearM * 1.1,
      unit: "m",
      noteSr: "Ukupna linearna metraža framing schedule-a + 10% rezerve. Profili su PROVISIONAL do engineering review-a.",
      noteEn: "Total framing schedule length + 10% allowance. Profiles remain PROVISIONAL until engineering review."
    },

  ];

  for (const item of compiled.hardwareItems) {
    lines.push({
      id: `hardware-${item.id}`,
      labelSr: item.nameSr,
      labelEn: item.nameEn,
      quantity: item.quantity,
      unit: item.unit === "m" ? "m" : "item",
      noteSr: item.notesSr,
      noteEn: item.notesEn
    });
  }

  if (model.heated) {
    lines.push({
      id: "heating-product",
      labelSr: "Namenski pet-heating proizvod",
      labelEn: "Purpose-built pet heating product",
      quantity: 1,
      unit: "item",
      noteSr: "Cena konkretnog kompatibilnog proizvoda. Aplikacija ne projektuje improvizovan grejač.",
      noteEn: "Price of the selected compatible product. The app does not design an improvised heater."
    });
  }

  return lines;
}
