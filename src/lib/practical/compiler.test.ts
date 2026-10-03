import {describe, expect, it} from "vitest";
import {practicalModels, getPracticalModel} from "@/data/practical-models";
import {compilePracticalModel} from "@/lib/practical/compiler";
import {materialLibrary} from "@/data/material-library";
import {sources} from "@/data/sources";

function requireModel(slug: string) {
  const model = getPracticalModel(slug);
  if (!model) throw new Error(`Missing ${slug}`);
  return model;
}

describe("practical model compiler", () => {
  it("compiles every model without invariant violations", () => {
    for (const model of practicalModels) {
      const compiled = compilePracticalModel(model);
      expect(compiled.invariantViolations, model.slug).toEqual([]);
    }
  });

  it("declares exactly the calculation coverage the compiler can derive", () => {
    for (const model of practicalModels) {
      const compiled = compilePracticalModel(model);
      expect([...model.coverage].sort(), model.slug).toEqual([...compiled.derivedCoverage].sort());
    }
  });

  it("never claims 3D for practical models", () => {
    expect(practicalModels.every((model) => !model.coverage.includes("THREE_D"))).toBe(true);
  });

  it("references only known materials and sources", () => {
    for (const model of practicalModels) {
      const compiled = compilePracticalModel(model);
      for (const line of compiled.bom) expect(materialLibrary[line.materialId], `${model.slug}:${line.materialId}`).toBeDefined();
      for (const part of compiled.cutParts) expect(materialLibrary[part.materialId], `${model.slug}:${part.materialId}`).toBeDefined();
      for (const sourceId of model.sourceIds) expect(sources[sourceId], `${model.slug}:${sourceId}`).toBeDefined();
    }
  });

  it("is deterministic", () => {
    const model = requireModel("osb-economy-cat");
    expect(compilePracticalModel(model).planFingerprint).toBe(compilePracticalModel(structuredClone(model)).planFingerprint);
  });

  it("does not produce a thermal estimate for emergency cardboard", () => {
    const compiled = compilePracticalModel(requireModel("emergency-cardboard-dry"));
    expect(compiled.thermal.status).toBe("UNAVAILABLE");
    expect(compiled.derivedCoverage).not.toContain("THERMAL_TRANSMISSION");
  });

  it("reports tote foam linings as incomplete: plastic stays an unknown layer", () => {
    const compiled = compilePracticalModel(requireModel("tote-eps-lined"));
    expect(compiled.thermal.status).toBe("INCOMPLETE");
    const wall = compiled.thermal.assemblies.find((assembly) => assembly.kind === "wall");
    expect(wall?.uValueWm2K).toBeNull();
    expect(wall?.unknownLayers.map((layer) => layer.materialId)).toContain("plastic-tote");
    expect(wall?.knownLayerResistanceM2KW).toBeGreaterThan(0.7);
  });

  it("computes complete U-values only when every layer has a sourced λ", () => {
    const osb = compilePracticalModel(requireModel("osb-economy-cat"));
    expect(osb.thermal.status).toBe("COMPLETE");
    const scrap = compilePracticalModel(requireModel("scrap-wood-cat-box"));
    expect(scrap.thermal.status).toBe("INCOMPLETE");
  });

  it("keeps the roof falling from the entrance side to the rear for panel boxes", () => {
    for (const model of practicalModels) {
      if (model.params.family !== "PANEL_BOX") continue;
      expect(model.params.outer.frontHeightMm, model.slug).toBeGreaterThan(model.params.outer.rearHeightMm);
    }
  });

  it("never lets non-animal-facing insulation stay exposed in a panel box", () => {
    for (const model of practicalModels) {
      if (model.params.family !== "PANEL_BOX" || !model.params.insulation) continue;
      const insulation = materialLibrary[model.params.insulation.materialId];
      if (insulation.animalFacing !== "ALLOWED") expect(model.params.lining, model.slug).not.toBeNull();
    }
  });

  it("dispatches each construction family to its own geometry", () => {
    const families = new Set(practicalModels.map((model) => model.params.family));
    expect(families).toEqual(new Set(["PANEL_BOX", "TOTE_IN_TOTE", "FOAM_CONTAINER", "CRATE", "EMERGENCY_WRAP", "PALLET_FRAME", "SHADE_STRUCTURE", "RAISED_PLATFORM", "RETROFIT"]));
    expect(compilePracticalModel(requireModel("tote-with-straw")).envelope.schematic).toBe(true);
    expect(compilePracticalModel(requireModel("osb-economy-cat")).envelope.schematic).toBe(false);
    expect(compilePracticalModel(requireModel("summer-shade-cat")).envelope.openSides).toBe(true);
  });

  it("counts distinct source pallets for pallet frames", () => {
    const compiled = compilePracticalModel(requireModel("pallet-dog-basic"));
    expect(compiled.bom.find((line) => line.id === "pallets")?.quantity).toBe(4);
    expect(compiled.envelope.entrances[0].widthMm).toBe(400);
  });

  it("gives emergency models daily inspection", () => {
    const compiled = compilePracticalModel(requireModel("emergency-waterproof-wrap"));
    expect(compiled.inspection.some((item) => item.frequency === "DAILY")).toBe(true);
  });
});
