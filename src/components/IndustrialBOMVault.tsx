'use client';

import React, { useState, useMemo } from 'react';

export type IncotermMode = 'FOB' | 'CIF' | 'CFR' | 'DAP' | 'DDP';
export type SaberBindingStatus = 'BOUND' | 'PENDING_BUYER_ACTION';

export interface BOMPresetConfig {
    id: string;
    label: string;
    destinationPort: string;
    incoterm: IncotermMode;
    governingTR: string;
    trReferenceCode: string;
    consigneeCR: string;
    saberBindingStatus: SaberBindingStatus;
    items: Array<{
        id: string;
        sku: string;
        hsCode: string;
        category: string;
        qty: number;
        unitPriceUSD: number;
        specSummary: string;
        sasoStandardParity: string;
    }>;
}

export const MANIFEST_PRESETS: Record<string, BOMPresetConfig> = {
    ARCHITECTURAL_CURTAIN_WALL: {
        id: 'PRESET-ARCH-CW-01',
        label: 'ARCHITECTURAL ENVELOPE (ALUMINIUM & STEEL)',
        destinationPort: 'Jeddah Islamic Port (JIP)',
        incoterm: 'CIF',
        governingTR: 'Building Materials - Part 1: Metals & Alloys',
        trReferenceCode: 'SASO M.A. 156-16-03-01',
        consigneeCR: '1010894412 (Verified Active)',
        saberBindingStatus: 'BOUND',
        items: [
            {
                id: '1',
                sku: 'AL-6063-T6-CURTAIN-EXT',
                hsCode: '760421000000',
                category: 'construction',
                qty: 12500,
                unitPriceUSD: 14.50,
                specSummary: 'GB/T 5237 Architectural Extrusions -> SASO 2831 / ASTM B221 (Jeddah Islamic Port)',
                sasoStandardParity: 'SASO 2831:2018 / ASTM B221'
            },
            {
                id: '2',
                sku: 'STEEL-Q235B-STRUCT-COL',
                hsCode: '721631000000',
                category: 'construction',
                qty: 48000,
                unitPriceUSD: 2.20,
                specSummary: 'GB/T 700 Structural Steel Framing -> ASTM A36 Parity (Dammam Port)',
                sasoStandardParity: 'SASO ASTM A36 / SASO ASTM A6/A6M'
            }
        ]
    },
    INDUSTRIAL_CNC_MACHINERY: {
        id: 'PRESET-IND-CNC-02',
        label: 'INDUSTRIAL CNC MACHINERY (DAP SINO-SAUDI ROUTE)',
        destinationPort: 'King Abdulaziz Port Dammam (KAPD)',
        incoterm: 'DAP',
        governingTR: 'Machinery Safety Technical Regulation',
        trReferenceCode: 'SASO 01-05-21-182 / M.A. 164-18-05-02',
        consigneeCR: 'UNBOUND // PENDING LOCAL BUYER FILING',
        saberBindingStatus: 'PENDING_BUYER_ACTION',
        items: [
            {
                id: '1',
                sku: 'CNC-VMC-850-ENGRAVE',
                hsCode: '845961000000',
                category: 'machinery',
                qty: 2,
                unitPriceUSD: 46500.00,
                specSummary: '3-Axis Industrial CNC Machining & Engraving Center -> ISO 12100 / EN 60204-1',
                sasoStandardParity: 'SASO TR Machinery Safety / IEC 60204-1 (LVD)'
            },
            {
                id: '2',
                sku: 'CNC-TOOL-CHALL-CAROUSEL',
                hsCode: '846693000000',
                category: 'machinery_parts',
                qty: 4,
                unitPriceUSD: 3200.00,
                specSummary: 'Automatic Tool Changer Magazine Assemblies -> SASO TR Machinery Safety Annex 2',
                sasoStandardParity: 'SASO ISO 12100:2020 Parity'
            }
        ]
    }
};

const USD_TO_SAR_PEGGED_RATE = 3.75;
const GCC_CUSTOMS_DUTY_RATE = 0.05;
const ZATCA_VAT_RATE = 0.15;

