"use client";

import { useEffect, useRef, useState } from "react";

const initialLogs = [
  "[SYS_INIT] Kernel dispatch initialized. Node clusters responding.",
  "[SYNAPSE_PACT] Neural telemetry pipeline listening on port 5000.",
  "[SPATIAL_3D] GLTF / Mesh runtime compiled with 0 draw errors.",
  "[INGEST] Webhook stream registered for Polar / PayMongo settle hooks.",
  "[COMPUTE] Pipeline allocated 7,500 token buffer for BIM synthesis.",
  "[LIDAR_MESH] Point cloud voxelization active at 0.05m tolerance.",
];

export default function ComputeLogViewer() {
  const [logs, setLogs] = useState<string[]>(initialLogs);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = new Date().toISOString().substring(11, 19);
      const operations = [
        `[HEARTBEAT] GPU queue tick complete (${Math.floor(Math.random() * 15 + 10)}ms)`,
        `[INGEST] Voxel buffer synced to client viewport.`,
        `[SYNAPSE_PACT] Margin telemetry verified: Concession delta 0.00%`,
        `[SECURITY] Inbound handshake verified via Supabase Auth Gateway.`,
      ];
      const randomOp = operations[Math.floor(Math.random() * operations.length)];
      setLogs((prev) => [...prev.slice(-15), `${timestamp} ${randomOp}`]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="border border-cyan-500/30 rounded-xl bg-slate-950 p-4 font-mono text-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
        <span className="text-cyan-400 font-bold uppercase tracking-wider">compute_load_v3.log</span>
        <span className="text-slate-500 text-[10px] uppercase">STREAM ACTIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-48 text-[11px] text-slate-300 scrollbar-thin scrollbar-thumb-cyan-500/20">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-cyan-500/70 select-none">&gt;</span>
            <span className="leading-relaxed">{log}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}