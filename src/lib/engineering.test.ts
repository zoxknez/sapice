import {describe, expect, it} from "vitest";
import {getShelterModel, shelterModels} from "@/data/models";
import {getAssembly} from "@/data/assemblies";
import {
  assemblyUValue,
  materialSummary,
  roofPanelGeometry,
  roofSlope,
  surfaceAreas,
  thermalSummary
} from "@/lib/engineering";
import {compileShelterModel} from "@/lib/compiler";

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

  it("keeps full roof panel larger than the protected roof envelope", () => {
    for (const model of shelterModels) {
      const panel = roofPanelGeometry(model);
      expect(panel.areaM2).toBeGreaterThan(surfaceAreas(model).roofM2);
      expect(panel.panelWidthMm).toBeGreaterThan(model.dimensions.widthMm);
      expect(panel.panelLengthMm).toBeGreaterThan(roofSlope(model).trueLengthMm);
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

  it("keeps nominal values inside thermal sensitivity bands", () => {
    for (const model of shelterModels) {
      const thermal = thermalSummary(model);
      expect(thermal.wallU).toBeGreaterThanOrEqual(thermal.wallURange[0]);
      expect(thermal.wallU).toBeLessThanOrEqual(thermal.wallURange[1]);
      expect(thermal.floorU).toBeGreaterThanOrEqual(thermal.floorURange[0]);
      expect(thermal.floorU).toBeLessThanOrEqual(thermal.floorURange[1]);
      expect(thermal.roofU).toBeGreaterThanOrEqual(thermal.roofURange[0]);
      expect(thermal.roofU).toBeLessThanOrEqual(thermal.roofURange[1]);
      expect(thermal.envelopeTransmissionW).toBeGreaterThanOrEqual(
        thermal.envelopeTransmissionRangeW[0]
      );
      expect(thermal.envelopeTransmissionW).toBeLessThanOrEqual(
        thermal.envelopeTransmissionRangeW[1]
      );
    }
  });

  it("makes 60 mm XPS wall assembly thermally better than 50 mm", () => {
    expect(assemblyUValue(getAssembly("wall-xps-60"))).toBeLessThan(
      assemblyUValue(getAssembly("wall-xps-50"))
    );
  });

  it("adds purchase allowance without reducing calculated material", () => {
    for (const model of shelterModels) {
      for (const item of materialSummary(model)) {
        expect(item.purchaseM2).toBeGreaterThanOrEqual(item.calculatedM2);
      }
    }
  });

  it("keeps every entrance cutout inside its host panel", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      for (const part of compiled.cutParts) {
        for (const cutout of part.cutouts ?? []) {
          expect(cutout.xMm).toBeGreaterThanOrEqual(0);
          expect(cutout.yMm).toBeGreaterThanOrEqual(0);
          expect(cutout.xMm + cutout.widthMm).toBeLessThanOrEqual(part.widthMm);
          expect(cutout.yMm + cutout.heightMm).toBeLessThanOrEqual(part.heightMm);
        }
      }
    }
  });

  it("keeps large heated and passive dog geometry identical", () => {
    const passive = getShelterModel("alpine-large-winter");
    const heated = getShelterModel("alpine-large-heated");
    expect(passive).toBeDefined();
    expect(heated).toBeDefined();

    const a = compileShelterModel(passive!);
    const b = compileShelterModel(heated!);

    expect(a.internal).toEqual(b.internal);
    expect(a.roofPanel).toEqual(b.roofPanel);
  });
});