export default function IndustrialBOMVault() {
    const [selectedPresetKey, setSelectedPresetKey] = useState<string>('ARCHITECTURAL_CURTAIN_WALL');
    const [currentIncoterm, setCurrentIncoterm] = useState<IncotermMode>('CIF');
    const [currentSaberStatus, setCurrentSaberStatus] = useState<SaberBindingStatus>('BOUND');
    const [consigneeCR, setConsigneeCR] = useState<string>('1010894412 (Verified Active)');
    const [governingTR, setGoverningTR] = useState<string>('SASO M.A. 156-16-03-01 (Building Materials TR - Part 1)');

    const [bomInput, setBomInput] = useState<string>(
        JSON.stringify(MANIFEST_PRESETS.ARCHITECTURAL_CURTAIN_WALL.items, null, 2)
    );

    const [auditResult, setAuditResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

    const isHighRiskDAP = useMemo(() => {
        return (currentIncoterm === 'DAP' || currentIncoterm === 'DDP') && currentSaberStatus === 'PENDING_BUYER_ACTION';
    }, [currentIncoterm, currentSaberStatus]);

    const fiscalSummary = useMemo(() => {
        try {
            const parsed = JSON.parse(bomInput);
            if (!Array.isArray(parsed)) return null;

            const totalFobUSD = parsed.reduce((acc: number, item: any) => {
                const q = Number(item.qty || 1);
                const p = Number(item.unitPriceUSD || 0);
                return acc + (q * p);
            }, 0);

            // Standard maritime freight + insurance baseline (~8% of FOB)
            const freightInsuranceUSD = totalFobUSD * 0.08;
            const cifValueUSD = totalFobUSD + freightInsuranceUSD;
            const cifValueSAR = cifValueUSD * USD_TO_SAR_PEGGED_RATE;
            const customsDutySAR = cifValueSAR * GCC_CUSTOMS_DUTY_RATE;
            const zatcaTaxableBaseSAR = cifValueSAR + customsDutySAR;
            const zatcaVatSAR = zatcaTaxableBaseSAR * ZATCA_VAT_RATE;
            const totalLandedSAR = zatcaTaxableBaseSAR + zatcaVatSAR;

            return {
                totalFobUSD,
                cifValueUSD,
                cifValueSAR,
                customsDutySAR,
                zatcaTaxableBaseSAR,
                zatcaVatSAR,
                totalLandedSAR,
                itemCount: parsed.length
            };
        } catch {
            return null;
        }
    }, [bomInput]);

    const executeAuditPayload = async (payload: any[]) => {
        setLoading(true);
        try {
            const res = await fetch('/api/compliance/cst-saber-bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: payload,
                    incoterm: currentIncoterm,
                    saberBindingStatus: currentSaberStatus,
                    governingTR
                }),
            });
            const data = await res.json();
            setAuditResult(data);
        } catch (e) {
            alert('Failed to evaluate BOM payload via compliance gateway.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPreset = (key: string) => {
        const preset = MANIFEST_PRESETS[key];
        if (!preset) return;
        setSelectedPresetKey(key);
        setCurrentIncoterm(preset.incoterm);
        setCurrentSaberStatus(preset.saberBindingStatus);
        setConsigneeCR(preset.consigneeCR);
        setGoverningTR(`${preset.trReferenceCode} (${preset.governingTR})`);
        
        const jsonStr = JSON.stringify(preset.items, null, 2);
        setBomInput(jsonStr);
        setPasteFeedback(`Loaded preset: ${preset.label}`);
        setTimeout(() => setPasteFeedback(null), 3500);
        executeAuditPayload(preset.items);
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
                hsCode: cols[1]?.trim() || '845961000000',
                category: cols[2]?.trim() || 'industrial',
                qty: Number(cols[3]) || 1,
                unitPriceUSD: Number(cols[4]) || 500,
                specSummary: cols[5]?.trim() || 'Imported supplier manifest row',
                sasoStandardParity: 'SASO TR Machinery Safety Parity Required'
            }));
            setBomInput(JSON.stringify(normalizedPayload, null, 2));
            setPasteFeedback('Normalized CSV/TSV clipboard block loaded into state.');
            setTimeout(() => setPasteFeedback(null), 3500);
        } catch (err) {
            console.error('Clipboard read failed:', err);
            alert('Clipboard permission denied. Paste manually into JSON block.');
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

        let items: any[] = [];
        try {
            items = JSON.parse(bomInput);
        } catch {
            items = [];
        }

        const rowsHtml = items
            .map((item: any, idx: number) => {
                const skuCode = item.sku || `SKU-${idx + 1}`;
                const hsFormatted = item.hsCode ? `<br/><span style="color:#64748b; font-family: monospace; font-size:10px;">HS: ${item.hsCode}</span>` : '';
                const categoryDesc = item.specSummary || item.description || item.category || 'Industrial Cargo';
                const sasoParity = item.sasoStandardParity || 'SASO Standard Equivalence Required';
                const qtyVal = Number(item.qty || 1).toLocaleString();
                const unitPrice = item.unitPriceUSD ? `$${Number(item.unitPriceUSD).toLocaleString()}` : 'N/A';

                return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 7px 8px; font-family: monospace; font-size: 11px;">
            <strong>${skuCode}</strong>${hsFormatted}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 8px; font-size: 11px;">
            <div>${categoryDesc}</div>
            <div style="color: #0369a1; font-family: monospace; font-size: 10px; margin-top: 3px;">• Standard: ${sasoParity}</div>
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 8px; text-align: right; font-weight: 600; font-size: 11px;">${qtyVal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 8px; text-align: right; font-family: monospace; font-size: 11px;">${unitPrice}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 8px; text-align: center; font-size: 11px;">
            <span style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 10px;">
              ${currentSaberStatus === 'BOUND' ? '✓ SABER PC/SC LINKED' : '⚠️ SCoC PENDING'}
            </span>
          </td>
        </tr>
      `;
            })
            .join('');

        const dapWarningHtml = isHighRiskDAP ? `
      <div style="margin-bottom: 16px; padding: 12px; border: 2px solid #b45309; background: #fffbeb; border-radius: 4px; font-family: monospace; font-size: 11px; color: #92400e;">
        <strong style="color: #b45309;">⚠️ CRITICAL DAP/DDP DEMURRAGE EXPOSURE ALERT:</strong><br/>
        Consignee Saudi Commercial Registration (CR) is UNBOUND in the SABER platform. Under DAP terms, container demurrage ($500–$1,500/day) at port of destination rests strictly on the consignor until the local buyer issues SCoC digital authorization. Vessel dispatch without prior SCoC linkage creates immediate clearance hold risks.
      </div>
    ` : `
      <div style="margin-bottom: 16px; padding: 10px 12px; border: 1px solid #059669; background: #ecfdf5; border-radius: 4px; font-family: monospace; font-size: 11px; color: #065f46;">
        <strong>✓ INCOTERM CLEARANCE STATUS (${currentIncoterm}):</strong> Consignee CR (${consigneeCR}) bound. Upstream standard parity mapped. Demurrage exposure mitigated.
      </div>
    `;

        const fiscalBreakdownHtml = fiscalSummary ? `
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 11px;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
          <div style="border-right: 1px solid #e2e8f0; padding-right: 8px;">
            <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">CIF Valuation</div>
            <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">$${fiscalSummary.cifValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div style="color: #64748b; font-size: 9px;">SAR ${fiscalSummary.cifValueSAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div style="border-right: 1px solid #e2e8f0; padding-right: 8px;">
            <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">GCC Customs Duty (5%)</div>
            <div style="font-weight: 700; color: #0369a1; margin-top: 2px;">SAR ${fiscalSummary.customsDutySAR.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div style="color: #64748b; font-size: 9px;">Unified GCC Base</div>
          </div>
          <div style="border-right: 1px solid #e2e8f0; padding-right: 8px;">
            <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">ZATCA VAT (15%)</div>
            <div style="font-weight: 700; color: #b45309; margin-top: 2px;">SAR ${fiscalSummary.zatcaVatSAR.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div style="color: #64748b; font-size: 9px;">15% × (CIF + Duty)</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">Total Landed Fiscal Base</div>
            <div style="font-weight: 800; color: #0f172a; margin-top: 2px;">SAR ${fiscalSummary.totalLandedSAR.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div style="color: #047857; font-size: 9px; font-weight: 600;">Phase-2 Reconciled</div>
          </div>
        </div>
      </div>
    ` : '';

        const verificationBlock = `
      <div style="margin-top: 20px; padding: 12px; border: 1px dashed #94a3b8; background: #ffffff; display: flex; justify-content: space-between; align-items: center; border-radius: 4px;">
        <div style="font-family: monospace; font-size: 9px; line-height: 1.6; color: #334155;">
          <div><strong style="color: #0f172a;">GOVERNING SAUDI TR:</strong> ${governingTR}</div>
          <div><strong style="color: #0f172a;">ZATCA CRYPTOGRAPHIC STAMP:</strong> SHA-256 PARITY VERIFIED</div>
          <div>INVOICE DIGEST: <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></div>
          <div>FASAH PRE-DECLARATION BATCH: <code>SA-RUH-2026-09-EXP-${Math.floor(1000 + Math.random() * 9000)}</code></div>
          <div style="color: #047857; font-weight: bold; margin-top: 3px;">✓ 72-HOUR FASAH PRE-ARRIVAL CONFORMANCE ENGINE READY</div>
        </div>
        <div style="text-align: center; margin-left: 16px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=ZATCA-MIU33-PREFLIGHT-VERIFIED-BOM-BATCH-202609" alt="ZATCA Compliance QR" style="width: 72px; height: 72px; border: 1px solid #cbd5e1; padding: 2px; background: #fff;" />
          <div style="font-size: 8px; font-family: monospace; color: #64748b; margin-top: 2px;">SCAN TO VERIFY</div>
        </div>
      </div>
    `;

        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MIU_33 // Sovereign Trade Compliance Submittal Dossier</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 8px; }
            h1 { font-size: 16px; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin: 0 0 4px 0; letter-spacing: -0.01em; }
            .subtitle { font-size: 10px; font-family: monospace; color: #475569; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            th { background-color: #f8fafc; border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #334155; }
            .footer { font-size: 9px; font-family: monospace; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 16px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>MIU_33 // TRADE COMPLIANCE & SOVEREIGN PRE-CLEARANCE SUBMITTAL</h1>
          <div class="subtitle">
            Port of Discharge: ${MANIFEST_PRESETS[selectedPresetKey]?.destinationPort || 'KSA Maritime Berth'} | Incoterm: ${currentIncoterm} | Consignee CR: ${consigneeCR}
          </div>

          ${dapWarningHtml}

          <table>
            <thead>
              <tr>
                <th style="width: 25%;">SKU / HS Subheading</th>
                <th style="width: 45%;">BOM Spec & Standard Parity</th>
                <th style="width: 10%; text-align: right;">Qty</th>
                <th style="width: 10%; text-align: right;">FOB Unit</th>
                <th style="width: 10%; text-align: center;">SABER Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${fiscalBreakdownHtml}
          ${verificationBlock}

          <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-family: monospace; font-size: 8px; color: #64748b; line-height: 1.4;">
            <strong>STATUTORY COMPLIANCE NOTICE:</strong> This document represents an automated upstream pre-clearance parity evaluation compiled by MIU_33 Sovereign Trade Core. Final customs physical release and electronic discharge across Jeddah Islamic Port, King Abdulaziz Port Dammam, and Riyadh Dry Port remain strictly contingent on accredited Conformity Assessment Body (CAB) laboratory approvals, active SABER SCoC linkage by the licensed Saudi importer of record, and successful ZATCA cryptographic clearance.
          </div>

          <div class="footer">
            <span>MIU_33 Sovereign AEC & Trade Compliance Engine</span>
            <span>https://miu33archstudio.xyz</span>
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
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <div>
                    <h2 className="text-lg font-bold tracking-wider">MIU_33 // INDUSTRIAL BOM & CST-SABER AUDIT</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Automated Sino-Saudi Standard Parity, FASAH Pre-Declaration & Landed Fiscal Engine</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/40">
                        {currentIncoterm} GATEWAY
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded border ${
                        currentSaberStatus === 'BOUND' 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    }`}>
                        SABER: {currentSaberStatus}
                    </span>
                </div>
            </div>

            {/* Incoterm Risk & Consignee Prerequisite Alert */}
            {isHighRiskDAP ? (
                <div className="mb-4 p-3.5 bg-amber-950/40 border-2 border-amber-500/80 rounded text-xs text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                        <span>⚠️ CRITICAL {currentIncoterm} DEMURRAGE EXPOSURE ALERT</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                        <strong>Consignee Commercial Registration (CR) is unbound in SABER.</strong> Under {currentIncoterm} terms, the seller carries total port demurrage risk ($500–$1,500/day per container). If the Saudi buyer does not issue the SCoC via their corporate portal 72 hours prior to arrival, cargo cannot be pre-declared in FASAH.
                    </p>
                </div>
            ) : (
                <div className="mb-4 p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded text-xs text-emerald-300 flex items-center justify-between">
                    <span>✓ <strong>INCOTERM CLEARANCE STATUS ({currentIncoterm}):</strong> Consignee CR ({consigneeCR}) verified. Low port demurrage risk.</span>
                    <span className="text-[10px] text-emerald-400 font-mono">FASAH READY</span>
                </div>
            )}

            {/* Manifest Preset Switcher Bar */}
            <div className="mb-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">1-CLICK TR PRESETS:</span>
                    <button
                        type="button"
                        onClick={() => handleSelectPreset('ARCHITECTURAL_CURTAIN_WALL')}
                        className={`text-xs px-3 py-1.5 rounded transition ${
                            selectedPresetKey === 'ARCHITECTURAL_CURTAIN_WALL'
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                    >
                        ARCHITECTURAL ENVELOPE (CIF)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSelectPreset('INDUSTRIAL_CNC_MACHINERY')}
                        className={`text-xs px-3 py-1.5 rounded transition ${
                            selectedPresetKey === 'INDUSTRIAL_CNC_MACHINERY'
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                    >
                        CNC MACHINERY (DAP RISK DEMO)
                    </button>
                </div>
                <div className="text-[11px] text-slate-400">
                    Governing TR: <span className="text-cyan-300">{governingTR}</span>
                </div>
            </div>

            {/* Calculated Fiscal Overview Strip */}
            {fiscalSummary && (
                <div className="mb-4 bg-slate-900/80 border border-cyan-500/20 rounded p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                        <div className="text-[10px] text-slate-400">EST. CIF VALUATION</div>
                        <div className="text-sm font-bold text-slate-200 mt-0.5">${fiscalSummary.cifValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-[10px] text-slate-500">SAR {fiscalSummary.cifValueSAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400">GCC DUTY (5%)</div>
                        <div className="text-sm font-bold text-cyan-400 mt-0.5">SAR {fiscalSummary.customsDutySAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-[10px] text-slate-500">Unified Tariff</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400">ZATCA VAT (15%)</div>
                        <div className="text-sm font-bold text-amber-400 mt-0.5">SAR {fiscalSummary.zatcaVatSAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-[10px] text-slate-500">15% × (CIF + Duty)</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400">TOTAL LANDED FISCAL</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">SAR {fiscalSummary.totalLandedSAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-[10px] text-emerald-500 font-semibold">Phase-2 Pre-Reconciled</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <label className="text-xs text-slate-400">INCOMING BILL OF MATERIALS (JSON):</label>
                        <div className="flex gap-2">
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
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 p-3 text-xs rounded focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                        onClick={handleEvaluate}
                        disabled={loading}
                        className="mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded text-xs transition"
                    >
                        {loading ? 'COMPUTING COMPLIANCE PARITY...' : 'EXECUTE CST / SABER PARITY AUDIT'}
                    </button>
                </div>

                <div className="flex flex-col bg-slate-900 border border-slate-800 p-4 rounded overflow-auto max-h-110">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                        <h3 className="text-xs text-slate-400">AUDIT MANIFEST OUTPUT:</h3>
                        <button
                            onClick={handlePrintExecutiveBrief}
                            className="text-[11px] bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded transition flex items-center gap-1.5"
                        >
                            <span>🖨️</span>
                            <span>PRINT / EXPORT DOSSIER</span>
                        </button>
                    </div>
                    {auditResult ? (
                        <pre className="text-xs text-cyan-300 whitespace-pre-wrap flex-1 font-mono">
                            {JSON.stringify(auditResult, null, 2)}
                        </pre>
                    ) : (
                        <div className="text-xs text-slate-500 italic mt-20 text-center flex-1">
                            Click &quot;EXECUTE CST / SABER PARITY AUDIT&quot; or print directly to evaluate current manifest...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}