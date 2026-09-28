"use client";

import {useEffect, useMemo, useState} from "react";
import * as THREE from "three";
import {Canvas, useThree} from "@react-three/fiber";
import {ContactShadows, OrbitControls} from "@react-three/drei";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";

type ViewMode = "assembled" | "roof-off" | "exploded" | "frame";
type CameraPreset = "isometric" | "front" | "rear" | "left" | "right" | "top";

function ModeCamera({mode, cameraPreset, maxSpan, inspectionSpan, targetY, defaultPosition}: {
  mode: ViewMode;
  cameraPreset: CameraPreset;
  maxSpan: number;
  inspectionSpan: number;
  targetY: number;
  defaultPosition: [number, number, number];
}) {
  const {camera, controls} = useThree();

  useEffect(() => {
    const viewDistance = Math.max(maxSpan, inspectionSpan) * 2.4;
    const frontHeight = Math.max(maxSpan * 0.9, targetY + maxSpan * 0.35);
    const presetPositions: Record<Exclude<CameraPreset, "isometric">, [number, number, number]> = {
      front: [0, frontHeight, -viewDistance],
      rear: [0, frontHeight, viewDistance],
      left: [-viewDistance, frontHeight, 0],
      right: [viewDistance, frontHeight, 0],
      top: [0, viewDistance, 0.001]
    };
    const modePosition: [number, number, number] = mode === "roof-off"
      ? [inspectionSpan * 0.55, inspectionSpan * 2.25, -inspectionSpan * 0.45]
      : mode === "frame"
        ? [maxSpan * 1.35, maxSpan * 1.75, -maxSpan * 1.85]
        : mode === "exploded"
          ? [maxSpan * 1.45, maxSpan * 1.7, -maxSpan * 2]
          : defaultPosition;
    const position = cameraPreset === "isometric" ? modePosition : presetPositions[cameraPreset];
    camera.position.set(...position);
    camera.lookAt(0, targetY, 0);
    (controls as {update?: () => void} | null)?.update?.();
  }, [camera, cameraPreset, controls, defaultPosition, inspectionSpan, maxSpan, mode, targetY]);

  return null;
}

// A deterministic surface finish. The mesh dimensions still come exclusively
// from the compiler; this texture only makes the timber readable in 3D.
const woodGrain = (() => {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wave = Math.sin(x * 0.31 + Math.sin(y * 0.045) * 2.2) * 8;
      const fine = Math.sin(x * 1.7 + y * 0.08) * 3;
      const value = Math.max(190, Math.min(255, Math.round(226 + wave + fine)));
      const index = (y * size + x) * 4;
      pixels[index] = value;
      pixels[index + 1] = value - 3;
      pixels[index + 2] = value - 8;
      pixels[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
})();

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
        map={color === "#a66f42" || color === "#a97046" ? woodGrain : undefined}
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
  hole.quadraticCurveTo(x, y, x, y + r);
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
  compiled,
  thickness,
  position
}: {
  compiled: CompiledShelterModel;
  thickness: number;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const model = compiled.model;
    const width = model.dimensions.widthMm / 1000;
    const height = compiled.interfaces.wallFrontHeightMm / 1000;
    const entranceWidth = compiled.entrance.widthMm / 1000;
    const entranceHeight = compiled.entrance.heightMm / 1000;
    const threshold = compiled.internal.entranceSillAboveFinishedFloorMm / 1000;
    const radius = compiled.entrance.radiusMm / 1000;

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
  }, [compiled, thickness]);

  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#c18a57" map={woodGrain} roughness={0.82} />
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
      <meshStandardMaterial color="#b98050" map={woodGrain} roughness={0.84} />
    </mesh>
  );
}

