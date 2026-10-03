import {getLibraryMaterial, materialLibrary, type LibraryMaterial} from "@/data/material-library";
import {deterministicFingerprint} from "@/lib/fingerprint";
import {packCutParts, type NestablePart, type PackedSheet} from "@/lib/nesting";
import type {CalculationCoverage} from "@/lib/catalog/taxonomy";
import type {
  CrateParams,
  EmergencyWrapParams,
  FoamContainerParams,
  Layer,
  PalletFrameParams,
  PanelBoxParams,
  PlatformParams,
  PracticalModel,
  RetrofitParams,
  ShadeParams,
  ToteParams
} from "@/lib/practical/domain";
import {familySteps} from "@/lib/practical/steps";
import {inspectionPlan, type InspectionItem} from "@/lib/practical/inspection";

export const practicalCompilerVersion = "P1.0.0";

/** Same orientation-specific surface resistances as engineered thermal method v1.2 (ISO 6946). */
export const surfaceResistances = {wallRsi: 0.13, roofRsi: 0.1, floorRsi: 0.17, rse: 0.04} as const;

export type PracticalCutPart = NestablePart & {
  nameSr: string;
  nameEn: string;
  materialId: string;
  thicknessMm: number;
  notesSr?: string;
  notesEn?: string;
};

export type PracticalLinearPart = {
  id: string;
  nameSr: string;
  nameEn: string;
  materialId: string;
  profileMm: [number, number];
  lengthMm: number;
  quantity: number;
};

export type BomUnit = "SHEET" | "PIECE" | "LINEAR_M" | "AREA_M2" | "BALE" | "PACK";

export type BomLine = {
  id: string;
  materialId: string;
  quantity: number;
  unit: BomUnit;
  /** NESTED: counted by the sheet nesting engine; GEOMETRY: derived from dimensions; ASSUMPTION: planning allowance. */
  basis: "NESTED" | "GEOMETRY" | "ASSUMPTION";
  noteSr: string;
  noteEn: string;
};

export type ThermalLayerReport = {
  materialId: string;
  thicknessMm: number;
  lambdaWmK: number | null;
  resistanceM2KW: number | null;
  thicknessProvenance: "GEOMETRY" | "ASSUMPTION";
};

export type ThermalAssemblyReport = {
  kind: "wall" | "floor" | "roof";
  knownLayers: ThermalLayerReport[];
  unknownLayers: ThermalLayerReport[];
  knownLayerResistanceM2KW: number;
  /** Only when every layer is known. */
  uValueWm2K: number | null;
};

export type ThermalReport = {
  status: "COMPLETE" | "INCOMPLETE" | "UNAVAILABLE" | "NOT_APPLICABLE";
  assemblies: ThermalAssemblyReport[];
  excludedSr: string[];
  excludedEn: string[];
  assumptionsSr: string[];
  assumptionsEn: string[];
};

export type PracticalEnvelope = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  frontHeightMm: number;
  rearHeightMm: number;
  groundClearanceMm: number;
  /** True when the outline is a nominal product envelope, not exact geometry. */
  schematic: boolean;
  interior: {widthMm: number; depthMm: number; heightMm: number} | null;
  chambers: number;
  entrances: Array<{widthMm: number; heightMm: number; sillMm: number; centerXmm: number}>;
  openSides: boolean;
};

export type PracticalStep = {id: string; titleSr: string; titleEn: string; detailSr: string; detailEn: string};

export type NestingGroup = {materialId: string; thicknessMm: number; stockWidthMm: number; stockHeightMm: number; sheets: PackedSheet[]};

type FamilyResult = {
  envelope: PracticalEnvelope;
  cutParts: PracticalCutPart[];
  linearParts: PracticalLinearPart[];
  extraBom: BomLine[];
  thermal: ThermalReport;
  invariants: string[];
};

const round = (value: number) => Math.round(value);
const roundTo = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

function lambdaOf(material: LibraryMaterial) {
  return material.thermal.status === "KNOWN" ? material.thermal.lambdaPlanningWmK : null;
}

function layerReport(layer: Layer, provenance: ThermalLayerReport["thicknessProvenance"] = "GEOMETRY"): ThermalLayerReport {
  const lambda = lambdaOf(getLibraryMaterial(layer.materialId));
  return {
    materialId: layer.materialId,
    thicknessMm: layer.thicknessMm,
    lambdaWmK: lambda,
    resistanceM2KW: lambda ? roundTo(layer.thicknessMm / 1000 / lambda, 3) : null,
    thicknessProvenance: provenance
  };
}

function assemblyReport(kind: ThermalAssemblyReport["kind"], layers: ThermalLayerReport[]): ThermalAssemblyReport {
  const knownLayers = layers.filter((layer) => layer.resistanceM2KW !== null);
  const unknownLayers = layers.filter((layer) => layer.resistanceM2KW === null);
  const knownR = knownLayers.reduce((sum, layer) => sum + (layer.resistanceM2KW ?? 0), 0);
  const rsi = kind === "wall" ? surfaceResistances.wallRsi : kind === "roof" ? surfaceResistances.roofRsi : surfaceResistances.floorRsi;
  const complete = unknownLayers.length === 0 && knownLayers.length > 0 && layers.every((layer) => layer.thicknessProvenance === "GEOMETRY");
  return {
    kind,
    knownLayers,
    unknownLayers,
    knownLayerResistanceM2KW: roundTo(knownR, 3),
    uValueWm2K: complete ? roundTo(1 / (rsi + knownR + surfaceResistances.rse), 2) : null
  };
}

const commonExcludedSr = [
  "Prolaz vazduha kroz ulaz i propustljivost spojeva",
  "Toplotni mostovi kroz letve, ivice i pričvršćivače",
  "Vlaga, kondenzacija i promena svojstava navlaženog materijala",
  "Toplota koju stvara životinja",
  "Vetar i promena temperature tokom vremena"
];
const commonExcludedEn = [
  "Air leakage through the entrance and joints",
  "Thermal bridges through battens, edges and fasteners",
  "Moisture, condensation and property changes of damp material",
  "Heat produced by the animal",
  "Wind and transient temperature changes"
];

function thermalFromAssemblies(assemblies: ThermalAssemblyReport[], extra: {assumptionsSr?: string[]; assumptionsEn?: string[]} = {}): ThermalReport {
  const anyKnown = assemblies.some((assembly) => assembly.knownLayers.length > 0);
  const complete = assemblies.length > 0 && assemblies.every((assembly) => assembly.uValueWm2K !== null);
  return {
    status: complete ? "COMPLETE" : anyKnown ? "INCOMPLETE" : "UNAVAILABLE",
    assemblies,
    excludedSr: commonExcludedSr,
    excludedEn: commonExcludedEn,
    assumptionsSr: [
      "Tanki slojevi bez izvorovane λ (krovni pokrivač, folija, podloga) nisu uračunati.",
      ...(extra.assumptionsSr ?? [])
    ],
    assumptionsEn: [
      "Thin layers without a sourced λ (roof covering, film, mat) are not counted.",
      ...(extra.assumptionsEn ?? [])
    ]
  };
}

const unavailableThermal = (reasonSr: string, reasonEn: string): ThermalReport => ({
  status: "UNAVAILABLE",
  assemblies: [],
  excludedSr: [reasonSr],
  excludedEn: [reasonEn],
  assumptionsSr: [],
  assumptionsEn: []
});

const notApplicableThermal = (reasonSr: string, reasonEn: string): ThermalReport => ({
  status: "NOT_APPLICABLE",
  assemblies: [],
  excludedSr: [reasonSr],
  excludedEn: [reasonEn],
  assumptionsSr: [],
  assumptionsEn: []
});

function names(material: string) {
  const entry = getLibraryMaterial(material);
  return {sr: entry.nameSr, en: entry.nameEn};
}

function entranceCenters(widthMm: number, count: number) {
  return Array.from({length: count}, (_, index) => round((widthMm * (index + 0.5)) / count));
}

function roundedCutout(centerXmm: number, partHeightMm: number, widthMm: number, heightMm: number, sillMm: number) {
  return {
    type: "roundedRectangle" as const,
    xMm: round(centerXmm - widthMm / 2),
    yMm: round(partHeightMm - sillMm - heightMm),
    widthMm,
    heightMm,
    radiusMm: round(widthMm / 2)
  };
}

