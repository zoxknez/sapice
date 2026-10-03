import type {AppLocale} from "@/i18n/routing";
import type {CompiledPracticalModel} from "@/lib/practical/compiler";

function Dim({x1, x2, y, label}: {x1: number; x2: number; y: number; label: string}) {
  return (
    <g className="drawing-dimension">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle">{label}</text>
    </g>
  );
}

function VDim({x, y1, y2, label}: {x: number; y1: number; y2: number; label: string}) {
  const cy = (y1 + y2) / 2;
  return (
    <g className="drawing-dimension">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <text x={x - 6} y={cy} textAnchor="middle" transform={`rotate(-90 ${x - 6} ${cy})`}>{label}</text>
    </g>
  );
}

/**
 * Front / side / plan views from the compiled envelope, with a text equivalent table.
 * Schematic envelopes (containers) are drawn dashed and labelled so they are never mistaken for
 * exact product geometry.
 */
export function PracticalDrawing({compiled, locale}: {compiled: CompiledPracticalModel; locale: AppLocale}) {
  const isSr = locale === "sr";
  const e = compiled.envelope;
  const lift = e.groundClearanceMm;
  const viewW = 300;
  const viewH = 220;
  const s = Math.min(viewW / Math.max(e.widthMm, e.depthMm), viewH / (Math.max(e.frontHeightMm, e.rearHeightMm) + lift), 0.32);
  const dash = e.schematic ? "6 4" : undefined;
  const ground = 300;
  const frontX = 70;
  const sideX = 470;
  const planY = 360;
  const W = e.widthMm * s;
  const D = e.depthMm * s;
  const Hf = e.frontHeightMm * s;
  const Hr = e.rearHeightMm * s;
  const L = lift * s;
  const descId = `practical-drawing-desc-${compiled.model.slug}`;

  return (
    <figure className="technical-sketch practical-drawing">
      <svg viewBox="0 0 860 640" role="img" aria-labelledby={descId}>
        <desc id={descId}>
          {isSr
            ? `Pogled spreda, sa strane i odozgo. Spoljašnje mere ${e.widthMm} × ${e.depthMm} mm, visina napred ${e.frontHeightMm} mm, pozadi ${e.rearHeightMm} mm.`
            : `Front, side and top views. Outside size ${e.widthMm} × ${e.depthMm} mm, front height ${e.frontHeightMm} mm, rear ${e.rearHeightMm} mm.`}
        </desc>
        <rect x="16" y="16" width="828" height="608" rx="12" className="drawing-border" />
        <text x="40" y="48" className="drawing-label">{isSr ? "A · POGLED SPREDA" : "A · FRONT VIEW"}</text>
        <text x={sideX - 30} y="48" className="drawing-label">{isSr ? "B · BOČNI POGLED" : "B · SIDE VIEW"}</text>
        <text x="40" y={planY - 22} className="drawing-label">{isSr ? "C · OSNOVA" : "C · PLAN"}</text>
        {e.schematic && (
          <text x="820" y="48" textAnchor="end" className="drawing-label drawing-schematic">{isSr ? "ŠEMATSKI OMOTAČ: IZMERITE SVOJ PROIZVOD" : "SCHEMATIC ENVELOPE: MEASURE YOUR PRODUCT"}</text>
        )}

        <g className="drawing-shape">
          <line x1="30" y1={ground} x2="830" y2={ground} className="drawing-ground" />
          {e.openSides ? (
            <>
              <line x1={frontX} y1={ground} x2={frontX} y2={ground - Hf} />
              <line x1={frontX + W} y1={ground} x2={frontX + W} y2={ground - Hf} />
              <rect x={frontX - 6} y={ground - Hf - 8} width={W + 12} height="8" className="drawing-roof-zone" />
              {lift > 0 && <rect x={frontX} y={ground - L - 6} width={W} height="6" />}
            </>
          ) : (
            <>
              {lift > 0 && <rect x={frontX + 6} y={ground - L} width={W - 12} height={L} className="drawing-base-post" />}
              <rect x={frontX} y={ground - L - Hf} width={W} height={Hf} strokeDasharray={dash} rx={e.schematic ? 6 : 0} />
              {e.entrances.map((entrance, index) => (
                <rect key={index} x={frontX + (entrance.centerXmm - entrance.widthMm / 2) * s} y={ground - L - (entrance.sillMm + entrance.heightMm) * s} width={entrance.widthMm * s} height={entrance.heightMm * s} rx={entrance.widthMm * s / 2.4} className="drawing-opening" />
              ))}
            </>
          )}
        </g>
        <Dim x1={frontX} x2={frontX + W} y={ground + 28} label={`${e.widthMm} mm`} />
        <VDim x={frontX - 22} y1={ground - L - Hf} y2={ground} label={`${e.frontHeightMm + lift} mm`} />

        <g className="drawing-shape">
          {e.openSides ? (
            <>
              <line x1={sideX} y1={ground} x2={sideX} y2={ground - Hf} />
              <line x1={sideX + D} y1={ground} x2={sideX + D} y2={ground - Hr} />
              <line x1={sideX - 6} y1={ground - Hf - 4} x2={sideX + D + 6} y2={ground - Hr - 4} className="drawing-roof-line" />
            </>
          ) : (
            <>
              {lift > 0 && <rect x={sideX + 6} y={ground - L} width={D - 12} height={L} className="drawing-base-post" />}
              <polygon points={`${sideX},${ground - L} ${sideX + D},${ground - L} ${sideX + D},${ground - L - Hr} ${sideX},${ground - L - Hf}`} strokeDasharray={dash} />
            </>
          )}
          {e.frontHeightMm > e.rearHeightMm && (
            <text x={sideX + D / 2} y={ground - L - Math.max(Hf, Hr) - 12} textAnchor="middle" className="drawing-note">
              {isSr ? "voda otiče ka nazad →" : "water runs off to the rear →"}
            </text>
          )}
        </g>
        <Dim x1={sideX} x2={sideX + D} y={ground + 28} label={`${e.depthMm} mm`} />
        <VDim x={sideX + D + 26} y1={ground - L - Hr} y2={ground} label={`${e.rearHeightMm + lift} mm`} />

        <g className="drawing-shape">
          <rect x={frontX} y={planY} width={W} height={D} strokeDasharray={dash} />
          {e.interior && !e.openSides && (
            <rect x={frontX + (W - e.interior.widthMm * s) / 2} y={planY + (D - e.interior.depthMm * s) / 2} width={e.interior.widthMm * s} height={e.interior.depthMm * s} className="drawing-inner" />
          )}
          {e.entrances.map((entrance, index) => (
            <line key={index} x1={frontX + (entrance.centerXmm - entrance.widthMm / 2) * s} y1={planY - 5} x2={frontX + (entrance.centerXmm + entrance.widthMm / 2) * s} y2={planY - 5} className="drawing-opening-line" />
          ))}
          {e.chambers > 1 && Array.from({length: e.chambers - 1}, (_, index) => {
            const x = frontX + (W * (index + 1)) / e.chambers;
            return <line key={index} x1={x} y1={planY + 4} x2={x} y2={planY + D - 4} className="drawing-divider" />;
          })}
        </g>
        <Dim x1={frontX} x2={frontX + W} y={planY + D + 26} label={`${e.widthMm} mm`} />
        {e.interior && (
          <text x={frontX + W + 24} y={planY + 18} className="drawing-note">
            {isSr ? "unutra" : "inside"} {e.interior.widthMm} × {e.interior.depthMm} × {e.interior.heightMm} mm
          </text>
        )}
      </svg>
      <table className="drawing-text-equivalent">
        <caption>{isSr ? "Tekstualni ekvivalent crteža" : "Text equivalent of the drawing"}</caption>
        <tbody>
          <tr><th>{isSr ? "Spoljašnje mere (Š × D)" : "Outside size (W × D)"}</th><td>{e.widthMm} × {e.depthMm} mm</td></tr>
          <tr><th>{isSr ? "Visina napred / pozadi" : "Height front / rear"}</th><td>{e.frontHeightMm} / {e.rearHeightMm} mm</td></tr>
          <tr><th>{isSr ? "Podignuto od tla" : "Raised off the ground"}</th><td>{lift} mm</td></tr>
          {e.interior && <tr><th>{isSr ? "Unutrašnji prostor" : "Interior"}</th><td>{e.interior.widthMm} × {e.interior.depthMm} × {e.interior.heightMm} mm</td></tr>}
          {e.entrances.length > 0 && <tr><th>{isSr ? "Ulaz" : "Entrance"}</th><td>{e.entrances.length} × {e.entrances[0].widthMm} × {e.entrances[0].heightMm} mm, {isSr ? "prag" : "sill"} {e.entrances[0].sillMm} mm</td></tr>}
          <tr><th>{isSr ? "Komore" : "Chambers"}</th><td>{e.chambers}</td></tr>
          <tr><th>{isSr ? "Vrsta geometrije" : "Geometry type"}</th><td>{e.schematic ? (isSr ? "šematski omotač (pretpostavka)" : "schematic envelope (assumption)") : (isSr ? "izvedeno iz kanonskih mera" : "derived from canonical dimensions")}</td></tr>
        </tbody>
      </table>
    </figure>
  );
}
