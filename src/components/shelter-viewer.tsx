"use client";

import {useMemo, useState} from "react";
import * as THREE from "three";
import {Canvas} from "@react-three/fiber";
import {ContactShadows, OrbitControls} from "@react-three/drei";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {layoutGeometry} from "@/lib/engineering";
import {compileShelterModel, type CompiledShelterModel} from "@/lib/compiler";

type ViewMode = "assembled" | "roof-off" | "exploded" | "frame";

function Box({
  position,
  size,
  color,
  opacity = 1
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.78}
        metalness={0.02}
      />
    </mesh>
  );
}

function addRoundedRectangleHole(
  shape: THREE.Shape,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  const hole = new THREE.Path();

  hole.moveTo(x + r, y);
  hole.lineTo(x, y);
  hole.lineTo(x, y + height - r);
  hole.quadraticCurveTo(x, y + height, x + r, y + height);
  hole.lineTo(x + width - r, y + height);
  hole.quadraticCurveTo(x + width, y + height, x + width, y + height - r);
  hole.lineTo(x + width, y + r);
  hole.quadraticCurveTo(x + width, y, x + width - r, y);
  hole.closePath();

  shape.holes.push(hole);
}

function FrontPanel({
  model,
  thickness,
  position
}: {
  model: ShelterModel;
  thickness: number;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const width = model.dimensions.widthMm / 1000;
    const height = model.dimensions.frontHeightMm / 1000;
    const entranceWidth = model.layout.entranceWidthMm / 1000;
    const entranceHeight = model.layout.entranceHeightMm / 1000;
    const threshold = model.layout.thresholdHeightMm / 1000;
    const radius = Math.min(0.04, entranceWidth * 0.22);

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, height);
    shape.lineTo(0, height);
    shape.closePath();

    const layout = compiled.layout;
    for (const centerXmm of layout.entranceCentersXmm) {
      const centerX = centerXmm / 1000;
      addRoundedRectangleHole(
        shape,
        centerX - entranceWidth / 2,
        threshold,
        entranceWidth,
        entranceHeight,
        radius
      );
    }

    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false
    });
  }, [model, thickness]);

  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#c18a57" roughness={0.82} />
    </mesh>
  );
}

function SidePanel({
  depth,
  frontHeight,
  rearHeight,
  thickness,
  position
}: {
  depth: number;
  frontHeight: number;
  rearHeight: number;
  thickness: number;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(depth, 0);
    shape.lineTo(depth, rearHeight);
    shape.lineTo(0, frontHeight);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false
    });
  }, [depth, frontHeight, rearHeight, thickness]);

  return (
    <mesh
      position={position}
      rotation={[0, -Math.PI / 2, 0]}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#b98050" roughness={0.84} />
    </mesh>
  );
}

