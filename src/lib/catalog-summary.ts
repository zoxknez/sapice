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
    wallU: compiled.thermal.wallU
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
