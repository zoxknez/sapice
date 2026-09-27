import type {ShelterModel} from "@/lib/domain";
import {roofSlope} from "@/lib/engineering";

export function TechnicalSketch({model, locale}: {model: ShelterModel; locale: "sr" | "en"}) {
  const w = model.dimensions.widthMm;
  const d = model.dimensions.depthMm;
  const hf = model.dimensions.frontHeightMm;
  const hr = model.dimensions.rearHeightMm;
  const scale = 360 / Math.max(w, d);
  const frontW = w * scale;
  const frontH = hf * scale;
  const sideD = d * scale;
  const sideHF = hf * scale;
  const sideHR = hr * scale;
  const ew = model.layout.entranceWidthMm * scale;
  const eh = model.layout.entranceHeightMm * scale;
  const roof = roofSlope(model);

  return (
    <figure className="technical-sketch">
      <svg viewBox="0 0 860 430" aria-labelledby="technical-title">
        <title id="technical-title">
          {locale === "sr" ? "Tehnički pogled spreda i sa strane" : "Technical front and side elevations"}
        </title>

        <g transform="translate(38 48)" fill="none" stroke="currentColor">
          <text x="0" y="-16" fill="currentColor" stroke="none" fontSize="12">
            {locale === "sr" ? "Pogled spreda" : "Front elevation"}
          </text>
          <rect x="0" y="0" width={frontW} height={frontH} strokeWidth="2.2" />
          {Array.from({length: model.layout.entrances}).map((_, index) => {
            const x = frontW * ((index + 1) / (model.layout.entrances + 1)) - ew / 2;
            return <rect key={index} x={x} y={frontH - eh - 14} width={ew} height={eh} rx="12" strokeWidth="2" />;
          })}
          <line x1="0" y1={frontH + 30} x2={frontW} y2={frontH + 30} />
          <line x1="0" y1={frontH + 22} x2="0" y2={frontH + 38} />
          <line x1={frontW} y1={frontH + 22} x2={frontW} y2={frontH + 38} />
          <text x={frontW / 2} y={frontH + 52} textAnchor="middle" fill="currentColor" stroke="none" fontSize="11">
            {w} mm
          </text>
        </g>

        <g transform="translate(500 48)" fill="none" stroke="currentColor">
          <text x="0" y="-16" fill="currentColor" stroke="none" fontSize="12">
            {locale === "sr" ? "Bočni pogled" : "Side elevation"}
          </text>
          <path d={`M 0 0 L ${sideD} ${sideHF - sideHR} L ${sideD} ${sideHF} L 0 ${sideHF} Z`} strokeWidth="2.2" />
          <line x1="0" y1={sideHF + 30} x2={sideD} y2={sideHF + 30} />
          <line x1="0" y1={sideHF + 22} x2="0" y2={sideHF + 38} />
          <line x1={sideD} y1={sideHF + 22} x2={sideD} y2={sideHF + 38} />
          <text x={sideD / 2} y={sideHF + 52} textAnchor="middle" fill="currentColor" stroke="none" fontSize="11">
            {d} mm
          </text>
          <text x={sideD / 2} y={sideHF + 72} textAnchor="middle" fill="currentColor" stroke="none" fontSize="10">
            {locale === "sr" ? "nagib krova" : "roof slope"} {(roof.angleRad * 180 / Math.PI).toFixed(1)}°
          </text>
        </g>
      </svg>
      <figcaption>
        {locale === "sr"
          ? "Oba pogleda su izvedena iz kanonskih dimenzija modela."
          : "Both views are derived from the model's canonical dimensions."}
      </figcaption>
    </figure>
  );
}
