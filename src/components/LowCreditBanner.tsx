interface LowCreditBannerProps {
  credits: number;
  onOpenPricing: () => void;
}

export function LowCreditBanner({ credits, onOpenPricing }: LowCreditBannerProps) {
  // Triggers alert only when running low (between 1 and 20 credits)
  if (credits > 20 || credits <= 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-amber-500/30 bg-[#0B0F17]/95 p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
      <div className="flex items-start gap-3">
        {/* Pulse Beacon */}
        <span className="relative flex h-3 w-3 mt-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>

        <div className="flex-1">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
            ⚠️ Low Credit Balance: {credits} Left
          </h4>
          <p className="mt-1 text-xs text-white/70">
            Reel synthesis requires at least 25 credits. Top up now to prevent generation interruption.
          </p>

          <button
            onClick={onOpenPricing}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 font-mono text-xs font-bold text-black transition-all hover:brightness-110 active:scale-95"
          >
            TOP UP CREDITS // RECHARGE
          </button>
        </div>
      </div>
    </div>
  );
}