function BaseSupportSystem({
  compiled,
  color = "#51463a"
}: {
  compiled: CompiledShelterModel;
  color?: string;
}) {
  const model = compiled.model;
  const d = model.dimensions.depthMm / 1000;
  const gc = model.dimensions.groundClearanceMm / 1000;
  const baseWidth = compiled.framing.baseProfileMm[0] / 1000;
  const baseHeight = compiled.framing.baseProfileMm[1] / 1000;

  const runners = compiled.linearParts
    .filter(
      (part) =>
        part.wall === "base" &&
        part.id.startsWith("base-runner-") &&
        typeof part.positionMm === "number"
    )
    .map((part) => (
      <Box
        key={part.id}
        position={[
          (part.positionMm ?? 0) / 1000,
          gc - baseHeight / 2,
          d / 2
        ]}
        size={[baseWidth, baseHeight, part.lengthMm / 1000]}
        color={color}
      />
    ));

  const posts = compiled.linearParts
    .filter(
      (part) =>
        part.wall === "base" &&
        part.id.startsWith("base-post-") &&
        typeof part.positionXmm === "number" &&
        typeof part.positionZmm === "number"
    )
    .map((part) => (
      <Box
        key={part.id}
        position={[
          (part.positionXmm ?? 0) / 1000,
          part.lengthMm / 2000,
          (part.positionZmm ?? 0) / 1000
        ]}
        size={[
          part.profileMm[0] / 1000,
          part.lengthMm / 1000,
          part.profileMm[1] / 1000
        ]}
        color={color}
      />
    ));

  return <group>{posts}{runners}</group>;
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
  const gc = model.dimensions.groundClearanceMm / 1000;
  const floorT = compiled.construction.floorThicknessMm / 1000;
  const profileFace = compiled.framing.frameProfileMm[0] / 1000;
  const profileDepth = compiled.framing.frameProfileMm[1] / 1000;
  const wallInset = compiled.construction.wallThicknessMm / 2000;

  const frontStudHeight = Math.max(0.05, compiled.interfaces.wallFrontHeightMm / 1000);
  const rearStudHeight = Math.max(0.05, compiled.interfaces.wallRearHeightMm / 1000);
  const sideStartZ = compiled.joinery.sideStartZmm / 1000;
  const sideEndZ = compiled.joinery.sideEndZmm / 1000;
  const sideRun = compiled.joinery.sideRunMm / 1000;
  const sideFrontHeight = Math.max(0.05, compiled.joinery.sideFrontHeightMm / 1000);
  const sideRearHeight = Math.max(0.05, compiled.joinery.sideRearHeightMm / 1000);
  const frontY = gc + floorT + frontStudHeight / 2;
  const rearY = gc + floorT + rearStudHeight / 2;
  const frameColor = "#4d705f";
  const assumedColor = "#aa754e";

  const entranceVerticals = compiled.linearParts
    .filter(
      (part) =>
        part.wall === "front" &&
        typeof part.positionMm === "number" &&
        part.startHeightMm !== undefined
    )
    .map((part) => (
      <Box
        key={part.id}
        position={[
          (part.positionMm ?? 0) / 1000,
          gc +
            floorT +
            ((part.startHeightMm ?? 0) + part.lengthMm / 2) / 1000,
          wallInset
        ]}
        size={[profileFace, part.lengthMm / 1000, profileDepth]}
        color={assumedColor}
      />
    ));

  const entranceHeaders = compiled.linearParts
    .filter(
      (part) =>
        part.wall === "front" &&
        typeof part.positionMm === "number" &&
        part.elevationMm !== undefined
    )
    .map((part) => (
      <Box
        key={part.id}
        position={[
          (part.positionMm ?? 0) / 1000,
          gc +
            floorT +
            (part.elevationMm ?? 0) / 1000,
          wallInset
        ]}
        size={[part.lengthMm / 1000, profileFace, profileDepth]}
        color={assumedColor}
      />
    ));

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

  const floorFrameCenterY = (() => {
    const exteriorPanelMm =
      compiled.assemblies.floor.layers.find(
        (layer) => layer.role === "exterior-panel"
      )?.thicknessMm ?? 0;
    return gc + (exteriorPanelMm + compiled.framing.frameProfileMm[1] / 2) / 1000;
  })();

  const floorJoists = compiled.linearParts
    .filter(
      (part) =>
        part.wall === "floor" &&
        part.id.startsWith("floor-joist-") &&
        typeof part.positionMm === "number"
    )
    .map((part) => (
      <Box
        key={part.id}
        position={[
          w / 2,
          floorFrameCenterY,
          (part.positionMm ?? 0) / 1000
        ]}
        size={[
          part.lengthMm / 1000,
          profileDepth,
          profileFace
        ]}
        color={assumedColor}
      />
    ));

  const roofExteriorPanelMm =
    compiled.assemblies.roof.layers.find(
      (layer) => layer.role === "exterior-panel"
    )?.thicknessMm ?? 0;
  const roofInsulationMm =
    compiled.assemblies.roof.layers.find(
      (layer) => layer.role === "insulation"
    )?.thicknessMm ?? 0;
  const roofFrameNormalDepthM =
    (roofExteriorPanelMm + roofInsulationMm / 2) / 1000;
  const roofFrameCenterY =
    gc +
    (model.dimensions.frontHeightMm + model.dimensions.rearHeightMm) / 2000 -
    roofFrameNormalDepthM * Math.cos(compiled.roof.angleRad);
  const roofFrameCenterZ =
    d / 2 -
    roofFrameNormalDepthM * Math.sin(compiled.roof.angleRad);

  const roofRafters = compiled.linearParts
    .filter(
      (part) =>
        part.wall === "roof" &&
        part.id.startsWith("roof-rafter-") &&
        typeof part.positionMm === "number"
    )
    .map((part) => (
      <mesh
        key={part.id}
        position={[
          (part.positionMm ?? 0) / 1000,
          roofFrameCenterY,
          roofFrameCenterZ
        ]}
        rotation={[compiled.roof.angleRad, 0, 0]}
        castShadow
      >
        <boxGeometry
          args={[
            profileFace,
            profileDepth,
            part.lengthMm / 1000
          ]}
        />
        <meshStandardMaterial color={assumedColor} roughness={0.78} />
      </mesh>
    ));

  const sideTopLength = compiled.joinery.sideTopSlopeLengthMm / 1000;
  const sideTopY =
    gc +
    floorT +
    (sideFrontHeight + sideRearHeight) / 2 -
    profileFace / 2;
  const sideTopZ = (sideStartZ + sideEndZ) / 2;

  return (
    <group>
      <BaseSupportSystem compiled={compiled} />

      <Box position={[profileFace / 2, floorFrameCenterY, d / 2]} size={[profileFace, profileDepth, d]} color={frameColor} />
      <Box position={[w - profileFace / 2, floorFrameCenterY, d / 2]} size={[profileFace, profileDepth, d]} color={frameColor} />
      <Box position={[w / 2, floorFrameCenterY, profileFace / 2]} size={[Math.max(0.05, w - 2 * profileFace), profileDepth, profileFace]} color={frameColor} />
      <Box position={[w / 2, floorFrameCenterY, d - profileFace / 2]} size={[Math.max(0.05, w - 2 * profileFace), profileDepth, profileFace]} color={frameColor} />
      {floorJoists}

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
        position={[w / 2, gc + floorT + frontStudHeight - profileFace / 2, wallInset]}
        size={[w, profileFace, profileDepth]}
        color={frameColor}
      />
      <Box
        position={[w / 2, gc + floorT + profileFace / 2, d - wallInset]}
        size={[w, profileFace, profileDepth]}
        color={frameColor}
      />
      <Box
        position={[w / 2, gc + floorT + rearStudHeight - profileFace / 2, d - wallInset]}
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
        position={[wallInset, gc + floorT + profileFace / 2, sideTopZ]}
        size={[profileDepth, profileFace, sideRun]}
        color={frameColor}
      />
      <Box
        position={[w - wallInset, gc + floorT + profileFace / 2, sideTopZ]}
        size={[profileDepth, profileFace, sideRun]}
        color={frameColor}
      />

      {entranceVerticals}
      {entranceHeaders}
      {rearStuds}
      {sideStuds}
      {roofRafters}

      {compiled.layout.dividerPositionsXmm.map((positionMm, index) => (
        <SidePanel
          key={`frame-divider-${index + 1}`}
          depth={Math.max(0.05, d - 2 * compiled.construction.wallThicknessMm / 1000)}
          frontHeight={Math.max(0.05, compiled.internal.frontHeightMm / 1000)}
          rearHeight={Math.max(0.05, compiled.internal.rearHeightMm / 1000)}
          thickness={model.layout.dividerThicknessMm / 1000}
          position={[
            (positionMm + model.layout.dividerThicknessMm / 2) / 1000,
            gc + floorT,
            compiled.construction.wallThicknessMm / 1000
          ]}
        />
      ))}
    </group>
  );
}

