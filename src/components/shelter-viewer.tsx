"use client";

import {useMemo, useState} from "react";
import * as THREE from "three";
import {Canvas} from "@react-three/fiber";
import {ContactShadows, OrbitControls} from "@react-three/drei";
import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";

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
  const roofT = compiled.construction.roofThicknessMm / 1000;
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
            positionMm / 1000,
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
  const wallFrontHeight = compiled.interfaces.wallFrontHeightMm / 1000;
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
          position={[positionMm / 1000, gc + floorT, sideStartZ]}
        />
      ))}

      {compiled.heating.zones.map((zone) => (
        <Box
          key={zone.id}
          position={[
            (zone.xMm + zone.widthMm / 2) / 1000,
            gc + floorT + 0.012,
            (zone.zMm + zone.depthMm / 2) / 1000
          ]}
          size={[
            zone.widthMm / 1000,
            0.018,
            zone.depthMm / 1000
          ]}
          color="#b95c45"
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
          <meshStandardMaterial color="#5d554c" roughness={0.92} />
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
        <Shelter compiled={compiled} mode={mode} />
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
