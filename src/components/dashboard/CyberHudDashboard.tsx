"use client";

import NodeStatusGrid from "./NodeStatusGrid";
import TelemetryWaveform from "./TelemetryWaveform";
import ComputeLogViewer from "./ComputeLogViewer";

export default function CyberHudDashboard() {
  return (
    <div className="w-full space-y-4">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between p-4 border border-cyan-500/30 rounded-xl bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold">
            HUD_V3
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-white tracking-wide">
              CYBER-BRUTALIST HUD TELEMETRY
            </h2>
            <p className="font-mono text-[11px] text-slate-400">
              Autonomous node health, real-time compute frequencies, and live engine tailing.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded bg-slate-900">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          GATEWAY: ONLINE
        </div>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NodeStatusGrid />
        <TelemetryWaveform />
        <div className="lg:col-span-2">
          <ComputeLogViewer />
        </div>
      </div>
    </div>
  );
}