function Shelter({compiled, mode}: {compiled: CompiledShelterModel; mode: ViewMode}) {
  const model = compiled.model;
  const w = model.dimensions.widthMm / 1000;
  const d = model.dimensions.depthMm / 1000;
  const hf = model.dimensions.frontHeightMm / 1000;
  const hr = model.dimensions.rearHeightMm / 1000;
  const gc = model.dimensions.groundClearanceMm / 1000;

  const construction = compiled.construction;
  const wallT = construction.wallThicknessMm / 1000;
  const floorT = construction.floorThicknessMm / 1000;
  const roofT = construction.roofThicknessMm / 1000;
  const avgH = (hf + hr) / 2;
  const roof = compiled.roof;
  const roofPanel = compiled.roofPanel;
  const roofLength = roofPanel.panelLengthMm / 1000;
  const roofWidth = roofPanel.panelWidthMm / 1000;
  const roofCenterZ = d / 2 + roofPanel.centerPlanOffsetMm / 1000;
  const roofCenterY =
    gc +
    avgH -
    (roofT * Math.cos(roof.angleRad)) / 2 +
    roofPanel.centerHeightOffsetMm / 1000;
  const layout = compiled.layout;
  const wallRearHeight = compiled.interfaces.wallRearHeightMm / 1000;
  const sideDepth = Math.max(0.05, compiled.joinery.sideRunMm / 1000);
  const sideFrontHeight = Math.max(0.05, compiled.joinery.sideFrontHeightMm / 1000);
  const sideRearHeight = Math.max(0.05, compiled.joinery.sideRearHeightMm / 1000);
  const sideStartZ = compiled.joinery.sideStartZmm / 1000;
  const dividerDepth = Math.max(0.05, compiled.joinery.internalDepthMm / 1000);
  const dividerFrontHeight = Math.max(0.05, compiled.internal.frontHeightMm / 1000);
  const dividerRearHeight = Math.max(0.05, compiled.internal.rearHeightMm / 1000);

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
      <BaseSupportSystem compiled={compiled} />

      <Box
        position={[w / 2, gc + floorT / 2 + floorOffset, d / 2]}
        size={[w, floorT, d]}
        color="#a66f42"
      />

      <FrontPanel
        compiled={compiled}
        thickness={wallT}
        position={[0, gc + floorT, -wallOffset]}
      />

      <Box
        position={[
          w / 2,
          gc + floorT + wallRearHeight / 2,
          d - wallT / 2 + wallOffset
        ]}
        size={[w, wallRearHeight, wallT]}
        color="#a97046"
      />

      <SidePanel
        depth={sideDepth}
        frontHeight={sideFrontHeight}
        rearHeight={sideRearHeight}
        thickness={wallT}
        position={[wallT - wallOffset, gc + floorT, sideStartZ]}
      />
      <SidePanel
        depth={sideDepth}
        frontHeight={sideFrontHeight}
        rearHeight={sideRearHeight}
        thickness={wallT}
        position={[w + wallOffset, gc + floorT, sideStartZ]}
      />

      {layout.dividerPositionsXmm.map((positionMm, index) => (
        <SidePanel
          key={`divider-${index + 1}`}
          depth={dividerDepth}
          frontHeight={dividerFrontHeight}
          rearHeight={dividerRearHeight}
          thickness={model.layout.dividerThicknessMm / 1000}
          position={[(positionMm + model.layout.dividerThicknessMm / 2) / 1000, gc + floorT, sideStartZ]}
        />
      ))}

      {compiled.heating.zones.map((zone) => (
        <Box
          key={zone.id}
          position={[
            (zone.xMm + zone.widthMm / 2) / 1000,
            gc + floorT + 0.002,
            (zone.zMm + zone.depthMm / 2) / 1000
          ]}
          size={[
            zone.widthMm / 1000,
            0.003,
            zone.depthMm / 1000
          ]}
          color="#b95c45"
          opacity={0.38}
        />
      ))}

      {mode !== "roof-off" && (
        <mesh
          position={[w / 2, roofCenterY + roofOffset, roofCenterZ]}
          rotation={[roof.angleRad, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[roofWidth, roofT, roofLength]} />
          <meshStandardMaterial color="#333b3b" roughness={0.82} metalness={0.08} />
        </mesh>
      )}
        </>
      )}
    </group>
  );
}

