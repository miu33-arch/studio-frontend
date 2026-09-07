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
  title: "MIU_33 // Sovereign AEC Core & Municipal Compliance",
  description:
    "Enterprise GCC municipal compliance platform: MOMRAH/SASO bilingual submittals, ZATCA Phase-2 billing, 4D BIM sequencing, and site telemetry HUD pipelines.",
  metadataBase: new URL("https://miu33archstudio.xyz"),
  applicationName: "MIU Sovereign AEC Core",
  authors: [{ name: "MIU_33 Studio", url: "https://miu33archstudio.xyz" }],
  keywords: [
    "MIU_33 Studio",
    "Sovereign AEC Core",
    "MOMRAH Compliance",
    "SASO Parity Engine",
    "ZATCA Phase 2",
    "BOM Automation",
    "Industrial Architecture",
    "4D BIM Sequencing",
    "Site Progress HUD",
    "GCC Procurement",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://miu33archstudio.xyz",
    siteName: "MIU Sovereign AEC Core",
    title: "MIU_33 // Sovereign AEC Core & Municipal Compliance",
    description:
      "Enterprise platform for MOMRAH/Balady bilingual submittals, SASO material parity, ZATCA Phase-2 billing, and autonomous site telemetry.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIU_33 // Sovereign AEC Core",
    description:
      "Turnkey MOMRAH/SASO submittal compilation, trilingual ZATCA tax invoicing, and autonomous 4D BIM processing.",
  },
 icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
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
    name: "MIU Sovereign AEC Core",
    alternateName: ["MIU_33 Studio", "SYNAPSE_PACT", "AEC Sovereign Core"],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Linux, Docker",
    url: "https://miu33archstudio.xyz",
    author: {
      "@type": "Organization",
      name: "MIU_33 Studio",
      url: "https://miu33archstudio.xyz",
    },
    description:
      "Autonomous industrial pipeline executing MOMRAH/SASO bilingual technical submittals, ZATCA Phase-2 tax invoicing, and site inspection telemetry.",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black text-slate-100`}
    >
      <head>
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