import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'MIU_33 // China-GCC Sovereign Trade & Compliance Engine';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#05070b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          border: '3px solid #00f3ff',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 24, color: '#00f3ff', letterSpacing: 2, fontWeight: 'bold' }}>
            MIU_33 // SOVEREIGN TRADE CORE
          </span>
          <span
            style={{
              fontSize: 16,
              color: '#00ff66',
              border: '1px solid #00ff66',
              padding: '6px 14px',
              borderRadius: 4,
            }}
          >
            RIYADH GATEWAY ACTIVE
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
            China-Saudi Sovereign Trade Compliance Engine
          </h1>
          <p style={{ fontSize: 20, color: '#94a3b8', margin: 0 }}>
            Automated CST-to-SABER Parity &bull; FASAH 72h Clearance &bull; ZATCA Phase-2 Invoicing
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 16,
            color: '#64748b',
            borderTop: '1px solid #142838',
            paddingTop: 20,
          }}
        >
          <span>miu33archstudio.xyz</span>
          <span>JEDDAH &bull; DAMMAM &bull; RIYADH DDP</span>
        </div>
      </div>
    ),
    { ...size }
  );
}