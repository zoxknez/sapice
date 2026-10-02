import type {ShelterModel} from "@/lib/domain";

function sameEnvelope(a: ShelterModel, b: ShelterModel) {
  return (
    a.animal === b.animal &&
    a.animalSizeClass === b.animalSizeClass &&
    a.capacity.max === b.capacity.max &&
    a.layout.chambers === b.layout.chambers &&
    a.dimensions.widthMm === b.dimensions.widthMm &&
    a.dimensions.depthMm === b.dimensions.depthMm &&
    a.dimensions.frontHeightMm === b.dimensions.frontHeightMm
  );
}

const dogSizeRank: Record<ShelterModel["animalSizeClass"], number> = {
  standard: 0,
  small: 1,
  medium: 2,
  large: 3
};

/**
 * The same shelter envelope with the opposite heating strategy, if the catalog publishes one.
 */
export function heatingCounterpart(model: ShelterModel, models: readonly ShelterModel[]) {
  return models.find(
    (candidate) =>
      candidate.id !== model.id &&
      candidate.heated !== model.heated &&
      sameEnvelope(candidate, model)
  );
}

/**
 * Deterministic "nearby" models: same animal and heating strategy, ordered by how close
 * their capacity (cats) or size class (dogs) is, then by footprint and slug.
 */
export function neighbouringModels(
  model: ShelterModel,
  models: readonly ShelterModel[],
  limit = 3
) {
  const scale = (candidate: ShelterModel) =>
    candidate.animal === "dog" ? dogSizeRank[candidate.animalSizeClass] : candidate.capacity.max;
  const footprint = (candidate: ShelterModel) =>
    candidate.dimensions.widthMm * candidate.dimensions.depthMm;

  return models
    .filter(
      (candidate) =>
        candidate.id !== model.id &&
        candidate.animal === model.animal &&
        candidate.heated === model.heated
    )
    .sort((a, b) => {
      const distance = Math.abs(scale(a) - scale(model)) - Math.abs(scale(b) - scale(model));
      if (distance !== 0) return distance;
      const area = Math.abs(footprint(a) - footprint(model)) - Math.abs(footprint(b) - footprint(model));
      if (area !== 0) return area;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}
