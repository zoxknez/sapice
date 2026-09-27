import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {
  modelComparisonSummary,
  modelComparisonSummaryMap
} from "@/lib/catalog-summary";

describe("catalog comparison summaries", () => {
  it("builds one compact summary for every published model", () => {
    const summaries = modelComparisonSummaryMap(shelterModels);

    expect(Object.keys(summaries)).toHaveLength(shelterModels.length);
    for (const model of shelterModels) {
      expect(summaries[model.id]?.modelId).toBe(model.id);
      expect(summaries[model.id]?.planFingerprint).toMatch(/^[0-9a-f]{16}$/);
      expect(summaries[model.id]?.thumbnail.entranceCentersXmm)
        .toHaveLength(model.layout.entrances);
      expect(summaries[model.id]?.thumbnail.entranceRadiusMm)
        .toBeGreaterThan(0);
    }
  });

  it("keeps all comparison engineering values positive", () => {
    for (const model of shelterModels) {
      const summary = modelComparisonSummary(model);
      expect(summary.usableFloorAreaM2).toBeGreaterThan(0);
      expect(summary.chamberClearWidthMm).toBeGreaterThan(0);
      expect(summary.floorAreaPerRecommendedAnimalM2).toBeGreaterThan(0);
      expect(summary.wallInsulationMm).toBeGreaterThan(0);
      expect(summary.wallU).toBeGreaterThan(0);
    }
  });
});
