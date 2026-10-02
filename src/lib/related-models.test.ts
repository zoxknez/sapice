import {describe, expect, it} from "vitest";
import {shelterModels, getShelterModel} from "@/data/models";
import {heatingCounterpart, neighbouringModels} from "@/lib/related-models";

function requireModel(slug: string) {
  const model = getShelterModel(slug);
  if (!model) throw new Error(`Missing model ${slug}`);
  return model;
}

describe("related models", () => {
  it("pairs every heated variant with its passive base envelope and back", () => {
    for (const model of shelterModels.filter((item) => item.heated)) {
      const counterpart = heatingCounterpart(model, shelterModels);
      expect(counterpart, model.slug).toBeDefined();
      expect(counterpart?.heated).toBe(false);
      expect(heatingCounterpart(counterpart!, shelterModels)?.id).toBe(model.id);
    }
  });

  it("keeps neighbours within the same animal and heating strategy", () => {
    for (const model of shelterModels) {
      const neighbours = neighbouringModels(model, shelterModels);
      expect(neighbours.length).toBeLessThanOrEqual(3);
      for (const neighbour of neighbours) {
        expect(neighbour.id).not.toBe(model.id);
        expect(neighbour.animal).toBe(model.animal);
        expect(neighbour.heated).toBe(model.heated);
      }
    }
  });

  it("orders cat neighbours by capacity distance", () => {
    const duo = requireModel("nordic-duo-winter");
    const [first] = neighbouringModels(duo, shelterModels);
    expect(first.slug).toBe("nordic-solo-winter");
  });

  it("is deterministic", () => {
    const model = requireModel("alpine-medium-winter");
    expect(neighbouringModels(model, shelterModels).map((item) => item.slug))
      .toEqual(neighbouringModels(model, [...shelterModels].reverse()).map((item) => item.slug));
  });
});
