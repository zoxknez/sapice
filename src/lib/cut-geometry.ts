export type CutoutGeometry = {
  type: "roundedRectangle";
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  radiusMm: number;
};

export type CutGeometryLike = {
  widthMm: number;
  heightMm: number;
  shape: "rectangle" | "trapezoid";
  trapezoidRearHeightMm?: number;
  cutouts?: CutoutGeometry[];
};

function boundedRadius(cutout: CutoutGeometry) {
  return Math.min(
    cutout.radiusMm,
    cutout.widthMm / 2,
    cutout.heightMm / 2
  );
}

export function roundedRectangleAreaMm2(cutout: CutoutGeometry) {
  const radius = boundedRadius(cutout);
  return (
    cutout.widthMm * cutout.heightMm -
    (4 - Math.PI) * radius * radius
  );
}

export function roundedRectanglePerimeterMm(cutout: CutoutGeometry) {
  const radius = boundedRadius(cutout);
  return (
    2 * (cutout.widthMm + cutout.heightMm) -
    8 * radius +
    2 * Math.PI * radius
  );
}

export function cutGeometryGrossAreaMm2(part: CutGeometryLike) {
  return (
    part.shape === "trapezoid" &&
    part.trapezoidRearHeightMm !== undefined
      ? part.widthMm * ((part.heightMm + part.trapezoidRearHeightMm) / 2)
      : part.widthMm * part.heightMm
  );
}

export function cutGeometryAreaMm2(part: CutGeometryLike) {
  const cutoutArea = (part.cutouts ?? []).reduce(
    (sum, cutout) => sum + roundedRectangleAreaMm2(cutout),
    0
  );
  return Math.max(0, cutGeometryGrossAreaMm2(part) - cutoutArea);
}

export function cutGeometryOuterPerimeterMm(part: CutGeometryLike) {
  if (
    part.shape === "trapezoid" &&
    part.trapezoidRearHeightMm !== undefined
  ) {
    const slopeEdgeMm = Math.hypot(
      part.widthMm,
      part.heightMm - part.trapezoidRearHeightMm
    );
    return (
      part.heightMm +
      part.trapezoidRearHeightMm +
      part.widthMm +
      slopeEdgeMm
    );
  }

  return 2 * (part.widthMm + part.heightMm);
}

export function cutGeometryCutoutPerimeterMm(part: CutGeometryLike) {
  return (part.cutouts ?? []).reduce(
    (sum, cutout) => sum + roundedRectanglePerimeterMm(cutout),
    0
  );
}
