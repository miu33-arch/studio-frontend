"use client";

interface NodeData {
  id: string;
  status: "ACTIVE" | "IDLE" | "THROTTLED";
  latency: string;
  scope: string;
  type: string;
  reqSec: string;
}

const mockNodes: NodeData[] = [
  { id: "NODE_01", status: "ACTIVE", latency: "14ms", scope: "SPATIAL_3D", type: "GPU", reqSec: "1480/s" },
  { id: "NODE_02", status: "ACTIVE", latency: "18ms", scope: "SYNAPSE_PACT", type: "VPU", reqSec: "920/s" },
  { id: "NODE_03", status: "IDLE", latency: "2ms", scope: "LIDAR_MESH", type: "CPU", reqSec: "0/s" },
  { id: "NODE_04", status: "ACTIVE", latency: "24ms", scope: "VOICE_BRIDGE", type: "NPU", reqSec: "340/s" },
  { id: "NODE_05", status: "THROTTLED", latency: "112ms", scope: "MEDIA_EXPORT", type: "GPU", reqSec: "2100/s" },
];

export default function NodeStatusGrid() {
  return (
    <div className="border border-cyan-500/30 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300">
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 font-bold uppercase tracking-wider">Node Telemetry Matrix</span>
        </div>
        <span className="text-slate-500 text-[10px]">SYNC_RATE: 60Hz</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] border-b border-slate-800">
              <th className="pb-2">NODE ID</th>
              <th className="pb-2">STATUS</th>
              <th className="pb-2">LATENCY</th>
              <th className="pb-2">SCOPE</th>
              <th className="pb-2">HARDWARE</th>
              <th className="pb-2 text-right">THROUGHPUT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {mockNodes.map((node) => (
              <tr key={node.id} className="hover:bg-cyan-500/5 transition-colors">
                <td className="py-2.5 font-bold text-white">{node.id}</td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      node.status === "ACTIVE"
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        : node.status === "IDLE"
                        ? "bg-slate-800 text-slate-400 border border-slate-700"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {node.status}
                  </span>
                </td>
                <td className="py-2.5 text-cyan-300/80">{node.latency}</td>
                <td className="py-2.5 text-slate-400">{node.scope}</td>
                <td className="py-2.5 text-slate-300 font-bold">{node.type}</td>
                <td className="py-2.5 text-right font-mono text-cyan-400">{node.reqSec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}