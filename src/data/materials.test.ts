import {describe, expect, it} from "vitest";
import {materials} from "@/data/materials";
import {sources} from "@/data/sources";

describe("material data provenance", () => {
  it("keeps conductivity values finite and inside their declared ranges", () => {
    for (const material of Object.values(materials)) {
      expect(Number.isFinite(material.lambdaTypicalWmK)).toBe(true);
      expect(material.lambdaTypicalWmK).toBeGreaterThan(0);
      expect(material.lambdaRangeWmK[0]).toBeLessThanOrEqual(material.lambdaTypicalWmK);
      expect(material.lambdaRangeWmK[1]).toBeGreaterThanOrEqual(material.lambdaTypicalWmK);

      for (const value of Object.values(material.lambdaByThicknessMm ?? {})) {
        expect(value).toBeGreaterThan(0);
        expect(value).toBeGreaterThanOrEqual(material.lambdaRangeWmK[0]);
        expect(value).toBeLessThanOrEqual(material.lambdaRangeWmK[1]);
      }
    }
  });

  it("resolves every material source id", () => {
    for (const material of Object.values(materials)) {
      expect(material.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of material.sourceIds) {
        expect(sources[sourceId], `${material.id}: missing ${sourceId}`).toBeDefined();
      }
    }
  });
});
