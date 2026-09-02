"use client";

import React, { useState } from "react";

interface FeatureCard {
  number: string;
  title: string;
  description: string;
  category: string;
}

interface EngagementPlan {
  id: string;
  badge: string;
  title: string;
  priceSAR: number;
  priceUSD: number;
  displayPrice: string;
  period: string;
  subtitle: string;
  items: Array<{ description: string; unitPriceSAR: number; qty: number }>;
  features: string[];
}

const AEC_FEATURES: FeatureCard[] = [
  {
    number: "01",
    title: "GB/T ⇄ SASO/ASTM BOM LOCALIZER",
    category: "SPEC & SUBMITTALS",
    description:
      "Bidirectional engineering translation (ZH ⇄ EN / AR) generating MOMRAH and SASO-compliant technical specifications with Chinese factory material alloy parity cross-referencing."
  },
  {
    number: "02",
    title: "SABER & MTC CONFORMITY MATRIX",
    category: "REGULATORY COMPLIANCE",
    description:
      "Automated Material Test Certificate (MTC) validation mapping factory alloy grades (6063-T6, Low-E glazing, structural steel) directly against Saudi SASO 2831 and ASTM standard registries."
  },
  {
    number: "03",
    title: "FOB ➔ CIF LANDED COST & CUSTOMS ENGINE",
    category: "CROSS-BORDER TRADE",
    description:
      "Real-time trade computation mapping BOM items to GCC HS Codes, calculating ocean freight, marine insurance, 5% GCC customs tariff, and 15% ZATCA VAT in SAR and CNY."
  },
  {
    number: "04",
    title: "MUNICIPAL DRONE & SITE PROGRESS HUD",
    category: "SITE TELEMETRY",
    description:
      "Telemetry video engine burning surveyor GPS coordinates, datum levels (+12.50m), Balady building license numbers, and contractor audit stamps onto inspection footage."
  },
  {
    number: "05",
    title: "4D BIM PHASE SEQUENCING COMPILER",
    category: "VISUAL VERIFICATION",
    description:
      "Multi-scene render concatenation engine with Gantt milestone progress overlays for contractor board presentations and municipal construction phase verification."
  },
  {
    number: "06",
    title: "TRILINGUAL ZATCA TAX SETTLEMENT",
    category: "COMMERCIAL SETTLEMENT",
    description:
      "Commercial invoicing with ZATCA-compliant 15% VAT calculation, dual-currency SAR/CNY settlement, and legal Arabic/English/Mandarin line-item rendering."
  }
];

const ENGAGEMENT_MODELS: EngagementPlan[] = [
  {
    id: "retainer",
    badge: "ACTIVE",
    title: "MUNICIPAL COMPLIANCE RETAINER",
    priceUSD: 3500,
    priceSAR: 13125,
    displayPrice: "$3,500",
    period: "/ month",
    subtitle: "Turnkey procurement & submittal engineering for active GCC projects",
    items: [
      { description: "Monthly Engineering BOM Localization & Dual Submittal Retainer", unitPriceSAR: 11413.04, qty: 1 }
    ],
    features: [
      "Unlimited GB/T ⇄ SASO/ASTM BOM staging & translation",
      "Instant MOMRAH dual-language vector PDF generation",
      "Continuous SABER material conformity matrix verification",
      "Trilingual ZATCA 15% VAT tax invoice compilation"
    ]
  },
  {
    id: "project",
    badge: "PER SUBMITTAL",
    title: "PROJECT SUBMITTAL PACKAGE",
    priceUSD: 1850,
    priceSAR: 6937.5,
    displayPrice: "$1,850",
    period: "/ package",
    subtitle: "Complete municipal compliance filing for a single building package",
    items: [
      { description: "Single-Phase Complete Municipal Submittal & SASO Parity Filing Dossier", unitPriceSAR: 6032.61, qty: 1 }
    ],
    features: [
      "Full factory BOM extraction & alloy grade alignment",
      "FOB Guangzhou to CIF Jeddah/Dammam cost breakdown",
      "Stamped municipal drone inspection progress video",
      "Complete SASO & ASTM cross-reference dossier"
    ]
  },
  {
    id: "enterprise",
    badge: "AIR-GAPPED",
    title: "ENTERPRISE BARE-METAL CORE",
    priceUSD: 8500,
    priceSAR: 31875,
    displayPrice: "$8,500",
    period: "/ on-premise",
    subtitle: "Self-hosted sovereign deployment for Tier-1 general contractors",
    items: [
      { description: "Bare-Metal Sovereign Core License & On-Premise Container Deployment", unitPriceSAR: 27717.39, qty: 1 }
    ],
    features: [
      "100% air-gapped local execution (Zero external cloud leak)",
      "Direct ERP / Revit / BIM database ingestion pipeline",
      "Dedicated multi-tenant contractor licensing keys",
      "Priority SLA & custom GCC municipal schema updates"
    ]
  }
];

