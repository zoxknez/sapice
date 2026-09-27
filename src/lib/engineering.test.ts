import {describe, expect, it} from "vitest";
import {getShelterModel, shelterModels} from "@/data/models";
import {getAssembly} from "@/data/assemblies";
import {
  assemblyUValue,
  constructionInterfaceGeometry,
  entranceGeometry,
  ventilationProvisionGeometry,
  materialSummary,
  thermalMethod,
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

  it("rebuilds declared overall height from floor wall and roof interfaces", () => {
    for (const model of shelterModels) {
      const interfaces = constructionInterfaceGeometry(model);
      const compiled = compileShelterModel(model);

      expect(
        compiled.construction.floorThicknessMm +
          interfaces.wallFrontHeightMm +
          interfaces.roofVerticalThicknessMm
      ).toBeCloseTo(model.dimensions.frontHeightMm, 8);

      expect(
        compiled.construction.floorThicknessMm +
          interfaces.wallRearHeightMm +
          interfaces.roofVerticalThicknessMm
      ).toBeCloseTo(model.dimensions.rearHeightMm, 8);

      expect(interfaces.wallFrontHeightMm).toBeGreaterThan(0);
      expect(interfaces.wallRearHeightMm).toBeGreaterThan(0);
    }
  });

  it("keeps the roof top inside the declared height instead of adding roof thickness above it", () => {
    for (const model of shelterModels) {
      const interfaces = constructionInterfaceGeometry(model);
      expect(interfaces.overallFrontHeightMm).toBe(model.dimensions.frontHeightMm);
      expect(interfaces.overallRearHeightMm).toBe(model.dimensions.rearHeightMm);
      expect(interfaces.wallFrontTopElevationMm).toBeLessThan(model.dimensions.frontHeightMm);
      expect(interfaces.wallRearTopElevationMm).toBeLessThan(model.dimensions.rearHeightMm);
    }
  });

  it("keeps fabrication parts on the same floor-wall-roof interface datum", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      const frontOuter = compiled.cutParts.find((part) => part.id === "front-outer");
      const rearOuter = compiled.cutParts.find((part) => part.id === "rear-outer");
      const sideOuter = compiled.cutParts.find((part) => part.id === "side-outer");
      const roofInner = compiled.cutParts.find((part) => part.id === "roof-inner");
      const floorXps = compiled.cutParts.find((part) => part.id.startsWith("xps-floor"));

      expect(frontOuter?.heightMm).toBe(Math.round(compiled.interfaces.wallFrontHeightMm));
      expect(rearOuter?.heightMm).toBe(Math.round(compiled.interfaces.wallRearHeightMm));
      expect(sideOuter?.heightMm).toBe(Math.round(compiled.interfaces.wallFrontHeightMm));
      expect(sideOuter?.trapezoidRearHeightMm)
        .toBe(Math.round(compiled.interfaces.wallRearHeightMm));

      for (const cutout of frontOuter?.cutouts ?? []) {
        expect(cutout.yMm).toBe(compiled.internal.entranceSillAboveFinishedFloorMm);
      }

      expect(roofInner?.widthMm).toBe(model.dimensions.widthMm);
      expect(roofInner?.heightMm).toBe(Math.ceil(compiled.roof.trueLengthMm));
      expect(floorXps).toBeDefined();
    }
  });

  it("uses rounded entrance area consistently in wall surface calculations", () => {
    for (const model of shelterModels) {
      const entrance = entranceGeometry(model);
      const rectangularAreaMm2 =
        model.layout.entranceWidthMm *
        model.layout.entranceHeightMm *
        model.layout.entrances;

      expect(entrance.totalOpeningAreaMm2).toBeLessThan(rectangularAreaMm2);
      expect(entrance.radiusMm).toBeGreaterThan(0);
      expect(surfaceAreas(model).openingM2).toBeCloseTo(
        entrance.totalOpeningAreaMm2 / 1_000_000,
        8
      );
    }
  });

  it("keeps one provisional high-rear ventilation zone inside each chamber", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      const ventilation = ventilationProvisionGeometry(model);

      expect(ventilation.zones).toHaveLength(model.layout.chambers);

      for (const zone of ventilation.zones) {
        const chamberIndex = zone.chamber - 1;
        const chamberLeftMm = compiled.layout.chamberStartsXmm[chamberIndex];
        const chamberRightMm = chamberLeftMm + compiled.layout.chamberWidthMm;

        expect(zone.centerXmm - zone.widthMm / 2).toBeGreaterThanOrEqual(chamberLeftMm);
        expect(zone.centerXmm + zone.widthMm / 2).toBeLessThanOrEqual(chamberRightMm);
        expect(zone.bottomMm).toBeGreaterThanOrEqual(0);
        expect(zone.bottomMm + zone.heightMm)
          .toBeLessThanOrEqual(compiled.interfaces.wallRearHeightMm);
        expect(zone.actualOpening).toBe("TBD_BY_SELECTED_VENT_INSERT");
      }
    }
  });

  it("keeps ventilation provision zones clear of provisional rear studs", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      const rearStuds = compiled.linearParts
        .filter((part) => part.wall === "rear" && typeof part.positionMm === "number")
        .map((part) => part.positionMm as number);

      for (const zone of compiled.ventilation.zones) {
        for (const studXmm of rearStuds) {
          expect(Math.abs(studXmm - zone.centerXmm)).toBeGreaterThanOrEqual(
            zone.widthMm / 2 + compiled.framing.frameProfileMm[0] / 2
          );
        }
      }
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

  it("uses ISO 6946 orientation-specific surface resistances", () => {
    expect(thermalMethod.version).toBe("1.1.0");
    expect(thermalMethod.interiorSurfaceResistanceM2KW.horizontal).toBe(0.13);
    expect(thermalMethod.interiorSurfaceResistanceM2KW.upward).toBe(0.10);
    expect(thermalMethod.interiorSurfaceResistanceM2KW.downward).toBe(0.17);
    expect(thermalMethod.exteriorSurfaceResistanceM2KW).toBe(0.04);

    const wall = getAssembly("wall-xps-50");
    const horizontalU = assemblyUValue(wall, "horizontal");
    const upwardU = assemblyUValue(wall, "upward");
    const downwardU = assemblyUValue(wall, "downward");

    expect(upwardU).toBeGreaterThan(horizontalU);
    expect(horizontalU).toBeGreaterThan(downwardU);
  });

  it("reports the assembly heat-flow assumptions in every thermal summary", () => {
    for (const model of shelterModels) {
      const thermal = thermalSummary(model);
      expect(thermal.surfaceResistances.wallRsi).toBe(0.13);
      expect(thermal.surfaceResistances.roofRsi).toBe(0.10);
      expect(thermal.surfaceResistances.floorRsi).toBe(0.17);
      expect(thermal.surfaceResistances.rse).toBe(0.04);
      expect(thermal.surfaceResistanceSourceId).toBe("iso-6946-2017");
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

  it("compiles multi-chamber dividers as roof-slope trapezoids", () => {
    for (const model of shelterModels.filter((item) => item.layout.chambers > 1)) {
      const compiled = compileShelterModel(model);
      const divider = compiled.cutParts.find((part) => part.id === "divider");
      expect(divider).toBeDefined();
      expect(divider?.shape).toBe("trapezoid");
      expect(divider?.heightMm).toBe(compiled.internal.frontHeightMm);
      expect(divider?.trapezoidRearHeightMm).toBe(compiled.internal.rearHeightMm);
      expect(divider?.thicknessMm).toBe(model.layout.dividerThicknessMm);
    }
  });

  it("centers entrances inside chambers for multi-chamber models", () => {
    for (const model of shelterModels.filter(
      (item) => item.layout.entrances === item.layout.chambers && item.layout.chambers > 1
    )) {
      const compiled = compileShelterModel(model);
      expect(compiled.layout.entranceCentersXmm).toHaveLength(model.layout.chambers);

      compiled.layout.entranceCentersXmm.forEach((centerMm, index) => {
        const expected =
          compiled.layout.chamberStartsXmm[index] +
          compiled.layout.chamberWidthMm / 2;
        expect(centerMm).toBeCloseTo(expected, 6);
      });

      compiled.layout.dividerPositionsXmm.forEach((dividerMm, index) => {
        const expected =
          compiled.layout.chamberStartsXmm[index] +
          compiled.layout.chamberWidthMm +
          compiled.layout.dividerThicknessMm / 2;
        expect(dividerMm).toBeCloseTo(expected, 6);
      });
    }
  });

  it("keeps every entrance sill above the V1 bottom framing rail", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      expect(compiled.internal.entranceSillAboveFinishedFloorMm)
        .toBeGreaterThanOrEqual(compiled.framing.frameProfileMm[0]);
    }
  });

  it("keeps front entrance-support gaps within the compiled maximum", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      const points = [
        0,
        ...compiled.framing.frontSupportPositionsXmm,
        model.dimensions.widthMm
      ].sort((a, b) => a - b);

      for (let index = 1; index < points.length; index++) {
        expect(points[index] - points[index - 1])
          .toBeLessThanOrEqual(compiled.framing.maxStudSpacingMm + 1);
      }
    }
  });

  it("keeps provisional rear and side stud gaps within the compiled maximum", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);

      for (const [wall, spanMm] of [
        ["rear", model.dimensions.widthMm],
        ["left", model.dimensions.depthMm],
        ["right", model.dimensions.depthMm]
      ] as const) {
        const positions = compiled.linearParts
          .filter((part) => part.wall === wall && typeof part.positionMm === "number")
          .map((part) => part.positionMm as number)
          .sort((a, b) => a - b);

        const points = [0, ...positions, spanMm];
        for (let index = 1; index < points.length; index++) {
          expect(points[index] - points[index - 1])
            .toBeLessThanOrEqual(compiled.framing.maxStudSpacingMm + 1);
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
