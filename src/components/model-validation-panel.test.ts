import {describe, expect, it} from "vitest";
import {validationStageLabel} from "@/components/model-validation-panel";

describe("validation status labels", () => {
  it("uses clear localized text for data validation", () => {
    expect(validationStageLabel("DATA_VALIDATED", "sr")).toBe("Podaci provereni");
    expect(validationStageLabel("DATA_VALIDATED", "en")).toBe("Data validated");
  });

  it("keeps higher validation stages distinct", () => {
    expect(validationStageLabel("GEOMETRY_VALIDATED", "sr")).toBe("Geometrija verifikovana");
    expect(validationStageLabel("FIELD_TESTED", "en")).toBe("Field validation");
  });
});
