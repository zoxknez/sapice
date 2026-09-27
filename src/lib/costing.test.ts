import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {compileShelterModel} from "@/lib/compiler";
import {costLinesForModel} from "@/lib/costing";

describe("costing compiler integration", () => {
  it("keeps positive deterministic quantities for every reference model", () => {
    for (const model of shelterModels) {
      const lines = costLinesForModel(model);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(Number.isFinite(line.quantity)).toBe(true);
        expect(line.quantity).toBeGreaterThan(0);
      }
    }
  });

  it("creates one adjustable vent insert per compiled ventilation provision zone", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      const line = costLinesForModel(model).find(
        (item) => item.id === "ventilation-inserts"
      );
      expect(line?.quantity).toBe(compiled.ventilation.zones.length);
    }
  });

  it("includes compiled framing and hardware cost lines", () => {
    for (const model of shelterModels) {
      const compiled = compileShelterModel(model);
      const lines = costLinesForModel(model);

      expect(lines.find((item) => item.id === "timber-frame")?.quantity)
        .toBeCloseTo(compiled.framing.totalLinearM * 1.1, 8);

      for (const hardware of compiled.hardwareItems) {
        expect(
          lines.find((item) => item.id === `hardware-${hardware.id}`)?.quantity
        ).toBe(hardware.quantity);
      }
    }
  });

  it("only adds a heating product line to heated models", () => {
    for (const model of shelterModels) {
      const hasHeatingLine = costLinesForModel(model)
        .some((item) => item.id === "heating-product");
      expect(hasHeatingLine).toBe(model.heated);
    }
  });
});
