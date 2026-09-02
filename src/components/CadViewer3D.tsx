'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, useGLTF, Center } from '@react-three/drei';
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

function ArchitecturalZone({
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
    <group position={position}>
      <mesh
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
          color={active ? '#06b6d4' : '#0f172a'}
          emissive={active ? '#0891b2' : '#0284c7'}
          emissiveIntensity={active ? 0.7 : 0.15}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>
      <Html position={[0, size[1] / 2 + 0.1, 0]} center distanceFactor={12}>
        <div className="px-2 py-0.5 bg-slate-900/90 border border-cyan-500/60 rounded text-[9px] font-mono text-cyan-400 whitespace-nowrap shadow-lg pointer-events-none">
          {name}
        </div>
      </Html>
    </group>
  );
}

function DimensionedBlueprintLayout({
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
      <ArchitecturalZone
        position={[0, -0.2, 0]}
        size={[9.0, 0.3, 6.8]}
        name="Foundation Slab (9.0m x 6.8m)"
        category="Substructure"
        dimensions="9.0m x 6.8m (61.2 sqm)"
        materialName="Polished Obsidian Concrete"
        isTargeted={selectedElementTarget === 'Slab'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[-3.0, 0.75, -2.15]}
        size={[3.0, 1.4, 2.5]}
        name="B2 (Bedroom 2)"
        category="Habitable Room"
        dimensions="3.0m x 2.5m (7.5 sqm)"
        materialName="Obsidian Timber Flooring"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[-3.0, 0.75, -0.55]}
        size={[1.8, 1.4, 1.0]}
        name="CR (Bathroom)"
        category="Sanitary Area"
        dimensions="1.8m x 1.0m (1.8 sqm)"
        materialName="Ceramic Tile Finish"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[-3.0, 0.75, 1.95]}
        size={[3.0, 1.4, 2.5]}
        name="B3 (Bedroom 3)"
        category="Habitable Room"
        dimensions="3.0m x 2.5m (7.5 sqm)"
        materialName="Obsidian Timber Flooring"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[0, 0.75, -2.15]}
        size={[3.0, 1.4, 2.5]}
        name="Kitchen & Utility"
        category="Service Zone"
        dimensions="3.0m x 2.5m (7.5 sqm)"
        materialName="Granite Top & Dark Cabinets"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[0, 0.75, 0.4]}
        size={[3.0, 1.4, 2.4]}
        name="Dining Area"
        category="Open Plan Living"
        dimensions="3.0m x 2.4m (7.2 sqm)"
        materialName="Polished Stone Floor"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[2.8, 0.75, -1.5]}
        size={[3.4, 1.4, 3.8]}
        name="Living Area"
        category="Open Plan Living"
        dimensions="3.4m x 3.8m (12.9 sqm)"
        materialName="Luxury Lounge Setup"
        isTargeted={selectedElementTarget === 'Wall'}
        onHover={onHover}
        onLeave={onLeave}
      />

      <ArchitecturalZone
        position={[2.8, 0.75, 1.9]}
        size={[3.4, 1.4, 3.0]}
        name="B1 (Master Bedroom + CR)"
        category="Habitable Room & Suite"
        dimensions="3.4m x 3.0m (10.2 sqm)"
        materialName="Dark Teak & Gold Accents"
        isTargeted={selectedElementTarget === 'Wall'}
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
    <div className="relative w-full h-105 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${hasExecuted ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
        <span className="text-cyan-400 font-bold">
          {modelUrl
            ? 'AI 3D Reconstructed Mesh (.GLB)'
            : hasExecuted
            ? 'Active MIU_33 Dimensioned Blueprint Model'
            : 'Standby // Awaiting Synthesize Command'}
        </span>
      </div>

      {!hasExecuted && (
        <div className="absolute z-10 text-center pointer-events-none bg-slate-950/70 p-4 rounded-xl border border-slate-800/60 backdrop-blur-sm">
          <p className="text-xs font-mono text-cyan-400 font-bold">3D BIM Viewport Standby</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">Configure directives above and click "Synthesize Output"</p>
        </div>
      )}

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
        <ambientLight intensity={0.8} />
        <directionalLight position={[12, 18, 10]} intensity={1.8} color="#e0f2fe" />
        <pointLight position={[-8, 6, -8]} intensity={0.6} color="#38bdf8" />

        <Suspense fallback={null}>
          {hasExecuted && (
            modelUrl ? (
              <DynamicGlbModel url={modelUrl} />
            ) : (
              <DimensionedBlueprintLayout
                selectedElementTarget={selectedElementTarget}
                onHover={setHoveredData}
                onLeave={() => setHoveredData(null)}
              />
            )
          )}
        </Suspense>

        <Grid position={[0, -0.41, 0]} args={[18, 18]} cellColor="#1e293b" sectionColor="#06b6d4" />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}