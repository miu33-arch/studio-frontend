"use client";
import React, { useState } from "react";
import { dispatchTaskToGeMiu, AgentRunResponse } from "@/lib/gemiu";

interface GeMiuAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GeMiuAgentModal({ isOpen, onClose }: GeMiuAgentModalProps) {
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentRunResponse | null>(null);

  if (!isOpen) return null;

  const handleRun = async (overrideTask?: string) => {
    const query = overrideTask || task;
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dispatchTaskToGeMiu(query);
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to local agent runtime on port 5000.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs">
      <div className="bg-[#0b0f14] border border-[#1e293b] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-3 bg-[#070b10]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ffcc] animate-pulse" />
            <span className="text-xs font-bold text-[#00ffcc] tracking-wider uppercase">
              geMiu // SOVEREIGN AGENT DISPATCH
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            [ESC / CLOSE]
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-4 py-2 bg-[#090d12] border-b border-[#162330] flex items-center gap-2 overflow-x-auto">
          <span className="text-gray-500 text-[11px]">PRESETS:</span>
          <button
            onClick={() => {
              setTask("Classify 6063-T6 aluminum extrusion profile");
            }}
            className="px-2 py-1 bg-[#121c24] hover:bg-[#1c2e3d] text-cyan-400 rounded border border-cyan-900/60 whitespace-nowrap text-[11px]"
          >
            Classify Aluminum Profile
          </button>
          <button
            onClick={() => {
              setTask("Calculate landed cost for CIF 25000 SAR");
            }}
            className="px-2 py-1 bg-[#121c24] hover:bg-[#1c2e3d] text-emerald-400 rounded border border-emerald-900/60 whitespace-nowrap text-[11px]"
          >
            Landed Cost CIF 25k SAR
          </button>
          <button
            onClick={() => {
              setTask("Audit commercial invoice for FASAH pre-flight window (ETA 48h, Missing COO)");
            }}
            className="px-2 py-1 bg-[#121c24] hover:bg-[#1c2e3d] text-rose-400 rounded border border-rose-900/60 whitespace-nowrap text-[11px]"
          >
            Audit FASAH Pre-Flight (72h Hold)
          </button>
        </div>
        
        {/* Input Bar */}
        <div className="p-4 border-b border-[#1e293b] flex gap-2 bg-[#070b10]">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleRun()}
            placeholder="[TASK: Classify 6063-T6 aluminum extrusion profile]"
            className="flex-1 bg-[#0f1720] border border-[#1e293b] rounded px-3 py-2 text-white outline-none focus:border-[#00ffcc] text-xs"
          />
          <button
            onClick={() => handleRun()}
            disabled={loading}
            className="bg-[#00ffcc] text-black font-bold px-4 py-2 rounded hover:bg-[#00e6b8] transition-colors disabled:opacity-50"
          >
            {loading ? "EXECUTING..." : "DISPATCH"}
          </button>
        </div>

        {/* Execution Logs */}
        <div className="p-4 bg-[#030712] max-h-96 min-h-48 overflow-y-auto space-y-3">
          {!result && !loading && !error && (
            <div className="text-gray-500 italic">
              Ready to receive sovereign task instruction...
            </div>
          )}

          {loading && (
            <div className="text-[#00ffcc] animate-pulse">
              Running transformer forward pass & tool dispatch...
            </div>
          )}

          {error && (
            <div className="text-red-400 border border-red-950/80 bg-red-950/20 p-2.5 rounded">
              ❌ [RUNTIME_ERROR]: {error}
            </div>
          )}

          {result?.logs && result.logs.map((log) => (
            <div key={log.step} className="space-y-1.5 border-b border-gray-800/60 pb-3">
              <div className="text-gray-500 text-[10px]">CYCLE {log.step}</div>
              {log.thought && (
                <div className="text-slate-300">
                  <span className="text-purple-400 font-semibold">THOUGHT:</span> {log.thought}
                </div>
              )}
              {log.action_tool && (
                <div className="text-amber-400">
                  ⚡ <span className="font-semibold">[ACTION]:</span> {log.action_tool}({JSON.stringify(log.action_args)})
                </div>
              )}
              {log.observation && (
                <div className="text-emerald-400">
                  👁️ <span className="font-semibold">[OBSERVATION]:</span> {log.observation}
                </div>
              )}
            </div>
          ))}

          {result?.final_answer && (
            <div className="mt-3 p-3 bg-[#0a141d] border border-[#00ffcc]/30 rounded text-[#00ffcc]">
              <span className="font-bold tracking-wider text-xs block mb-1">FINAL ANSWER:</span>
              <span className="text-slate-100">{result.final_answer}</span>
            </div>
          )}
        </div>

        {/* Telemetry Footer */}
        {result && (
          <div className="px-4 py-2.5 bg-[#070b10] border-t border-[#1e293b] flex items-center justify-between text-gray-400 text-[11px]">
            <div>
              TENANT: <span className="text-white">{result.tenant}</span>
            </div>
            <div>
              LATENCY: <span className="text-[#00ffcc] font-semibold">{result.latency_ms} ms</span>
            </div>
            <div>
              BALANCE: <span className="text-emerald-400 font-semibold">${result.credits_remaining}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}