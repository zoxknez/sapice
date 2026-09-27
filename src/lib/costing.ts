import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {materialSummary} from "@/lib/engineering";
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

const STANDARD_SHEET_AREA_M2 = 2.5 * 1.25;

export function costLinesForModel(model: ShelterModel): CostLine[] {
  const compiled = compileShelterModel(model);
  const materials = materialSummary(model);
  const sheets12 = packCutParts(
    compiled.cutParts.filter((part) => part.material === "plywood-12")
  ).length;

  const plywood9 = materials.find((item) => item.id === "plywood-9");
  const xps = materials.find((item) => item.id.startsWith("xps-"));
  const roofMembraneM2 = compiled.roofPanel.areaM2 * 1.15;

  const lines: CostLine[] = [
    {
      id: "plywood-12-sheet",
      labelSr: "Šperploča 12 mm",
      labelEn: "Plywood 12 mm",
      quantity: sheets12,
      unit: "sheet",
      noteSr: "Broj tabla iz V1 nesting rasporeda 2500 × 1250 mm.",
      noteEn: "Sheet count from the V1 2500 × 1250 mm nesting layout."
    }
  ];

  if (plywood9) {
    lines.push({
      id: "plywood-9-sheet",
      labelSr: "Šperploča 9 mm",
      labelEn: "Plywood 9 mm",
      quantity: Math.ceil(plywood9.purchaseM2 / STANDARD_SHEET_AREA_M2),
      unit: "sheet",
      noteSr: "Procena tabla iz surface-based unutrašnje obloge; detaljni nesting 9 mm sloja sledi.",
      noteEn: "Sheet estimate from surface-based interior lining; detailed 9 mm nesting is pending."
    });
  }

  if (xps) {
    const thickness = assemblyInsulationMm(compiled.assemblies.wall);
    lines.push({
      id: "xps-m2",
      labelSr: `XPS ${thickness} mm`,
      labelEn: `XPS ${thickness} mm`,
      quantity: xps.purchaseM2,
      unit: "m2",
      noteSr: "Površina uključuje 10% projektantske rezerve.",
      noteEn: "Area includes a 10% design allowance."
    });
  }

  lines.push(
    {
      id: "roof-membrane",
      labelSr: "Hidroizolacija krova",
      labelEn: "Roof waterproofing",
      quantity: roofMembraneM2,
      unit: "m2",
      noteSr: "Površina kosog krova + 15% rezerve za preklop i otpad.",
      noteEn: "True sloped roof area + 15% allowance for overlap and waste."
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
  );

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
