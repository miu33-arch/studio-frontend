export interface GeoAuditData {
  country: string;
  region: string;
  city: string;
  currency: string;
  vatRate: number;
  isKsa: boolean;
}

export async function getClientGeoContext(): Promise<GeoAuditData> {
  const fallback: GeoAuditData = {
    country: "SA",
    region: "Riyadh Region",
    city: "Riyadh",
    currency: "SAR",
    vatRate: 0.15,
    isKsa: true
  };

  try {
    const res = await fetch("https://geo.miu33archstudio.xyz", { cache: "no-store" });
    if (!res.ok) return fallback;

    const data = await res.json();
    const country = data.geo?.country || "SA";
    const isKsa = country === "SA";

    return {
      country,
      region: data.geo?.region || "Unknown",
      city: data.geo?.city || "Unknown",
      currency: isKsa ? "SAR" : "USD",
      vatRate: isKsa ? 0.15 : 0.0,
      isKsa
    };
  } catch (err) {
    return fallback;
  }
}