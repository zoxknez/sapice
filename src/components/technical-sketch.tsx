import type {ShelterModel} from "@/lib/domain";

export function TechnicalSketch({model, locale}: {model: ShelterModel; locale: "sr" | "en"}) {
  const w = model.dimensions.widthMm;
  const h = model.dimensions.frontHeightMm;
  const scale = 520 / w;
  const sw = w * scale;
  const sh = h * scale;
  const ew = model.layout.entranceWidthMm * scale;
  const eh = model.layout.entranceHeightMm * scale;

  return (
    <figure className="technical-sketch">
      <svg viewBox={`0 0 620 ${Math.max(360, sh + 120)}`} aria-labelledby="technical-title">
        <title id="technical-title">
          {locale === "sr" ? "Tehnički pogled spreda" : "Technical front elevation"}
        </title>
        <g transform="translate(50 45)" fill="none" stroke="currentColor">
          <path d={`M 0 ${sh * 0.1} L ${sw} 0 L ${sw} ${sh} L 0 ${sh} Z`} strokeWidth="2.2" />
          {Array.from({length: model.layout.entrances}).map((_, index) => {
            const x = sw * ((index + 1) / (model.layout.entrances + 1)) - ew / 2;
            return (
              <rect
                key={index}
                x={x}
                y={sh - eh - 18}
                width={ew}
                height={eh}
                rx="14"
                strokeWidth="2"
              />
            );
          })}
          <line x1="0" y1={sh + 34} x2={sw} y2={sh + 34} strokeWidth="1" />
          <line x1="0" y1={sh + 24} x2="0" y2={sh + 44} />
          <line x1={sw} y1={sh + 24} x2={sw} y2={sh + 44} />
          <text x={sw / 2} y={sh + 60} textAnchor="middle" fill="currentColor" stroke="none">
            {w} mm
          </text>
        </g>
      </svg>
      <figcaption>
        {locale === "sr"
          ? "Front elevation izveden iz istih dimenzija koje koristi model."
          : "Front elevation derived from the same dimensions used by the model."}
      </figcaption>
    </figure>
  );
}
