import {cutGeometryAreaMm2, type CutGeometryLike} from "@/lib/cut-geometry";

/** Anything with an id, a quantity and true cut geometry can be nested. */
export type NestablePart = CutGeometryLike & {id: string; quantity: number};

export type PackedPart = {
  partId: string;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
  sourceWidthMm: number;
  sourceHeightMm: number;
  rotated: boolean;
  shape: NestablePart["shape"];
  trapezoidRearHeightMm?: number;
  cutouts?: NestablePart["cutouts"];
  partAreaMm2: number;
};

export type PackedSheet = {
  index: number;
  widthMm: number;
  heightMm: number;
  parts: PackedPart[];
  utilization: number;
  materialUtilization: number;
  packingEnvelopeUtilization: number;
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

export function cutPartAreaMm2(part: CutGeometryLike) {
  return cutGeometryAreaMm2(part);
}

function packPayload(
  item: NestablePart & {instanceId: string},
  x: number,
  y: number,
  rotated: boolean
): PackedPart {
  return {
    partId: item.instanceId,
    x,
    y,
    widthMm: rotated ? item.heightMm : item.widthMm,
    heightMm: rotated ? item.widthMm : item.heightMm,
    sourceWidthMm: item.widthMm,
    sourceHeightMm: item.heightMm,
    rotated,
    shape: item.shape,
    trapezoidRearHeightMm: item.trapezoidRearHeightMm,
    cutouts: item.cutouts,
    partAreaMm2: cutPartAreaMm2(item)
  };
}

export function packCutParts(
  cutParts: NestablePart[],
  options: {
    sheetWidthMm?: number;
    sheetHeightMm?: number;
    kerfMm?: number;
    marginMm?: number;
  } = {}
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
      const placement = choosePlacement(
        sheet.free,
        requestedWidth,
        requestedHeight,
        true
      );
      if (!placement) continue;

      const free = sheet.free.splice(placement.freeIndex, 1)[0];
      sheet.parts.push(
        packPayload(item, free.x, free.y, placement.rotated)
      );
      sheet.free.push(
        ...splitFreeRect(free, placement.width, placement.height)
      );
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

      const free = {
        x: marginMm,
        y: marginMm,
        width: usableWidth,
        height: usableHeight
      };
      sheets.push({
        parts: [
          packPayload(
            item,
            marginMm,
            marginMm,
            placement.rotated
          )
        ],
        free: splitFreeRect(free, placement.width, placement.height)
      });
    }
  }

  return sheets.map((sheet, index) => {
    const materialAreaMm2 = sheet.parts.reduce(
      (sum, part) => sum + part.partAreaMm2,
      0
    );
    const envelopeAreaMm2 = sheet.parts.reduce(
      (sum, part) => sum + part.widthMm * part.heightMm,
      0
    );
    const stockAreaMm2 = sheetWidthMm * sheetHeightMm;

    return {
      index,
      widthMm: sheetWidthMm,
      heightMm: sheetHeightMm,
      parts: sheet.parts,
      utilization: materialAreaMm2 / stockAreaMm2,
      materialUtilization: materialAreaMm2 / stockAreaMm2,
      packingEnvelopeUtilization: envelopeAreaMm2 / stockAreaMm2
    };
  });
}

export type StockPiece = {id: string; widthMm: number; heightMm: number};

export type OffcutPlacement = {
  stockId: string;
  part: PackedPart;
};

export type OffcutFitResult = {
  placements: OffcutPlacement[];
  unplacedPartIds: string[];
  /** True only when every requested part instance found a place. */
  allPlaced: boolean;
};

/**
 * Deterministic first-fit-decreasing placement of rectangular packing envelopes onto a user's
 * offcuts (each offcut is its own small stock piece). Same placement rules as sheet nesting:
 * kerf is added to every part, rotation is allowed. Trapezoids and cutouts use their bounding
 * rectangle, so the result is conservative: it can say "does not fit" for a piece that a skilled
 * maker could still cut, but it never claims a fit that the envelope does not allow.
 */
export function fitPartsOnOffcuts(
  parts: NestablePart[],
  stock: StockPiece[],
  options: {kerfMm?: number} = {}
): OffcutFitResult {
  const kerfMm = options.kerfMm ?? 3;
  const items = parts
    .flatMap((part) =>
      Array.from({length: part.quantity}, (_, copyIndex) => ({
        ...part,
        instanceId: `${part.id}-${copyIndex + 1}`
      }))
    )
    .sort((a, b) => b.widthMm * b.heightMm - a.widthMm * a.heightMm || a.instanceId.localeCompare(b.instanceId));

  const pieces = [...stock]
    .sort((a, b) => a.widthMm * a.heightMm - b.widthMm * b.heightMm || a.id.localeCompare(b.id))
    .map((piece) => ({piece, free: [{x: 0, y: 0, width: piece.widthMm, height: piece.heightMm}] as FreeRect[]}));

  const placements: OffcutPlacement[] = [];
  const unplacedPartIds: string[] = [];

  for (const item of items) {
    let placed = false;
    // Smallest offcut first keeps large offcuts available for large parts.
    for (const entry of pieces) {
      const placement = choosePlacement(entry.free, item.widthMm + kerfMm, item.heightMm + kerfMm, true);
      if (!placement) continue;
      const free = entry.free.splice(placement.freeIndex, 1)[0];
      placements.push({stockId: entry.piece.id, part: packPayload(item, free.x, free.y, placement.rotated)});
      entry.free.push(...splitFreeRect(free, placement.width, placement.height));
      placed = true;
      break;
    }
    if (!placed) unplacedPartIds.push(item.instanceId);
  }

  return {placements, unplacedPartIds, allPlaced: unplacedPartIds.length === 0};
}

/**
 * Batch nesting: N identical units share one stock plan instead of N separate plans.
 * Part ids are prefixed with the unit number so the cutting schedule stays traceable.
 */
export function packBatch(
  parts: NestablePart[],
  units: number,
  options: Parameters<typeof packCutParts>[1] = {}
) {
  const batched = Array.from({length: units}, (_, unit) =>
    parts.map((part) => ({...part, id: `u${unit + 1}-${part.id}`}))
  ).flat();
  return packCutParts(batched, options);
}
