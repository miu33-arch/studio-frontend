"use client";

import React, { useState, useEffect, useRef } from "react";
import PitchDeck from "@/components/PitchDeck";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.miu33archstudio.xyz").replace(/\/+$/, "");

interface StagedBomItem {
  code: string;
  name: string;
  details: string;
  material: string;
  standard: string;
}

const SAMPLE_ZH: StagedBomItem[] = [
  { code: "CW-01", name: "铝合金主龙骨", details: "阳极氧化表面处理, 壁厚3.0mm", material: "6063-T6 铝合金", standard: "GB/T 5237 / SASO 2831" },
  { code: "GL-02", name: "双银Low-E中空钢化玻璃", details: "6mm Low-E + 12A + 6mm 清玻", material: "超白浮法玻璃", standard: "ASTM C1036 / SASO ISO 12543" }
];

const SAMPLE_EN: StagedBomItem[] = [
  { code: "CW-01", name: "Aluminum Main Mullion", details: "Anodized surface finish, 3.0mm wall thickness", material: "6063-T6 Aluminum Alloy", standard: "GB/T 5237 / SASO 2831" },
  { code: "GL-02", name: "Double Silver Low-E Insulated Glass", details: "6mm Low-E + 12A + 6mm Clear Float", material: "Ultra-Clear Float Glass", standard: "ASTM C1036 / SASO ISO 12543" }
];

