"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Line, Html } from "@react-three/drei";
import * as THREE from "three";

interface LayerVisibility {
  slabs: boolean;
  curtainWalls: boolean;
  columns: boolean;
  trusses: boolean;
}

interface LidarViewportProps {
  layers: LayerVisibility;
  renderMode: "POINT_CLOUD" | "WIREFRAME" | "AI_PASS";
}

function StructuralBIMModel({ layers, renderMode }: LidarViewportProps) {
  const isPointCloud = renderMode === "POINT_CLOUD";
  const isWireframe = renderMode === "WIREFRAME";

  // Material selectors based on active rendering pass
  const getMaterial = (color: string, opacity = 1) => {
    if (isPointCloud) {
      return (
        <pointsMaterial
          size={0.06}
          color={color}
          transparent
          opacity={0.85}
        />
      );
    }
    return (
      <meshStandardMaterial
        color={color}
        wireframe={isWireframe}
        roughness={0.2}
        metalness={0.7}
        transparent={opacity < 1}
        opacity={opacity}
      />
    );
  };

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Structural Columns */}
      {layers.columns && (
        <group>
          {[
            [-2, 0, -2],
            [2, 0, -2],
            [-2, 0, 2],
            [2, 0, 2],
            [0, 0, -2],
            [0, 0, 2],
          ].map((pos, i) => (
            <mesh key={`col-${i}`} position={[pos[0], 1.25, pos[2]]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 2.5, 16]} />
              {getMaterial("#38bdf8")}
            </mesh>
          ))}
        </group>
      )}

      {/* 2. Slabs (Ground Floor & Second Level) */}
      {layers.slabs && (
        <group>
          {/* Ground Foundation Slab */}
          <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[5.2, 0.15, 5.2]} />
            {getMaterial("#1e293b")}
          </mesh>
          {/* Level 2 Floor Slab */}
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 0.15, 5.2]} />
            {getMaterial("#334155")}
          </mesh>
        </group>
      )}

      {/* 3. Curtain Walls / Glazing System */}
      {layers.curtainWalls && (
        <group>
          <mesh position={[0, 1.25, 2.4]}>
            <boxGeometry args={[4.8, 2.3, 0.05]} />
            {getMaterial("#00f0ff", 0.45)}
          </mesh>
          <mesh position={[-2.4, 1.25, 0]}>
            <boxGeometry args={[0.05, 2.3, 4.8]} />
            {getMaterial("#00f0ff", 0.45)}
          </mesh>
        </group>
      )}

      {/* 4. Roof Truss & Cantilever */}
      {layers.trusses && (
        <group position={[0, 2.8, 0]}>
          <mesh position={[0.5, 0.5, 0]}>
            <boxGeometry args={[3.5, 0.8, 4.5]} />
            {getMaterial("#0284c7", 0.6)}
          </mesh>
        </group>
      )}

      {/* 5. Spatial Dimension Caliper Anchors & Monospace Badges */}
      <group>
        {/* Caliper 1: Height Measurement */}
        <Line
          points={[
            [2.8, 0, 2.8],
            [2.8, 2.5, 2.8],
          ]}
          color="#00f0ff"
          lineWidth={1.5}
          dashed
        />
        <Html position={[2.9, 1.25, 2.8]} center>
          <div className="bg-slate-950/90 border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 pointer-events-none whitespace-nowrap shadow-lg shadow-cyan-500/20">
            29.0 MM
          </div>
        </Html>

        {/* Caliper 2: Span Measurement */}
        <Line
          points={[
            [-2.6, 2.6, 2.6],
            [2.6, 2.6, 2.6],
          ]}
          color="#00f0ff"
          lineWidth={1.5}
        />
        <Html position={[0, 2.9, 2.6]} center>
          <div className="bg-slate-950/90 border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 pointer-events-none whitespace-nowrap shadow-lg shadow-cyan-500/20">
            76.0.9000 AS
          </div>
        </Html>
      </group>
    </group>
  );
}

export default function LidarViewport({ layers, renderMode }: LidarViewportProps) {
  return (
    <div className="w-full h-full relative bg-slate-950">
      <Canvas camera={{ position: [8, 7, 8], fov: 38 }} shadows className="w-full h-full">
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[12, 18, 12]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-6, 6, -6]} intensity={0.6} color="#00f0ff" />

        <StructuralBIMModel layers={layers} renderMode={renderMode} />

        <Grid
          position={[0, -0.1, 0]}
          args={[14, 14]}
          cellColor="#0f172a"
          sectionColor="#00f0ff"
          sectionSize={1.5}
          fadeDistance={22}
          fadeStrength={1.5}
        />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}