function FramingSkeleton({
  model,
  compiled
}: {
  model: ShelterModel;
  compiled: CompiledShelterModel;
}) {
  const w = model.dimensions.widthMm / 1000;
  const d = model.dimensions.depthMm / 1000;
  const hf = model.dimensions.frontHeightMm / 1000;
  const hr = model.dimensions.rearHeightMm / 1000;
  const gc = model.dimensions.groundClearanceMm / 1000;
  const floorT = compiled.construction.floorThicknessMm / 1000;
  const roofT = compiled.construction.roofThicknessMm / 1000;
  const profileFace = compiled.framing.frameProfileMm[0] / 1000;
  const profileDepth = compiled.framing.frameProfileMm[1] / 1000;
  const base = compiled.framing.baseProfileMm[0] / 1000;
  const wallInset = compiled.construction.wallThicknessMm / 2000;

  const frontStudHeight = Math.max(0.05, hf - floorT - roofT);
  const rearStudHeight = Math.max(0.05, hr - floorT - roofT);
  const frontY = gc + floorT + frontStudHeight / 2;
  const rearY = gc + floorT + rearStudHeight / 2;
  const frameColor = "#4d705f";
  const assumedColor = "#aa754e";

  const entranceSupports = compiled.layout.entranceCentersXmm.flatMap((centerMm, index) => {
    const half = model.layout.entranceWidthMm / 2000;
    const supportLength = (model.layout.thresholdHeightMm + model.layout.entranceHeightMm) / 1000;
    const y = gc + floorT + supportLength / 2;
    const centerM = centerMm / 1000;
    return [
      <Box
        key={`entry-${index}-l`}
        position={[centerM - half, y, wallInset]}
        size={[profileFace, supportLength, profileDepth]}
        color={assumedColor}
      />,
      <Box
        key={`entry-${index}-r`}
        position={[centerM + half, y, wallInset]}
        size={[profileFace, supportLength, profileDepth]}
        color={assumedColor}
      />,
      <Box
        key={`entry-${index}-h`}
        position={[
          centerM,
          gc + floorT + supportLength,
          wallInset
        ]}
        size={[
          model.layout.entranceWidthMm / 1000 + 2 * profileFace,
          profileFace,
          profileDepth
        ]}
        color={assumedColor}
      />
    ];
  });

  const rearStuds = compiled.linearParts
    .filter((part) => part.wall === "rear" && typeof part.positionMm === "number")
    .map((part) => (
      <Box
        key={part.id}
        position={[
          (part.positionMm ?? 0) / 1000,
          gc + floorT + part.lengthMm / 2000,
          d - wallInset
        ]}
        size={[profileFace, part.lengthMm / 1000, profileDepth]}
        color={assumedColor}
      />
    ));

  const sideStuds = compiled.linearParts
    .filter(
      (part) =>
        (part.wall === "left" || part.wall === "right") &&
        typeof part.positionMm === "number"
    )
    .map((part) => (
      <Box
        key={part.id}
        position={[
          part.wall === "left" ? wallInset : w - wallInset,
          gc + floorT + part.lengthMm / 2000,
          (part.positionMm ?? 0) / 1000
        ]}
        size={[profileDepth, part.lengthMm / 1000, profileFace]}
        color={assumedColor}
      />
    ));

  const sideTopLength = compiled.roof.trueLengthMm / 1000;
  const sideTopY = gc + (hf + hr) / 2 - roofT / 2;
  const sideTopZ = d / 2;

  return (
    <group>
      <Box position={[w * 0.22, gc / 2, d / 2]} size={[base, gc, d * 0.88]} color="#51463a" />
      <Box position={[w * 0.78, gc / 2, d / 2]} size={[base, gc, d * 0.88]} color="#51463a" />

      <Box position={[wallInset, gc + floorT / 2, d / 2]} size={[profileDepth, profileFace, d]} color={frameColor} />
      <Box position={[w - wallInset, gc + floorT / 2, d / 2]} size={[profileDepth, profileFace, d]} color={frameColor} />
      <Box position={[w / 2, gc + floorT / 2, wallInset]} size={[w, profileFace, profileDepth]} color={frameColor} />
      <Box position={[w / 2, gc + floorT / 2, d - wallInset]} size={[w, profileFace, profileDepth]} color={frameColor} />

      <Box position={[wallInset, frontY, wallInset]} size={[profileFace, frontStudHeight, profileDepth]} color={frameColor} />
      <Box position={[w - wallInset, frontY, wallInset]} size={[profileFace, frontStudHeight, profileDepth]} color={frameColor} />
      <Box position={[wallInset, rearY, d - wallInset]} size={[profileFace, rearStudHeight, profileDepth]} color={frameColor} />
      <Box position={[w - wallInset, rearY, d - wallInset]} size={[profileFace, rearStudHeight, profileDepth]} color={frameColor} />

      <Box
        position={[w / 2, gc + floorT + profileFace / 2, wallInset]}
        size={[w, profileFace, profileDepth]}
        color={frameColor}
      />
      <Box
        position={[w / 2, gc + hf - roofT - profileFace / 2, wallInset]}
        size={[w, profileFace, profileDepth]}
        color={frameColor}
      />
      <Box
        position={[w / 2, gc + floorT + profileFace / 2, d - wallInset]}
        size={[w, profileFace, profileDepth]}
        color={frameColor}
      />
      <Box
        position={[w / 2, gc + hr - roofT - profileFace / 2, d - wallInset]}
        size={[w, profileFace, profileDepth]}
        color={frameColor}
      />

      {[wallInset, w - wallInset].map((x) => (
        <mesh
          key={x}
          position={[x, sideTopY, sideTopZ]}
          rotation={[compiled.roof.angleRad, 0, 0]}
          castShadow
        >
          <boxGeometry args={[profileDepth, profileFace, sideTopLength]} />
          <meshStandardMaterial color={frameColor} roughness={0.78} />
        </mesh>
      ))}

      <Box
        position={[wallInset, gc + floorT + profileFace / 2, d / 2]}
        size={[profileDepth, profileFace, d]}
        color={frameColor}
      />
      <Box
        position={[w - wallInset, gc + floorT + profileFace / 2, d / 2]}
        size={[profileDepth, profileFace, d]}
        color={frameColor}
      />

      {entranceSupports}
      {rearStuds}
      {sideStuds}

      {compiled.layout.dividerPositionsXmm.map((positionMm, index) => (
        <SidePanel
          key={`frame-divider-${index + 1}`}
          depth={Math.max(0.05, d - 2 * compiled.construction.wallThicknessMm / 1000)}
          frontHeight={Math.max(0.05, compiled.internal.frontHeightMm / 1000)}
          rearHeight={Math.max(0.05, compiled.internal.rearHeightMm / 1000)}
          thickness={model.layout.dividerThicknessMm / 1000}
          position={[
            positionMm / 1000,
            gc + floorT,
            compiled.construction.wallThicknessMm / 1000
          ]}
        />
      ))}
    </group>
  );
}

