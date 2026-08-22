'use client';

import React from 'react';
import { 
  Video, 
  Bot, 
  PhoneCall, 
  Box, 
  Hand, 
  Scan, 
  FileSpreadsheet, 
  FolderKanban, 
  Radio, 
  Key, 
  CreditCard, 
  Settings, 
  Lock 
} from 'lucide-react';
import { StudioLogo } from '@/components/StudioLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBilling: () => void;
  onOpenSettings: () => void;
  isPaidUser?: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenBilling,
  onOpenSettings,
  isPaidUser = false,
}: SidebarProps) {
  const navItems = [
    { id: 'reels', label: 'Reel Engine', icon: Video },
    { id: 'sales', label: 'Sales Agent', icon: Bot },
    { id: 'voice', label: 'Voice Call', icon: PhoneCall, locked: !isPaidUser },
    { id: 'bim', label: 'BIM Engine', icon: Box },
    { id: 'sandbox', label: 'Spatial Sandbox', icon: Hand },
    { id: 'lidar', label: 'LiDAR Inspector', icon: Scan },
    { id: 'proposals', label: 'Invoice Studio', icon: FileSpreadsheet },
    { id: 'vault', label: 'Research Vault', icon: FolderKanban },
    { id: 'hud', label: 'Cyber HUD', icon: Radio },
    { id: 'api', label: 'Billing & API', icon: Key },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between items-start w-16 hover:w-56 h-screen bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80 py-4 pb-8 px-3 fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out group shadow-2xl overflow-hidden print:hidden">
      <div className="flex flex-col items-start gap-4 w-full">
        {/* Top Anchor: ONLY THE LOGO - NO OVERLAPPING TEXT */}
        <div className="flex items-center justify-center w-10 h-10 shrink-0 px-1">
          <StudioLogo className="w-8 h-8" />
        </div>

        <div className="w-full h-px bg-slate-900" />

        {/* Navigation Tool List with Hover Labels */}
        <nav className="flex flex-col gap-1.5 w-full">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDividerBefore = idx === 3 || idx === 6;

            return (
              <React.Fragment key={item.id}>
                {isDividerBefore && (
                  <div className="w-full h-px bg-slate-900 my-1" />
                )}
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full h-10 px-2 rounded-xl flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
                      : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center w-6">
                    <Icon className="w-5 h-5" />
                    {item.locked && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[8px]">
                        <Lock className="w-2 h-2" />
                      </span>
                    )}
                  </div>

                  {/* Tool Name Tag */}
                  <span className="font-mono text-xs tracking-wide hidden group-hover:inline-block transition-all duration-200 whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-950 hidden group-hover:block transition-all" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Billing Actions */}
      <div className="flex flex-col items-start gap-2 w-full pt-4 border-t border-slate-900">
        <button
          onClick={onOpenBilling}
          className={`w-full h-10 px-2 rounded-xl flex items-center gap-3 transition-all ${
            activeTab === 'api'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30'
              : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <div className="shrink-0 flex items-center justify-center w-6">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs font-bold hidden group-hover:inline-block transition-all duration-200 whitespace-nowrap">
            Top Up Credits
          </span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full h-10 px-2 rounded-xl flex items-center gap-3 transition-all text-slate-500 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800"
        >
          <div className="shrink-0 flex items-center justify-center w-6">
            <Settings className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs hidden group-hover:inline-block transition-all duration-200 whitespace-nowrap">
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
}