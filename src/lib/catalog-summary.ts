import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {assemblyInsulationMm} from "@/data/assemblies";

export type ModelComparisonSummary = {
  modelId: string;
  planFingerprint: string;
  usableFloorAreaM2: number;
  chamberClearWidthMm: number;
  floorAreaPerRecommendedAnimalM2: number;
  wallInsulationMm: number;
  wallU: number;
  thumbnail: {
    entranceCentersXmm: number[];
    entranceWidthMm: number;
    entranceHeightMm: number;
    entranceRadiusMm: number;
    thresholdHeightMm: number;
    floorThicknessMm: number;
    roofVerticalThicknessMm: number;
    roofAngleRad: number;
    baseProfileMm: [number, number];
    baseRunnerPositionsXmm: number[];
    baseSupportPositionsZmm: number[];
    baseSupportPostHeightMm: number;
  };
};

export function modelComparisonSummary(
  model: ShelterModel
): ModelComparisonSummary {
  const compiled = compileShelterModel(model);

  return {
    modelId: model.id,
    planFingerprint: compiled.planFingerprint,
    usableFloorAreaM2: compiled.internal.usableFloorAreaM2,
    chamberClearWidthMm: compiled.internal.chamberClearWidthMm,
    floorAreaPerRecommendedAnimalM2:
      compiled.internal.floorAreaPerRecommendedAnimalM2,
    wallInsulationMm: assemblyInsulationMm(compiled.assemblies.wall),
    wallU: compiled.thermal.wallU,
    thumbnail: {
      entranceCentersXmm: compiled.layout.entranceCentersXmm,
      entranceWidthMm: compiled.entrance.widthMm,
      entranceHeightMm: compiled.entrance.heightMm,
      entranceRadiusMm: compiled.entrance.radiusMm,
      thresholdHeightMm: compiled.entrance.thresholdHeightMm,
      floorThicknessMm: compiled.construction.floorThicknessMm,
      roofVerticalThicknessMm: compiled.interfaces.roofVerticalThicknessMm,
      roofAngleRad: compiled.roof.angleRad,
      baseProfileMm: compiled.framing.baseProfileMm,
      baseRunnerPositionsXmm: compiled.framing.baseRunnerPositionsXmm,
      baseSupportPositionsZmm: compiled.framing.baseSupportPositionsZmm,
      baseSupportPostHeightMm: compiled.framing.baseSupportPostHeightMm
    }
  };
}

export function modelComparisonSummaryMap(models: ShelterModel[]) {
  return Object.fromEntries(
    models.map((model) => {
      const summary = modelComparisonSummary(model);
      return [model.id, summary];
    })
  ) as Record<string, ModelComparisonSummary>;
}
