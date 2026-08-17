'use client';

import { useState } from 'react';
import { 
  Film, 
  Bot, 
  PhoneCall, 
  Key, 
  CreditCard, 
  Settings, 
  Sparkles 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBilling: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenBilling }: SidebarProps) {
  const navItems = [
    { id: 'reel', label: 'Reel Engine', icon: Film },
    { id: 'agent', label: 'Sales Agent', icon: Bot },
    { id: 'voice', label: 'Voice Call', icon: PhoneCall },
    { id: 'keys', label: 'API Keys', icon: Key },
  ];

  return (
    <aside className="w-16 h-screen bg-slate-950 border-r border-slate-900 flex flex-col justify-between items-center py-4 fixed left-0 top-0 z-50">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
          <Sparkles className="w-5 h-5" />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions (Billing & Settings) */}
      <div className="flex flex-col gap-3">
        {/* Top-up Billing Trigger */}
        <button
          onClick={onOpenBilling}
          title="Top-Up Credits"
          className="w-10 h-10 rounded-xl text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center transition-all"
        >
          <CreditCard className="w-5 h-5" />
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setActiveTab('settings')}
          title="Settings"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-cyan-500 text-slate-950'
              : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-900'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}