import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";

export function ModelThumbnail({model, locale, summary}: {
  model: ShelterModel;
  locale: AppLocale;
  summary: ModelComparisonSummary;
}) {
  const {widthMm, depthMm, frontHeightMm, rearHeightMm, groundClearanceMm} = model.dimensions;
  // A common drawing scale keeps compact and large shelters visibly distinct.
  const scale = Math.min(225 / (widthMm + depthMm * 0.2), 118 / Math.max(frontHeightMm, rearHeightMm), 0.23);
  const w = widthMm * scale;
  const hf = frontHeightMm * scale;
  const hr = rearHeightMm * scale;
  const dx = Math.min(50, depthMm * scale * 0.22);
  const dy = -Math.min(30, depthMm * scale * 0.13);
  const x = (320 - w - dx) / 2;
  const y = 149;
  const clearance = Math.max(8, groundClearanceMm * scale);
  const entranceW = summary.thumbnail.entranceWidthMm * scale;
  const entranceH = summary.thumbnail.entranceHeightMm * scale;
  const threshold = summary.thumbnail.thresholdHeightMm * scale;
  const entranceRadius = Math.min(12, summary.thumbnail.entranceRadiusMm * scale);
  const id = model.id.replace(/[^a-zA-Z0-9-]/g, "");
  const roofFront = y - hf - 5;
  const roofBack = y + dy - hr - 5;

  return (
    <svg className="model-thumbnail" viewBox="0 0 320 210" role="img"
      aria-label={locale === "sr"
        ? `Prikaz modela ${model.translations.sr.name}, ${widthMm} × ${depthMm} mm`
        : `View of ${model.translations.en.name}, ${widthMm} × ${depthMm} mm`}
    >
      <defs>
        <linearGradient id={`front-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d7a673" /><stop offset=".58" stopColor="#bb8151" /><stop offset="1" stopColor="#a46a3d" />
        </linearGradient>
        <linearGradient id={`side-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9d633d" /><stop offset="1" stopColor="#74482f" />
        </linearGradient>
        <linearGradient id={`roof-${id}`} x1="0" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor="#51595a" /><stop offset="1" stopColor="#272e30" />
        </linearGradient>
        <linearGradient id={`opening-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#211d1a" /><stop offset="1" stopColor="#403126" />
        </linearGradient>
      </defs>

      <ellipse cx={x + (w + dx) / 2} cy={y + clearance + 4} rx={(w + dx) * .53} ry="11" fill="#49372a" opacity=".17" />
      <path d={`M ${x + 12} ${y - 1} v ${clearance} h 10 v ${-clearance} M ${x + w - 22} ${y - 1} v ${clearance} h 10 v ${-clearance} M ${x + w + dx - 18} ${y + dy - 1} v ${clearance} h 9 v ${-clearance}`} fill="#544a3e" stroke="#544a3e" strokeWidth="2" />

      <polygon points={`${x + w},${y - hf} ${x + w + dx},${y + dy - hr} ${x + w + dx},${y + dy} ${x + w},${y}`}
        fill={`url(#side-${id})`} stroke="#724b31" strokeWidth="1.2" />
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line key={fraction}
          x1={x + w + dx * fraction} y1={y - hf + (dy + hf - hr) * fraction + 5}
          x2={x + w + dx * fraction} y2={y + dy * fraction - 5}
          stroke="#e4af79" strokeOpacity=".28" strokeWidth="1.5" />
      ))}

      <rect x={x} y={y - hf} width={w} height={hf} rx="1.5" fill={`url(#front-${id})`} stroke="#8e5a35" strokeWidth="1.2" />
      {Array.from({length: Math.max(2, Math.floor(w / 27))}, (_, index) => (
        <line key={index} x1={x + (index + 1) * w / (Math.floor(w / 27) + 1)} y1={y - hf + 5}
          x2={x + (index + 1) * w / (Math.floor(w / 27) + 1)} y2={y - 4}
          stroke="#f3c18d" strokeOpacity=".29" strokeWidth="1.5" />
      ))}

      {summary.thumbnail.entranceCentersXmm.map((centerXmm, index) => {
        const left = x + centerXmm * scale - entranceW / 2;
        const top = y - threshold - entranceH;
        const bottom = y - threshold;
        const opening = `M ${left} ${bottom} V ${top + entranceRadius} Q ${left} ${top} ${left + entranceRadius} ${top} H ${left + entranceW - entranceRadius} Q ${left + entranceW} ${top} ${left + entranceW} ${top + entranceRadius} V ${bottom} Z`;
        return <g key={index}>
          <path d={opening} fill={`url(#opening-${id})`} stroke="#70472d" strokeWidth="2" />
          <path d={`M ${left + 3} ${bottom - 3} H ${left + entranceW - 3}`} stroke="#b8885d" strokeWidth="2" opacity=".8" />
        </g>;
      })}

      <polygon points={`${x - 8},${roofFront + 3} ${x + w + 8},${roofFront + 3} ${x + w + dx + 10},${roofBack + 3} ${x + dx - 10},${roofBack + 3}`}
        fill="#1f282a" />
      <polygon points={`${x - 8},${roofFront - 2} ${x + w + 8},${roofFront - 2} ${x + w + dx + 10},${roofBack - 2} ${x + dx - 10},${roofBack - 2}`}
        fill={`url(#roof-${id})`} stroke="#303839" strokeWidth="1" />

      <line x1={x} y1="190" x2={x + w} y2="190" stroke="#a07654" strokeWidth="1" />
      <line x1={x} y1="186" x2={x} y2="194" stroke="#a07654" />
      <line x1={x + w} y1="186" x2={x + w} y2="194" stroke="#a07654" />
      <text x={x + w / 2} y="205" textAnchor="middle">{widthMm} mm</text>
    </svg>
  );
}
