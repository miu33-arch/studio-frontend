'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  url: string;
}

function DynamicGlbModel({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  return (
    <Center top>
      <primitive object={scene} scale={2.5} />
    </Center>
  );
}

interface RoomMeshProps {
  position: [number, number, number];
  size: [number, number, number];
  name: string;
  category: string;
  dimensions: string;
  materialName: string;
  isTargeted: boolean;
  onHover: (info: any) => void;
  onLeave: () => void;
}

function HouseElement({
  position,
  size,
  name,
  category,
  dimensions,
  materialName,
  isTargeted,
  onHover,
  onLeave,
}: RoomMeshProps) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || isTargeted;

  return (
    <mesh
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover({ name, category, dimensions, materialName });
      }}
      onPointerOut={() => {
        setHovered(false);
        onLeave();
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={active ? '#06b6d4' : '#1e293b'}
        emissive={active ? '#0891b2' : '#000000'}
        emissiveIntensity={active ? 0.8 : 0}
        roughness={0.4}
        metalness={0.6}
        wireframe={active}
      />
    </mesh>
  );
}

function InteractiveWireframeLayout({
  selectedElementTarget,
  onHover,
  onLeave,
}: {
  selectedElementTarget: string;
  onHover: (data: any) => void;
  onLeave: () => void;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Foundation & Base Concrete Plinth (9.0m x 6.8m) */}
      <HouseElement
        position={[0, -0.2, 0]}
        size={[9.0, 0.4, 6.8]}
        name="Foundation Concrete Plinth"
        category="Substructure Slab"
        dimensions="9.0m x 6.8m x 0.4m (61.2 sqm)"
        materialName="Reinforced Concrete Grade 30"
        isTargeted={selectedElementTarget === 'Slab'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Master Bedroom (B1) */}
      <HouseElement
        position={[2.5, 0.75, 1.8]}
        size={[3.0, 1.5, 2.4]}
        name="Master Bedroom (B1)"
        category="Habitable Room"
        dimensions="3.0m x 2.4m (7.2 sqm)"
        materialName="Hardwood Flooring / Plasterboard Walls"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Bedroom 2 (B2) */}
      <HouseElement
        position={[-2.8, 0.75, -1.8]}
        size={[2.6, 1.5, 2.4]}
        name="Bedroom 2 (B2)"
        category="Habitable Room"
        dimensions="2.6m x 2.4m (6.2 sqm)"
        materialName="Engineered Timber Flooring"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Bedroom 3 (B3) */}
      <HouseElement
        position={[-2.8, 0.75, 1.8]}
        size={[2.6, 1.5, 2.4]}
        name="Bedroom 3 (B3)"
        category="Habitable Room"
        dimensions="2.6m x 2.4m (6.2 sqm)"
        materialName="Engineered Timber Flooring"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Comfort Room / Bath (CR) */}
      <HouseElement
        position={[-2.8, 0.75, 0]}
        size={[2.6, 1.5, 1.0]}
        name="Comfort Room (CR / Bath)"
        category="Sanitary Area"
        dimensions="2.6m x 1.0m (2.6 sqm)"
        materialName="Ceramic Tile Finish"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Kitchen & Pantry */}
      <HouseElement
        position={[0, 0.75, -2.0]}
        size={[2.6, 1.5, 2.0]}
        name="Kitchen & Counter Zone"
        category="Service Zone"
        dimensions="2.6m x 2.0m (5.2 sqm)"
        materialName="Granite Top & Porcelain Tiles"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Living & Dining Area */}
      <HouseElement
        position={[1.5, 0.75, -0.6]}
        size={[4.2, 1.5, 3.8]}
        name="Living & Dining Lounge"
        category="Open Plan Living"
        dimensions="4.2m x 3.8m (15.9 sqm)"
        materialName="Polished Concrete & Teak Paneling"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Exposed Timber Roof Trusses */}
      <HouseElement
        position={[0, 2.3, 0]}
        size={[8.8, 0.8, 6.4]}
        name="Exposed Timber Roof Truss Framing"
        category="Roof Structure"
        dimensions="8.8m x 6.4m Pitched Truss"
        materialName="Treated Structural Timber / Slate Tile"
        isTargeted={selectedElementTarget === 'CurtainWall' || selectedElementTarget === 'Column'}
        onHover={onHover}
        onLeave={onLeave}
      />
    </group>
  );
}

interface CadProps {
  modelUrl?: string | null;
  selectedElementTarget?: string;
  moodPreset?: string;
  hasExecuted?: boolean;
}

export default function CadViewer3D({
  modelUrl,
  selectedElementTarget = 'Wall',
  moodPreset = 'cyber_dusk',
  hasExecuted = false,
}: CadProps) {
  const [hoveredData, setHoveredData] = useState<any>(null);

  return (
    <div className="relative w-full h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
      {/* 🏷️ Status Badges */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${hasExecuted ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
        <span className="text-cyan-400 font-bold">
          {modelUrl
            ? 'AI 3D Reconstructed Mesh (.GLB)'
            : hasExecuted
            ? 'Active Parametric BIM Wireframe'
            : 'Standby // Awaiting Synthesize Command'}
        </span>
      </div>

      {!hasExecuted && (
        <div className="absolute z-10 text-center pointer-events-none bg-slate-950/70 p-4 rounded-xl border border-slate-800/60 backdrop-blur-sm">
          <p className="text-xs font-mono text-cyan-400 font-bold">3D BIM Viewport Standby</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">Configure directives above and click "Synthesize Output"</p>
        </div>
      )}

      {/* 🏷️ Dynamic HUD Tooltip (Only when executed and hovering wireframe elements) */}
      {hoveredData && !modelUrl && hasExecuted && (
        <div className="absolute top-14 left-4 z-10 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 p-3.5 rounded-lg text-xs font-mono shadow-2xl pointer-events-none">
          <p className="text-cyan-400 font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            {hoveredData.name}
          </p>
          <div className="text-slate-400 mt-1.5 space-y-0.5 text-[11px]">
            <p>Category: <span className="text-slate-200">{hoveredData.category}</span></p>
            <p>Dimensions / Area: <span className="text-slate-200">{hoveredData.dimensions}</span></p>
            <p>Material Spec: <span className="text-emerald-400">{hoveredData.materialName}</span></p>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 pointer-events-none">
        Orbit: Left Click | Pan: Right Click | Zoom: Scroll
      </div>

      <Canvas camera={{ position: [9, 10, 9], fov: 42 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[12, 18, 10]} intensity={1.8} color="#e0f2fe" />
        <pointLight position={[-8, 6, -8]} intensity={0.6} color="#38bdf8" />

        <Suspense fallback={null}>
          {hasExecuted && (
            modelUrl ? (
              <DynamicGlbModel url={modelUrl} />
            ) : (
              <InteractiveWireframeLayout
                selectedElementTarget={selectedElementTarget}
                onHover={setHoveredData}
                onLeave={() => setHoveredData(null)}
              />
            )
          )}
          <Environment preset="city" />
        </Suspense>

        <Grid position={[0, -0.41, 0]} args={[18, 18]} cellColor="#1e293b" sectionColor="#06b6d4" />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}