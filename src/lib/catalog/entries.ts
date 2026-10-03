import {shelterModels} from "@/data/models";
import {practicalModels} from "@/data/practical-models";
import {compileShelterModel} from "@/lib/compiler";
import {costLinesForCompiled} from "@/lib/costing";
import {compilePracticalModel, type BomUnit} from "@/lib/practical/compiler";
import {assemblyInsulationMm} from "@/data/assemblies";
import {costLineCopy, modelDescription, modelName} from "@/lib/model-presentation";
import type {ShelterModel, ValidationState} from "@/lib/domain";
import type {PracticalModel} from "@/lib/practical/domain";
import {materialLibrary} from "@/data/material-library";
import type {
  BudgetClass,
  CalculationCoverage,
  ConstructionFamily,
  DesignClass,
  Difficulty,
  ExposureRequirement,
  Season,
  StructureType,
  Tool
} from "@/lib/catalog/taxonomy";

export type RequiredMaterial = {
  /** null when the line is a product/consumable outside the material library (engineered cost lines). */
  materialId: string | null;
  labelSr: string;
  labelEn: string;
  quantity: number;
  unit: BomUnit;
};

/**
 * One row of the unified catalog. It is a compact, serialisable summary compiled on the server so
 * client components (finder, inventory, budget) never ship either compiler to the browser.
 */
export type CatalogEntry = {
  id: string;
  slug: string;
  kind: "ENGINEERED" | "PRACTICAL";
  version: string;
  planFingerprint: string;
  nameSr: string;
  nameEn: string;
  descriptionSr: string;
  descriptionEn: string;
  animal: "cat" | "dog";
  animalSizeClass: "standard" | "small" | "medium" | "large";
  capacity: {recommended: number; max: number};
  designClass: DesignClass;
  family: ConstructionFamily;
  structureType: StructureType;
  seasons: Season[];
  exposure: ExposureRequirement;
  emergencyOnly: boolean;
  difficulty: Difficulty;
  tools: Tool[];
  buildTimeMinutes: [number, number];
  budgetClass: BudgetClass;
  heated: boolean;
  insulation: {materialId: string; thicknessMm: number} | null;
  coverage: CalculationCoverage[];
  validationState: ValidationState;
  footprint: {widthMm: number; depthMm: number; heightMm: number};
  climateProfile: ShelterModel["climateProfile"] | null;
  thermalStatus: "COMPLETE" | "INCOMPLETE" | "UNAVAILABLE" | "NOT_APPLICABLE";
  usesReusedMaterial: boolean;
  requiredMaterials: RequiredMaterial[];
  sourceIds: string[];
  /** Planning waste of nested sheet materials (1 - part area / bought sheet area); null when nothing is nested. */
  sheetWaste: number | null;
  sketch: EnvelopeSketch;
};

export type EnvelopeSketch = {
  family: ConstructionFamily;
  widthMm: number;
  depthMm: number;
  frontHeightMm: number;
  rearHeightMm: number;
  groundClearanceMm: number;
  entrances: Array<{centerXmm: number; widthMm: number; heightMm: number; sillMm: number}>;
  openSides: boolean;
  schematic: boolean;
  chambers: number;
  tone: SketchTone;
};

export type SketchTone = "PLYWOOD" | "OSB" | "SCRAP" | "PLASTIC" | "FOAM" | "CARDBOARD" | "CRATE" | "PALLET" | "CANOPY" | "CARRIER";

function practicalTone(model: PracticalModel): SketchTone {
  const p = model.params;
  switch (p.family) {
    case "PANEL_BOX":
      return p.shell.materialId.startsWith("osb") ? "OSB" : p.shell.materialId === "scrap-lumber" ? "SCRAP" : "PLYWOOD";
    case "TOTE_IN_TOTE":
      return "PLASTIC";
    case "FOAM_CONTAINER":
      return p.outerShell === "TOTE" ? "PLASTIC" : "FOAM";
    case "CRATE":
      return "CRATE";
    case "EMERGENCY_WRAP":
      return p.container.materialId === "pet-carrier" ? "CARRIER" : "CARDBOARD";
    case "PALLET_FRAME":
      return p.cladding?.materialId.startsWith("osb") ? "OSB" : "PALLET";
    case "SHADE_STRUCTURE":
      return p.roof.materialId === "polycarbonate" ? "CANOPY" : "OSB";
    case "RAISED_PLATFORM":
      return "PLYWOOD";
    case "RETROFIT":
      return "SCRAP";
  }
}

