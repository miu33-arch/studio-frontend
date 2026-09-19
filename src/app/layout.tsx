import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MIU_33 // Sovereign China-GCC Trade & Compliance Core",
  description:
    "Cross-border China-Saudi sovereign compliance engine: GB/T to SASO/ASTM BOM parity, SFDA food cold-chain thermal telemetry, SABER MTC verification, and trilingual ZATCA 15% VAT settlement.",
  metadataBase: new URL("https://miu33archstudio.xyz"),
  applicationName: "MIU Sovereign Trade Core",
  authors: [{ name: "MIU_33 Studio", url: "https://miu33archstudio.xyz" }],
  keywords: [
    "MIU_33 Studio",
    "China Saudi Arabia Trade",
    "SFDA Cold Chain",
    "SASO 2831 Parity",
    "SABER MTC",
    "ZATCA 15% VAT",
    "MOMRAH Balady",
    "Dual Track Ingestion",
    "BOM Localization",
    "GCC Customs Clearance",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://miu33archstudio.xyz",
    siteName: "MIU_33 Sovereign Core",
    title: "MIU_33 // China-GCC Sovereign Trade & Compliance Engine",
    description:
      "Automated cross-border trade execution: Trilingual SASO/SFDA submittals, cold-chain thermal monitoring, and ZATCA Phase-2 fiscal settlement.",
    images: [
      {
        url: "https://miu33archstudio.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "MIU_33 China-Saudi Sovereign Trade & Compliance Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MIU_33 // Sovereign China-GCC Compliance Core",
    description:
      "Automated SFDA cold-chain audit, SASO/ASTM alloy parity, and trilingual ZATCA tax invoice dossiers.",
    images: ["https://miu33archstudio.xyz/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MIU Sovereign Trade Core",
    alternateName: ["MIU_33 Studio", "Sovereign AEC & Trade Core"],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Linux, Docker",
    url: "https://miu33archstudio.xyz",
    creator: {
      "@type": "Organization",
      name: "MIU_33 Studio",
      url: "https://miu33archstudio.xyz",
    },
    description:
      "Autonomous cross-border execution pipeline for China-Saudi trade: SFDA cold-chain telemetry audits, SASO 2831 material parity, and ZATCA Phase-2 tax invoicing.",
    featureList: [
      "Dual-Track Multi-Vertical Ingest",
      "SFDA Cold-Chain Thermal Telemetry",
      "SASO & SABER MTC Engineering Parity",
      "ZATCA Phase-2 Cryptographic Ledger",
      "BOM & Standard Localization",
      "BIM HUD Telemetry"
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black text-slate-100`}
    >
      <head>
        <link rel="help" type="text/plain" href="/llms.txt" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#050505] text-[#00f3ff] selection:bg-[#00f3ff] selection:text-black font-mono">
        {children}
      </body>
    </html>
  );
}