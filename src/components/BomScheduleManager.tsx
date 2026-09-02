import React, { useState, useRef } from "react";

export interface BomItem {
  id: string;
  code: string;
  name: string;
  techSpec: string;
  material: string;
  quantity: number | string;
  unit: string;
  unitPriceUSD: number | string;
  sasoEquivalent?: string;
  hsCode?: string;
}

interface BomUploaderProps {
  onParsed: (items: BomItem[]) => void;
}

// Native CSV parser (zero external npm dependencies)
function parseCsv(text: string): BomItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, idx) => {
    // Regex splits commas while preserving quotes
    const cols = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((c) => c.replace(/^"|"$/g, "").trim());

    const grade = cols[5] || "";

    return {
      id: `ITEM-${String(idx + 1).padStart(3, "0")}`,
      code: cols[0] ? `CW-${String(cols[0]).padStart(2, "0")}` : `CW-${String(idx + 1).padStart(2, "0")}`,
      name: cols[1] || "Unspecified Material",
      quantity: cols[2] || "1",
      unit: cols[3] || "pcs",
      unitPriceUSD: cols[4] || "0",
      techSpec: grade || "GB/T Standard",
      material: cols[6] || "Domestic Mill",
      sasoEquivalent: grade.includes("1591")
        ? "SASO ASTM A572 Gr.50"
        : "SASO / ISO Parity",
      hsCode: "7216.33.0000",
    };
  });
}

export function BomUploader({ onParsed }: BomUploaderProps) {
  const [parsing, setParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setParsing(true);
    try {
      if (file.name.endsWith(".csv") || file.type.includes("csv") || file.name.endsWith(".txt")) {
        // Direct in-browser parsing for CSV
        const text = await file.text();
        const items = parseCsv(text);
        onParsed(items);
      } else {
        // Binary Excel (.xlsx) passed through backend gateway
        const formData = new FormData();
        formData.append("bomFile", file);

        const res = await fetch("/api/services/parse-bom", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        onParsed(items);
      }
    } catch (err: any) {
      console.error("[BOM_PARSER_ERROR]", err);
      alert(`Spreadsheet Ingestion Error: ${err.message}`);
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border border-dashed p-6 rounded bg-black/40 text-center transition-all ${
        isDragging
          ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          : "border-cyan-500/40 hover:border-cyan-500/80"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        onChange={handleFileUpload}
        disabled={parsing}
        className="hidden"
        id="bom-upload-input"
      />
      <label
        htmlFor="bom-upload-input"
        className="cursor-pointer text-xs font-mono text-cyan-400 hover:text-cyan-300 block select-none"
      >
        {parsing
          ? "PARSING SPREADSHEET..."
          : isDragging
          ? "DROP FACTORY SCHEDULE TO INGEST"
          : "[ + DRAG & DROP OR CLICK TO INGEST FACTORY BOM (.XLSX / .CSV) ]"}
      </label>
    </div>
  );
}