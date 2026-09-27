import type {ShelterModel} from "@/lib/domain";
import {materials} from "@/data/materials";
import {
  assemblyThicknessMm,
  getAssembly,
  type ConstructionAssembly
} from "@/data/assemblies";

const MM_PER_M = 1000;
const MM2_PER_M2 = 1_000_000;

export function mmToM(value: number) {
  return value / MM_PER_M;
}

export function mm2ToM2(value: number) {
  return value / MM2_PER_M2;
}

export function getModelAssemblies(model: ShelterModel) {
  return {
    wall: getAssembly(model.construction.wallAssemblyId),
    floor: getAssembly(model.construction.floorAssemblyId),
    roof: getAssembly(model.construction.roofAssemblyId)
  };
}

export function roofSlope(model: ShelterModel) {
  const rise = model.dimensions.frontHeightMm - model.dimensions.rearHeightMm;
  const run = model.dimensions.depthMm;
  return {
    angleRad: Math.atan2(rise, run),
    trueLengthMm: Math.hypot(run, rise)
  };
}

export function roofPanelGeometry(model: ShelterModel) {
  const slope = roofSlope(model);
  const cos = Math.cos(slope.angleRad);
  const extraPlanDepthMm = model.roof.frontOverhangMm + model.roof.rearOverhangMm;
  const panelLengthMm = slope.trueLengthMm + extraPlanDepthMm / cos;
  const panelWidthMm = model.dimensions.widthMm + 2 * model.roof.sideOverhangMm;
  const centerPlanOffsetMm = (model.roof.rearOverhangMm - model.roof.frontOverhangMm) / 2;
  const centerHeightOffsetMm = -Math.tan(slope.angleRad) * centerPlanOffsetMm;

  return {
    panelWidthMm,
    panelLengthMm,
    areaM2: mm2ToM2(panelWidthMm * panelLengthMm),
    centerPlanOffsetMm,
    centerHeightOffsetMm
  };
}

export function surfaceAreas(model: ShelterModel) {
  const {widthMm: w, depthMm: d, frontHeightMm: hf, rearHeightMm: hr} = model.dimensions;
  const openingArea = model.layout.entrances * model.layout.entranceWidthMm * model.layout.entranceHeightMm;
  const wallAreaMm2 = w * hf + w * hr + 2 * d * ((hf + hr) / 2) - openingArea;
  const floorAreaMm2 = w * d;
  const roofAreaMm2 = w * roofSlope(model).trueLengthMm;

  return {
    wallM2: mm2ToM2(wallAreaMm2),
    floorM2: mm2ToM2(floorAreaMm2),
    roofM2: mm2ToM2(roofAreaMm2),
    openingM2: mm2ToM2(openingArea)
  };
}

export const thermalMethod = {
  version: "1.0.0",
  interiorSurfaceResistanceM2KW: 0.13,
  exteriorSurfaceResistanceM2KW: 0.04,
  comparisonDeltaTK: 20,
  limitations: [
    "No validated entrance infiltration model",
    "No wind pressure model",
    "No animal metabolic heat credit",
    "No transient heat-storage model"
  ]
} as const;

export function assemblyUValue(assembly: ConstructionAssembly) {
  const rLayers = assembly.layers.reduce((sum, layer) => {
    const material = materials[layer.materialId];
    return sum + mmToM(layer.thicknessMm) / material.lambdaTypicalWmK;
  }, 0);

  return 1 / (
    thermalMethod.interiorSurfaceResistanceM2KW +
    rLayers +
    thermalMethod.exteriorSurfaceResistanceM2KW
  );
}

export function thermalSummary(model: ShelterModel) {
  const assemblies = getModelAssemblies(model);
  const wallU = assemblyUValue(assemblies.wall);
  const floorU = assemblyUValue(assemblies.floor);
  const roofU = assemblyUValue(assemblies.roof);
  const area = surfaceAreas(model);
  const deltaTK = thermalMethod.comparisonDeltaTK;

  const envelopeTransmissionW =
    wallU * area.wallM2 * deltaTK +
    floorU * area.floorM2 * deltaTK +
    roofU * area.roofM2 * deltaTK;

  return {
    methodVersion: thermalMethod.version,
    wallU,
    floorU,
    roofU,
    envelopeTransmissionW,
    deltaTK
  };
}

export function materialSummary(model: ShelterModel) {
  const assemblies = getModelAssemblies(model);
  const area = surfaceAreas(model);
  const groups = new Map<string, {
    id: string;
    materialId: string;
    thicknessMm: number;
    calculatedM2: number;
  }>();

  const addAssembly = (assembly: ConstructionAssembly, surfaceM2: number) => {
    for (const layer of assembly.layers) {
      const key = `${layer.materialId}-${layer.thicknessMm}`;
      const existing = groups.get(key);
      if (existing) {
        existing.calculatedM2 += surfaceM2;
      } else {
        groups.set(key, {
          id: key,
          materialId: layer.materialId,
          thicknessMm: layer.thicknessMm,
          calculatedM2: surfaceM2
        });
      }
    }
  };

  addAssembly(assemblies.wall, area.wallM2);
  addAssembly(assemblies.floor, area.floorM2);
  addAssembly(assemblies.roof, area.roofM2);

  return Array.from(groups.values()).map((item) => {
    const material = materials[item.materialId];
    return {
      id: item.id,
      nameSr: `${material.nameSr} · ${item.thicknessMm} mm`,
      nameEn: `${material.nameEn} · ${item.thicknessMm} mm`,
      calculatedM2: item.calculatedM2,
      purchaseM2: item.calculatedM2 * 1.1
    };
  });
}

export function constructionSummary(model: ShelterModel) {
  const assemblies = getModelAssemblies(model);
  return {
    wallThicknessMm: assemblyThicknessMm(assemblies.wall),
    floorThicknessMm: assemblyThicknessMm(assemblies.floor),
    roofThicknessMm: assemblyThicknessMm(assemblies.roof)
  };
}
