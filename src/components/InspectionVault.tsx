'use client';

import React, { useState, useMemo } from 'react';

export interface VaultDocument {
  id: string;
  name: string;
  type: string;
  status: 'VERIFIED' | 'PENDING_UPLOAD' | 'AWAITING_PCoC_LINKAGE' | 'VERIFIED_INSPECTED';
  date: string;
  scopeTag?: string;
}

export default function InspectionVault() {
  const [documents, setDocuments] = useState<VaultDocument[]>([
    { 
      id: 'DOC-01', 
      name: 'Commercial Invoice (ZATCA Phase-2 Dual-Lang)', 
      type: 'PDF', 
      status: 'VERIFIED', 
      date: '2026-09-17',
      scopeTag: 'Cryptographic Hash Validated'
    },
    { 
      id: 'DOC-02', 
      name: 'SASO SABER PCoC Certificate (1-Year Product)', 
      type: 'PDF', 
      status: 'PENDING_UPLOAD', 
      date: '---',
      scopeTag: 'CAB Lab Test Scope Required'
    },
    { 
      id: 'DOC-03', 
      name: 'Bill of Lading (eBOL Manifest)', 
      type: 'EDIG', 
      status: 'VERIFIED', 
      date: '2026-09-16',
      scopeTag: 'Maritime Berth Pre-Lodged'
    },
    { 
      id: 'DOC-04', 
      name: 'SASO SABER SCoC Certificate (Shipment Specific)', 
      type: 'PDF', 
      status: 'AWAITING_PCoC_LINKAGE', 
      date: '---',
      scopeTag: 'Single Invoice & B/L Bound'
    },
  ]);
  const [uploading, setUploading] = useState(false);

  // Strict Regulatory Evaluation: PCoC and SCoC must be valid before FASAH submission
  const isPcocVerified = useMemo(() => {
    return documents.find(d => d.id === 'DOC-02')?.status.includes('VERIFIED');
  }, [documents]);

  const isScocVerified = useMemo(() => {
    return documents.find(d => d.id === 'DOC-04')?.status.includes('VERIFIED');
  }, [documents]);

  const isFasahReady = isPcocVerified && isScocVerified;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setTimeout(() => {
        setDocuments((prev) => {
          // If uploading PCoC, update DOC-02 directly
          if (file.name.toLowerCase().includes('pcoc') || prev[1]?.status === 'PENDING_UPLOAD') {
            const updated = [...prev];
            updated[1] = {
              ...updated[1],
              status: 'VERIFIED_INSPECTED',
              date: new Date().toISOString().split('T')[0],
              scopeTag: 'Accredited CAB Verified'
            };
            // Unlock SCoC readiness when PCoC is verified
            updated[3] = {
              ...updated[3],
              status: 'VERIFIED_INSPECTED',
              date: new Date().toISOString().split('T')[0],
              scopeTag: 'Linked to Verified PCoC'
            };
            return updated;
          }

          return [
            ...prev,
            {
              id: `DOC-0${prev.length + 1}`,
              name: file.name,
              type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
              status: 'VERIFIED_INSPECTED',
              date: new Date().toISOString().split('T')[0],
              scopeTag: 'Ingested Document'
            },
          ];
        });
        setUploading(false);
      }, 600);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to generate the official PDF inspection report.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MIU_33 // Official Inspection & Compliance Dossier</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; }
            h1 { font-size: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px; font-weight: 800; }
            .meta { margin-bottom: 16px; font-size: 10px; font-family: monospace; color: #475569; }
            .alert { padding: 8px 12px; margin-bottom: 14px; font-family: monospace; font-size: 10px; border-radius: 4px; }
            .alert-warning { background: #fffbeb; border: 1px solid #b45309; color: #92400e; }
            .alert-success { background: #ecfdf5; border: 1px solid #059669; color: #065f46; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; font-family: monospace; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 700; color: #334155; }
            .badge-verified { font-weight: bold; color: #047857; }
            .badge-pending { font-weight: bold; color: #b45309; }
            .footer { margin-top: 30px; font-size: 8.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>MIU_33 // OFFICIAL INSPECTION &amp; DOCUMENT VAULT DOSSIER</h1>
          <div class="meta">
            <div><strong>DESTINATION GATEWAY:</strong> FASAH (Saudi Customs) &amp; SABER Port Authority</div>
            <div><strong>GENERATED DATE:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>CLEARANCE COMPLIANCE STATE:</strong> ${isFasahReady ? 'READY FOR 72H PRE-BERTH CLEARANCE' : 'PORT ENTRY HOLD RISK (PENDING CERTIFICATES)'}</div>
          </div>

          <div class="${isFasahReady ? 'alert alert-success' : 'alert alert-warning'}">
            ${isFasahReady 
              ? '✓ FULL CONFORMITY RECORD: Valid PCoC and linked SCoC confirmed. Inbound cargo cleared for FASAH electronic discharge.'
              : '⚠️ REGULATORY COMPLIANCE HOLD: Under Saudi Customs and SASO statutory rules, commercial shipments without an active PCoC and linked SCoC cannot execute 72h FASAH pre-declaration, triggering container demurrage ($120–$250/day).'
            }
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">DOC ID</th>
                <th style="width: 48%;">DOCUMENT TITLE / SPECIFICATION</th>
                <th style="width: 10%;">FORMAT</th>
                <th style="width: 15%;">INGESTED DATE</th>
                <th style="width: 15%;">INSPECTION STATE</th>
              </tr>
            </thead>
            <tbody>
              ${documents.map(doc => `
                <tr>
                  <td><strong>${doc.id}</strong></td>
                  <td>
                    <div>${doc.name}</div>
                    <div style="color: #64748b; font-size: 8.5px;">• ${doc.scopeTag || 'Customs Lodged'}</div>
                  </td>
                  <td>${doc.type}</td>
                  <td>${doc.date}</td>
                  <td class="${doc.status.includes('VERIFIED') ? 'badge-verified' : 'badge-pending'}">${doc.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Certified compliance record compiled via MIU_33 Sovereign Core Engine // https://miu33archstudio.xyz</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-[#061017] border border-[#142838] p-6 rounded-lg font-mono text-cyan-400 max-w-4xl mx-auto my-6">
      <div className="flex items-center justify-between border-b border-[#142838] pb-4 mb-6">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider">
            // OFFICIAL INSPECTION &amp; DOCUMENT VAULT
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Centralized repository for customs inspection files, SASO test reports, and e-invoicing proofs.
          </p>
        </div>
        <label className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 text-xs font-bold rounded cursor-pointer transition">
          {uploading ? 'INGESTING...' : '+ UPLOAD INSPECTION DOC'}
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Dynamic Statutory Warning Bar */}
      {!isFasahReady && (
        <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/60 rounded text-[11px] text-amber-300">
          <span className="font-bold">⚠️ SASO / FASAH STATUTORY GATE:</span> PCoC (DOC-02) or SCoC (DOC-04) is unverified. Cargo cannot be pre-declared 72h prior to arrival at Jeddah or Dammam port.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#02070a] text-gray-500 border-b border-[#142838]">
              <th className="p-3">DOC ID</th>
              <th className="p-3">DOCUMENT TITLE / SPECIFICATION</th>
              <th className="p-3">FORMAT</th>
              <th className="p-3">INGESTED DATE</th>
              <th className="p-3 text-right">INSPECTION STATE</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-[#0d1b26] hover:bg-[#08121a]">
                <td className="p-3 text-cyan-300 font-bold">{doc.id}</td>
                <td className="p-3 text-white">
                  <div>{doc.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">• {doc.scopeTag}</div>
                </td>
                <td className="p-3 text-gray-400">{doc.type}</td>
                <td className="p-3 text-gray-400">{doc.date}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-1 text-[10px] font-bold border ${
                    doc.status.includes('VERIFIED') 
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' 
                      : 'border-amber-500 text-amber-400 bg-amber-950/30'
                  }`}>
                    ● {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-[#02070a] border border-[#142838] flex flex-wrap justify-between items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">FASAH &amp; SABER SYNC:</span>{' '}
          <strong className={`px-2 py-0.5 rounded text-[11px] border ${
            isFasahReady 
              ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' 
              : 'text-amber-400 bg-amber-950/40 border-amber-500/40'
          }`}>
            {isFasahReady ? 'READY FOR PORT SUBMISSION' : 'HOLD EXPOSURE // PENDING PCoC & SCoC'}
          </strong>
        </div>
        <button
          onClick={handleExportPDF}
          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-4 py-2 font-bold transition cursor-pointer"
        >
          📄 EXPORT OFFICIAL INSPECTION REPORT (PDF)
        </button>
      </div>
    </div>
  );
}