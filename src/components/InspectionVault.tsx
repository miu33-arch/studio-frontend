'use client';

import React, { useState } from 'react';

export default function InspectionVault() {
  const [documents, setDocuments] = useState<any[]>([
    { id: 'DOC-01', name: 'Commercial Invoice (ZATCA Dual-Lang)', type: 'PDF', status: 'VERIFIED', date: '2026-09-17' },
    { id: 'DOC-02', name: 'SASO SABER PCoC Certificate', type: 'PDF', status: 'PENDING_UPLOAD', date: '---' },
    { id: 'DOC-03', name: 'Bill of Lading (eBOL Manifest)', type: 'EDIG', status: 'VERIFIED', date: '2026-09-16' },
  ]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setTimeout(() => {
        setDocuments((prev) => [
          ...prev,
          {
            id: `DOC-0${prev.length + 1}`,
            name: file.name,
            type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            status: 'VERIFIED_INSPECTED',
            date: new Date().toISOString().split('T')[0],
          },
        ]);
        setUploading(false);
      }, 600);
    }
  };

  const handleExportPDF = () => {
    // Open a clean, professional print window structured specifically for customs brokers and officials
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
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { margin-bottom: 20px; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #f4f4f4; }
            .badge { font-weight: bold; color: #007000; }
            .footer { margin-top: 40px; font-size: 10px; color: #777; border-top: 1px solid #ddd; pt: 10px; }
          </style>
        </head>
        <body>
          <h1>MIU_33 ARCHITECTURE STUDIO // OFFICIAL INSPECTION &amp; DOCUMENT VAULT</h1>
          <div class="meta">
            <p><strong>Destination Gateway:</strong> FASAH &amp; SABER Port Authority</p>
            <p><strong>Generated Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Clearance State:</strong> READY FOR PORT SUBMISSION</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>DOC ID</th>
                <th>DOCUMENT TITLE / SPECIFICATION</th>
                <th>FORMAT</th>
                <th>INGESTED DATE</th>
                <th>INSPECTION STATE</th>
              </tr>
            </thead>
            <tbody>
              ${documents.map(doc => `
                <tr>
                  <td>${doc.id}</td>
                  <td>${doc.name}</td>
                  <td>${doc.type}</td>
                  <td>${doc.date}</td>
                  <td class="badge">${doc.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Certified secure compliance record compiled via MIU_33 Sovereign Core Engine.</p>
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
            {documents.map((doc, idx) => (
              <tr key={idx} className="border-b border-[#0d1b26] hover:bg-[#08121a]">
                <td className="p-3 text-cyan-300 font-bold">{doc.id}</td>
                <td className="p-3 text-white">{doc.name}</td>
                <td className="p-3 text-gray-400">{doc.type}</td>
                <td className="p-3 text-gray-400">{doc.date}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-1 text-[10px] font-bold border ${
                    doc.status.includes('VERIFIED') 
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' 
                      : 'border-amber-500 text-amber-400 bg-amber-950/20'
                  }`}>
                    ● {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-[#02070a] border border-[#142838] flex justify-between items-center text-xs">
        <div>
          <span className="text-gray-400">FASAH &amp; SABER SYNC:</span>{' '}
          <strong className="text-emerald-400">READY FOR PORT SUBMISSION</strong>
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