function Shelter({model, mode}: {model: ShelterModel; mode: ViewMode}) {
  const w = model.dimensions.widthMm / 1000;
  const d = model.dimensions.depthMm / 1000;
  const hf = model.dimensions.frontHeightMm / 1000;
  const hr = model.dimensions.rearHeightMm / 1000;
  const gc = model.dimensions.groundClearanceMm / 1000;

  const compiled = compileShelterModel(model);
  const construction = compiled.construction;
  const wallT = construction.wallThicknessMm / 1000;
  const floorT = construction.floorThicknessMm / 1000;
  const roofT = Math.min(construction.roofThicknessMm / 1000, 0.085);
  const avgH = (hf + hr) / 2;
  const roof = compiled.roof;
  const roofPanel = compiled.roofPanel;
  const roofLength = roofPanel.panelLengthMm / 1000;
  const roofWidth = roofPanel.panelWidthMm / 1000;
  const roofCenterZ = d / 2 + roofPanel.centerPlanOffsetMm / 1000;
  const roofCenterY = gc + avgH + roofT / 2 + roofPanel.centerHeightOffsetMm / 1000;
  const layout = compiled.layout;
  const dividerDepth = Math.max(0.05, d - 2 * wallT);
  const dividerFrontHeight = Math.max(0.05, hf - floorT - roofT);
  const dividerRearHeight = Math.max(0.05, hr - floorT - roofT);

  const exploded = mode === "exploded";
  const wallOffset = exploded ? 0.28 : 0;
  const roofOffset = exploded ? 0.34 : 0;
  const floorOffset = exploded ? -0.08 : 0;

  return (
    <group position={[-w / 2, 0, -d / 2]}>
      {mode === "frame" ? (
        <FramingSkeleton model={model} compiled={compiled} />
      ) : (
        <>
      <Box
        position={[w * 0.22, gc / 2, d / 2]}
        size={[0.085, gc, d * 0.88]}
        color="#51463a"
      />
      <Box
        position={[w * 0.78, gc / 2, d / 2]}
        size={[0.085, gc, d * 0.88]}
        color="#51463a"
      />

      <Box
        position={[w / 2, gc + floorT / 2 + floorOffset, d / 2]}
        size={[w, floorT, d]}
        color="#a66f42"
      />

      <FrontPanel
        model={model}
        thickness={wallT}
        position={[0, gc, -wallOffset]}
      />

      <Box
        position={[w / 2, gc + hr / 2, d - wallT / 2 + wallOffset]}
        size={[w, hr, wallT]}
        color="#a97046"
      />

      <SidePanel
        depth={d}
        frontHeight={hf}
        rearHeight={hr}
        thickness={wallT}
        position={[wallT - wallOffset, gc, 0]}
      />
      <SidePanel
        depth={d}
        frontHeight={hf}
        rearHeight={hr}
        thickness={wallT}
        position={[w + wallOffset, gc, 0]}
      />

      {layout.dividerPositionsXmm.map((positionMm, index) => (
        <SidePanel
          key={`divider-${index + 1}`}
          depth={dividerDepth}
          frontHeight={dividerFrontHeight}
          rearHeight={dividerRearHeight}
          thickness={model.layout.dividerThicknessMm / 1000}
          position={[positionMm / 1000, gc + floorT, wallT]}
        />
      ))}

      {model.heated && (
        <Box
          position={[w * 0.3, gc + floorT + 0.012, d * 0.62]}
          size={[w * 0.34, 0.018, d * 0.36]}
          color="#b95c45"
        />
      )}

      {mode !== "roof-off" && (
        <mesh
          position={[w / 2, roofCenterY + roofOffset, roofCenterZ]}
          rotation={[roof.angleRad, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[roofWidth, roofT, roofLength]} />
          <meshStandardMaterial color="#5d554c" roughness={0.92} />
        </mesh>
      )}
        </>
      )}
    </group>
  );
}

export function ShelterViewer({model, locale}: {model: ShelterModel; locale: AppLocale}) {
  const [mode, setMode] = useState<ViewMode>("assembled");
  const widthM = model.dimensions.widthMm / 1000;
  const depthM = model.dimensions.depthMm / 1000;
  const heightM = (model.dimensions.frontHeightMm + model.dimensions.groundClearanceMm) / 1000;
  const maxSpan = Math.max(widthM, depthM, heightM);
  const cameraPosition: [number, number, number] = [
    maxSpan * 1.35,
    Math.max(1.2, heightM * 1.18),
    maxSpan * 1.55
  ];
  const orbitTarget: [number, number, number] = [0, heightM * 0.43, 0];

  return (
    <div className="viewer" aria-label={`3D preview: ${model.translations.en.name}`}>
      <Canvas camera={{position: cameraPosition, fov: 38}} dpr={[1, 1.5]} shadows>
        <color attach="background" args={["#eee9e0"]} />
        <ambientLight intensity={1.45} />
        <directionalLight position={[3, 5, 2]} intensity={2.2} castShadow />
        <Shelter model={model} mode={mode} />
        <ContactShadows position={[0, -0.02, 0]} opacity={0.28} scale={5} blur={2.5} far={4} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={1.25}
          maxDistance={5}
          target={orbitTarget}
        />
      </Canvas>

      <div className="viewer-toolbar" aria-label={locale === "sr" ? "Kontrole 3D prikaza" : "3D view controls"}>
        {([
          ["assembled", "3D"],
          ["roof-off", locale === "sr" ? "Bez krova" : "Roof off"],
          ["exploded", locale === "sr" ? "Rastavljeno" : "Exploded"],
          ["frame", locale === "sr" ? "Ram" : "Frame"]
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={mode === value ? "active" : ""}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="viewer-badge">WebGL · canonical dimensions</div>
    </div>
  );
}