export function ShelterViewer({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const model = compiled.model;
  const [mode, setMode] = useState<ViewMode>("assembled");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const widthM = model.dimensions.widthMm / 1000;
  const depthM = model.dimensions.depthMm / 1000;
  const heightM = (model.dimensions.frontHeightMm + model.dimensions.groundClearanceMm) / 1000;
  const maxSpan = Math.max(widthM, depthM, heightM);
  const inspectionSpan = Math.max(widthM, depthM + heightM * 0.65);
  const cameraPosition: [number, number, number] = [
    maxSpan * 1.7,
    Math.max(1.15, heightM * 1.65),
    -maxSpan * 2.2
  ];
  const orbitTarget: [number, number, number] = [0, heightM * 0.43, 0];

  return (
    <div className="viewer" role="group" aria-label={`${locale === "sr" ? "3D prikaz" : "3D preview"}: ${model.translations[locale].name}`}>
      <Canvas camera={{position: cameraPosition, fov: 35}} dpr={[1, 1.75]} shadows aria-hidden="true">
        <color attach="background" args={["#e9e4d9"]} />
        <hemisphereLight args={["#fff8eb", "#a49b8e", 2]} />
        <directionalLight position={[-3, 7, -5]} intensity={2.8} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[4, 3, 5]} intensity={0.8} />
        <Shelter compiled={compiled} mode={mode} />
        <ModeCamera mode={mode} cameraPreset={cameraPreset} maxSpan={maxSpan} inspectionSpan={inspectionSpan} targetY={orbitTarget[1]} defaultPosition={cameraPosition} />
        <ContactShadows position={[0, -0.015, 0]} opacity={0.3} scale={maxSpan * 3} blur={2.2} far={maxSpan * 2} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={maxSpan * 0.85}
          maxDistance={maxSpan * 4}
          target={orbitTarget}
          maxPolarAngle={Math.PI * 0.48}
        />
      </Canvas>

      <div className="viewer-toolbar" role="group" aria-label={locale === "sr" ? "Kontrole 3D prikaza" : "3D view controls"}>
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
            onClick={() => {
              setMode(value);
              setCameraPreset("isometric");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="viewer-angle-control">
        <span>{locale === "sr" ? "Ugao kamere" : "Camera angle"}</span>
        <select
          aria-label={locale === "sr" ? "Ugao kamere" : "Camera angle"}
          value={cameraPreset}
          onChange={(event) => setCameraPreset(event.currentTarget.value as CameraPreset)}
        >
          <option value="isometric">{locale === "sr" ? "Izometrija" : "Isometric"}</option>
          <option value="front">{locale === "sr" ? "Napred" : "Front"}</option>
          <option value="rear">{locale === "sr" ? "Pozadi" : "Rear"}</option>
          <option value="left">{locale === "sr" ? "Levo" : "Left"}</option>
          <option value="right">{locale === "sr" ? "Desno" : "Right"}</option>
          <option value="top">{locale === "sr" ? "Odozgo" : "Top"}</option>
        </select>
      </label>

      <div className="viewer-caption">
        <span>{locale === "sr" ? "Interaktivni 3D model" : "Interactive 3D model"}</span>
        <strong>{model.dimensions.widthMm} × {model.dimensions.depthMm} × {model.dimensions.frontHeightMm} mm</strong>
        {mode === "frame" && <small>
          {locale === "sr" ? "Zeleno: okvir · oker: PROVISIONAL raspored" : "Green: frame · ochre: PROVISIONAL layout"}
        </small>}
        {model.heated && mode === "roof-off" && <small>
          {locale === "sr" ? "Crveno: rezervisana zona, bez grejnog uređaja" : "Red: reserved zone, no heating device shown"}
        </small>}
      </div>
      <div className="viewer-badge">{locale === "sr" ? "Prevuci za rotaciju · točkić za uvećanje" : "Drag to rotate · scroll to zoom"}</div>
    </div>
  );
}
