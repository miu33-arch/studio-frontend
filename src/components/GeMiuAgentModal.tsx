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

  const handleRun = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dispatchTaskToGeMiu(task);
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to local agent runtime on port 8000.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0b0f14] border border-[#1e293b] rounded-lg w-full max-w-3xl overflow-hidden font-mono text-sm shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-3 bg-[#070b10]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 tracking-wider">
              geMiu // SOVEREIGN AGENT DISPATCH
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            [ESC / CLOSE]
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-[#1e293b] flex gap-2">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleRun()}
            placeholder="[TASK: Inspect repository health]"
            className="flex-1 bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white outline-none focus:border-[#00f3ff] text-xs"
          />
          <button
            onClick={handleRun}
            disabled={loading}
            className="bg-[#00f3ff] text-black font-semibold px-4 py-2 rounded text-xs hover:bg-[#38bdf8] transition-colors disabled:opacity-50"
          >
            {loading ? "EXECUTING..." : "DISPATCH"}
          </button>
        </div>

        {/* Live Execution Logs */}
        <div className="p-4 bg-[#030712] max-h-96 min-h-35 overflow-y-auto space-y-3 text-xs">
          {!result && !loading && !error && (
            <div className="text-gray-500 italic">
              Ready to receive sovereign task instruction...
            </div>
          )}

          {loading && (
            <div className="text-[#00f3ff] animate-pulse">
              Running transformer forward pass & tool dispatch...
            </div>
          )}

          {error && (
            <div className="text-red-400 border border-red-950/80 bg-red-950/20 p-2.5 rounded">
              ❌ [RUNTIME_ERROR]: {error}
            </div>
          )}

          {result?.logs && result.logs.map((log, idx) => (
            <div key={idx} className="space-y-1 border-b border-gray-800/60 pb-2">
              {log.output && (
                <div className="text-gray-300 whitespace-pre-wrap">{log.output}</div>
              )}
              {log.tool && (
                <div className="text-amber-400">
                  ⚡ [ACTION] {log.tool}({JSON.stringify(log.args)})
                </div>
              )}
              {log.observation && (
                <div className="text-emerald-400">
                  👁️ [OBSERVATION] {log.observation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}