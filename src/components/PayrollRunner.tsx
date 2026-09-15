"use client";

import { useState } from "react";

export function PayrollDispatcher() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runPayrollSubsystem = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityCrn: "1010000000",
          payrollCycle: "2026-09",
          jurisdiction: "KSA",
          generateSif: true,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Execution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-black border border-cyan-900/60 rounded-md text-cyan-400 font-mono text-sm">
      <button
        onClick={runPayrollSubsystem}
        disabled={loading}
        className="px-3 py-1 bg-cyan-950 border border-cyan-500 hover:bg-cyan-900 transition-colors"
      >
        {loading ? "DISPATCHING_EDGE_WORKER..." : "EXECUTE_GOSI_WPS_PIPELINE"}
      </button>

      {result && (
        <pre className="mt-4 p-3 bg-zinc-950 border border-zinc-800 text-xs overflow-x-auto text-zinc-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}