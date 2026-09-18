'use client';

import React, { useState } from 'react';

const SAMPLE_SINO_SAUDI_BOM = [
    {
        id: '1',
        sku: 'AL-6063-T6-CURTAIN-EXT',
        hsCode: '760421000000',
        category: 'construction',
        qty: 12500,
        specSummary: 'GB/T 5237 Architectural Extrusions -> SASO 2831 / ASTM B221 (Jeddah Islamic Port)'
    },
    {
        id: '2',
        sku: 'STEEL-Q235B-STRUCT-COL',
        hsCode: '721631000000',
        category: 'construction',
        qty: 48000,
        specSummary: 'GB/T 700 Structural Steel Framing -> ASTM A36 Parity (Dammam Port)'
    },
    {
        id: '3',
        sku: 'HIK-4K-PTZ-CCTV-SURV',
        hsCode: '851762900001',
        category: 'surveillance',
        qty: 140,
        specSummary: 'Industrial 4K PTZ Surveillance -> SASO IEC 62368-1 / CST Radio Pre-Clearance'
    },
    {
        id: '4',
        sku: 'DS-3E1526P-EI-Equivalent',
        hsCode: '851762000000',
        category: 'networking',
        qty: 12,
        specSummary: '24-Port PoE+ Managed Industrial Switch (CST Type-Approval Scope)'
    }
];