export default function SovereignCorePage() {
  const [activeTab, setActiveTab] = useState<"spec" | "invoice" | "site_hud" | "pitch">("spec");
  const [projectCode, setProjectCode] = useState("MOMRAH-RYD-2026-04");

  // Tab 1: BOM & SASO State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [translationMode, setTranslationMode] = useState<"ZH_TO_GCC" | "EN_TO_ZH_AR">("ZH_TO_GCC");
  const [stagedDocTitle, setStagedDocTitle] = useState("幕墙与铝合金型材技术规范 (Curtain Wall Spec)");
  const [stagedItems, setStagedItems] = useState<StagedBomItem[]>(SAMPLE_ZH);
  const [specLoading, setSpecLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Tab 2: Commercial & ZATCA Tax State
  const [invoiceClient, setInvoiceClient] = useState("AL-RAJHI COMMERCIAL CONTRACTING");
  const [invoiceCurrency, setInvoiceCurrency] = useState("SAR");
  const [freightUSD, setFreightUSD] = useState("2400");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [customsLoading, setCustomsLoading] = useState(false);

  // Tab 3: Site & BIM Telemetry State
  const [droneFile, setDroneFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState("MOMRAH CENTRAL TOWER // ZONE 4");
  const [datumElevation, setDatumElevation] = useState("+12.50m (Structural Slab Level)");
  const [gpsCoords, setGpsCoords] = useState("24.7136° N, 46.6753° E (Riyadh, KSA)");
  const [baladyLicense, setBaladyLicense] = useState("BLD-RYD-2026-9941");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [is4K, setIs4K] = useState(false);
  const [siteHudLoading, setSiteHudLoading] = useState(false);
  const [saberLoading, setSaberLoading] = useState(false);

  // Tab 3: 4D BIM Multi-Clip State
  const [phaseClips, setPhaseClips] = useState<File[]>([]);
  const [bimLoading, setBimLoading] = useState(false);
  const [bimOutput, setBimOutput] = useState<any>(null);

  // Universal Dossier Zipper State
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierZipUrl, setDossierZipUrl] = useState<string | null>(null);
  const [dossierError, setDossierError] = useState<string | null>(null);

  // Output & Audit History State
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Tenancy Authentication & Session State
  const [activeApiKey] = useState("miu_master_agency_key");
  const [clientBalance, setClientBalance] = useState<any>(null);

  const fetchClientBalance = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clients/balance`, {
        headers: { "x-api-key": activeApiKey },
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) setClientBalance(data.client);
      }
    } catch (err) {
      console.error("Backend balance offline:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/companion/history`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) setHistory(data.logs);
      }
    } catch (err) {
      console.error("Backend history offline:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchClientBalance();
  }, [activeApiKey]);

  const handleModeChange = (mode: "ZH_TO_GCC" | "EN_TO_ZH_AR") => {
    setTranslationMode(mode);
    if (mode === "ZH_TO_GCC") {
      setStagedDocTitle("幕墙与铝合金型材技术规范 (Curtain Wall Spec)");
      setStagedItems(SAMPLE_ZH);
    } else {
      setStagedDocTitle("Curtain Wall and Aluminum Profile Technical Specification");
      setStagedItems(SAMPLE_EN);
    }
  };

  const handleUpdateItem = (index: number, field: keyof StagedBomItem, value: string) => {
    const updated = [...stagedItems];
    updated[index][field] = value;
    setStagedItems(updated);
  };

  const handleAddItem = () => {
    const nextIndex = stagedItems.length + 1;
    const prefix = translationMode === "ZH_TO_GCC" ? "CW" : "ITM";
    setStagedItems([
      ...stagedItems,
      {
        code: `${prefix}-0${nextIndex}`,
        name: "",
        details: "",
        material: "",
        standard: translationMode === "ZH_TO_GCC" ? "GB/T / SASO" : "ASTM / SASO"
      }
    ]);
  };

  const handleDeleteItem = (index: number) => {
    setStagedItems(stagedItems.filter((_, i) => i !== index));
  };

  const handleExportCsv = () => {
    const headers = ["CODE", "ITEM NAME", "SPECIFICATION", "MATERIAL", "STANDARD"];
    const rows = stagedItems.map((i) => [
      `"${i.code}"`,
      `"${i.name}"`,
      `"${i.details}"`,
      `"${i.material}"`,
      `"${i.standard}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${projectCode}_BOM_SCHEDULE.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZipDossier = async () => {
    setDossierLoading(true);
    setDossierError(null);
    try {
      const res = await fetch(`${API_BASE}/api/services/export-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
        body: JSON.stringify({ projectCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dossier packaging failed");

      setDossierZipUrl(data.downloadUrl);

      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.setAttribute("download", data.fileName || `${projectCode}_DOSSIER.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setDossierError(err.message);
    } finally {
      setDossierLoading(false);
    }
  };

  const parseAndStageFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isSpreadsheet = fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv");

    if (isSpreadsheet) {
      setSpecLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("bomFile", file);

      try {
        const res = await fetch(`${API_BASE}/api/services/parse-bom`, {
          method: "POST",
          headers: { "x-api-key": activeApiKey },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Spreadsheet parsing failed.");

        const mappedItems: StagedBomItem[] = data.items.map((it: any, idx: number) => ({
          code: it.code || it.id || `BOM-${String(idx + 1).padStart(2, "0")}`,
          name: it.name || it.description || "Classified Component",
          details: it.category ? `Cat: ${it.category} | HS: ${it.hsCode || "7604.29.00"}` : (it.details || "Fabricated Subassembly"),
          material: it.material || it.standardGrade || "Structural Alloy",
          standard: it.sasoStandard || it.sasoEquivalent || "SASO / ASTM Specified"
        }));

        setStagedItems(mappedItems);
        setStagedDocTitle(`${file.name.replace(/\.[^/.]+$/, "")} (Auto-Classified BOM)`);
      } catch (err: any) {
        setError(`BOM Spreadsheet Ingestion Error: ${err.message}`);
      } finally {
        setSpecLoading(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = (event.target?.result as string).trim();
        if (content.startsWith("{") || content.startsWith("[")) {
          const parsed = JSON.parse(content);
          if (parsed.documentTitle) setStagedDocTitle(parsed.documentTitle);
          if (Array.isArray(parsed.items)) {
            setStagedItems(parsed.items);
            return;
          } else if (Array.isArray(parsed)) {
            setStagedItems(parsed);
            return;
          }
        }

        const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0].toLowerCase();
          const hasHeader = firstLine.includes("code") || firstLine.includes("item") || firstLine.includes("序号") || firstLine.includes("material");
          const dataLines = hasHeader ? lines.slice(1) : lines;

          const parsedCsv: StagedBomItem[] = dataLines.map((line, idx) => {
            const parts = line.split(/[,;\t]/);
            return {
              code: parts[0]?.trim() || `ITM-0${idx + 1}`,
              name: parts[1]?.trim() || `Imported Item ${idx + 1}`,
              details: parts[2]?.trim() || "",
              material: parts[3]?.trim() || "",
              standard: parts[4]?.trim() || "SASO / ASTM"
            };
          });

          if (parsedCsv.length > 0) {
            setStagedItems(parsedCsv);
            setStagedDocTitle(file.name.replace(/\.[^/.]+$/, "") + " (Imported BOM)");
          }
        }
      } catch (err) {
        console.error("File parse error:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050505", color: "#00f3ff", fontFamily: "monospace", padding: "40px" }}>
      <header style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", letterSpacing: "2px", margin: 0 }}>MIU_33 // AEC ENTERPRISE SOVEREIGN CORE</h1>
          <div style={{ display: "flex", gap: "15px", alignItems: "center", marginTop: "5px" }}>
            <span style={{ fontSize: "0.8rem", color: "#00ff66" }}>● MOMRAH / SASO PIPELINE ONLINE</span>
            {clientBalance && (
              <span style={{ fontSize: "0.75rem", color: "#888", borderLeft: "1px solid #333", paddingLeft: "15px" }}>
                CLIENT: <span style={{ color: "#00f3ff" }}>{clientBalance.clientName || "ENTERPRISE"}</span> | LICENSE:{" "}
                <span style={{ color: "#00ff66", fontWeight: "bold" }}>
                  {clientBalance.plan === "agency_unlimited" ? "ENTERPRISE SLA // UNLIMITED" : "SOVEREIGN TIER // ACTIVE"}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* 4-Tab Enterprise Workspace */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "spec", label: "📑 BOM & SASO LOCALIZER" },
            { id: "invoice", label: "💳 COMMERCIAL & ZATCA STUDIO" },
            { id: "site_hud", label: "📐 SITE & BIM HUD TELEMETRY" },
            { id: "pitch", label: "📊 EXECUTIVE PROPOSAL DECK" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: activeTab === tab.id ? "#00f3ff" : "transparent",
                color: activeTab === tab.id ? "#000" : "#00f3ff",
                border: "1px solid #00f3ff",
                padding: "8px 14px",
                fontFamily: "monospace",
                fontWeight: "bold",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Global Error Notification */}
      {error && (
        <div style={{ maxWidth: "1200px", margin: "0 auto 20px", color: "#ff3366", fontSize: "0.75rem", border: "1px solid #ff3366", padding: "10px", backgroundColor: "#150505" }}>
          ERROR: {error}
        </div>
      )}

      {/* TAB 1: BOM & SASO LOCALIZER */}
      {activeTab === "spec" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "25px", padding: "10px" }}>
          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "0.95rem", color: "#00f3ff", margin: 0, letterSpacing: "1px" }}>
                  GB/T ⇄ ASTM / SASO TECHNICAL SPECIFICATION &amp; BOM WORKSPACE
                </h2>
                <span style={{ fontSize: "0.72rem", color: "#888" }}>
                  DRAG &amp; DROP FACTORY BOM (.XLSX / .CSV) ➔ AUTO-CLASSIFY HS CODES ➔ 1-CLICK DUAL MUNICIPAL COMPILE
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => handleModeChange("ZH_TO_GCC")}
                  style={{
                    backgroundColor: translationMode === "ZH_TO_GCC" ? "#00f3ff" : "transparent",
                    color: translationMode === "ZH_TO_GCC" ? "#000" : "#888",
                    border: "1px solid #00f3ff",
                    padding: "6px 12px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "monospace"
                  }}
                >
                  🇨🇳 ZH ➔ EN + AR
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("EN_TO_ZH_AR")}
                  style={{
                    backgroundColor: translationMode === "EN_TO_ZH_AR" ? "#00ff66" : "transparent",
                    color: translationMode === "EN_TO_ZH_AR" ? "#000" : "#888",
                    border: "1px solid #00ff66",
                    padding: "6px 12px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "monospace"
                  }}
                >
                  🇬🇧 EN ➔ ZH + AR
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv,.json,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  parseAndStageFile(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  parseAndStageFile(e.dataTransfer.files[0]);
                }
              }}
              style={{
                border: isDragging ? "2px dashed #00f3ff" : "1px dashed #333",
                backgroundColor: isDragging ? "#0d1b2a" : "#050505",
                padding: "25px",
                textAlign: "center",
                transition: "all 0.15s ease",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              <div style={{ fontSize: "0.85rem", color: isDragging ? "#00f3ff" : "#00ff66", fontWeight: "bold" }}>
                {isDragging ? "DROP SPREADSHEET TO AUTO-INGEST..." : "📥 DRAG & DROP FACTORY BOM (.XLSX / .CSV / JSON / TXT) OR CLICK TO BROWSE"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "4px" }}>
                Auto-classifies Chinese alloy grades (6063-T6, Low-E, Q235B), HS Tariff Codes &amp; SASO parity standards
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ fontSize: "0.72rem", color: "#666", minWidth: "120px" }}>SUBMITTAL TITLE:</label>
              <input
                type="text"
                value={stagedDocTitle}
                onChange={(e) => setStagedDocTitle(e.target.value)}
                style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.85rem", outline: "none" }}
              />
            </div>
          </section>

          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#00ff66", fontWeight: "bold", letterSpacing: "1px" }}>
                STAGED LINE ITEMS ({stagedItems.length} NODES READY FOR COMPLIANCE REVIEW)
              </span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #00ff66",
                    color: "#00ff66",
                    padding: "4px 10px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "monospace"
                  }}
                >
                  📊 EXPORT CSV / EXCEL
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{ backgroundColor: "transparent", border: "1px solid #00f3ff", color: "#00f3ff", padding: "4px 10px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer", fontFamily: "monospace" }}
                >
                  + ADD LINE ITEM
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#080808", color: "#666", borderBottom: "1px solid #222" }}>
                    <th style={{ padding: "10px 8px", textAlign: "left", width: "12%" }}>CODE</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", width: "26%" }}>ITEM NAME</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", width: "32%" }}>TECHNICAL SPECIFICATION</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", width: "15%" }}>MATERIAL</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", width: "11%" }}>STANDARD</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", width: "4%" }}>ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {stagedItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #141414" }}>
                      <td style={{ padding: "6px" }}>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleUpdateItem(idx, "code", e.target.value)}
                          placeholder="CODE"
                          style={{ width: "100%", backgroundColor: "#000", border: "1px solid #333", color: "#00f3ff", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                          placeholder={translationMode === "ZH_TO_GCC" ? "输入品名..." : "Enter item name..."}
                          style={{ width: "100%", backgroundColor: "#000", border: "1px solid #333", color: "#fff", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) => handleUpdateItem(idx, "details", e.target.value)}
                          placeholder="Specs / tolerances..."
                          style={{ width: "100%", backgroundColor: "#000", border: "1px solid #333", color: "#aaa", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => handleUpdateItem(idx, "material", e.target.value)}
                          placeholder="Material alloy..."
                          style={{ width: "100%", backgroundColor: "#000", border: "1px solid #333", color: "#fff", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input
                          type="text"
                          value={item.standard}
                          onChange={(e) => handleUpdateItem(idx, "standard", e.target.value)}
                          placeholder="Standard..."
                          style={{ width: "100%", backgroundColor: "#000", border: "1px solid #333", color: "#00ff66", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "6px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          style={{ backgroundColor: "transparent", border: "none", color: "#ff3366", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={specLoading || stagedItems.length === 0}
              onClick={async () => {
                setSpecLoading(true);
                setError(null);
                setOutput(null);

                try {
                  const sourceLang = translationMode === "ZH_TO_GCC" ? "zh" : "en";
                  const targetLangs = translationMode === "ZH_TO_GCC" ? ["en", "ar"] : ["zh", "ar"];

                  const res = await fetch(`${API_BASE}/api/services/spec-sheet`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
                    body: JSON.stringify({
                      rawData: { documentTitle: stagedDocTitle, items: stagedItems },
                      sourceLang,
                      targetLangs,
                      projectCode,
                      generateDual: true
                    }),
                  });

                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Spec translation failed");

                  setOutput(data);
                  fetchHistory();
                  fetchClientBalance();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setSpecLoading(false);
                }
              }}
              style={{
                backgroundColor: specLoading ? "#222" : translationMode === "ZH_TO_GCC" ? "#00f3ff" : "#00ff66",
                color: "#000",
                border: "none",
                padding: "14px",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: specLoading ? "not-allowed" : "pointer",
                letterSpacing: "1px",
                marginTop: "10px"
              }}
            >
              {specLoading
                ? "TRANSLATING & COMPILING STAGED SUBMITTALS..."
                : translationMode === "ZH_TO_GCC"
                  ? "⚡ COMPILE STAGED BOM ➔ DUAL EN & AR MUNICIPAL SUBMITTALS (PDF)"
                  : "⚡ COMPILE STAGED BOM ➔ DUAL ZH & AR MUNICIPAL SUBMITTALS (PDF)"}
            </button>
          </section>

          {output?.downloads && (
            <section style={{ border: "1px solid #00ff66", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ fontSize: "0.85rem", color: "#00ff66", fontWeight: "bold" }}>
                ✓ MOMRA / SASO COMPLIANT SUBMITTALS COMPILED [{output.projectCode || "SPEC-CORE"}]
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {Object.entries(output.downloads).map(([lang, url]: [string, any]) => (
                  <a
                    key={lang}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textAlign: "center",
                      backgroundColor: "#050505",
                      border: lang === "ar" ? "1px solid #00ff66" : lang === "zh" ? "1px solid #ffcc00" : "1px solid #00f3ff",
                      color: lang === "ar" ? "#00ff66" : lang === "zh" ? "#ffcc00" : "#00f3ff",
                      padding: "14px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      fontFamily: "monospace"
                    }}
                  >
                    📄 OPEN {lang.toUpperCase()} SUBMITTAL ({lang === "zh" ? "中文 FACTORY BOM" : lang === "ar" ? "عربي MOMRA MUNICIPAL" : "ENGLISH SPEC"} PDF)
                  </a>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {/* TAB 2: COMMERCIAL & ZATCA TAX STUDIO */}
      {activeTab === "invoice" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", padding: "10px" }}>
          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9rem", color: "#00f3ff", margin: 0 }}>
                ZATCA TRILINGUAL TAX INVOICE ENGINE
              </h2>
              <span style={{ fontSize: "0.7rem", color: "#00ff66", border: "1px solid #00ff66", padding: "2px 6px" }}>
                15% VAT AUTO-CALC
              </span>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setInvoiceLoading(true);
                setError(null);
                try {
                  const res = await fetch(`${API_BASE}/api/services/invoice`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
                    body: JSON.stringify({
                      clientName: invoiceClient.trim() || "AL-RAJHI COMMERCIAL CONTRACTING",
                      currency: invoiceCurrency,
                      targetLang: "dual"
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Invoice generation failed");
                  setOutput(data);
                  fetchHistory();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setInvoiceLoading(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", color: "#666" }}>BILLED ENTITY / CLIENT NAME:</label>
                <input
                  type="text"
                  value={invoiceClient}
                  onChange={(e) => setInvoiceClient(e.target.value)}
                  style={{ backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "10px", fontFamily: "monospace", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.75rem", color: "#666" }}>CURRENCY:</label>
                  <select
                    value={invoiceCurrency}
                    onChange={(e) => setInvoiceCurrency(e.target.value)}
                    style={{ backgroundColor: "#050505", border: "1px solid #222", color: "#00f3ff", padding: "10px", fontFamily: "monospace", fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="SAR">SAR (Saudi Riyal - 15% VAT)</option>
                    <option value="CNY">CNY (Chinese Yuan)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={invoiceLoading}
                style={{ backgroundColor: invoiceLoading ? "#222" : "#00f3ff", color: "#000", border: "none", padding: "12px", fontWeight: "bold", cursor: "pointer", letterSpacing: "1px" }}
              >
                {invoiceLoading ? "GENERATING..." : "⚡ GENERATE TRILINGUAL TAX INVOICE (PDF)"}
              </button>
            </form>

            <hr style={{ borderColor: "#1a1a1a", margin: "10px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9rem", color: "#00ff66", margin: 0 }}>
                CHINA ➔ GCC LANDED COST ESTIMATOR
              </h2>
              <span style={{ fontSize: "0.7rem", color: "#00f3ff", border: "1px solid #00f3ff", padding: "2px 6px" }}>
                5% TARIFF + 15% VAT
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={freightUSD}
                  onChange={(e) => setFreightUSD(e.target.value)}
                  placeholder="Ocean Freight (USD)..."
                  style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "8px", fontFamily: "monospace", fontSize: "0.8rem" }}
                />
              </div>
              <button
                type="button"
                disabled={customsLoading}
                onClick={async () => {
                  setCustomsLoading(true);
                  setError(null);
                  try {
                    const res = await fetch(`${API_BASE}/api/services/landed-cost`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
                      body: JSON.stringify({
                        items: stagedItems.map((itm) => ({ code: itm.code, name: itm.name, unitPriceUSD: 48, qty: 250 })),
                        freightCostUSD: Number(freightUSD) || 2400
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Customs estimation failed");
                    setOutput(data);
                    fetchHistory();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setCustomsLoading(false);
                  }
                }}
                style={{ backgroundColor: customsLoading ? "#222" : "#00ff66", color: "#000", border: "none", padding: "12px", fontWeight: "bold", cursor: "pointer", letterSpacing: "1px" }}
              >
                {customsLoading ? "CALCULATING TARIFFS..." : "📦 ESTIMATE FOB ➔ CIF JEDDAH LANDED COST"}
              </button>
            </div>
          </section>

          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
            <h2 style={{ fontSize: "0.9rem", color: "#888", margin: 0 }}>COMMERCIAL ARTIFACT DECK</h2>
            {output?.downloadUrl ? (
              <div style={{ border: "1px solid #00ff66", padding: "15px", backgroundColor: "#050505" }}>
                <div style={{ fontSize: "0.8rem", color: "#00ff66", fontWeight: "bold", marginBottom: "6px" }}>
                  ✓ TAX INVOICE COMPILED [{output.invoiceNumber}]
                </div>
                <a
                  href={output.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", textAlign: "center", backgroundColor: "#111", border: "1px solid #00ff66", color: "#00ff66", padding: "12px", textDecoration: "none", fontWeight: "bold", fontSize: "0.8rem" }}
                >
                  📑 OPEN TRILINGUAL TAX INVOICE (A4 PDF)
                </a>
              </div>
            ) : null}

            {output?.grandTotalLandedSAR ? (
              <div style={{ border: "1px solid #00f3ff", padding: "15px", backgroundColor: "#050505", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem" }}>
                <div style={{ color: "#00f3ff", fontWeight: "bold" }}>✓ CIF JEDDAH LANDED COST ESTIMATE</div>
                <div>CIF TOTAL: <span style={{ color: "#fff" }}>${output.totalCifUSD?.toFixed(2)} USD</span> ({output.totalCifSAR?.toFixed(2)} SAR)</div>
                <div>5% CUSTOMS DUTY: <span style={{ color: "#ffcc00" }}>{output.customsDutySAR?.toFixed(2)} SAR</span></div>
                <div>15% ZATCA VAT: <span style={{ color: "#ffcc00" }}>{output.vatSAR?.toFixed(2)} SAR</span></div>
                <div style={{ color: "#00ff66", fontWeight: "bold", marginTop: "4px" }}>
                  TOTAL LANDED: {output.grandTotalLandedSAR?.toFixed(2)} SAR (~¥{output.grandTotalLandedCNY?.toFixed(2)} CNY)
                </div>
              </div>
            ) : null}

            <pre style={{ color: "#00ff66", margin: 0, whiteSpace: "pre-wrap", fontSize: "0.8rem", maxHeight: "350px", overflowY: "auto", border: "1px solid #222", padding: "10px", backgroundColor: "#050505" }}>
              {output ? JSON.stringify(output, null, 2) : "// Awaiting commercial calculation..."}
            </pre>
          </section>
        </main>
      )}

      {/* TAB 3: SITE & BIM HUD TELEMETRY */}
      {activeTab === "site_hud" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", padding: "10px" }}>
          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9rem", color: "#00f3ff", margin: 0 }}>DRONE INSPECTION &amp; SITE PROGRESS STAMPER</h2>
              <span style={{ fontSize: "0.7rem", color: "#00ff66", border: "1px solid #00ff66", padding: "2px 6px" }}>MUNICIPAL HUD</span>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!droneFile) {
                  setError("Please select a valid .mp4 video file first before stamping.");
                  return;
                }
                setSiteHudLoading(true);
                setError(null);
                setOutput(null);

                try {
                  const formData = new FormData();
                  formData.append("videoFile", droneFile);
                  formData.append("projectTitle", projectTitle);
                  formData.append("datumElevation", datumElevation);
                  formData.append("gpsCoordinates", gpsCoords);
                  formData.append("baladyLicenseNo", baladyLicense);
                  formData.append("aspectRatio", aspectRatio);
                  formData.append("is4K", String(is4K));

                  const res = await fetch(`${API_BASE}/api/services/site-hud`, {
                    method: "POST",
                    headers: { "x-api-key": activeApiKey },
                    body: formData,
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "HUD burn failed");
                  setOutput(data);
                  fetchHistory();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setSiteHudLoading(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <label style={{ fontSize: "0.75rem", color: "#00ff66", fontWeight: "bold" }}>
                1. SELECT RAW DRONE / SITE WALKTHROUGH FOOTAGE (.MP4)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setDroneFile(e.target.files[0]);
                    setError(null);
                  }
                }}
                style={{ backgroundColor: "#050505", border: "1px solid #333", color: "#00f3ff", padding: "8px", fontSize: "0.8rem", outline: "none" }}
              />

              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project Title..."
                style={{ backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "8px", fontSize: "0.8rem" }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={datumElevation}
                  onChange={(e) => setDatumElevation(e.target.value)}
                  placeholder="Datum Level (+12.50m)..."
                  style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "8px", fontSize: "0.8rem" }}
                />
                <input
                  type="text"
                  value={baladyLicense}
                  onChange={(e) => setBaladyLicense(e.target.value)}
                  placeholder="Balady License..."
                  style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "8px", fontSize: "0.8rem" }}
                />
              </div>

              <input
                type="text"
                value={gpsCoords}
                onChange={(e) => setGpsCoords(e.target.value)}
                placeholder="GPS Coordinates (24.7136° N, 46.6753° E)..."
                style={{ backgroundColor: "#050505", border: "1px solid #222", color: "#fff", padding: "8px", fontSize: "0.8rem" }}
              />

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #222", color: "#00f3ff", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem" }}
                >
                  <option value="16:9">16:9 Landscape (Standard / 4K Monitor)</option>
                  <option value="9:16">9:16 Portrait (Mobile / Site Field Feed)</option>
                </select>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: is4K ? "#00ff66" : "#888", cursor: "pointer", border: "1px solid #222", padding: "6px 10px", backgroundColor: "#050505" }}>
                  <input
                    type="checkbox"
                    checked={is4K}
                    onChange={(e) => setIs4K(e.target.checked)}
                    style={{ accentColor: "#00ff66" }}
                  />
                  4K UHD PASS
                </label>
              </div>

              <button
                type="submit"
                disabled={siteHudLoading}
                style={{
                  backgroundColor: siteHudLoading ? "#222" : "#00f3ff",
                  color: "#000",
                  border: "none",
                  padding: "12px",
                  fontWeight: "bold",
                  cursor: siteHudLoading ? "not-allowed" : "pointer",
                  letterSpacing: "1px"
                }}
              >
                {siteHudLoading ? "BURNING TELEMETRY HUD..." : "⚡ STAMP MUNICIPAL TELEMETRY HUD (.MP4)"}
              </button>
            </form>

            <hr style={{ borderColor: "#1a1a1a", margin: "5px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9rem", color: "#00f3ff", margin: 0 }}>
                4D BIM PHASE SEQUENCER (MULTI-CLIP STITCH)
              </h2>
              <span style={{ fontSize: "0.7rem", color: "#00f3ff", border: "1px solid #00f3ff", padding: "2px 6px" }}>
                {phaseClips.length} CLIPS QUEUED
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "0.72rem", color: "#888" }}>
                SELECT OR DROP DRONE / PROGRESS CLIPS (.MP4):
              </label>
              
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const incoming = Array.from(e.target.files);
                    setPhaseClips((prev) => [...prev, ...incoming]);
                    e.target.value = "";
                  }
                }}
                style={{ backgroundColor: "#050505", border: "1px solid #333", color: "#00f3ff", padding: "8px", fontSize: "0.8rem", outline: "none" }}
              />

              {phaseClips.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "#050505", border: "1px solid #222", padding: "10px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "2px" }}>SEQUENCE ORDER:</div>
                  {phaseClips.map((clip, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", backgroundColor: "#0c0c0c", padding: "6px 8px", border: "1px solid #1a1a1a" }}>
                      <span style={{ color: "#fff" }}>
                        <strong style={{ color: "#00f3ff", marginRight: "6px" }}>#{idx + 1}</strong>
                        {clip.name} <span style={{ color: "#666" }}>({(clip.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhaseClips(phaseClips.filter((_, i) => i !== idx))}
                        style={{ backgroundColor: "transparent", border: "none", color: "#ff3366", cursor: "pointer", fontWeight: "bold", padding: "0 4px" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={bimLoading || phaseClips.length < 2}
                onClick={async () => {
                  if (phaseClips.length === 0) return;
                  setBimLoading(true);
                  setError(null);
                  try {
                    const formData = new FormData();
                    phaseClips.forEach((file) => formData.append("phaseClips", file));
                    formData.append("projectCode", projectCode);

                    const res = await fetch(`${API_BASE}/api/services/4d-milestones`, {
                      method: "POST",
                      headers: { "x-api-key": activeApiKey },
                      body: formData,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "4D BIM compilation failed");
                    setBimOutput(data);
                    fetchHistory();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setBimLoading(false);
                  }
                }}
                style={{
                  backgroundColor: bimLoading || phaseClips.length < 2 ? "#222" : "#00f3ff",
                  color: "#000",
                  border: "none",
                  padding: "12px",
                  fontWeight: "bold",
                  cursor: bimLoading || phaseClips.length < 2 ? "not-allowed" : "pointer",
                  letterSpacing: "1px"
                }}
              >
                {bimLoading
                  ? "STITCHING MASTER WALKTHROUGH..."
                  : phaseClips.length < 2
                    ? "QUEUE AT LEAST 2 CLIPS TO STITCH"
                    : `⚡ STITCH ${phaseClips.length} CLIPS INTO MASTER SEQUENCE (.MP4)`}
              </button>
            </div>

            {bimOutput?.downloadUrl && (
              <div style={{ border: "1px solid #00f3ff", padding: "10px", backgroundColor: "#050505", marginTop: "5px" }}>
                <div style={{ fontSize: "0.75rem", color: "#00f3ff", fontWeight: "bold" }}>✓ MASTER SEQUENCE COMPILED</div>
                <a
                  href={bimOutput.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#00ff66", fontSize: "0.75rem", textDecoration: "underline" }}
                >
                  📥 Download Stitched Walkthrough Video
                </a>
              </div>
            )}

            <hr style={{ borderColor: "#1a1a1a", margin: "5px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9rem", color: "#00ff66", margin: 0 }}>SABER / SASO CERTIFICATION MATRIX</h2>
            </div>

            <button
              type="button"
              disabled={saberLoading}
              onClick={async () => {
                setSaberLoading(true);
                setError(null);
                try {
                  const res = await fetch(`${API_BASE}/api/services/saber-saso`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
                    body: JSON.stringify({ items: stagedItems, projectCode: `${projectCode}-MTC` }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "SASO verification failed");
                  setOutput(data);
                  fetchHistory();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setSaberLoading(false);
                }
              }}
              style={{
                backgroundColor: saberLoading ? "#222" : "#00ff66",
                color: "#000",
                border: "none",
                padding: "12px",
                fontWeight: "bold",
                cursor: saberLoading ? "not-allowed" : "pointer",
                letterSpacing: "1px"
              }}
            >
              {saberLoading ? "GENERATING SASO PARITY DOSSIER..." : "🔍 VERIFY SASO / SABER MTC STANDARDS (PDF)"}
            </button>
          </section>

          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
            <h2 style={{ fontSize: "0.9rem", color: "#888", margin: 0 }}>SITE TELEMETRY &amp; COMPLIANCE OUTPUT</h2>

            {output?.downloadUrl && output.downloadUrl.endsWith(".mp4") && (
              <div style={{ border: "1px solid #00f3ff", padding: "15px", backgroundColor: "#050505" }}>
                <div style={{ fontSize: "0.8rem", color: "#00f3ff", fontWeight: "bold", marginBottom: "8px" }}>
                  ✓ TELEMETRY VIDEO EXPORTED
                </div>
                <video src={output.downloadUrl} controls style={{ width: "100%", maxHeight: "240px", backgroundColor: "#000" }} />
                <a
                  href={output.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", textAlign: "center", backgroundColor: "#111", border: "1px solid #00f3ff", color: "#00f3ff", padding: "10px", marginTop: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "0.75rem" }}
                >
                  📥 DOWNLOAD STAMPED PROGRESS VIDEO (.MP4)
                </a>
              </div>
            )}

            {output?.validatedItems && (
              <div style={{ border: "1px solid #00ff66", padding: "15px", backgroundColor: "#050505", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#00ff66", fontWeight: "bold" }}>
                    ✓ SASO 2831 / ASTM CONFORMITY MATRIX [{output.projectCode}]
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#0d1b12", color: "#888", borderBottom: "1px solid #1a3a24" }}>
                        <th style={{ padding: "6px", textAlign: "left" }}>CODE</th>
                        <th style={{ padding: "6px", textAlign: "left" }}>MATERIAL</th>
                        <th style={{ padding: "6px", textAlign: "left" }}>SASO PARITY</th>
                        <th style={{ padding: "6px", textAlign: "center" }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {output.validatedItems.map((row: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #141414" }}>
                          <td style={{ padding: "6px", color: "#00f3ff", fontWeight: "bold" }}>{row.itemNo}</td>
                          <td style={{ padding: "6px", color: "#fff" }}>{row.materialGrade}</td>
                          <td style={{ padding: "6px", color: "#00ff66" }}>{row.sasoStandard}</td>
                          <td style={{ padding: "6px", textAlign: "center", color: "#00ff66", fontWeight: "bold" }}>✓ APPROVED</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {output.downloadUrl && (
                  <a
                    href={output.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "block", textAlign: "center", backgroundColor: "#071c0f", border: "1px solid #00ff66", color: "#00ff66", padding: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "0.75rem", marginTop: "6px" }}
                  >
                    📄 OPEN OFFICIAL SASO / SABER DOSSIER (A4 PDF)
                  </a>
                )}
              </div>
            )}

            {!output && (
              <div style={{ padding: "40px 20px", border: "1px dashed #333", textAlign: "center", color: "#666", fontSize: "0.8rem" }}>
                Select a video above to stamp municipal telemetry, or click verify to compile the SASO compliance matrix.
              </div>
            )}
          </section>
        </main>
      )}

      {/* TAB 4: EXECUTIVE PROPOSAL DECK */}
      {activeTab === "pitch" && <PitchDeck />}

      {/* UNIVERSAL DOSSIER VAULT & 1-CLICK ZIP EXPORTER */}
      <section style={{ maxWidth: "1200px", margin: "30px auto 0", border: "1px solid #00f3ff", backgroundColor: "#060f14", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#00f3ff", fontWeight: "bold", letterSpacing: "1px" }}>
              📦 UNIVERSAL PROJECT DOSSIER VAULT // [{projectCode}]
            </div>
            <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
              Bundles all compiled submittal PDFs, SASO matrices, ZATCA tax invoices, and stamped MP4 passes into a single archive.
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              disabled={dossierLoading}
              onClick={handleZipDossier}
              style={{
                backgroundColor: dossierLoading ? "#222" : "#00ff66",
                color: "#000",
                border: "none",
                padding: "12px 20px",
                fontWeight: "bold",
                fontSize: "0.75rem",
                cursor: dossierLoading ? "not-allowed" : "pointer",
                fontFamily: "monospace",
                letterSpacing: "1px"
              }}
            >
              {dossierLoading ? "PACKAGING ARTIFACTS..." : "📦 1-CLICK BUNDLE COMPLETE DOSSIER (.ZIP)"}
            </button>
          </div>
        </div>

        {dossierError && (
          <div style={{ color: "#ff3366", fontSize: "0.75rem", border: "1px solid #ff3366", padding: "8px", backgroundColor: "#1a0505" }}>
            ERROR: {dossierError}
          </div>
        )}

        {dossierZipUrl && (
          <div style={{ fontSize: "0.72rem", color: "#00ff66" }}>
            ✓ ARCHIVE READY: <a href={dossierZipUrl} target="_blank" rel="noreferrer" style={{ color: "#00f3ff", textDecoration: "underline" }}>Click here if download did not start automatically</a>
          </div>
        )}
      </section>

      {/* Sovereign Enterprise Compliance Footer */}
      <footer style={{ marginTop: "40px", borderTop: "1px solid #1a1a1a", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "#555" }}>
        <div style={{ maxWidth: "800px", lineHeight: "1.4" }}>
          <span style={{ color: "#888", fontWeight: "bold" }}>LEGAL &amp; REGULATORY NOTICE:</span>{" "}
          MIU Sovereign AEC Core is a technical staging and document compilation engine. Outputs are prepared for engineering coordination. Final submittals to MOMRAH, Balady, SABER, or ZATCA require review and endorsement by the licensed Engineer of Record.
        </div>
        <div style={{ textAlign: "right", fontFamily: "monospace", color: "#444" }}>
          <div>SOVEREIGN AIR-GAPPED CORE // 2026</div>
          <div style={{ color: "#00ff66" }}>● LOCAL EXECUTION ACTIVE</div>
        </div>
      </footer>
    </div>
  );
}