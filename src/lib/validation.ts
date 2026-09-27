import type {ShelterModel} from "@/lib/domain";
import {sources} from "@/data/sources";
import {getAssembly} from "@/data/assemblies";
import {compileShelterModel} from "@/lib/compiler";
import {packCutParts} from "@/lib/nesting";
import {compiledSourceIds} from "@/lib/provenance";

export type ModelValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export function validateShelterModel(model: ShelterModel): ModelValidationIssue[] {
  const issues: ModelValidationIssue[] = [];

  for (const sourceId of model.sourceIds) {
    if (!sources[sourceId]) {
      issues.push({
        severity: "error",
        code: "MISSING_SOURCE",
        message: `Unknown source ID: ${sourceId}`
      });
    }
  }

  for (const [kind, assemblyId] of Object.entries({
    wall: model.construction.wallAssemblyId,
    floor: model.construction.floorAssemblyId,
    roof: model.construction.roofAssemblyId
  })) {
    try {
      const assembly = getAssembly(assemblyId);
      if (assembly.kind !== kind) {
        issues.push({
          severity: "error",
          code: "ASSEMBLY_KIND_MISMATCH",
          message: `${kind} references a ${assembly.kind} assembly: ${assemblyId}`
        });
      }
    } catch {
      issues.push({
        severity: "error",
        code: "MISSING_ASSEMBLY",
        message: `Unknown ${kind} assembly: ${assemblyId}`
      });
    }
  }

  let compiled: ReturnType<typeof compileShelterModel> | null = null;
  try {
    compiled = compileShelterModel(model);
  } catch (error) {
    issues.push({
      severity: "error",
      code: "COMPILE_FAILED",
      message: error instanceof Error ? error.message : "Model compilation failed"
    });
  }

  if (compiled) {
    const frontEnvelopeRebuildMm =
      compiled.construction.floorThicknessMm +
      compiled.interfaces.wallFrontHeightMm +
      compiled.interfaces.roofVerticalThicknessMm;
    const rearEnvelopeRebuildMm =
      compiled.construction.floorThicknessMm +
      compiled.interfaces.wallRearHeightMm +
      compiled.interfaces.roofVerticalThicknessMm;

    if (
      Math.abs(frontEnvelopeRebuildMm - model.dimensions.frontHeightMm) > 0.001 ||
      Math.abs(rearEnvelopeRebuildMm - model.dimensions.rearHeightMm) > 0.001
    ) {
      issues.push({
        severity: "error",
        code: "ENVELOPE_INTERFACE_MISMATCH",
        message: "Floor + wall + roof interface geometry does not rebuild the declared overall height."
      });
    }

    if (
      compiled.internal.widthMm <= 0 ||
      compiled.internal.depthMm <= 0 ||
      compiled.internal.frontHeightMm <= 0 ||
      compiled.internal.rearHeightMm <= 0 ||
      compiled.internal.chamberClearWidthMm <= 0 ||
      compiled.internal.usableFloorAreaM2 <= 0 ||
      compiled.internal.usableVolumeM3 <= 0 ||
      !Number.isFinite(compiled.internal.floorAreaPerRecommendedAnimalM2) ||
      !Number.isFinite(compiled.internal.floorAreaPerMaxAnimalM2)
    ) {
      issues.push({
        severity: "error",
        code: "INVALID_INTERNAL_ENVELOPE",
        message: "Construction leaves a zero or negative internal dimension."
      });
    }

    if (
      !Number.isFinite(compiled.thermal.wallU) ||
      !Number.isFinite(compiled.thermal.floorU) ||
      !Number.isFinite(compiled.thermal.roofU) ||
      compiled.thermal.envelopeTransmissionW <= 0
    ) {
      issues.push({
        severity: "error",
        code: "INVALID_THERMAL_RESULT",
        message: "Thermal calculation returned an invalid value."
      });
    }

    for (const part of compiled.cutParts) {
      if (
        part.widthMm <= 0 ||
        part.heightMm <= 0 ||
        part.thicknessMm <= 0 ||
        !Number.isFinite(part.widthMm) ||
        !Number.isFinite(part.heightMm)
      ) {
        issues.push({
          severity: "error",
          code: "INVALID_CUT_PART",
          message: `Invalid cut part geometry: ${part.id}`
        });
      }

      for (const cutout of part.cutouts ?? []) {
        if (
          cutout.xMm < 0 ||
          cutout.yMm < 0 ||
          cutout.widthMm <= 0 ||
          cutout.heightMm <= 0 ||
          cutout.xMm + cutout.widthMm > part.widthMm ||
          cutout.yMm + cutout.heightMm > part.heightMm
        ) {
          issues.push({
            severity: "error",
            code: "CUTOUT_OUT_OF_BOUNDS",
            message: `Cutout on ${part.id} exceeds its host panel geometry.`
          });
        }
      }
    }

    if (
      compiled.ventilation.zones.length !==
      model.layout.chambers * model.ventilation.zonesPerChamber
    ) {
      issues.push({
        severity: "error",
        code: "VENTILATION_ZONE_COUNT_MISMATCH",
        message: "Compiled ventilation provision zones do not match chamber count."
      });
    }

    const rearStudPositionsMm = compiled.linearParts
      .filter((part) => part.wall === "rear" && typeof part.positionMm === "number")
      .map((part) => part.positionMm as number);

    for (const zone of compiled.ventilation.zones) {
      const chamberIndex = zone.chamber - 1;
      const chamberLeftMm = compiled.layout.chamberStartsXmm[chamberIndex];
      const chamberRightMm = chamberLeftMm + compiled.layout.chamberWidthMm;
      const zoneLeftMm = zone.centerXmm - zone.widthMm / 2;
      const zoneRightMm = zone.centerXmm + zone.widthMm / 2;
      const zoneTopMm = zone.bottomMm + zone.heightMm;

      if (
        zoneLeftMm < chamberLeftMm ||
        zoneRightMm > chamberRightMm ||
        zone.bottomMm < 0 ||
        zoneTopMm > compiled.interfaces.wallRearHeightMm
      ) {
        issues.push({
          severity: "error",
          code: "VENTILATION_ZONE_OUT_OF_BOUNDS",
          message: `Ventilation provision zone ${zone.id} falls outside its rear-wall chamber geometry.`
        });
      }

      for (const studXmm of rearStudPositionsMm) {
        const requiredClearanceMm =
          zone.widthMm / 2 + compiled.framing.frameProfileMm[0] / 2;
        if (Math.abs(studXmm - zone.centerXmm) < requiredClearanceMm) {
          issues.push({
            severity: "error",
            code: "VENTILATION_ZONE_STUD_CONFLICT",
            message: `Ventilation provision zone ${zone.id} conflicts with a rear-wall stud.`
          });
        }
      }
    }

    if (
      compiled.layout.entranceCentersXmm.length !== model.layout.entrances ||
      compiled.layout.dividerPositionsXmm.length !== Math.max(0, model.layout.chambers - 1)
    ) {
      issues.push({
        severity: "error",
        code: "INVALID_LAYOUT_CARDINALITY",
        message: "Compiled entrance/divider counts do not match the canonical layout."
      });
    }

    const frameClearanceMm = compiled.framing.frameProfileMm[0];

    if (model.layout.entrances === model.layout.chambers) {
      compiled.layout.entranceCentersXmm.forEach((centerMm, index) => {
        const chamberLeftMm = compiled.layout.chamberStartsXmm[index];
        const chamberRightMm = chamberLeftMm + compiled.layout.chamberWidthMm;
        const openingLeftMm = centerMm - model.layout.entranceWidthMm / 2;
        const openingRightMm = centerMm + model.layout.entranceWidthMm / 2;

        if (
          openingLeftMm < chamberLeftMm + frameClearanceMm ||
          openingRightMm > chamberRightMm - frameClearanceMm
        ) {
          issues.push({
            severity: "error",
            code: "ENTRANCE_DOES_NOT_FIT_CHAMBER",
            message: `Entrance ${index + 1} does not fit its chamber with the V1 frame clearance.`
          });
        }
      });
    }

    for (const dividerMm of compiled.layout.dividerPositionsXmm) {
      for (const cutout of compiled.cutParts.find((part) => part.id === "front-outer")?.cutouts ?? []) {
        const openingLeftMm = cutout.xMm;
        const openingRightMm = cutout.xMm + cutout.widthMm;
        if (
          dividerMm > openingLeftMm - frameClearanceMm &&
          dividerMm < openingRightMm + frameClearanceMm
        ) {
          issues.push({
            severity: "error",
            code: "DIVIDER_CONFLICTS_WITH_ENTRANCE",
            message: `Divider at ${dividerMm} mm conflicts with an entrance opening or its framing clearance.`
          });
        }
      }
    }

    for (let index = 0; index < model.layout.entrances; index++) {
      const number = index + 1;
      const left = compiled.linearParts.find(
        (part) => part.id === `entrance-${number}-left-support`
      );
      const right = compiled.linearParts.find(
        (part) => part.id === `entrance-${number}-right-support`
      );
      const header = compiled.linearParts.find(
        (part) => part.id === `entrance-${number}-header`
      );
      const cripple = compiled.linearParts.find(
        (part) => part.id === `entrance-${number}-cripple`
      );

      if (!left || !right || !header || !cripple) {
        issues.push({
          severity: "error",
          code: "INCOMPLETE_ENTRANCE_FRAMING",
          message: `Entrance ${number} is missing a jack stud, header or cripple member.`
        });
        continue;
      }

      const frameFaceMm = compiled.framing.frameProfileMm[0];
      const openingTopMm =
        compiled.internal.entranceSillAboveFinishedFloorMm +
        model.layout.entranceHeightMm;
      const headerBottomMm =
        (header.elevationMm ?? Number.NaN) - frameFaceMm / 2;
      const headerTopMm =
        (header.elevationMm ?? Number.NaN) + frameFaceMm / 2;
      const crippleStartMm = cripple.startHeightMm ?? Number.NaN;
      const crippleEndMm = crippleStartMm + cripple.lengthMm;
      const topRailBottomMm =
        compiled.interfaces.wallFrontHeightMm - frameFaceMm;

      if (Math.abs(headerBottomMm - openingTopMm) > 0.001) {
        issues.push({
          severity: "error",
          code: "HEADER_INTRUDES_ENTRANCE",
          message: `Entrance ${number} header does not begin immediately above the opening.`
        });
      }

      if (Math.abs(crippleStartMm - headerTopMm) > 0.001) {
        issues.push({
          severity: "error",
          code: "CRIPPLE_HEADER_GAP",
          message: `Entrance ${number} cripple stud does not start at the header top.`
        });
      }

      if (Math.abs(crippleEndMm - topRailBottomMm) > 1.001) {
        issues.push({
          severity: "error",
          code: "CRIPPLE_TOP_RAIL_GAP",
          message: `Entrance ${number} cripple stud does not terminate at the top-rail underside.`
        });
      }
    }

    const baseRunners = compiled.linearParts.filter(
      (part) =>
        part.wall === "base" &&
        part.id.startsWith("base-runner-") &&
        typeof part.positionMm === "number"
    );
    const basePosts = compiled.linearParts.filter(
      (part) =>
        part.wall === "base" &&
        part.id.startsWith("base-post-") &&
        typeof part.positionXmm === "number" &&
        typeof part.positionZmm === "number"
    );
    const floorJoists = compiled.linearParts.filter(
      (part) =>
        part.wall === "floor" &&
        part.id.startsWith("floor-joist-") &&
        typeof part.positionMm === "number"
    );
    const roofRafters = compiled.linearParts.filter(
      (part) =>
        part.wall === "roof" &&
        part.id.startsWith("roof-rafter-") &&
        typeof part.positionMm === "number"
    );

    if (
      Math.abs(
        compiled.framing.baseSupportPostHeightMm +
          compiled.framing.baseProfileMm[1] -
          model.dimensions.groundClearanceMm
      ) > 0.001
    ) {
      issues.push({
        severity: "error",
        code: "BASE_CLEARANCE_MISMATCH",
        message: "Base post height plus runner height does not rebuild the declared ground clearance."
      });
    }

    if (
      baseRunners.length !== compiled.framing.baseRunnerPositionsXmm.length ||
      floorJoists.length !== compiled.framing.floorJoistPositionsZmm.length ||
      roofRafters.length !== compiled.framing.roofRafterPositionsXmm.length
    ) {
      issues.push({
        severity: "error",
        code: "SUPPORT_SCHEDULE_COUNT_MISMATCH",
        message: "Compiled base/floor/roof member counts do not match their framing position arrays."
      });
    }

    const expectedBasePosts =
      compiled.framing.baseRunnerPositionsXmm.length *
      compiled.framing.baseSupportPositionsZmm.length;

    if (basePosts.length !== expectedBasePosts) {
      issues.push({
        severity: "error",
        code: "BASE_POST_GRID_COUNT_MISMATCH",
        message: `Base support grid has ${basePosts.length} posts; expected ${expectedBasePosts}.`
      });
    }

    for (const post of basePosts) {
      if (Math.abs(post.lengthMm - compiled.framing.baseSupportPostHeightMm) > 0.001) {
        issues.push({
          severity: "error",
          code: "BASE_POST_HEIGHT_MISMATCH",
          message: `${post.id} does not match the compiled base support post height.`
        });
      }

      if (
        !compiled.framing.baseRunnerPositionsXmm.includes(post.positionXmm as number) ||
        !compiled.framing.baseSupportPositionsZmm.includes(post.positionZmm as number)
      ) {
        issues.push({
          severity: "error",
          code: "BASE_POST_GRID_POSITION_MISMATCH",
          message: `${post.id} is not positioned on the compiled runner/support grid.`
        });
      }
    }

    const validateSupportGaps = (
      positionsMm: number[],
      spanMm: number,
      maximumMm: number,
      code: string,
      label: string
    ) => {
      const points = [0, ...positionsMm].sort((a, b) => a - b);
      if (points[points.length - 1] !== spanMm) points.push(spanMm);

      for (let index = 1; index < points.length; index++) {
        const gap = points[index] - points[index - 1];
        if (gap > maximumMm + 1) {
          issues.push({
            severity: "error",
            code,
            message: `${label} gap ${gap} mm exceeds V1 maximum ${maximumMm} mm.`
          });
        }
      }
    };

    validateSupportGaps(
      compiled.framing.baseRunnerPositionsXmm,
      model.dimensions.widthMm,
      compiled.framing.maxBaseRunnerSpacingMm,
      "BASE_RUNNER_SPACING_EXCEEDED",
      "Base runner"
    );
    validateSupportGaps(
      compiled.framing.baseSupportPositionsZmm,
      model.dimensions.depthMm,
      compiled.framing.maxBasePostSpacingMm,
      "BASE_POST_SPACING_EXCEEDED",
      "Base support row"
    );
    validateSupportGaps(
      compiled.framing.floorJoistPositionsZmm,
      model.dimensions.depthMm,
      compiled.framing.maxFloorJoistSpacingMm,
      "FLOOR_JOIST_SPACING_EXCEEDED",
      "Floor joist"
    );
    validateSupportGaps(
      compiled.framing.roofRafterPositionsXmm,
      model.dimensions.widthMm,
      compiled.framing.maxRoofRafterSpacingMm,
      "ROOF_RAFTER_SPACING_EXCEEDED",
      "Roof rafter"
    );

    const frontPoints = [
      0,
      ...compiled.framing.frontSupportPositionsXmm,
      model.dimensions.widthMm
    ].sort((a, b) => a - b);

    for (let index = 1; index < frontPoints.length; index++) {
      const gap = frontPoints[index] - frontPoints[index - 1];
      if (gap > compiled.framing.maxStudSpacingMm + 1) {
        issues.push({
          severity: "error",
          code: "FRONT_STUD_SPACING_EXCEEDED",
          message: `Front wall support gap ${gap} mm exceeds V1 maximum ${compiled.framing.maxStudSpacingMm} mm.`
        });
      }
    }

    const checkStudSpacing = (
      wallName: "rear" | "left" | "right",
      spanMm: number
    ) => {
      const positions = compiled.linearParts
        .filter((part) => part.wall === wallName && typeof part.positionMm === "number")
        .map((part) => part.positionMm as number)
        .sort((a, b) => a - b);

      const points = [0, ...positions, spanMm];
      for (let index = 1; index < points.length; index++) {
        const gap = points[index] - points[index - 1];
        if (gap > compiled.framing.maxStudSpacingMm + 1) {
          issues.push({
            severity: "error",
            code: "STUD_SPACING_EXCEEDED",
            message: `${wallName} wall stud gap ${gap} mm exceeds V1 maximum ${compiled.framing.maxStudSpacingMm} mm.`
          });
        }
      }
    };

    checkStudSpacing("rear", model.dimensions.widthMm);
    checkStudSpacing("left", model.dimensions.depthMm);
    checkStudSpacing("right", model.dimensions.depthMm);

    for (const part of compiled.linearParts) {
      if (
        part.quantity <= 0 ||
        part.lengthMm <= 0 ||
        part.profileMm[0] <= 0 ||
        part.profileMm[1] <= 0 ||
        !Number.isFinite(part.lengthMm)
      ) {
        issues.push({
          severity: "error",
          code: "INVALID_LINEAR_PART",
          message: `Invalid framing/support geometry: ${part.id}`
        });
      }
    }

    if (!Number.isFinite(compiled.framing.totalLinearM) || compiled.framing.totalLinearM <= 0) {
      issues.push({
        severity: "error",
        code: "INVALID_FRAMING_TOTAL",
        message: "Compiled framing linear total is invalid."
      });
    }

    for (const sourceId of compiledSourceIds(compiled)) {
      if (!sources[sourceId]) {
        issues.push({
          severity: "error",
          code: "MISSING_COMPILED_SOURCE",
          message: `Compiled plan references unknown source ID: ${sourceId}`
        });
      }
    }

    if (!sources[compiled.hardware.fastenerReferenceSourceId]) {
      issues.push({
        severity: "error",
        code: "MISSING_HARDWARE_SOURCE",
        message: `Unknown hardware reference source: ${compiled.hardware.fastenerReferenceSourceId}`
      });
    }

    if (
      compiled.hardware.edgeSpacingMm <= 0 ||
      compiled.hardware.fieldSpacingMm <= 0 ||
      compiled.hardware.edgeOffsetMm < 0 ||
      compiled.hardware.panelJointGapMm < 0
    ) {
      issues.push({
        severity: "error",
        code: "INVALID_HARDWARE_GEOMETRY",
        message: "Hardware spacing or joint-gap values are invalid."
      });
    }

    if (
      model.maintenance.roofAccess === "HINGED" &&
      model.maintenance.hingeEdge === null
    ) {
      issues.push({
        severity: "error",
        code: "HINGE_EDGE_REQUIRED",
        message: "Hinged roof access requires an explicit hinge edge."
      });
    }

    if (
      model.maintenance.roofAccess === "REMOVABLE" &&
      model.maintenance.hingeEdge !== null
    ) {
      issues.push({
        severity: "error",
        code: "REMOVABLE_ROOF_HAS_HINGE_EDGE",
        message: "Removable roof access must not declare a hinge edge."
      });
    }

    const baseIsolationItem = compiled.hardwareItems.find(
      (item) => item.id === "base-isolation-pads"
    );
    const compiledBasePostCount = compiled.linearParts.filter(
      (part) => part.id.startsWith("base-post-")
    ).length;

    if ((baseIsolationItem?.quantity ?? 0) !== compiledBasePostCount) {
      issues.push({
        severity: "error",
        code: "BASE_ISOLATION_PAD_COUNT_MISMATCH",
        message: "Base isolation pad quantity does not match the compiled support-post grid."
      });
    }

    const hingeItem = compiled.hardwareItems.find((item) => item.id === "roof-hinges");
    const latchItem = compiled.hardwareItems.find((item) => item.id === "roof-latches");

    if (
      (hingeItem?.quantity ?? 0) !== compiled.hardware.hingePositionsAcrossRoofMm.length ||
      (latchItem?.quantity ?? 0) !== compiled.hardware.latchPositionsAcrossRoofMm.length
    ) {
      issues.push({
        severity: "error",
        code: "HARDWARE_POSITION_COUNT_MISMATCH",
        message: "Hardware item quantities do not match compiled hinge/latch positions."
      });
    }

    for (const positionMm of [
      ...compiled.hardware.hingePositionsAcrossRoofMm,
      ...compiled.hardware.latchPositionsAcrossRoofMm
    ]) {
      if (
        !Number.isFinite(positionMm) ||
        positionMm <= 0 ||
        positionMm >= compiled.roofPanel.panelWidthMm
      ) {
        issues.push({
          severity: "error",
          code: "HARDWARE_POSITION_OUT_OF_BOUNDS",
          message: `Roof hardware center ${positionMm} mm is outside the roof panel.`
        });
      }
    }

    for (const item of compiled.hardwareItems) {
      if (
        item.quantity <= 0 ||
        !Number.isFinite(item.quantity)
      ) {
        issues.push({
          severity: "error",
          code: "INVALID_HARDWARE_ITEM",
          message: `Invalid hardware quantity: ${item.id}`
        });
      }
    }

    const frontOuter = compiled.cutParts.find((part) => part.id === "front-outer");
    const rearOuter = compiled.cutParts.find((part) => part.id === "rear-outer");
    const sideOuter = compiled.cutParts.find((part) => part.id === "side-outer");
    const floorXps = compiled.cutParts.filter((part) => part.id.startsWith("xps-floor-"));
    const roofXps = compiled.cutParts.filter((part) => part.id.startsWith("xps-roof-"));

    if (
      frontOuter?.heightMm !== Math.round(compiled.interfaces.wallFrontHeightMm) ||
      rearOuter?.heightMm !== Math.round(compiled.interfaces.wallRearHeightMm) ||
      sideOuter?.heightMm !== Math.round(compiled.interfaces.wallFrontHeightMm) ||
      sideOuter?.trapezoidRearHeightMm !== Math.round(compiled.interfaces.wallRearHeightMm)
    ) {
      issues.push({
        severity: "error",
        code: "WALL_CUT_INTERFACE_MISMATCH",
        message: "Exterior wall cut parts do not match the compiled wall interface heights."
      });
    }

    const floorXpsAreaMm2 = floorXps.reduce(
      (sum, part) => sum + part.widthMm * part.heightMm * part.quantity,
      0
    );
    const roofXpsAreaMm2 = roofXps.reduce(
      (sum, part) => sum + part.widthMm * part.heightMm * part.quantity,
      0
    );

    if (
      floorXpsAreaMm2 < model.dimensions.widthMm * model.dimensions.depthMm ||
      roofXpsAreaMm2 < model.dimensions.widthMm * compiled.roof.trueLengthMm
    ) {
      issues.push({
        severity: "error",
        code: "INSULATION_COVERAGE_GAP",
        message: "Floor or roof insulation cut parts do not cover the protected thermal footprint."
      });
    }

    const stockChecks = [
      {
        material: "plywood-12" as const,
        widthMm: 2500,
        heightMm: 1250,
        kerfMm: 3,
        marginMm: 10
      },
      {
        material: "plywood-9" as const,
        widthMm: 2500,
        heightMm: 1250,
        kerfMm: 3,
        marginMm: 10
      },
      {
        material: "xps" as const,
        widthMm: 1250,
        heightMm: 600,
        kerfMm: 2,
        marginMm: 5
      }
    ];

    for (const stock of stockChecks) {
      try {
        packCutParts(
          compiled.cutParts.filter((part) => part.material === stock.material),
          {
            sheetWidthMm: stock.widthMm,
            sheetHeightMm: stock.heightMm,
            kerfMm: stock.kerfMm,
            marginMm: stock.marginMm
          }
        );
      } catch (error) {
        issues.push({
          severity: "error",
          code: "STOCK_FIT_FAILED",
          message: error instanceof Error ? error.message : `Stock fit failed for ${stock.material}`
        });
      }
    }
  }

  if (
    compiled &&
    compiled.internal.entranceSillAboveFinishedFloorMm < 0
  ) {
    issues.push({
      severity: "error",
      code: "ENTRANCE_BELOW_FINISHED_FLOOR",
      message: "External entrance threshold is lower than the finished floor assembly."
    });
  }

  if (
    compiled &&
    compiled.internal.entranceSillAboveFinishedFloorMm <
      compiled.framing.frameProfileMm[0]
  ) {
    issues.push({
      severity: "error",
      code: "ENTRANCE_INTERSECTS_BOTTOM_RAIL",
      message: `Entrance sill ${compiled.internal.entranceSillAboveFinishedFloorMm} mm is below the V1 bottom framing rail depth ${compiled.framing.frameProfileMm[0]} mm.`
    });
  }

  if (model.layout.entranceWidthMm >= model.dimensions.widthMm) {
    issues.push({
      severity: "error",
      code: "ENTRANCE_TOO_WIDE",
      message: "Entrance width must be smaller than the host wall."
    });
  }

  if (
    model.layout.thresholdHeightMm +
    model.layout.entranceHeightMm >=
    model.dimensions.frontHeightMm
  ) {
    issues.push({
      severity: "error",
      code: "ENTRANCE_TOO_TALL",
      message: "Entrance plus threshold must fit inside the front wall."
    });
  }

  if (model.animal === "cat" && model.animalSizeClass !== "standard") {
    issues.push({
      severity: "error",
      code: "INVALID_CAT_SIZE_CLASS",
      message: "Cat models must use the standard size class."
    });
  }

  if (
    model.animal === "dog" &&
    !["small", "medium", "large"].includes(model.animalSizeClass)
  ) {
    issues.push({
      severity: "error",
      code: "INVALID_DOG_SIZE_CLASS",
      message: "Dog models must use small, medium or large size class."
    });
  }

  if (model.capacity.recommended > model.capacity.max) {
    issues.push({
      severity: "error",
      code: "INVALID_CAPACITY",
      message: "Recommended capacity cannot exceed maximum capacity."
    });
  }

  if (model.heated && !model.sourceIds.includes("iec-60335-2-71-2018")) {
    issues.push({
      severity: "error",
      code: "HEATING_SAFETY_SOURCE_REQUIRED",
      message: "Heated models must include the animal-heating electrical safety reference."
    });
  }

  if (model.validationState === "PROTOTYPE_BUILT" || model.validationState === "FIELD_TESTED") {
    issues.push({
      severity: "warning",
      code: "PHYSICAL_EVIDENCE_REQUIRED",
      message: "Physical validation status requires linked prototype/test evidence before publication."
    });
  }

  return issues;
}

export function assertShelterModelValid(model: ShelterModel) {
  const errors = validateShelterModel(model).filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    throw new Error(
      `${model.id} failed validation:\n${errors.map((issue) => `- [${issue.code}] ${issue.message}`).join("\n")}`
    );
  }
}
