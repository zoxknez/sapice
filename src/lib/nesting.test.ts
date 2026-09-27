import {describe, expect, it} from "vitest";
import {packCutParts} from "@/lib/nesting";
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

describe("sheet nesting", () => {
  it("keeps every packed part inside the sheet", () => {
    const sheets = packCutParts(parts, {sheetWidthMm: 2500, sheetHeightMm: 1250});
    const totalParts = sheets.flatMap((sheet) => sheet.parts);
    expect(totalParts).toHaveLength(3);

    for (const sheet of sheets) {
      for (const part of sheet.parts) {
        expect(part.x).toBeGreaterThanOrEqual(0);
        expect(part.y).toBeGreaterThanOrEqual(0);
        expect(part.x + part.widthMm).toBeLessThanOrEqual(sheet.widthMm);
        expect(part.y + part.heightMm).toBeLessThanOrEqual(sheet.heightMm);
      }
    }
  });

  it("throws when a part cannot fit stock in either orientation", () => {
    const impossible = [{...parts[0], quantity: 1, widthMm: 2600, heightMm: 1300}];
    expect(() => packCutParts(impossible)).toThrow();
  });
});
