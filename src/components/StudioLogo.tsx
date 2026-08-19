export function StudioLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Precision Geometric M Badge */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition-all duration-300 hover:drop-shadow-[0_0_12px_#00F5FF]`}
      >
        {/* Outer Tech Frame */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="12"
          stroke="#00F5FF"
          strokeWidth="3"
          strokeOpacity="0.35"
        />

        {/* Structural M Geometry */}
        <path
          d="M24 74V26L50 54L76 26V74"
          stroke="#00F5FF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cyber Center Vertex */}
        <circle cx="50" cy="54" r="4.5" fill="#A855F7" />

        {/* Corner Telemetry Accents */}
        <path d="M12 20H20M12 20V28" stroke="#00F5FF" strokeWidth="2" strokeOpacity="0.8" />
        <path d="M88 80H80M88 80V72" stroke="#00F5FF" strokeWidth="2" strokeOpacity="0.8" />
      </svg>

      {/* Cockpit Monospace Branding */}
      <div className="flex flex-col">
        <span className="font-mono text-sm font-bold tracking-wider text-white">
          MIU<span className="text-[#00F5FF]">_33</span>
        </span>
        <span className="font-mono text-[10px] tracking-widest text-[#00F5FF]/60 uppercase">
          Studio // Core
        </span>
      </div>
    </div>
  );
}