function raiseBom(raiseWith: PanelBoxParams["raiseWith"], footprintDepthMm: number, groundClearanceMm: number): {lines: BomLine[]; linear: PracticalLinearPart[]} {
  if (raiseWith === "BRICKS") {
    return {
      lines: [{id: "raise-bricks", materialId: "bricks", quantity: 4, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Četiri stabilna oslonca ispod uglova.", noteEn: "Four stable supports under the corners."}],
      linear: []
    };
  }
  if (raiseWith === "PALLET") {
    return {
      lines: [{id: "raise-pallet", materialId: "pallet", quantity: 1, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Paleta kao podignuta podloga; mora proći kontrolnu listu za ponovnu upotrebu.", noteEn: "A pallet as the raised base; it must pass the reuse checklist."}],
      linear: []
    };
  }
  if (raiseWith === "BATTENS") {
    return {
      lines: [],
      linear: [{id: "raise-batten", nameSr: "Letva za podizanje", nameEn: "Raising batten", materialId: "softwood", profileMm: [45, Math.max(45, groundClearanceMm)], lengthMm: footprintDepthMm, quantity: 2}]
    };
  }
  if (raiseWith === "LEGS") {
    return {
      lines: [],
      linear: [{id: "raise-leg", nameSr: "Noga", nameEn: "Leg", materialId: "softwood", profileMm: [45, 45], lengthMm: groundClearanceMm, quantity: 4}]
    };
  }
  return {lines: [], linear: []};
}

function compilePanelBox(model: PracticalModel, p: PanelBoxParams): FamilyResult {
  const invariants: string[] = [];
  const W = p.outer.widthMm;
  const D = p.outer.depthMm;
  const ts = p.shell.thicknessMm;
  const ti = p.insulation?.thicknessMm ?? 0;
  const tl = p.lining?.thicknessMm ?? 0;
  const fi = p.insulateFloor && p.hasFloor ? ti : 0;
  const fl = p.insulateFloor && p.hasFloor ? tl : 0;
  const ri = p.insulateRoof ? ti : 0;
  const rl = p.insulateRoof ? tl : 0;
  const floorShell = p.hasFloor ? ts : 0;
  const wallFront = p.outer.frontHeightMm - floorShell - ts;
  const wallRear = p.outer.rearHeightMm - floorShell - ts;
  const wallLayer = ts + ti + tl;
  const heightAt = (z: number) => wallFront + ((wallRear - wallFront) * z) / D;
  const slope = (run: number) => Math.sqrt(run * run + (p.outer.frontHeightMm - p.outer.rearHeightMm) ** 2 * (run / D) ** 2);

  if (!(p.outer.frontHeightMm > p.outer.rearHeightMm)) invariants.push("PANEL_BOX roof must fall from the front (entrance) to the rear.");
  if (wallRear <= 0) invariants.push("PANEL_BOX rear wall height must be positive.");
  if (p.entrance.count > 1 && p.entrance.count !== p.chambers) invariants.push("Multiple entrances must match the chamber count.");
  if (p.insulation && !p.lining && getLibraryMaterial(p.insulation.materialId).animalFacing !== "ALLOWED") {
    invariants.push("Insulation that is not animal-facing must be covered by a lining.");
  }

  const centers = entranceCenters(W, p.entrance.count);
  const clearFrontCheck = wallFront - fi - fl - ri - rl;
  if (p.entrance.sillMm + p.entrance.heightMm > clearFrontCheck) invariants.push("Entrance does not fit under the clear front height.");
  if (p.entrance.widthMm * p.entrance.count >= W - 2 * wallLayer) invariants.push("Entrances are wider than the interior.");
  const shellName = names(p.shell.materialId);
  const cutParts: PracticalCutPart[] = [];
  const add = (part: Omit<PracticalCutPart, "quantity" | "shape"> & Partial<Pick<PracticalCutPart, "quantity" | "shape">>) =>
    cutParts.push({quantity: 1, shape: "rectangle", ...part, widthMm: round(part.widthMm), heightMm: round(part.heightMm), trapezoidRearHeightMm: part.trapezoidRearHeightMm === undefined ? undefined : round(part.trapezoidRearHeightMm)});

  const frontCutouts = (height: number) => centers.map((center) => roundedCutout(center, height, p.entrance.widthMm, p.entrance.heightMm, p.entrance.sillMm));
  const rearCutouts = (height: number, width: number) =>
    p.secondaryOpening?.wall === "REAR" ? [roundedCutout(width / 2, height, p.secondaryOpening.widthMm, p.secondaryOpening.heightMm, p.secondaryOpening.sillMm)] : undefined;

  if (p.hasFloor) {
    add({id: "shell-floor", nameSr: `Pod · ${shellName.sr}`, nameEn: `Floor · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: W, heightMm: D});
  }
  add({id: "shell-front", nameSr: `Prednji zid · ${shellName.sr}`, nameEn: `Front wall · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: W, heightMm: wallFront, cutouts: frontCutouts(wallFront)});
  add({id: "shell-rear", nameSr: `Zadnji zid · ${shellName.sr}`, nameEn: `Rear wall · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: W, heightMm: wallRear, cutouts: rearCutouts(wallRear, W)});
  add({id: "shell-side", nameSr: `Bočni zid · ${shellName.sr}`, nameEn: `Side wall · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: D - 2 * ts, heightMm: heightAt(ts), shape: "trapezoid", trapezoidRearHeightMm: heightAt(D - ts), quantity: p.secondaryOpening?.wall === "SIDE" ? 1 : 2});
  if (p.secondaryOpening?.wall === "SIDE") {
    add({id: "shell-side-opening", nameSr: `Bočni zid sa otvorom · ${shellName.sr}`, nameEn: `Side wall with opening · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: D - 2 * ts, heightMm: heightAt(ts), shape: "trapezoid", trapezoidRearHeightMm: heightAt(D - ts), cutouts: [roundedCutout((D - 2 * ts) / 2, heightAt(ts), p.secondaryOpening.widthMm, p.secondaryOpening.heightMm, p.secondaryOpening.sillMm)]});
  }
  add({id: "shell-roof", nameSr: `Krov · ${shellName.sr}`, nameEn: `Roof · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: W + 2 * p.roofOverhangMm, heightMm: slope(D) + 2 * p.roofOverhangMm});

  const innerDepth = D - 2 * wallLayer;
  const clearFront = wallFront - fi - fl - ri - rl;
  const clearRear = wallRear - fi - fl - ri - rl;

  if (p.chambers > 1) {
    add({id: "divider", nameSr: `Pregrada · ${shellName.sr}`, nameEn: `Divider · ${shellName.en}`, materialId: p.shell.materialId, thicknessMm: ts, widthMm: innerDepth, heightMm: clearFront, shape: "trapezoid", trapezoidRearHeightMm: clearRear, quantity: p.chambers - 1});
  }

  if (p.insulation) {
    const ins = p.insulation;
    const insName = names(ins.materialId);
    if (fi > 0) add({id: "ins-floor", nameSr: `Izolacija poda · ${insName.sr}`, nameEn: `Floor insulation · ${insName.en}`, materialId: ins.materialId, thicknessMm: ti, widthMm: W - 2 * ts, heightMm: D - 2 * ts});
    add({id: "ins-front", nameSr: `Izolacija prednjeg zida · ${insName.sr}`, nameEn: `Front wall insulation · ${insName.en}`, materialId: ins.materialId, thicknessMm: ti, widthMm: W - 2 * ts, heightMm: wallFront - fi - fl, cutouts: frontCutouts(wallFront - fi - fl)});
    add({id: "ins-rear", nameSr: `Izolacija zadnjeg zida · ${insName.sr}`, nameEn: `Rear wall insulation · ${insName.en}`, materialId: ins.materialId, thicknessMm: ti, widthMm: W - 2 * ts, heightMm: wallRear - fi - fl, cutouts: rearCutouts(wallRear - fi - fl, W - 2 * ts)});
    add({id: "ins-side", nameSr: `Izolacija bočnog zida · ${insName.sr}`, nameEn: `Side wall insulation · ${insName.en}`, materialId: ins.materialId, thicknessMm: ti, widthMm: D - 2 * ts - 2 * ti, heightMm: heightAt(ts + ti) - fi - fl, shape: "trapezoid", trapezoidRearHeightMm: heightAt(D - ts - ti) - fi - fl, quantity: 2});
    if (ri > 0) add({id: "ins-roof", nameSr: `Izolacija krova · ${insName.sr}`, nameEn: `Roof insulation · ${insName.en}`, materialId: ins.materialId, thicknessMm: ti, widthMm: W - 2 * wallLayer, heightMm: slope(innerDepth)});
  }

  if (p.lining) {
    const lin = p.lining;
    const linName = names(lin.materialId);
    if (fl > 0) add({id: "lin-floor", nameSr: `Obloga poda · ${linName.sr}`, nameEn: `Floor lining · ${linName.en}`, materialId: lin.materialId, thicknessMm: tl, widthMm: W - 2 * ts, heightMm: D - 2 * ts});
    add({id: "lin-front", nameSr: `Obloga prednjeg zida · ${linName.sr}`, nameEn: `Front wall lining · ${linName.en}`, materialId: lin.materialId, thicknessMm: tl, widthMm: W - 2 * ts - 2 * ti, heightMm: wallFront - fi - fl, cutouts: frontCutouts(wallFront - fi - fl)});
    add({id: "lin-rear", nameSr: `Obloga zadnjeg zida · ${linName.sr}`, nameEn: `Rear wall lining · ${linName.en}`, materialId: lin.materialId, thicknessMm: tl, widthMm: W - 2 * ts - 2 * ti, heightMm: wallRear - fi - fl, cutouts: rearCutouts(wallRear - fi - fl, W - 2 * ts - 2 * ti)});
    add({id: "lin-side", nameSr: `Obloga bočnog zida · ${linName.sr}`, nameEn: `Side wall lining · ${linName.en}`, materialId: lin.materialId, thicknessMm: tl, widthMm: innerDepth, heightMm: heightAt(wallLayer) - fi - fl, shape: "trapezoid", trapezoidRearHeightMm: heightAt(D - wallLayer) - fi - fl, quantity: 2});
    if (rl > 0) add({id: "lin-roof", nameSr: `Obloga krova · ${linName.sr}`, nameEn: `Roof lining · ${linName.en}`, materialId: lin.materialId, thicknessMm: tl, widthMm: W - 2 * wallLayer, heightMm: slope(innerDepth)});
  }

  const raise = raiseBom(p.raiseWith, D, p.groundClearanceMm);
  const linearParts: PracticalLinearPart[] = [
    {id: "corner-batten-front", nameSr: "Ugaona letva napred", nameEn: "Front corner batten", materialId: "softwood", profileMm: [38, 38], lengthMm: round(wallFront), quantity: 2},
    {id: "corner-batten-rear", nameSr: "Ugaona letva pozadi", nameEn: "Rear corner batten", materialId: "softwood", profileMm: [38, 38], lengthMm: round(wallRear), quantity: 2},
    ...raise.linear
  ];

  const extraBom: BomLine[] = [...raise.lines];
  if (p.roofCoveringId) {
    const roofArea = ((W + 2 * p.roofOverhangMm) * (slope(D) + 2 * p.roofOverhangMm)) / 1_000_000;
    extraBom.push({id: "roof-covering", materialId: p.roofCoveringId, quantity: roundTo(roofArea * 1.15, 2), unit: "AREA_M2", basis: "ASSUMPTION", noteSr: "Površina krova + 15% za preklope i ivice; preklope i nagib uskladiti sa uputstvom proizvoda.", noteEn: "Roof area + 15% for overlaps and edges; match overlaps and slope to the product instructions."});
    extraBom.push({id: "sealant", materialId: "sealant", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Zaptivanje spoljnih ivica i spojeva.", noteEn: "Sealing exterior edges and joints."});
  }
  if (p.serviceRoof) {
    extraBom.push({id: "hinges", materialId: "hinges", quantity: 2, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Servisni krov se otvara na prednjoj ivici.", noteEn: "The service roof opens on its front edge."});
    extraBom.push({id: "latch", materialId: "latch", quantity: p.outer.widthMm > 900 ? 2 : 1, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Drži krov zatvorenim na vetru.", noteEn: "Keeps the roof closed in wind."});
  }
  if (p.insulation) extraBom.push({id: "glue", materialId: "glue", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Lepak kompatibilan sa izolacijom.", noteEn: "Insulation-compatible adhesive."});
  extraBom.push({id: "screws", materialId: "screws", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Šrafovi za spoljnu upotrebu; dužina manja od debljine zida da ne bi virili unutra.", noteEn: "Exterior screws; shorter than the wall build-up so they do not protrude inside."});

  const wallLayers = [layerReport(p.shell), ...(p.insulation ? [layerReport(p.insulation)] : []), ...(p.lining ? [layerReport(p.lining)] : [])];
  const floorLayers = p.hasFloor ? [layerReport(p.shell), ...(fi > 0 && p.insulation ? [layerReport(p.insulation)] : []), ...(fl > 0 && p.lining ? [layerReport(p.lining)] : [])] : [];
  const roofLayers = [layerReport(p.shell), ...(ri > 0 && p.insulation ? [layerReport(p.insulation)] : []), ...(rl > 0 && p.lining ? [layerReport(p.lining)] : [])];
  const enclosed = model.structureType === "SLEEPING_SHELTER" && p.hasFloor;

  return {
    envelope: {
      widthMm: W,
      depthMm: D,
      heightMm: p.outer.frontHeightMm,
      frontHeightMm: p.outer.frontHeightMm,
      rearHeightMm: p.outer.rearHeightMm,
      groundClearanceMm: p.groundClearanceMm,
      schematic: false,
      interior: {widthMm: round(W - 2 * wallLayer), depthMm: round(innerDepth), heightMm: round((clearFront + clearRear) / 2)},
      chambers: p.chambers,
      entrances: centers.map((centerXmm) => ({widthMm: p.entrance.widthMm, heightMm: p.entrance.heightMm, sillMm: p.entrance.sillMm, centerXmm})),
      openSides: false
    },
    cutParts,
    linearParts,
    extraBom,
    thermal: enclosed
      ? thermalFromAssemblies([
        assemblyReport("wall", wallLayers),
        assemblyReport("floor", floorLayers),
        assemblyReport("roof", roofLayers)
      ])
      : notApplicableThermal("Pomoćni deo bez zatvorenog prostora; termika se ne računa.", "Accessory without an enclosed space; no thermal calculation."),
    invariants
  };
}

function toteFoamPieces(id: string, prefixSr: string, prefixEn: string, envelope: {lengthMm: number; widthMm: number; heightMm: number}, foam: Layer, includeTop: boolean): PracticalCutPart[] {
  const t = foam.thicknessMm;
  const n = names(foam.materialId);
  const base = {materialId: foam.materialId, thicknessMm: t, shape: "rectangle" as const};
  const wallHeight = envelope.heightMm - t - (includeTop ? t : 0);
  return [
    {...base, id: `${id}-floor`, nameSr: `${prefixSr}: pod · ${n.sr}`, nameEn: `${prefixEn}: floor · ${n.en}`, widthMm: envelope.lengthMm, heightMm: envelope.widthMm, quantity: 1},
    {...base, id: `${id}-long`, nameSr: `${prefixSr}: duži zid · ${n.sr}`, nameEn: `${prefixEn}: long wall · ${n.en}`, widthMm: envelope.lengthMm, heightMm: round(wallHeight), quantity: 2},
    {...base, id: `${id}-short`, nameSr: `${prefixSr}: kraći zid · ${n.sr}`, nameEn: `${prefixEn}: short wall · ${n.en}`, widthMm: envelope.widthMm - 2 * t, heightMm: round(wallHeight), quantity: 2},
    ...(includeTop ? [{...base, id: `${id}-top`, nameSr: `${prefixSr}: ploča ispod poklopca · ${n.sr}`, nameEn: `${prefixEn}: slab under the lid · ${n.en}`, widthMm: envelope.lengthMm, heightMm: envelope.widthMm, quantity: 1}] : [])
  ];
}

function containerEntrance(lengthMm: number, entrance: ToteParams["entrance"]) {
  return entranceCenters(lengthMm, entrance.count).map((centerXmm) => ({widthMm: entrance.widthMm, heightMm: entrance.heightMm, sillMm: entrance.sillMm, centerXmm}));
}

function containerRaise(raiseWith: ToteParams["raiseWith"], depthMm: number, groundClearanceMm: number, weightBricks: number) {
  const raise = raiseBom(raiseWith, depthMm, groundClearanceMm);
  const lines = [...raise.lines];
  if (weightBricks > 0) {
    const existing = lines.find((line) => line.materialId === "bricks");
    if (existing) existing.quantity += weightBricks;
    else lines.push({id: "weight-bricks", materialId: "bricks", quantity: weightBricks, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Opterećenje na poklopcu da vetar ne pomeri laganu kutiju.", noteEn: "Weight on the lid so wind cannot move a light container."});
  }
  return {lines, linear: raise.linear};
}

function compileTote(model: PracticalModel, p: ToteParams): FamilyResult {
  const invariants: string[] = [];
  const outer = p.outerTote;
  const cutParts: PracticalCutPart[] = [];
  let interior = {widthMm: outer.lengthMm, depthMm: outer.widthMm, heightMm: outer.heightMm};
  const assemblies: ThermalAssemblyReport[] = [];
  const shell: ThermalLayerReport = {materialId: "plastic-tote", thicknessMm: 3, lambdaWmK: null, resistanceM2KW: null, thicknessProvenance: "ASSUMPTION"};

  if (p.liningMode === "FOAM_LINER") {
    if (!p.foam) invariants.push("FOAM_LINER requires a foam layer.");
    else {
      cutParts.push(...toteFoamPieces("liner", "Obloga", "Liner", outer, p.foam, true));
      const t = p.foam.thicknessMm;
      interior = {widthMm: outer.lengthMm - 2 * t, depthMm: outer.widthMm - 2 * t, heightMm: outer.heightMm - 2 * t};
      const foam = layerReport(p.foam);
      assemblies.push(assemblyReport("wall", [shell, foam]), assemblyReport("floor", [shell, foam]), assemblyReport("roof", [shell, foam]));
    }
  }

  if (p.liningMode === "FOAM_SLAB_AND_INNER_TOTE" || p.liningMode === "FOAM_GAP_AND_INNER_TOTE") {
    const inner = p.innerTote;
    if (!inner || !p.foam) invariants.push("Tote-in-tote modes need an inner tote and a foam layer.");
    else {
      const t = p.foam.thicknessMm;
      if (inner.lengthMm >= outer.lengthMm || inner.widthMm >= outer.widthMm) invariants.push("Inner tote must be smaller than the outer tote.");
      if (inner.heightMm + t > outer.heightMm) invariants.push("Inner tote plus floor slab must fit under the outer lid.");
      const n = names(p.foam.materialId);
      cutParts.push({id: "slab-floor", nameSr: `Ploča ispod unutrašnje kutije · ${n.sr}`, nameEn: `Slab under the inner tote · ${n.en}`, materialId: p.foam.materialId, thicknessMm: t, widthMm: outer.lengthMm, heightMm: outer.widthMm, quantity: 1, shape: "rectangle"});
      const gapL = (outer.lengthMm - inner.lengthMm) / 2;
      const gapW = (outer.widthMm - inner.widthMm) / 2;
      const foam = layerReport(p.foam);
      if (p.liningMode === "FOAM_GAP_AND_INNER_TOTE") {
        if (Math.min(gapL, gapW) < t) invariants.push("Gap between totes is thinner than the foam board.");
        cutParts.push(
          {id: "gap-long", nameSr: `Ploča u procepu, duža strana · ${n.sr}`, nameEn: `Gap panel, long side · ${n.en}`, materialId: p.foam.materialId, thicknessMm: t, widthMm: inner.lengthMm, heightMm: inner.heightMm, quantity: 2, shape: "rectangle"},
          {id: "gap-short", nameSr: `Ploča u procepu, kraća strana · ${n.sr}`, nameEn: `Gap panel, short side · ${n.en}`, materialId: p.foam.materialId, thicknessMm: t, widthMm: inner.widthMm, heightMm: inner.heightMm, quantity: 2, shape: "rectangle"}
        );
        assemblies.push(assemblyReport("wall", [shell, foam, shell]));
      } else {
        assemblies.push(assemblyReport("wall", [shell, shell]));
      }
      assemblies.push(assemblyReport("floor", [shell, foam, shell]));
      interior = {widthMm: inner.lengthMm, depthMm: inner.widthMm, heightMm: inner.heightMm};
    }
  }

  const raise = containerRaise(p.raiseWith, outer.widthMm, p.groundClearanceMm, 1);
  const totes = p.innerTote && p.liningMode !== "FOAM_LINER" && p.liningMode !== "NONE" && p.liningMode !== "STRAW_ONLY" ? 2 : 1;
  const extraBom: BomLine[] = [
    {id: "tote", materialId: "plastic-tote", quantity: totes, unit: "PIECE", basis: "GEOMETRY", noteSr: totes === 2 ? "Spoljašnja i unutrašnja kutija; unutrašnja mora stati sa razmakom." : "Kutija sa poklopcem, bez pukotina.", noteEn: totes === 2 ? "Outer and inner tote; the inner one must fit with clearance." : "A lidded tote without cracks."},
    {id: "edge-tape", materialId: "tape", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Prekriti oštre ivice isečenog otvora sa spoljne strane.", noteEn: "Cover the sharp edges of the cut opening from the outside."},
    ...raise.lines
  ];

  const thermal = assemblies.length
    ? thermalFromAssemblies(assemblies, {
      assumptionsSr: ["Plastični zid kutije nema izvorovanu λ i ostaje nepoznat sloj.", "Mere kutije su nominalni omotač; izmerite svoju."],
      assumptionsEn: ["The tote wall has no sourced λ and remains an unknown layer.", "Tote dimensions are a nominal envelope; measure yours."]
    })
    : unavailableThermal("Nema kontrolisanog izolacionog sloja: slama je posteljina, a plastika nema izvorovanu λ.", "No controlled insulation layer: straw is bedding and the plastic has no sourced λ.");

  return {
    envelope: {
      widthMm: outer.lengthMm,
      depthMm: outer.widthMm,
      heightMm: outer.heightMm,
      frontHeightMm: outer.heightMm,
      rearHeightMm: outer.heightMm,
      groundClearanceMm: p.groundClearanceMm,
      schematic: true,
      interior: {widthMm: round(interior.widthMm), depthMm: round(interior.depthMm), heightMm: round(interior.heightMm)},
      chambers: 1,
      entrances: containerEntrance(outer.lengthMm, p.entrance),
      openSides: false
    },
    cutParts,
    linearParts: raise.linear,
    extraBom,
    thermal,
    invariants
  };
}

function compileFoamContainer(model: PracticalModel, p: FoamContainerParams): FamilyResult {
  const invariants: string[] = [];
  const box = p.box;
  const t = box.wallThicknessMm;
  if (p.outerShell === "TOTE") {
    if (!p.outerTote) invariants.push("TOTE outer shell needs an outer tote envelope.");
    else if (p.outerTote.lengthMm < box.lengthMm || p.outerTote.widthMm < box.widthMm || p.outerTote.heightMm < box.heightMm) invariants.push("Foam box must fit inside the outer tote.");
  }
  const outerEnvelope = p.outerShell === "TOTE" && p.outerTote ? p.outerTote : box;
  const foam = layerReport({materialId: "eps-shipping-box", thicknessMm: t}, "ASSUMPTION");
  const layers = p.outerShell === "TOTE" ? [{materialId: "plastic-tote", thicknessMm: 3, lambdaWmK: null, resistanceM2KW: null, thicknessProvenance: "ASSUMPTION" as const}, foam] : [foam];
  const raise = containerRaise(p.raiseWith, outerEnvelope.widthMm, p.groundClearanceMm, 1);
  const extraBom: BomLine[] = [
    {id: "foam-box", materialId: "eps-shipping-box", quantity: 1, unit: "PIECE", basis: "GEOMETRY", noteSr: "Čista transportna kutija sa poklopcem; zid oko 50 mm je planska pretpostavka.", noteEn: "A clean shipping box with lid; a wall of about 50 mm is a planning assumption."},
    ...(p.outerShell === "TOTE" ? [{id: "outer-tote", materialId: "plastic-tote", quantity: 1, unit: "PIECE" as const, basis: "GEOMETRY" as const, noteSr: "Vodootporna spoljašnja kutija u koju staje stiropor kutija.", noteEn: "A waterproof outer tote that holds the foam box."}] : []),
    ...(p.outerShell === "WRAP" ? [{id: "wrap", materialId: "waterproof-sheet", quantity: roundTo((2 * (box.lengthMm * box.widthMm + box.lengthMm * box.heightMm + box.widthMm * box.heightMm) / 1_000_000) * 1.3, 2), unit: "AREA_M2" as const, basis: "GEOMETRY" as const, noteSr: "Površina kutije + 30% za preklope; ulaz ostaje otvoren.", noteEn: "Box surface + 30% for overlaps; the entrance stays open."}] : []),
    {id: "edge-tape", materialId: "tape", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Učvrstiti poklopac spolja.", noteEn: "Secure the lid from the outside."},
    ...raise.lines
  ];
  return {
    envelope: {
      widthMm: outerEnvelope.lengthMm,
      depthMm: outerEnvelope.widthMm,
      heightMm: outerEnvelope.heightMm,
      frontHeightMm: outerEnvelope.heightMm,
      rearHeightMm: outerEnvelope.heightMm,
      groundClearanceMm: p.groundClearanceMm,
      schematic: true,
      interior: {widthMm: box.lengthMm - 2 * t, depthMm: box.widthMm - 2 * t, heightMm: box.heightMm - 2 * t},
      chambers: 1,
      entrances: containerEntrance(outerEnvelope.lengthMm, p.entrance),
      openSides: false
    },
    cutParts: [],
    linearParts: raise.linear,
    extraBom,
    thermal: thermalFromAssemblies([assemblyReport("wall", layers), assemblyReport("floor", layers), assemblyReport("roof", layers)], {
      assumptionsSr: ["Debljina zida od oko 50 mm prati ASPCApro opis kutija od oko 2 inča; stvarnu debljinu izmerite.", "Naleganje poklopca i otvor ulaza nisu modelovani."],
      assumptionsEn: ["A wall of about 50 mm follows ASPCApro's description of roughly 2 inch coolers; measure the real thickness.", "Lid fit and the entrance opening are not modelled."]
    }),
    invariants
  };
}

function compileCrate(model: PracticalModel, p: CrateParams): FamilyResult {
  const c = p.crate;
  const ins = p.outerInsulation;
  const t = ins.thicknessMm;
  const n = names(ins.materialId);
  const base = {materialId: ins.materialId, thicknessMm: t, shape: "rectangle" as const};
  const cutParts: PracticalCutPart[] = [
    {...base, id: "out-floor", nameSr: `Ploča ispod sanduka · ${n.sr}`, nameEn: `Board under the crate · ${n.en}`, widthMm: c.lengthMm, heightMm: c.widthMm, quantity: 1},
    {...base, id: "out-long", nameSr: `Spoljna ploča, duža strana · ${n.sr}`, nameEn: `Outer panel, long side · ${n.en}`, widthMm: c.lengthMm, heightMm: c.heightMm + t, quantity: 2, cutouts: undefined},
    {...base, id: "out-short", nameSr: `Spoljna ploča, kraća strana · ${n.sr}`, nameEn: `Outer panel, short side · ${n.en}`, widthMm: c.widthMm + 2 * t, heightMm: c.heightMm + t, quantity: 2},
    {...base, id: "out-top", nameSr: `Ploča na vrhu · ${n.sr}`, nameEn: `Top board · ${n.en}`, widthMm: c.lengthMm + 2 * t, heightMm: c.widthMm + 2 * t, quantity: 1}
  ];
  const outerL = c.lengthMm + 2 * t;
  const outerW = c.widthMm + 2 * t;
  const outerH = c.heightMm + 2 * t;
  const raise = containerRaise(p.raiseWith, outerW, p.groundClearanceMm, 2);
  const crateLayer: ThermalLayerReport = {materialId: "wood-crate", thicknessMm: 15, lambdaWmK: null, resistanceM2KW: null, thicknessProvenance: "ASSUMPTION"};
  const insLayer = layerReport(ins);
  return {
    envelope: {
      widthMm: outerL,
      depthMm: outerW,
      heightMm: outerH,
      frontHeightMm: outerH,
      rearHeightMm: outerH,
      groundClearanceMm: p.groundClearanceMm,
      schematic: true,
      interior: {widthMm: c.lengthMm, depthMm: c.widthMm, heightMm: c.heightMm},
      chambers: 1,
      entrances: containerEntrance(outerL, p.entrance),
      openSides: false
    },
    cutParts,
    linearParts: raise.linear,
    extraBom: [
      {id: "crate", materialId: "wood-crate", quantity: 1, unit: "PIECE", basis: "GEOMETRY", noteSr: "Čvrst sanduk bez viraćih spajalica i eksera.", noteEn: "A sturdy crate without protruding staples or nails."},
      {id: "wrap", materialId: p.wrapMaterialId, quantity: roundTo((2 * (outerL * outerW + outerL * outerH + outerW * outerH) / 1_000_000) * 1.3, 2), unit: "AREA_M2", basis: "GEOMETRY", noteSr: "Vodootporni omotač preko izolacije; ulaz ostaje otvoren.", noteEn: "Waterproof wrap over the insulation; the entrance stays open."},
      {id: "edge-tape", materialId: "tape", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Spajanje omotača spolja.", noteEn: "Joining the wrap on the outside."},
      ...raise.lines
    ],
    thermal: thermalFromAssemblies(
      [assemblyReport("wall", [crateLayer, insLayer]), assemblyReport("floor", [crateLayer, insLayer]), assemblyReport("roof", [crateLayer, insLayer])],
      {assumptionsSr: ["Letvice sanduka imaju razmake i nepoznatu vrstu drveta."], assumptionsEn: ["Crate slats have gaps and an unknown species."]}
    ),
    invariants: []
  };
}

function compileEmergencyWrap(model: PracticalModel, p: EmergencyWrapParams): FamilyResult {
  const c = p.container;
  const raise = containerRaise(p.raiseWith, c.widthMm, p.groundClearanceMm, p.wrapMaterialId ? 1 : 0);
  const surface = (2 * (c.lengthMm * c.widthMm + c.lengthMm * c.heightMm + c.widthMm * c.heightMm)) / 1_000_000;
  return {
    envelope: {
      widthMm: c.lengthMm,
      depthMm: c.widthMm,
      heightMm: c.heightMm,
      frontHeightMm: c.heightMm,
      rearHeightMm: c.heightMm,
      groundClearanceMm: p.groundClearanceMm,
      schematic: true,
      interior: null,
      chambers: 1,
      entrances: containerEntrance(c.lengthMm, p.entrance),
      openSides: false
    },
    cutParts: [],
    linearParts: raise.linear,
    extraBom: [
      {id: "container", materialId: c.materialId, quantity: 1, unit: "PIECE", basis: "GEOMETRY", noteSr: "Suva i čista posuda odgovarajuće veličine.", noteEn: "A dry, clean container of a suitable size."},
      ...(p.wrapMaterialId ? [{id: "wrap", materialId: p.wrapMaterialId, quantity: roundTo(surface * 1.3, 2), unit: "AREA_M2" as const, basis: "GEOMETRY" as const, noteSr: "Omotač spolja; ulaz se nikad ne zatvara folijom.", noteEn: "Wrap on the outside; never close the entrance with film."}] : []),
      ...(c.materialId === "cardboard" ? [{id: "tape", materialId: "tape", quantity: 1, unit: "PACK" as const, basis: "ASSUMPTION" as const, noteSr: "Traka samo sa spoljne strane.", noteEn: "Tape on the outside only."}] : []),
      ...raise.lines
    ],
    thermal: unavailableThermal(
      "Hitno rešenje bez kontrolisanog izolacionog sloja; termička procena bi bila lažna preciznost.",
      "Emergency solution without a controlled insulation layer; a thermal estimate would be false precision."
    ),
    invariants: []
  };
}

function compilePalletFrame(model: PracticalModel, p: PalletFrameParams): FamilyResult {
  const invariants: string[] = [];
  const pallet = p.pallet;
  const byRole = (role: string) => p.sections.filter((section) => section.role === role);
  const floor = byRole("FLOOR")[0];
  const back = byRole("BACK")[0];
  const sides = [...byRole("SIDE_LEFT"), ...byRole("SIDE_RIGHT")];
  const fronts = [...byRole("FRONT_LEFT"), ...byRole("FRONT_RIGHT")];
  if (!floor || !back || sides.length !== 2) invariants.push("Pallet frame needs a floor, a back and two sides.");
  const usage = new Map<number, number>();
  for (const section of p.sections) {
    if (section.heightMm > pallet.widthMm) invariants.push(`Section ${section.role} is taller than the pallet width.`);
    usage.set(section.sourcePallet, (usage.get(section.sourcePallet) ?? 0) + section.lengthMm);
  }
  for (const [index, used] of usage) {
    if (used > pallet.lengthMm) invariants.push(`Pallet ${index + 1} is over-cut: ${used} mm of ${pallet.lengthMm} mm.`);
  }

  const W = floor?.lengthMm ?? pallet.lengthMm;
  const D = floor?.heightMm ?? pallet.widthMm;
  const wallH = back?.heightMm ?? pallet.widthMm;
  const frontWidth = fronts.reduce((sum, section) => sum + section.lengthMm, 0);
  const entranceWidth = W - frontWidth;
  if (entranceWidth <= 0) invariants.push("Front sections leave no entrance.");
  const t = pallet.heightMm;

  const cutParts: PracticalCutPart[] = p.sections.map((section, index) => ({
    id: `pallet-${section.role.toLowerCase()}-${index + 1}`,
    nameSr: `Deo palete (${section.role === "FLOOR" ? "pod" : section.role === "BACK" ? "zadnji zid" : section.role.startsWith("SIDE") ? "bočni zid" : "prednji deo"}) iz palete ${section.sourcePallet + 1}`,
    nameEn: `Pallet section (${section.role.toLowerCase().replace("_", " ")}) from pallet ${section.sourcePallet + 1}`,
    materialId: "pallet",
    thicknessMm: t,
    widthMm: section.lengthMm,
    heightMm: section.heightMm,
    quantity: 1,
    shape: "rectangle",
    notesSr: "Rez mora ostaviti nosač ili kocku na kraju svakog dela; prilagoditi stvarnoj paleti.",
    notesEn: "Each cut must leave a stringer or block at its end; adapt to the real pallet."
  }));

  const roofName = names(p.roof.materialId);
  const roofDepth = D + t;
  cutParts.push({id: "roof", nameSr: `Krov · ${roofName.sr}`, nameEn: `Roof · ${roofName.en}`, materialId: p.roof.materialId, thicknessMm: p.roof.thicknessMm, widthMm: W + 2 * p.roofOverhangMm, heightMm: round(Math.sqrt(roofDepth ** 2 + p.roofFallMm ** 2) + 2 * p.roofOverhangMm), quantity: 1, shape: "rectangle"});

  const wallPanels = [
    {key: "back", w: W, h: wallH, q: 1},
    {key: "side", w: D, h: wallH, q: 2},
    ...fronts.map((section, index) => ({key: `front-${index + 1}`, w: section.lengthMm, h: wallH, q: 1}))
  ];
  if (p.cladding) {
    const n = names(p.cladding.materialId);
    for (const panel of wallPanels) {
      cutParts.push({id: `clad-${panel.key}`, nameSr: `Spoljna obloga (${panel.key}) · ${n.sr}`, nameEn: `Outer cladding (${panel.key}) · ${n.en}`, materialId: p.cladding.materialId, thicknessMm: p.cladding.thicknessMm, widthMm: panel.w, heightMm: panel.h, quantity: panel.q, shape: "rectangle"});
    }
  }
  if (p.cavityInsulation) {
    const n = names(p.cavityInsulation.materialId);
    for (const panel of wallPanels) {
      cutParts.push({id: `ins-${panel.key}`, nameSr: `Izolacija u šupljini palete (${panel.key}) · ${n.sr}`, nameEn: `Pallet cavity insulation (${panel.key}) · ${n.en}`, materialId: p.cavityInsulation.materialId, thicknessMm: p.cavityInsulation.thicknessMm, widthMm: panel.w, heightMm: panel.h, quantity: panel.q, shape: "rectangle", notesSr: "Seći na meru između nosača palete.", notesEn: "Cut to fit between the pallet stringers."});
    }
  }
  if (p.lining) {
    const n = names(p.lining.materialId);
    for (const panel of [...wallPanels, {key: "floor", w: W, h: D, q: 1}]) {
      cutParts.push({id: `lin-${panel.key}`, nameSr: `Unutrašnja obloga (${panel.key}) · ${n.sr}`, nameEn: `Interior lining (${panel.key}) · ${n.en}`, materialId: p.lining.materialId, thicknessMm: p.lining.thicknessMm, widthMm: panel.w, heightMm: panel.h, quantity: panel.q, shape: "rectangle"});
    }
  }

  const palletCount = usage.size;
  const roofArea = ((W + 2 * p.roofOverhangMm) * (roofDepth + 2 * p.roofOverhangMm)) / 1_000_000;
  const overall = t + wallH + p.roofFallMm + p.roof.thicknessMm;
  const palletLayer: ThermalLayerReport = {materialId: "pallet", thicknessMm: t, lambdaWmK: null, resistanceM2KW: null, thicknessProvenance: "ASSUMPTION"};
  const wallLayers = [palletLayer, ...(p.cladding ? [layerReport(p.cladding)] : []), ...(p.cavityInsulation ? [layerReport(p.cavityInsulation)] : []), ...(p.lining ? [layerReport(p.lining)] : [])];

  return {
    envelope: {
      widthMm: W,
      depthMm: D + (p.cladding?.thicknessMm ?? 0),
      heightMm: overall + p.roofFallMm,
      frontHeightMm: overall + p.roofFallMm,
      rearHeightMm: overall,
      groundClearanceMm: p.groundClearanceMm,
      schematic: false,
      interior: {widthMm: W - 2 * t - 2 * (p.lining?.thicknessMm ?? 0), depthMm: D - t - (p.lining?.thicknessMm ?? 0), heightMm: wallH - (p.lining?.thicknessMm ?? 0)},
      chambers: 1,
      entrances: [{widthMm: entranceWidth, heightMm: p.entranceHeightMm, sillMm: 0, centerXmm: round((fronts[0]?.lengthMm ?? 0) + entranceWidth / 2)}],
      openSides: false
    },
    cutParts,
    linearParts: [
      {id: "roof-fall-batten", nameSr: "Klinasta letva za pad krova", nameEn: "Tapered roof-fall batten", materialId: "softwood", profileMm: [38, p.roofFallMm], lengthMm: roofDepth, quantity: 2},
      {id: "front-header", nameSr: "Nadvratna daska iznad ulaza", nameEn: "Header board above the entrance", materialId: "softwood", profileMm: [24, 100], lengthMm: W, quantity: 1},
      {id: "corner-ties", nameSr: "Spojne letve na uglovima", nameEn: "Corner tie battens", materialId: "softwood", profileMm: [38, 38], lengthMm: wallH, quantity: 4}
    ],
    extraBom: [
      {id: "pallets", materialId: "pallet", quantity: palletCount, unit: "PIECE", basis: "GEOMETRY", noteSr: "Broj različitih paleta iz kojih se seku delovi; svaka mora proći kontrolnu listu.", noteEn: "Number of distinct pallets the sections are cut from; each must pass the checklist."},
      {id: "roof-covering", materialId: p.roofCoveringId, quantity: roundTo(roofArea * 1.15, 2), unit: "AREA_M2", basis: "ASSUMPTION", noteSr: "Površina krova + 15% za preklope.", noteEn: "Roof area + 15% for overlaps."},
      {id: "screws", materialId: "screws", quantity: 2, unit: "PACK", basis: "ASSUMPTION", noteSr: "Spajanje paleta i obloge; vrhovi ne smeju viriti unutra.", noteEn: "Joining pallets and cladding; tips must not protrude inside."},
      {id: "sealant", materialId: "sealant", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Spoljni spojevi krova.", noteEn: "Exterior roof joints."}
    ],
    thermal: p.cavityInsulation
      ? thermalFromAssemblies([assemblyReport("wall", wallLayers)], {
        assumptionsSr: ["Paleta je nepoznat sloj sa šupljinama; uračunati su samo poznati slojevi.", "Pod i krov nisu izolovani."],
        assumptionsEn: ["The pallet is an unknown layer with voids; only known layers are counted.", "Floor and roof are not insulated."]
      })
      : unavailableThermal("Paleta sa razmacima nije kontrolisan termički sloj.", "A gapped pallet is not a controlled thermal layer."),
    invariants
  };
}

function compileShade(model: PracticalModel, p: ShadeParams): FamilyResult {
  const invariants: string[] = [];
  if (!(p.clearHeightFrontMm > p.clearHeightRearMm)) invariants.push("Shade roof must fall away from the open front.");
  const W = p.footprint.widthMm;
  const D = p.footprint.depthMm;
  const fall = p.clearHeightFrontMm - p.clearHeightRearMm;
  const roofLength = Math.sqrt(D * D + fall * fall);
  const roofName = names(p.roof.materialId);
  const cutParts: PracticalCutPart[] = [
    {id: "canopy", nameSr: `Krov · ${roofName.sr}`, nameEn: `Canopy · ${roofName.en}`, materialId: p.roof.materialId, thicknessMm: p.roof.thicknessMm, widthMm: W + 2 * p.roofOverhangMm, heightMm: round(roofLength + 2 * p.roofOverhangMm), quantity: 1, shape: "rectangle"}
  ];
  if (p.sides !== "OPEN") {
    if (!p.sidePanel) invariants.push("Closed sides need a side panel layer.");
    else {
      const n = names(p.sidePanel.materialId);
      const base = {materialId: p.sidePanel.materialId, thicknessMm: p.sidePanel.thicknessMm};
      cutParts.push({...base, id: "back-panel", nameSr: `Zadnji panel · ${n.sr}`, nameEn: `Back panel · ${n.en}`, widthMm: W, heightMm: p.clearHeightRearMm, quantity: 1, shape: "rectangle"});
      if (p.sides === "BACK_AND_SIDE" || p.sides === "THREE_SIDES") {
        cutParts.push({...base, id: "side-panel", nameSr: `Bočni panel · ${n.sr}`, nameEn: `Side panel · ${n.en}`, widthMm: D, heightMm: p.clearHeightRearMm, shape: "trapezoid", trapezoidRearHeightMm: p.clearHeightRearMm, quantity: p.sides === "THREE_SIDES" ? 2 : 1});
        const last = cutParts[cutParts.length - 1];
        last.heightMm = p.clearHeightFrontMm;
      }
    }
  }
  if (p.platform) {
    const n = names(p.platform.top.materialId);
    cutParts.push({id: "platform-top", nameSr: `Podignuto ležište · ${n.sr}`, nameEn: `Raised bed · ${n.en}`, materialId: p.platform.top.materialId, thicknessMm: p.platform.top.thicknessMm, widthMm: W, heightMm: D, quantity: 1, shape: "rectangle"});
  }
  const frontLegs = Math.ceil(p.legCount / 2);
  const rearLegs = p.legCount - frontLegs;
  const linearParts: PracticalLinearPart[] = [
    {id: "leg-front", nameSr: "Prednji stub", nameEn: "Front post", materialId: "softwood", profileMm: p.legProfileMm, lengthMm: p.clearHeightFrontMm, quantity: frontLegs},
    {id: "leg-rear", nameSr: "Zadnji stub", nameEn: "Rear post", materialId: "softwood", profileMm: p.legProfileMm, lengthMm: p.clearHeightRearMm, quantity: rearLegs},
    {id: "top-rail-width", nameSr: "Gornja greda po širini", nameEn: "Top rail across the width", materialId: "softwood", profileMm: [38, 58], lengthMm: W, quantity: 2},
    {id: "top-rail-depth", nameSr: "Gornja greda po dubini", nameEn: "Top rail along the depth", materialId: "softwood", profileMm: [38, 58], lengthMm: round(roofLength), quantity: 2},
    ...(p.platform
      ? [
        {id: "platform-rail-width", nameSr: "Okvir ležišta po širini", nameEn: "Bed frame across the width", materialId: "softwood", profileMm: [38, 58] as [number, number], lengthMm: W, quantity: 2},
        {id: "platform-rail-depth", nameSr: "Okvir ležišta po dubini", nameEn: "Bed frame along the depth", materialId: "softwood", profileMm: [38, 58] as [number, number], lengthMm: D, quantity: 2}
      ]
      : [])
  ];
  const roofArea = ((W + 2 * p.roofOverhangMm) * (roofLength + 2 * p.roofOverhangMm)) / 1_000_000;
  return {
    envelope: {
      widthMm: W,
      depthMm: D,
      heightMm: p.clearHeightFrontMm + p.roof.thicknessMm,
      frontHeightMm: p.clearHeightFrontMm + p.roof.thicknessMm,
      rearHeightMm: p.clearHeightRearMm + p.roof.thicknessMm,
      groundClearanceMm: p.platform?.heightMm ?? 0,
      schematic: false,
      interior: null,
      chambers: 1,
      entrances: [],
      openSides: true
    },
    cutParts,
    linearParts,
    extraBom: [
      ...(p.roofCoveringId ? [{id: "roof-covering", materialId: p.roofCoveringId, quantity: roundTo(roofArea * 1.15, 2), unit: "AREA_M2" as const, basis: "ASSUMPTION" as const, noteSr: "Površina krova + 15%.", noteEn: "Roof area + 15%."}] : []),
      {id: "screws", materialId: "screws", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Spajanje okvira i krova.", noteEn: "Joining the frame and the roof."}
    ],
    thermal: notApplicableThermal(
      "Otvorena konstrukcija za senku, vetar ili kišu; zatvoreni termički proračun ne važi.",
      "Open structure for shade, wind or rain; an enclosed thermal calculation does not apply."
    ),
    invariants
  };
}

function compilePlatform(model: PracticalModel, p: PlatformParams): FamilyResult {
  const n = names(p.topLayer.materialId);
  return {
    envelope: {
      widthMm: p.top.widthMm,
      depthMm: p.top.depthMm,
      heightMm: p.heightMm + p.topLayer.thicknessMm,
      frontHeightMm: p.heightMm + p.topLayer.thicknessMm,
      rearHeightMm: p.heightMm + p.topLayer.thicknessMm,
      groundClearanceMm: p.heightMm,
      schematic: false,
      interior: null,
      chambers: 1,
      entrances: [],
      openSides: true
    },
    cutParts: [{id: "top", nameSr: `Ploča ležišta · ${n.sr}`, nameEn: `Platform top · ${n.en}`, materialId: p.topLayer.materialId, thicknessMm: p.topLayer.thicknessMm, widthMm: p.top.widthMm, heightMm: p.top.depthMm, quantity: 1, shape: "rectangle"}],
    linearParts: [
      {id: "leg", nameSr: "Noga", nameEn: "Leg", materialId: "softwood", profileMm: p.legProfileMm, lengthMm: p.heightMm, quantity: p.legCount},
      {id: "rail-width", nameSr: "Okvir po širini", nameEn: "Frame across the width", materialId: "softwood", profileMm: [38, 58], lengthMm: p.top.widthMm, quantity: 2},
      {id: "rail-depth", nameSr: "Okvir po dubini", nameEn: "Frame along the depth", materialId: "softwood", profileMm: [38, 58], lengthMm: p.top.depthMm - 2 * 38, quantity: 2}
    ],
    extraBom: [{id: "screws", materialId: "screws", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Spajanje okvira i ploče; glave upustiti.", noteEn: "Joining the frame and top; countersink the heads."}],
    thermal: notApplicableThermal("Ležište bez zatvorenog prostora.", "A bed without an enclosed space."),
    invariants: p.heightMm > 400 ? ["Platform height above 400 mm needs a stability review."] : []
  };
}

function compileRetrofit(model: PracticalModel, p: RetrofitParams): FamilyResult {
  const h = p.referenceHouse;
  const innerW = h.widthMm - 2 * h.wallThicknessMm;
  const innerD = h.depthMm - 2 * h.wallThicknessMm;
  const innerH = h.heightMm - 2 * h.wallThicknessMm;
  const ti = p.insulation.thicknessMm;
  const tl = p.lining.thicknessMm;
  const insName = names(p.insulation.materialId);
  const linName = names(p.lining.materialId);
  const cutParts: PracticalCutPart[] = [];
  const extraBom: BomLine[] = [];
  const has = (item: RetrofitParams["items"][number]) => p.items.includes(item);
  if (has("INTERIOR_INSULATION")) {
    cutParts.push(
      {id: "ins-back", nameSr: `Izolacija zadnjeg zida · ${insName.sr}`, nameEn: `Back wall insulation · ${insName.en}`, materialId: p.insulation.materialId, thicknessMm: ti, widthMm: innerW, heightMm: innerH - ti, quantity: 1, shape: "rectangle"},
      {id: "ins-side", nameSr: `Izolacija bočnog zida · ${insName.sr}`, nameEn: `Side wall insulation · ${insName.en}`, materialId: p.insulation.materialId, thicknessMm: ti, widthMm: innerD - ti, heightMm: innerH - ti, quantity: 2, shape: "rectangle"},
      {id: "ins-roof", nameSr: `Izolacija ispod krova · ${insName.sr}`, nameEn: `Under-roof insulation · ${insName.en}`, materialId: p.insulation.materialId, thicknessMm: ti, widthMm: innerW, heightMm: innerD, quantity: 1, shape: "rectangle"}
    );
  }
  if (has("FLOOR_INSULATION")) {
    cutParts.push({id: "ins-floor", nameSr: `Izolacija poda · ${insName.sr}`, nameEn: `Floor insulation · ${insName.en}`, materialId: p.insulation.materialId, thicknessMm: ti, widthMm: innerW, heightMm: innerD, quantity: 1, shape: "rectangle"});
  }
  if (has("PROTECTIVE_LINING")) {
    cutParts.push(
      {id: "lin-back", nameSr: `Obloga zadnjeg zida · ${linName.sr}`, nameEn: `Back wall lining · ${linName.en}`, materialId: p.lining.materialId, thicknessMm: tl, widthMm: innerW - 2 * ti, heightMm: innerH - ti - tl, quantity: 1, shape: "rectangle"},
      {id: "lin-side", nameSr: `Obloga bočnog zida · ${linName.sr}`, nameEn: `Side wall lining · ${linName.en}`, materialId: p.lining.materialId, thicknessMm: tl, widthMm: innerD - ti - tl, heightMm: innerH - ti - tl, quantity: 2, shape: "rectangle"},
      {id: "lin-floor", nameSr: `Obloga poda · ${linName.sr}`, nameEn: `Floor lining · ${linName.en}`, materialId: p.lining.materialId, thicknessMm: tl, widthMm: innerW, heightMm: innerD, quantity: 1, shape: "rectangle"}
    );
  }
  if (has("WIND_BAFFLE")) {
    cutParts.push({id: "wind-baffle", nameSr: `Unutrašnja pregrada protiv vetra · ${linName.sr}`, nameEn: `Interior wind baffle · ${linName.en}`, materialId: p.lining.materialId, thicknessMm: tl, widthMm: round(innerW * 0.45), heightMm: round(innerH * 0.7), quantity: 1, shape: "rectangle", notesSr: "Pravi L-ulaz: pas ulazi pa skreće iza pregrade.", notesEn: "Creates an L-entry: the dog enters and turns behind the baffle."});
  }
  if (has("ROOF_MEMBRANE")) {
    extraBom.push({id: "roof-covering", materialId: p.roofCoveringId, quantity: roundTo(((h.widthMm + 200) * (h.depthMm + 200) / 1_000_000) * 1.15, 2), unit: "AREA_M2", basis: "ASSUMPTION", noteSr: "Krov + 100 mm prepusta sa svake strane + 15%.", noteEn: "Roof + 100 mm overhang each side + 15%."});
    extraBom.push({id: "sealant", materialId: "sealant", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Zaptivanje spojeva krova.", noteEn: "Sealing roof joints."});
  }
  if (has("RAISED_BASE")) extraBom.push({id: "raise-blocks", materialId: "concrete-blocks", quantity: 4, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Stabilni oslonci ispod uglova.", noteEn: "Stable supports under the corners."});
  if (has("ENTRANCE_FLAP")) extraBom.push({id: "flap", materialId: "flap-material", quantity: 1, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Zavesa koju pas lako odgurne.", noteEn: "A flap the dog can push easily."});
  if (has("SERVICE_ACCESS")) extraBom.push({id: "hinges", materialId: "hinges", quantity: 2, unit: "PIECE", basis: "ASSUMPTION", noteSr: "Ako krov može da se pretvori u servisni.", noteEn: "If the roof can be converted into a service roof."});
  extraBom.push({id: "screws", materialId: "screws", quantity: 1, unit: "PACK", basis: "ASSUMPTION", noteSr: "Kraći od debljine zida.", noteEn: "Shorter than the wall thickness."});
  const existing: ThermalLayerReport = {materialId: "scrap-lumber", thicknessMm: h.wallThicknessMm, lambdaWmK: null, resistanceM2KW: null, thicknessProvenance: "ASSUMPTION"};
  return {
    envelope: {
      widthMm: h.widthMm,
      depthMm: h.depthMm,
      heightMm: h.heightMm,
      frontHeightMm: h.heightMm,
      rearHeightMm: h.heightMm,
      groundClearanceMm: has("RAISED_BASE") ? 190 : 0,
      schematic: true,
      interior: {widthMm: innerW - (has("INTERIOR_INSULATION") ? 2 * ti : 0), depthMm: innerD - (has("INTERIOR_INSULATION") ? ti : 0), heightMm: innerH - (has("INTERIOR_INSULATION") ? ti : 0)},
      chambers: 1,
      entrances: [],
      openSides: false
    },
    cutParts,
    linearParts: [],
    extraBom,
    thermal: thermalFromAssemblies([assemblyReport("wall", [existing, layerReport(p.insulation), layerReport(p.lining)])], {
      assumptionsSr: ["Postojeći zid kućice je nepoznat sloj; uračunati su samo dodati slojevi.", "Referentna kućica je primer; mere svoje kućice unesite u alat za unapređenje."],
      assumptionsEn: ["The existing house wall is an unknown layer; only added layers are counted.", "The reference house is an example; enter your house in the retrofit tool."]
    }),
    invariants: []
  };
}

export function compileFamily(model: PracticalModel): FamilyResult {
  const params = model.params;
  switch (params.family) {
    case "PANEL_BOX":
      return compilePanelBox(model, params);
    case "TOTE_IN_TOTE":
      return compileTote(model, params);
    case "FOAM_CONTAINER":
      return compileFoamContainer(model, params);
    case "CRATE":
      return compileCrate(model, params);
    case "EMERGENCY_WRAP":
      return compileEmergencyWrap(model, params);
    case "PALLET_FRAME":
      return compilePalletFrame(model, params);
    case "SHADE_STRUCTURE":
      return compileShade(model, params);
    case "RAISED_PLATFORM":
      return compilePlatform(model, params);
    case "RETROFIT":
      return compileRetrofit(model, params);
  }
}

const STOCK_MARGIN_MM = 10;
const STOCK_KERF_MM = 3;

function fitsStock(part: PracticalCutPart, stockWidthMm: number, stockHeightMm: number) {
  const usableW = stockWidthMm - 2 * STOCK_MARGIN_MM;
  const usableH = stockHeightMm - 2 * STOCK_MARGIN_MM;
  const w = part.widthMm + STOCK_KERF_MM;
  const h = part.heightMm + STOCK_KERF_MM;
  return (w <= usableW && h <= usableH) || (h <= usableW && w <= usableH);
}

/**
 * Insulation boards larger than the planning stock are split into butt-jointed segments, the same
 * approach as the engineered compiler's XPS segmentation. Trapezoids are segmented by their
 * bounding rectangle and noted "trim to slope", which is conservative for material quantity.
 * Structural sheet parts are never split silently; they become an invariant violation instead.
 */
function segmentToStock(parts: PracticalCutPart[]): {parts: PracticalCutPart[]; violations: string[]} {
  const result: PracticalCutPart[] = [];
  const violations: string[] = [];
  for (const part of parts) {
    const material = materialLibrary[part.materialId];
    const stock = material?.planningStock;
    if (!stock || material.inventoryUnit !== "SHEET" || fitsStock(part, stock.widthMm, stock.heightMm)) {
      result.push(part);
      continue;
    }
    if (material.insulationRole !== "PRIMARY") {
      violations.push(`Part ${part.id} (${part.widthMm}×${part.heightMm} mm) does not fit ${stock.widthMm}×${stock.heightMm} mm ${part.materialId} stock.`);
      result.push(part);
      continue;
    }
    const maxW = stock.widthMm - 2 * STOCK_MARGIN_MM - STOCK_KERF_MM;
    const maxH = stock.heightMm - 2 * STOCK_MARGIN_MM - STOCK_KERF_MM;
    const height = Math.max(part.heightMm, part.trapezoidRearHeightMm ?? 0);
    const columns = Math.max(1, Math.ceil(part.widthMm / maxW));
    const rows = Math.max(1, Math.ceil(height / maxH));
    const segW = Math.ceil(part.widthMm / columns);
    const segH = Math.ceil(height / rows);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        result.push({
          id: `${part.id}-r${row + 1}c${column + 1}`,
          nameSr: part.nameSr,
          nameEn: part.nameEn,
          materialId: part.materialId,
          thicknessMm: part.thicknessMm,
          quantity: part.quantity,
          shape: "rectangle",
          widthMm: Math.min(segW, part.widthMm - column * segW),
          heightMm: Math.min(segH, height - row * segH),
          notesSr: `Segment ${row + 1}/${rows}, ${column + 1}/${columns}; spojiti na sučeljavanje${part.shape === "trapezoid" ? ", gornju ivicu iseći po kosini" : ""}${part.cutouts?.length ? ", otvor ulaza iseći posle spajanja" : ""}.`,
          notesEn: `Segment ${row + 1}/${rows}, ${column + 1}/${columns}; butt-join${part.shape === "trapezoid" ? ", trim the top edge to the slope" : ""}${part.cutouts?.length ? ", cut the entrance after joining" : ""}.`
        });
      }
    }
  }
  return {parts: result, violations};
}

function nestGroups(cutParts: PracticalCutPart[]): NestingGroup[] {
  const groups = new Map<string, PracticalCutPart[]>();
  for (const part of cutParts) {
    const key = `${part.materialId}|${part.thicknessMm}`;
    groups.set(key, [...(groups.get(key) ?? []), part]);
  }
  const result: NestingGroup[] = [];
  for (const [key, parts] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const [materialId, thickness] = key.split("|");
    const stock = materialLibrary[materialId]?.planningStock;
    if (!stock || materialLibrary[materialId].inventoryUnit !== "SHEET") continue;
    result.push({
      materialId,
      thicknessMm: Number(thickness),
      stockWidthMm: stock.widthMm,
      stockHeightMm: stock.heightMm,
      sheets: packCutParts(parts.filter((part) => fitsStock(part, stock.widthMm, stock.heightMm)), {sheetWidthMm: stock.widthMm, sheetHeightMm: stock.heightMm, kerfMm: 3, marginMm: 10})
    });
  }
  return result;
}

function linearBom(linearParts: PracticalLinearPart[]): BomLine[] {
  const totals = new Map<string, number>();
  for (const part of linearParts) totals.set(part.materialId, (totals.get(part.materialId) ?? 0) + (part.lengthMm * part.quantity) / 1000);
  return [...totals].map(([materialId, metres]) => ({
    id: `linear-${materialId}`,
    materialId,
    quantity: roundTo(metres * 1.1, 2),
    unit: "LINEAR_M" as const,
    basis: "GEOMETRY" as const,
    noteSr: "Ukupna dužina iz krojne liste + 10% rezerve.",
    noteEn: "Total length from the cut list + 10% allowance."
  }));
}

function unNestedSheetBom(cutParts: PracticalCutPart[], nested: NestingGroup[]): BomLine[] {
  const nestedKeys = new Set(nested.map((group) => `${group.materialId}|${group.thicknessMm}`));
  const areas = new Map<string, number>();
  for (const part of cutParts) {
    const key = `${part.materialId}|${part.thicknessMm}`;
    if (nestedKeys.has(key) || part.materialId === "pallet") continue;
    areas.set(key, (areas.get(key) ?? 0) + (part.widthMm * part.heightMm * part.quantity) / 1_000_000);
  }
  return [...areas].map(([key, area]) => {
    const [materialId, thickness] = key.split("|");
    const material = getLibraryMaterial(materialId);
    if (material.inventoryUnit === "LINEAR_M") {
      // Board cladding: planning board width 100 mm (ASSUMPTION) + 15% waste.
      return {id: `boards-${materialId}-${thickness}`, materialId, quantity: roundTo((area / 0.1) * 1.15, 2), unit: "LINEAR_M" as const, basis: "ASSUMPTION" as const, noteSr: "Dužina dasaka uz pretpostavljenu širinu daske 100 mm + 15%.", noteEn: "Board length assuming 100 mm wide boards + 15%."};
    }
    return {id: `area-${materialId}-${thickness}`, materialId, quantity: roundTo(area * 1.1, 2), unit: "AREA_M2" as const, basis: "GEOMETRY" as const, noteSr: "Površina delova + 10%.", noteEn: "Part area + 10%."};
  });
}

export type CompiledPracticalModel = ReturnType<typeof compilePracticalModel>;

export function compilePracticalModel(model: PracticalModel) {
  const family = compileFamily(model);
  const segmented = segmentToStock(family.cutParts);
  const cutParts = segmented.parts;
  const nesting = nestGroups(cutParts);
  const bom: BomLine[] = [
    ...nesting.map((group) => ({
      id: `sheets-${group.materialId}-${group.thicknessMm}`,
      materialId: group.materialId,
      quantity: group.sheets.length,
      unit: "SHEET" as const,
      basis: "NESTED" as const,
      noteSr: `${group.sheets.length} × ${group.stockWidthMm} × ${group.stockHeightMm} mm (planski format; proverite kod dobavljača).`,
      noteEn: `${group.sheets.length} × ${group.stockWidthMm} × ${group.stockHeightMm} mm (planning format; check with your supplier).`
    })),
    ...unNestedSheetBom(cutParts, nesting),
    ...linearBom(family.linearParts),
    ...family.extraBom,
    ...(model.bedding === "straw"
      ? [{id: "bedding-straw", materialId: "straw", quantity: 1, unit: "BALE" as const, basis: "ASSUMPTION" as const, noteSr: "Rastresito do četvrtine ili polovine visine; ostatak čuvati suv za zamenu.", noteEn: "Loosely to a quarter or half of the height; keep the rest dry for refills."}]
      : [])
  ];
  const steps = familySteps(model, family.envelope);
  const inspection: InspectionItem[] = inspectionPlan(model);

  const derivedCoverage: CalculationCoverage[] = [
    "GEOMETRY",
    ...(bom.length ? (["BOM"] as const) : []),
    ...(cutParts.length ? (["CUT_LIST"] as const) : []),
    ...(nesting.length ? (["NESTING"] as const) : []),
    ...(family.thermal.status === "COMPLETE" ? (["THERMAL_TRANSMISSION"] as const) : []),
    ...(bom.length ? (["COST"] as const) : []),
    "DRAWING",
    ...(steps.length ? (["BUILD_GUIDE"] as const) : [])
  ];

  const planFingerprint = deterministicFingerprint({
    compilerVersion: practicalCompilerVersion,
    model,
    envelope: family.envelope,
    cutParts,
    linearParts: family.linearParts,
    bom,
    thermal: family.thermal,
    steps
  });

  return {
    compilerVersion: practicalCompilerVersion,
    planFingerprint,
    model,
    envelope: family.envelope,
    cutParts,
    linearParts: family.linearParts,
    nesting,
    bom,
    thermal: family.thermal,
    steps,
    inspection,
    derivedCoverage,
    invariantViolations: [...family.invariants, ...segmented.violations]
  };
}