const engineeredLineMaterial: Record<string, string> = {
  "plywood-12-sheet": "plywood-exterior",
  "plywood-9-sheet": "plywood-interior",
  "xps-board": "xps",
  "roof-membrane": "bitumen-membrane",
  "timber-frame": "softwood",
  "hardware-roof-hinges": "hinges",
  "hardware-roof-latches": "latch"
};

const engineeredUnit: Record<string, BomUnit> = {sheet: "SHEET", m2: "AREA_M2", m: "LINEAR_M", item: "PIECE"};

export const allCoverage: CalculationCoverage[] = ["GEOMETRY", "BOM", "CUT_LIST", "NESTING", "THERMAL_TRANSMISSION", "COST", "THREE_D", "DRAWING", "BUILD_GUIDE"];

export function engineeredEntry(model: ShelterModel): CatalogEntry {
  const compiled = compileShelterModel(model);
  const lines = costLinesForCompiled(compiled);
  return {
    id: model.id,
    slug: model.slug,
    kind: "ENGINEERED",
    version: model.version,
    planFingerprint: compiled.planFingerprint,
    nameSr: modelName(model, "sr"),
    nameEn: modelName(model, "en"),
    descriptionSr: modelDescription(model, "sr"),
    descriptionEn: modelDescription(model, "en"),
    animal: model.animal,
    animalSizeClass: model.animalSizeClass,
    capacity: model.capacity,
    designClass: "ENGINEERED",
    family: "PANEL_BOX",
    structureType: "SLEEPING_SHELTER",
    seasons: ["WINTER", "RAIN", "WIND"],
    exposure: "EXPOSED_OK",
    emergencyOnly: false,
    difficulty: "WORKSHOP",
    tools: ["CIRCULAR_SAW", "JIGSAW", "DRILL", "WORKSHOP"],
    // Planning estimate for a framed three-layer build; an assumption, not a measured time.
    buildTimeMinutes: [960, 2400],
    budgetClass: "ENGINEERED",
    heated: model.heated,
    insulation: {materialId: "xps", thicknessMm: assemblyInsulationMm(compiled.assemblies.wall)},
    coverage: allCoverage,
    validationState: model.validationState,
    footprint: {widthMm: model.dimensions.widthMm, depthMm: model.dimensions.depthMm, heightMm: model.dimensions.frontHeightMm},
    climateProfile: model.climateProfile,
    thermalStatus: "COMPLETE",
    usesReusedMaterial: false,
    requiredMaterials: lines.map((line) => ({
      materialId: engineeredLineMaterial[line.id] ?? null,
      labelSr: costLineCopy(line, "sr").label,
      labelEn: line.labelEn,
      quantity: line.quantity,
      unit: engineeredUnit[line.unit]
    })),
    sourceIds: model.sourceIds,
    sheetWaste: null,
    sketch: {
      family: "PANEL_BOX",
      widthMm: model.dimensions.widthMm,
      depthMm: model.dimensions.depthMm,
      frontHeightMm: model.dimensions.frontHeightMm,
      rearHeightMm: model.dimensions.rearHeightMm,
      groundClearanceMm: model.dimensions.groundClearanceMm,
      entrances: compiled.layout.entranceCentersXmm.map((centerXmm) => ({centerXmm, widthMm: compiled.entrance.widthMm, heightMm: compiled.entrance.heightMm, sillMm: compiled.entrance.thresholdHeightMm})),
      openSides: false,
      schematic: false,
      chambers: model.layout.chambers,
      tone: "PLYWOOD"
    }
  };
}

