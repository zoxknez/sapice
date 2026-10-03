import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";
import {modelName} from "@/lib/model-presentation";

type Point = [number, number];

function polygon(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function openingPath(left: number, top: number, width: number, height: number, radius: number) {
  const right = left + width;
  const bottom = top + height;
  const r = Math.min(radius, width / 2, height / 2);
  return `M ${left + r} ${top} H ${right - r} Q ${right} ${top} ${right} ${top + r} V ${bottom - r} Q ${right} ${bottom} ${right - r} ${bottom} H ${left + r} Q ${left} ${bottom} ${left} ${bottom - r} V ${top + r} Q ${left} ${top} ${left + r} ${top} Z`;
}

export function ModelThumbnail({model, locale, summary}: {
  model: ShelterModel;
  locale: AppLocale;
  summary: ModelComparisonSummary;
}) {
  const {widthMm: width, depthMm: depth, frontHeightMm: frontHeight, rearHeightMm: rearHeight, groundClearanceMm} = model.dimensions;
  const {sideOverhangMm: sideOverhang, frontOverhangMm: frontOverhang, rearOverhangMm: rearOverhang} = model.roof;
  const geometry = summary.thumbnail;
  const depthX = 0.28;
  const depthY = 0.12;
  // Fit each model into the card; every construction anchor remains in model millimetres.
  const scale = Math.min(
    244 / (width + 2 * sideOverhang + depthX * (depth + frontOverhang + rearOverhang)),
    126 / (frontHeight + groundClearanceMm + frontOverhang * Math.tan(geometry.roofAngleRad)),
    0.22
  );
  const leftExtent = -sideOverhang - depthX * frontOverhang;
  const rightExtent = width + sideOverhang + depthX * (depth + rearOverhang);
  const originX = (320 - (rightExtent - leftExtent) * scale) / 2 - leftExtent * scale;
  const baseY = 157;
  const point = (xMm: number, zMm: number, elevationMm: number): Point => [
    originX + (xMm + zMm * depthX) * scale,
    baseY - (elevationMm + zMm * depthY) * scale
  ];
  const frontWallTop = frontHeight - geometry.roofVerticalThicknessMm;
  const rearWallTop = rearHeight - geometry.roofVerticalThicknessMm;
  const floorTop = geometry.floorThicknessMm;
  const roofAt = (zMm: number) => frontHeight - zMm * Math.tan(geometry.roofAngleRad);
  const roofDrop = geometry.roofVerticalThicknessMm;
  const roofFrontZ = -frontOverhang;
  const roofRearZ = depth + rearOverhang;
  const roofTop: Point[] = [
    point(-sideOverhang, roofFrontZ, roofAt(roofFrontZ)),
    point(width + sideOverhang, roofFrontZ, roofAt(roofFrontZ)),
    point(width + sideOverhang, roofRearZ, roofAt(roofRearZ)),
    point(-sideOverhang, roofRearZ, roofAt(roofRearZ))
  ];
  const id = model.id.replace(/[^a-zA-Z0-9-]/g, "");
  const entranceWidth = geometry.entranceWidthMm * scale;
  const entranceHeight = geometry.entranceHeightMm * scale;
  const entranceRadius = geometry.entranceRadiusMm * scale;
  const entranceCount = geometry.entranceCentersXmm.length;

  return (
    <svg className="model-thumbnail" viewBox="0 0 320 210" role="img"
      aria-label={locale === "sr"
        ? `${modelName(model, "sr")}: ${width} × ${depth} mm, ${entranceCount} ${entranceCount === 1 ? "ulaz" : "ulaza"}${model.heated ? ", predviđeno grejanje" : ""}`
        : `${modelName(model, "en")}: ${width} × ${depth} mm, ${entranceCount} ${entranceCount === 1 ? "entrance" : "entrances"}${model.heated ? ", heating provision" : ""}`}
    >
      <defs>
        <linearGradient id={`front-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dfb282" /><stop offset=".6" stopColor="#bd8555" /><stop offset="1" stopColor="#a56b41" />
        </linearGradient>
        <linearGradient id={`side-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a66d47" /><stop offset="1" stopColor="#754c33" />
        </linearGradient>
        <linearGradient id={`roof-${id}`} x1="0" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor="#515b59" /><stop offset="1" stopColor="#293434" />
        </linearGradient>
        <linearGradient id={`opening-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#211d1a" /><stop offset="1" stopColor="#483526" />
        </linearGradient>
      </defs>

      <ellipse cx={160} cy={baseY + groundClearanceMm * scale + 7} rx={(rightExtent - leftExtent) * scale * .51} ry="9" fill="#49372a" opacity=".15" />
      {geometry.baseRunnerPositionsXmm.flatMap((runnerX, runnerIndex) =>
        geometry.baseSupportPositionsZmm.map((supportZ, rowIndex) => {
          const half = geometry.baseProfileMm[0] / 2;
          const upper = point(runnerX - half, supportZ, -geometry.baseProfileMm[1]);
          const lower = point(runnerX + half, supportZ, -geometry.baseProfileMm[1] - geometry.baseSupportPostHeightMm);
          return <rect key={`${runnerIndex}-${rowIndex}`} x={upper[0]} y={upper[1]}
            width={lower[0] - upper[0]} height={lower[1] - upper[1]}
            fill="#53473b" stroke="#453b33" strokeWidth=".6" />;
        })
      )}
      {geometry.baseRunnerPositionsXmm.map((runnerX, index) => {
        const half = geometry.baseProfileMm[0] / 2;
        const bottom = -geometry.baseProfileMm[1];
        return <g key={index} stroke="#4c4036" strokeWidth=".7">
          <polygon points={polygon([
            point(runnerX - half, 0, 0), point(runnerX + half, 0, 0),
            point(runnerX + half, depth, 0), point(runnerX - half, depth, 0)
          ])} fill="#78614b" />
          <polygon points={polygon([
            point(runnerX + half, 0, 0), point(runnerX + half, depth, 0),
            point(runnerX + half, depth, bottom), point(runnerX + half, 0, bottom)
          ])} fill="#574737" />
          <polygon points={polygon([
            point(runnerX - half, 0, 0), point(runnerX + half, 0, 0),
            point(runnerX + half, 0, bottom), point(runnerX - half, 0, bottom)
          ])} fill="#665240" />
        </g>;
      })}

      <polygon points={polygon([point(width, 0, 0), point(width, depth, 0), point(width, depth, floorTop), point(width, 0, floorTop)])}
        fill="#805837" stroke="#68482f" strokeWidth="1" />
      <polygon points={polygon([
        point(width, 0, floorTop), point(width, depth, floorTop),
        point(width, depth, rearWallTop), point(width, 0, frontWallTop)
      ])} fill={`url(#side-${id})`} stroke="#704931" strokeWidth="1.1" />
      {[.25, .5, .75].map((fraction) => {
        const z = depth * fraction;
        const top = frontWallTop + (rearWallTop - frontWallTop) * fraction;
        const [x1, y1] = point(width, z, floorTop + 8);
        const [x2, y2] = point(width, z, top - 8);
        return <line key={fraction} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e7b181" strokeOpacity=".24" strokeWidth="1.2" />;
      })}

      <polygon points={polygon([point(0, 0, 0), point(width, 0, 0), point(width, 0, floorTop), point(0, 0, floorTop)])}
        fill="#885a39" stroke="#704a32" strokeWidth="1" />
      <polygon points={polygon([
        point(0, 0, floorTop), point(width, 0, floorTop),
        point(width, 0, frontWallTop), point(0, 0, frontWallTop)
      ])} fill={`url(#front-${id})`} stroke="#8c5c3b" strokeWidth="1.1" />
      {Array.from({length: Math.max(2, Math.floor(width * scale / 27))}, (_, index) => {
        const x = width * (index + 1) / (Math.max(2, Math.floor(width * scale / 27)) + 1);
        const [screenX, y1] = point(x, 0, floorTop + 7);
        const [, y2] = point(x, 0, frontWallTop - 7);
        return <line key={index} x1={screenX} y1={y1} x2={screenX} y2={y2} stroke="#f0c291" strokeOpacity=".27" strokeWidth="1.3" />;
      })}
      {geometry.entranceCentersXmm.map((centerXmm, index) => {
        const left = point(centerXmm - geometry.entranceWidthMm / 2, 0, 0)[0];
        const top = point(0, 0, geometry.thresholdHeightMm + geometry.entranceHeightMm)[1];
        return <path key={index} d={openingPath(left, top, entranceWidth, entranceHeight, entranceRadius)}
          fill={`url(#opening-${id})`} stroke="#70472d" strokeWidth="1.5" />;
      })}

      <polygon points={polygon([
        roofTop[1], roofTop[2],
        point(width + sideOverhang, roofRearZ, roofAt(roofRearZ) - roofDrop),
        point(width + sideOverhang, roofFrontZ, roofAt(roofFrontZ) - roofDrop)
      ])} fill="#222b2b" stroke="#222b2b" strokeWidth=".8" />
      <polygon points={polygon([
        roofTop[0], roofTop[1],
        point(width + sideOverhang, roofFrontZ, roofAt(roofFrontZ) - roofDrop),
        point(-sideOverhang, roofFrontZ, roofAt(roofFrontZ) - roofDrop)
      ])} fill="#303939" stroke="#232e2d" strokeWidth=".8" />
      <polygon points={polygon(roofTop)} fill={`url(#roof-${id})`} stroke="#283434" strokeWidth="1" />

      {model.heated && <g className="thumb-heating-mark">
        <rect x="185" y="11" width="124" height="19" rx="9.5" fill="#793e31" />
        <text x="247" y="24" textAnchor="middle" fill="#fff8ed">
          {locale === "sr" ? "PREDVIĐENO GREJANJE" : "HEATING PROVISION"}
        </text>
      </g>}

      <line x1={point(0, 0, 0)[0]} y1="190" x2={point(width, 0, 0)[0]} y2="190" stroke="#a07654" strokeWidth="1" />
      <line x1={point(0, 0, 0)[0]} y1="186" x2={point(0, 0, 0)[0]} y2="194" stroke="#a07654" />
      <line x1={point(width, 0, 0)[0]} y1="186" x2={point(width, 0, 0)[0]} y2="194" stroke="#a07654" />
      <text x={(point(0, 0, 0)[0] + point(width, 0, 0)[0]) / 2} y="205" textAnchor="middle">{width} mm</text>
    </svg>
  );
}
