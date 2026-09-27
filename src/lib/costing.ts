import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {packCutParts} from "@/lib/nesting";
import {assemblyInsulationMm} from "@/data/assemblies";

export type CostLine = {
  id: string;
  labelSr: string;
  labelEn: string;
  quantity: number;
  unit: "sheet" | "m2" | "item";
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
      id: "hardware",
      labelSr: "Šrafovi, šarke, zaptivanje",
      labelEn: "Fasteners, hinges, sealing",
      quantity: 1,
      unit: "item",
      noteSr: "Privremena zbirna stavka dok framing/hardware BOM ne bude detaljno kompiliran.",
      noteEn: "Temporary lump-sum line until the framing/hardware BOM is fully compiled."
    }
  ];

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
