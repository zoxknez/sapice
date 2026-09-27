import {describe, expect, it} from "vitest";
import {cutPartAreaMm2, packCutParts} from "@/lib/nesting";
import type {CutPart} from "@/lib/compiler";

const parts: CutPart[] = [
  {
    id: "a",
    nameSr: "A",
    nameEn: "A",
    material: "plywood-12",
    quantity: 2,
    widthMm: 1000,
    heightMm: 500,
    thicknessMm: 12,
    shape: "rectangle"
  },
  {
    id: "b",
    nameSr: "B",
    nameEn: "B",
    material: "plywood-12",
    quantity: 1,
    widthMm: 700,
    heightMm: 500,
    thicknessMm: 12,
    shape: "rectangle"
  }
];

function overlaps(
  a: {x: number; y: number; widthMm: number; heightMm: number},
  b: {x: number; y: number; widthMm: number; heightMm: number}
) {
  return !(
    a.x + a.widthMm <= b.x ||
    b.x + b.widthMm <= a.x ||
    a.y + a.heightMm <= b.y ||
    b.y + b.heightMm <= a.y
  );
}

describe("sheet nesting", () => {
  it("keeps every packed part inside sheet margins", () => {
    const marginMm = 10;
    const sheets = packCutParts(parts, {
      sheetWidthMm: 2500,
      sheetHeightMm: 1250,
      marginMm
    });
    const totalParts = sheets.flatMap((sheet) => sheet.parts);
    expect(totalParts).toHaveLength(3);

    for (const sheet of sheets) {
      for (const part of sheet.parts) {
        expect(part.x).toBeGreaterThanOrEqual(marginMm);
        expect(part.y).toBeGreaterThanOrEqual(marginMm);
        expect(part.x + part.widthMm).toBeLessThanOrEqual(sheet.widthMm - marginMm);
        expect(part.y + part.heightMm).toBeLessThanOrEqual(sheet.heightMm - marginMm);
      }
    }
  });

  it("never overlaps packed bounding boxes", () => {
    const sheets = packCutParts(parts);
    for (const sheet of sheets) {
      for (let i = 0; i < sheet.parts.length; i++) {
        for (let j = i + 1; j < sheet.parts.length; j++) {
          expect(overlaps(sheet.parts[i], sheet.parts[j])).toBe(false);
        }
      }
    }
  });

  it("keeps utilization between zero and one", () => {
    for (const sheet of packCutParts(parts)) {
      expect(sheet.utilization).toBeGreaterThan(0);
      expect(sheet.utilization).toBeLessThanOrEqual(1);
    }
  });

  it("uses true trapezoid area instead of its bounding rectangle", () => {
    const trapezoid: CutPart = {
      id: "trap",
      nameSr: "Trap",
      nameEn: "Trap",
      material: "plywood-12",
      quantity: 1,
      widthMm: 1000,
      heightMm: 800,
      trapezoidRearHeightMm: 600,
      thicknessMm: 12,
      shape: "trapezoid"
    };

    expect(cutPartAreaMm2(trapezoid)).toBe(700_000);
    expect(cutPartAreaMm2(trapezoid)).toBeLessThan(
      trapezoid.widthMm * trapezoid.heightMm
    );
  });

  it("subtracts rounded entrance cutouts from material utilization", () => {
    const plain: CutPart = {
      id: "plain",
      nameSr: "Plain",
      nameEn: "Plain",
      material: "plywood-12",
      quantity: 1,
      widthMm: 1000,
      heightMm: 800,
      thicknessMm: 12,
      shape: "rectangle"
    };
    const opened: CutPart = {
      ...plain,
      id: "opened",
      cutouts: [{
        type: "roundedRectangle",
        xMm: 100,
        yMm: 80,
        widthMm: 200,
        heightMm: 300,
        radiusMm: 30
      }]
    };

    expect(cutPartAreaMm2(opened)).toBeLessThan(cutPartAreaMm2(plain));
  });

  it("preserves true part area when the packing engine rotates a part", () => {
    const rotatedCandidate: CutPart = {
      id: "rotate-me",
      nameSr: "Rotate",
      nameEn: "Rotate",
      material: "plywood-12",
      quantity: 1,
      widthMm: 1200,
      heightMm: 400,
      thicknessMm: 12,
      shape: "rectangle"
    };

    const sheet = packCutParts([rotatedCandidate], {
      sheetWidthMm: 500,
      sheetHeightMm: 1300,
      marginMm: 10,
      kerfMm: 3
    })[0];

    expect(sheet.parts[0].rotated).toBe(true);
    expect(sheet.parts[0].partAreaMm2).toBe(
      rotatedCandidate.widthMm * rotatedCandidate.heightMm
    );
  });

  it("throws when a part cannot fit stock in either orientation", () => {
    const impossible = [{...parts[0], quantity: 1, widthMm: 2600, heightMm: 1300}];
    expect(() => packCutParts(impossible)).toThrow();
  });
});
