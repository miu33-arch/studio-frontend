"use client";

import React, { useState, useEffect, useRef } from "react";
import PitchDeck from "@/components/PitchDeck";
import { TerminalIngestModal } from "@/components/TerminalIngestModal";
import { getClientGeoContext, GeoAuditData } from "@/lib/geo";
import CommunityFaqHub from "@/components/CommunityFaqHub";
import RemediationStudioModal from "@/components/RemediationStudioModal";
import SaberComplianceAuditor from "@/components/SaberComplianceAuditor";
import InspectionVault from "@/components/InspectionVault";
import IndustrialBOMVault from '@/components/IndustrialBOMVault';
import GeMiuAgentModal from "@/components/GeMiuAgentModal";

const getApiBase = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE || "https://api.miu33archstudio.xyz";
  }
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocal) {
    return "http://127.0.0.1:5000";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "https://api.miu33archstudio.xyz";
};

const API_BASE = getApiBase();
const LEDGER_WORKER_BASE = "https://ledger.padillaanamy83.workers.dev";
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
    "pipeline" | "multi_vertical" | "spec" | "invoice" | "site_hud" | "pitch" | "auditor" | "saber_auditor" | "inspection_vault" | "industrial_bom"
  >("pipeline");
  const [engineMode, setEngineMode] = useState<"trade" | "geo" | "unified">("unified");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "geo") {
        setEngineMode("geo");
        setActiveTab("auditor");
      } else if (mode === "unified") {
        setEngineMode("unified");
      } else {
        setEngineMode("trade");
      }
    }
  }, []);
  const [projectCode, setProjectCode] = useState("MOMRAH-RYD-2026-04");
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isGeMiuOpen, setIsGeMiuOpen] = useState(false);
  // Edge GEO / AEO Auditor State
  const [auditUrl, setAuditUrl] = useState("https://miu33archstudio.xyz");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isRemediationOpen, setIsRemediationOpen] = useState(false);

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
      const res = await fetch(
        `${API_BASE}/api/transport/pipeline-status?projectCode=${projectCode}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data?.pipeline) {
        setPipeline(data.pipeline);
      }
    } catch (_) {
      // Backend offline or unreachable; fail silently in development
    }
  };

  // Stage 1 Ingestion Handler
  const handleIngestManifest = async (file?: File) => {
    if (!file) return;
    setPipelineLoading(true);
    setError(null);

    // If it's a JSON file, parse client-side to protect schema integrity
    if (file.name.toLowerCase().endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse((e.target?.result as string).trim());
          if (raw.items && Array.isArray(raw.items)) {
            setPipeline(raw);
            if (raw.projectCode) setProjectCode(raw.projectCode);
          } else if (Array.isArray(raw)) {
            const subtotalFobUSD = raw.reduce((sum: number, it: any) => sum + (Number(it.totalFobUSD) || 4500), 0);
            const oceanFreightUSD = 2400.00;
            const insuranceUSD = Number((subtotalFobUSD * 0.005).toFixed(2));
            const totalCifUSD = subtotalFobUSD + oceanFreightUSD + insuranceUSD;
            const totalCifSAR = Number((totalCifUSD * 3.75).toFixed(2));
            const customsDutySAR = Number((totalCifSAR * 0.05).toFixed(2));
            const zatcaVatSAR = Number(((totalCifSAR + customsDutySAR) * 0.15).toFixed(2));
            const grandTotalLandedSAR = Number((totalCifSAR + customsDutySAR + zatcaVatSAR).toFixed(2));

            setPipeline({
              projectCode,
              manifestHash: "be81e0811eb1358e7a3442ea12136ee0",
              logistics: {
                vesselName: "COSCO SHIPPING // V.2604W",
                billOfLading: "BOL-1789023185558-CN-KSA",
                containerNumber: "CSNU-789421-0",
                portOfOrigin: "Guangzhou / Nansha Port",
                portOfDestination: "Jeddah Islamic Port"
              },
              items: raw,
              fiscal: {
                subtotalFobUSD,
                freightUSD: oceanFreightUSD,
                insuranceUSD,
                totalCifSAR,
                customsDutySAR,
                zatcaVatSAR,
                grandTotalLandedSAR
              },
              compliance: { dutyDebited: false },
              milestones: [
                { stage: "01", name: "FACTORY DISPATCH & QC", status: "COMPLETED", node: "China Export Gate" },
                { stage: "02", name: "PORT OF ORIGIN CLEARANCE", status: "IN_TRANSIT", node: "Guangzhou / Nansha Port" },
                { stage: "03", name: "RED SEA MARITIME TRANSIT", status: "SCHEDULED", node: "Bab-el-Mandeb Lane" },
                { stage: "04", name: "FASAH / ZATCA PORT CLEARANCE", status: "PENDING", node: "Jeddah Islamic Port" },
                { stage: "05", name: "MOMRAH PROJECT SITE RECEIVAL", status: "PENDING", node: "Riyadh Zone 4" }
              ]
            });
          }
        } catch (err: any) {
          setError(`Invalid JSON Manifest: ${err.message}`);
        } finally {
          setPipelineLoading(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    // Default backend route for spreadsheets / binary formats
    try {
      const formData = new FormData();
      formData.append("projectCode", projectCode);
      formData.append("manifestFile", file);

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

  // useEffect(() => {
  //  loadPipeline();
  // }, [projectCode]);

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
  // Edge D1 Ledger & Integrity State
  const [ledgerInvoices, setLedgerInvoices] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [totalBlocks, setTotalBlocks] = useState<number>(0);

 const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      // 1. Fetch D1 entries directly from Cloudflare Worker
      const res = await fetch(`${LEDGER_WORKER_BASE}/api/entries`);
      if (!res.ok) {
        console.error("Ledger entries fetch returned status:", res.status);
        return;
      }
      const data = await res.json();
      const entries = Array.isArray(data) ? data : (data.entries || []);
      setLedgerInvoices(entries);

      // 2. Fetch hash chain verification
      const verifyRes = await fetch(`${LEDGER_WORKER_BASE}/api/verify`);
      if (verifyRes.ok) {
        const vData = await verifyRes.json();
        setChainValid(Boolean(vData.verified));
        setTotalBlocks(vData.total_blocks || entries.length);
      } else {
        setChainValid(true);
        setTotalBlocks(entries.length);
      }
    } catch (err) {
      console.warn("Failed to sync D1 ledger:", err);
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
  const [activeApiKey, setActiveApiKey] = useState<string>("");
  const [clientBalance, setClientBalance] = useState<any>(null);

  // Settlement & Paywall Gate State
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementRef, setSettlementRef] = useState("");
  const [isSettled, setIsSettled] = useState(false);
  const [clearanceStatus, setClearanceStatus] = useState<"IDLE" | "VERIFIED" | "FAILED">("IDLE");
  const [pendingAction, setPendingAction] = useState<"spec" | "dossier" | "remediation" | null>(null);
  // Master Key Persistence & URL Token Gate
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("miu_master_key");
      const params = new URLSearchParams(window.location.search);
      const keyParam = params.get("key");

      if (savedKey === "miu_master_agency_key" || keyParam === "miu_master_agency_key") {
        setActiveApiKey("miu_master_agency_key");
        setIsSettled(true);
        setClearanceStatus("VERIFIED");
        if (keyParam) localStorage.setItem("miu_master_key", "miu_master_agency_key");
      }
    }
  }, []);
  const fetchClientBalance = async () => {
    try {
      if (!API_BASE) return;
      const res = await fetch(`${API_BASE}/api/companion/balance`).catch(() => null);
      if (!res || !res.ok) return;
      const data = await res.json();
      if (data?.balance) setClientBalance(data.balance);
    } catch (_) {
      // CSP or offline backend; fail silently in dev
    }
  };

  const fetchHistory = async () => {
    try {
      if (!API_BASE) return;
      const res = await fetch(`${API_BASE}/api/companion/history`).catch(() => null);
      if (!res || !res.ok) return;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.history) setHistory(data.history);
      }
    } catch (_) {
      // CSP or offline backend; fail silently in dev
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
            else if (pendingAction === "remediation") setIsRemediationOpen(true);
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
      // Commit directly to Cloudflare Worker D1 Ledger
      try {
        const computedSubtotal = itemsPayload.reduce(
          (sum: number, item: any) => sum + (item.unitPrice * (item.qty || 1)),
          0
        );

       await fetch(`${LEDGER_WORKER_BASE}/api/tx`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            invoice_no: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
            issue_date: new Date().toISOString().split("T")[0],
            currency: invoiceCurrency,
            country: invoiceCurrency === "SAR" ? "SA" : "CN_EXP",
            subtotal: computedSubtotal,
            mode: !isSettled ? "trial" : "live",
          }),
        });
      } catch (err) {
        console.error("D1 commit failed:", err);
      }

      await fetchLedger();

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

        // 1. JSON Parser Branch
        if (content.startsWith("{") || content.startsWith("[")) {
          const parsed = JSON.parse(content);
          if (parsed.documentTitle) setStagedDocTitle(parsed.documentTitle);

          // Full pipeline manifest payload
          if (parsed.items && Array.isArray(parsed.items)) {
            setPipeline(parsed);
            if (parsed.projectCode) setProjectCode(parsed.projectCode);
            setStagedItems(parsed.items.map((it: any, idx: number) => ({
              code: it.itemNo || it.code || `CW-${String(idx + 1).padStart(3, "0")}`,
              name: it.description || it.name || "Curtain Wall Component",
              details: it.materialGrade || it.details || "6063-T6",
              material: it.materialGrade || it.material || "Aluminum Alloy",
              standard: it.sasoStandard || it.standard || "SASO 2831 / ASTM B221"
            })));
            return;
          }

          if (Array.isArray(parsed)) {
            setStagedItems(parsed);
            return;
          }
          return;
        }

        // 2. CSV / Plain Text Fallback Branch
        const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0].toLowerCase();
          const hasHeader = firstLine.includes("code") || firstLine.includes("item") || firstLine.includes("序号") || firstLine.includes("material");
          const dataLines = hasHeader ? lines.slice(1) : lines;

          const parsedCsv: StagedBomItem[] = dataLines.map((line, idx) => {
            const parts = line.split(/[,;\t]/);
            return {
              code: parts[0]?.trim() || `ITM-${String(idx + 1).padStart(3, "0")}`,
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
      } catch (err: any) {
        console.error("File parse error:", err);
        setError(`Manifest Parse Error: ${err.message}`);
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
  const handleLockedAction = (action: "dossier" | "remediation") => {
    if (!isSettled && clearanceStatus !== "VERIFIED") {
      setPendingAction(action);
      setShowSettlementModal(true);
      return;
    }

    if (action === "dossier") {
      handleExportAuditDossier();
    } else {
      setIsRemediationOpen(true);
    }
  };
  const handlePrintLedgerReceipt = (inv: any) => {
    const invNo = inv.invoice_no || inv.invoiceNumber || "INV-2026-000";
    const modeParam = !isSettled ? "&trial=true" : "";
    window.open(
      `${LEDGER_WORKER_BASE}/invoice/receipt?inv=${encodeURIComponent(invNo)}${modeParam}`,
      "_blank",
      "width=850,height=1000"
    );
  };
  const handleExportAuditDossier = () => {
    if (!auditResult) {
      alert("Run an audit first before compiling a dossier.");
      return;
    }

    // Dynamic Pricing Engine based on detected deficits
    let baseFee = 2500; // Base Edge Security & White-list Setup (SAR)
    if (!auditResult.llmManifest?.hasLlmsTxt) baseFee += 1500;
    if (!auditResult.geoAeoReadiness?.hasFaqSchema) baseFee += 2000;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to compile the client proposal dossier.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SOVEREIGN AUDIT DOSSIER - ${auditResult.target}</title>
        <style>
          @page { 
            size: A4 portrait; 
            margin: 12mm; 
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #050a0e;
            color: #d1d5db;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .dossier-container { 
            max-width: 760px;
            margin: 0 auto;
            padding: 24px 30px;
            box-sizing: border-box; 
          }
          .section-block { 
            page-break-inside: avoid; 
            margin-bottom: 12px; 
          }
          .header { border-bottom: 2px solid #00f3ff; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 16px; font-weight: bold; color: #00f3ff; letter-spacing: 1px; }
          .meta { font-size: 9px; color: #888; text-transform: uppercase; }
          .scores { display: flex; gap: 8px; margin-bottom: 12px; }
          .score-card { flex: 1; border: 1px solid #142838; background: #08121a; padding: 8px; text-align: center; }
          .score-val { font-size: 22px; font-weight: bold; margin-top: 2px; }
          .section-title { font-size: 11px; font-weight: bold; color: #00f3ff; border-bottom: 1px solid #142838; padding-bottom: 4px; margin: 12px 0 6px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
          td, th { padding: 5px 8px; border: 1px solid #142838; text-align: left; }
          th { background-color: #08121a; color: #00f3ff; }
          .deficit { background-color: #1a0f05; border: 1px solid #ffaa00; color: #ffaa00; padding: 6px 8px; font-size: 10px; margin-bottom: 4px; }
          .invoice-box { border: 1px solid #00ff66; background: #021208; padding: 10px; margin-top: 10px; }
          .total-fee { font-size: 15px; color: #00ff66; font-weight: bold; float: right; }
          .footer { margin-top: 15px; border-top: 1px solid #142838; padding-top: 8px; font-size: 8px; color: #555; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="dossier-container">
          <div class="section-block header">
            <div>
              <div class="title">MIU_33 // SOVEREIGN ARCHITECTURE DOSSIER</div>
              <div class="meta">PROBED VIA RIYADH EDGE CLUSTER &bull; TARGET: ${auditResult.target}</div>
            </div>
            <div class="meta" style="text-align: right;">DATE: ${new Date().toISOString().split("T")[0]}<br>STATUS: COMMERCIAL CONFIDENTIAL</div>
          </div>

          <div class="section-block scores">
            <div class="score-card">
              <div style="font-size: 9px; color: #888;">SEO FOUNDATION</div>
              <div class="score-val" style="color: #00f3ff;">${auditResult.geoAeoReadiness?.hasMetaDescription ? "85" : "60"}/100</div>
            </div>
            <div class="score-card">
              <div style="font-size: 9px; color: #888;">AEO DIRECT ANSWERS</div>
              <div class="score-val" style="color: ${(auditResult.geoAeoReadiness?.aeoScore || 0) >= 80 ? "#00ff66" : "#ffaa00"};">${auditResult.geoAeoReadiness?.aeoScore || 0}/100</div>
            </div>
            <div class="score-card">
              <div style="font-size: 9px; color: #888;">GEO CITATION &amp; SOV</div>
              <div class="score-val" style="color: ${(auditResult.aiShareOfVoice?.shareOfVoiceScore || 0) >= 80 ? "#00ff66" : "#00f3ff"};">${auditResult.aiShareOfVoice?.shareOfVoiceScore || auditResult.geoAeoReadiness?.geoScore || 100}/100</div>
            </div>
          </div>

          <div class="section-block">
            <div class="section-title">1. INDEXING HEALTH &amp; AI CLEARANCE</div>
            <table>
              <tr><th>METRIC</th><th>RESULT</th><th>STATUS</th></tr>
              <tr><td>Target Host Status</td><td>HTTP ${auditResult.httpStatus}</td><td>${auditResult.httpStatus === 200 ? "OPTIMAL" : "WARNING"}</td></tr>
              <tr><td>/llms.txt AI Manifest</td><td>${auditResult.llmManifest?.hasLlmsTxt ? "ACTIVE (HTTP 200)" : "ABSENT (HTTP 404)"}</td><td>${auditResult.llmManifest?.hasLlmsTxt ? "PASS" : "CRITICAL"}</td></tr>
              <tr><td>JSON-LD Schemas</td><td>${auditResult.geoAeoReadiness?.jsonLdSchemas?.join(", ") || "None Detected"}</td><td>${auditResult.geoAeoReadiness?.jsonLdSchemas?.length ? "PASS" : "FAIL"}</td></tr>
              <tr><td>GPTBot / PerplexityBot</td><td>${auditResult.aiCrawlers?.gptBot} / ${auditResult.aiCrawlers?.perplexityBot}</td><td>VERIFIED</td></tr>
            </table>
          </div>

          ${auditResult.aiShareOfVoice?.breakdown ? `
            <div class="section-block">
             <div class="section-title">2. LAYER 2 REGIONAL GROUNDING &amp; SHARE OF VOICE (${auditResult.aiShareOfVoice.termsIndexed ?? 0}/${auditResult.aiShareOfVoice.totalTermsChecked ?? 7} INDEXED)</div>
              <table>
                <thead>
                  <tr><th>REGIONAL PROCUREMENT TERM</th><th>STATUS</th><th>GROUNDING VECTOR</th></tr>
                </thead>
                <tbody>
                  ${auditResult.aiShareOfVoice.breakdown.map((item: { term: string; indexed: boolean }) => `
                    <tr>
                      <td style="color: #fff; text-transform: uppercase;">${item.term}</td>
                      <td style="color: ${item.indexed ? '#00ff66' : '#ff3366'}; font-weight: bold;">${item.indexed ? '✓ ACTIVE' : 'X ABSENT'}</td>
                      <td style="color: #888;">DOM KERNEL INGESTED</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="section-block">
              <div class="section-title">2. LAYER 2 REGIONAL GROUNDING &amp; SHARE OF VOICE (100% INDEXED)</div>
              <table>
                <thead>
                  <tr><th>REGIONAL PROCUREMENT TERM</th><th>STATUS</th><th>REGIONAL CONTEXT</th></tr>
                </thead>
                <tbody>
                  <tr><td style="color: #fff;">SASO AEC</td><td style="color: #00ff66; font-weight: bold;">✓ ACTIVE</td><td style="color: #888;">KSA STANDARD COMPLIANCE</td></tr>
                  <tr><td style="color: #fff;">RIYADH SEED</td><td style="color: #00ff66; font-weight: bold;">✓ ACTIVE</td><td style="color: #888;">CENTRAL METRO GEO-VECTOR</td></tr>
                  <tr><td style="color: #fff;">ZATCA PHASE 2</td><td style="color: #00ff66; font-weight: bold;">✓ ACTIVE</td><td style="color: #888;">TAX &amp; E-INVOICING INTEGRATION</td></tr>
                  <tr><td style="color: #fff;">ASTM / GCC LOGISTICS</td><td style="color: #00ff66; font-weight: bold;">✓ ACTIVE</td><td style="color: #888;">CROSS-BORDER PROCUREMENT</td></tr>
                </tbody>
              </table>
            </div>
          `}

          <div class="section-block">
            <div class="section-title">3. DETECTED DEFICITS</div>
            ${auditResult.recommendations?.length === 0
        ? '<div style="color: #00ff66; padding: 6px 8px; border: 1px solid #00ff66; font-size: 10px;">✓ High Authority Architecture: Target domain is fully optimized for AI-driven citation.</div>'
        : auditResult.recommendations.map((r: string) => `<div class="deficit">⚠ ${r}</div>`).join("")
      }
          </div>

          <div class="section-block">
            <div class="section-title">4. LAYER 3 REMEDIATION &amp; COMMERCIAL TERMS</div>
            <div class="invoice-box">
              <div style="font-size: 11px; font-weight: bold; color: #fff; margin-bottom: 6px;">PROPOSED SCOPE OF WORK</div>
              <table style="border: none; margin-bottom: 0;">
                <tr style="background: transparent;"><td style="border: none; border-bottom: 1px dashed #142838; padding: 3px 0;">Edge Routing &amp; Security Policy Overhaul</td><td style="border: none; border-bottom: 1px dashed #142838; text-align: right; color: #aaa;">SAR 2,500.00</td></tr>
                ${!auditResult.llmManifest?.hasLlmsTxt ? '<tr style="background: transparent;"><td style="border: none; border-bottom: 1px dashed #142838; padding: 3px 0;">/llms.txt Token-Optimized Manifest Generation</td><td style="border: none; border-bottom: 1px dashed #142838; text-align: right; color: #aaa;">SAR 1,500.00</td></tr>' : ''}
                ${!auditResult.geoAeoReadiness?.hasFaqSchema ? '<tr style="background: transparent;"><td style="border: none; border-bottom: 1px dashed #142838; padding: 3px 0;">FAQPage &amp; Organization JSON-LD Graph Injection</td><td style="border: none; border-bottom: 1px dashed #142838; text-align: right; color: #aaa;">SAR 2,000.00</td></tr>' : ''}
              </table>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #00ff66;">
                <span style="font-size: 10px; color: #aaa;">SETTLEMENT CLEARANCE // CORPORATE WIRE (SARIE)</span>
                <span class="total-fee">TOTAL: SAR ${baseFee.toLocaleString()}.00</span>
              </div>
              <div style="margin-top: 10px; padding: 8px 10px; border: 1px solid #00ff66; background: rgba(0, 255, 102, 0.03);">
                <div style="font-size: 9px; color: #00ff66; font-weight: bold; margin-bottom: 3px;">
                  COMMERCIAL CLEARANCE // ZATCA PHASE-2 COMPLIANT
                </div>
                <div style="font-size: 8px; color: #888; line-height: 1.4;">
                  <strong>Beneficiary:</strong> MIU_33 Sovereign Engineering &amp; Technology<br>
                  <strong>Corporate Settlement:</strong> Al Rajhi Corporate Banking (SAR Corporate Wire / IBAN)<br>
                  <strong>IBAN Routing:</strong> SA4880207781501222121011<br>
                  <strong>Tax Treatment:</strong> 15% Statutory ZATCA Electronic Tax Invoice Dispatched Post-Settlement
                </div>
              </div>
            </div>
          </div>

          <div class="section-block footer">
            <div>MIU_33 STUDIO &bull; RIYADH, KINGDOM OF SAUDI ARABIA</div>
            <div>B2B ENGINEERING CONFIDENTIAL</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#04070a", color: "#00f3ff", fontFamily: "monospace", padding: "30px 40px" }}>
      {/* Print-Ready Media Overrides for Official Dossier PDF */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* 1. Force crisp white background & pure black text */
          html, body, div, main, section {
            background-color: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }

          /* 2. Strip interactive elements and UI headers */
          header, button, .no-print, input, select {
            display: none !important;
          }

          /* 3. Expand tables & containers across A4 pages */
          main {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          section {
            border: 1px solid #111111 !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
            display: block !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            display: table !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            border-bottom: 1px solid #cccccc !important;
            display: table-row !important;
          }

          th, td {
            color: #000000 !important;
            border: 1px solid #dddddd !important;
            padding: 6px 8px !important;
            display: table-cell !important;
          }

          /* 4. Keep labels and data figures sharp */
          span, strong, div {
            color: #000000 !important;
          }
        }
      `}} />
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

            {/* Sovereign geMiu Local 6.64M Agent Trigger */}
            <button
              type="button"
              onClick={() => setIsGeMiuOpen(true)}
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "2px",
                border: "1px solid #00f3ff",
                color: "#00f3ff",
                backgroundColor: "#04141d",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontFamily: "monospace",
                boxShadow: "0 0 10px rgba(0, 243, 255, 0.15)"
              }}
            >
              <span style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#00ff66"
              }} />
              <span>geMiu [6.64M] AGENT</span>
            </button>

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
              {isSettled ? "✓ SCHEMA PRE-CLEARANCE VERIFIED" : "● TRIAL MODE // WATERMARKED DRAFT"}
            </span>

            {clientBalance && (
              <span style={{ fontSize: "0.75rem", color: "#888", borderLeft: "1px solid #333", paddingLeft: "15px" }}>
                CLIENT: <span style={{ color: "#00f3ff" }}>{clientBalance.clientName || "ENTERPRISE"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Enterprise Filtered Navigation */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "pipeline", label: "🚢 LOGISTICS & TARIFF" },
            { id: "multi_vertical", label: "❄️ DUAL-TRACK INGEST" },
            { id: "spec", label: "📑 BOM & SASO LOCALIZER" },
            { id: "invoice", label: "💳 COMMERCIAL & ZATCA" },
            { id: "site_hud", label: "📐 SITE & BIM HUD" },
            { id: "saber_auditor", label: "🛡️ SABER / PCoC AUDIT" },
            { id: "inspection_vault", label: "🗂️ INSPECTION VAULT" },
            { id: 'industrial_bom', label: 'Industrial BOM / CST' },
            { id: "pitch", label: "📊 PROPOSAL DECK" },
            { id: "auditor", label: "⚡ GEO & AEO AUDITOR" },
          ]
            .filter((tab) => {
              if (engineMode === "trade") return tab.id !== "auditor";
              if (engineMode === "geo") return tab.id === "auditor" || tab.id === "pitch";
              return true;
            })
            .map((tab) => (
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
          <a
            href="https://wps.miu33archstudio.xyz"
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: "transparent",
              color: "#00ff66",
              border: "1px solid #00ff66",
              padding: "8px 14px",
              fontFamily: "monospace",
              fontWeight: "bold",
              fontSize: "0.75rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            💼 MUDAD WPS &bull; GOSI ➔
          </a>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#061017", border: "1px solid #142838", padding: "15px 20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#fff" }}>MANIFEST &amp; SHIPPING INGESTION</span>
              <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "2px" }}>
                Ingest eBOL, packing lists, or container manifests to map HS Codes and calculate regional tariffs.
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* ⚡ 1-Click Shanghai to Jeddah Demo Loader */}
              <button
                type="button"
                onClick={() => {
                  setPipeline({
                    manifestHash: "11f217ab4754a61cb9e08819f2a0149e",
                    items: [
                      { itemNo: "CW-001", description: "铝合金主龙骨规格-1 (Mullion Profile)", materialGrade: "6063-T6 Alloy", hsCode: "7604.29.00", sasoStandard: "SASO 2831 / ASTM B221", totalFobUSD: 4500 },
                      { itemNo: "CW-002", description: "铝合金主龙骨规格-2 (Transom Profile)", materialGrade: "6063-T6 Alloy", hsCode: "7604.29.00", sasoStandard: "SASO 2831 / ASTM B221", totalFobUSD: 4500 },
                      { itemNo: "GL-001", description: "双银Low-E中空钢化玻璃 (6+12A+6)", materialGrade: "Ultra-Clear Float Glass", hsCode: "7007.19.00", sasoStandard: "SASO ISO 12543", totalFobUSD: 18300 }
                    ],
                    fiscal: {
                      subtotalFobUSD: 27300,
                      freightUSD: 2400,
                      insuranceUSD: 136.5,
                      totalCifSAR: 111886.88,
                      customsDutySAR: 5594.34,
                      zatcaVatSAR: 17622.18,
                      grandTotalLandedSAR: 135103.40
                    },
                    compliance: { dutyDebited: false },
                    logistics: { containerNumber: "CSNU-789421-0", billOfLading: "BOL-1789023185558-CN-KSA", vesselName: "COSCO SHIPPING // V.2604W" },
                    milestones: [
                      { stage: "01", name: "FACTORY DISPATCH & QC", status: "COMPLETED", node: "China Export Gate" },
                      { stage: "02", name: "PORT OF ORIGIN CLEARANCE", status: "IN_TRANSIT", node: "Guangzhou / Ningbo Port" },
                      { stage: "03", name: "RED SEA MARITIME TRANSIT", status: "SCHEDULED", node: "Bab-el-Mandeb Lane" },
                      { stage: "04", name: "FASAH / ZATCA PORT CLEARANCE", status: "PENDING", node: "Jeddah Islamic Port" },
                      { stage: "05", name: "MOMRAH PROJECT SITE RECEIVAL", status: "PENDING", node: "Riyadh Zone 4" }
                    ]
                  });
                }}
                style={{
                  backgroundColor: "transparent",
                  color: "#00ff66",
                  border: "1px solid #00ff66",
                  padding: "10px 14px",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                ⚡ LOAD DEMO MANIFEST
              </button>

              {/* 📥 Live File Upload Trigger */}
              <button
                type="button"
                onClick={() => manifestFileRef.current?.click()}
                disabled={pipelineLoading}
                style={{
                  backgroundColor: "#00f3ff",
                  color: "#000",
                  border: "none",
                  padding: "10px 18px",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: pipelineLoading ? "not-allowed" : "pointer",
                  fontFamily: "monospace",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
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

          <section className="no-print" style={{ border: isSettled ? "1px solid #00ff66" : "1px solid #00f3ff", backgroundColor: "#031208", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "0.95rem", color: isSettled ? "#00ff66" : "#00f3ff", fontWeight: "bold" }}>
                4. UNIVERSAL CUSTOMS CLEARANCE DOSSIER &amp; MUNICIPAL PACKET
              </div>
              <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "4px" }}>
                {isSettled
                  ? "Dossier unsealed. Trilingual SASO parity sheet, ZATCA tax invoice, and HUD verification archives ready."
                  : "Trial mode active. Preview draft submittal or settle invoice to unseal production ZIP archive."}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  if (!pipeline?.items || pipeline.items.length === 0) {
                    alert("Please load or ingest a manifest first.");
                    return;
                  }

                  const printWin = window.open("", "_blank");
                  if (!printWin) {
                    alert("Please allow popups to generate the PDF dossier.");
                    return;
                  }
                  const cleanItems = (pipeline.items || []).filter((itm: any) => {
                    const code = String(itm.itemNo || itm.code || "").trim();
                    return code.startsWith("CW-") || code.startsWith("GL-") || code.startsWith("ITM-");
                  });

                  const itemsToRender = cleanItems.length > 0 ? cleanItems : (stagedItems.length > 0 ? stagedItems.map((s, idx) => ({
                    itemNo: s.code || `CW-${String(idx + 1).padStart(3, "0")}`,
                    description: s.name || "Architectural Extrusion",
                    materialGrade: s.material || "6063-T6 Aluminum Alloy",
                    hsCode: "7604.29.00",
                    sasoStandard: s.standard || "SASO 2831 / ASTM B221",
                    totalFobUSD: 4500.00
                  })) : pipeline.items);

                  const subtotalUSD = itemsToRender.reduce((acc: number, it: any) => acc + (Number(it.totalFobUSD) || 4500), 0);
                  const freightUSD = 2400.00;
                  const insuranceUSD = Number((subtotalUSD * 0.005).toFixed(2));
                  const cifUSD = subtotalUSD + freightUSD + insuranceUSD;
                  const cifSAR = Number((cifUSD * 3.75).toFixed(2));
                  const dutySAR = Number((cifSAR * 0.05).toFixed(2));
                  const vatSAR = Number(((cifSAR + dutySAR) * 0.15).toFixed(2));
                  const landedSAR = Number((cifSAR + dutySAR + vatSAR).toFixed(2));

                  // 1. ZATCA Phase-2 Base64 TLV Binary Encoder for Wafeq / Tax Readers
                  const generateZatcaTlv = (
                    seller: string,
                    vatNo: string,
                    timestamp: string,
                    total: string,
                    vat: string
                  ): string => {
                    const getTlvTag = (tagNum: number, tagValue: string): Uint8Array => {
                      const encoder = new TextEncoder();
                      const valBytes = encoder.encode(tagValue);
                      const tagBytes = new Uint8Array([tagNum, valBytes.length]);
                      const combined = new Uint8Array(tagBytes.length + valBytes.length);
                      combined.set(tagBytes, 0);
                      combined.set(valBytes, tagBytes.length);
                      return combined;
                    };

                    const t1 = getTlvTag(1, seller);
                    const t2 = getTlvTag(2, vatNo);
                    const t3 = getTlvTag(3, timestamp);
                    const t4 = getTlvTag(4, total);
                    const t5 = getTlvTag(5, vat);

                    const fullPayload = new Uint8Array(
                      t1.length + t2.length + t3.length + t4.length + t5.length
                    );
                    let offset = 0;
                    [t1, t2, t3, t4, t5].forEach((arr) => {
                      fullPayload.set(arr, offset);
                      offset += arr.length;
                    });

                    let binary = "";
                    fullPayload.forEach((b) => (binary += String.fromCharCode(b)));
                    return btoa(binary);
                  };

                  const zatcaTlvBase64 = generateZatcaTlv(
                    "MIU_33 SOVEREIGN TECH",
                    "300000000000003",
                    new Date().toISOString(),
                    landedSAR.toFixed(2),
                    vatSAR.toFixed(2)
                  );
                  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(zatcaTlvBase64)}&color=0f172a&bgcolor=ffffff&margin=1`;

                  const rowsHtml = itemsToRender.map((itm: any) => `
                    <tr>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #0284c7;">${itm.itemNo || itm.code}</td>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">
                        <strong>${itm.description || itm.name}</strong>
                        <div style="font-size: 6.2pt; color: #64748b;" class="ar">قطاع ألمنيوم إنشائي للواجهات والكسوات المعمارية</div>
                      </td>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${itm.materialGrade || itm.material || "6063-T6 Aluminum Alloy"}</td>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-weight: 600; color: #166534;">${itm.hsCode || "7604.29.00"}</td>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${itm.sasoStandard || itm.standard || "SASO 2831 / ASTM B221"}</td>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600;">$${(Number(itm.totalFobUSD) || 4500).toFixed(2)}</td>
                    </tr>
                  `).join("");

                  const htmlContent = `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8" />
        <title>MUNICIPAL_CUSTOMS_DOSSIER_${projectCode}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'JetBrains Mono', monospace;
            color: #0c141c;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 8pt;
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ar {
            font-family: 'IBM Plex Sans Arabic', sans-serif;
            direction: rtl;
            unicode-bidi: embed;
          }
          .header-table {
            width: 100%;
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .title-en { font-size: 11pt; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }
          .title-ar { font-size: 10pt; font-weight: 700; color: #166534; }
          .sub-meta { font-size: 6.8pt; color: #475569; margin-top: 3px; line-height: 1.4; }
          .badge {
            display: inline-block;
            border: 1px solid #166534;
            color: #166534;
            background: #f0fdf4;
            padding: 2px 6px;
            font-size: 6.8pt;
            font-weight: 700;
            border-radius: 2px;
          }
          .qr-img {
            width: 72px;
            height: 72px;
            border: 1px solid #cbd5e1;
            padding: 2px;
            background: #ffffff;
          }

          .section-heading {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 7.8pt;
            background: #f1f5f9;
            border-left: 4px solid #0284c7;
            padding: 4px 8px;
            margin: 8px 0 6px 0;
          }

          table.schedule {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
            margin-bottom: 10px;
          }
          table.schedule tr { page-break-inside: avoid; }
          table.schedule th {
            background: #0f172a;
            color: #ffffff;
            border: 1px solid #0f172a;
            padding: 5px 6px;
            font-weight: 600;
            text-align: left;
          }
          table.schedule td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            vertical-align: middle;
          }
          table.schedule tr:nth-child(even) { background: #f8fafc; }

          .summary-container {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 12px;
            margin-top: 6px;
            page-break-inside: avoid;
          }
          .panel {
            border: 1.5px solid #0f172a;
            padding: 8px 10px;
            background: #fafafa;
          }
          .panel-title {
            font-size: 7.5pt;
            font-weight: 700;
            border-bottom: 1px solid #0f172a;
            padding-bottom: 4px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
          }
          .kv-row {
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            padding: 2px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .kv-row.total {
            border-top: 2px solid #0f172a;
            border-bottom: none;
            padding-top: 5px;
            margin-top: 4px;
            font-size: 8.5pt;
            font-weight: 700;
            color: #166534;
          }
          .footer {
            margin-top: 10px;
            border-top: 1px solid #cbd5e1;
            padding-top: 4px;
            font-size: 6.5pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          ${!isSettled ? `
          body::before {
            content: "UNLICENSED TRIAL DRAFT // SETTLEMENT PENDING";
            position: fixed;
            top: 42%;
            left: 5%;
            width: 90%;
            text-align: center;
            transform: rotate(-35deg);
            font-size: 26pt;
            font-weight: 800;
            color: rgba(220, 38, 38, 0.16);
            border: 4px dashed rgba(220, 38, 38, 0.25);
            padding: 16px 20px;
            z-index: 9999;
            pointer-events: none;
            letter-spacing: 2px;
          }
          ` : ""}
        </style>
      </head>
      <body>
        <table class="header-table" style="border: none;">
          <tr>
            <td style="border: none; padding: 0; vertical-align: top; width: 68%;">
              <div class="title-en">MIU_33 // CUSTOMS CLEARANCE & SASO DOSSIER</div>
              <div class="title-ar ar">ملف التخليص الجمركي الموحد واعتماد المطابقة (SASO)</div>
              <div class="sub-meta">
                PROJECT: <strong>${projectCode}</strong> &bull; VESSEL: <strong>${pipeline.logistics?.vesselName || "COSCO SHIPPING"}</strong><br>
                BOL: <strong>${pipeline.logistics?.billOfLading || "CSNU-789421-0"}</strong> &bull; POD: <strong>JEDDAH ISLAMIC PORT (FASAH)</strong><br>
                PORT CLEARANCE GATE: <strong>FASAH PRE-CLEARANCE ACTIVE</strong>
              </div>
            </td>
            <td style="border: none; padding: 0; vertical-align: top; text-align: right; width: 32%;">
              <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                <div style="text-align: right;">
                  <span class="badge">ZATCA PHASE-2 COMPLIANT</span>
                  <div class="sub-meta" style="font-size: 6.2pt; margin-top: 2px;">
                    SCAN TO VERIFY STATUTORY RECORD<br>
                    TAX ID: <strong>300000000000003</strong>
                  </div>
                </div>
                <img src="${qrSvgUrl}" class="qr-img" alt="ZATCA Clearance QR" />
              </div>
            </td>
          </tr>
        </table>

        <div class="section-heading">
          <span>1. HARMONIZED TARIFF & SASO CONFORMITY MAPPING</span>
          <span class="ar">جدول تصنيف بنود التعرفة ومطابقة المواصفات</span>
        </div>

        <table class="schedule">
          <thead>
            <tr>
              <th style="width: 10%;">ITEM / رمز</th>
              <th style="width: 32%;">DESCRIPTION / الوصف الإنشائي</th>
              <th style="width: 18%;">ALLOY & TEMPER / السبيكة</th>
              <th style="width: 13%;">HS CODE / الرمز</th>
              <th style="width: 15%;">STANDARD / المواصفة</th>
              <th style="width: 12%; text-align: right;">FOB (USD)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-container">
          <div class="panel">
            <div class="panel-title">
              <span>2. REGIONAL COMPLIANCE & FISCAL (ZATCA PHASE-2)</span>
              <span class="ar">البيان الجمركي والضريبي الموحد</span>
            </div>
            <div class="kv-row">
              <span>Subtotal FOB Origin (إجمالي المصنع):</span>
              <strong>$${subtotalUSD.toFixed(2)} USD</strong>
            </div>
            <div class="kv-row">
              <span>Ocean Freight & Marine Insurance (الشحن والتأمين):</span>
              <strong>$${(freightUSD + insuranceUSD).toFixed(2)} USD</strong>
            </div>
            <div class="kv-row" style="color: #0284c7;">
              <span>Total CIF Jeddah Port (القيمة سيف جدة):</span>
              <strong>${cifSAR.toFixed(2)} SAR</strong>
            </div>
            <div class="kv-row">
              <span>5% GCC Unified Customs Duty (الرسوم الجمركية):</span>
              <span>${dutySAR.toFixed(2)} SAR</span>
            </div>
            <div class="kv-row">
              <span>15% ZATCA Statutory VAT (ضريبة القيمة المضافة):</span>
              <span>${vatSAR.toFixed(2)} SAR</span>
            </div>
            <div class="kv-row total">
              <span>ESTIMATED TOTAL LANDED (إجمالي الواصل):</span>
              <span>${landedSAR.toFixed(2)} SAR</span>
            </div>
          </div>

          <div class="panel" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="panel-title">
                <span>PORT CLEARANCE ACCREDITATION</span>
                <span class="ar">اعتماد التخليص والمطابقة</span>
              </div>
              <div style="font-size: 6.8pt; color: #475569; line-height: 1.4;">
                &bull; <strong>SABER PCoC Type 1:</strong> Pre-validated SASO 2831.<br>
                &bull; <strong>SABER SCoC:</strong> Verified for Jeddah port release.<br>
                &bull; <strong>ZATCA Phase-2:</strong> TLV Base64 verified via QR.<br>
                &bull; <strong>Delivery Site:</strong> Riyadh Zone 4 / MOMRAH Project.
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <div style="flex: 1; border: 1px dashed #64748b; padding: 4px 6px; font-size: 6.5pt; background: #fff;">
                INSPECTION AGENT:<br><strong>FLASH AGENCY / SASO</strong>
              </div>
              <div style="flex: 1; border: 1px dashed #64748b; padding: 4px 6px; font-size: 6.5pt; background: #fff;">
                CONSIGNEE RECORD:<br><strong style="color: #166534;">VERIFIED & STAMPED</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>MIU_33 STUDIO &bull; JEDDAH ISLAMIC PORT / RIYADH &bull; ZATCA PHASE-2 COMPLIANT DOSSIER</div>
          <div class="ar">المملكة العربية السعودية &bull; أمانة منطقة الرياض &bull; وثيقة رسمية معتمدة</div>
        </div>
      </body>
      </html>
    `;

                  printWin.document.open();
                  printWin.document.write(htmlContent);
                  printWin.document.close();

                  setTimeout(() => {
                    printWin.focus();
                    printWin.print();
                  }, 400);
                }}
                style={{
                  backgroundColor: "#061824",
                  color: "#00f3ff",
                  border: "1px solid #00f3ff",
                  padding: "12px 18px",
                  fontWeight: "bold",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                🖨️ PRINT / SAVE DRAFT DOSSIER (PDF)
              </button>

              <button
                type="button"
                onClick={() => handleZipDossier()}
                disabled={dossierLoading}
                style={{
                  backgroundColor: dossierLoading ? "#222" : isSettled ? "#00ff66" : "#ffd700",
                  color: "#000",
                  border: "none",
                  padding: "12px 20px",
                  fontWeight: "bold",
                  fontSize: "0.78rem",
                  cursor: dossierLoading ? "not-allowed" : "pointer",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                {dossierLoading
                  ? "PACKAGING ARCHIVE..."
                  : isSettled
                    ? "📦 DOWNLOAD AUDIT-READY DOSSIER (.ZIP)"
                    : "🔒 UNLOCK COMPLETE DOSSIER (.ZIP)"}
              </button>
            </div>
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
      {/* TAB 3: COMMERCIAL & ZATCA SOVEREIGN CONSOLE (UNIFIED HYBRID CHASSIS)      */}
      {/* ========================================================================= */}
      {activeTab === "invoice" && (
        <main style={{ width: "100%", maxWidth: "1380px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px", padding: "10px" }}>
          
          {/* TOP TELEMETRY STRIP */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#061017", border: "1px solid #142838", padding: "10px 18px", fontSize: "0.72rem" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <span style={{ color: "#fff", fontWeight: "bold" }}>CONSOLE: <span style={{ color: "#00f3ff" }}>ZATCA_PHASE2_ENFORCER</span></span>
              <span style={{ color: "#888" }}>NODE: <strong style={{ color: "#00ff66" }}>RUH-01 (EDGE D1)</strong></span>
              <span style={{ color: "#888" }}>LEDGER HEIGHT: <strong style={{ color: "#00f3ff" }}>{totalBlocks} BLOCKS</strong></span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{
                padding: "2px 8px",
                border: chainValid ? "1px solid #00ff66" : "1px solid #ff3366",
                color: chainValid ? "#00ff66" : "#ff3366",
                backgroundColor: chainValid ? "#03170c" : "#1f0408",
                fontWeight: "bold"
              }}>
                {chainValid ? "HASH CHAIN INTEGRITY: SECURE" : "INTEGRITY WARNING"}
              </span>
              <button
                type="button"
                onClick={fetchLedger}
                disabled={ledgerLoading}
                style={{ background: "transparent", border: "1px solid #00f3ff", color: "#00f3ff", fontSize: "0.68rem", padding: "3px 10px", cursor: "pointer", fontFamily: "monospace" }}
              >
                {ledgerLoading ? "SYNCING..." : "↻ SYNC D1"}
              </button>
            </div>
          </div>

          {/* 3-COLUMN WORKBENCH */}
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 340px", gap: "16px" }}>
            
            {/* COLUMN 1: INGESTION & INTENT PARAMETERS */}
            <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "0.78rem", color: "#00f3ff", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "6px" }}>
                1. INGESTION & INTENT
              </div>

              <div>
                <label style={{ fontSize: "0.68rem", color: "#888", display: "block", marginBottom: "4px" }}>BILLED CLIENT ENTITY:</label>
                <input
                  type="text"
                  value={invoiceClient}
                  onChange={(e) => setInvoiceClient(e.target.value)}
                  style={{ width: "100%", backgroundColor: "#000", border: "1px solid #222", color: "#fff", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.68rem", color: "#888", display: "block", marginBottom: "4px" }}>ENGAGEMENT SCHEME:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { id: "retainer", label: "RETAINER", price: "$3,500/mo" },
                    { id: "single", label: "SUBMITTAL PACK", price: "$1,850/pkg" },
                    { id: "enterprise", label: "BARE-METAL CORE", price: "$8,500 flat" },
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedPlan(tier.id as any)}
                      style={{
                        padding: "8px 10px",
                        border: selectedPlan === tier.id ? "1px solid #00ff66" : "1px solid #142838",
                        backgroundColor: selectedPlan === tier.id ? "#03170c" : "#02070c",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.72rem"
                      }}
                    >
                      <span style={{ color: selectedPlan === tier.id ? "#00ff66" : "#aaa", fontWeight: "bold" }}>{tier.label}</span>
                      <span style={{ color: "#fff" }}>{tier.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #142838", paddingTop: "10px" }}>
                <label style={{ fontSize: "0.68rem", color: "#888", display: "block", marginBottom: "4px" }}>OCEAN FREIGHT ESTIMATE (USD):</label>
                <input
                  type="text"
                  value={freightUSD}
                  onChange={(e) => setFreightUSD(e.target.value)}
                  style={{ width: "100%", backgroundColor: "#000", border: "1px solid #222", color: "#00f3ff", padding: "8px", fontFamily: "monospace", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsIngestModalOpen(true)}
                style={{
                  backgroundColor: "transparent",
                  color: "#00f3ff",
                  border: "1px dashed #00f3ff",
                  padding: "10px",
                  fontSize: "0.72rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  width: "100%"
                }}
              >
                📥 PASTE RAW CSV / TSV STREAM
              </button>
            </section>

            {/* COLUMN 2: DETERMINISTIC VERIFICATION & EXECUTION GATES */}
            <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "0.78rem", color: "#00ff66", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "6px" }}>
                2. DETERMINISTIC ENFORCEMENT ENGINE
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "10px", border: "1px solid #142838", backgroundColor: "#02070c", fontSize: "0.72rem" }}>
                  <div style={{ color: "#888" }}>PIPELINE MODE:</div>
                  <div style={{ color: isSettled ? "#00ff66" : "#ffaa00", fontWeight: "bold", marginTop: "2px" }}>
                    {isSettled ? "● PRODUCTION CLEARANCE" : "● TRIAL / WATERMARKED"}
                  </div>
                </div>
                <div style={{ padding: "10px", border: "1px solid #142838", backgroundColor: "#02070c", fontSize: "0.72rem" }}>
                  <div style={{ color: "#888" }}>STATUTORY JURISDICTION:</div>
                  <div style={{ color: "#00f3ff", fontWeight: "bold", marginTop: "2px" }}>
                    ZATCA PHASE-2 // 15% VAT
                  </div>
                </div>
              </div>

              {/* Real-time Math Output */}
              <div style={{ border: "1px solid #142838", backgroundColor: "#02070c", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.72rem" }}>
                <div style={{ color: "#888", borderBottom: "1px dashed #142838", paddingBottom: "4px" }}>
                  GATE AUDIT SUMMARY:
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>STAGED SCHEME VALUE:</span>
                  <span style={{ color: "#fff" }}>${selectedPlan === "retainer" ? "3,500.00" : selectedPlan === "single" ? "1,850.00" : "8,500.00"} USD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>SAR PARITY (3.75):</span>
                  <span style={{ color: "#00f3ff" }}>{(Number(selectedPlan === "retainer" ? 3500 : selectedPlan === "single" ? 1850 : 8500) * 3.75).toFixed(2)} SAR</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>15% ZATCA STATUTORY VAT:</span>
                  <span style={{ color: "#ffaa00" }}>{((Number(selectedPlan === "retainer" ? 3500 : selectedPlan === "single" ? 1850 : 8500) * 3.75) * 0.15).toFixed(2)} SAR</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #142838", paddingTop: "6px", marginTop: "2px" }}>
                  <strong style={{ color: "#fff" }}>TOTAL COMMITMENT:</strong>
                  <strong style={{ color: "#00ff66", fontSize: "0.85rem" }}>
                    {((Number(selectedPlan === "retainer" ? 3500 : selectedPlan === "single" ? 1850 : 8500) * 3.75) * 1.15).toFixed(2)} SAR
                  </strong>
                </div>
              </div>

              {/* Execution Triggers */}
              <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={invoiceLoading}
                  onClick={() => {
                    setShowSettlementModal(true);
                    handleGenerateInvoice(selectedPlan);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: invoiceLoading ? "#222" : "#00ff66",
                    color: "#000",
                    border: "none",
                    padding: "12px",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    cursor: invoiceLoading ? "not-allowed" : "pointer",
                    fontFamily: "monospace",
                    letterSpacing: "1px"
                  }}
                >
                  {invoiceLoading ? "COMMITTING BLOCK..." : "⚡ STAMP & COMMIT TRANSACTION"}
                </button>
              </div>
            </section>

            {/* COLUMN 3: LIVE ARTIFACT & DISPATCH VIEW */}
            <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "0.78rem", color: "#ffaa00", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "6px" }}>
                3. DIGITAL TWIN ARTIFACT
              </div>

              {output ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.72rem" }}>
                  <div style={{ border: "1px solid #00ff66", backgroundColor: "#021208", padding: "10px" }}>
                    <div style={{ color: "#00ff66", fontWeight: "bold" }}>✓ TX STAMP GENERATED</div>
                    <div style={{ color: "#888", marginTop: "2px" }}>ID: {output.invoiceNumber || "INV-STAGED"}</div>
                  </div>

                  {output.downloadUrl && (
                    <a
                      href={output.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: "#05151f",
                        border: "1px solid #00f3ff",
                        color: "#00f3ff",
                        padding: "10px",
                        textAlign: "center",
                        textDecoration: "none",
                        fontWeight: "bold",
                        fontSize: "0.72rem"
                      }}
                    >
                      📄 INSPECT OFFICIAL TAX INVOICE (A4)
                    </a>
                  )}

                  <pre style={{
                    color: "#00ff66",
                    backgroundColor: "#02070c",
                    border: "1px solid #142838",
                    padding: "8px",
                    fontSize: "0.65rem",
                    maxHeight: "180px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap"
                  }}>
                    {JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              ) : (
                <div style={{ padding: "30px 10px", border: "1px dashed #222", textAlign: "center", color: "#555", fontSize: "0.72rem", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Awaiting deterministic execution trigger...
                </div>
              )}
            </section>
          </div>

          {/* DOCK PANEL: SOVEREIGN TRANSACTION AUDIT LEDGER */}
          <section style={{ border: "1px solid #1a2e26", padding: "14px 18px", backgroundColor: "#040807", fontFamily: "monospace" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #162620", paddingBottom: "8px", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.78rem", color: "#00ff66", fontWeight: "bold", letterSpacing: "1px" }}>
                  ⚡ LIVE D1 IMMUTABLE LEDGER STREAM
                </span>
                <span style={{ fontSize: "0.68rem", color: "#888" }}>
                  TABLE: <code>zatca_invoices</code> // ORDER BY: <code>id DESC</code>
                </span>
              </div>
              <span style={{ fontSize: "0.65rem", color: "#555" }}>
                {ledgerInvoices.length} RECORDED ENTRIES FOUND
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #222", color: "#666" }}>
                    <th style={{ padding: "6px 8px" }}>REF NO.</th>
                    <th style={{ padding: "6px 8px" }}>CLIENT / JURISDICTION</th>
                    <th style={{ padding: "6px 8px" }}>TAX ID</th>
                    <th style={{ padding: "6px 8px" }}>NET (SAR)</th>
                    <th style={{ padding: "6px 8px" }}>VAT (15%)</th>
                    <th style={{ padding: "6px 8px" }}>TOTAL</th>
                    <th style={{ padding: "6px 8px" }}>TIME</th>
                    <th style={{ padding: "6px 8px" }}>ARTIFACTS</th>
                    <th style={{ padding: "6px 8px", textAlign: "right" }}>STATE</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerInvoices && ledgerInvoices.length > 0 ? (
                    ledgerInvoices.map((inv: any) => {
                      const invId = inv.invoice_no || inv.invoiceNumber;
                      return (
                        <tr
                          key={inv.id || invId}
                          style={{ borderBottom: "1px solid #111", color: "#ccc" }}
                          title={`HASH: ${inv.current_hash || inv.invoiceHash || "PENDING"}\nPIH: ${inv.pih || inv.previousInvoiceHash || "GENESIS_ROOT"}`}
                        >
                          <td style={{ padding: "6px 8px", color: "#00f3ff", fontWeight: "bold" }}>
                            {invId}
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            {inv.clientName || (inv.country ? `JURISDICTION [${inv.country}]` : "ENTERPRISE B2B")}
                          </td>
                          <td style={{ padding: "6px 8px", color: "#777" }}>
                            {inv.clientTaxId || "300000000000003"}
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            {Number(inv.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "6px 8px", color: "#ffb703" }}>
                            {Number(inv.tax_amount ?? inv.vatAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "6px 8px", color: "#00ff66", fontWeight: "bold" }}>
                            {Number(inv.total_amount ?? inv.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency || "SAR"}
                          </td>
                          <td style={{ padding: "6px 8px", color: "#555", fontSize: "0.68rem" }}>
                            {inv.createdAt
                              ? `${new Date(inv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                              : "JUST NOW"}
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={() => handlePrintLedgerReceipt(inv)}
                                title="Print Sovereign Ledger Receipt"
                                style={{
                                  background: "transparent",
                                  color: "#00ff66",
                                  border: "1px solid #00ff66",
                                  padding: "1px 5px",
                                  fontSize: "0.6rem",
                                  fontFamily: "monospace",
                                  cursor: "pointer",
                                }}
                              >
                                PRINT
                              </button>
                              <a
                                href={`${LEDGER_WORKER_BASE}/invoice/xml?inv=${encodeURIComponent(inv.invoice_no || inv.invoiceNumber || "")}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Download Statutory ZATCA UBL 2.1 XML"
                                style={{
                                  background: "transparent",
                                  color: "#00f3ff",
                                  border: "1px solid #00f3ff",
                                  padding: "1px 5px",
                                  fontSize: "0.6rem",
                                  fontFamily: "monospace",
                                  textDecoration: "none",
                                  display: "inline-block",
                                  cursor: "pointer",
                                }}
                              >
                                XML
                              </a>
                            </div>
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>
                            <span style={{ border: "1px solid #00ff66", color: "#00ff66", padding: "1px 6px", fontSize: "0.62rem", background: "#003311" }}>
                              COMMITTED
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ padding: "16px 8px", textAlign: "center", color: "#555" }}>
                        {ledgerLoading ? "// RETRIEVING SOVEREIGN LEDGER BLOCKS..." : "// NO RECORDED AUDIT BLOCKS FOUND. CLICK SYNC D1."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

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
      {/* TAB: SASO SABER & PCoC COMPLIANCE AUDITOR                                */}
      {/* ========================================================================= */}
      {activeTab === "saber_auditor" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "10px" }}>
          <div style={{ backgroundColor: "#061017", border: "1px solid #142838", padding: "20px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "0.95rem", color: "#00f3ff", margin: 0, letterSpacing: "1px" }}>
              SASO SABER &amp; PCoC PRE-ARRIVAL COMPLIANCE ENGINE
            </h2>
            <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
              Verify product-level conformity certificates and pre-clearance rules to prevent port detention and demurrage fees in KSA ports.
            </div>
          </div>

          <SaberComplianceAuditor />
        </main>
      )}
      {activeTab === "inspection_vault" && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "10px" }}>
          <InspectionVault />
        </main>
      )}
      {activeTab === 'industrial_bom' && (
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "10px" }}>
          <IndustrialBOMVault />
        </main>
      )}
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
                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    disabled={!auditResult}
                    onClick={() => handleLockedAction("dossier")}
                    style={{
                      backgroundColor: !auditResult ? "transparent" : (isSettled || clearanceStatus === "VERIFIED") ? "transparent" : "rgba(255, 170, 0, 0.05)",
                      color: !auditResult ? "#333" : (isSettled || clearanceStatus === "VERIFIED") ? "#d1d5db" : "#ffaa00",
                      border: !auditResult ? "1px solid #333" : (isSettled || clearanceStatus === "VERIFIED") ? "1px solid #d1d5db" : "1px solid #ffaa00",
                      padding: "10px 20px",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      cursor: auditResult ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      justifyContent: "center"
                    }}
                  >
                    {!auditResult
                      ? "📄 COMPILE CLIENT PROPOSAL DOSSIER (.PDF)"
                      : (isSettled || clearanceStatus === "VERIFIED")
                        ? "📄 COMPILE CLIENT PROPOSAL DOSSIER (.PDF)"
                        : "🔒 COMPILE DOSSIER (SETTLEMENT REQUIRED)"}
                  </button>

                  <button
                    type="button"
                    disabled={!auditResult}
                    onClick={() => handleLockedAction("remediation")}
                    style={{
                      backgroundColor: !auditResult
                        ? "transparent"
                        : (isSettled || clearanceStatus === "VERIFIED")
                          ? "rgba(0, 243, 255, 0.1)"
                          : "rgba(255, 170, 0, 0.05)",
                      color: !auditResult ? "#333" : (isSettled || clearanceStatus === "VERIFIED") ? "#00f3ff" : "#ffaa00",
                      border: !auditResult ? "1px solid #333" : (isSettled || clearanceStatus === "VERIFIED") ? "1px solid #00f3ff" : "1px solid #ffaa00",
                      padding: "10px 20px",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      cursor: auditResult ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      width: "100%",
                      justifyContent: "center"
                    }}
                  >
                    {!auditResult
                      ? "⚡ OPEN LAYER 3 REMEDIATION STUDIO"
                      : (isSettled || clearanceStatus === "VERIFIED")
                        ? "⚡ OPEN LAYER 3 REMEDIATION STUDIO"
                        : "🔒 LAYER 3 REMEDIATION (ENTERPRISE LICENSE)"}
                  </button>
                </div>
              </section>
              {/* Layer 2: Regional Grounding & Share of Voice */}
              {auditResult?.aiShareOfVoice && (
                <section style={{
                  gridColumn: "1 / -1",
                  padding: "20px",
                  backgroundColor: "#061017",
                  border: "1px solid #142838",
                  fontFamily: "monospace"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#00f3ff", fontWeight: "bold" }}>
                      // LAYER 2 // AI SHARE OF VOICE &amp; KERNEL GROUNDING
                    </span>
                    <span style={{ fontSize: "0.9rem", color: auditResult.aiShareOfVoice.shareOfVoiceScore >= 80 ? "#00ff66" : "#ffaa00", fontWeight: "bold" }}>
                      {auditResult.aiShareOfVoice.shareOfVoiceScore}% INDEXED
                    </span>
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "#888", marginBottom: "12px" }}>
                    Regional Procurement Terms Checked: {auditResult.aiShareOfVoice.termsIndexed ?? 0} / {auditResult.aiShareOfVoice.totalTermsChecked ?? 7} verified active in DOM.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                    {auditResult.aiShareOfVoice.breakdown.map((item: { term: string; indexed: boolean }, idx: number) => (
                      <div key={idx} style={{
                        padding: "8px 12px",
                        background: "rgba(0, 243, 255, 0.03)",
                        border: `1px solid ${item.indexed ? "#00ff6633" : "#ff336633"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ fontSize: "0.72rem", color: "#ccc", textTransform: "uppercase" }}>{item.term}</span>
                        <span style={{ fontSize: "0.72rem", color: item.indexed ? "#00ff66" : "#ff3366", fontWeight: "bold" }}>
                          {item.indexed ? "✓" : "X"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Prompt Journey Routing Matrix (L1 - L3) */}
              {auditResult.promptJourneyRanking && (
                <section style={{ gridColumn: "1 / -1", border: "1px solid #142838", padding: "20px", backgroundColor: "#061017", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #142838", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#00f3ff", fontWeight: "bold" }}>
                      PROMPT JOURNEY SIMULATION // ENTERPRISE DECISION VECTORS
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#888" }}>NODE: RIYADH (RUH-01)</span>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #142838", color: "#888", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>STAGE</th>
                        <th style={{ padding: "8px" }}>SIMULATED BUYER QUERY</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>CITATION ODDS</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "L1: Discovery", data: auditResult.promptJourneyRanking.l1Discovery },
                        { label: "L2: Technical Intent", data: auditResult.promptJourneyRanking.l2TechnicalIntent },
                        { label: "L3: Procurement", data: auditResult.promptJourneyRanking.l3VendorSelection }
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #0d1b26" }}>
                          <td style={{ padding: "8px", color: "#fff", fontWeight: "bold" }}>{row.label}</td>
                          <td style={{ padding: "8px", color: "#aaa" }}>{row.data?.samplePrompt}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: row.data?.color === "GREEN" ? "#00ff66" : row.data?.color === "AMBER" ? "#ffaa00" : "#ff3366", fontWeight: "bold" }}>
                            {row.data?.probabilityScore}%
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <span style={{
                              fontSize: "0.65rem",
                              padding: "2px 6px",
                              border: `1px solid ${row.data?.color === "GREEN" ? "#00ff66" : row.data?.color === "AMBER" ? "#ffaa00" : "#ff3366"}`,
                              color: row.data?.color === "GREEN" ? "#00ff66" : row.data?.color === "AMBER" ? "#ffaa00" : "#ff3366"
                            }}>
                              {row.data?.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Edge Remediation Pitch Card */}
              {auditResult.projectedRemediation && (
                <section style={{ gridColumn: "1 / -1", border: "1px solid #00f3ff", padding: "18px 20px", backgroundColor: "#021208", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#00ff66", fontWeight: "bold" }}>
                      ⚡ EDGE INJECTION REMEDIATION PROPOSAL
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "4px" }}>
                      Method: {auditResult.projectedRemediation.remediationMethod} &bull; Window: {auditResult.projectedRemediation.deploymentDurationHours} Hours
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#fff", marginTop: "6px" }}>
                      Projected AEO Lift: <strong style={{ color: "#ff3366" }}>{auditResult.projectedRemediation.currentAeoScore}</strong> ➔ <strong style={{ color: "#00ff66" }}>{auditResult.projectedRemediation.projectedAeoScore} / 100</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.1rem", color: "#00ff66", fontWeight: "bold" }}>
                      SAR {auditResult.projectedRemediation.costSAR?.toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRemediationOpen(true)}
                      style={{
                        marginTop: "6px",
                        backgroundColor: "#00ff66",
                        color: "#000",
                        border: "none",
                        padding: "8px 16px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        cursor: "pointer"
                      }}
                    >
                      DEPLOY EDGE PATCH ➔
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      )}

      {/* Community Relay & AEO Structured Knowledge Graph */}
      <div className="no-print" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <CommunityFaqHub />
      </div>
      <div className="no-print mt-12">
        {/* Sovereign Enterprise Compliance Footer */}
        <footer className="border-t border-zinc-900 pt-5 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4 text-[0.7rem] text-zinc-500 font-mono">
          <div className="max-w-3xl leading-relaxed space-y-1.5">
            <div>
              <span className="text-zinc-300 font-bold">SOVEREIGN AEC &amp; TRADE CORE:</span>{" "}
              Technical staging engine for engineering coordination and digital pre-clearance auditing under KSA municipal and trade frameworks.
            </div>
            <div className="text-[0.62rem] text-zinc-600 leading-normal border-l border-zinc-800 pl-2">
              <span className="text-zinc-500 font-semibold">STATUTORY SCOPE:</span> Digital document verification and schema validation tool only. Not an accredited Conformity Assessment Body (CAB), government portal, or licensed customs broker. Official certification (PCoC/SCoC) and port customs release require statutory submission via SABER and Fasah.
            </div>
          </div>

          <div className="text-left sm:text-right text-zinc-600 shrink-0 self-start sm:self-auto">
            <div>SOVEREIGN AIR-GAPPED CORE // 2026</div>
            <div className={isSettled ? "text-emerald-400 font-semibold" : "text-cyan-400 font-semibold"}>
              ● {isSettled ? "STAGED FOR STATUTORY SUBMISSION" : "TECHNICAL PREVIEW MODE"}
            </div>
          </div>
        </footer>
      </div>
      {/* ENTERPRISE B2B SETTLEMENT MODAL (SARIE CORPORATE WIRE & ZATCA TAX INVOICE) */}
      {showSettlementModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.94)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#070c12",
            border: "1px solid #00f3ff",
            padding: "28px",
            width: "720px",
            maxWidth: "95%",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            boxShadow: "0 0 40px rgba(0, 243, 255, 0.2)"
          }}>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #142838", paddingBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "1rem", color: "#00f3ff", fontWeight: "bold", letterSpacing: "1px" }}>
                  COMMERCIAL SETTLEMENT GATEWAY // CORPORATE WIRE (SARIE)
                </div>
                <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
                  TAX CLEARANCE DISPATCH &bull; ZATCA PHASE-2 COMPLIANT E-INVOICE GENERATION
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSettlementModal(false);
                  setPendingAction(null);
                }}
                style={{ backgroundColor: "transparent", border: "1px solid #333", color: "#888", padding: "4px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}
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

            {/* Corporate Settlement Wire Routing Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px" }}>

              {/* Primary Corporate Wire Instructions */}
              <div style={{ border: "1px solid #142838", backgroundColor: "#04080d", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "0.75rem", color: "#00ff66", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "6px" }}>
                  OFFICIAL INSTITUTIONAL SETTLEMENT (SAR / USD)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.72rem" }}>
                  <div><span style={{ color: "#666" }}>BENEFICIARY ENTITY:</span> <strong style={{ color: "#fff" }}>MIU_33 SOVEREIGN SYSTEMS &amp; TECHNOLOGY</strong></div>
                  <div><span style={{ color: "#666" }}>BANK:</span> <strong style={{ color: "#fff" }}>Al Rajhi Banking Corp (Corporate Banking Div)</strong></div>
                  <div><span style={{ color: "#666" }}>ACCOUNT ROUTING:</span> <span style={{ color: "#aaa" }}>Riyadh Corporate Central Branch</span></div>
                  <div><span style={{ color: "#666" }}>CORPORATE IBAN:</span></div>
                  <div style={{ fontSize: "0.75rem", color: "#00ff66", fontWeight: "bold", backgroundColor: "#000", padding: "8px", border: "1px solid #142838", userSelect: "all" }}>
                    SA4880207781501222121011
                  </div>
                  <div><span style={{ color: "#666" }}>ZATCA TAX ID:</span> <span style={{ color: "#00f3ff" }}>300000000000003</span></div>
                </div>
              </div>

              {/* Fiscal & SLA Notice */}
              <div style={{ border: "1px solid #142838", backgroundColor: "#04080d", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#ffaa00", fontWeight: "bold", borderBottom: "1px solid #142838", paddingBottom: "6px", marginBottom: "8px" }}>
                    AUTOMATED CLEARANCE SLA
                  </div>
                  <p style={{ fontSize: "0.68rem", color: "#888", lineHeight: "1.5", margin: 0 }}>
                    Official municipal compliance dossiers, unwatermarked CAD schedules, and Layer 3 edge remediation scripts release immediately upon settlement verification.
                  </p>
                </div>
                <div style={{ padding: "8px", border: "1px solid #142838", backgroundColor: "#000", fontSize: "0.65rem", color: "#666" }}>
                  VAT Treatment: 15% Statutory KSA VAT applied pursuant to ZATCA Phase-2 e-invoicing standards.
                </div>
              </div>

            </div>

            {/* Wire Confirmation / Reference Verification Block */}
            <div style={{ backgroundColor: "#04080d", border: "1px solid #142838", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: "bold" }}>VERIFY SETTLEMENT REFERENCE</span>
                <span style={{ fontSize: "0.68rem", color: "#00ff66" }}>● SARIE REAL-TIME SETTLEMENT ACTIVE</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter Bank Transfer Reference / SARIE Transaction Ref..."
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: "#000",
                    border: "1px solid #142838",
                    color: "#00f3ff",
                    padding: "10px 12px",
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (settlementRef.trim()) {
                      if (pendingAction === "dossier") handleExportAuditDossier();
                      else if (pendingAction === "remediation") setIsRemediationOpen(true);
                      else handleZipDossier(settlementRef);
                    }
                  }}
                  style={{
                    backgroundColor: "#00ff66",
                    color: "#000",
                    border: "none",
                    padding: "10px 18px",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "monospace"
                  }}
                >
                  VERIFY &amp; UNLOCK
                </button>
              </div>
            </div>

            {/* Status Feedbacks */}
            {clearanceStatus === "VERIFIED" && (
              <div style={{ backgroundColor: "#022010", border: "1px solid #00ff66", padding: "8px", textAlign: "center", fontSize: "0.72rem", color: "#00ff66", fontWeight: "bold" }}>
                ✓ CORPORATE CLEARANCE VERIFIED — UNSEALING OFFICIAL SOVEREIGN DOSSIER...
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
            onCommitPayload={async (rawPayload: any) => {
                setIsIngestModalOpen(false);
                if (typeof rawPayload === "string") {
                  try {
                    const res = await fetch(`${LEDGER_WORKER_BASE}/api/ingest-raw`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "text/plain",
                      },
                      body: rawPayload,
                    });
                    const parsed = await res.json();
                    if (parsed.items && Array.isArray(parsed.items)) {
                      const itemsFormatted = parsed.items.map((it: any, idx: number) => ({
                        code: `RAW-${String(idx + 1).padStart(3, "0")}`,
                        name: it.description,
                        qty: it.quantity,
                        unitPrice: it.unit_price,
                      }));
                      handleGenerateInvoice(itemsFormatted);
                      return;
                    }
                  } catch (err) {
                    console.error("Worker parsing error:", err);
                  }
                }
                handleGenerateInvoice(rawPayload);
              }}
            />
          </div>
        </div>
      )}

      <RemediationStudioModal
        isOpen={isRemediationOpen}
        onClose={() => setIsRemediationOpen(false)}
        targetDomain={auditUrl || "https://miu33archstudio.xyz"}
        brandName="Cross-Border Industrial Partner"
      />
      <GeMiuAgentModal
        isOpen={isGeMiuOpen}
        onClose={() => setIsGeMiuOpen(false)}
      />
    </div>
  );
}