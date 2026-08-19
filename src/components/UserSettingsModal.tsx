interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  tier: string;
  credits: number;
  onSignOut: () => void;
}

export function UserSettingsModal({
  isOpen,
  onClose,
  userEmail,
  tier,
  credits,
  onSignOut,
}: UserSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F17] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-mono text-sm font-bold tracking-wider text-white">
            ACCOUNT // SETTINGS
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white font-mono text-sm">
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4 font-mono text-xs">
          <div>
            <span className="text-white/50">ACCOUNT EMAIL</span>
            <div className="mt-1 rounded-lg border border-white/10 bg-white/5 p-2.5 text-white">
              {userEmail}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-white/50">MEMBERSHIP TIER</span>
              <div className="mt-1 rounded-lg border border-[#00F5FF]/30 bg-[#00F5FF]/5 p-2.5 font-bold text-[#00F5FF]">
                {tier}
              </div>
            </div>
            <div>
              <span className="text-white/50">ACTIVE BALANCE</span>
              <div className="mt-1 rounded-lg border border-white/10 bg-white/5 p-2.5 font-bold text-white">
                {credits} Credits
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-white/10">
          <button
            onClick={onSignOut}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2 font-mono text-xs font-bold text-red-400 hover:bg-red-500/20"
          >
            DISCONNECT SESSION // SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}