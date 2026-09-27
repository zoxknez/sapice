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
