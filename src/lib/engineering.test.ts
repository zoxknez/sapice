import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {materialSummary, roofSlope, surfaceAreas, thermalSummary} from "@/lib/engineering";

describe("engineering model derivations", () => {
  it("keeps all reference model dimensions and areas positive", () => {
    for (const model of shelterModels) {
      const areas = surfaceAreas(model);
      expect(model.dimensions.widthMm).toBeGreaterThan(0);
      expect(model.dimensions.depthMm).toBeGreaterThan(0);
      expect(areas.wallM2).toBeGreaterThan(0);
      expect(areas.floorM2).toBeGreaterThan(0);
      expect(areas.roofM2).toBeGreaterThan(0);
    }
  });

  it("calculates a true roof length at least as long as plan depth", () => {
    for (const model of shelterModels) {
      expect(roofSlope(model).trueLengthMm).toBeGreaterThanOrEqual(model.dimensions.depthMm);
    }
  });

  it("returns finite positive thermal values", () => {
    for (const model of shelterModels) {
      const thermal = thermalSummary(model);
      expect(thermal.wallU).toBeGreaterThan(0);
      expect(thermal.floorU).toBeGreaterThan(0);
      expect(thermal.roofU).toBeGreaterThan(0);
      expect(Number.isFinite(thermal.envelopeTransmissionW)).toBe(true);
      expect(thermal.envelopeTransmissionW).toBeGreaterThan(0);
    }
  });

  it("adds purchase allowance without reducing calculated material", () => {
    for (const model of shelterModels) {
      for (const item of materialSummary(model)) {
        expect(item.purchaseM2).toBeGreaterThanOrEqual(item.calculatedM2);
      }
    }
  });
});
