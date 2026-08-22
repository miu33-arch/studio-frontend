"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";
import { GestureTelemetry } from "@/hooks/useHandGesture";

interface ViewportProps {
  telemetry: GestureTelemetry;
  customModelUrl: string | null;
}

// Sub-component to load user uploaded GLB / GLTF models
function DynamicUploadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.5} position={[0, 0, 0]} />;
}

// Default Procedural Architectural Structure
function DefaultArchitecturalStructure({ telemetry }: { telemetry: GestureTelemetry }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Base Terrain Slab */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[6, 0.4, 6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Main Ground Floor Volume */}
      <mesh position={[-0.5, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.4, 3.5]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Cantilevered 2nd Floor Volume */}
      <mesh position={[0.6, 1.8, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.2, 2.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Architectural Glass Slit / Cyan Accent */}
      <mesh position={[0.6, 1.8, 0.72]}>
        <boxGeometry args={[2.6, 0.3, 0.05]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.6}
          roughness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Dynamic Interaction Raycast Marker */}
      {telemetry.gesture === "PINCH/DRAG" && (
        <mesh position={[(telemetry.coords.x - 0.5) * 4, (0.5 - telemetry.coords.y) * 4 + 1.5, 1.5]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" wireframe />
        </mesh>
      )}
    </group>
  );
}

function RotatableStage({ telemetry, customModelUrl }: ViewportProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0.3, y: -0.6 });

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (telemetry.gesture === "PINCH/DRAG") {
        targetRotation.current.y = (telemetry.coords.x - 0.5) * Math.PI * 2;
        targetRotation.current.x = (telemetry.coords.y - 0.5) * Math.PI;
      }
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotation.current.y,
        4,
        delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetRotation.current.x,
        4,
        delta
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        {customModelUrl ? (
          <DynamicUploadedModel url={customModelUrl} />
        ) : (
          <DefaultArchitecturalStructure telemetry={telemetry} />
        )}
      </Suspense>
    </group>
  );
}

export default function SpatialViewport({ telemetry, customModelUrl }: ViewportProps) {
  return (
    <div className="w-full h-full relative bg-slate-950">
      <Canvas camera={{ position: [6, 5, 6], fov: 35 }} shadows className="w-full h-full">
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#38bdf8" />

        <RotatableStage telemetry={telemetry} customModelUrl={customModelUrl} />

        <Grid
          position={[0, -0.41, 0]}
          args={[14, 14]}
          cellColor="#0f172a"
          sectionColor="#00f0ff"
          sectionSize={1.5}
          fadeDistance={20}
          fadeStrength={1.5}
        />
        <OrbitControls enableRotate={telemetry.gesture !== "PINCH/DRAG"} />
      </Canvas>
    </div>
  );
}