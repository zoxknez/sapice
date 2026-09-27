import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {validateShelterModel} from "@/lib/validation";

describe("published reference model validation", () => {
  it("has no model validation errors", () => {
    for (const model of shelterModels) {
      const errors = validateShelterModel(model).filter((issue) => issue.severity === "error");
      expect(errors, `${model.id}: ${JSON.stringify(errors)}`).toEqual([]);
    }
  });

  it("does not falsely claim physical testing", () => {
    for (const model of shelterModels) {
      expect(["PROTOTYPE_BUILT", "FIELD_TESTED"]).not.toContain(model.validationState);
    }
  });
});
