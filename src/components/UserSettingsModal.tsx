"use client";

import React, { useState } from "react";

export interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  tier?: string;
  credits?: number;
  creditBalance?: number;
  onSignOut?: () => void;
}

export function UserSettingsModal({
  isOpen,
  onClose,
  userEmail = "anamy5334@gmail.com",
  tier = "PRO ARCHITECT",
  credits,
  creditBalance = 500,
  onSignOut,
}: UserSettingsModalProps) {
  const activeBalance = credits ?? creditBalance;
  const [activeTab, setActiveTab] = useState<"profile" | "telephony" | "keys">("profile");
  const [callerId, setCallerId] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [taskPrompt, setTaskPrompt] = useState(
    "You are the AI Project Director for MIU Studio. Deliver updates accurately, concisely, and professionally."
  );
  const [isDispatching, setIsDispatching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;
  
  const handleTestDispatch = async () => {
    if (!targetPhone.trim()) {
      setStatusMsg({ text: "⚠️ Please enter a target phone number.", isError: true });
      return;
    }

    setIsDispatching(true);
    setStatusMsg({ text: "Connecting to Twilio carrier trunk...", isError: false });

    try {
      const res = await fetch("/api/voice/dispatch-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_phone: targetPhone.trim(),
          task_prompt: taskPrompt,
          from_number: callerId.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Voice dispatch rejected.");
      }

      setStatusMsg({
        text: `✓ Call Live (ID: ${data.call_id ? data.call_id.substring(0, 8) : "Active"}...)`,
        isError: false,
      });
    } catch (err: any) {
      setStatusMsg({ text: `✕ ${err.message || "Failed to dispatch call."}`, isError: true });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono text-slate-200">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-[#0b0f17] p-6 shadow-2xl shadow-cyan-950/20">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] tracking-widest text-cyan-400">// SYSTEM COCKPIT</span>
            <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              Account // Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-400 transition-colors text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-800/80 my-4 pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === "profile"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            PROFILE & LEDGER
          </button>
          <button
            onClick={() => setActiveTab("telephony")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === "telephony"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            VOICE & DISPATCH
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === "keys"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            API INTEGRATIONS
          </button>
        </div>

        {/* Tab 1: Profile & Ledger */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-wider text-slate-400 mb-1">
                ACCOUNT EMAIL
              </label>
              <input
                type="text"
                value={userEmail}
                readOnly
                className="w-full rounded border border-slate-800 bg-[#070a0f] px-3 py-2 text-xs text-slate-300 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-wider text-slate-400 mb-1">
                  MEMBERSHIP TIER
                </label>
                <div className="rounded border border-cyan-500/40 bg-[#070a0f] px-3 py-2 text-xs font-semibold text-cyan-400">
                  {tier}
                </div>
              </div>
              <div>
                <label className="block text-[11px] tracking-wider text-slate-400 mb-1">
                  ACTIVE BALANCE
                </label>
                <div className="rounded border border-slate-800 bg-[#070a0f] px-3 py-2 text-xs font-semibold text-white">
                  {activeBalance} Credits
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60">
              <button
                onClick={onSignOut}
                className="w-full rounded border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 tracking-wider hover:bg-red-500/20 transition-all"
              >
                DISCONNECT SESSION // SIGN OUT
              </button>
            </div>
          </div>
        )}
        
        {/* Tab 2: Telephony & Dispatch */}
        {activeTab === "telephony" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-wider text-slate-400 mb-1">
                BYOT CALLER ID (TWILIO NUMBER)
              </label>
              <input
                type="text"
                value={callerId}
                onChange={(e) => setCallerId(e.target.value)}
                placeholder="+1XXXXXXXXXX"
                className="w-full rounded border border-slate-800 bg-[#070a0f] px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider text-slate-400 mb-1">
                DEFAULT VOICE DIRECTIVE / PROMPT
              </label>
              <textarea
                rows={3}
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                className="w-full rounded border border-slate-800 bg-[#070a0f] px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 outline-none resize-none"
              />
            </div>

            <div className="rounded border border-slate-800/80 bg-[#080b11] p-3 space-y-2">
              <label className="block text-[10px] tracking-wider text-cyan-400 uppercase">
                Quick Dispatch Test
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="+63 / +966 / +1..."
                  className="flex-1 rounded border border-slate-800 bg-[#05070a] px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 outline-none"
                />
                <button
                  onClick={handleTestDispatch}
                  disabled={isDispatching}
                  className="rounded bg-cyan-400 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-300 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {isDispatching ? "DISPATCHING..." : "📞 INITIATE"}
                </button>
              </div>

              {statusMsg && (
                <div
                  className={`text-[11px] mt-1 ${
                    statusMsg.isError ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: API Integrations */}
        {activeTab === "keys" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded border border-slate-800 bg-[#070a0f] p-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
              <div>
                <div className="text-xs font-semibold text-slate-200">TWILIO TRUNK BRIDGE</div>
                <div className="text-[10px] text-slate-400">Status: BYOT Encrypted Bridge Linked</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded border border-slate-800 bg-[#070a0f] p-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
              <div>
                <div className="text-xs font-semibold text-slate-200">BLAND AI ENGINE</div>
                <div className="text-[10px] text-slate-400">Status: Active (Latency ~450ms)</div>
              </div>
            </div>

            <div className="rounded border border-slate-800/60 bg-[#080b11] p-3">
              <span className="text-[10px] text-slate-500 block leading-relaxed">
                Telemetry credentials and encrypted keys are handled server-side in your protected <code>.env</code>.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default UserSettingsModal;