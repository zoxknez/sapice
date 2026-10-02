import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {matchShelterModels, suggestFinderRelaxations, type FinderCriteria} from "@/lib/finder";

describe("deterministic shelter matcher", () => {
  it("never returns a small or medium dog shelter for a large-dog request", () => {
    const matches = matchShelterModels(shelterModels, {
      animal: "dog",
      count: 1,
      dogSize: "large",
      heating: "any",
      climate: "cold",
      maxWidthMm: 2000,
      maxDepthMm: 2000
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((model) => model.animalSizeClass === "large")).toBe(true);
  });

  it("requires enough cat capacity", () => {
    const matches = matchShelterModels(shelterModels, {
      animal: "cat",
      count: 4,
      dogSize: "medium",
      heating: "passive",
      climate: "cold",
      maxWidthMm: 2000,
      maxDepthMm: 2000
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((model) => model.capacity.max >= 4)).toBe(true);
  });

  it("respects hard footprint limits", () => {
    const matches = matchShelterModels(shelterModels, {
      animal: "cat",
      count: 2,
      dogSize: "medium",
      heating: "any",
      climate: "cold",
      maxWidthMm: 700,
      maxDepthMm: 600
    });

    expect(matches.every((model) =>
      model.dimensions.widthMm <= 700 && model.dimensions.depthMm <= 600
    )).toBe(true);
  });

  it("finds a severe heating-ready model for every dog size class", () => {
    for (const dogSize of ["small", "medium", "large"] as const) {
      const matches = matchShelterModels(shelterModels, {
        animal: "dog",
        count: 1,
        dogSize,
        heating: "heated",
        climate: "severe",
        maxWidthMm: 2500,
        maxDepthMm: 2000
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.every((model) => model.heated)).toBe(true);
      expect(matches.every((model) => model.animalSizeClass === dogSize)).toBe(true);
    }
  });

  it("finds severe heating-ready coverage across published cat capacities", () => {
    for (const count of [1, 2, 4, 6, 8]) {
      const matches = matchShelterModels(shelterModels, {
        animal: "cat",
        count,
        dogSize: "medium",
        heating: "heated",
        climate: "severe",
        maxWidthMm: 2600,
        maxDepthMm: 2000
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].capacity.max).toBeGreaterThanOrEqual(count);
      expect(matches[0].heated).toBe(true);
    }
  });

  it("returns only heating-ready models when heating is required", () => {
    const matches = matchShelterModels(shelterModels, {
      animal: "dog",
      count: 1,
      dogSize: "large",
      heating: "heated",
      climate: "severe",
      maxWidthMm: 2000,
      maxDepthMm: 2000
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((model) => model.heated)).toBe(true);
  });
});

describe("finder relaxation suggestions", () => {
  const base: FinderCriteria = {
    animal: "cat",
    count: 2,
    dogSize: "medium",
    heating: "any",
    climate: "cold",
    maxWidthMm: 1400,
    maxDepthMm: 1400
  };

  it("suggests the smallest sufficient space when the footprint blocks every model", () => {
    const criteria: FinderCriteria = {...base, animal: "dog", dogSize: "large", maxWidthMm: 900, maxDepthMm: 900};
    expect(matchShelterModels(shelterModels, criteria)).toHaveLength(0);

    const space = suggestFinderRelaxations(shelterModels, criteria).find((item) => item.kind === "space");
    expect(space).toBeDefined();
    expect(space?.criteria.maxWidthMm).toBe(1150);
    expect(space?.criteria.maxDepthMm).toBe(1350);
    expect(matchShelterModels(shelterModels, space!.criteria).every((model) => model.animalSizeClass === "large")).toBe(true);
  });

  it("explains that severe passive requests need heating or a lower profile", () => {
    const criteria: FinderCriteria = {...base, heating: "passive", climate: "severe"};
    expect(matchShelterModels(shelterModels, criteria)).toHaveLength(0);

    const kinds = suggestFinderRelaxations(shelterModels, criteria).map((item) => item.kind);
    expect(kinds).toContain("heating");
    expect(kinds).toContain("climate");
  });

  it("caps cat counts at the largest published capacity", () => {
    const criteria: FinderCriteria = {...base, count: 12, maxWidthMm: 2400, maxDepthMm: 1800};
    const capacity = suggestFinderRelaxations(shelterModels, criteria).find((item) => item.kind === "capacity");
    expect(capacity?.kind === "capacity" && capacity.largestCapacity).toBe(8);
  });

  it("never relaxes the animal or the dog size class", () => {
    const criteria: FinderCriteria = {...base, animal: "dog", dogSize: "small", maxWidthMm: 600, maxDepthMm: 500};
    for (const suggestion of suggestFinderRelaxations(shelterModels, criteria)) {
      expect(suggestion.criteria.animal).toBe("dog");
      expect(suggestion.criteria.dogSize).toBe("small");
      expect(suggestion.matchCount).toBeGreaterThan(0);
    }
  });

  it("returns every suggestion with at least one match and changes nothing else", () => {
    const criteria: FinderCriteria = {...base, heating: "passive", climate: "severe", maxWidthMm: 600, maxDepthMm: 500};
    for (const suggestion of suggestFinderRelaxations(shelterModels, criteria)) {
      expect(matchShelterModels(shelterModels, suggestion.criteria).length).toBe(suggestion.matchCount);
      expect(suggestion.criteria.animal).toBe(criteria.animal);
    }
  });
});