function reusedCategory(materialId: string) {
  const material = materialLibrary[materialId];
  return material ? ["REUSED_WOOD", "SALVAGE", "CONTAINER", "PAPER"].includes(material.category) : false;
}

export function practicalEntry(model: PracticalModel): CatalogEntry {
  const compiled = compilePracticalModel(model);
  const params = model.params;
  const insulation =
    params.family === "PANEL_BOX" ? params.insulation
      : params.family === "TOTE_IN_TOTE" ? params.foam
        : params.family === "CRATE" ? params.outerInsulation
          : params.family === "PALLET_FRAME" ? params.cavityInsulation
            : params.family === "FOAM_CONTAINER" ? {materialId: "eps-shipping-box", thicknessMm: params.box.wallThicknessMm}
              : params.family === "RETROFIT" ? params.insulation
                : null;
  return {
    id: model.id,
    slug: model.slug,
    kind: "PRACTICAL",
    version: model.version,
    planFingerprint: compiled.planFingerprint,
    nameSr: model.translations.sr.name,
    nameEn: model.translations.en.name,
    descriptionSr: model.translations.sr.description,
    descriptionEn: model.translations.en.description,
    animal: model.animal,
    animalSizeClass: model.animalSizeClass,
    capacity: model.capacity,
    designClass: model.designClass,
    family: params.family,
    structureType: model.structureType,
    seasons: model.seasons,
    exposure: model.exposure,
    emergencyOnly: model.emergencyOnly,
    difficulty: model.difficulty,
    tools: model.tools,
    buildTimeMinutes: model.buildTimeMinutes,
    budgetClass: model.budgetClass,
    heated: false,
    insulation: insulation ? {materialId: insulation.materialId, thicknessMm: insulation.thicknessMm} : null,
    coverage: model.coverage,
    validationState: model.validationState,
    footprint: {widthMm: compiled.envelope.widthMm, depthMm: compiled.envelope.depthMm, heightMm: compiled.envelope.heightMm},
    climateProfile: null,
    thermalStatus: compiled.thermal.status,
    usesReusedMaterial: model.designClass === "REUSE" || compiled.bom.some((line) => reusedCategory(line.materialId)),
    requiredMaterials: compiled.bom.map((line) => ({
      materialId: line.materialId,
      labelSr: materialLibrary[line.materialId].nameSr,
      labelEn: materialLibrary[line.materialId].nameEn,
      quantity: line.quantity,
      unit: line.unit
    })),
    sourceIds: model.sourceIds,
    sheetWaste: sheetWaste(compiled.nesting),
    sketch: {
      family: params.family,
      widthMm: compiled.envelope.widthMm,
      depthMm: compiled.envelope.depthMm,
      frontHeightMm: compiled.envelope.frontHeightMm,
      rearHeightMm: compiled.envelope.rearHeightMm,
      groundClearanceMm: compiled.envelope.groundClearanceMm,
      entrances: compiled.envelope.entrances,
      openSides: compiled.envelope.openSides,
      schematic: compiled.envelope.schematic,
      chambers: compiled.envelope.chambers,
      tone: practicalTone(model)
    }
  };
}

function sheetWaste(nesting: ReturnType<typeof compilePracticalModel>["nesting"]) {
  let stock = 0;
  let used = 0;
  for (const group of nesting) {
    for (const sheet of group.sheets) {
      stock += sheet.widthMm * sheet.heightMm;
      used += sheet.materialUtilization * sheet.widthMm * sheet.heightMm;
    }
  }
  return stock > 0 ? Math.round((1 - used / stock) * 1000) / 1000 : null;
}

let cache: CatalogEntry[] | null = null;

/** The full deterministic catalog: engineered models first, then practical models, each in data order. */
export function catalogEntries(): CatalogEntry[] {
  if (!cache) cache = [...shelterModels.map(engineeredEntry), ...practicalModels.map(practicalEntry)];
  return cache;
}

export function catalogEntry(slug: string) {
  return catalogEntries().find((entry) => entry.slug === slug);
}
