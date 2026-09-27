"use client";

import {useMemo, useState} from "react";
import * as THREE from "three";
import {Canvas} from "@react-three/fiber";
import {ContactShadows, OrbitControls} from "@react-three/drei";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {constructionSummary, roofPanelGeometry, roofSlope} from "@/lib/engineering";

type ViewMode = "assembled" | "roof-off" | "exploded";

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

    for (let index = 0; index < model.layout.entrances; index++) {
      const centerX = width * ((index + 1) / (model.layout.entrances + 1));
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

function Shelter({model, mode}: {model: ShelterModel; mode: ViewMode}) {
  const w = model.dimensions.widthMm / 1000;
  const d = model.dimensions.depthMm / 1000;
  const hf = model.dimensions.frontHeightMm / 1000;
  const hr = model.dimensions.rearHeightMm / 1000;
  const gc = model.dimensions.groundClearanceMm / 1000;

  const construction = constructionSummary(model);
  const wallT = construction.wallThicknessMm / 1000;
  const floorT = construction.floorThicknessMm / 1000;
  const roofT = Math.min(construction.roofThicknessMm / 1000, 0.085);
  const avgH = (hf + hr) / 2;
  const roof = roofSlope(model);
  const roofPanel = roofPanelGeometry(model);
  const roofLength = roofPanel.panelLengthMm / 1000;
  const roofWidth = roofPanel.panelWidthMm / 1000;
  const roofCenterZ = d / 2 + roofPanel.centerPlanOffsetMm / 1000;
  const roofCenterY = gc + avgH + roofT / 2 + roofPanel.centerHeightOffsetMm / 1000;

  const exploded = mode === "exploded";
  const wallOffset = exploded ? 0.28 : 0;
  const roofOffset = exploded ? 0.34 : 0;
  const floorOffset = exploded ? -0.08 : 0;

  return (
    <group position={[-w / 2, 0, -d / 2]}>
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

      {model.layout.chambers > 1 && (
        <Box
          position={[w / 2, gc + floorT + Math.max(0.1, avgH - floorT) * 0.43, d / 2]}
          size={[wallT * 0.75, Math.max(0.1, avgH - floorT) * 0.76, d * 0.78]}
          color="#d4ad82"
          opacity={0.76}
        />
      )}

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
    </group>
  );
}

export function ShelterViewer({model, locale}: {model: ShelterModel; locale: AppLocale}) {
  const [mode, setMode] = useState<ViewMode>("assembled");

  return (
    <div className="viewer" aria-label={`3D preview: ${model.translations.en.name}`}>
      <Canvas camera={{position: [2.25, 1.6, 2.55], fov: 38}} dpr={[1, 1.5]} shadows>
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
          target={[0, 0.48, 0]}
        />
      </Canvas>

      <div className="viewer-toolbar" aria-label={locale === "sr" ? "Kontrole 3D prikaza" : "3D view controls"}>
        {([
          ["assembled", "3D"],
          ["roof-off", locale === "sr" ? "Bez krova" : "Roof off"],
          ["exploded", locale === "sr" ? "Rastavljeno" : "Exploded"]
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
