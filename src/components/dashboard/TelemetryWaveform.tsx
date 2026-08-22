"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const telemetryData = [
  { time: "00:01", load: 24, frequency: 45 },
  { time: "00:02", load: 48, frequency: 62 },
  { time: "00:03", load: 35, frequency: 58 },
  { time: "00:04", load: 78, frequency: 89 },
  { time: "00:05", load: 62, frequency: 72 },
  { time: "00:06", load: 88, frequency: 95 },
  { time: "00:07", load: 45, frequency: 60 },
  { time: "00:08", load: 92, frequency: 98 },
  { time: "00:09", load: 68, frequency: 75 },
];

export default function TelemetryWaveform() {
  return (
    <div className="border border-cyan-500/30 rounded-xl bg-slate-950 p-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
        <span className="text-cyan-400 font-bold uppercase tracking-wider">Live System Frequency & Compute</span>
        <span className="text-cyan-400 font-mono text-[10px]">AVG_LOAD: 67.8%</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={telemetryData}>
            <defs>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderColor: "#00f0ff40",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            />
            <Area
              type="monotone"
              dataKey="frequency"
              stroke="#00f0ff"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cyanGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}