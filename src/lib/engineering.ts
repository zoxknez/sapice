import type {ShelterModel} from "@/lib/domain";
import {materials} from "@/data/materials";

const MM_PER_M = 1000;
const MM2_PER_M2 = 1_000_000;

export function mmToM(value: number) {
  return value / MM_PER_M;
}

export function mm2ToM2(value: number) {
  return value / MM2_PER_M2;
}

export function roofSlope(model: ShelterModel) {
  const rise = model.dimensions.frontHeightMm - model.dimensions.rearHeightMm;
  const run = model.dimensions.depthMm;
  return {
    angleRad: Math.atan2(rise, run),
    trueLengthMm: Math.hypot(run, rise)
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

type Layer = {thicknessMm: number; lambdaWmK: number};

function uValue(layers: Layer[]) {
  const rsi = 0.13;
  const rse = 0.04;
  const rLayers = layers.reduce((sum, layer) => sum + mmToM(layer.thicknessMm) / layer.lambdaWmK, 0);
  return 1 / (rsi + rLayers + rse);
}

export function thermalSummary(model: ShelterModel) {
  const plywood = materials.plywood.lambdaTypicalWmK;
  const xps = materials.xps.lambdaTypicalWmK;
  const wallU = uValue([
    {thicknessMm: 12, lambdaWmK: plywood},
    {thicknessMm: model.construction.wallInsulationMm, lambdaWmK: xps},
    {thicknessMm: 9, lambdaWmK: plywood}
  ]);
  const floorU = uValue([
    {thicknessMm: 12, lambdaWmK: plywood},
    {thicknessMm: model.construction.floorInsulationMm, lambdaWmK: xps},
    {thicknessMm: 12, lambdaWmK: plywood}
  ]);
  const roofU = uValue([
    {thicknessMm: 12, lambdaWmK: plywood},
    {thicknessMm: model.construction.roofInsulationMm, lambdaWmK: xps},
    {thicknessMm: 9, lambdaWmK: plywood}
  ]);
  const area = surfaceAreas(model);
  const deltaTK = 20;
  const envelopeTransmissionW =
    wallU * area.wallM2 * deltaTK +
    floorU * area.floorM2 * deltaTK +
    roofU * area.roofM2 * deltaTK;

  return {wallU, floorU, roofU, envelopeTransmissionW, deltaTK};
}

export function materialSummary(model: ShelterModel) {
  const area = surfaceAreas(model);
  const panelArea = area.wallM2 + area.floorM2 + area.roofM2;
  return [
    {id: "outer-plywood", nameSr: "Spoljašnja šperploča", nameEn: "Exterior plywood", calculatedM2: panelArea, purchaseM2: panelArea * 1.1},
    {id: "xps", nameSr: "XPS izolacija", nameEn: "XPS insulation", calculatedM2: panelArea, purchaseM2: panelArea * 1.1},
    {id: "inner-plywood", nameSr: "Unutrašnja obloga", nameEn: "Interior lining", calculatedM2: panelArea, purchaseM2: panelArea * 1.1}
  ];
}
