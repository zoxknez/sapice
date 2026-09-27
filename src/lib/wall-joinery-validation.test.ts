import {describe, expect, it} from "vitest";
import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {validateShelterModel} from "@/lib/validation";

const slopedCatModel: ShelterModel = {
  id: "cat-solo-joinery-validation-test",
  slug: "cat-solo-joinery-validation-test",
  version: "1.0.0",
  validationState: "DATA_VALIDATED",
  sourceIds: [
    "aspcapro-community-cat-winter",
    "aspca-cold-weather",
    "iso-6946-2017",
    "iso-13789-2017"
  ],
  animal: "cat",
  animalSizeClass: "standard",
  intendedUse: "COMMUNITY_CAT_SHELTER",
  capacity: {recommended: 1, max: 2},
  dimensions: {
    widthMm: 620,
    depthMm: 520,
    frontHeightMm: 500,
    rearHeightMm: 450,
    groundClearanceMm: 120
  },
  layout: {
    chambers: 1,
    entrances: 1,
    entranceWidthMm: 150,
    entranceHeightMm: 170,
    thresholdHeightMm: 110,
    dividerThicknessMm: 12
  },
  construction: {
    wallAssemblyId: "wall-xps-50",
    floorAssemblyId: "floor-xps-50",
    roofAssemblyId: "roof-xps-50"
  },
  roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
  maintenance: {roofAccess: "HINGED", hingeEdge: "FRONT"},
  ventilation: {
    strategy: "HIGH_REAR_PROVISION",
    status: "PROVISIONAL",
    zonesPerChamber: 1
  },
  heated: false,
  climateProfile: "WINTER_COLD",
  referenceOutsideC: -10,
  translations: {
    sr: {name: "Test model", description: "Joinery validation fixture."},
    en: {name: "Test model", description: "Joinery validation fixture."}
  }
};

describe("wall joinery validation", () => {
  it("accepts side panels cut at the front and rear joinery boundaries", () => {
    const compiled = compileShelterModel(slopedCatModel);
    const sideOuter = compiled.cutParts.find((part) => part.id === "side-outer");
    const issues = validateShelterModel(slopedCatModel);

    expect(sideOuter?.heightMm).toBe(348);
    expect(sideOuter?.trapezoidRearHeightMm).toBe(312);
    expect(issues.map((issue) => issue.code)).not.toContain(
      "WALL_CUT_INTERFACE_MISMATCH"
    );
  });
});
