import type {CutPart} from "@/lib/compiler";

export type PackedPart = {
  partId: string;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
  rotated: boolean;
  shape: CutPart["shape"];
};

export type PackedSheet = {
  index: number;
  widthMm: number;
  heightMm: number;
  parts: PackedPart[];
  utilization: number;
};

type FreeRect = {x: number; y: number; width: number; height: number};

function choosePlacement(
  freeRects: FreeRect[],
  width: number,
  height: number,
  rotationAllowed: boolean
) {
  let best:
    | {freeIndex: number; width: number; height: number; rotated: boolean; score: number}
    | undefined;

  for (let i = 0; i < freeRects.length; i++) {
    const free = freeRects[i];
    for (const candidate of [
      {width, height, rotated: false},
      ...(rotationAllowed ? [{width: height, height: width, rotated: true}] : [])
    ]) {
      if (candidate.width <= free.width && candidate.height <= free.height) {
        const score = Math.min(free.width - candidate.width, free.height - candidate.height);
        if (!best || score < best.score) {
          best = {freeIndex: i, ...candidate, score};
        }
      }
    }
  }

  return best;
}

function splitFreeRect(free: FreeRect, usedWidth: number, usedHeight: number) {
  const right: FreeRect = {
    x: free.x + usedWidth,
    y: free.y,
    width: free.width - usedWidth,
    height: usedHeight
  };
  const bottom: FreeRect = {
    x: free.x,
    y: free.y + usedHeight,
    width: free.width,
    height: free.height - usedHeight
  };
  return [right, bottom].filter((rect) => rect.width > 0 && rect.height > 0);
}

export function packCutParts(
  cutParts: CutPart[],
  options: {sheetWidthMm?: number; sheetHeightMm?: number; kerfMm?: number; marginMm?: number} = {}
): PackedSheet[] {
  const sheetWidthMm = options.sheetWidthMm ?? 2500;
  const sheetHeightMm = options.sheetHeightMm ?? 1250;
  const kerfMm = options.kerfMm ?? 3;
  const marginMm = options.marginMm ?? 10;

  const items = cutParts
    .flatMap((part) =>
      Array.from({length: part.quantity}, (_, copyIndex) => ({
        ...part,
        instanceId: `${part.id}-${copyIndex + 1}`
      }))
    )
    .sort((a, b) => Math.max(b.widthMm, b.heightMm) - Math.max(a.widthMm, a.heightMm));

  const sheets: Array<{parts: PackedPart[]; free: FreeRect[]}> = [];

  for (const item of items) {
    const requestedWidth = item.widthMm + kerfMm;
    const requestedHeight = item.heightMm + kerfMm;
    let placed = false;

    for (const sheet of sheets) {
      const placement = choosePlacement(sheet.free, requestedWidth, requestedHeight, true);
      if (!placement) continue;

      const free = sheet.free.splice(placement.freeIndex, 1)[0];
      const actualWidth = placement.rotated ? item.heightMm : item.widthMm;
      const actualHeight = placement.rotated ? item.widthMm : item.heightMm;

      sheet.parts.push({
        partId: item.instanceId,
        x: free.x,
        y: free.y,
        widthMm: actualWidth,
        heightMm: actualHeight,
        rotated: placement.rotated,
        shape: item.shape
      });
      sheet.free.push(...splitFreeRect(free, placement.width, placement.height));
      placed = true;
      break;
    }

    if (!placed) {
      const usableWidth = sheetWidthMm - marginMm * 2;
      const usableHeight = sheetHeightMm - marginMm * 2;
      const placement = choosePlacement(
        [{x: marginMm, y: marginMm, width: usableWidth, height: usableHeight}],
        requestedWidth,
        requestedHeight,
        true
      );

      if (!placement) {
        throw new Error(
          `Part ${item.instanceId} (${item.widthMm}×${item.heightMm} mm) does not fit ${sheetWidthMm}×${sheetHeightMm} mm stock.`
        );
      }

      const free = {x: marginMm, y: marginMm, width: usableWidth, height: usableHeight};
      const actualWidth = placement.rotated ? item.heightMm : item.widthMm;
      const actualHeight = placement.rotated ? item.widthMm : item.heightMm;
      sheets.push({
        parts: [{
          partId: item.instanceId,
          x: marginMm,
          y: marginMm,
          widthMm: actualWidth,
          heightMm: actualHeight,
          rotated: placement.rotated,
          shape: item.shape
        }],
        free: splitFreeRect(free, placement.width, placement.height)
      });
    }
  }

  return sheets.map((sheet, index) => {
    const usedArea = sheet.parts.reduce((sum, part) => sum + part.widthMm * part.heightMm, 0);
    return {
      index,
      widthMm: sheetWidthMm,
      heightMm: sheetHeightMm,
      parts: sheet.parts,
      utilization: usedArea / (sheetWidthMm * sheetHeightMm)
    };
  });
}
