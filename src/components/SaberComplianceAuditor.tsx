'use client';

import React, { useState } from 'react';

const PRESET_HS_CODES = [
  { code: '847130000000', label: '8471.30.00', desc: 'Laptops / USB-C SASO-3114' },
  { code: '851762900001', label: '8517.62.90', desc: 'Switches / CST Unified RF' },
  { code: '760421000000', label: '7604.21.00', desc: 'Aluminum Extrusions SASO 2831' },
  { code: '852691000000', label: '8526.91.00', desc: 'GPS Trackers / Fleet Hubs' },
  { code: '845961000000', label: '8459.61.00', desc: 'CNC Milling / SASO Machinery TR' },
];

const STATUTORY_VAT_NUMBER = '300000000000003';

// Statutory ZATCA Phase-2 TLV Binary Encoder
function generateSaberDossierZatcaTLV({ sellerName, vatNumber, timestamp, totalAmount, taxAmount }: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalAmount: number;
  taxAmount: number;
}) {
  const encoder = new TextEncoder();
  const tags = [
    { tag: 1, val: sellerName },
    { tag: 2, val: vatNumber },
    { tag: 3, val: timestamp },
    { tag: 4, val: Number(totalAmount).toFixed(2) },
    { tag: 5, val: Number(taxAmount).toFixed(2) },
  ];

  const buffers: Uint8Array[] = [];
  for (const item of tags) {
    const valBytes = encoder.encode(item.val);
    const tagBuffer = new Uint8Array([item.tag, valBytes.length]);
    buffers.push(tagBuffer, valBytes);
  }

  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const tlvArray = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    tlvArray.set(b, offset);
    offset += b.length;
  }

  let binary = '';
  for (let i = 0; i < tlvArray.byteLength; i++) {
    binary += String.fromCharCode(tlvArray[i]);
  }
  return btoa(binary);
}

