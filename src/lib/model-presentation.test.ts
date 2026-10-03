import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {modelDescription, modelName} from "@/lib/model-presentation";

describe("localized model presentation", () => {
  it("gives every model a unique Serbian display name", () => {
    const names = shelterModels.map((model) => modelName(model, "sr"));
    expect(new Set(names).size).toBe(shelterModels.length);
    for (const model of shelterModels) {
      expect(modelName(model, "sr"), model.id).not.toBe(model.translations.en.name);
    }
  });

  it("keeps canonical English names and descriptions for the English locale", () => {
    for (const model of shelterModels) {
      expect(modelName(model, "en")).toBe(model.translations.en.name);
      expect(modelDescription(model, "en")).toBe(model.translations.en.description);
    }
  });

  it("marks heated variants in the Serbian name", () => {
    for (const model of shelterModels) {
      expect(modelName(model, "sr").includes("grejana"), model.id).toBe(model.heated);
    }
  });
});
