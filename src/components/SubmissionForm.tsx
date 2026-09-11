import { useEffect, useState } from "react";
import { getClientGeoContext, GeoAuditData } from "@/lib/geo";

export default function SubmissionForm() {
  const [geo, setGeo] = useState<GeoAuditData | null>(null);

  useEffect(() => {
    getClientGeoContext().then((info) => {
      setGeo(info);
      console.log("Edge Geo Detected:", info);
    });
  }, []);

  return (
    <div className="border border-cyan-500/30 p-4 font-mono">
      <p className="text-xs text-zinc-400">
        LOCATION: {geo?.city || "Detecting..."}, {geo?.country}
      </p>
      <p className="text-xs text-cyan-400">
        ACTIVE TAX PRESET: {geo?.isKsa ? "ZATCA 15% VAT (SAR)" : "Standard (USD)"}
      </p>
    </div>
  );
}