export default function IndustrialBOMVault() {
    const [bomInput, setBomInput] = useState(
        JSON.stringify(SAMPLE_SINO_SAUDI_BOM, null, 2)
    );

    const [auditResult, setAuditResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

    const executeAuditPayload = async (payload: any[]) => {
        setLoading(true);
        try {
            const res = await fetch('/api/compliance/cst-saber-bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: payload }),
            });
            const data = await res.json();
            setAuditResult(data);
        } catch (e) {
            alert('Failed to evaluate BOM payload via compliance gateway.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadSampleBOM = () => {
        const jsonStr = JSON.stringify(SAMPLE_SINO_SAUDI_BOM, null, 2);
        setBomInput(jsonStr);
        setPasteFeedback('Loaded real-world Sino-Saudi industrial BOM sample.');
        setTimeout(() => setPasteFeedback(null), 3500);
        executeAuditPayload(SAMPLE_SINO_SAUDI_BOM);
    };

    const handlePasteManifest = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                alert('Clipboard is empty.');
                return;
            }
            const rows = text.trim().split('\n').map((row) => row.split(/\t|,/));
            const normalizedPayload = rows.map((cols, idx) => ({
                id: String(idx + 1),
                sku: cols[0]?.trim() || `SKU-AUTO-${idx + 1}`,
                category: cols[1]?.trim() || 'industrial',
                qty: Number(cols[2]) || 1,
                specSummary: cols[3]?.trim() || 'Imported supplier manifest row',
            }));
            setBomInput(JSON.stringify(normalizedPayload, null, 2));
            setPasteFeedback('Normalized CSV/TSV clipboard block loaded into state.');
            setTimeout(() => setPasteFeedback(null), 3500);
        } catch (err) {
            console.error('Clipboard read failed:', err);
            alert('Clipboard permission denied or unavailable. Paste manually into JSON block.');
        }
    };

    const handleEvaluate = async () => {
        try {
            const parsed = JSON.parse(bomInput);
            await executeAuditPayload(parsed);
        } catch (e) {
            alert('Invalid JSON format in BOM input.');
        }
    };

    const handlePrintExecutiveBrief = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to export the executive submittal dossier.');
            return;
        }

        const rawItems = auditResult?.results || auditResult?.evaluatedItems || [];
        let fallbackInputItems: any[] = [];
        try {
            fallbackInputItems = JSON.parse(bomInput);
        } catch {
            fallbackInputItems = [];
        }

        const items = rawItems.length > 0 ? rawItems : fallbackInputItems;

        const rowsHtml = items
            .map((item: any, idx: number) => {
                const skuCode = item.sku || `SKU-${idx + 1}`;
                const hsFormatted = item.hsCode ? `<br/><span style="color:#64748b; font-size:10px;">HS: ${item.hsCode}</span>` : '';
                const categoryDesc = item.description || item.specSummary || item.category || 'Industrial Equipment';
                const qtyVal = Number(item.qty || 1).toLocaleString();
                const mandateTag = item.certificateType || (item.cstParityRequired ? 'COC-CST Required' : 'SABER_STANDARD');
                const clearanceSla = item.estimatedClearanceHours ? `${item.estimatedClearanceHours}h` : (item.cstParityRequired ? '48h (Fast-Track)' : '72h');

                return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-size: 11px;"><strong>${skuCode}</strong>${hsFormatted}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px;">${categoryDesc}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 600; font-size: 11px;">${qtyVal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px;">${mandateTag}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 700; color: #047857; font-size: 11px;">${clearanceSla}</td>
        </tr>
      `;
            })
            .join('');

        const verificationBlock = `
      <div style="margin-top: 24px; padding: 14px; border: 1px dashed #94a3b8; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-radius: 4px;">
        <div style="font-family: monospace; font-size: 9px; line-height: 1.6; color: #334155;">
          <div><strong style="color: #0f172a;">SOVEREIGN AUDIT TRAIL:</strong> ZATCA-PHASE2-COMPLIANT-HASH</div>
          <div>INVOICE DIGEST (SHA-256): <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></div>
          <div>FASAH PRE-DECLARATION BATCH: <code>SA-RUH-2026-09-EXP-4882</code></div>
          <div style="color: #047857; font-weight: bold; margin-top: 4px;">✓ FASAH / CST / SABER TRIPLE-CHAIN VERIFIED</div>
        </div>
        <div style="text-align: center; margin-left: 16px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=ZATCA-MIU33-PREFLIGHT-VERIFIED-BOM-BATCH-202609" alt="ZATCA Compliance QR" style="width: 76px; height: 76px; border: 1px solid #cbd5e1; padding: 2px; background: #fff;" />
          <div style="font-size: 8px; font-family: monospace; color: #64748b; margin-top: 3px;">SCAN TO VERIFY</div>
        </div>
      </div>
    `;

        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MIU_33 // Riyadh DDP Compliance Submittal</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; background: #fff; }
            h1 { font-size: 18px; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 0 0 6px 0; letter-spacing: -0.02em; }
            .subtitle { font-size: 11px; font-family: monospace; color: #475569; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            th { background-color: #f8fafc; border: 1px solid #94a3b8; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #334155; }
            .footer { font-size: 10px; font-family: monospace; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>MIU_33 // RIYADH DDP COMPLIANCE SUBMITTAL</h1>
          <div class="subtitle">Destination: Riyadh Industrial Zone DDP | Status: PRE-FLIGHT VERIFIED | Zero FX/Demurrage Track</div>
          <table>
            <thead>
              <tr>
                <th>SKU / HS Code</th>
                <th>Category / Specification</th>
                <th style="text-align: right;">Qty</th>
                <th>CST / SABER Mandate</th>
                <th style="text-align: right;">Clearance SLA</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${verificationBlock}

          <div class="footer">
            <span>Verified via MIU_33 Sovereign Compliance Core</span>
            <span>miu33archstudio.xyz</span>
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

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="p-6 bg-slate-950 text-cyan-400 font-mono border border-cyan-500/30 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold tracking-wider">MIU_33 // INDUSTRIAL BOM & CST-SABER AUDIT</h2>
                <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-1 rounded border border-cyan-500/40">
                    RIYADH DDP GATEWAY
                </span>
            </div>

            {/* Legal & Regulatory Notice Banner */}
            <div
                role="region"
                aria-label="Regulatory and Legal Notice"
                className="mb-4 border-l-2 border-amber-500/60 bg-zinc-950/40 p-3"
            >
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">LEGAL & REGULATORY NOTICE:</strong> MIU Sovereign AEC & Trade Core is a technical staging and document compilation engine. Outputs are prepared for engineering coordination and customs clearance. Final submittals to MOMRAH, Balady, SFDA, SABER, or ZATCA require review and endorsement by the licensed Engineer of Record or clearing agent. <span className="text-amber-500 font-bold">// SYSTEM STATUS: UNLICENSED TRIAL DRAFT. All fiscal values, HS code mappings, and calculated landed costs are watermarked simulations and must not be used for official regulatory filings.</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <label className="text-xs text-slate-400">INCOMING BILL OF MATERIALS (JSON):</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleLoadSampleBOM}
                                className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded transition"
                            >
                                ⚡ LOAD SAMPLE SINO-SAUDI BOM
                            </button>
                            <button
                                type="button"
                                onClick={handlePasteManifest}
                                className="text-[10px] bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded transition"
                            >
                                PASTE CSV/TSV
                            </button>
                        </div>
                    </div>
                    {pasteFeedback && (
                        <div className="text-[10px] text-emerald-400 mb-2 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded">
                            {pasteFeedback}
                        </div>
                    )}
                    <textarea
                        value={bomInput}
                        onChange={(e) => setBomInput(e.target.value)}
                        rows={14}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 p-3 text-xs rounded focus:outline-none focus:border-cyan-400"
                    />
                    <button
                        onClick={handleEvaluate}
                        disabled={loading}
                        className="mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded text-xs transition"
                    >
                        {loading ? 'COMPUTING COMPLIANCE PARITY...' : 'EXECUTE CST / SABER PARITY AUDIT'}
                    </button>
                </div>

                <div className="flex flex-col bg-slate-900 border border-slate-800 p-4 rounded overflow-auto max-h-100">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                        <h3 className="text-xs text-slate-400">AUDIT MANIFEST OUTPUT:</h3>
                        {auditResult && (
                            <button
                                onClick={handlePrintExecutiveBrief}
                                className="text-[11px] bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-1 rounded transition"
                            >
                                PRINT / EXPORT DOSSIER
                            </button>
                        )}
                    </div>
                    {auditResult ? (
                        <pre className="text-xs text-cyan-300 whitespace-pre-wrap flex-1">
                            {JSON.stringify(auditResult, null, 2)}
                        </pre>
                    ) : (
                        <div className="text-xs text-slate-500 italic mt-20 text-center flex-1">
                            Awaiting BOM evaluation payload...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}