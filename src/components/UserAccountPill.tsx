"use client";

import { useState, useRef } from "react";
import { Sparkles, Settings, LogOut } from "lucide-react";

export interface UserAccountPillProps {
  // Support direct props or object props
  user?: any;
  email?: string;
  credits?: number;
  tier?: string;
  clientData?: { credits: number; tier?: string; apiKey?: string } | null;
  isPaidUser?: boolean;
  compact?: boolean;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export default function UserAccountPill({
  user,
  email,
  credits,
  tier,
  clientData,
  isPaidUser,
  compact = false,
  onOpenSettings,
  onSignOut,
}: UserAccountPillProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeEmail = email || user?.email || "";
  const activeCredits = credits ?? clientData?.credits ?? 0;
  const activeTier = tier || clientData?.tier || (isPaidUser ? "PRO" : "FREE");
  const isPaid = isPaidUser ?? (activeTier === "PRO" || activeCredits > 100);

  const userInitial = activeEmail ? activeEmail.charAt(0).toUpperCase() : "M";
  const username = activeEmail ? activeEmail.split("@")[0] : "Architect";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Interactive Profile Card */}
      <div
        onClick={onOpenSettings}
        className={`group flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all shadow-lg backdrop-blur-md ${
          compact ? "px-2 py-1" : "px-3 py-1.5"
        }`}
      >
        {/* Avatar / Initials Frame */}
        <div className="relative">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-400/40 bg-slate-950 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs shadow-sm shadow-cyan-500/20 group-hover:border-cyan-400">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          {isPaid && (
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[7px] font-bold ring-1 ring-slate-950">
              ★
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="text-left font-mono">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate max-w-24">
              {username}
            </span>
            {isPaid ? (
              <span className="text-[7px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded">
                PRO
              </span>
            ) : (
              <span className="text-[7px] text-slate-500">FREE</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[9px] text-emerald-400">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{activeCredits} Credits</span>
          </div>
        </div>

        <Settings className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors ml-0.5" />
      </div>

      {/* Standalone Logout Button */}
      <button
        onClick={onSignOut}
        title="Sign Out"
        className="p-2 bg-slate-900/90 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 rounded-xl text-slate-500 hover:text-rose-400 transition-all shadow-md"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}