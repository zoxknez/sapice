import {describe, expect, it} from "vitest";
import {getShelterModel, shelterModels} from "@/data/models";
import {compileShelterModel, compilerMethod} from "@/lib/compiler";

describe("compiled plan identity", () => {
  it("is deterministic for repeated compilation of the same model", () => {
    for (const model of shelterModels) {
      const first = compileShelterModel(model);
      const second = compileShelterModel(model);

      expect(first.compilerVersion).toBe(compilerMethod.version);
      expect(first.planFingerprint).toMatch(/^[0-9a-f]{16}$/);
      expect(first.planFingerprint).toBe(second.planFingerprint);
    }
  });

  it("keeps plan fingerprints unique across the published reference catalog", () => {
    const fingerprints = shelterModels.map(
      (model) => compileShelterModel(model).planFingerprint
    );
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });

  it("distinguishes heated and passive variants even when shell geometry matches", () => {
    const passive = getShelterModel("alpine-large-winter");
    const heated = getShelterModel("alpine-large-heated");
    expect(passive).toBeDefined();
    expect(heated).toBeDefined();

    expect(compileShelterModel(passive!).planFingerprint)
      .not.toBe(compileShelterModel(heated!).planFingerprint);
  });
});