export default function PitchDeck() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("retainer");
  const [contractorEntity, setContractorEntity] = useState("AL-RAJHI COMMERCIAL CONTRACTING");
  const [currency, setCurrency] = useState<"SAR" | "USD" | "CNY">("SAR");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [proformaOutput, setProformaOutput] = useState<any>(null);
  const [capabilityLoading, setCapabilityLoading] = useState(false);
  const [capabilityUrl, setCapabilityUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePlan = ENGAGEMENT_MODELS.find((p) => p.id === selectedPlanId) || ENGAGEMENT_MODELS[0];

  const handleExportCapabilityDeck = async () => {
    setCapabilityLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/services/pitch-deck-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "miu_master_agency_key"
        },
        body: JSON.stringify({
          clientName: contractorEntity.trim() || "AL-RAJHI COMMERCIAL CONTRACTING",
          contactPerson: "Executive Procurement & Engineering Directorate"
        })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON (${res.status}): ${text.slice(0, 100)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Capability deck export failed");

      if (data.downloadUrl) {
        setCapabilityUrl(data.downloadUrl);
        window.open(data.downloadUrl, "_blank");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCapabilityLoading(false);
    }
  };

  const handleIssueProforma = async () => {
    setInvoiceLoading(true);
    setError(null);
    setProformaOutput(null);

    try {
      const baseGross = currency === "USD" 
        ? activePlan.priceUSD 
        : currency === "CNY" 
        ? Number((activePlan.priceSAR / 0.52).toFixed(2)) 
        : activePlan.priceSAR;

      const subtotalPreTax = Number((baseGross / 1.15).toFixed(2));

      const itemsPayload = activePlan.items.map((itm) => ({
        code: "SVC-001",
        name: itm.description,
        descriptionZh: "每月工程物料清单本地化及双重提交保留金",
        descriptionAr: "خدمة احتفاظ شهرية لتوطين قائمة مكونات الهندسة وتقديمها المزدوج",
        qty: itm.qty || 1,
        unitPrice: subtotalPreTax,
        total: subtotalPreTax
      }));

      const res = await fetch("http://127.0.0.1:5000/api/services/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "miu_master_agency_key"
        },
        body: JSON.stringify({
          clientName: contractorEntity.trim() || "AL-RAJHI COMMERCIAL CONTRACTING",
          clientTaxId: "300000000000003",
          invoiceNumber: `PROFORMA-${activePlan.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
          currency: currency,
          vatRate: 0.15,
          targetLang: "dual",
          items: itemsPayload
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON (${res.status}): ${text.slice(0, 100)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proforma generation failed");

      setProformaOutput(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "30px", padding: "10px" }}>
      
      {/* Header Deck Banner */}
      <section style={{ border: "1px solid #222", padding: "28px 32px", backgroundColor: "#0b0b0b", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.7rem", color: "#00ff66", border: "1px solid #00ff66", padding: "2px 8px", fontWeight: "bold" }}>
              MOMRAH / SASO / ZATCA VERIFIED
            </span>
            <span style={{ fontSize: "0.7rem", color: "#888" }}>
              AIR-GAPPED SOVEREIGN ARCHITECTURE
            </span>
          </div>

          <button
            type="button"
            disabled={capabilityLoading}
            onClick={handleExportCapabilityDeck}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #00f3ff",
              color: "#00f3ff",
              padding: "6px 14px",
              fontSize: "0.72rem",
              fontFamily: "monospace",
              fontWeight: "bold",
              cursor: capabilityLoading ? "not-allowed" : "pointer"
            }}
          >
            {capabilityLoading ? "COMPILING PDF..." : "📄 EXPORT 1-PAGER CAPABILITY DECK (PDF)"}
          </button>
        </div>

        <h1 style={{ fontSize: "1.4rem", color: "#fff", letterSpacing: "1px", margin: "4px 0 0" }}>
          Sovereign China–GCC AEC &amp; Municipal Engineering Core
        </h1>

        <p style={{ fontSize: "0.82rem", color: "#888", lineHeight: "1.5", margin: 0, maxWidth: "950px" }}>
          High-performance sovereign execution pipeline designed to convert Chinese factory BOMs, architectural BIM datasets, and cross-border trade contracts into MOMRAH/SASO-compliant municipal submittals and ZATCA tax packages with zero third-party cloud exposure.
        </p>

        {capabilityUrl && (
          <div style={{ fontSize: "0.72rem", color: "#00ff66" }}>
            ✓ Capability overview compiled. <a href={capabilityUrl} target="_blank" rel="noreferrer" style={{ color: "#00f3ff", textDecoration: "underline" }}>Click here to open PDF</a> if pop-up was blocked.
          </div>
        )}
      </section>

      {/* 6 Core Enterprise AEC Pillars */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {AEC_FEATURES.map((feat, idx) => {
          const isSelected = selectedCard === idx;
          return (
            <div
              key={feat.number}
              onClick={() => setSelectedCard(idx)}
              style={{
                border: isSelected ? "1px solid #00f3ff" : "1px solid #1a1a1a",
                backgroundColor: isSelected ? "#071219" : "#080808",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: isSelected ? "#00f3ff" : "#00ff66", fontWeight: "bold" }}>
                  {feat.number} // {feat.title}
                </span>
              </div>

              <span style={{ fontSize: "0.65rem", color: "#666", letterSpacing: "1px" }}>
                CATEGORY: {feat.category}
              </span>

              <p style={{ fontSize: "0.75rem", color: "#aaa", lineHeight: "1.5", margin: 0 }}>
                {feat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Commercial Engagement Models Grid */}
      <section style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "#00f3ff", fontWeight: "bold", letterSpacing: "1px" }}>
            COMMERCIAL ENGAGEMENT MODELS // GCC &amp; CHINA CONTRACTORS
          </span>
          <span style={{ fontSize: "0.7rem", color: "#666" }}>
            SELECT MODEL ➔ ISSUE OFFICIAL ZATCA PROFORMA TAX INVOICE (PDF)
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {ENGAGEMENT_MODELS.map((plan) => {
            const isPlanSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  border: isPlanSelected ? "1px solid #00ff66" : "1px solid #222",
                  backgroundColor: isPlanSelected ? "#07160d" : "#0b0b0b",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: isPlanSelected ? "#00ff66" : "#888", fontWeight: "bold" }}>
                    {plan.title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      padding: "2px 6px",
                      border: `1px solid ${isPlanSelected ? "#00ff66" : "#444"}`,
                      color: isPlanSelected ? "#00ff66" : "#888",
                      fontWeight: "bold"
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "1.6rem", color: "#fff", fontWeight: "bold" }}>
                    {plan.displayPrice}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>
                    {plan.period}
                  </span>
                </div>

                <div style={{ fontSize: "0.72rem", color: "#888", lineHeight: "1.4" }}>
                  {plan.subtitle}
                </div>

                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ fontSize: "0.7rem", color: "#ccc", display: "flex", gap: "8px" }}>
                      <span style={{ color: isPlanSelected ? "#00ff66" : "#00f3ff" }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Proforma Invoicing Action Module */}
      <section style={{ border: "1px solid #00f3ff", padding: "24px", backgroundColor: "#060a0f", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#00f3ff", fontWeight: "bold", letterSpacing: "1px" }}>
              ⚡ ISSUE PROFORMA INVOICE // {activePlan.title}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "2px" }}>
              Generates legal A4 Proforma Invoice with 15% ZATCA VAT &amp; IBAN Wire Details for corporate procurement.
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {(["SAR", "USD", "CNY"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                style={{
                  backgroundColor: currency === c ? "#00f3ff" : "transparent",
                  color: currency === c ? "#000" : "#888",
                  border: "1px solid #00f3ff",
                  padding: "4px 8px",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                  cursor: currency === c ? "default" : "pointer",
                  fontFamily: "monospace"
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            value={contractorEntity}
            onChange={(e) => setContractorEntity(e.target.value)}
            placeholder="Contractor / Billed Entity Name..."
            style={{ backgroundColor: "#000", border: "1px solid #222", color: "#fff", padding: "10px 14px", fontFamily: "monospace", fontSize: "0.85rem", outline: "none" }}
          />

          <button
            type="button"
            disabled={invoiceLoading}
            onClick={handleIssueProforma}
            style={{
              backgroundColor: invoiceLoading ? "#222" : "#00ff66",
              color: "#000",
              border: "none",
              padding: "10px 24px",
              fontWeight: "bold",
              fontSize: "0.8rem",
              fontFamily: "monospace",
              cursor: invoiceLoading ? "not-allowed" : "pointer",
              letterSpacing: "1px"
            }}
          >
            {invoiceLoading ? "ISSUING INVOICE..." : `⚡ GENERATE PROFORMA INVOICE (${activePlan.displayPrice})`}
          </button>
        </div>

        {error && (
          <div style={{ color: "#ff3366", fontSize: "0.75rem", border: "1px solid #ff3366", padding: "8px", backgroundColor: "#1a0505" }}>
            ERROR: {error}
          </div>
        )}

        {proformaOutput?.downloadUrl && (
          <div style={{ border: "1px solid #00ff66", padding: "16px", backgroundColor: "#051508", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#00ff66", fontSize: "0.8rem", fontWeight: "bold" }}>
                ✓ OFFICIAL PROFORMA TAX INVOICE ISSUED [{proformaOutput.invoiceNumber || "PROFORMA-ACTIVE"}]
              </div>
              <div style={{ color: "#aaa", fontSize: "0.72rem", marginTop: "2px" }}>
                BILLED TO: <span style={{ color: "#fff" }}>{proformaOutput.clientName || contractorEntity}</span> | TOTAL:{" "}
                <span style={{ color: "#00ff66", fontWeight: "bold" }}>
                  {Number(proformaOutput.grandTotal || proformaOutput.total || activePlan.priceSAR).toFixed(2)} {proformaOutput.currency || currency}
                </span>{" "}
                (INCL. 15% VAT)
              </div>
            </div>

            <a
              href={proformaOutput.downloadUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: "#00ff66",
                color: "#000",
                padding: "10px 18px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "0.75rem",
                fontFamily: "monospace"
              }}
            >
              📑 DOWNLOAD TRILINGUAL A4 INVOICE (PDF)
            </a>
          </div>
        )}
      </section>

      {/* Regulatory Boundary Footer */}
      <footer style={{ borderTop: "1px solid #1a1a1a", paddingTop: "18px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.68rem", color: "#555" }}>
        <div>
          <span style={{ color: "#777", fontWeight: "bold" }}>MUNICIPAL DISCLAIMER:</span> Commercial proposals and proforma invoices are issued for engineering coordination. Sovereign portal registrations remain subject to certified Engineer of Record filing.
        </div>
        <div style={{ color: "#444", fontFamily: "monospace" }}>
          MOMRAH / SASO / ZATCA COMPLIANT ARCHITECTURE
        </div>
      </footer>
    </main>
  );
}