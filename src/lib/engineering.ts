import type {ShelterModel} from "@/lib/domain";
import {materialLambda, materials, type Material} from "@/data/materials";
import {roundedRectangleAreaMm2} from "@/lib/cut-geometry";
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

export function layoutGeometry(model: ShelterModel) {
  const wallThicknessMm = constructionSummary(model).wallThicknessMm;
  const clearLeftMm = wallThicknessMm;
  const clearWidthMm = Math.max(0, model.dimensions.widthMm - 2 * wallThicknessMm);
  const dividerThicknessMm = model.layout.dividerThicknessMm;
  const dividerCount = Math.max(0, model.layout.chambers - 1);
  const totalDividerThicknessMm = dividerCount * dividerThicknessMm;
  const usableChamberWidthMm = Math.max(0, clearWidthMm - totalDividerThicknessMm);
  const chamberWidthMm = usableChamberWidthMm / model.layout.chambers;

  const chamberStartsXmm = Array.from(
    {length: model.layout.chambers},
    (_, index) =>
      clearLeftMm +
      index * chamberWidthMm +
      index * dividerThicknessMm
  );

  const entranceCentersXmm = Array.from(
    {length: model.layout.entrances},
    (_, index) => {
      if (model.layout.entrances === model.layout.chambers) {
        return chamberStartsXmm[index] + chamberWidthMm / 2;
      }

      return clearLeftMm + clearWidthMm * ((index + 1) / (model.layout.entrances + 1));
    }
  );

  const dividerPositionsXmm = Array.from(
    {length: dividerCount},
    (_, index) =>
      chamberStartsXmm[index] +
      chamberWidthMm +
      dividerThicknessMm / 2
  );

  return {
    clearLeftMm,
    clearWidthMm,
    usableChamberWidthMm,
    dividerThicknessMm,
    totalDividerThicknessMm,
    chamberStartsXmm,
    entranceCentersXmm,
    dividerPositionsXmm,
    chamberWidthMm
  };
}

export function entranceGeometry(model: ShelterModel) {
  const widthMm = model.layout.entranceWidthMm;
  const heightMm = model.layout.entranceHeightMm;
  const radiusMm = Math.min(40, Math.round(widthMm * 0.22));
  const singleOpeningAreaMm2 = roundedRectangleAreaMm2({
    type: "roundedRectangle",
    xMm: 0,
    yMm: 0,
    widthMm,
    heightMm,
    radiusMm
  });

  return {
    widthMm,
    heightMm,
    radiusMm,
    thresholdHeightMm: model.layout.thresholdHeightMm,
    count: model.layout.entrances,
    singleOpeningAreaMm2,
    totalOpeningAreaMm2: singleOpeningAreaMm2 * model.layout.entrances
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
  const entrance = entranceGeometry(model);
  const openingArea = entrance.totalOpeningAreaMm2;
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

export type HeatFlowDirection = "horizontal" | "upward" | "downward";

export const thermalMethod = {
  version: "1.1.0",
  surfaceResistanceSourceId: "iso-6946-2017",
  interiorSurfaceResistanceM2KW: {
    horizontal: 0.13,
    upward: 0.10,
    downward: 0.17
  },
  exteriorSurfaceResistanceM2KW: 0.04,
  comparisonDeltaTK: 20,
  assemblyHeatFlow: {
    wall: "horizontal",
    roof: "upward",
    floor: "downward"
  } satisfies Record<"wall" | "roof" | "floor", HeatFlowDirection>,
  limitations: [
    "No validated entrance infiltration model",
    "No wind pressure model",
    "No animal metabolic heat credit",
    "No transient heat-storage model",
    "No 2D framing thermal-bridge correction"
  ]
} as const;

function assemblyUValueWithLambdaMode(
  assembly: ConstructionAssembly,
  mode: "min" | "typical" | "max",
  heatFlow: HeatFlowDirection
) {
  const rLayers = assembly.layers.reduce((sum, layer) => {
    const material = materials[layer.materialId];
    const lambda =
      mode === "typical"
        ? materialLambda(layer.materialId, layer.thicknessMm)
        : mode === "min"
          ? material.lambdaRangeWmK[0]
          : material.lambdaRangeWmK[1];

    return sum + mmToM(layer.thicknessMm) / lambda;
  }, 0);

  return 1 / (
    thermalMethod.interiorSurfaceResistanceM2KW[heatFlow] +
    rLayers +
    thermalMethod.exteriorSurfaceResistanceM2KW
  );
}

export function assemblyUValue(
  assembly: ConstructionAssembly,
  heatFlow: HeatFlowDirection = "horizontal"
) {
  return assemblyUValueWithLambdaMode(assembly, "typical", heatFlow);
}

export function assemblyUValueRange(
  assembly: ConstructionAssembly,
  heatFlow: HeatFlowDirection = "horizontal"
) {
  const low = assemblyUValueWithLambdaMode(assembly, "min", heatFlow);
  const high = assemblyUValueWithLambdaMode(assembly, "max", heatFlow);
  return [Math.min(low, high), Math.max(low, high)] as const;
}

export function thermalSummary(model: ShelterModel) {
  const assemblies = getModelAssemblies(model);
  const wallU = assemblyUValue(
    assemblies.wall,
    thermalMethod.assemblyHeatFlow.wall
  );
  const floorU = assemblyUValue(
    assemblies.floor,
    thermalMethod.assemblyHeatFlow.floor
  );
  const roofU = assemblyUValue(
    assemblies.roof,
    thermalMethod.assemblyHeatFlow.roof
  );
  const wallURange = assemblyUValueRange(
    assemblies.wall,
    thermalMethod.assemblyHeatFlow.wall
  );
  const floorURange = assemblyUValueRange(
    assemblies.floor,
    thermalMethod.assemblyHeatFlow.floor
  );
  const roofURange = assemblyUValueRange(
    assemblies.roof,
    thermalMethod.assemblyHeatFlow.roof
  );
  const area = surfaceAreas(model);
  const deltaTK = thermalMethod.comparisonDeltaTK;

  const envelopeTransmissionW =
    wallU * area.wallM2 * deltaTK +
    floorU * area.floorM2 * deltaTK +
    roofU * area.roofM2 * deltaTK;

  const envelopeTransmissionRangeW = [
    wallURange[0] * area.wallM2 * deltaTK +
      floorURange[0] * area.floorM2 * deltaTK +
      roofURange[0] * area.roofM2 * deltaTK,
    wallURange[1] * area.wallM2 * deltaTK +
      floorURange[1] * area.floorM2 * deltaTK +
      roofURange[1] * area.roofM2 * deltaTK
  ] as const;

  return {
    methodVersion: thermalMethod.version,
    wallU,
    floorU,
    roofU,
    wallURange,
    floorURange,
    roofURange,
    envelopeTransmissionW,
    envelopeTransmissionRangeW,
    deltaTK,
    surfaceResistances: {
      wallRsi: thermalMethod.interiorSurfaceResistanceM2KW.horizontal,
      roofRsi: thermalMethod.interiorSurfaceResistanceM2KW.upward,
      floorRsi: thermalMethod.interiorSurfaceResistanceM2KW.downward,
      rse: thermalMethod.exteriorSurfaceResistanceM2KW
    },
    surfaceResistanceSourceId: thermalMethod.surfaceResistanceSourceId,
    limitations: thermalMethod.limitations
  };
}

export function materialSummary(model: ShelterModel) {
  const assemblies = getModelAssemblies(model);
  const area = surfaceAreas(model);
  const groups = new Map<string, {
    id: string;
    materialId: Material["id"];
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
