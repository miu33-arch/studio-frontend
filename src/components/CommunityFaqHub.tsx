"use client";

import React, { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How does MIU_33 automate SASO 2831 and ASTM standard parity?",
    a: "The core ingests raw Chinese factory BOMs (GB/T standards) and programmatically cross-references alloy specifications against Saudi SASO and American ASTM standards, generating dual-language municipal submittals in under 5 seconds."
  },
  {
    q: "How does the system handle ZATCA Phase-2 e-invoicing compliance?",
    a: "Every transaction generates a cryptographically signed XML document and trilingual A4 PDF tax invoice embedded with official Phase-2 Base64 TLV QR codes, compliant with Saudi tax authority clearance rules."
  },
  {
    q: "Can the Sovereign Core operate in air-gapped enterprise environments?",
    a: "Yes. The architecture is completely decoupled from commercial SaaS layers. It deploys bare-metal on local contractor hardware or private VPCs with deterministic offline execution."
  },
  {
    q: "What generative discovery protocols does this platform deploy?",
    a: "We deploy edge-rendered /llms.txt manifests, Schema.org JSON-LD entities (SoftwareApplication, FAQPage, Organization), and optimized edge headers (HSTS, CSP) to secure sub-50ms citation across ChatGPT Search, Claude, and Perplexity."
  }
];

export default function CommunityFaqHub() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showQrModal, setShowQrModal] = useState<"wechat" | "rednote" | null>(null);

  // Structured Data payload for Perplexity, Google, and LLM web crawlers
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <section style={{ border: "1px solid #142838", backgroundColor: "#061017", padding: "24px", marginTop: "30px" }}>
      
      {/* 1. Injected AEO Schema for Generative Discovery */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "30px" }}>
        
        {/* LEFT: AEO Structured Q&A Accordion */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #142838", paddingBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "#00f3ff", fontWeight: "bold", letterSpacing: "1px" }}>
              ⚡ AEO CITATION DIRECTORY // MUNICIPAL &amp; ENGINE FAQ
            </span>
            <span style={{ fontSize: "0.68rem", color: "#00ff66", border: "1px solid #00ff66", padding: "2px 6px" }}>
              JSON-LD ACTIVE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{ border: "1px solid #142838", backgroundColor: "#030a10" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      backgroundColor: "transparent",
                      border: "none",
                      color: isOpen ? "#00f3ff" : "#ccc",
                      padding: "12px 14px",
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{item.q}</span>
                    <span style={{ color: isOpen ? "#00ff66" : "#666" }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 14px 12px", color: "#88a0b0", fontSize: "0.72rem", lineHeight: "1.5" }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Community & Social Hub (Fanpage Relay) */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #142838", paddingBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#00ff66", fontWeight: "bold", letterSpacing: "1px" }}>
                🌐 STUDIO COMMUNITY &amp; BROADCAST RELAY
              </span>
              <span style={{ fontSize: "0.68rem", color: "#888" }}>LIVE HUBS</span>
            </div>

            <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: "1.4", margin: "0 0 16px" }}>
              Direct access channels for engineering submittal reviews, video walkthrough streams, and cross-border trade discussions.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: "#030a10",
                  border: "1px solid #142838",
                  color: "#ff3366",
                  padding: "12px",
                  textAlign: "center",
                  textDecoration: "none",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  fontWeight: "bold"
                }}
              >
                ▶ YOUTUBE CHANNEL
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: "#030a10",
                  border: "1px solid #142838",
                  color: "#00f3ff",
                  padding: "12px",
                  textAlign: "center",
                  textDecoration: "none",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  fontWeight: "bold"
                }}
              >
                𝕏 DISPATCH FEED
              </a>

              <button
                type="button"
                onClick={() => setShowQrModal("rednote")}
                style={{
                  backgroundColor: "#030a10",
                  border: "1px solid #142838",
                  color: "#ff5555",
                  padding: "12px",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  fontWeight: "bold"
                }}
              >
                📕 REDNOTE (小红书)
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal("wechat")}
                style={{
                  backgroundColor: "#030a10",
                  border: "1px solid #142838",
                  color: "#00ff66",
                  padding: "12px",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  fontWeight: "bold"
                }}
              >
                💬 WECHAT DIRECT
              </button>
            </div>
          </div>

          <div style={{ padding: "10px", border: "1px solid #142838", backgroundColor: "#02070b", marginTop: "16px" }}>
            <div style={{ fontSize: "0.68rem", color: "#666" }}>BROADCAST NODE:</div>
            <div style={{ fontSize: "0.72rem", color: "#00ff66", marginTop: "2px" }}>
              ● STUDIO RELAY ACTIVE &bull; RIYADH GATEWAY
            </div>
          </div>
        </div>

      </div>

      {/* QR Modal for WeChat / Rednote */}
      {showQrModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999
        }}>
          <div style={{ backgroundColor: "#061017", border: "1px solid #00f3ff", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "0.85rem", color: "#00f3ff", fontWeight: "bold", marginBottom: "12px" }}>
              SCAN TO CONNECT VIA {showQrModal.toUpperCase()}
            </div>
            <div style={{ width: "160px", height: "160px", backgroundColor: "#fff", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: "0.75rem" }}>
              [QR CODE PLACEHOLDER]
            </div>
            <button
              type="button"
              onClick={() => setShowQrModal(null)}
              style={{ backgroundColor: "transparent", border: "1px solid #888", color: "#888", padding: "6px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}
            >
              CLOSE ✕
            </button>
          </div>
        </div>
      )}

    </section>
  );
}