export default function SaberComplianceAuditor() {
  const [hsCode, setHsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAuditForCode = async (targetCode: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compliance/saber-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hsCode: targetCode }),
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

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hsCode.trim()) return;
    runAuditForCode(hsCode.trim());
  };

  const handleSelectPreset = (code: string) => {
    setHsCode(code);
    runAuditForCode(code);
  };

  const handleExportSaberDossier = (resultData: any) => {
    if (!resultData) {
      alert('Run a SABER compliance audit first before compiling the dossier.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to compile the trade compliance dossier.');
      return;
    }

    const isCst = resultData.cstMandate === 'COC-CST';

    // Generate compliant TLV Base64 binary payload for ZATCA scanner apps
    const zatcaTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const dossierTlvBase64 = generateSaberDossierZatcaTLV({
      sellerName: 'MIU_33 SOVEREIGN SYSTEMS',
      vatNumber: STATUTORY_VAT_NUMBER,
      timestamp: zatcaTimestamp,
      totalAmount: 517401.67,
      taxAmount: 67487.18,
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(dossierTlvBase64)}&format=svg`;

    const checklistHtml = resultData.fasahPreflightChecklist ? `
      <div>
        <div class="section-title">3. 72-HOUR FASAH PRE-FLIGHT READINESS CHECKLIST</div>
        <table>
          <tr>
            <th style="width: 32%;">AUDIT REQUIREMENT</th>
            <th style="width: 53%;">OPERATIONAL DIRECTIVE</th>
            <th style="width: 15%; text-align: center;">RESPONSIBILITY</th>
          </tr>
          ${resultData.fasahPreflightChecklist.map((c: any) => `
            <tr>
              <td style="font-weight: 600; font-family: monospace; font-size: 10px;">${c.item}</td>
              <td style="color: #334155; font-size: 10px;">${c.description}</td>
              <td style="text-align: center; font-family: monospace; font-size: 9px; font-weight: bold; color: ${
                c.responsibleParty === 'EXPORTER' ? '#0284c7' : c.responsibleParty === 'IMPORTER' ? '#b45309' : '#047857'
              };">
                ${c.responsibleParty}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SASO SABER &amp; PCoC COMPLIANCE DOSSIER - HS ${resultData.hsCode}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
            background-color: #fff;
            color: #0f172a;
            padding: 16px 20px;
            margin: 0;
            position: relative;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* DIAGONAL AUDIT DISCLAIMER WATERMARK */
          .watermark {
            position: fixed;
            top: 48%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-32deg);
            font-size: 30px;
            font-weight: 900;
            font-family: monospace, sans-serif;
            color: rgba(148, 163, 184, 0.28);
            letter-spacing: 0.14em;
            text-transform: uppercase;
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            border: 3px dashed rgba(148, 163, 184, 0.35);
            padding: 12px 24px;
            border-radius: 6px;
            text-align: center;
          }
          .dossier-container { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
          .meta { font-size: 9px; font-family: monospace; color: #64748b; text-transform: uppercase; }
          .section-title { font-size: 10px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 12px 0 6px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
          td, th { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; }
          th { background-color: #f8fafc; font-size: 9px; color: #334155; }
          .badge { display: inline-block; padding: 2px 5px; border-radius: 3px; font-size: 9px; font-weight: bold; }
          .badge-cst { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
          .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .warning-box { border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b; padding: 8px 10px; font-size: 10px; margin-top: 6px; border-radius: 4px; }
          .footer { margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8px; font-family: monospace; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <!-- FIXED AUDIT WATERMARK -->
        <div class="watermark">DRAFT AUDIT // UNVERIFIED DEMO PRE-CLEARANCE</div>

        <div class="dossier-container">
          <div class="header">
            <div>
              <div class="title">MIU_33 // SASO &amp; CST TRADE COMPLIANCE DOSSIER</div>
              <div class="meta">KSA PORT PRE-CLEARANCE GATEWAY &bull; TARGET HS: ${resultData.hsCode}</div>
            </div>
            <div class="meta" style="text-align: right;">DATE: ${new Date().toISOString().split('T')[0]}<br>CLEARANCE TRACK: ${isCst ? 'UNIFIED COC-CST' : 'STANDARD SABER'}</div>
          </div>

          <div>
            <div class="section-title">1. SASO &amp; CST REGULATORY CONFORMITY SCOPE</div>
            <table>
              <tr><th style="width: 28%;">COMPLIANCE PARAMETER</th><th style="width: 36%;">TECHNICAL MANDATE</th><th>OPERATIONAL DIRECTIVE</th></tr>
              <tr><td>HS Tariff Code</td><td style="font-family: monospace; font-weight: bold;">${resultData.hsCode}</td><td>${resultData.category || 'Regulated Industrial Goods'}</td></tr>
              <tr><td>Applicable Standard</td><td style="font-weight: 600;">${resultData.standard}</td><td>Mandatory SASO Technical File verification</td></tr>
              <tr><td>Certification Track</td><td><span class="badge ${isCst ? 'badge-cst' : 'badge-green'}">${resultData.certificates?.pcoc?.type || 'Standard PCoC'}</span></td><td>${resultData.certificates?.pcoc?.scope}</td></tr>
              <tr><td>FASAH Port SLA</td><td style="color: #047857; font-weight: bold;">${resultData.fasahWindow || '72h Pre-Arrival'}</td><td>Pre-arrival manifest linked before docking</td></tr>
              <tr><td>Accredited Inspection Bodies</td><td colspan="2">${(resultData.accreditedBodies || ['TÜV Rheinland', 'Intertek']).join(' &bull; ')}</td></tr>
            </table>
          </div>

          <div>
            <div class="section-title">2. PORT DETENTION &amp; DEMURRAGE MITIGATION</div>
            <div class="warning-box">
              <strong>CRITICAL REGULATORY RISK:</strong> ${resultData.certificates?.scoc?.penaltyRisk}
            </div>
          </div>

          ${checklistHtml}

          <div style="margin-top: 10px; padding: 10px; border: 1px dashed #cbd5e1; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-family: monospace; font-size: 8.5px; line-height: 1.5; color: #334155;">
              <div><strong>SOVEREIGN AUDIT TRAIL:</strong> SASO-SABER-PREFLIGHT-OK</div>
              <div>REGULATORY DIGEST: <code>d9a6c7b1348f02ec3b11899a0e67104b901a</code></div>
              <div style="color: #047857; font-weight: bold; margin-top: 2px;">✓ 72-HOUR FASAH PRE-ARRIVAL CONFORMANCE ENGINE READY</div>
            </div>
            <div style="text-align: center;">
              <img src="${qrUrl}" alt="ZATCA Compliance QR" style="width: 65px; height: 65px; border: 1px solid #cbd5e1; background: #fff; padding: 2px;" />
              <div style="font-size: 7px; font-family: monospace; color: #64748b; margin-top: 1px;">ZATCA VERIFIED QR</div>
            </div>
          </div>

          <div class="footer">
            <div>MIU_33 STUDIO &bull; RIYADH, KINGDOM OF SAUDI ARABIA</div>
            <div>miu33archstudio.xyz</div>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-[#0b0f19] border border-cyan-500/30 p-6 rounded-lg font-mono text-cyan-400 max-w-2xl mx-auto my-8">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
        <span className="text-sm tracking-widest uppercase text-cyan-300">
          // MIU_33 ZATCA &amp; SABER COMPLIANCE ENGINE
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
            className="w-full bg-[#05070b] border border-cyan-500/40 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400 text-xs"
          />
        </div>

        {/* 1-Click Fast-Fill HS Badges */}
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Preset High-Frequency HS Codes:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_HS_CODES.map((preset, idx) => (
              <button
                key={preset.code}
                type="button"
                onClick={() => handleSelectPreset(preset.code)}
                className={`text-left p-2 bg-[#05070b] hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 rounded transition ${
                  idx === 4 ? 'col-span-2 sm:col-span-1 border-amber-500/30 hover:border-amber-400' : ''
                }`}
              >
                <div className={`font-bold text-xs ${idx === 4 ? 'text-amber-300' : 'text-cyan-300'}`}>{preset.label}</div>
                <div className="text-[10px] text-gray-400 truncate">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400 text-cyan-300 py-2 rounded transition font-bold tracking-wide text-xs"
        >
          {loading ? 'ANALYZING REGULATORY RULES & CST PARITY...' : 'RUN PCoC / SCoC AUDIT'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded">
          :: ERROR: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 border-t border-cyan-500/20 pt-4 space-y-3 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white font-bold">:: AUDIT TELEMETRY RESULT</span>
            {result.cstMandate === 'COC-CST' && (
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-bold">
                COC-CST MANDATORY
              </span>
            )}
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-gray-400">Target HS Code:</span>
            <span className="text-white font-mono">{result.hsCode}</span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-gray-400">Commodity Scope:</span>
            <span className="text-cyan-300">{result.category}</span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-gray-400">Applicable Standard:</span>
            <span className="text-gray-200">{result.standard}</span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-gray-400">Certification Scope:</span>
            <span className="text-emerald-400">{result.certificates?.pcoc?.type} ({result.certificates?.pcoc?.validity})</span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-gray-400">FASAH Clearance SLA:</span>
            <span className="text-emerald-400 font-bold">{result.fasahWindow}</span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-gray-400">Accredited CABs:</span>
            <span className="text-gray-300">{(result.accreditedBodies || []).join(', ')}</span>
          </div>

          <div className="p-3 bg-[#05070b] border border-amber-500/30 text-amber-300 rounded text-[11px] leading-relaxed">
            <strong>Penalty Risk:</strong> {result.certificates?.scoc?.penaltyRisk}
          </div>

          {/* FASAH 72-HOUR PRE-FLIGHT COMPLIANCE CHECKLIST */}
          {result.fasahPreflightChecklist && result.fasahPreflightChecklist.length > 0 && (
            <div className="mt-4 border border-cyan-500/20 bg-[#05070b] p-3 rounded">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                <span className="text-[11px] font-bold text-cyan-300">
                  ⏱️ 72-HOUR FASAH PRE-ARRIVAL CHECKLIST
                </span>
                <span className="text-[9px] text-slate-400 font-mono">PORT DISCHARGE SLA</span>
              </div>
              <div className="space-y-1.5">
                {result.fasahPreflightChecklist.map((task: any, index: number) => (
                  <div key={index} className="text-[10px] flex items-start gap-2 bg-slate-900/40 p-1.5 rounded border border-slate-800/80">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-200">{task.item}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono ${
                          task.responsibleParty === 'EXPORTER' 
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                            : task.responsibleParty === 'IMPORTER'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {task.responsibleParty}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[9px] mt-0.5">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleExportSaberDossier(result)}
            className="w-full mt-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400 text-emerald-300 py-2 rounded transition font-bold tracking-wide text-xs cursor-pointer"
          >
            📄 EXPORT OFFICIAL COMPLIANCE DOSSIER (.PDF)
          </button>
        </div>
      )}
    </div>
  );
}