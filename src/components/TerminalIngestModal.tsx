import React, { useState } from "react";
import { validateAndSanitizePayload, ValidationReport, RawLineItem } from "../utils/validationSchema";

export function TerminalIngestModal({ onCommitPayload }: { onCommitPayload: (cleanItems: any[]) => void }) {
  const [rawText, setRawText] = useState("");
  const [taxIdInput, setTaxIdInput] = useState("300000000000003");
  const [report, setReport] = useState<ValidationReport | null>(null);

  // Accept explicit text and taxId overrides to avoid React batching lag
  const runValidation = (text: string, currentTaxId: string) => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      setReport(null);
      return;
    }

    const parsedRows: RawLineItem[] = lines.map((line, idx) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      return {
        code: parts[0] || `ITM-${idx + 1}`,
        name: parts[1] || "Raw Ingested Component",
        qty: parts[2] || "1",
        unitPrice: parts[3] || "0",
        hsCode: parts[4] || ""
      };
    });

    const validation = validateAndSanitizePayload(parsedRows, currentTaxId);
    setReport(validation);
  };

  const handleTaxIdChange = (val: string) => {
    setTaxIdInput(val);
    if (rawText.trim().length > 0) {
      runValidation(rawText, val);
    }
  };

  const handleTextChange = (val: string) => {
    setRawText(val);
    runValidation(val, taxIdInput);
  };

  return (
    <div style={{ backgroundColor: "#050807", border: "1px solid #1a2e26", padding: "16px", fontFamily: "monospace", color: "#c2e0d0" }}>
      <div style={{ fontSize: "0.75rem", color: "#00e5ff", fontWeight: "bold", marginBottom: "8px" }}>
        &gt; RAW DATA INGESTION // CLIENT_SIDE_SANDBOX
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "0.65rem", color: "#7a9a8b" }}>ZATCA CLIENT TAX ID (15-DIGIT):</label>
        <input
          type="text"
          value={taxIdInput}
          onChange={(e) => handleTaxIdChange(e.target.value)}
          placeholder="3xxxxxxxxxxxx3"
          style={{ width: "100%", backgroundColor: "#020403", border: "1px solid #162620", color: "#00ff66", padding: "6px", fontSize: "0.75rem", fontFamily: "monospace" }}
        />
      </div>

      <textarea
        rows={6}
        value={rawText}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Paste CSV rows: Code, Description, Qty, UnitPrice, HS-Code&#10;Example: CW-01, Main Aluminum Mullion, 250, 48.50, 7604.29.00"
        style={{ width: "100%", backgroundColor: "#020403", border: "1px solid #162620", color: "#fff", padding: "8px", fontSize: "0.75rem", fontFamily: "monospace", resize: "vertical" }}
      />

      {report && (
        <div style={{ marginTop: "10px", fontSize: "0.68rem" }}>
          {report.errors.length > 0 ? (
            <div style={{ border: "1px solid #ff3333", backgroundColor: "rgba(255, 51, 51, 0.05)", padding: "8px" }}>
              <div style={{ color: "#ff3333", fontWeight: "bold", marginBottom: "4px" }}>
                [ERRORS DETECTED - ARTIFACT GENERATION LOCKED]:
              </div>
              {report.errors.map((err, i) => (
                <div key={i} style={{ color: "#ff9999" }}>• {err}</div>
              ))}
            </div>
          ) : (
            <div style={{ border: "1px solid #00ff66", backgroundColor: "rgba(0, 255, 102, 0.05)", padding: "8px", color: "#00ff66" }}>
              ✓ SCHEMA VALIDATION PASSED: {report.sanitizedItems.length} items staged. Zero layout faults predicted.
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!report || !report.isValid}
        onClick={() => report?.isValid && onCommitPayload(report.sanitizedItems)}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "10px",
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "0.75rem",
          cursor: report?.isValid ? "pointer" : "not-allowed",
          backgroundColor: report?.isValid ? "#00ff66" : "#111b15",
          color: report?.isValid ? "#000" : "#44554c",
          border: "none",
          transition: "0.2s all"
        }}
      >
        {report?.isValid ? "⚡ STAGE CLEAN PAYLOAD FOR ENGINE" : "🔒 RESOLVE ERRORS TO UNLOCK STAGING"}
      </button>
    </div>
  );
}