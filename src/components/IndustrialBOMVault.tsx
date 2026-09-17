'use client';

import React, { useState } from 'react';

export default function IndustrialBOMVault() {
    const [bomInput, setBomInput] = useState(
        JSON.stringify(
            [
                { id: '1', sku: 'DS-2XA8T25F/AQM-IZS', category: 'surveillance', qty: 20, specSummary: 'Starlight 2MP AI PoE Mini' },
                { id: '2', sku: 'DS-3E1526P-EI-Equivalent', category: 'networking', qty: 1, specSummary: '24-Port PoE+ Managed Switch' },
                { id: '3', sku: 'RAID-NVR-30D-16TB', category: 'storage', qty: 1, specSummary: '30-day continuous high-bitrate array' },
                { id: '4', sku: 'CAT6-SFUTP-2000M', category: 'networking', qty: 2000, specSummary: 'Industrial structured cabling (meters)' },
                { id: '5', sku: 'WIN75-TOUCH-AIO', category: 'computing', qty: 3, specSummary: '75-inch Windows Touch All-in-One' },
                { id: '6', sku: 'AND21-FLOOR-CTRL', category: 'computing', qty: 10, specSummary: '21-inch floor-standing Android control terminal' },
            ],
            null,
            2
        )
    );

    const [auditResult, setAuditResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

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
        setLoading(true);
        try {
            const parsed = JSON.parse(bomInput);
            const res = await fetch('/api/compliance/cst-saber-bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: parsed }),
            });
            const data = await res.json();
            setAuditResult(data);
        } catch (e) {
            alert('Invalid JSON format in BOM input.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintExecutiveBrief = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to export the executive submittal dossier.');
            return;
        }

        const items = auditResult?.evaluatedItems || [];
        const rowsHtml = items
            .map(
                (item: any) => `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-family: monospace;">${item.sku}</td>
          <td style="border: 1px solid #000; padding: 6px;">${item.category}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${item.qty}</td>
          <td style="border: 1px solid #000; padding: 6px;">${item.cstMandate} / ${item.saberMandate}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${item.estimatedClearanceHours}h</td>
        </tr>
      `
            )
            .join('');

        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MIU_33 // Riyadh DDP Compliance Submittal</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #020617; background: #fff; }
            h1 { font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 6px; margin: 0 0 4px 0; }
            .subtitle { font-size: 11px; color: #475569; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
            th { background-color: #f1f5f9; border: 1px solid #000; padding: 6px; text-align: left; }
            .footer { font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>MIU_33 // RIYADH DDP COMPLIANCE SUBMITTAL</h1>
          <div class="subtitle">Destination: Riyadh Industrial Zone DDP | Status: PRE-FLIGHT VERIFIED | Zero FX/Demurrage Track</div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Category</th>
                <th style="text-align: right;">Qty</th>
                <th>CST / SABER Mandate</th>
                <th style="text-align: right;">Clearance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
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
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-slate-400">INCOMING BILL OF MATERIALS (JSON):</label>
                        <button
                            onClick={handlePasteManifest}
                            className="text-[10px] bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded transition"
                        >
                            PASTE CSV/TSV FROM CLIPBOARD
                        </button>
                    </div>
                    {pasteFeedback && (
                        <div className="text-[10px] text-emerald-400 mb-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded">
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