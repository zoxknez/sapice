import type {AppLocale} from "@/i18n/routing";
import type {EnvelopeSketch, SketchTone} from "@/lib/catalog/entries";

type Point = [number, number];
const poly = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const palette: Record<SketchTone, {front: string; side: string; top: string; line: string; grain?: string}> = {
  PLYWOOD: {front: "#d6a473", side: "#a66d47", top: "#2f3a39", line: "#8c5c3b", grain: "#f0c291"},
  OSB: {front: "#cfa864", side: "#9c7a41", top: "#2f3a39", line: "#806232", grain: "#e8cb8c"},
  SCRAP: {front: "#b88a5c", side: "#86603f", top: "#3a3532", line: "#6c4b33", grain: "#d8ad80"},
  PLASTIC: {front: "#8fa3a6", side: "#6e8285", top: "#55686b", line: "#4c5d60"},
  FOAM: {front: "#f3f1ea", side: "#d6d3c9", top: "#e7e4da", line: "#b1ada1"},
  CARDBOARD: {front: "#c79a62", side: "#a57b48", top: "#b98d57", line: "#86613a"},
  CRATE: {front: "#c49464", side: "#94683f", top: "#3b4747", line: "#77522f", grain: "#e4b98a"},
  PALLET: {front: "#bf9b6c", side: "#8f7049", top: "#2f3a39", line: "#6f5435", grain: "#ead2a8"},
  CANOPY: {front: "#a8b4ae", side: "#87938d", top: "#d3dbd6", line: "#5d6a64"},
  CARRIER: {front: "#9aa9b0", side: "#7d8c93", top: "#6b7a81", line: "#55636a"}
};

/**
 * Small isometric sketch of a practical model's envelope. It is a recognisable silhouette for
 * cards, not a technical drawing; schematic envelopes (totes, foam boxes, containers) are dashed.
 */
