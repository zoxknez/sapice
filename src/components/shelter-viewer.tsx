"use client";

import {Canvas} from "@react-three/fiber";
import {ContactShadows, OrbitControls} from "@react-three/drei";
import type {ShelterModel} from "@/lib/domain";
import {roofSlope} from "@/lib/engineering";

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

function Shelter({model}: {model: ShelterModel}) {
  const w = model.dimensions.widthMm / 1000;
  const d = model.dimensions.depthMm / 1000;
  const hf = model.dimensions.frontHeightMm / 1000;
  const hr = model.dimensions.rearHeightMm / 1000;
  const gc = model.dimensions.groundClearanceMm / 1000;
  const t = Math.min(model.construction.wallThicknessMm / 1000, 0.08);
  const avgH = (hf + hr) / 2;
  const roof = roofSlope(model);
  const roofLength = roof.trueLengthMm / 1000;
  const entranceW = model.layout.entranceWidthMm / 1000;
  const entranceH = model.layout.entranceHeightMm / 1000;

  return (
    <group position={[-w / 2, 0, -d / 2]}>
      <Box position={[w / 2, gc / 2, d / 2]} size={[w, gc, d]} color="#51463a" />
      <Box position={[w / 2, gc + 0.045, d / 2]} size={[w, 0.09, d]} color="#a66f42" />

      <Box position={[t / 2, gc + avgH / 2, d / 2]} size={[t, avgH, d]} color="#b98050" />
      <Box position={[w - t / 2, gc + avgH / 2, d / 2]} size={[t, avgH, d]} color="#b98050" />
      <Box position={[w / 2, gc + hf / 2, t / 2]} size={[w, hf, t]} color="#c18a57" />
      <Box position={[w / 2, gc + hr / 2, d - t / 2]} size={[w, hr, t]} color="#a97046" />

      {Array.from({length: model.layout.entrances}).map((_, index) => {
        const spacing = w / (model.layout.entrances + 1);
        return (
          <Box
            key={index}
            position={[spacing * (index + 1), gc + entranceH / 2 + 0.08, -0.006]}
            size={[entranceW, entranceH, 0.014]}
            color="#201d1a"
          />
        );
      })}

      {model.layout.chambers > 1 && (
        <Box
          position={[w / 2, gc + avgH * 0.45, d / 2]}
          size={[t * 0.8, avgH * 0.78, d * 0.82]}
          color="#d4ad82"
          opacity={0.72}
        />
      )}

      {model.heated && (
        <Box
          position={[w * 0.3, gc + 0.105, d * 0.62]}
          size={[w * 0.34, 0.018, d * 0.36]}
          color="#b95c45"
        />
      )}

      <mesh
        position={[w / 2, gc + (hf + hr) / 2 + 0.035, d / 2]}
        rotation={[-roof.angleRad, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w + 0.14, 0.06, roofLength + 0.18]} />
        <meshStandardMaterial color="#5d554c" roughness={0.92} />
      </mesh>
    </group>
  );
}

export function ShelterViewer({model}: {model: ShelterModel}) {
  return (
    <div className="viewer" aria-label={`3D preview: ${model.translations.en.name}`}>
      <Canvas camera={{position: [2.25, 1.6, 2.55], fov: 38}} dpr={[1, 1.5]} shadows>
        <color attach="background" args={["#eee9e0"]} />
        <ambientLight intensity={1.45} />
        <directionalLight position={[3, 5, 2]} intensity={2.2} castShadow />
        <Shelter model={model} />
        <ContactShadows position={[0, -0.02, 0]} opacity={0.28} scale={5} blur={2.5} far={4} />
        <OrbitControls makeDefault enablePan={false} minDistance={1.6} maxDistance={5} />
      </Canvas>
      <div className="viewer-badge">WebGL · parametric preview</div>
    </div>
  );
}
