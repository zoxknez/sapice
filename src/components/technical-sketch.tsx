import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";

function HDimension({
  x1,
  x2,
  y,
  label
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
}) {
  return (
    <g className="drawing-dimension">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
      <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle">{label}</text>
    </g>
  );
}

function VDimension({
  x,
  y1,
  y2,
  label
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
}) {
  const cy = (y1 + y2) / 2;
  return (
    <g className="drawing-dimension">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 6} y1={y1} x2={x + 6} y2={y1} />
      <line x1={x - 6} y1={y2} x2={x + 6} y2={y2} />
      <text
        x={x - 8}
        y={cy}
        textAnchor="middle"
        transform={`rotate(-90 ${x - 8} ${cy})`}
      >
        {label}
      </text>
    </g>
  );
}

function ViewTitle({
  x,
  y,
  code,
  title
}: {
  x: number;
  y: number;
  code: string;
  title: string;
}) {
  return (
    <g>
      <text x={x} y={y} className="drawing-view-code">{code}</text>
      <text x={x + 34} y={y} className="drawing-view-title">{title}</text>
    </g>
  );
}

export function TechnicalSketch({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const model = compiled.model;
  const isSr = locale === "sr";
  const {widthMm: w, depthMm: d, frontHeightMm: hf, rearHeightMm: hr, groundClearanceMm: gc} = model.dimensions;
  const wall = compiled.construction.wallThicknessMm;

  const frontScale = Math.min(400 / w, 220 / (hf + gc));
  const frontX = 68;
  const frontTop = 82;
  const fw = w * frontScale;
  const fh = hf * frontScale;
  const fgc = gc * frontScale;
  const frontBottom = frontTop + fh;
  const frontGround = frontBottom + fgc;
  const frontRoofUndersideY =
    frontTop + compiled.interfaces.roofVerticalThicknessMm * frontScale;
  const frontFloorTopY =
    frontBottom - compiled.construction.floorThicknessMm * frontScale;

  const sideTotalDepth = d + model.roof.frontOverhangMm + model.roof.rearOverhangMm;
  const sideScale = Math.min(400 / sideTotalDepth, 220 / (hf + gc + 80));
  const sideX = 650;
  const sideTop = 82;
  const bodyX = sideX + model.roof.frontOverhangMm * sideScale;
  const sd = d * sideScale;
  const shf = hf * sideScale;
  const shr = hr * sideScale;
  const sgc = gc * sideScale;
  const sideBodyBottom = sideTop + shf;
  const sideGround = sideBodyBottom + sgc;
  const slopeRise = (hf - hr) * sideScale;
  const sideFloorTopY =
    sideBodyBottom - compiled.construction.floorThicknessMm * sideScale;
  const sideFrontRoofUndersideY =
    sideTop + compiled.interfaces.roofVerticalThicknessMm * sideScale;
  const sideRearRoofUndersideY =
    sideTop +
    slopeRise +
    compiled.interfaces.roofVerticalThicknessMm * sideScale;
  const roofFrontX = sideX;
  const roofRearX = sideX + sideTotalDepth * sideScale;
  const roofFrontY = sideTop - model.roof.frontOverhangMm * Math.tan(compiled.roof.angleRad) * sideScale;
  const roofRearY = sideTop + slopeRise + model.roof.rearOverhangMm * Math.tan(compiled.roof.angleRad) * sideScale;

  const planScale = Math.min(400 / w, 220 / d);
  const planX = 68;
  const planY = 495;
  const pw = w * planScale;
  const pd = d * planScale;

  const roofScale = Math.min(
    400 / compiled.roofPanel.panelWidthMm,
    220 / compiled.roofPanel.panelLengthMm
  );
  const roofX = 650;
  const roofY = 495;
  const rpw = compiled.roofPanel.panelWidthMm * roofScale;
  const rpl = compiled.roofPanel.panelLengthMm * roofScale;
  const roofHingeY =
    roofY + compiled.hardware.hingeAxisFromPanelFrontMm * roofScale;
  const roofLatchY =
    roofY + compiled.hardware.latchAxisFromPanelFrontMm * roofScale;

  const entranceW = compiled.entrance.widthMm * frontScale;
  const entranceH = compiled.entrance.heightMm * frontScale;
  const entranceRadius = compiled.entrance.radiusMm * frontScale;
  const threshold = compiled.entrance.thresholdHeightMm * frontScale;
  const frameFacePx = compiled.framing.frameProfileMm[0] * frontScale;

  const sideStuds = compiled.linearParts.filter(
    (part) => part.wall === "left" && typeof part.positionMm === "number"
  );

  return (
    <figure className="technical-sketch technical-sheet">
      <div className="technical-sheet-head">
        <div>
          <span className="kicker">Compiled drawing sheet</span>
          <strong>{model.translations[locale].name}</strong>
        </div>
        <div>
          <span>MODEL</span>
          <strong>{model.id}</strong>
        </div>
        <div>
          <span>VERSION</span>
          <strong>v{model.version}</strong>
        </div>
        <div>
          <span>STATUS</span>
          <strong>{model.validationState.replaceAll("_", " ")}</strong>
        </div>
        <div>
          <span>PLAN ID</span>
          <strong>{compiled.planFingerprint}</strong>
        </div>
      </div>

      <svg viewBox="0 0 1160 830" aria-labelledby="technical-title technical-desc">
        <title id="technical-title">
          {isSr ? "Kompajlirani tehnički crtež kućice" : "Compiled technical shelter drawing"}
        </title>
        <desc id="technical-desc">
          {isSr
            ? "Pogled spreda, bočni pogled, osnova i krovni panel sa kotama izvedenim iz kanonskog modela."
            : "Front elevation, side elevation, plan and roof panel with dimensions derived from the canonical model."}
        </desc>

        <rect x="24" y="24" width="1112" height="770" rx="12" className="drawing-border" />

        <ViewTitle x={54} y={58} code="A" title={isSr ? "POGLED SPREDA + RAM" : "FRONT ELEVATION + FRAME"} />
        <g className="drawing-shape">
          <rect x={frontX} y={frontTop} width={fw} height={fh} />
          <rect
            x={frontX}
            y={frontTop}
            width={fw}
            height={compiled.interfaces.roofVerticalThicknessMm * frontScale}
            className="drawing-assembly-zone drawing-roof-zone"
          />
          <rect
            x={frontX}
            y={frontFloorTopY}
            width={fw}
            height={compiled.construction.floorThicknessMm * frontScale}
            className="drawing-assembly-zone drawing-floor-zone"
          />
          <line x1={frontX} y1={frontRoofUndersideY} x2={frontX + fw} y2={frontRoofUndersideY} className="drawing-interface" />
          <line x1={frontX} y1={frontFloorTopY} x2={frontX + fw} y2={frontFloorTopY} className="drawing-interface" />
          <line x1={frontX} y1={frontGround} x2={frontX + fw} y2={frontGround} className="drawing-ground" />

          {compiled.framing.baseRunnerPositionsXmm.map((positionMm, index) => {
            const runnerWidthPx =
              compiled.framing.baseProfileMm[0] * frontScale;
            const runnerHeightPx =
              compiled.framing.baseProfileMm[1] * frontScale;
            const postHeightPx =
              compiled.framing.baseSupportPostHeightMm * frontScale;
            const x = frontX + positionMm * frontScale - runnerWidthPx / 2;

            return (
              <g key={`front-base-${index + 1}`}>
                <rect
                  x={x}
                  y={frontBottom}
                  width={runnerWidthPx}
                  height={runnerHeightPx}
                  className="drawing-runner"
                />
                <rect
                  x={x}
                  y={frontBottom + runnerHeightPx}
                  width={runnerWidthPx}
                  height={postHeightPx}
                  className="drawing-base-post"
                />
                <text
                  x={x + runnerWidthPx / 2}
                  y={frontGround - 7}
                  textAnchor="middle"
                  className="drawing-axis-label"
                >
                  B{index + 1}
                </text>
              </g>
            );
          })}

          <line x1={frontX + 3} y1={frontRoofUndersideY + 3} x2={frontX + 3} y2={frontFloorTopY - 3} className="drawing-frame" />
          <line x1={frontX + fw - 3} y1={frontRoofUndersideY + 3} x2={frontX + fw - 3} y2={frontFloorTopY - 3} className="drawing-frame" />
          <line x1={frontX + 3} y1={frontRoofUndersideY + 4} x2={frontX + fw - 3} y2={frontRoofUndersideY + 4} className="drawing-frame" />
          <line x1={frontX + 3} y1={frontFloorTopY - 4} x2={frontX + fw - 3} y2={frontFloorTopY - 4} className="drawing-frame" />

          {compiled.layout.entranceCentersXmm.map((centerMm, index) => {
            const cx = frontX + centerMm * frontScale;
            const x = cx - entranceW / 2;
            const y = frontBottom - threshold - entranceH;
            const header = compiled.linearParts.find(
              (part) => part.id === `entrance-${index + 1}-header`
            );
            const cripple = compiled.linearParts.find(
              (part) => part.id === `entrance-${index + 1}-cripple`
            );
            const headerY =
              frontFloorTopY - (header?.elevationMm ?? 0) * frontScale;
            const crippleBottomY =
              frontFloorTopY - (cripple?.startHeightMm ?? 0) * frontScale;
            const crippleTopY =
              crippleBottomY - (cripple?.lengthMm ?? 0) * frontScale;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={entranceW}
                  height={entranceH}
                  rx={entranceRadius}
                  className="drawing-opening"
                />
                <line
                  x1={x - frameFacePx / 2}
                  y1={frontFloorTopY}
                  x2={x - frameFacePx / 2}
                  y2={y}
                  className="drawing-frame drawing-frame-assumption"
                />
                <line
                  x1={x + entranceW + frameFacePx / 2}
                  y1={frontFloorTopY}
                  x2={x + entranceW + frameFacePx / 2}
                  y2={y}
                  className="drawing-frame drawing-frame-assumption"
                />
                {header && (
                  <rect
                    x={cx - (header.lengthMm * frontScale) / 2}
                    y={headerY - frameFacePx / 2}
                    width={header.lengthMm * frontScale}
                    height={frameFacePx}
                    className="drawing-frame-member-assumption"
                  />
                )}
                {cripple && (
                  <line
                    x1={cx}
                    y1={crippleBottomY}
                    x2={cx}
                    y2={crippleTopY}
                    className="drawing-frame drawing-frame-assumption"
                  />
                )}
                <text x={cx} y={y + entranceH / 2} textAnchor="middle" className="drawing-label">
                  E{index + 1}
                </text>
              </g>
            );
          })}

          {compiled.layout.dividerPositionsXmm.map((positionMm, index) => {
            const x = frontX + positionMm * frontScale;
            return (
              <g key={index}>
                <line x1={x} y1={frontRoofUndersideY} x2={x} y2={frontFloorTopY} className="drawing-divider-axis" />
                <text x={x + 4} y={frontTop + 14} className="drawing-axis-label">D{index + 1}</text>
              </g>
            );
          })}
        </g>
        <HDimension x1={frontX} x2={frontX + fw} y={frontGround + 30} label={`${w} mm`} />
        <VDimension x={frontX - 26} y1={frontTop} y2={frontBottom} label={`${hf} mm`} />
        <VDimension x={frontX + fw + 24} y1={frontBottom} y2={frontGround} label={`${gc} mm`} />
        {compiled.layout.entranceCentersXmm.length > 0 && (
          <HDimension
            x1={frontX + compiled.layout.entranceCentersXmm[0] * frontScale - entranceW / 2}
            x2={frontX + compiled.layout.entranceCentersXmm[0] * frontScale + entranceW / 2}
            y={frontBottom - threshold + 19}
            label={`${model.layout.entranceWidthMm} mm`}
          />
        )}

        <ViewTitle x={636} y={58} code="B" title={isSr ? "BOČNI POGLED + KOSINA" : "SIDE ELEVATION + SLOPE"} />
        <g className="drawing-shape">
          <path
            d={`M ${bodyX} ${sideTop} L ${bodyX + sd} ${sideTop + slopeRise} L ${bodyX + sd} ${sideBodyBottom} L ${bodyX} ${sideBodyBottom} Z`}
          />
          <polygon
            points={[
              `${bodyX},${sideTop}`,
              `${bodyX + sd},${sideTop + slopeRise}`,
              `${bodyX + sd},${sideRearRoofUndersideY}`,
              `${bodyX},${sideFrontRoofUndersideY}`
            ].join(" ")}
            className="drawing-assembly-zone drawing-roof-zone"
          />
          <rect
            x={bodyX}
            y={sideFloorTopY}
            width={sd}
            height={compiled.construction.floorThicknessMm * sideScale}
            className="drawing-assembly-zone drawing-floor-zone"
          />
          <line x1={bodyX} y1={sideFrontRoofUndersideY} x2={bodyX + sd} y2={sideRearRoofUndersideY} className="drawing-interface" />
          <line x1={bodyX} y1={sideFloorTopY} x2={bodyX + sd} y2={sideFloorTopY} className="drawing-interface" />
          <line x1={roofFrontX} y1={roofFrontY} x2={roofRearX} y2={roofRearY} className="drawing-roof" />
          {(() => {
            const x1 = roofFrontX + (roofRearX - roofFrontX) * 0.42;
            const x2 = roofFrontX + (roofRearX - roofFrontX) * 0.78;
            const y1 = roofFrontY + (roofRearY - roofFrontY) * 0.42 - 10;
            const y2 = roofFrontY + (roofRearY - roofFrontY) * 0.78 - 10;
            return (
              <g className="drawing-runoff">
                <line x1={x1} y1={y1} x2={x2} y2={y2} />
                <polygon
                  points={`${x2},${y2} ${x2 - 11},${y2 - 5} ${x2 - 9},${y2 + 7}`}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  textAnchor="middle"
                  className="drawing-axis-label"
                >
                  {isSr ? "OTICANJE → POZADI" : "RUNOFF → REAR"}
                </text>
              </g>
            );
          })()}
          <line x1={bodyX} y1={sideGround} x2={bodyX + sd} y2={sideGround} className="drawing-ground" />

          <rect
            x={bodyX}
            y={sideBodyBottom}
            width={sd}
            height={compiled.framing.baseProfileMm[1] * sideScale}
            className="drawing-runner"
          />
          {compiled.framing.baseSupportPositionsZmm.map((positionMm, index) => {
            const postWidthPx =
              compiled.framing.baseProfileMm[0] * sideScale;
            const postHeightPx =
              compiled.framing.baseSupportPostHeightMm * sideScale;
            const runnerHeightPx =
              compiled.framing.baseProfileMm[1] * sideScale;
            const x =
              bodyX + positionMm * sideScale - postWidthPx / 2;

            return (
              <g key={`side-base-${index + 1}`}>
                <rect
                  x={x}
                  y={sideBodyBottom + runnerHeightPx}
                  width={postWidthPx}
                  height={postHeightPx}
                  className="drawing-base-post"
                />
                <text
                  x={x + postWidthPx / 2}
                  y={sideGround - 7}
                  textAnchor="middle"
                  className="drawing-axis-label"
                >
                  P{index + 1}
                </text>
              </g>
            );
          })}

          {sideStuds.map((part) => {
            const x = bodyX + (part.positionMm ?? 0) * sideScale;
            const topY = sideFloorTopY - part.lengthMm * sideScale;
            return (
              <line
                key={part.id}
                x1={x}
                y1={sideFloorTopY - 3}
                x2={x}
                y2={Math.max(sideTop + 3, topY)}
                className="drawing-frame drawing-frame-assumption"
              />
            );
          })}
        </g>
        <HDimension x1={bodyX} x2={bodyX + sd} y={sideGround + 30} label={`${d} mm`} />
        <VDimension x={bodyX - 24} y1={sideTop} y2={sideBodyBottom} label={`${hf} mm`} />
        <VDimension x={bodyX + sd + 24} y1={sideTop + slopeRise} y2={sideBodyBottom} label={`${hr} mm`} />
        <text x={bodyX + sd / 2} y={sideGround + 54} textAnchor="middle" className="drawing-note">
          {isSr ? "nagib" : "slope"} {(compiled.roof.angleRad * 180 / Math.PI).toFixed(1)}°
        </text>

        <ViewTitle x={54} y={470} code="C" title={isSr ? "OSNOVA + KOMORE" : "PLAN + CHAMBERS"} />
        <g className="drawing-shape">
          <rect x={planX} y={planY} width={pw} height={pd} />
          <rect
            x={planX + wall * planScale}
            y={planY + wall * planScale}
            width={Math.max(0, compiled.internal.widthMm * planScale)}
            height={Math.max(0, compiled.internal.depthMm * planScale)}
            className="drawing-inner"
          />

          {compiled.layout.dividerPositionsXmm.map((positionMm, index) => {
            const x = planX + positionMm * planScale;
            return (
              <g key={index}>
                <line x1={x} y1={planY + wall * planScale} x2={x} y2={planY + pd - wall * planScale} className="drawing-divider" />
                <text x={x + 5} y={planY + pd / 2} className="drawing-label">D{index + 1}</text>
              </g>
            );
          })}

          {compiled.heating.zones.map((zone, index) => (
            <g key={zone.id}>
              <rect
                x={planX + zone.xMm * planScale}
                y={planY + zone.zMm * planScale}
                width={zone.widthMm * planScale}
                height={zone.depthMm * planScale}
                rx="4"
                className="drawing-heating-provision"
              />
              <text
                x={planX + (zone.xMm + zone.widthMm / 2) * planScale}
                y={planY + (zone.zMm + zone.depthMm / 2) * planScale}
                textAnchor="middle"
                dominantBaseline="middle"
                className="drawing-axis-label"
              >
                HZ{index + 1}
              </text>
            </g>
          ))}

          {compiled.ventilation.zones.map((zone, index) => {
            const x1 = planX + (zone.centerXmm - zone.widthMm / 2) * planScale;
            const x2 = planX + (zone.centerXmm + zone.widthMm / 2) * planScale;
            const y = planY + pd - wall * planScale / 2;
            return (
              <g key={zone.id}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  className="drawing-vent-provision"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={y - 7}
                  textAnchor="middle"
                  className="drawing-axis-label"
                >
                  V{index + 1}
                </text>
              </g>
            );
          })}

          {compiled.layout.entranceCentersXmm.map((centerMm, index) => {
            const cx = planX + centerMm * planScale;
            const half = model.layout.entranceWidthMm * planScale / 2;
            return (
              <g key={index}>
                <line x1={cx - half} y1={planY - 5} x2={cx + half} y2={planY - 5} className="drawing-opening-line" />
                <text x={cx} y={planY - 11} textAnchor="middle" className="drawing-label">E{index + 1}</text>
              </g>
            );
          })}
        </g>
        <HDimension x1={planX} x2={planX + pw} y={planY + pd + 28} label={`${w} mm`} />
        <VDimension x={planX - 24} y1={planY} y2={planY + pd} label={`${d} mm`} />
        <text x={planX + pw / 2} y={planY + pd + 52} textAnchor="middle" className="drawing-note">
          {isSr ? "unutrašnje" : "internal"} {compiled.internal.widthMm} × {compiled.internal.depthMm} mm · {model.layout.chambers} {isSr ? "kom." : "ch."}
        </text>

        <ViewTitle x={636} y={470} code="D" title={isSr ? "KROVNI PANEL + SERVIS" : "ROOF PANEL + SERVICE"} />
        <g className="drawing-shape">
          <rect x={roofX} y={roofY} width={rpw} height={rpl} />
          <line
            x1={roofX}
            y1={roofHingeY}
            x2={roofX + rpw}
            y2={roofHingeY}
            className="drawing-hinge"
          />
          <line
            x1={roofX}
            y1={roofLatchY}
            x2={roofX + rpw}
            y2={roofLatchY}
            className="drawing-latch"
          />
          <line
            x1={roofX}
            y1={roofY + rpl}
            x2={roofX + rpw}
            y2={roofY + rpl}
            className="drawing-drip-edge"
          />

          <text x={roofX + rpw / 2} y={roofHingeY + 16} textAnchor="middle" className="drawing-label">
            {isSr ? "OSA ŠARKE · LINIJA PREDNJEG ZIDA" : "HINGE AXIS · FRONT WALL LINE"}
          </text>
          <text x={roofX + rpw / 2} y={roofLatchY - 8} textAnchor="middle" className="drawing-label">
            {isSr ? "ZATVARAČI · LINIJA ZADNJEG ZIDA" : "LATCHES · REAR WALL LINE"}
          </text>
          <text x={roofX + rpw / 2} y={roofY + rpl - 7} textAnchor="middle" className="drawing-axis-label">
            {isSr ? "SLOBODNA ZADNJA DRIP / RUNOFF IVICA" : "CLEAR REAR DRIP / RUNOFF EDGE"}
          </text>

          {compiled.hardware.hingePositionsAcrossRoofMm.map((positionMm, index) => {
            const x = roofX + positionMm * roofScale;
            return (
              <g key={`hinge-${index + 1}`}>
                <rect
                  x={x - 8}
                  y={roofHingeY - 4}
                  width="16"
                  height="8"
                  rx="2"
                  className="drawing-hardware-hinge"
                />
                <text x={x} y={roofHingeY - 10} textAnchor="middle" className="drawing-axis-label">
                  H{index + 1}
                </text>
              </g>
            );
          })}

          {compiled.hardware.latchPositionsAcrossRoofMm.map((positionMm, index) => {
            const x = roofX + positionMm * roofScale;
            return (
              <g key={`latch-${index + 1}`}>
                <rect
                  x={x - 6}
                  y={roofLatchY - 4}
                  width="12"
                  height="8"
                  rx="2"
                  className="drawing-hardware-latch"
                />
                <text x={x} y={roofLatchY + 16} textAnchor="middle" className="drawing-axis-label">
                  L{index + 1}
                </text>
              </g>
            );
          })}
        </g>
        <HDimension x1={roofX} x2={roofX + rpw} y={roofY + rpl + 28} label={`${Math.ceil(compiled.roofPanel.panelWidthMm)} mm`} />
        <VDimension x={roofX - 24} y1={roofY} y2={roofY + rpl} label={`${Math.ceil(compiled.roofPanel.panelLengthMm)} mm`} />
        <text x={roofX + rpw / 2} y={roofY + rpl + 53} textAnchor="middle" className="drawing-note">
          {isSr
            ? `prepust bočno ${model.roof.sideOverhangMm} mm · napred ${model.roof.frontOverhangMm} mm · nazad ${model.roof.rearOverhangMm} mm`
            : `overhang side ${model.roof.sideOverhangMm} mm · front ${model.roof.frontOverhangMm} mm · rear ${model.roof.rearOverhangMm} mm`}
        </text>

        <g transform="translate(54 770)">
          <line x1="0" y1="0" x2="28" y2="0" className="drawing-frame" />
          <text x="36" y="4" className="drawing-legend">{isSr ? "geometrijski ram / osa" : "geometry frame / axis"}</text>
          <line x1="220" y1="0" x2="248" y2="0" className="drawing-frame drawing-frame-assumption" />
          <text x="256" y="4" className="drawing-legend">{isSr ? "PROVISIONAL framing" : "PROVISIONAL framing"}</text>
          <line x1="475" y1="0" x2="503" y2="0" className="drawing-divider" />
          <text x="511" y="4" className="drawing-legend">{isSr ? "pregrada" : "divider"}</text>
          <line x1="650" y1="0" x2="678" y2="0" className="drawing-hinge" />
          <text x="686" y="4" className="drawing-legend">{isSr ? "šarka" : "hinge"}</text>
          <line x1="785" y1="0" x2="813" y2="0" className="drawing-vent-provision" />
          <text x="821" y="4" className="drawing-legend">{isSr ? "vent. PROVISION zona" : "vent PROVISION zone"}</text>
          <rect x="955" y="-5" width="20" height="10" className="drawing-base-post" />
          <text x="983" y="4" className="drawing-legend">{isSr ? "oslonac baze" : "base support"}</text>
          {compiled.heating.zones.length > 0 && (
            <>
              <rect x="1040" y="-5" width="20" height="10" className="drawing-heating-provision" />
              <text x="1068" y="4" className="drawing-legend">{isSr ? "grejna PROVISION zona" : "heating PROVISION zone"}</text>
            </>
          )}
        </g>
      </svg>

      <figcaption>
        {isSr
          ? "Sheet je izveden iz compiler-a. Pune kote i komore su geometrija; framing/hardware elementi označeni kao PROVISIONAL ostaju projektantska pretpostavka do engineering review-a."
          : "This sheet is compiler-derived. Solid dimensions and chambers are geometry; framing/hardware elements marked PROVISIONAL remain design assumptions until engineering review."}
      </figcaption>
    </figure>
  );
}