export function PracticalThumbnail({sketch, name, locale}: {sketch: EnvelopeSketch; name: string; locale: AppLocale}) {
  const colors = palette[sketch.tone];
  const {widthMm: W, depthMm: D, frontHeightMm: Hf, rearHeightMm: Hr} = sketch;
  const lift = Math.min(sketch.groundClearanceMm, 220);
  const dx = 0.32;
  const dy = 0.16;
  const scale = Math.min(236 / (W + dx * D), 128 / (Math.max(Hf, Hr) + lift + dy * D), 0.3);
  const originX = (320 - (W + dx * D) * scale) / 2;
  const baseY = 166;
  const pt = (x: number, z: number, y: number): Point => [originX + (x + z * dx) * scale, baseY - (y + lift + z * dy) * scale];
  const roofAt = (z: number) => Hf + ((Hr - Hf) * z) / D;
  const open = sketch.openSides;
  const dash = sketch.schematic ? "5 4" : undefined;
  const id = `pt-${sketch.tone}-${W}-${D}-${Hf}`;

  const label = locale === "sr"
    ? `${name}: ${W} × ${D} mm${sketch.schematic ? ", šematski omotač" : ""}${open ? ", otvorena konstrukcija" : ""}`
    : `${name}: ${W} × ${D} mm${sketch.schematic ? ", schematic envelope" : ""}${open ? ", open structure" : ""}`;

  const supports = lift > 0
    ? [[0.08, 0.15], [0.92, 0.15], [0.08, 0.85], [0.92, 0.85]].map(([fx, fz], index) => {
      const top = pt(W * fx, D * fz, 0);
      const bottom = pt(W * fx, D * fz, -lift);
      return <line key={index} x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]} stroke="#4d4237" strokeWidth={Math.max(3, 40 * scale)} strokeLinecap="round" />;
    })
    : null;

  if (open) {
    const roofThickness = Math.max(18, 0.04 * Hf);
    const posts: Array<[number, number, number]> = [[0, 0, Hf], [W, 0, Hf], [0, D, Hr], [W, D, Hr]];
    return (
      <svg className="model-thumbnail practical-thumbnail" viewBox="0 0 320 210" role="img" aria-label={label}>
        <ellipse cx="160" cy={baseY + 10} rx={(W + dx * D) * scale * 0.52} ry="8" fill="#49372a" opacity=".13" />
        {posts.map(([x, z, h], index) => {
          const top = pt(x, z, h - roofThickness);
          const bottom = pt(x, z, -lift);
          return <line key={index} x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]} stroke="#6b5136" strokeWidth={Math.max(3, 45 * scale)} strokeLinecap="round" />;
        })}
        {lift > 0 && (
          <polygon points={poly([pt(0, 0, 0), pt(W, 0, 0), pt(W, D, 0), pt(0, D, 0)])} fill="#c9a47a" stroke="#8c6a47" strokeWidth="1" />
        )}
        <polygon points={poly([pt(0, 0, roofAt(0)), pt(W, 0, roofAt(0)), pt(W, D, roofAt(D)), pt(0, D, roofAt(D))])} fill={colors.top} stroke={colors.line} strokeWidth="1.2" opacity=".95" />
        <polygon points={poly([pt(0, 0, roofAt(0)), pt(W, 0, roofAt(0)), pt(W, 0, roofAt(0) - roofThickness), pt(0, 0, roofAt(0) - roofThickness)])} fill={colors.front} stroke={colors.line} strokeWidth="1" />
        <line x1={pt(0, 0, -lift)[0]} y1="192" x2={pt(W, 0, -lift)[0]} y2="192" stroke="#a07654" />
        <text x={(pt(0, 0, 0)[0] + pt(W, 0, 0)[0]) / 2} y="205" textAnchor="middle">{W} mm</text>
      </svg>
    );
  }

  const front: Point[] = [pt(0, 0, 0), pt(W, 0, 0), pt(W, 0, roofAt(0)), pt(0, 0, roofAt(0))];
  const side: Point[] = [pt(W, 0, 0), pt(W, D, 0), pt(W, D, roofAt(D)), pt(W, 0, roofAt(0))];
  const grainCount = Math.max(2, Math.floor((W * scale) / 26));
  const top: Point[] = [pt(0, 0, roofAt(0)), pt(W, 0, roofAt(0)), pt(W, D, roofAt(D)), pt(0, D, roofAt(D))];

  return (
    <svg className="model-thumbnail practical-thumbnail" viewBox="0 0 320 210" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.front} />
          <stop offset="1" stopColor={colors.side} stopOpacity=".55" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy={baseY + 10} rx={(W + dx * D) * scale * 0.52} ry="8" fill="#49372a" opacity=".13" />
      {supports}
      <polygon points={poly(side)} fill={colors.side} stroke={colors.line} strokeWidth="1.1" strokeDasharray={dash} strokeLinejoin="round" />
      <polygon points={poly(front)} fill={`url(#${id}-front)`} stroke={colors.line} strokeWidth="1.2" strokeDasharray={dash} strokeLinejoin="round" />
      {colors.grain && Array.from({length: grainCount}, (_, index) => {
        const x = (W * (index + 1)) / (grainCount + 1);
        const [sx, y1] = pt(x, 0, 12);
        const [, y2] = pt(x, 0, roofAt(0) - 12);
        return <line key={index} x1={sx} y1={y1} x2={sx} y2={y2} stroke={colors.grain} strokeOpacity={sketch.tone === "PALLET" || sketch.tone === "CRATE" ? 0.55 : 0.28} strokeWidth={sketch.tone === "PALLET" || sketch.tone === "CRATE" ? 2.4 : 1.2} />;
      })}
      <polygon points={poly(top)} fill={colors.top} stroke={colors.line} strokeWidth="1.1" strokeDasharray={dash} strokeLinejoin="round" />
      {sketch.entrances.map((entrance, index) => {
        const left = pt(entrance.centerXmm - entrance.widthMm / 2, 0, 0)[0];
        const right = pt(entrance.centerXmm + entrance.widthMm / 2, 0, 0)[0];
        const topY = pt(0, 0, entrance.sillMm + entrance.heightMm)[1];
        const bottomY = pt(0, 0, entrance.sillMm)[1];
        const w = right - left;
        const h = bottomY - topY;
        const r = Math.min(w / 2, h / 2);
        return <path key={index} d={`M ${left} ${bottomY} V ${topY + r} Q ${left} ${topY} ${left + r} ${topY} H ${right - r} Q ${right} ${topY} ${right} ${topY + r} V ${bottomY} Z`} fill="#2a221d" stroke={colors.line} strokeWidth="1.2" />;
      })}
      {sketch.schematic && (
        <text x="308" y="20" textAnchor="end" className="thumb-schematic">{locale === "sr" ? "ŠEMATSKI OMOTAČ" : "SCHEMATIC ENVELOPE"}</text>
      )}
      <line x1={pt(0, 0, -lift)[0]} y1="192" x2={pt(W, 0, -lift)[0]} y2="192" stroke="#a07654" />
      <text x={(pt(0, 0, 0)[0] + pt(W, 0, 0)[0]) / 2} y="205" textAnchor="middle">{W} mm</text>
    </svg>
  );
}
