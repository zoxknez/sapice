import type {ShelterModel} from "@/lib/domain";

export type ClimateNeed = "moderate" | "cold" | "severe";
export type HeatingNeed = "any" | "passive" | "heated";
export type DogSizeNeed = "small" | "medium" | "large";

export type FinderCriteria = {
  animal: "cat" | "dog";
  count: number;
  dogSize: DogSizeNeed;
  heating: HeatingNeed;
  climate: ClimateNeed;
  maxWidthMm: number;
  maxDepthMm: number;
};

const climateRank: Record<ShelterModel["climateProfile"], number> = {
  SHELTERED_MILD: 0,
  WINTER_MODERATE: 1,
  WINTER_COLD: 2,
  WINTER_SEVERE: 3
};

const needRank: Record<ClimateNeed, number> = {
  moderate: 1,
  cold: 2,
  severe: 3
};

export function matchShelterModels(
  models: ShelterModel[],
  criteria: FinderCriteria
) {
  const requestedCount = criteria.animal === "dog" ? 1 : Math.max(1, criteria.count);

  return models
    .filter((model) => {
      const heatingOk =
        criteria.heating === "any" ||
        (criteria.heating === "heated" && model.heated) ||
        (criteria.heating === "passive" && !model.heated);

      const sizeOk =
        criteria.animal === "cat"
          ? model.animalSizeClass === "standard"
          : model.animalSizeClass === criteria.dogSize;

      return (
        model.animal === criteria.animal &&
        sizeOk &&
        model.capacity.max >= requestedCount &&
        heatingOk &&
        climateRank[model.climateProfile] >= needRank[criteria.climate] &&
        model.dimensions.widthMm <= criteria.maxWidthMm &&
        model.dimensions.depthMm <= criteria.maxDepthMm
      );
    })
    .sort((a, b) => {
      const capacityWasteA = a.capacity.max - requestedCount;
      const capacityWasteB = b.capacity.max - requestedCount;
      if (capacityWasteA !== capacityWasteB) return capacityWasteA - capacityWasteB;

      const areaA = a.dimensions.widthMm * a.dimensions.depthMm;
      const areaB = b.dimensions.widthMm * b.dimensions.depthMm;
      return areaA - areaB;
    });
}
