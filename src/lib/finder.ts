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

export const finderSpaceLimits = {
  width: {min: 600, max: 2400, step: 50},
  depth: {min: 500, max: 1800, step: 50}
} as const;

export const finderCatCountLimits = {min: 1, max: 12} as const;

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

type FinderConstraint = "animal" | "size" | "capacity" | "heating" | "climate" | "width" | "depth";

function requestedCountFor(criteria: FinderCriteria) {
  return criteria.animal === "dog" ? 1 : Math.max(1, criteria.count);
}

function failedConstraints(model: ShelterModel, criteria: FinderCriteria): Set<FinderConstraint> {
  const failed = new Set<FinderConstraint>();
  const heatingOk =
    criteria.heating === "any" ||
    (criteria.heating === "heated" && model.heated) ||
    (criteria.heating === "passive" && !model.heated);
  const sizeOk =
    criteria.animal === "cat"
      ? model.animalSizeClass === "standard"
      : model.animalSizeClass === criteria.dogSize;

  if (model.animal !== criteria.animal) failed.add("animal");
  if (!sizeOk) failed.add("size");
  if (model.capacity.max < requestedCountFor(criteria)) failed.add("capacity");
  if (!heatingOk) failed.add("heating");
  if (climateRank[model.climateProfile] < needRank[criteria.climate]) failed.add("climate");
  if (model.dimensions.widthMm > criteria.maxWidthMm) failed.add("width");
  if (model.dimensions.depthMm > criteria.maxDepthMm) failed.add("depth");
  return failed;
}

/** Models that fail only constraints from `relaxable` (and at least none outside it). */
function candidatesFailingOnly(
  models: ShelterModel[],
  criteria: FinderCriteria,
  relaxable: readonly FinderConstraint[]
) {
  return models.filter((model) => {
    const failed = failedConstraints(model, criteria);
    return [...failed].every((constraint) => relaxable.includes(constraint));
  });
}

export function matchShelterModels(
  models: ShelterModel[],
  criteria: FinderCriteria
) {
  const requestedCount = requestedCountFor(criteria);

  return models
    .filter((model) => failedConstraints(model, criteria).size === 0)
    .sort((a, b) => {
      const capacityWasteA = a.capacity.max - requestedCount;
      const capacityWasteB = b.capacity.max - requestedCount;
      if (capacityWasteA !== capacityWasteB) return capacityWasteA - capacityWasteB;

      const areaA = a.dimensions.widthMm * a.dimensions.depthMm;
      const areaB = b.dimensions.widthMm * b.dimensions.depthMm;
      return areaA - areaB;
    });
}

export type FinderRelaxation =
  | {kind: "space"; criteria: FinderCriteria; matchCount: number}
  | {kind: "capacity"; criteria: FinderCriteria; matchCount: number; largestCapacity: number}
  | {kind: "heating"; criteria: FinderCriteria; matchCount: number}
  | {kind: "climate"; criteria: FinderCriteria; matchCount: number};

function roundUpToStep(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

/**
 * Deterministic single-constraint relaxations for an empty finder result.
 *
 * Each suggestion changes exactly one user-facing criterion (space counts as one)
 * and is only returned when the relaxed criteria produce at least one match.
 * Animal and dog-size class are never relaxed: they describe the animal, not a preference.
 */
export function suggestFinderRelaxations(
  models: ShelterModel[],
  criteria: FinderCriteria
): FinderRelaxation[] {
  const suggestions: FinderRelaxation[] = [];
  const withCount = (next: FinderCriteria) => matchShelterModels(models, next).length;

  const spaceCandidates = candidatesFailingOnly(models, criteria, ["width", "depth"]);
  if (spaceCandidates.length > 0) {
    const smallest = [...spaceCandidates].sort(
      (a, b) =>
        a.dimensions.widthMm * a.dimensions.depthMm - b.dimensions.widthMm * b.dimensions.depthMm
    )[0];
    const maxWidthMm = Math.max(
      criteria.maxWidthMm,
      roundUpToStep(smallest.dimensions.widthMm, finderSpaceLimits.width.step)
    );
    const maxDepthMm = Math.max(
      criteria.maxDepthMm,
      roundUpToStep(smallest.dimensions.depthMm, finderSpaceLimits.depth.step)
    );
    if (maxWidthMm <= finderSpaceLimits.width.max && maxDepthMm <= finderSpaceLimits.depth.max) {
      const next = {...criteria, maxWidthMm, maxDepthMm};
      const matchCount = withCount(next);
      if (matchCount > 0) suggestions.push({kind: "space", criteria: next, matchCount});
    }
  }

  if (criteria.animal === "cat") {
    const capacityCandidates = candidatesFailingOnly(models, criteria, ["capacity"]);
    if (capacityCandidates.length > 0) {
      const largestCapacity = Math.max(...capacityCandidates.map((model) => model.capacity.max));
      const next = {...criteria, count: largestCapacity};
      const matchCount = withCount(next);
      if (matchCount > 0) {
        suggestions.push({kind: "capacity", criteria: next, matchCount, largestCapacity});
      }
    }
  }

  if (criteria.heating !== "any") {
    const next: FinderCriteria = {...criteria, heating: "any"};
    const matchCount = withCount(next);
    if (matchCount > 0) suggestions.push({kind: "heating", criteria: next, matchCount});
  }

  const lowerClimates = (["cold", "moderate"] as const).filter(
    (climate) => needRank[climate] < needRank[criteria.climate]
  );
  for (const climate of lowerClimates) {
    const next = {...criteria, climate};
    const matchCount = withCount(next);
    if (matchCount > 0) {
      suggestions.push({kind: "climate", criteria: next, matchCount});
      break;
    }
  }

  return suggestions;
}
