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

export function constructionInterfaceGeometry(model: ShelterModel) {
  const construction = constructionSummary(model);
  const slope = roofSlope(model);
  const roofVerticalThicknessMm =
    construction.roofThicknessMm * Math.cos(slope.angleRad);

  const wallFrontHeightMm = Math.max(
    0,
    model.dimensions.frontHeightMm -
      construction.floorThicknessMm -
      roofVerticalThicknessMm
  );
  const wallRearHeightMm = Math.max(
    0,
    model.dimensions.rearHeightMm -
      construction.floorThicknessMm -
      roofVerticalThicknessMm
  );

  return {
    datum: "FLOOR_FULL_FOOTPRINT_WALLS_ON_FLOOR_ROOF_ON_WALLS" as const,
    floorTopElevationMm: construction.floorThicknessMm,
    roofVerticalThicknessMm,
    wallBaseElevationMm: construction.floorThicknessMm,
    wallFrontHeightMm,
    wallRearHeightMm,
    wallFrontTopElevationMm:
      construction.floorThicknessMm + wallFrontHeightMm,
    wallRearTopElevationMm:
      construction.floorThicknessMm + wallRearHeightMm,
    overallFrontHeightMm: model.dimensions.frontHeightMm,
    overallRearHeightMm: model.dimensions.rearHeightMm
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

export const framingMethod = {
  version: "1.1.0",
  maxStudSpacingMm: 500
} as const;

export function provisionalIntermediatePositions(
  spanMm: number,
  maxSpacingMm = framingMethod.maxStudSpacingMm
) {
  const count = Math.max(0, Math.ceil(spanMm / maxSpacingMm) - 1);
  return Array.from(
    {length: count},
    (_, index) => Math.round(spanMm * ((index + 1) / (count + 1)))
  );
}

export function heatingProvisionGeometry(model: ShelterModel) {
  if (!model.heated) {
    return {
      status: "NOT_APPLICABLE" as const,
      safetySourceId: "iec-60335-2-71-2018",
      zones: [],
      limitations: [
        "No heating geometry is compiled for passive models"
      ]
    };
  }

  const layout = layoutGeometry(model);
  const construction = constructionSummary(model);
  const internalDepthMm = Math.max(
    0,
    model.dimensions.depthMm - 2 * construction.wallThicknessMm
  );

  const zones = layout.chamberStartsXmm.map((chamberStartMm, index) => {
    const chamberWidthMm = layout.chamberWidthMm;
    const widthMm = Math.round(chamberWidthMm * 0.55);
    const depthMm = Math.round(internalDepthMm * 0.4);
    const xMm =
      chamberStartMm +
      (chamberWidthMm - widthMm) / 2;
    const zMm =
      construction.wallThicknessMm +
      internalDepthMm -
      depthMm -
      Math.max(30, Math.round(internalDepthMm * 0.08));

    return {
      id: `heating-zone-${index + 1}`,
      chamber: index + 1,
      xMm,
      zMm,
      widthMm,
      depthMm,
      areaM2: (widthMm * depthMm) / 1_000_000,
      chamberFloorAreaM2:
        (chamberWidthMm * internalDepthMm) / 1_000_000,
      provenance: "ASSUMPTION" as const,
      actualProductFootprint: "TBD_BY_SELECTED_HEATING_PRODUCT" as const
    };
  });

  return {
    status: "PRODUCT_SPECIFIC" as const,
    safetySourceId: "iec-60335-2-71-2018",
    zones,
    limitations: [
      "Zones coordinate possible product placement only",
      "Actual heater dimensions and power are product-specific",
      "Manufacturer instructions remain authoritative",
      "Each chamber retains an unheated floor-choice area",
      "No DIY mains wiring or heater construction is specified"
    ]
  };
}

export function ventilationProvisionGeometry(model: ShelterModel) {
  const layout = layoutGeometry(model);
  const interfaces = constructionInterfaceGeometry(model);
  const rearSupportPositionsMm = provisionalIntermediatePositions(
    model.dimensions.widthMm
  );
  const zones = [];
  const topClearanceMm = Math.max(
    45,
    Math.min(70, Math.round(interfaces.wallRearHeightMm * 0.1))
  );

  for (let chamberIndex = 0; chamberIndex < model.layout.chambers; chamberIndex++) {
    const chamberStartMm = layout.chamberStartsXmm[chamberIndex];
    const chamberWidthMm = layout.chamberWidthMm;
    const zoneWidthMm = Math.round(
      Math.min(120, Math.max(80, chamberWidthMm * 0.2))
    );
    const zoneHeightMm = Math.round(
      Math.min(60, Math.max(40, interfaces.wallRearHeightMm * 0.08))
    );
    const candidateFractions = [0.2, 0.8, 0.35, 0.65, 0.5];
    const clearanceFromStudMm = zoneWidthMm / 2 + 30;

    const chosenFraction =
      candidateFractions.find((fraction) => {
        const centerXmm = chamberStartMm + chamberWidthMm * fraction;
        return rearSupportPositionsMm.every(
          (studXmm) => Math.abs(studXmm - centerXmm) >= clearanceFromStudMm
        );
      }) ?? 0.5;

    const centerXmm = chamberStartMm + chamberWidthMm * chosenFraction;
    const bottomMm = Math.max(
      0,
      interfaces.wallRearHeightMm - topClearanceMm - zoneHeightMm
    );

    zones.push({
      id: `rear-vent-zone-${chamberIndex + 1}`,
      chamber: chamberIndex + 1,
      wall: "rear" as const,
      centerXmm,
      bottomMm,
      widthMm: zoneWidthMm,
      heightMm: zoneHeightMm,
      provenance: "ASSUMPTION" as const,
      actualOpening: "TBD_BY_SELECTED_VENT_INSERT" as const
    });
  }

  return {
    strategy: model.ventilation.strategy,
    status: model.ventilation.status,
    zonesPerChamber: model.ventilation.zonesPerChamber,
    topClearanceMm,
    rearSupportPositionsMm,
    zones,
    limitations: [
      "Provision zones are not ventilation free-area requirements",
      "Final vent insert dimensions remain product-specific",
      "Airflow and condensation performance require physical validation",
      "Ventilation must not create excessive localised draughts"
    ]
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
  const {widthMm: w, depthMm: d} = model.dimensions;
  const interfaces = constructionInterfaceGeometry(model);
  const entrance = entranceGeometry(model);
  const openingArea = entrance.totalOpeningAreaMm2;
  const wallAreaMm2 =
    w * interfaces.wallFrontHeightMm +
    w * interfaces.wallRearHeightMm +
    2 * d * ((interfaces.wallFrontHeightMm + interfaces.wallRearHeightMm) / 2) -
    openingArea;
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
    "No validated airflow model for the provisional ventilation insert zones",
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
