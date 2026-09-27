import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";

export function ModelThumbnail({
  model,
  locale
}: {
  model: ShelterModel;
  locale: AppLocale;
}) {
  const maxW = 215;
  const maxH = 105;
  const width = model.dimensions.widthMm;
  const frontH = model.dimensions.frontHeightMm;
  const rearH = model.dimensions.rearHeightMm;
  const scale = Math.min(maxW / width, maxH / frontH);
  const w = width * scale;
  const hf = frontH * scale;
  const hr = rearH * scale;
  const entranceW = model.layout.entranceWidthMm * scale;
  const entranceH = model.layout.entranceHeightMm * scale;
  const threshold = model.layout.thresholdHeightMm * scale;
  const originX = 36;
  const originY = 132;
  const depthOffsetX = Math.min(48, model.dimensions.depthMm * scale * 0.22);
  const depthOffsetY = -22;

  return (
    <svg
      className="model-thumbnail"
      viewBox="0 0 320 190"
      role="img"
      aria-label={locale === "sr"
        ? `Tehnički thumbnail modela ${model.translations.sr.name}`
        : `Technical thumbnail of ${model.translations.en.name}`}
    >
      <defs>
        <linearGradient id={`wood-${model.id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#b5784b" />
          <stop offset="1" stopColor="#c99363" />
        </linearGradient>
      </defs>

      <polygon
        points={[
          `${originX + w},${originY - hf}`,
          `${originX + w + depthOffsetX},${originY - hr + depthOffsetY}`,
          `${originX + w + depthOffsetX},${originY + depthOffsetY}`,
          `${originX + w},${originY}`
        ].join(" ")}
        fill="#9d6945"
      />

      <rect
        x={originX}
        y={originY - hf}
        width={w}
        height={hf}
        rx="2"
        fill={`url(#wood-${model.id})`}
      />

      {Array.from({length: model.layout.entrances}).map((_, index) => {
        const centerX = originX + w * ((index + 1) / (model.layout.entrances + 1));
        return (
          <rect
            key={index}
            x={centerX - entranceW / 2}
            y={originY - threshold - entranceH}
            width={entranceW}
            height={entranceH}
            rx={Math.min(12, entranceW * 0.3)}
            fill="#26211e"
          />
        );
      })}

      <polygon
        points={[
          `${originX - 7},${originY - hf - 8}`,
          `${originX + w + 7},${originY - hf - 8}`,
          `${originX + w + depthOffsetX + 10},${originY - hr + depthOffsetY - 10}`,
          `${originX + depthOffsetX - 8},${originY - hf + depthOffsetY - 10}`
        ].join(" ")}
        fill="#514d48"
      />

      {model.heated && (
        <rect
          x={originX + w * 0.58}
          y={originY - 8}
          width={w * 0.24}
          height="5"
          rx="2.5"
          fill="#a94f3f"
        />
      )}

      <line x1={originX} y1="154" x2={originX + w} y2="154" stroke="#8d5838" strokeWidth="1" />
      <line x1={originX} y1="149" x2={originX} y2="159" stroke="#8d5838" />
      <line x1={originX + w} y1="149" x2={originX + w} y2="159" stroke="#8d5838" />
      <text x={originX + w / 2} y="171" textAnchor="middle">
        {model.dimensions.widthMm} mm
      </text>

      <text x="286" y="28" textAnchor="end" className="thumb-meta">
        {model.layout.chambers}C · {model.layout.entrances}E
      </text>
    </svg>
  );
}
