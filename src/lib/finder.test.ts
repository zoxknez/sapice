import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {matchShelterModels} from "@/lib/finder";

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
