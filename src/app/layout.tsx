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
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MIU_33 Studio // Digital Architecture & AI Systems",
  description:
    "Autonomous BIM visualization, spatial computing pipelines, AI telephony, and high-throughput architectural media engines.",
  metadataBase: new URL("https://miu33archstudio.xyz"),
  applicationName: "MIU_33 Studio",
  authors: [{ name: "MIU_33 Studio", url: "https://miu33archstudio.xyz" }],
  keywords: [
    "MIU_33 Studio",
    "SYNAPSE_PACT",
    "Architectural AI",
    "BIM Automation",
    "Archicad Engine",
    "Spatial Computing",
    "3D WebGL",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://miu33archstudio.xyz",
    siteName: "MIU_33 Studio",
    title: "MIU_33 Studio // Digital Architecture & AI Systems",
    description:
      "Autonomous BIM visualization, spatial computing pipelines, AI telephony, and high-throughput architectural media engines.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIU_33 Studio // Digital Architecture & AI Systems",
    description:
      "Autonomous BIM visualization, spatial computing pipelines, and AI engineering infrastructure.",
  },
  icons: {
    icon: "/favicon.ico",
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
    name: "MIU_33 Studio",
    alternateName: ["SYNAPSE_PACT", "MIU Arch Engine"],
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: "https://miu33archstudio.xyz",
    author: {
      "@type": "Organization",
      name: "MIU_33 Studio",
      url: "https://miu33archstudio.xyz",
    },
    description:
      "Autonomous BIM visualization, spatial computing pipelines, AI telephony, and high-throughput architectural media engines.",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-950 text-slate-100`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}