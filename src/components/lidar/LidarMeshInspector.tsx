"use client";

import { useState } from "react";
import LidarViewport from "./LidarViewport";
import { Box, Layers, Cpu, Maximize2 } from "lucide-react";

export default function LidarMeshInspector() {
  const [layers, setLayers] = useState({
    slabs: true,
    curtainWalls: true,
    columns: true,
    trusses: true,
  });

  const [renderMode, setRenderMode] = useState<"POINT_CLOUD" | "WIREFRAME" | "AI_PASS">("WIREFRAME");

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative w-full h-162.5 border border-cyan-500/30 rounded-xl overflow-hidden bg-slate-950 font-mono">
      {/* 3D WebGL / LiDAR Scene */}
      <LidarViewport layers={layers} renderMode={renderMode} />

      {/* Top Left Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="px-3 py-1.5 bg-slate-900/90 border border-cyan-500/40 rounded-lg text-xs text-cyan-400 font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-2 shadow-lg">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>3D LiDAR / MESH INSPECTOR</span>
        </div>
      </div>

      {/* Top Right Render Mode Passes */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/30 p-1 rounded-lg backdrop-blur-md">
        <button
          onClick={() => setRenderMode("POINT_CLOUD")}
          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
            renderMode === "POINT_CLOUD"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          RAW POINT CLOUD
        </button>
        <button
          onClick={() => setRenderMode("WIREFRAME")}
          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
            renderMode === "WIREFRAME"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          WIREFRAME CAGE
        </button>
        <button
          onClick={() => setRenderMode("AI_PASS")}
          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
            renderMode === "AI_PASS"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          AI RENDER PASS
        </button>
      </div>

      {/* Left Layer Visibility Controller */}
      <div className="absolute top-16 left-4 z-10 w-52 bg-slate-900/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md space-y-3">
        <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider pb-1.5 border-b border-cyan-500/20 flex items-center justify-between">
          <span>STRUCTURAL LAYERS</span>
          <Cpu className="w-3.5 h-3.5" />
        </div>

        <div className="space-y-2 text-xs">
          {[
            { key: "slabs", label: "SLABS / FOUNDATION" },
            { key: "curtainWalls", label: "CURTAIN WALLS" },
            { key: "columns", label: "STRUCTURAL COLUMNS" },
            { key: "trusses", label: "CANTILEVER / TRUSS" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between cursor-pointer group select-none text-[11px] text-slate-300 hover:text-white"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={layers[item.key as keyof typeof layers]}
                onChange={() => toggleLayer(item.key as keyof typeof layers)}
                className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Bottom Right Telemetry Specs */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 border border-cyan-500/30 px-3.5 py-2.5 rounded-lg text-[11px] text-cyan-400/90 space-y-0.5 backdrop-blur-md pointer-events-none">
        <div>VOXEL DENSITY: <span className="text-white font-bold">0.05m³</span></div>
        <div>CALIPER SPAN: <span className="text-white font-bold">76.0.9000 AS</span></div>
        <div>AXIAL ELEVATION: <span className="text-white font-bold">29.0 MM</span></div>
      </div>
    </div>
  );
}