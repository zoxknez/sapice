import type {ShelterModel} from "@/lib/domain";
import {sources} from "@/data/sources";
import {getAssembly} from "@/data/assemblies";
import {compileShelterModel} from "@/lib/compiler";

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
      compiled.internal.rearHeightMm <= 0
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
