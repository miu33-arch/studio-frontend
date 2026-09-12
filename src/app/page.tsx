"use client";

import React, { useState, useEffect, useRef } from "react";
import PitchDeck from "@/components/PitchDeck";
import { TerminalIngestModal } from "@/components/TerminalIngestModal";
import { getClientGeoContext, GeoAuditData } from "@/lib/geo";

const API_BASE =
  typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "3000" || window.location.port === "3001" ? "http://127.0.0.1:5000" : "")
    : (process.env.NEXT_PUBLIC_API_BASE || "https://api.miu33archstudio.xyz");
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
 const [activeTab, setActiveTab] = useState<
    "pipeline" | "multi_vertical" | "spec" | "invoice" | "site_hud" | "pitch" | "auditor"
  >("pipeline");
  const [projectCode, setProjectCode] = useState("MOMRAH-RYD-2026-04");
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  // Edge GEO / AEO Auditor State
  const [auditUrl, setAuditUrl] = useState("https://miu33archstudio.xyz");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Edge Telemetry State
  const [geo, setGeo] = useState<GeoAuditData | null>(null);

  useEffect(() => {
    getClientGeoContext().then((data) => {
      setGeo(data);
      if (data.currency) setInvoiceCurrency(data.currency);
    });
  }, []);

  // Multi-Vertical Ingest State (AEC + FMCG)
  const [mvTrack, setMvTrack] = useState<"fmcg" | "aec">("fmcg");
  const [mvCifValueSAR, setMvCifValueSAR] = useState("45000");
  const [mvSfdaRegId, setMvSfdaRegId] = useState("SFDA-FOOD-2026-991");
  const [mvHalalCert, setMvHalalCert] = useState(true);
  const [mvTempC, setMvTempC] = useState("3.1");
  const [mvShelfLifePct, setMvShelfLifePct] = useState("88");
  const [mvIotStream, setMvIotStream] = useState(true);

  // AEC Track States
  const [mvSaberCertId, setMvSaberCertId] = useState("SABER-KSA-AEC-2026-004");
  const [mvSasoCompliant, setMvSasoCompliant] = useState(true);
  const [mvMaterialGrade, setMvMaterialGrade] = useState("Structural Steel ASTM A36");
  const [mvWeightTons, setMvWeightTons] = useState("42");

  const [mvLoading, setMvLoading] = useState(false);
  const [mvResult, setMvResult] = useState<any>(null);

  // Cross-Border Pipeline State
  const [pipeline, setPipeline] = useState<any>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const manifestFileRef = useRef<HTMLInputElement | null>(null);

  // Multi-Vertical Execution Handler
  const handleRunMultiVerticalIngest = async () => {
    setMvLoading(true);
    setError(null);
    try {
      const payload: any = {
        track: mvTrack,
        metadata: mvTrack === "fmcg"
          ? { sfdaRegistrationId: mvSfdaRegId, halalCertified: mvHalalCert }
          : { saberCertificateId: mvSaberCertId, sasoCompliant: mvSasoCompliant },
        shipment: mvTrack === "fmcg"
          ? {
            cifValueSAR: Number(mvCifValueSAR) || 0,
            shelfLifeRemainingPct: Number(mvShelfLifePct) || 0,
            iotTelemetryStream: mvIotStream,
            currentTempC: Number(mvTempC) || 0
          }
          : {
            cifValueSAR: Number(mvCifValueSAR) || 0,
            materialGrade: mvMaterialGrade,
            weightTons: Number(mvWeightTons) || 0
          }
      };

      const res = await fetch(`${API_BASE}/api/transport/multi-vertical-ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Multi-vertical evaluation failed.");
      setMvResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMvLoading(false);
    }
  };

  // Fetch Pipeline Status
  const loadPipeline = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transport/pipeline-status?projectCode=${projectCode}`);
      const data = await res.json();
      if (data.success) {
        setPipeline(data.pipeline);
      } else {
        handleIngestManifest();
      }
    } catch (err) {
      console.error("Pipeline offline:", err);
    }
  };

  // Stage 1 Ingestion Handler
  const handleIngestManifest = async (file?: File) => {
    setPipelineLoading(true);
    try {
      const formData = new FormData();
      formData.append("projectCode", projectCode);
      if (file) formData.append("manifestFile", file);

      const res = await fetch(`${API_BASE}/api/transport/ingest`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setPipeline(data.pipeline);
      }
    } catch (err) {
      console.error("Ingest failed:", err);
    } finally {
      setPipelineLoading(false);
    }
  };

  // Telemetry Advance Trigger
  const handleAdvancePipeline = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transport/telemetry-advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectCode })
      });
      const data = await res.json();
      if (data.success) {
        setPipeline(data.pipeline);
      }
    } catch (err) {
      console.error("Advance failed:", err);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, [projectCode]);

  // Tab 1: BOM & SASO State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [translationMode, setTranslationMode] = useState<"ZH_TO_GCC" | "EN_TO_ZH_AR">("ZH_TO_GCC");
  const [stagedDocTitle, setStagedDocTitle] = useState("幕墙与铝合金型材技术规范 (Curtain Wall Spec)");
  const [stagedItems, setStagedItems] = useState<StagedBomItem[]>(SAMPLE_ZH);
  const [specLoading, setSpecLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Tab 2: Commercial & ZATCA Tax State
  const [selectedPlan, setSelectedPlan] = useState<"retainer" | "single" | "enterprise">("retainer");
  const [invoiceClient, setInvoiceClient] = useState("AL-RAJHI COMMERCIAL CONTRACTING");
  const [invoiceCurrency, setInvoiceCurrency] = useState("SAR");
  const [freightUSD, setFreightUSD] = useState("2400");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [customsLoading, setCustomsLoading] = useState(false);
  const [ledgerInvoices, setLedgerInvoices] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      const apiUrl = API_BASE;
      const res = await fetch(`${apiUrl}/api/services/invoices?limit=10`, {
        headers: {
          "x-api-key": "miu_master_agency_key",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.invoices) {
        setLedgerInvoices(data.invoices);
      }
    } catch (err) {
      console.warn("Failed to sync ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

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

  // Output & History State
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Tenancy Authentication & Session State
  const [activeApiKey] = useState("miu_master_agency_key");
  const [clientBalance, setClientBalance] = useState<any>(null);

  // Settlement & Paywall Gate State
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementRef, setSettlementRef] = useState("");
  const [isSettled, setIsSettled] = useState(false);
  const [clearanceStatus, setClearanceStatus] = useState<"IDLE" | "VERIFIED" | "FAILED">("IDLE");
  const [pendingAction, setPendingAction] = useState<"spec" | "dossier" | null>(null);

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
        if (data.logs) setHistory(data.logs);
      }
    } catch (err) {
      console.error("Backend history offline:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchClientBalance();
  }, [activeApiKey]);

  // Automated Webhook Listener Polling
  useEffect(() => {
    if (!showSettlementModal || isSettled) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/services/verify-settlement`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
          body: JSON.stringify({ settlementRef: projectCode })
        });
        const data = await res.json();
        if (data.verified) {
          setIsSettled(true);
          setClearanceStatus("VERIFIED");
          setTimeout(() => {
            setShowSettlementModal(false);
            if (pendingAction === "spec") handleCompileSubmittal(projectCode);
            else if (pendingAction === "dossier") handleZipDossier(projectCode);
            setPendingAction(null);
            setClearanceStatus("IDLE");
          }, 1000);
          clearInterval(interval);
        }
      } catch (err) {
        // Silent poll
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [showSettlementModal, isSettled, pendingAction, projectCode, activeApiKey]);

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

  const handleCompileSubmittal = async (overrideRef?: string) => {
    setSpecLoading(true);
    setError(null);
    setOutput(null);

    const refToUse = (overrideRef !== undefined ? overrideRef : settlementRef).trim();

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
          generateDual: true,
          settlementRef: refToUse || (isSettled ? "SETTLED-AUTH" : undefined)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Spec compilation failed");

      setOutput(data);
      if (data.isPaid) setIsSettled(true);
      fetchHistory();
      fetchClientBalance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSpecLoading(false);
    }
  };

  const handleZipDossier = async (overrideRef?: string) => {
    const refToUse = (overrideRef !== undefined ? overrideRef : settlementRef).trim();

    if (!isSettled && !refToUse) {
      setPendingAction("dossier");
      setShowSettlementModal(true);
      return;
    }

    setDossierLoading(true);
    setDossierError(null);

    try {
      const res = await fetch(`${API_BASE}/api/services/export-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
        body: JSON.stringify({
          projectCode,
          settlementRef: refToUse || (isSettled ? "SETTLED-AUTH" : undefined)
        }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setPendingAction("dossier");
        setShowSettlementModal(true);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Dossier packaging failed");

      setIsSettled(true);
      setShowSettlementModal(false);
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

  const handleGenerateInvoice = async (planOrItems?: "retainer" | "single" | "enterprise" | any[]) => {
    setInvoiceLoading(true);
    setError(null);

    let itemsPayload: any[] = [];

    if (Array.isArray(planOrItems)) {
      itemsPayload = planOrItems;
    } else {
      const plan = (planOrItems as "retainer" | "single" | "enterprise") || selectedPlan;
      const planPrices = {
        retainer: { code: "SVC-RET-01", name: "Monthly Municipal Compliance Retainer", priceUSD: 3500 },
        single: { code: "SVC-SUB-01", name: "Single Project Municipal Compliance Filing", priceUSD: 1850 },
        enterprise: { code: "SVC-ENT-01", name: "Enterprise Bare-Metal Compliance Core", priceUSD: 8500 },
      };

      const target = planPrices[plan];
      itemsPayload = [
        {
          code: target.code,
          name: target.name,
          qty: 1,
          unitPrice: Number((target.priceUSD * (invoiceCurrency === "SAR" ? 3.75 : 1)).toFixed(2))
        }
      ];
    }

    try {
      const res = await fetch(`${API_BASE}/api/services/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": activeApiKey },
        body: JSON.stringify({
          clientName: invoiceClient.trim() || "AL-RAJHI COMMERCIAL CONTRACTING",
          clientTaxId: "300000000000003",
          currency: invoiceCurrency,
          targetLang: "dual",
          items: itemsPayload
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details?.join(" | ") || data.error || "Invoice generation failed");
      setOutput(data);
      fetchLedger();
      setShowSettlementModal(true);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInvoiceLoading(false);
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

// --- Edge Auditor Actions ---
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setError(null);
    try {
      const res = await fetch("https://geo.miu33archstudio.xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditUrl.trim() }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setAuditResult(data.audit);
      } else {
        throw new Error(data.error || "Edge audit inspection failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reach edge auditor");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExportAuditDossier = () => {
    alert(`Audit dossier compilation queued for: ${auditUrl}`);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#04070a", color: "#00f3ff", fontFamily: "monospace", padding: "30px 40px" }}>

     {/* Header Bar */}
      <header style={{ borderBottom: "1px solid #142838", paddingBottom: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", letterSpacing: "2px", margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#00f3ff" }}>MIU_33</span> // SOVEREIGN TRADE &amp; COMPLIANCE CORE
          </h1>
          <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px", letterSpacing: "1px" }}>
            CROSS-BORDER CHINA-SAUDI CLEARANCE // SFDA COLD-CHAIN &bull; SASO AEC &bull; {projectCode}
          </div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center", marginTop: "5px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", color: "#00ff66" }}>● MOMRAH / SASO PIPELINE ONLINE</span>

            {/* Edge Geo Telemetry Status Pill */}
            <span style={{
              fontSize: "0.72rem",
              padding: "2px 8px",
              borderRadius: "2px",
              border: "1px solid #00f3ff",
              color: "#00f3ff",
              backgroundColor: "#04141d",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#00f3ff"
              }} />
              <span>
                EDGE: {geo ? `${geo.city.toUpperCase()}, ${geo.country} [${geo.currency}]` : "AUDITING EDGE..."}
              </span>
              <span style={{ color: "#335566" }}>|</span>
              <span style={{ color: geo?.isKsa ? "#00ff66" : "#ffaa00" }}>
                {geo?.isKsa ? "ZATCA 15% ACTIVE" : "0% STANDARD"}
              </span>
            </span>

            <span style={{
              fontSize: "0.72rem",
              padding: "2px 8px",
              borderRadius: "2px",
              border: isSettled ? "1px solid #00ff66" : "1px solid #ffaa00",
              color: isSettled ? "#00ff66" : "#ffaa00",
              backgroundColor: isSettled ? "#041a0d" : "#201400"
            }}>
              {isSettled ? "✓ OFFICIAL REGULATORY SEAL LICENSED" : "● TRIAL MODE // WATERMARKED DRAFT"}
            </span>

            {clientBalance && (
              <span style={{ fontSize: "0.75rem", color: "#888", borderLeft: "1px solid #333", paddingLeft: "15px" }}>
                CLIENT: <span style={{ color: "#00f3ff" }}>{clientBalance.clientName || "ENTERPRISE"}</span>
              </span>
            )}
          </div>
        </div>

       {/* 7-Tab Enterprise Navigation */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "pipeline", label: "🚢 LOGISTICS & TARIFF" },
            { id: "multi_vertical", label: "❄️ DUAL-TRACK INGEST" },
            { id: "spec", label: "📑 BOM & SASO LOCALIZER" },
            { id: "invoice", label: "💳 COMMERCIAL & ZATCA" },
            { id: "site_hud", label: "📐 SITE & BIM HUD" },
            { id: "pitch", label: "📊 PROPOSAL DECK" },
            { id: "auditor", label: "⚡ GEO & AEO AUDITOR" },
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

      {/* ========================================================================= */}
      {/* TAB 0: UNIFIED CROSS-BORDER TRANSPORT & CUSTOMS CLEARANCE PIPELINE        */}
      {/* ========================================================================= */}
      {activeTab === "pipeline" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "25px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#061017", border: "1px solid #142838", padding: "15px 20px" }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#fff" }}>MANIFEST &amp; SHIPPING INGESTION</span>
              <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "2px" }}>
                Ingest eBOL, packing lists, or container manifests to map HS Codes and calculate regional tariffs.
              </div>
            </div>
            <div>
              <button
                onClick={() => manifestFileRef.current?.click()}
                disabled={pipelineLoading}
                style={{ backgroundColor: "#00f3ff", color: "#000", border: "none", padding: "10px 18px", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace" }}
              >
                {pipelineLoading ? "PARSING MANIFEST..." : "📥 INGEST eBOL / PACKING LIST"}
              </button>
              <input
                type="file"
                ref={manifestFileRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleIngestManifest(e.target.files[0]);
                }}
              />
            </div>
          </div>

          <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold" }}>
                1. HARMONIZED TARIFF &amp; HS CODE CONFORMITY MAPPING
              </div>
              <div style={{ fontSize: "0.7rem", color: "#aaa" }}>
                MANIFEST HASH: <span style={{ color: "#00ff66" }}>{pipeline?.manifestHash?.slice(0, 16) || "AUTHENTICATING..."}...</span>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#02070a", color: "#666", textAlign: "left", borderBottom: "1px solid #142838" }}>
                    <th style={{ padding: "10px 8px" }}>ITEM NO</th>
                    <th style={{ padding: "10px 8px" }}>DESCRIPTION</th>
                    <th style={{ padding: "10px 8px" }}>MATERIAL SPEC</th>
                    <th style={{ padding: "10px 8px" }}>HS TARIFF CODE</th>
                    <th style={{ padding: "10px 8px" }}>SASO CONFORMITY</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>FOB TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(pipeline?.items || []).map((itm: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #0d1b26" }}>
                      <td style={{ padding: "10px 8px", color: "#00f3ff", fontWeight: "bold" }}>{itm.itemNo}</td>
                      <td style={{ padding: "10px 8px", color: "#fff" }}>{itm.description}</td>
                      <td style={{ padding: "10px 8px", color: "#aaa" }}>{itm.materialGrade}</td>
                      <td style={{ padding: "10px 8px", color: "#00ff66" }}>{itm.hsCode}</td>
                      <td style={{ padding: "10px 8px", color: "#ffaa00" }}>{itm.sasoStandard}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: "#fff" }}>${itm.totalFobUSD?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", marginBottom: "14px" }}>
                2. REGIONAL COMPLIANCE &amp; FISCAL COMPUTATION (ZATCA)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>SUBTOTAL FOB (PORT OF ORIGIN):</span>
                  <span style={{ color: "#fff" }}>${pipeline?.fiscal?.subtotalFobUSD?.toFixed(2) || "0.00"} USD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>OCEAN FREIGHT &amp; MARINE INSURANCE:</span>
                  <span style={{ color: "#fff" }}>${((pipeline?.fiscal?.freightUSD || 0) + (pipeline?.fiscal?.insuranceUSD || 0)).toFixed(2)} USD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #142838", paddingTop: "8px" }}>
                  <span style={{ color: "#00f3ff" }}>TOTAL CIF JEDDAH:</span>
                  <span style={{ color: "#00f3ff", fontWeight: "bold" }}>{pipeline?.fiscal?.totalCifSAR?.toFixed(2) || "0.00"} SAR</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#ffaa00" }}>5% GCC UNIFIED CUSTOMS DUTY:</span>
                  <span style={{ color: "#ffaa00" }}>{pipeline?.fiscal?.customsDutySAR?.toFixed(2) || "0.00"} SAR</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#00ff66" }}>15% ZATCA STANDARD VAT:</span>
                  <span style={{ color: "#00ff66" }}>{pipeline?.fiscal?.zatcaVatSAR?.toFixed(2) || "0.00"} SAR</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #00f3ff", paddingTop: "10px", marginTop: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#fff" }}>ESTIMATED TOTAL LANDED (SAR):</span>
                  <span style={{ fontWeight: "bold", color: "#00ff66", fontSize: "1rem" }}>
                    {pipeline?.fiscal?.grandTotalLandedSAR?.toFixed(2) || "0.00"} SAR
                  </span>
                </div>
              </div>
            </div>

            <div style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", marginBottom: "14px" }}>
                  PORT OF ARRIVAL CONFORMITY AUDIT
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.72rem" }}>
                  <div style={{ padding: "10px 14px", border: "1px solid #00ff66", backgroundColor: "#04150b", display: "flex", justifyContent: "space-between" }}>
                    <span>SABER MTC CONFORMITY</span>
                    <strong style={{ color: "#00ff66" }}>APPROVED // SASO 2831 PARITY</strong>
                  </div>
                  <div style={{ padding: "10px 14px", border: "1px solid #00f3ff", backgroundColor: "#04141d", display: "flex", justifyContent: "space-between" }}>
                    <span>FASAH CUSTOMS PRE-DECLARATION</span>
                    <strong style={{ color: "#00f3ff" }}>SUBMITTED // NO DEMURRAGE HOLD</strong>
                  </div>
                  <div style={{ padding: "10px 14px", border: "1px solid #142838", backgroundColor: "#05090e", display: "flex", justifyContent: "space-between" }}>
                    <span>DUTY DEBIT STATUS</span>
                    <strong style={{ color: pipeline?.compliance?.dutyDebited ? "#00ff66" : "#aaa" }}>
                      {pipeline?.compliance?.dutyDebited ? "AUTO-DEBITED AT JEDDAH" : "PENDING VESSEL ARRIVAL"}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.68rem", color: "#666", marginTop: "10px" }}>
                CONSIGNMENT: {pipeline?.logistics?.containerNumber || "CSNU-789421-0"} // {pipeline?.logistics?.billOfLading || "BOL-CN-KSA"}
              </div>
            </div>
          </section>

          <section style={{ border: "1px solid #00f3ff", backgroundColor: "#061219", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "#00f3ff", fontWeight: "bold" }}>
                  3. STAGED TRANSPORT HUD &amp; TELEMETRY TRACKER
                </div>
                <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "3px" }}>
                  VESSEL: {pipeline?.logistics?.vesselName || "COSCO SHIPPING"} // ROUTE: MARITIME RED SEA
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleAdvancePipeline}
                  style={{ backgroundColor: "#00ff66", border: "none", color: "#000", padding: "8px 16px", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace" }}
                >
                  ⚡ ADVANCE TELEMETRY STAGE ➔
                </button>
                <button
                  type="button"
                  onClick={loadPipeline}
                  style={{ backgroundColor: "transparent", border: "1px solid #00f3ff", color: "#00f3ff", padding: "8px 12px", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace" }}
                >
                  ↻ SYNC
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginTop: "16px" }}>
              {(pipeline?.milestones || []).map((m: any, idx: number) => {
                const isDone = m.status === "COMPLETED" || m.status === "DELIVERED";
                const isActive = m.status === "ACTIVE" || m.status === "IN_TRANSIT";
                const color = isDone ? "#00ff66" : isActive ? "#00f3ff" : "#444";

                return (
                  <div key={idx} style={{ border: `1px solid ${color}`, backgroundColor: "#02070c", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color, fontWeight: "bold" }}>STAGE {m.stage}</div>
                    <div style={{ fontSize: "0.72rem", color: "#fff", margin: "6px 0", fontWeight: "bold" }}>{m.name}</div>
                    <div style={{ fontSize: "0.65rem", color: isDone ? "#00ff66" : isActive ? "#00f3ff" : "#666" }}>
                      ● {m.status}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#555", marginTop: "4px" }}>{m.node}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ border: isSettled ? "1px solid #00ff66" : "1px solid #00f3ff", backgroundColor: "#031208", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.95rem", color: isSettled ? "#00ff66" : "#00f3ff", fontWeight: "bold" }}>
                4. UNIVERSAL CUSTOMS CLEARANCE DOSSIER &amp; MUNICIPAL PACKET
              </div>
              <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "4px" }}>
                {isSettled
                  ? "Dossier unsealed. Trilingual SASO parity sheet, ZATCA tax invoice, and HUD verification archives ready."
                  : "Trial mode active. Wire or wallet clearance required to package the unwatermarked municipal archive."}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleZipDossier()}
              disabled={dossierLoading}
              style={{
                backgroundColor: dossierLoading ? "#222" : isSettled ? "#00ff66" : "#ffd700",
                color: "#000",
                border: "none",
                padding: "14px 24px",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: dossierLoading ? "not-allowed" : "pointer",
                fontFamily: "monospace",
                letterSpacing: "1px"
              }}
            >
              {dossierLoading
                ? "PACKAGING ARCHIVE..."
                : isSettled
                  ? "📦 DOWNLOAD AUDIT-READY DOSSIER (.ZIP)"
                  : "🔒 UNLOCK COMPLETE DOSSIER (.ZIP)"}
            </button>
          </section>

        </main>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DUAL-TRACK MULTI-VERTICAL INGESTION CONSOLE (AEC + FMCG)          */}
      {/* ========================================================================= */}
      {activeTab === "multi_vertical" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "25px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#061017", border: "1px solid #142838", padding: "15px 20px" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#00f3ff" }}>
                DUAL-TRACK COMPLIANCE ROUTER (SFDA FOOD / FMCG ⇄ AEC HEAVY ENGINEERING)
              </div>
              <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
                Target: <code>/api/transport/multi-vertical-ingest</code> // Validated cold-chain sensor streaming &amp; SABER parity.
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => { setMvTrack("fmcg"); setMvCifValueSAR("45000"); }}
                style={{
                  backgroundColor: mvTrack === "fmcg" ? "#00f3ff" : "transparent",
                  color: mvTrack === "fmcg" ? "#000" : "#00f3ff",
                  border: "1px solid #00f3ff",
                  padding: "8px 14px",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "monospace"
                }}
              >
                ❄️ FMCG / COLD CHAIN
              </button>
              <button
                type="button"
                onClick={() => { setMvTrack("aec"); setMvCifValueSAR("120000"); }}
                style={{
                  backgroundColor: mvTrack === "aec" ? "#00ff66" : "transparent",
                  color: mvTrack === "aec" ? "#000" : "#00ff66",
                  border: "1px solid #00ff66",
                  padding: "8px 14px",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "monospace"
                }}
              >
                🏗️ AEC STRUCTURAL STEEL
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>

            {/* Input Config Section */}
            <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "8px" }}>
                CARGO &amp; REGULATORY PARAMETERS [{mvTrack.toUpperCase()}]
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.72rem", color: "#888" }}>CIF VALUE (SAR):</label>
                <input
                  type="number"
                  value={mvCifValueSAR}
                  onChange={(e) => setMvCifValueSAR(e.target.value)}
                  style={{ backgroundColor: "#000", border: "1px solid #333", color: "#00ff66", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem", outline: "none" }}
                />
              </div>

              {mvTrack === "fmcg" ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.72rem", color: "#888" }}>SFDA REGISTRATION ID:</label>
                    <input
                      type="text"
                      value={mvSfdaRegId}
                      onChange={(e) => setMvSfdaRegId(e.target.value)}
                      style={{ backgroundColor: "#000", border: "1px solid #333", color: "#fff", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem", outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.72rem", color: "#888" }}>CURRENT TEMP (°C):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={mvTempC}
                        onChange={(e) => setMvTempC(e.target.value)}
                        style={{
                          backgroundColor: "#000",
                          border: Number(mvTempC) > 4.0 ? "1px solid #ff3366" : "1px solid #333",
                          color: Number(mvTempC) > 4.0 ? "#ff3366" : "#00f3ff",
                          padding: "8px 12px",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          outline: "none"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.72rem", color: "#888" }}>REMAINING SHELF LIFE (%):</label>
                      <input
                        type="number"
                        value={mvShelfLifePct}
                        onChange={(e) => setMvShelfLifePct(e.target.value)}
                        style={{
                          backgroundColor: "#000",
                          border: Number(mvShelfLifePct) < 70 ? "1px solid #ff3366" : "1px solid #333",
                          color: Number(mvShelfLifePct) < 70 ? "#ff3366" : "#00ff66",
                          padding: "8px 12px",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#fff", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={mvHalalCert}
                        onChange={(e) => setMvHalalCert(e.target.checked)}
                        style={{ accentColor: "#00ff66" }}
                      />
                      GSO HALAL CERTIFIED
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#fff", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={mvIotStream}
                        onChange={(e) => setMvIotStream(e.target.checked)}
                        style={{ accentColor: "#00f3ff" }}
                      />
                      ACTIVE IOT TELEMETRY
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.72rem", color: "#888" }}>SABER CERTIFICATE ID:</label>
                    <input
                      type="text"
                      value={mvSaberCertId}
                      onChange={(e) => setMvSaberCertId(e.target.value)}
                      style={{ backgroundColor: "#000", border: "1px solid #333", color: "#fff", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem", outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.72rem", color: "#888" }}>MATERIAL SPEC / GRADE:</label>
                    <input
                      type="text"
                      value={mvMaterialGrade}
                      onChange={(e) => setMvMaterialGrade(e.target.value)}
                      style={{ backgroundColor: "#000", border: "1px solid #333", color: "#00f3ff", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem", outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.72rem", color: "#888" }}>WEIGHT (METRIC TONS):</label>
                    <input
                      type="number"
                      value={mvWeightTons}
                      onChange={(e) => setMvWeightTons(e.target.value)}
                      style={{ backgroundColor: "#000", border: "1px solid #333", color: "#fff", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem", outline: "none" }}
                    />
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#fff", cursor: "pointer", marginTop: "6px" }}>
                    <input
                      type="checkbox"
                      checked={mvSasoCompliant}
                      onChange={(e) => setMvSasoCompliant(e.target.checked)}
                      style={{ accentColor: "#00ff66" }}
                    />
                    SASO / ASTM STANDARDS COMPLIANT
                  </label>
                </>
              )}

              <button
                type="button"
                disabled={mvLoading}
                onClick={handleRunMultiVerticalIngest}
                style={{
                  backgroundColor: mvLoading ? "#222" : "#00f3ff",
                  color: "#000",
                  border: "none",
                  padding: "14px",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  cursor: mvLoading ? "not-allowed" : "pointer",
                  fontFamily: "monospace",
                  marginTop: "10px",
                  letterSpacing: "1px"
                }}
              >
                {mvLoading ? "EVALUATING PIPELINE..." : `⚡ TRANSMIT ${mvTrack.toUpperCase()} TELEMETRY & AUDIT TARIFFS`}
              </button>
            </section>

            {/* Ingestion Evaluation Display */}
            <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold" }}>
                  GATE EVALUATION // REGULATORY CLEARANCE
                </div>
                {mvResult?.validation?.status && (
                  <span style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    fontWeight: "bold",
                    borderRadius: "2px",
                    border: mvResult.validation.status.includes("CLEAR") ? "1px solid #00ff66" : "1px solid #ff3366",
                    color: mvResult.validation.status.includes("CLEAR") ? "#00ff66" : "#ff3366",
                    backgroundColor: mvResult.validation.status.includes("CLEAR") ? "#041a0d" : "#1a0408"
                  }}>
                    ● {mvResult.validation.status}
                  </span>
                )}
              </div>

              {mvResult ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.75rem" }}>

                  {/* Status Badges */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ padding: "10px", border: "1px solid #142838", backgroundColor: "#02070c" }}>
                      <div style={{ fontSize: "0.65rem", color: "#888" }}>REGULATORY APPROVAL:</div>
                      <div style={{ color: "#00ff66", fontWeight: "bold", marginTop: "2px" }}>
                        {mvResult.validation?.sfdaPreApproval || (mvResult.validation?.sasoCompliance ? "SASO Verified" : "Active")}
                      </div>
                    </div>
                    <div style={{ padding: "10px", border: "1px solid #142838", backgroundColor: "#02070c" }}>
                      <div style={{ fontSize: "0.65rem", color: "#888" }}>STANDARD PARITY:</div>
                      <div style={{ color: "#00f3ff", fontWeight: "bold", marginTop: "2px" }}>
                        {mvResult.validation?.halalStandard || (mvResult.validation?.zatcaValidated ? "ZATCA e-Tax Ready" : "GCC Compliant")}
                      </div>
                    </div>
                  </div>

                  {/* FMCG Cold Chain Metrics Box */}
                  {mvResult.validation?.coldChainTelemetry && (
                    <div style={{ border: "1px solid #142838", backgroundColor: "#02070c", padding: "12px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#00f3ff", fontWeight: "bold", marginBottom: "8px" }}>
                        COLD-CHAIN SENSOR TELEMETRY STREAM
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.7rem" }}>
                        <div>CURRENT TEMP: <strong style={{ color: mvResult.validation.coldChainTelemetry.tempStatus === "BREACH_CRITICAL_SFDA" ? "#ff3366" : "#00ff66" }}>{mvResult.validation.coldChainTelemetry.currentTempC}°C</strong></div>
                        <div>MAX THRESHOLD: <span style={{ color: "#aaa" }}>{mvResult.validation.coldChainTelemetry.maxTempThresholdC}°C</span></div>
                        <div>SHELF-LIFE REMAINING: <strong style={{ color: mvResult.validation.coldChainTelemetry.shelfLifeStatus === "REJECT_EXPIRED_THRESHOLD" ? "#ff3366" : "#00ff66" }}>{mvResult.validation.coldChainTelemetry.minRemainingShelfLifePct}%</strong></div>
                        <div>TELEMETRY LINK: <span style={{ color: "#00f3ff" }}>{mvResult.validation.coldChainTelemetry.sensorStreamActive ? "ENCRYPTED STREAM" : "OFFLINE"}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Financial Settlement Ledger */}
                  <div style={{ border: "1px solid #142838", backgroundColor: "#02070c", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#ffaa00", fontWeight: "bold", marginBottom: "4px" }}>
                      ZATCA / PORT CLEARANCE FISCAL ASSESSMENT
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888" }}>CIF VALUE:</span>
                      <span>{mvResult.financials?.cifValueSAR?.toLocaleString()} SAR</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888" }}>5% CUSTOMS DUTY:</span>
                      <span style={{ color: "#ffaa00" }}>{mvResult.financials?.customsDutySAR?.toLocaleString()} SAR</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888" }}>PORT INSPECTION &amp; TERMINAL FEE:</span>
                      <span>{(mvResult.financials?.sfdaHandlingFee || mvResult.financials?.municipalHandlingFee)?.toLocaleString()} SAR</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888" }}>15% ZATCA VAT:</span>
                      <span style={{ color: "#00ff66" }}>{mvResult.financials?.zatcaVatSAR?.toLocaleString()} SAR</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #142838", paddingTop: "8px", marginTop: "4px" }}>
                      <strong style={{ color: "#fff" }}>TOTAL LANDED COST:</strong>
                      <strong style={{ color: "#00ff66", fontSize: "0.95rem" }}>
                        {mvResult.financials?.totalLandedCostSAR?.toLocaleString()} SAR
                      </strong>
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ padding: "40px 20px", border: "1px dashed #222", textAlign: "center", color: "#666", fontSize: "0.75rem" }}>
                  Adjust parameters on the left and dispatch audit telemetry to calculate landed duties and verify compliance.
                </div>
              )}
            </section>
          </div>

        </main>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BOM & SASO LOCALIZER                                               */}
      {/* ========================================================================= */}
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

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                disabled={specLoading || stagedItems.length === 0}
                onClick={() => handleCompileSubmittal()}
                style={{
                  flex: 1,
                  backgroundColor: specLoading ? "#222" : isSettled ? "#00ff66" : "#00f3ff",
                  color: "#000",
                  border: "none",
                  padding: "14px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  cursor: specLoading ? "not-allowed" : "pointer",
                  letterSpacing: "1px"
                }}
              >
                {specLoading
                  ? "TRANSLATING & COMPILING STAGED SUBMITTALS..."
                  : isSettled
                    ? "⚡ COMPILE LICENSED SUBMITTAL DOSSIER (UNWATERMARKED)"
                    : "⚡ COMPILE PREVIEW SUBMITTAL (WATERMARKED DRAFT)"}
              </button>

              {!isSettled && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingAction("spec");
                    setShowSettlementModal(true);
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #ffd700",
                    color: "#ffd700",
                    padding: "14px 20px",
                    fontWeight: "bold",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    letterSpacing: "0.5px"
                  }}
                >
                  💳 UNLOCK OFFICIAL SEAL
                </button>
              )}
            </div>
          </section>

          {output?.downloads && (
            <section style={{ border: output.isPaid ? "1px solid #00ff66" : "1px dashed #ffd700", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.85rem", color: output.isPaid ? "#00ff66" : "#ffd700", fontWeight: "bold" }}>
                  {output.isPaid ? "✓ OFFICIAL MUNICIPAL SUBMITTALS RELEASED" : "⚠ PREVIEW DOSSIER COMPILED (WATERMARKED FOR DRAFT REVIEW)"}
                </div>
                {!output.isPaid && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAction("spec");
                      setShowSettlementModal(true);
                    }}
                    style={{ backgroundColor: "#ffd700", color: "#000", border: "none", padding: "6px 14px", fontWeight: "bold", fontSize: "0.72rem", cursor: "pointer" }}
                  >
                    CLEAR SETTLEMENT TO REMOVE WATERMARK
                  </button>
                )}
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

      {/* ========================================================================= */}
      {/* TAB 3: COMMERCIAL & ZATCA TAX STUDIO                                      */}
      {/* ========================================================================= */}
      {activeTab === "invoice" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "25px", padding: "10px" }}>
          <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2 style={{ fontSize: "0.95rem", color: "#00f3ff", margin: 0, letterSpacing: "1px" }}>
                COMMERCIAL ENGAGEMENT MODELS // GCC &amp; CHINA CONTRACTORS
              </h2>
              <span style={{ fontSize: "0.72rem", color: "#888" }}>
                SELECT MODEL ➔ ISSUE OFFICIAL ZATCA PROFORMA TAX INVOICE (PDF)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
              <div
                onClick={() => setSelectedPlan("retainer")}
                style={{
                  border: selectedPlan === "retainer" ? "2px solid #00ff66" : "1px solid #222",
                  backgroundColor: selectedPlan === "retainer" ? "#06150b" : "#050505",
                  padding: "15px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#00ff66" }}>MUNICIPAL COMPLIANCE RETAINER</span>
                    {selectedPlan === "retainer" && <span style={{ fontSize: "0.65rem", background: "#00ff66", color: "#000", padding: "2px 6px", fontWeight: "bold" }}>ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff", margin: "10px 0 4px" }}>
                    $3,500 <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: "normal" }}>/ month</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: "1.4", margin: 0 }}>
                    Turnkey procurement &amp; submittal engineering for active GCC projects.
                  </p>
                  <ul style={{ fontSize: "0.68rem", color: "#666", marginTop: "10px", paddingLeft: "15px", lineHeight: "1.6" }}>
                    <li>Unlimited GB/T ⇄ SASO/ASTM BOM staging</li>
                    <li>Instant MOMRAH dual-language vector PDF</li>
                    <li>Continuous SABER conformity matrix</li>
                    <li>Trilingual ZATCA 15% VAT tax invoice</li>
                  </ul>
                </div>
              </div>

              <div
                onClick={() => setSelectedPlan("single")}
                style={{
                  border: selectedPlan === "single" ? "2px solid #00ff66" : "1px solid #222",
                  backgroundColor: selectedPlan === "single" ? "#06150b" : "#050505",
                  padding: "15px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#00f3ff" }}>PROJECT SUBMITTAL PACKAGE</span>
                    <span style={{ fontSize: "0.65rem", border: "1px solid #333", color: "#888", padding: "2px 6px" }}>PER SUBMITTAL</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff", margin: "10px 0 4px" }}>
                    $1,850 <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: "normal" }}>/ package</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: "1.4", margin: 0 }}>
                    Complete municipal compliance filing for a single building package.
                  </p>
                  <ul style={{ fontSize: "0.68rem", color: "#666", marginTop: "10px", paddingLeft: "15px", lineHeight: "1.6" }}>
                    <li>Full factory BOM extraction &amp; alloy parity</li>
                    <li>FOB Guangzhou to CIF Jeddah cost breakdown</li>
                    <li>Stamped municipal drone inspection video</li>
                    <li>Complete SASO &amp; ASTM compliance dossier</li>
                  </ul>
                </div>
              </div>

              <div
                onClick={() => setSelectedPlan("enterprise")}
                style={{
                  border: selectedPlan === "enterprise" ? "2px solid #00ff66" : "1px solid #222",
                  backgroundColor: selectedPlan === "enterprise" ? "#06150b" : "#050505",
                  padding: "15px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#ffd700" }}>ENTERPRISE BARE-METAL CORE</span>
                    <span style={{ fontSize: "0.65rem", border: "1px solid #333", color: "#ffd700", padding: "2px 6px" }}>AIR-GAPPED</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff", margin: "10px 0 4px" }}>
                    $8,500 <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: "normal" }}>/ on-premise</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: "1.4", margin: 0 }}>
                    Self-hosted sovereign deployment for Tier-1 general contractors.
                  </p>
                  <ul style={{ fontSize: "0.68rem", color: "#666", marginTop: "10px", paddingLeft: "15px", lineHeight: "1.6" }}>
                    <li>100% air-gapped local execution</li>
                    <li>Direct ERP / Revit / BIM ingestion pipeline</li>
                    <li>Dedicated multi-tenant contractor licensing</li>
                    <li>Priority SLA &amp; custom GCC municipal schema</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1a1a1a", paddingTop: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>BILLED ENTITY:</span>
                <input
                  type="text"
                  value={invoiceClient}
                  onChange={(e) => setInvoiceClient(e.target.value)}
                  style={{ backgroundColor: "#000", border: "1px solid #333", color: "#fff", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem", width: "280px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsIngestModalOpen(true)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#00f3ff",
                    border: "1px solid #00f3ff",
                    padding: "12px 18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    letterSpacing: "1px",
                  }}
                >
                  📥 RAW TERMINAL INGEST (CSV / TSV)
                </button>

                <button
                  type="button"
                  disabled={invoiceLoading}
                  onClick={() => {
                    setShowSettlementModal(true);
                    handleGenerateInvoice(selectedPlan);
                  }}
                  style={{
                    backgroundColor: invoiceLoading ? "#222" : "#00ff66",
                    color: "#000",
                    border: "none",
                    padding: "12px 24px",
                    fontWeight: "bold",
                    cursor: invoiceLoading ? "not-allowed" : "pointer",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    letterSpacing: "1px",
                  }}
                >
                  {invoiceLoading ? "GENERATING INVOICE..." : `⚡ GENERATE PROFORMA INVOICE ($${selectedPlan === "retainer" ? "3,500" : selectedPlan === "single" ? "1,850" : "8,500"})`}
                </button>
              </div>
            </div>
          </section>

          {/* SOVEREIGN TRANSACTION AUDIT LEDGER */}
          <section style={{ border: "1px solid #1a2e26", padding: "16px 20px", backgroundColor: "#050807", fontFamily: "monospace" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #162620", paddingBottom: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8rem", color: "#00ff66", fontWeight: "bold", letterSpacing: "1px" }}>
                ⚡ SOVEREIGN_LEDGER // ZATCA TRANSACTION AUDIT
              </span>
              <button
                type="button"
                onClick={fetchLedger}
                disabled={ledgerLoading}
                style={{
                  background: "transparent",
                  border: "1px solid #00ff66",
                  color: "#00ff66",
                  fontSize: "0.7rem",
                  padding: "3px 10px",
                  cursor: ledgerLoading ? "not-allowed" : "pointer",
                  fontFamily: "monospace",
                  opacity: ledgerLoading ? 0.6 : 1
                }}
              >
                {ledgerLoading ? "SYNCING..." : "SYNC LEDGER"}
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #222", color: "#666" }}>
                    <th style={{ padding: "6px 8px" }}>REF NO.</th>
                    <th style={{ padding: "6px 8px" }}>CLIENT ENTITY</th>
                    <th style={{ padding: "6px 8px" }}>TAX ID</th>
                    <th style={{ padding: "6px 8px" }}>NET (SAR)</th>
                    <th style={{ padding: "6px 8px" }}>VAT (15%)</th>
                    <th style={{ padding: "6px 8px" }}>TOTAL</th>
                    <th style={{ padding: "6px 8px" }}>COMMITTED AT</th>
                    <th style={{ padding: "6px 8px" }}>ARTIFACTS</th>
                    <th style={{ padding: "6px 8px", textAlign: "right" }}>STATE</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerInvoices && ledgerInvoices.length > 0 ? (
                    ledgerInvoices.map((inv: any) => {
                      const pdfUrl = inv.downloadUrl || `${API_BASE}/outputs/invoice_${inv.invoiceNumber}.pdf`;
                      const xmlUrl = inv.xmlDownloadUrl || (inv.xmlPath ? `${API_BASE}/outputs/${inv.xmlPath.split(/[\\/]/).pop()}` : null);
                      return (
                        <tr
                          key={inv.id || inv.invoiceNumber}
                          style={{ borderBottom: "1px solid #111", color: "#ccc" }}
                          title={`HASH: ${inv.invoiceHash}\nPIH: ${inv.previousInvoiceHash || "GENESIS_ROOT"}`}
                        >
                          <td style={{ padding: "8px", color: "#00f3ff", fontWeight: "bold" }}>
                            {inv.invoiceNumber}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {inv.clientName}
                          </td>
                          <td style={{ padding: "8px", color: "#777" }}>
                            {inv.clientTaxId || "300000000000003"}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {Number(inv.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "8px", color: "#ffb703" }}>
                            {Number(inv.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "8px", color: "#00ff66", fontWeight: "bold" }}>
                            {Number(inv.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency || "SAR"}
                          </td>
                          <td style={{ padding: "8px", color: "#555", fontSize: "0.7rem" }}>
                            {inv.createdAt
                              ? `${new Date(inv.createdAt).toLocaleDateString()} ${new Date(inv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                              : "JUST NOW"}
                          </td>
                          <td style={{ padding: "8px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {xmlUrl && (
                                <a
                                  href={xmlUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "#00f3ff",
                                    textDecoration: "none",
                                    border: "1px solid #00f3ff",
                                    padding: "1px 4px",
                                    fontSize: "0.6rem"
                                  }}
                                >
                                  XML
                                </a>
                              )}
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#ffcc00",
                                  textDecoration: "none",
                                  border: "1px solid #ffcc00",
                                  padding: "1px 4px",
                                  fontSize: "0.6rem"
                                }}
                              >
                                PDF
                              </a>
                            </div>
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <span style={{ border: "1px solid #00ff66", color: "#00ff66", padding: "1px 6px", fontSize: "0.65rem", background: "#003311" }}>
                              VERIFIED
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ padding: "16px 8px", textAlign: "center", color: "#555" }}>
                        {ledgerLoading ? "// RETRIEVING SOVEREIGN LEDGER BLOCKS..." : "// NO RECORDED AUDIT BLOCKS FOUND. CLICK SYNC LEDGER."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
            <section style={{ border: "1px solid #222", padding: "20px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "15px" }}>
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
                    ✓ TAX INVOICE COMPILED [{output.invoiceNumber || "INV-LATEST"}]
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

              <pre style={{ color: "#00ff66", margin: 0, whiteSpace: "pre-wrap", fontSize: "0.8rem", maxHeight: "250px", overflowY: "auto", border: "1px solid #222", padding: "10px", backgroundColor: "#050505" }}>
                {output ? JSON.stringify(output, null, 2) : "// Awaiting commercial calculation..."}
              </pre>
            </section>
          </div>
        </main>
      )}
      {/* ========================================================================= */}
      {/* TAB 4: SITE & BIM HUD TELEMETRY                                           */}
      {/* ========================================================================= */}
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
                setSiteHudLoading(true);
                setError(null);
                setOutput(null);

                try {
                  const formData = new FormData();
                  if (droneFile) {
                    formData.append("videoFile", droneFile);
                  }
                  formData.append("projectTitle", projectTitle.trim() || "MOMRAH CENTRAL TOWER // ZONE 4");
                  formData.append("datumElevation", datumElevation.trim() || "+12.50m (Structural Slab Level)");
                  formData.append("gpsCoordinates", gpsCoords.trim() || "24.7136° N, 46.6753° E");
                  formData.append("baladyLicenseNo", baladyLicense.trim() || "BLD-RYD-2026-9941");
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
                1. SELECT RAW DRONE FOOTAGE (.MP4) OR RUN SYNTHETIC COLOR
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

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                  href={bimOutput.downloadUrl.startsWith("http") ? bimOutput.downloadUrl : `${API_BASE}${bimOutput.downloadUrl}`}
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

      {/* ========================================================================= */}
      {/* TAB 5: EXECUTIVE PROPOSAL DECK                                            */}
      {/* ========================================================================= */}
      {activeTab === "pitch" && <PitchDeck />}

{/* ========================================================================= */}
      {/* TAB 6: EDGE GENERATIVE ENGINE (GEO) & AEO COMPLIANCE AUDITOR              */}
      {/* ========================================================================= */}
      {activeTab === "auditor" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "25px", padding: "10px" }}>
          
          {/* Header Bar */}
          <section style={{ border: "1px solid #142838", padding: "20px", backgroundColor: "#061017", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "0.95rem", color: "#00f3ff", margin: 0, letterSpacing: "1px" }}>
                EDGE GEO / AEO &amp; GENERATIVE ENGINE AUDIT ENGINE
              </h2>
              <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
                PROBING CLOUDFLARE HTMLREWRITER &bull; /llms.txt MANIFESTS &bull; CRAWLER CLEARANCE &bull; SCHEMA INTEGRITY
              </div>
            </div>

            {auditResult && (
              <div style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: (auditResult.geoAeoReadiness?.geoScore || 0) >= 80 ? "#00ff66" : "#ffaa00",
                border: `1px solid ${(auditResult.geoAeoReadiness?.geoScore || 0) >= 80 ? "#00ff66" : "#ffaa00"}`,
                padding: "6px 18px",
                backgroundColor: "#021208",
                letterSpacing: "1px"
              }}>
                GEO SCORE: {auditResult.geoAeoReadiness?.geoScore ?? 0} / 100
              </div>
            )}
          </section>

          {/* URL Input Form */}
          <section style={{ border: "1px solid #142838", padding: "20px", backgroundColor: "#061017" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
                placeholder="https://target-domain.com"
                style={{
                  flex: 1,
                  backgroundColor: "#02070b",
                  border: "1px solid #1c364a",
                  color: "#00f3ff",
                  padding: "12px 14px",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
              <button
                type="button"
                disabled={isAuditing}
                onClick={handleRunAudit}
                style={{
                  backgroundColor: isAuditing ? "#142838" : "#00f3ff",
                  color: "#000",
                  border: "none",
                  padding: "12px 24px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  cursor: isAuditing ? "not-allowed" : "pointer",
                  letterSpacing: "1px"
                }}
              >
                {isAuditing ? "INTERROGATING EDGE..." : "⚡ RUN EDGE AUDIT"}
              </button>
            </div>
          </section>

          {/* Audit Telemetry Output Panels */}
          {auditResult && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              
              {/* Left Column: Security, Manifest & Bot Clearance */}
              <section style={{ border: "1px solid #142838", padding: "20px", backgroundColor: "#061017", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "8px" }}>
                  1. PROTOCOL &amp; INDEXING HEALTH
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>TARGET HOST:</span>
                    <span style={{ color: "#fff", wordBreak: "break-all" }}>{auditResult.target}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>HTTP RESPONSE:</span>
                    <span style={{ color: auditResult.httpStatus === 200 ? "#00ff66" : "#ffaa00" }}>{auditResult.httpStatus} OK</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>HSTS PROTOCOL:</span>
                    <strong style={{ color: auditResult.headers?.strictTransportSecurity === "PRESENT" ? "#00ff66" : "#ff3366" }}>
                      {auditResult.headers?.strictTransportSecurity}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>CONTENT SECURITY POLICY (CSP):</span>
                    <strong style={{ color: auditResult.headers?.contentSecurityPolicy === "PRESENT" ? "#00ff66" : "#ff3366" }}>
                      {auditResult.headers?.contentSecurityPolicy}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>/llms.txt MANIFEST:</span>
                    <strong style={{ color: auditResult.llmManifest?.hasLlmsTxt ? "#00ff66" : "#ffaa00" }}>
                      {auditResult.llmManifest?.hasLlmsTxt ? "ACTIVE (HTTP 200)" : "ABSENT (HTTP 404)"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>OPEN GRAPH ENTITY:</span>
                    <strong style={{ color: auditResult.geoAeoReadiness?.hasOpenGraph ? "#00ff66" : "#ff3366" }}>
                      {auditResult.geoAeoReadiness?.hasOpenGraph ? "PRESENT" : "MISSING"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>JSON-LD SCHEMAS:</span>
                    <span style={{ color: "#00f3ff", fontWeight: "bold" }}>
                      {auditResult.geoAeoReadiness?.jsonLdSchemas?.length > 0
                        ? auditResult.geoAeoReadiness.jsonLdSchemas.join(", ")
                        : "NONE DETECTED"}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "8px", marginTop: "10px" }}>
                  2. AI ENGINE CRAWLER DIRECTIVES
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "0.72rem" }}>
                  {auditResult.aiCrawlers &&
                    Object.entries(auditResult.aiCrawlers).map(([bot, status]) => (
                      <div key={bot} style={{ border: "1px solid #142838", padding: "8px 6px", textAlign: "center", backgroundColor: "#02070b" }}>
                        <div style={{ color: "#888", marginBottom: "4px" }}>{bot}</div>
                        <div style={{ color: status === "ALLOWED" ? "#00ff66" : "#ff3366", fontWeight: "bold" }}>
                          {status as string}
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              {/* Right Column: Recommendations & Proposal Pipeline */}
              <section style={{ border: "1px solid #142838", padding: "20px", backgroundColor: "#061017", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "8px", marginBottom: "14px" }}>
                    3. DEFICITS &amp; ACTIONABLE REMEDIATIONS
                  </div>

                  {auditResult.recommendations?.length === 0 ? (
                    <div style={{ padding: "16px", border: "1px solid #00ff66", backgroundColor: "#021a0d", color: "#00ff66", fontSize: "0.8rem", lineHeight: "1.5" }}>
                      ✓ High Authority Profile: Target site presents full edge transport security, structured knowledge schemas, and unrestricted AI crawler access.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {auditResult.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} style={{ padding: "10px 14px", border: "1px solid #ffaa00", backgroundColor: "#1c1402", color: "#ffaa00", fontSize: "0.75rem", lineHeight: "1.4" }}>
                          ⚠ {rec}
                        </div>
                      ))}
                    </div>
                  )}

                  {auditResult.title && (
                    <div style={{ marginTop: "16px", fontSize: "0.72rem", color: "#666" }}>
                      PARSED TITLE: <span style={{ color: "#aaa" }}>{auditResult.title}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleExportAuditDossier}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #00f3ff",
                    color: "#00f3ff",
                    padding: "14px",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                    marginTop: "20px"
                  }}
                >
                  📄 COMPILE CLIENT PROPOSAL DOSSIER (.PDF)
                </button>
              </section>

            </div>
          )}
        </main>
      )}
      
      {/* Sovereign Enterprise Compliance Footer */}
      <footer style={{ marginTop: "40px", borderTop: "1px solid #1a1a1a", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "#555" }}>
        <div style={{ maxWidth: "800px", lineHeight: "1.4" }}>
          <span style={{ color: "#888", fontWeight: "bold" }}>LEGAL &amp; REGULATORY NOTICE:</span>{" "}
          MIU Sovereign AEC &amp; Trade Core is a technical staging and document compilation engine. Outputs are prepared for engineering coordination and customs clearance. Final submittals to MOMRAH, Balady, SFDA, SABER, or ZATCA require review and endorsement by the licensed Engineer of Record or clearing agent.
        </div>
        <div style={{ textAlign: "right", fontFamily: "monospace", color: "#444" }}>
          <div>SOVEREIGN AIR-GAPPED CORE // 2026</div>
          <div style={{ color: isSettled ? "#00ff66" : "#00f3ff" }}>
            ● {isSettled ? "LICENSED FOR OFFICIAL FILING" : "TRIAL PREVIEW MODE"}
          </div>
        </div>
      </footer>

      {/* DUAL PAYMENT & CLEARANCE MODAL (SARIE WIRE & AUTO-POLL LISTENER) */}
      {showSettlementModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.92)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#0a0e17",
            border: "1px solid #00f3ff",
            padding: "25px",
            width: "680px",
            maxWidth: "95%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 0 35px rgba(0, 243, 255, 0.25)"
          }}>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #1a2936", paddingBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "0.95rem", color: "#00f3ff", fontWeight: "bold", letterSpacing: "1px" }}>
                  SETTLEMENT GATEWAY // SARIE WIRE &amp; DIGITAL WALLET
                </div>
                <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "3px" }}>
                  BENEFICIARY: <span style={{ color: "#fff", fontWeight: "bold" }}>ANAMY DE LA CRUZ PADILLA</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSettlementModal(false);
                  setPendingAction(null);
                }}
                style={{ backgroundColor: "transparent", border: "1px solid #444", color: "#888", padding: "4px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}
              >
                [CLOSE ✕]
              </button>
            </div>

            {/* Generated Invoice Alert */}
            {output?.downloadUrl && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#061824", border: "1px solid #0088cc", padding: "10px 14px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#00ff66", fontWeight: "bold" }}>✓ ZATCA PROFORMA INVOICE ISSUED</div>
                  <div style={{ fontSize: "0.68rem", color: "#888" }}>Ref: {output.invoiceNumber || projectCode} (15% VAT &amp; Base64 QR Encoded)</div>
                </div>
                <a
                  href={output.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: "#00f3ff", color: "#000", padding: "6px 12px", textDecoration: "none", fontWeight: "bold", fontSize: "0.7rem", fontFamily: "monospace" }}
                >
                  VIEW PDF
                </a>
              </div>
            )}

            {/* Dual Payment Methods Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>

              {/* Box 1: urpay / Al Rajhi */}
              <div style={{ border: "1px solid #1a2936", backgroundColor: "#04070d", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a2230", paddingBottom: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#00f3ff" }}>URPAY // AL RAJHI</span>
                    <span style={{ fontSize: "0.62rem", color: "#00ff66", backgroundColor: "#022010", padding: "2px 5px", border: "1px solid #006633" }}>SARIE</span>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#888", marginBottom: "4px" }}>IBAN (Instant Local Transfer):</div>
                  <div style={{ fontSize: "0.7rem", color: "#00ff66", fontWeight: "bold", backgroundColor: "#000", padding: "6px", border: "1px solid #1a2230", wordBreak: "break-all", userSelect: "all" }}>
                    SA4880207781501222121011
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px" }}>
                  <img
                    src="/urpay-qr.png"
                    alt="urpay QR"
                    style={{ width: "130px", height: "130px", backgroundColor: "#fff", padding: "4px", borderRadius: "3px", objectFit: "contain", border: "1px solid #00f3ff" }}
                  />
                  <span style={{ fontSize: "0.65rem", color: "#666", marginTop: "6px" }}>Scan with urpay app</span>
                </div>
              </div>

              {/* Box 2: STC Bank */}
              <div style={{ border: "1px solid #1a2936", backgroundColor: "#04070d", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a2230", paddingBottom: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#b366ff" }}>STC BANK</span>
                    <span style={{ fontSize: "0.62rem", color: "#00ff66", backgroundColor: "#022010", padding: "2px 5px", border: "1px solid #006633" }}>SARIE</span>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#888", marginBottom: "4px" }}>IBAN (Instant Local Transfer):</div>
                  <div style={{ fontSize: "0.7rem", color: "#00ff66", fontWeight: "bold", backgroundColor: "#000", padding: "6px", border: "1px solid #1a2230", wordBreak: "break-all", userSelect: "all" }}>
                    SA277800000001261965468
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px" }}>
                  <img
                    src="/stc-qr.png"
                    alt="STC Bank QR"
                    style={{ width: "130px", height: "130px", backgroundColor: "#fff", padding: "4px", borderRadius: "3px", objectFit: "contain", border: "1px solid #b366ff" }}
                  />
                  <span style={{ fontSize: "0.65rem", color: "#666", marginTop: "6px" }}>Scan with STC Pay / Bank</span>
                </div>
              </div>

            </div>

            {/* Automated Webhook Listener Status Block */}
            <div style={{ borderTop: "1px solid #1a2936", paddingTop: "14px", textAlign: "center" }}>
              <div style={{ backgroundColor: "#061824", border: "1px solid #0088cc", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.78rem", color: "#00ff66", fontWeight: "bold" }}>
                  ⏳ WAITING FOR SARIE SETTLEMENT CLEARANCE...
                </div>
                <div style={{ fontSize: "0.68rem", color: "#aaa", lineHeight: "1.4" }}>
                  Scan either QR code above and complete your transfer with your banking app. Once confirmed on the network, this terminal detects clearance and unlocks the dossier archive automatically in this window.
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <input
                    type="text"
                    placeholder="Or enter SARIE / Bank Transaction Ref..."
                    value={settlementRef}
                    onChange={(e) => setSettlementRef(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: "#000",
                      border: "1px solid #142838",
                      color: "#00f3ff",
                      padding: "8px 12px",
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (settlementRef.trim()) {
                        handleZipDossier(settlementRef);
                      }
                    }}
                    style={{
                      backgroundColor: "#00f3ff",
                      color: "#000",
                      border: "none",
                      padding: "8px 14px",
                      fontWeight: "bold",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontFamily: "monospace"
                    }}
                  >
                    VERIFY REF
                  </button>
                </div>
              </div>
            </div>

            {/* Status Feedbacks */}
            {clearanceStatus === "VERIFIED" && (
              <div style={{ backgroundColor: "#022010", border: "1px solid #00ff66", padding: "8px", textAlign: "center", fontSize: "0.72rem", color: "#00ff66", fontWeight: "bold" }}>
                ✓ SETTLEMENT CONFIRMED — UNLOCKING MUNICIPAL COMPLIANCE DOSSIER...
              </div>
            )}

          </div>
        </div>
      )}

      {/* RAW DATA INGESTION MODAL */}
      {isIngestModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.90)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px"
        }}>
          <div style={{ width: "680px", maxWidth: "95%", position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsIngestModalOpen(false)}
              style={{
                position: "absolute",
                top: "-28px",
                right: "0",
                background: "transparent",
                border: "none",
                color: "#00f3ff",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: "bold"
              }}
            >
              [CLOSE ✕]
            </button>
            <TerminalIngestModal
              onCommitPayload={(cleanItems) => {
                setIsIngestModalOpen(false);
                handleGenerateInvoice(cleanItems);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}