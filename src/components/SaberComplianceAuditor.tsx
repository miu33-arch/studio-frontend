'use client';

import React, { useState } from 'react';

export default function SaberComplianceAuditor() {
  const [hsCode, setHsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compliance/saber-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hsCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete compliance audit');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSaberDossier = (resultData: any) => {
    if (!resultData) {
      alert("Run a SABER compliance audit first before compiling the dossier.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to compile the trade compliance dossier.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SASO SABER &amp; PCoC COMPLIANCE DOSSIER - HS ${resultData.hsCode}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #050a0e;
            color: #d1d5db;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .dossier-container { max-width: 760px; margin: 0 auto; padding: 24px 30px; box-sizing: border-box; }
          .section-block { page-break-inside: avoid; margin-bottom: 14px; }
          .header { border-bottom: 2px solid #00f3ff; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 16px; font-weight: bold; color: #00f3ff; letter-spacing: 1px; }
          .meta { font-size: 9px; color: #888; text-transform: uppercase; }
          .section-title { font-size: 11px; font-weight: bold; color: #00f3ff; border-bottom: 1px solid #142838; padding-bottom: 4px; margin: 14px 0 6px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
          td, th { padding: 6px 8px; border: 1px solid #142838; text-align: left; }
          th { background-color: #08121a; color: #00f3ff; }
          .warning-box { border: 1px solid #ff3366; background: #1a0408; color: #ff3366; padding: 10px; font-size: 10px; margin-top: 10px; }
          .invoice-box { border: 1px solid #00ff66; background: #021208; padding: 10px; margin-top: 10px; }
          .total-fee { font-size: 15px; color: #00ff66; font-weight: bold; float: right; }
          .footer { margin-top: 20px; border-top: 1px solid #142838; padding-top: 8px; font-size: 8px; color: #555; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="dossier-container">
          <div class="section-block header">
            <div>
              <div class="title">MIU_33 // TRADE COMPLIANCE &amp; SABER DOSSIER</div>
              <div class="meta">KSA PORT PRE-CLEARANCE ENGINE &bull; TARGET HS: ${resultData.hsCode}</div>
            </div>
            <div class="meta" style="text-align: right;">DATE: ${new Date().toISOString().split("T")[0]}<br>STATUS: COMMERCIAL CONFIDENTIAL</div>
          </div>

          <div class="section-block">
            <div class="section-title">1. SASO REGULATORY STATUS &amp; CONFORMITY SCOPE</div>
            <table>
              <tr><th>COMPLIANCE PARAMETER</th><th>TECHNICAL SPECIFICATION</th><th>OPERATIONAL MANDATE</th></tr>
              <tr><td>HS Tariff Code</td><td style="color: #00f3ff; font-weight: bold;">${resultData.hsCode}</td><td>Classified under KSA Customs Tariff</td></tr>
              <tr><td>Regulation Status</td><td style="color: #ffaa00; font-weight: bold;">REGULATED (SASO MANDATE)</td><td>Technical regulations apply</td></tr>
              <tr><td>Product Certificate (PCoC)</td><td>${resultData.certificates?.pcoc?.validity || "12 Months"}</td><td>${resultData.certificates?.pcoc?.scope || "Product Model Level Validation"}</td></tr>
              <tr><td>Shipment Certificate (SCoC)</td><td style="color: #ff3366; font-weight: bold;">Mandatory Pre-Arrival</td><td>Must be issued prior to vessel docking</td></tr>
            </table>
          </div>

          <div class="section-block">
            <div class="section-title">2. PORT DETENTION &amp; DEMURRAGE RISK ASSESSMENT</div>
            <div class="warning-box">
              <strong>CRITICAL PORT RISK:</strong> ${resultData.certificates?.scoc?.penaltyRisk || "Applying for SCoC post-arrival results in immediate container detention, storage demurrage penalties, and customs clearance failure at Jeddah/Dammam ports."}
            </div>
          </div>

          <div class="section-block">
            <div class="section-title">3. PRE-CLEARANCE FILING &amp; COMMERCIAL TERMS</div>
            <div class="invoice-box">
              <div style="font-size: 11px; font-weight: bold; color: #fff; margin-bottom: 6px;">RECOMMENDED COMPLIANCE SCOPE OF WORK</div>
              <table style="border: none; margin-bottom: 0;">
                <tr style="background: transparent;"><td style="border: none; border-bottom: 1px dashed #142838; padding: 3px 0;">SABER Platform Onboarding &amp; PCoC Technical File Upload</td><td style="border: none; border-bottom: 1px dashed #142838; text-align: right; color: #aaa;">SAR 3,500.00</td></tr>
                <tr style="background: transparent;"><td style="border: none; border-bottom: 1px dashed #142838; padding: 3px 0;">Pre-Arrival SCoC Validation &amp; FASAH Port Link</td><td style="border: none; border-bottom: 1px dashed #142838; text-align: right; color: #aaa;">SAR 2,000.00</td></tr>
              </table>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #00ff66;">
                <span style="font-size: 10px; color: #aaa;">SETTLEMENT CLEARANCE // SARIE WIRE</span>
                <span class="total-fee">TOTAL: SAR 5,500.00</span>
              </div>
            </div>
          </div>

          <div class="section-block footer">
            <div>MIU_33 STUDIO &bull; RIYADH, KINGDOM OF SAUDI ARABIA</div>
            <div>LOGISTICS COMPLIANCE DIVISION</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <div className="bg-[#0b0f19] border border-cyan-500/30 p-6 rounded-lg font-mono text-cyan-400 max-w-2xl mx-auto my-8">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
        <span className="text-sm tracking-widest uppercase text-cyan-300">
          // MIU_33 ZATCA & SABER COMPLIANCE ENGINE
        </span>
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
      </div>

      <form onSubmit={handleAudit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ENTER HS CODE (MIN 8 DIGITS)</label>
          <input
            type="text"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder="e.g., 847130000000"
            className="w-full bg-[#05070b] border border-cyan-500/40 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400 text-cyan-300 py-2 rounded transition font-bold tracking-wide text-sm"
        >
          {loading ? 'ANALYZING TRADING REGULATIONS...' : 'RUN PCoC / SCoC AUDIT'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded">
          :: ERROR: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 border-t border-cyan-500/20 pt-4 space-y-3 text-xs">
          <div className="text-white font-bold mb-2">:: AUDIT TELEMETRY RESULT</div>
          <div className="flex justify-between">
            <span className="text-gray-400">Target HS Code:</span>
            <span className="text-white">{result.hsCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Regulation Status:</span>
            <span className="text-amber-400">REGULATED (SASO MANDATE)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">PCoC Requirement:</span>
            <span className="text-cyan-300">{result.certificates.pcoc.validity} ({result.certificates.pcoc.scope})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">SCoC Rule:</span>
            <span className="text-red-400">Mandatory Pre-Arrival Clearance</span>
          </div>
          <div className="p-3 bg-[#05070b] border border-amber-500/30 text-amber-300 rounded">
            <strong>Penalty Risk:</strong> {result.certificates.scoc.penaltyRisk}
          </div>

          <button
            type="button"
            onClick={() => handleExportSaberDossier(result)}
            className="w-full mt-4 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66] text-[#00ff66] py-2 rounded transition font-bold tracking-wide text-xs"
          >
            📄 EXPORT SABER COMPLIANCE DOSSIER (.PDF)
          </button>
        </div>
      )}
    </div>
  );
}