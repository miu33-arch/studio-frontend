"use client";

import React, { useState } from "react";

interface AuditFlag {
  item_id: string;
  level: "BLOCKER" | "WARNING" | "INFO";
  code: string;
  message: string;
}

interface AuditData {
  shipment_id: string;
  cleared: boolean;
  timestamp_utc: string;
  total_cif_usd: number;
  estimated_duty_sar: number;
  estimated_vat_sar: number;
  total_landed_cost_sar: number;
  flags: AuditFlag[];
  verification_digest: string;
}

export default function CustomsAuditPanel() {
  const [docText, setDocText] = useState(
    `SHP-REF: COSCO-2026-091A\nPOL: NINGBO CN -> POD: JEDDAH SA (SAJED)\nConsignee: Industrial Fab Ltd\nItem 1: 50 MT Q235B structural plates, standard GB/T 700. Value: $38,500 CIF. Marked: sticker labels.`
  );
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/transport/customs-agent-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: docText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Customs audit failed");
      setAudit(data.audit);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-[#0a0d12] border border-[#1b263b] rounded-lg text-slate-200 font-mono text-xs">
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#1b263b]">
        <div>
          <h2 className="text-base font-bold text-cyan-400 tracking-wider">
            // SASO / GCC CUSTOMS COMPLIANCE AGENT (geMiu)
          </h2>
          <p className="text-[11px] text-slate-500">Autonomous Manifest & Regulatory Audit</p>
        </div>
        {audit && (
          <span
            className={`px-3 py-1 font-bold rounded ${
              audit.cleared
                ? "bg-emerald-950 text-emerald-400 border border-emerald-500"
                : "bg-rose-950 text-rose-400 border border-rose-500"
            }`}
          >
            {audit.cleared ? "PASSED: CLEARED" : "HELD: NON-COMPLIANT"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Payload */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-400 font-semibold">RAW MANIFEST / INVOICE TEXT</label>
          <textarea
            className="w-full h-56 p-3 bg-[#05070a] border border-[#1e293b] rounded text-cyan-200 focus:outline-none focus:border-cyan-500"
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
          />
          <button
            onClick={runAudit}
            disabled={loading}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase tracking-wider rounded transition-all disabled:opacity-50"
          >
            {loading ? "geMiu Auditing Cargo..." : "Execute Customs Audit"}
          </button>
          {error && <div className="text-rose-400 p-2 bg-rose-950/30 border border-rose-800 rounded">{error}</div>}
        </div>

        {/* Right: Audit Result & Digest */}
        <div className="flex flex-col gap-3 bg-[#05070a] p-4 border border-[#1e293b] rounded">
          <div className="text-slate-400 font-semibold border-b border-slate-800 pb-2">AUDIT SUMMARY & TELEMETRY</div>
          
          {audit ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <span className="text-slate-500">SHIPMENT ID:</span>
                <span className="text-cyan-300 font-bold">{audit.shipment_id}</span>
                <span className="text-slate-500">BASE CIF (USD):</span>
                <span>${audit.total_cif_usd.toLocaleString()}</span>
                <span className="text-slate-500">5% GCC TARIFF (SAR):</span>
                <span>{audit.estimated_duty_sar.toLocaleString()} SAR</span>
                <span className="text-slate-500">15% ZATCA VAT (SAR):</span>
                <span>{audit.estimated_vat_sar.toLocaleString()} SAR</span>
                <span className="text-slate-500">TOTAL LANDED (SAR):</span>
                <span className="text-amber-400 font-bold">{audit.total_landed_cost_sar.toLocaleString()} SAR</span>
              </div>

              <div className="mt-2 border-t border-slate-800 pt-2">
                <div className="text-slate-400 font-semibold mb-1">REGULATORY FLAGS ({audit.flags.length})</div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {audit.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-[10px] border ${
                        flag.level === "BLOCKER"
                          ? "bg-rose-950/40 border-rose-800 text-rose-300"
                          : "bg-amber-950/40 border-amber-800 text-amber-300"
                      }`}
                    >
                      <div className="font-bold">[{flag.level}] {flag.code}</div>
                      <div>{flag.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-2 border-t border-slate-900">
                <span className="text-[9px] text-slate-600 block">SHA-256 LEDGER DIGEST</span>
                <span className="text-[9px] text-slate-400 break-all select-all">{audit.verification_digest}</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-600 text-center py-16">
              Awaiting manifest submission for deterministic verification...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}