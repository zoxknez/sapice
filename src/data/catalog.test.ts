import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {sources} from "@/data/sources";

describe("catalog integrity", () => {
  it("keeps model ids and slugs unique", () => {
    const ids = shelterModels.map((model) => model.id);
    const slugs = shelterModels.map((model) => model.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps bilingual model copy populated", () => {
    for (const model of shelterModels) {
      expect(model.translations.sr.name.trim().length).toBeGreaterThan(0);
      expect(model.translations.sr.description.trim().length).toBeGreaterThan(0);
      expect(model.translations.en.name.trim().length).toBeGreaterThan(0);
      expect(model.translations.en.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps source record ids aligned with their keys", () => {
    for (const [key, source] of Object.entries(sources)) {
      expect(source.id).toBe(key);
      expect(source.url.startsWith("https://")).toBe(true);
      expect(/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)).toBe(true);
    }
  });

  it("provides passive and heated coverage for every reference dog size", () => {
    for (const size of ["small", "medium", "large"] as const) {
      const variants = shelterModels.filter(
        (model) => model.animal === "dog" && model.animalSizeClass === size
      );
      expect(variants.some((model) => !model.heated)).toBe(true);
      expect(variants.some((model) => model.heated)).toBe(true);
    }
  });

  it("provides passive and heated coverage for every published cat capacity tier", () => {
    for (const capacity of [1, 2, 4, 6, 8]) {
      const variants = shelterModels.filter(
        (model) =>
          model.animal === "cat" &&
          model.capacity.recommended === capacity
      );
      expect(variants.some((model) => !model.heated)).toBe(true);
      expect(variants.some((model) => model.heated)).toBe(true);
    }
  });

  it("keeps every heated reference bound to the animal-heating safety source", () => {
    for (const model of shelterModels.filter((item) => item.heated)) {
      expect(model.sourceIds).toContain("iec-60335-2-71-2018");
      expect(model.climateProfile).toBe("WINTER_SEVERE");
    }
  });

  it("does not duplicate source ids within one model", () => {
    for (const model of shelterModels) {
      expect(new Set(model.sourceIds).size).toBe(model.sourceIds.length);
    }
  });
});
