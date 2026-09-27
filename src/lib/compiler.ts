import type {ShelterModel} from "@/lib/domain";
import {roofSlope, surfaceAreas, thermalSummary} from "@/lib/engineering";

export type CutPart = {
  id: string;
  nameSr: string;
  nameEn: string;
  material: "plywood-12" | "plywood-9" | "xps";
  quantity: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  shape: "rectangle" | "trapezoid";
  notes?: string;
};

export type BuildStep = {
  id: string;
  titleSr: string;
  titleEn: string;
  detailSr: string;
  detailEn: string;
};

export function compileShelterModel(model: ShelterModel) {
  const wall = model.construction.wallThicknessMm;
  const floorThicknessMm = model.construction.floorInsulationMm + 24;
  const roofThicknessMm = model.construction.roofInsulationMm + 21;
  const internalWidthMm = Math.max(0, model.dimensions.widthMm - 2 * wall);
  const internalDepthMm = Math.max(0, model.dimensions.depthMm - 2 * wall);
  const internalFrontHeightMm = Math.max(0, model.dimensions.frontHeightMm - floorThicknessMm - roofThicknessMm);
  const internalRearHeightMm = Math.max(0, model.dimensions.rearHeightMm - floorThicknessMm - roofThicknessMm);
  const roof = roofSlope(model);
  const areas = surfaceAreas(model);
  const thermal = thermalSummary(model);

  const cutParts: CutPart[] = [
    {
      id: "floor-outer",
      nameSr: "Donja ploča poda",
      nameEn: "Lower floor panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.depthMm,
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "floor-inner",
      nameSr: "Unutrašnja ploča poda",
      nameEn: "Interior floor panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.depthMm,
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "front-outer",
      nameSr: "Spoljašnja prednja ploča",
      nameEn: "Exterior front panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.frontHeightMm,
      thicknessMm: 12,
      shape: "rectangle",
      notes: "Entrance cut-outs are defined by the shelter layout."
    },
    {
      id: "rear-outer",
      nameSr: "Spoljašnja zadnja ploča",
      nameEn: "Exterior rear panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.rearHeightMm,
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "side-outer",
      nameSr: "Spoljašnje bočne ploče",
      nameEn: "Exterior side panels",
      material: "plywood-12",
      quantity: 2,
      widthMm: model.dimensions.depthMm,
      heightMm: model.dimensions.frontHeightMm,
      thicknessMm: 12,
      shape: "trapezoid",
      notes: `Front edge ${model.dimensions.frontHeightMm} mm; rear edge ${model.dimensions.rearHeightMm} mm.`
    },
    {
      id: "roof-outer",
      nameSr: "Spoljašnja ploča krova",
      nameEn: "Exterior roof panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm + 140,
      heightMm: Math.ceil(roof.trueLengthMm + 180),
      thicknessMm: 12,
      shape: "rectangle"
    }
  ];

  const buildSteps: BuildStep[] = [
    {
      id: "base",
      titleSr: "Napravite podignutu bazu",
      titleEn: "Build the raised base",
      detailSr: "Sastavite stabilnu osnovu i proverite da kućica nema direktan kontakt sa mokrim tlom.",
      detailEn: "Assemble a stable base and keep the shelter out of direct contact with wet ground."
    },
    {
      id: "floor",
      titleSr: "Sastavite izolovani pod",
      titleEn: "Assemble the insulated floor",
      detailSr: "Zatvorite izolaciju između donje i unutrašnje ploče tako da životinja ne može da joj pristupi.",
      detailEn: "Enclose the insulation between lower and interior floor panels so the animal cannot access it."
    },
    {
      id: "walls",
      titleSr: "Sastavite zidove i ulaze",
      titleEn: "Assemble walls and entrances",
      detailSr: "Koristite dimenzije ulaza iz modela i zaštitite sve rezane ivice.",
      detailEn: "Use the model entrance dimensions and protect every cut edge."
    },
    {
      id: "insulation",
      titleSr: "Zatvorite zidnu izolaciju",
      titleEn: "Enclose wall insulation",
      detailSr: "Izolacija ne sme ostati dostupna mačkama ili psima.",
      detailEn: "Insulation must not remain accessible to cats or dogs."
    },
    {
      id: "roof",
      titleSr: "Montirajte krov i hidroizolaciju",
      titleEn: "Install roof and waterproofing",
      detailSr: "Obezbedite odvod vode od ulaza i zaštitite ivice krova od prodora vlage.",
      detailEn: "Direct runoff away from entrances and protect roof edges against water ingress."
    },
    ...(model.heated ? [{
      id: "heating",
      titleSr: "Ugradite kompatibilan namenski grejni proizvod",
      titleEn: "Install a compatible purpose-built heating product",
      detailSr: "Poštujte isključivo uputstvo proizvođača grejnog proizvoda; mrežni adapter i nezaštićeni spojevi ne pripadaju prostoru životinje.",
      detailEn: "Follow the heating product manufacturer instructions; mains adapters and unprotected connections do not belong in the animal space."
    }] : []),
    {
      id: "inspection",
      titleSr: "Uradite završnu bezbednosnu proveru",
      titleEn: "Perform the final safety inspection",
      detailSr: "Proverite stabilnost, oštre ivice, prodor vode, ventilaciju, ulaze i suvoću unutrašnjosti.",
      detailEn: "Check stability, sharp edges, water ingress, ventilation, entrances and interior dryness."
    }
  ];

  return {
    model,
    internal: {
      widthMm: internalWidthMm,
      depthMm: internalDepthMm,
      frontHeightMm: internalFrontHeightMm,
      rearHeightMm: internalRearHeightMm,
      usableFloorAreaM2: (internalWidthMm * internalDepthMm) / 1_000_000
    },
    roof,
    areas,
    thermal,
    cutParts,
    buildSteps
  };
}

export type CompiledShelterModel = ReturnType<typeof compileShelterModel>;
