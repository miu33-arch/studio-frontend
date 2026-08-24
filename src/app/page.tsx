'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown, Video, Bot, PhoneCall, Key, User,
  Play, Loader2, CheckCircle2, AlertCircle, Download, Clock, Film, Palette,
  Copy, Check, CreditCard, Send, Settings, Activity, ShieldCheck, Cpu,
  FolderKanban, FileText, Plus, FileCheck, Printer, Calendar, Box, Layers,
  Eye, Search, ExternalLink, Crown, Globe, Lock, Hand, Radio,
  FileSpreadsheet, Scan, Share2
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import CadViewer3D from '@/components/CadViewer3D';
import { LowCreditBanner } from '@/components/LowCreditBanner';
import { UserSettingsModal } from '@/components/UserSettingsModal';
import UserAccountPill from '@/components/UserAccountPill';

// Modular Cyber-Architectural Suite Components
import SpatialGestureSandbox from '@/components/sandbox/SpatialGestureSandbox';
import CyberHudDashboard from '@/components/dashboard/CyberHudDashboard';
import ProposalInvoiceStudio from '@/components/studio/ProposalInvoiceStudio';
import LidarMeshInspector from '@/components/lidar/LidarMeshInspector';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://api.miu33archstudio.xyz");

interface JobStatus {
  jobId: string;
  state: 'queued' | 'active' | 'completed' | 'failed';
  result?: { videoUrl?: string };
  error?: string;
}

interface ChatMessage {
  sender: 'AGENT' | 'USER';
  text: string;
}

export default function StudioDashboard() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{ apiKey: string; credits: number; isPaid?: boolean; tier?: string } | null>(null);

  const [activeTab, setActiveTab] = useState<
    'reels' | 'sales' | 'sandbox' | 'hud' | 'lidar' | 'proposals' | 'voice' | 'vault' | 'bim' | 'api' | 'settings'
  >('reels');
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [stylePreset, setStylePreset] = useState<string>('cyberpunk');
  const [loading, setLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [salesMessages, setSalesMessages] = useState<ChatMessage[]>([
    { sender: 'AGENT', text: 'PERSONA:// SYNAPSE_PACT Gateway Active. Transmit deal parameters, specification loads, or architectural scope.' }
  ]);
  const [salesInput, setSalesInput] = useState('');
  const [salesLoading, setSalesLoading] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [campaignType, setCampaignType] = useState('Lead Qualifying & Appointment Booking');
  const [voicePrompt, setVoicePrompt] = useState(
    'You are the AI Project Director for MIU Studio. Deliver updates accurately, concisely, and professionally.'
  );
  const [voiceDispatching, setVoiceDispatching] = useState(false);

  // Proposal Engine & Vault States
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [customScope, setCustomScope] = useState('');
  const [proposalBudget, setProposalBudget] = useState(150000);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalResult, setProposalResult] = useState<any>(null);
  const [savedProposals, setSavedProposals] = useState<any[]>([]);

  // Tavily Live Web Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Archicad & Tapir BIM States
  const [bimAction, setBimAction] = useState('render_viewport');
  const [bimElementType, setBimElementType] = useState('Wall');
  const [bimMoodPreset, setBimMoodPreset] = useState('cyber_dusk');
  const [customBimPrompt, setCustomBimPrompt] = useState('');
  const [bimExecuting, setBimExecuting] = useState(false);
  const [bimOutput, setBimOutput] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  const isPaidUser = Boolean(clientData?.isPaid || (clientData?.tier === 'PRO') || (clientData?.credits && clientData.credits > 100));
  const isAdmin = user?.email === 'padillaanamy83@gmail.com';

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const activeApiKey = clientData?.apiKey || '';

    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'x-api-key': activeApiKey,
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchClientDetails(data.session.user.id);
        fetchSavedProposals(data.session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClientDetails(session.user.id);
        fetchSavedProposals(session.user.id);
      }
    });

    if (typeof window !== 'undefined' && window.location.search.includes('payment=success')) {
      supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
        if (data.session?.user) {
          setTimeout(() => {
            fetchClientDetails(data.session.user.id);
          }, 1200);
          alert('🎉 Payment verified! Your API credits and Pro status have been synchronized.');
        }
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchClientDetails = async (userId: string) => {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('api_key, credit_balance')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('credit_balance, tier')
        .eq('id', userId)
        .maybeSingle();

      const activeCredits = client?.credit_balance ?? profile?.credit_balance ?? 20;
      const isPaid = profile?.tier === 'PRO' || activeCredits > 100;

      setClientData({
        apiKey: client?.api_key || `miu_live_${userId.slice(0, 8)}`,
        credits: activeCredits,
        isPaid: isPaid,
        tier: profile?.tier || (isPaid ? 'PRO' : 'FREE'),
      });
    } catch (err) {
      console.error('Error fetching client details:', err);
      setClientData({
        apiKey: `miu_live_${userId.slice(0, 8)}`,
        credits: 20,
        isPaid: false,
        tier: 'FREE',
      });
    }
  };

  const fetchSavedProposals = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        client_name,
        project_title,
        budget_php,
        status,
        created_at,
        proposals (
          id,
          scope_summary,
          total_amount,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setSavedProposals(data);
    }
  };

  useEffect(() => {
    if (!currentJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/job/${currentJobId}`);
        if (!res.ok) return;

        const data: JobStatus = await res.json();
        setJobStatus(data);

        if (data.state === 'completed' || data.state === 'failed') {
          setLoading(false);
          clearInterval(interval);
          if (user) fetchClientDetails(user.id);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentJobId, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else alert('Account created! 20 Starter credits granted. Sign in to access your dashboard.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
    setUser(null);
    setClientData(null);
    setSavedProposals([]);
    setProposalResult(null);
    setBimOutput(null);
    setSearchResults([]);
    setIsSettingsOpen(false);
  };

  const handleBuyCredits = async (packageType: string) => {
    if (!user) return;
    setBuyingCredits(packageType);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/billing/paymongo-checkout`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: user.id,
          creditPackage: packageType,
        }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Failed to initialize checkout session.');
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation error.');
      setBuyingCredits(null);
    }
  };

  const handleBuyGlobalCredits = async (packageType: string) => {
    if (!user) return;
    setBuyingCredits(packageType);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/billing/polar-checkout`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          creditPackage: packageType,
        }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Failed to initialize Polar global checkout session.');
      }
    } catch (err: any) {
      alert(err.message || 'Global payment initiation error.');
      setBuyingCredits(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const REQUIRED_CREDITS = 25;
    if ((clientData?.credits ?? 0) < REQUIRED_CREDITS) {
      setError(`Insufficient credits. Reel synthesis requires ${REQUIRED_CREDITS} credits. Please top up to continue.`);
      setActiveTab('api');
      return;
    }

    setLoading(true);
    setError(null);
    setJobStatus(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          topic: prompt,
          duration,
          aspectRatio,
          stylePreset
        }),
      });

      const data = await res.json();

      if (res.ok && data?.jobId) {
        const idStr = String(data.jobId);
        setCurrentJobId(idStr);
        setJobStatus({ jobId: idStr, state: 'queued' });
        if (data.remainingCredits !== undefined && clientData) {
          setClientData({ ...clientData, credits: data.remainingCredits });
        } else if (user) {
          fetchClientDetails(user.id);
        }
      } else {
        throw new Error(data?.error || 'Failed to initialize job.');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting job.');
      setLoading(false);
    }
  };

  const handleBroadcastOnly = async () => {
    if (!isAdmin) {
      alert("🔒 Access Restricted: Social broadcasting is strictly reserved for the Studio Administrator.");
      return;
    }

    if (!prompt.trim()) {
      alert("Please enter a story topic or prompt to broadcast.");
      return;
    }

    setIsBroadcasting(true);
    try {
      const targetVideoUrl = jobStatus?.result?.videoUrl || "https://miu33archstudio.xyz/preview_sample.mp4";
      const authHeaders = await getAuthHeaders();

      const res = await fetch(`${API_BASE}/api/social/broadcast`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title: prompt,
          videoUrl: targetVideoUrl,
          platforms: [
            "youtube",
            "tiktok",
            "instagram",
            "linkedin",
            "x",
            "google_business_profile"
          ],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("⚡ Autonomous Reel Campaign generated and queued across all connected social channels!");
      } else {
        alert(`Broadcast notice: ${data.error || "Queued in local autonomous dispatch buffer."}`);
      }
    } catch (err: any) {
      console.error("Broadcast failed:", err);
      alert("Failed to reach social broadcast endpoint.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSendSalesMessage = async () => {
    if (!salesInput.trim() || salesLoading) return;

    const userText = salesInput;
    setSalesInput('');
    const updatedMessages = [...salesMessages, { sender: 'USER' as const, text: userText }];
    setSalesMessages(updatedMessages);
    setSalesLoading(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/sales-agent/chat`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          message: userText,
          conversationHistory: updatedMessages.slice(0, -1),
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setSalesMessages((prev) => [...prev, { sender: 'AGENT', text: data.reply }]);
        if (data.remainingCredits !== undefined && clientData) {
          setClientData({ ...clientData, credits: data.remainingCredits });
        }
      } else {
        setSalesMessages((prev) => [...prev, { sender: 'AGENT', text: `Error: ${data.error || 'Failed to get response.'}` }]);
      }
    } catch (err) {
      console.error('Sales chat error:', err);
      setSalesMessages((prev) => [...prev, { sender: 'AGENT', text: 'Server connection error.' }]);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleTriggerVoiceCall = async () => {
    if (!isPaidUser) {
      alert('🔒 Outbound Voice Calling is locked to Pro accounts. Please top up API credits to unlock Bland AI telephony.');
      setActiveTab('api');
      return;
    }

    if (!phoneNumber.trim()) return alert('Please enter a phone number.');

    setVoiceDispatching(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/voice/dispatch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ phoneNumber, campaignType, taskPrompt: voicePrompt }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`🚀 ${data.message}`);
        if (data.remainingCredits !== undefined && clientData) {
          setClientData({ ...clientData, credits: data.remainingCredits });
        }
      } else {
        alert(`❌ Dispatch Failed: ${data.error || 'Server error.'}`);
      }
    } catch (err) {
      console.error('Voice dispatch error:', err);
      alert('Server connection error.');
    } finally {
      setVoiceDispatching(false);
    }
  };

  const handleGenerateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectTitle.trim()) return alert('Client name and project title required.');

    setGeneratingProposal(true);

    const parsedDeliverables = customScope
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/proposals/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          clientName,
          projectTitle,
          budget: Number(proposalBudget),
          deliverables: parsedDeliverables.length > 0 ? parsedDeliverables : undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProposalResult(data.proposal);
        if (data.remainingCredits !== undefined && clientData) {
          setClientData({ ...clientData, credits: data.remainingCredits });
        }
        if (user) {
          fetchSavedProposals(user.id);
        }
      } else {
        alert(`❌ Proposal Error: ${data.error || 'Failed to generate proposal.'}`);
      }
    } catch (err) {
      console.error('Proposal error:', err);
      alert('Server connection error.');
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/vault/search`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setSearchResults(data.results);
        if (data.remainingCredits !== undefined && clientData) {
          setClientData({ ...clientData, credits: data.remainingCredits });
        }
      } else {
        alert(`❌ Search Error: ${data.error || 'Failed to search.'}`);
      }
    } catch (err) {
      console.error('Tavily search error:', err);
      alert('Server connection error while searching.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleExecuteBim = async () => {
    setBimExecuting(true);
    setBimOutput(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/archicad/execute`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action: bimAction,
          parameters: {
            elementType: bimElementType,
            moodPreset: bimMoodPreset,
            customPrompt: customBimPrompt,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBimOutput(data.result);
        if (data.remainingCredits !== undefined && clientData) {
          setClientData({ ...clientData, credits: data.remainingCredits });
        }
        if (data.result?.imageUrl) {
          setViewMode('2d');
        }
      } else {
        alert(`❌ Archicad Error: ${data.error || 'Failed to execute command.'}`);
      }
    } catch (err) {
      console.error('BIM command error:', err);
      alert('Server connection error.');
    } finally {
      setBimExecuting(false);
    }
  };

  const copyApiKey = () => {
    if (clientData?.apiKey) {
      navigator.clipboard.writeText(clientData.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

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

  const workspaceCategories = [
    {
      title: "AI ENGINES",
      items: [
        { id: "reels", label: "Reel Engine", desc: "Multi-scene AI video synthesis", icon: Video },
        { id: "sales", label: "Sales Agent", desc: "SYNAPSE_PACT negotiation", icon: Bot },
        { id: "voice", label: "Voice Dispatch", desc: "Bland AI telephony calling", icon: PhoneCall, locked: !isPaidUser },
      ],
    },
    {
      title: "SPATIAL & BIM",
      items: [
        { id: "sandbox", label: "3D Sandbox", desc: "Touchless air-gesture control", icon: Hand },
        { id: "lidar", label: "LiDAR Inspector", desc: "Layer isolation & spatial calipers", icon: Scan },
        { id: "bim", label: "BIM Engine", desc: "Archicad bridge & 4K synthesis", icon: Box },
      ],
    },
    {
      title: "BUSINESS & TELEMETRY",
      items: [
        { id: "proposals", label: "Invoicing Studio", desc: "Dynamic scope & live A4 print", icon: FileSpreadsheet },
        { id: "vault", label: "Research Vault", desc: "Tavily precedent search & records", icon: FolderKanban },
        { id: "hud", label: "Cyber HUD", desc: "Live node health & stream logs", icon: Radio },
        { id: "api", label: "Billing & API", desc: "Credit balance & Polar checkout", icon: Key },
      ],
    },
  ];

  const currentActiveItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentActiveIcon = currentActiveItem.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans print:bg-white print:text-black">
      {/* Expandable Cyber Dock Sidebar */}
      {user && (
        <aside className="hidden md:flex flex-col justify-between items-start w-16 hover:w-56 h-screen bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80 py-4 pb-12 px-3 fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out group shadow-2xl overflow-hidden print:hidden">
          <div className="flex flex-col items-start gap-4 w-full">
            {/* Top Anchor Element */}
            <div className="flex items-center gap-3 w-full h-10 px-1">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-black text-sm shrink-0 shadow-lg shadow-cyan-500/20">
                M
              </div>
              <div className="font-mono text-xs hidden group-hover:block transition-all duration-200 whitespace-nowrap overflow-hidden">
                <p className="font-bold text-white tracking-wider">MIU_33</p>
                <p className="text-[9px] text-cyan-400">STUDIO COCKPIT</p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-900" />

            {/* Navigation Tool List */}
            <nav className="flex flex-col gap-1 w-full">
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
                      type="button"
                      onClick={() => setActiveTab(item.id as any)}
                      className={`relative w-full h-9 px-2 rounded-xl flex items-center gap-3 transition-all ${isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
                          : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-900'
                        }`}
                    >
                      <div className="relative shrink-0 flex items-center justify-center w-6">
                        <Icon className="w-4 h-4" />
                        {item.locked && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[8px]">
                            <Lock className="w-2 h-2" />
                          </span>
                        )}
                      </div>

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
          <div className="flex flex-col items-start gap-1.5 w-full pt-3 border-t border-slate-900">
            <button
              onClick={() => setActiveTab('api')}
              className={`w-full h-9 px-2 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'api'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30'
                  : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20'
                }`}
            >
              <div className="shrink-0 flex items-center justify-center w-6">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs font-bold hidden group-hover:inline-block transition-all duration-200 whitespace-nowrap">
                Top Up Credits
              </span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full h-9 px-2 rounded-xl flex items-center gap-3 transition-all text-slate-500 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800"
            >
              <div className="shrink-0 flex items-center justify-center w-6">
                <Settings className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs hidden group-hover:inline-block transition-all duration-200 whitespace-nowrap">
                Settings
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className={`flex-1 flex flex-col items-center p-4 md:p-6 print:p-0 ${user ? 'md:pl-20 print:pl-0' : 'p-4'}`}>
        {/* Command Breadcrumb Header */}
        <header className="w-full max-w-6xl flex items-center justify-between py-3 border-b border-slate-800/80 gap-4 print:hidden relative z-40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-100">
              <span className="text-cyan-400">MIU_33</span>
              <span className="text-slate-700 select-none">/</span>
              {isPaidUser && (
                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>

            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-mono text-slate-200 transition-all shadow-md backdrop-blur-md group"
                >
                  <CurrentActiveIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-white tracking-wide">{currentActiveItem.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ${isWorkspaceMenuOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Mega Command Menu Flyout */}
                {isWorkspaceMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsWorkspaceMenuOpen(false)}
                    />

                    <div className="absolute left-0 top-11 z-40 w-[90vw] max-w-2xl bg-slate-950/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl grid grid-cols-1 md:grid-cols-3 gap-4 font-mono animate-in fade-in zoom-in-95 duration-150">
                      {workspaceCategories.map((cat, catIdx) => (
                        <div key={catIdx} className="space-y-2">
                          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider px-2 border-b border-slate-900 pb-1">
                            {cat.title}
                          </p>
                          <div className="space-y-1">
                            {cat.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isActive = activeTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab(item.id as any);
                                    setIsWorkspaceMenuOpen(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-all group ${isActive
                                      ? "bg-cyan-500 text-slate-950 font-bold"
                                      : "hover:bg-slate-900/90 text-slate-300 hover:text-white"
                                    }`}
                                >
                                  <ItemIcon
                                    className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-slate-950" : "text-cyan-400 group-hover:scale-110 transition-transform"
                                      }`}
                                  />
                                  <div>
                                    <div className="text-[11px] font-bold flex items-center gap-1.5">
                                      <span>{item.label}</span>
                                      {item.locked && (
                                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                                      )}
                                    </div>
                                    <p
                                      className={`text-[9px] leading-tight line-clamp-1 ${isActive ? "text-slate-900/80" : "text-slate-500"
                                        }`}
                                    >
                                      {item.desc}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: User Status Widget */}
          {user ? (
            <div className="flex items-center gap-3 font-mono">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE</span>
              </div>

              <UserAccountPill
                user={user}
                clientData={clientData}
                isPaidUser={isPaidUser}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSignOut={handleSignOut}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full font-mono">
              <User className="w-3.5 h-3.5 text-cyan-400" /> AUTH REQUIRED
            </div>
          )}
        </header>

        {/* Live Metrics */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mt-6 print:hidden">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">Gateway Latency</p>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">12ms (Optimal)</p>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">CORS Domain</p>
                <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">miu33archstudio.xyz</p>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-xl text-indigo-400">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">Archicad Bridge</p>
                <p className="text-xs font-mono font-bold text-indigo-400 mt-0.5">Tapir MCP Ready</p>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">Render Queue</p>
                <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">BullMQ + Redis Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Panels */}
        {!user ? (
          <div className="w-full max-w-md mt-16 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl flex flex-col gap-6 shadow-2xl shadow-cyan-500/5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-100">
                {isSignUp ? 'Create Studio Account' : 'Sign In to Dashboard'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Access your API keys, AI agents, and 20 starter credits.</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 pr-10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                {isSignUp ? 'Sign Up & Get 20 Free Credits' : 'Sign In'}
              </button>
            </form>

            {authError && <p className="text-xs text-rose-400 text-center">{authError}</p>}

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors text-center"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        ) : (
          <section className="w-full max-w-5xl mt-6 print:mt-0 print:max-w-none">
            {/* 1. Spatial Gesture 3D Sandbox */}
            {activeTab === 'sandbox' && <SpatialGestureSandbox />}

            {/* 2. Cyber-Brutalist HUD Dashboard */}
            {activeTab === 'hud' && <CyberHudDashboard />}

            {/* 3. 3D LiDAR & Mesh Inspector */}
            {activeTab === 'lidar' && <LidarMeshInspector />}

            {/* 4. Instant Proposal & Invoice Studio */}
            {activeTab === 'proposals' && <ProposalInvoiceStudio />}

            {/* 5. AI Reel Synthesis Engine */}
            {activeTab === 'reels' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-5 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-cyan-500/5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-200">New Generation Parameters</h2>
                    <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> DUAL FLYWHEEL ACTIVE
                    </span>
                  </div>

                  <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-slate-400 uppercase">Story Topic / Prompt</label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Modern minimalist villa with infinity pool under twilight rain..."
                        className="w-full h-24 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> Target Duration
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '15 Secs', value: 15 },
                          { label: '30 Secs', value: 30 },
                          { label: '60 Secs (1 Min)', value: 60 },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setDuration(item.value)}
                            disabled={loading}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-all ${duration === item.value
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm'
                                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-cyan-400" /> Aspect Ratio
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '9:16 Reel', value: '9:16' },
                          { label: '16:9 Cinema', value: '16:9' },
                          { label: '1:1 Square', value: '1:1' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setAspectRatio(item.value as any)}
                            disabled={loading}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-all ${aspectRatio === item.value
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm'
                                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-cyan-400" /> Visual Style
                      </label>
                      <select
                        value={stylePreset}
                        onChange={(e) => setStylePreset(e.target.value)}
                        disabled={loading}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="cyberpunk">Cyberpunk / Neon City</option>
                        <option value="cinematic">Photorealistic Cinematic</option>
                        <option value="anime">Dark Anime / Graphic Novel</option>
                        <option value="3d-render">3D Unreal Engine 5 Render</option>
                        <option value="vintage">1980s Vintage Film</option>
                      </select>
                    </div>

                    {/* Execution Actions */}
                    <div className="flex flex-col gap-2.5 mt-2">
                      <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing {duration}s Pipeline via fal.ai...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Generate Reel (25 Credits)</span>
                          </>
                        )}
                      </button>

                      {/* Admin-Only Multi-Channel Broadcast Trigger */}
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={handleBroadcastOnly}
                          disabled={loading || isBroadcasting || !prompt.trim()}
                          className="w-full py-2.5 bg-linear-to-r from-cyan-950/60 to-slate-900 hover:from-cyan-900/40 hover:to-slate-800 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          {isBroadcasting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Broadcasting Campaign...</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Auto-Generate & Broadcast to Studio Socials (Admin)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 bg-slate-950/50 border border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-slate-600" /> Studio Multi-Broadcast
                          </span>
                          <span className="text-[10px] text-slate-600">Admin Managed</span>
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Connected Broadcast Targets */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                    <span>Active Channels:</span>
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <span>YT Shorts</span> • <span>TikTok</span> • <span>IG</span> • <span>LinkedIn</span> • <span>X</span> • <span>Google Business</span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl justify-between shadow-xl">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">Execution Feed</h2>

                    {!jobStatus && !loading && (
                      <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-950/30">
                        <p className="text-xs">No active job submitted.</p>
                        <p className="text-[10px] text-slate-600">Select options and trigger the multi-scene pipeline.</p>
                      </div>
                    )}

                    {jobStatus && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                          <span className="text-xs font-mono text-slate-400">
                            JOB ID: #{String(jobStatus?.jobId || '').slice(0, 8)}
                          </span>

                          {jobStatus.state === 'queued' && (
                            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Queued
                            </span>
                          )}
                          {jobStatus.state === 'active' && (
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Rendering {duration}s Pipeline
                            </span>
                          )}
                          {jobStatus.state === 'completed' && (
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                          {jobStatus.state === 'failed' && (
                            <span className="text-xs font-semibold text-rose-400 bg-rose-400/10 border border-rose-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </div>

                        {(jobStatus.state === 'queued' || jobStatus.state === 'active') && (
                          <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-center flex flex-col gap-1">
                            <p className="text-xs font-mono text-cyan-300">
                              ⚡ <span className="text-cyan-400 font-semibold">Synthesizing {duration}s Reel:</span> Pipeline takes ~2–3 minutes.
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              Rendering is processing in the background. You can stay here or return shortly to download your MP4.
                            </p>
                          </div>
                        )}

                        {jobStatus.state === 'completed' && jobStatus.result?.videoUrl && (
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black aspect-9/16 max-h-80 mx-auto w-full shadow-2xl">
                              <video
                                src={jobStatus.result.videoUrl}
                                controls
                                autoPlay
                                loop
                                className="w-full h-full object-contain"
                              />
                              {!isPaidUser && (
                                <div className="absolute top-4 right-4 z-20 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 px-2.5 py-1 rounded-lg pointer-events-none shadow-lg">
                                  <p className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
                                    MIU ARCH ENGINE
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                              <a
                                href={jobStatus.result.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download MP4</span>
                              </a>

                              {isAdmin && (
                                <button
                                  onClick={handleBroadcastOnly}
                                  disabled={isBroadcasting}
                                  className="py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Broadcast Socials</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-4 flex items-center justify-between">
                    <span>Stack: Express API ➔ BullMQ ➔ fal.ai ➔ Supabase</span>
                    <span className="text-cyan-400/80 font-bold">Auto-Sales AI: ONLINE</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SYNAPSE_PACT Sales Agent */}
            {activeTab === 'sales' && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
                <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                  <Bot className="w-5 h-5" /> SYNAPSE_PACT Sales & Negotiation Telemetry
                </h2>
                <p className="text-xs text-slate-400">Autonomous deal architect with strict margin defense and reverse verification.</p>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 h-80 flex flex-col justify-between">
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                    {salesMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-xs font-mono p-3 rounded-lg border max-w-lg ${msg.sender === 'USER'
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 ml-auto'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300'
                          }`}
                      >
                        <span className="text-[10px] text-slate-500 block mb-1">{msg.sender}:</span>
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                    <input
                      type="text"
                      value={salesInput}
                      onChange={(e) => setSalesInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendSalesMessage()}
                      placeholder="Enter deal terms or test margin defense..."
                      className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                      disabled={salesLoading}
                    />
                    <button
                      onClick={handleSendSalesMessage}
                      disabled={salesLoading || !salesInput.trim()}
                      className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20 font-mono"
                    >
                      {salesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Bland AI Telephony Voice Tab */}
            {activeTab === 'voice' && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    <PhoneCall className="w-5 h-5" /> Outbound AI Voice Agent Dispatch
                  </h2>
                  {!isPaidUser && (
                    <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                      🔒 PRO TIER EXCLUSIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Dispatch low-latency Bland AI voice agents for live qualification calls (10 Credits/min).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+63 / +966 / +1..."
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                  />
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                  >
                    <option value="Lead Qualifying & Appointment Booking">Lead Qualifying & Appointment Booking</option>
                    <option value="Post-Purchase Survey">Post-Purchase Survey</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    Custom Voice Directive / Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={voicePrompt}
                    onChange={(e) => setVoicePrompt(e.target.value)}
                    placeholder="Enter voice instructions, persona, and qualification questions..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all resize-none font-mono"
                  />
                </div>

                <button
                  onClick={handleTriggerVoiceCall}
                  disabled={voiceDispatching}
                  className="py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {voiceDispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Voice Agent...</span>
                    </>
                  ) : (
                    <span>{isPaidUser ? "Trigger AI Voice Dispatch" : "Unlock Voice Calling via Pro"}</span>
                  )}
                </button>
              </div>
            )}

            {/* 8. Client Vault & Search Tab */}
            {activeTab === 'vault' && (
              <div className="flex flex-col gap-8">
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl print:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Search className="w-4 h-4 text-cyan-400" /> Live AI Architecture & Web Precedent Search
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Autonomous research engine for building codes, material specs, and architectural precedents.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                      Tavily Live Crawler
                    </span>
                  </div>

                  <form onSubmit={handleSemanticSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Modern minimalist villa cantilever floor details or Philippine building code setbacks..."
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                    />
                    <button
                      type="submit"
                      disabled={searchLoading || !searchQuery.trim()}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                    >
                      {searchLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Search Web</span>
                    </button>
                  </form>

                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {searchResults.map((item) => (
                        <a
                          key={item.id}
                          href={item.source_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex flex-col justify-between gap-2.5 transition-all group cursor-pointer shadow-lg"
                        >
                          {item.image_url && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div>
                            <div className="flex justify-between items-start mt-1 gap-2">
                              <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {item.title}
                              </p>
                              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded shrink-0">
                                {(item.similarity * 100).toFixed(0)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed mt-1">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between pt-2 border-t border-slate-900 mt-auto">
                            <span>{item.element_type}</span>
                            <span className="text-slate-500 flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
                              <span className="truncate max-w-25">{item.mood_preset}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block">
                  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-5 shadow-xl print:hidden">
                    <div>
                      <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Interactive Proposal Generator
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Generate white-labeled client proposals & retainer scopes instantly.</p>
                    </div>

                    <form onSubmit={handleGenerateProposal} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Client / Organization Name</label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Nexus Architecture Studio"
                          className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Project Title / Scope</label>
                        <input
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          placeholder="e.g. Commercial Complex 3D Visualization"
                          className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Custom Scope Deliverables (1 per line)</label>
                        <textarea
                          value={customScope}
                          onChange={(e) => setCustomScope(e.target.value)}
                          placeholder="Exterior 3D Photorealistic Renderings&#10;Next.js Client Presentation Portal&#10;PayMongo Payment Gateway Integration&#10;PostgreSQL Database Vault Configuration"
                          className="w-full h-24 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Total Budget Scope (PHP ₱)</label>
                        <input
                          type="number"
                          value={proposalBudget}
                          onChange={(e) => setProposalBudget(Number(e.target.value))}
                          className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={generatingProposal || !clientName.trim() || !projectTitle.trim()}
                        className="w-full py-3 mt-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                      >
                        {generatingProposal ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Compiling Custom Proposal...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Generate Proposal Record</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between shadow-xl print:border-none print:bg-white print:text-black print:p-0 print:shadow-none print:w-full">
                    <div>
                      <div className="flex items-center justify-between mb-4 print:hidden">
                        <h2 className="text-lg font-semibold text-slate-200">Active Document Preview</h2>
                        {proposalResult && (
                          <button
                            onClick={() => window.print()}
                            className="p-2 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
                            title="Print / Save PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print PDF</span>
                          </button>
                        )}
                      </div>

                      {!proposalResult ? (
                        <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-950/30">
                          <FolderKanban className="w-8 h-8 text-slate-600 mb-1" />
                          <p className="text-xs">No proposal generated yet.</p>
                          <p className="text-[10px] text-slate-600">Enter client parameters on the left to compile a custom scope deck.</p>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden p-6 bg-slate-950/90 border border-cyan-500/30 rounded-xl flex flex-col gap-5 shadow-lg shadow-cyan-500/5 print:border print:border-slate-300 print:bg-white print:text-slate-900 print:shadow-none">
                          {!isPaidUser && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-15 rotate-[-25deg]">
                              <p className="text-3xl md:text-5xl font-mono font-black text-cyan-500 print:text-slate-400 uppercase tracking-widest text-center">
                                GENERATED AT MIU ARCH ENGINE // PREVIEW SCOPE
                              </p>
                            </div>
                          )}

                          <div className="border-b border-slate-800 print:border-slate-300 pb-4 relative z-20">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[10px] font-mono text-cyan-400 print:text-slate-600 uppercase tracking-widest">
                                  MIU STUDIO // ARCHITECTURAL DIGITAL INFRASTRUCTURE
                                </p>
                                <h1 className="text-lg font-bold text-slate-100 print:text-slate-900 mt-1">
                                  {proposalResult.projectTitle}
                                </h1>
                                <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                                  Client / Recipient: <span className="font-semibold text-slate-200 print:text-slate-900">{proposalResult.clientName}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-mono font-bold text-emerald-400 print:text-emerald-700 bg-emerald-400/10 print:bg-emerald-50 border border-emerald-400/30 px-2.5 py-1 rounded">
                                  {proposalResult.status}
                                </span>
                                <p className="text-[10px] font-mono text-slate-500 print:text-slate-600 mt-1">
                                  Ref: #{proposalResult.id}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-20">
                            <p className="text-[10px] font-mono text-slate-500 print:text-slate-700 uppercase tracking-wider mb-2 font-bold">
                              Scope Deliverables & Specifications:
                            </p>
                            <ul className="text-xs text-slate-300 print:text-slate-800 flex flex-col gap-2">
                              {proposalResult.scopeItems?.map((item: string, i: number) => (
                                <li key={i} className="flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-cyan-400 print:text-slate-700 shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="border-t border-slate-800 print:border-slate-300 pt-4 flex justify-between items-center relative z-20">
                            <div>
                              <p className="text-[10px] font-mono text-slate-500 print:text-slate-600 uppercase">Commercial Investment</p>
                              <p className="text-xs text-slate-400 print:text-slate-500">Terms: 50% upfront, 50% upon deployment</p>
                            </div>
                            <span className="text-lg font-bold text-emerald-400 print:text-emerald-700 font-mono">
                              ₱{Number(proposalResult.budget).toLocaleString()} PHP
                            </span>
                          </div>

                          <button
                            onClick={() => window.print()}
                            className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-2 print:hidden relative z-20"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export / Print Scope PDF</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-4 mt-4 print:hidden">
                      Infrastructure: Supabase RLS ➔ Express Gateway ➔ PayMongo Invoice Engine
                    </div>
                  </div>
                </div>

                {/* History Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-4 shadow-xl print:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-cyan-400" /> Vault Project Records & Historical Proposals
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Persisted directly across your Supabase database schema.</p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                      {savedProposals.length} Projects Stored
                    </span>
                  </div>

                  {savedProposals.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                      No saved proposals found in your vault yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {savedProposals.map((proj) => {
                        const rawScope = proj.proposals?.[0]?.scope_summary || '';
                        const parsedScopeItems = rawScope.includes('|')
                          ? rawScope.split('|').map((s: string) => s.trim())
                          : [rawScope || proj.project_title];

                        return (
                          <div key={proj.id} className="p-4 bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl flex flex-col justify-between gap-3 transition-all">
                            <div>
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-200">{proj.project_title}</p>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                  {proj.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Client: {proj.client_name}</p>
                              <p className="text-xs font-mono text-emerald-400 font-bold mt-2">
                                ₱{Number(proj.budget_php).toLocaleString()} PHP
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(proj.created_at).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => {
                                  setProposalResult({
                                    id: proj.id.slice(0, 8).toUpperCase(),
                                    clientName: proj.client_name,
                                    projectTitle: proj.project_title,
                                    budget: proj.budget_php,
                                    status: "APPROVED / READY",
                                    scopeItems: parsedScopeItems,
                                    createdAt: proj.created_at
                                  });
                                }}
                                className="text-cyan-400 hover:underline"
                              >
                                Load Deck ➔
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 9. Archicad + Tapir BIM Engine Tab */}
            {activeTab === 'bim' && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    <Box className="w-5 h-5" /> Architectural Design Configurator & BIM Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Customize materials, atmosphere presets, isolate BIM structural elements, and generate 4K renders (-10 Credits).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> Pipeline Action
                    </label>
                    <select
                      value={bimAction}
                      onChange={(e) => setBimAction(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="render_viewport">3D Viewport + 4K AI Render</option>
                      <option value="get_elements">Extract BIM Elements & Spec Counts</option>
                      <option value="generate_geometry">Generate Parametric Geometry</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> Target BIM Element
                    </label>
                    <select
                      value={bimElementType}
                      onChange={(e) => setBimElementType(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Wall">Perimeter Walls & Partitions</option>
                      <option value="Slab">Floor & Cantilever Slabs</option>
                      <option value="Column">Structural Columns</option>
                      <option value="CurtainWall">Roof Trusses & Glazing</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" /> Atmosphere & Mood
                    </label>
                    <select
                      value={bimMoodPreset}
                      onChange={(e) => setBimMoodPreset(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="cyber_dusk">Obsidian Cyber Dusk (Neon / Rain)</option>
                      <option value="glass_luxury">Golden Hour Luxury Pavilion</option>
                      <option value="brutalist_concrete">Minimalist Brutalist Concrete</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleExecuteBim}
                      disabled={bimExecuting}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      {bimExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Synthesizing Viewport...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Synthesize Output</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 col-span-full pt-2 border-t border-slate-900">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">
                      Custom Design Directives (Optional)
                    </label>
                    <input
                      type="text"
                      value={customBimPrompt}
                      onChange={(e) => setCustomBimPrompt(e.target.value)}
                      placeholder="e.g. Add black cedar vertical cladding, warm recessed deck lights, and wet slate pavers..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-5 font-mono text-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('3d')}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${viewMode === '3d'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                      >
                        🎮 Interactive 3D BIM Viewport
                      </button>
                      <button
                        onClick={() => setViewMode('2d')}
                        disabled={!bimOutput?.imageUrl}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${viewMode === '2d'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-40'
                          }`}
                      >
                        🖼️ AI 4K Render
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20">
                      Target Element: {bimElementType}
                    </span>
                  </div>

                  <div className="relative w-full aspect-video max-h-105 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl mx-auto flex items-center justify-center">
                    {viewMode === '3d' ? (
                      <div className="relative w-full h-full">
                        <CadViewer3D
                          modelUrl={bimOutput?.modelUrl}
                          selectedElementTarget={bimElementType}
                          moodPreset={bimMoodPreset}
                          hasExecuted={!!bimOutput}
                        />
                        {!isPaidUser && (
                          <div className="absolute top-4 right-4 z-20 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-lg pointer-events-none shadow-xl">
                            <p className="text-[10px] font-mono font-bold text-cyan-400">
                              MIU ARCH ENGINE // PREVIEW
                            </p>
                          </div>
                        )}
                      </div>
                    ) : bimOutput?.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img
                          src={bimOutput.imageUrl}
                          alt="Archicad AI Render"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {!isPaidUser && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <div className="bg-slate-950/70 border border-cyan-500/40 backdrop-blur-sm px-6 py-3 rounded-2xl rotate-[-15deg] shadow-2xl">
                              <p className="text-xl md:text-2xl font-mono font-extrabold text-cyan-400 tracking-widest">
                                GENERATED AT MIU ARCH ENGINE
                              </p>
                              <p className="text-[10px] font-mono text-slate-300 text-center mt-0.5">
                                Upgrade to Pro to Export Clean 4K Visuals
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                        <span className="animate-pulse">No 4K render synthesized yet.</span>
                      </div>
                    )}
                  </div>

                  {bimOutput?.imageUrl && (
                    <a
                      href={bimOutput.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {isPaidUser ? "Clean High-Res 4K Visual (PNG)" : "Watermarked Visual (Upgrade for Clean PNG)"}</span>
                    </a>
                  )}

                  {bimOutput && (
                    <div className="mt-4 pt-4 border-t border-slate-900">
                      <pre className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg overflow-x-auto border border-slate-900">
                        {JSON.stringify(bimOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. API Keys & Billing Tab */}
            {activeTab === 'api' && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    <Key className="w-5 h-5" /> API Keys & Usage Metering
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Manage live client API keys and track credit deductions from Supabase.</p>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Your Active Studio API Key</p>
                    <p className="text-sm font-mono text-cyan-400 mt-1">{clientData?.apiKey || 'Generating key...'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Credit Balance</p>
                      <p className="text-sm font-mono text-emerald-400">{clientData?.credits ?? 0} Credits</p>
                    </div>
                    <button
                      onClick={copyApiKey}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-6 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" /> Top Up API Credits (PayMongo Local & Global Polar.sh)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Starter Pack */}
                    <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase font-mono">Starter Pack</p>
                        <p className="text-2xl font-bold text-slate-100 mt-1">₱1,000 <span className="text-xs text-slate-500 font-normal">/ $18 USD</span></p>
                        <p className="text-xs text-slate-400 mt-2">+500 API Credits • Removes Watermarks Across All Renders & Proposals.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleBuyCredits('500_credits')}
                          disabled={buyingCredits === '500_credits'}
                          className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          {buyingCredits === '500_credits' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>PayMongo (GCash / Cards)</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleBuyGlobalCredits('500_credits')}
                          disabled={buyingCredits === '500_credits'}
                          className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Global Polar ($18 USD)</span>
                        </button>
                      </div>
                    </div>

                    {/* Pro Scale Pack */}
                    <div className="p-5 bg-slate-950/80 border border-cyan-500/30 rounded-xl flex flex-col justify-between gap-4 relative overflow-hidden shadow-lg shadow-cyan-500/5">
                      <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-bl">
                        POPULAR
                      </div>
                      <div>
                        <p className="text-xs font-bold text-cyan-400 uppercase font-mono">Pro Scale Pack</p>
                        <p className="text-2xl font-bold text-slate-100 mt-1">₱3,000 <span className="text-xs text-slate-500 font-normal">/ $54 USD</span></p>
                        <p className="text-xs text-slate-400 mt-2">+2,000 API Credits • 100% White-Labeled & Priority GPU Queue.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleBuyCredits('2000_credits')}
                          disabled={buyingCredits === '2000_credits'}
                          className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          {buyingCredits === '2000_credits' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>PayMongo (GCash / Cards)</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleBuyGlobalCredits('2000_credits')}
                          disabled={buyingCredits === '2000_credits'}
                          className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Global Polar ($54 USD)</span>
                        </button>
                      </div>
                    </div>

                    {/* Studio Fleet Pack */}
                    <div className="p-5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex flex-col justify-between gap-4 relative overflow-hidden shadow-lg shadow-amber-500/5">
                      <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-bl">
                        FLEET
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-400 uppercase font-mono">Studio Fleet Pack</p>
                        <p className="text-2xl font-bold text-slate-100 mt-1">₱8,500 <span className="text-xs text-slate-500 font-normal">/ $150 USD</span></p>
                        <p className="text-xs text-slate-400 mt-2">+7,500 API Credits • Dedicated API Webhooks & High-Volume BIM Renders.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleBuyCredits('7500_credits')}
                          disabled={buyingCredits === '7500_credits'}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          {buyingCredits === '7500_credits' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>PayMongo (GCash / Cards)</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleBuyGlobalCredits('7500_credits')}
                          disabled={buyingCredits === '7500_credits'}
                          className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-200 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          <span>Global Polar ($150 USD)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 11. Environment Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Environment & Gateway Configuration
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Configure your active gateway endpoints and studio parameters.</p>
                </div>

                <div className="flex flex-col gap-4 bg-slate-950/80 border border-slate-800/80 p-5 rounded-xl font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 pb-3">
                    <span className="text-slate-500">API Gateway Base URL:</span>
                    <span className="text-cyan-400">{API_BASE || '(Relative Production Host)'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-3">
                    <span className="text-slate-500">Allowed Production CORS Domain:</span>
                    <span className="text-cyan-400">miu33archstudio.xyz</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-3">
                    <span className="text-slate-500">Supabase Connection:</span>
                    <span className="text-emerald-400">Active (Connected)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-3">
                    <span className="text-slate-500">Archicad Bridge:</span>
                    <span className="text-emerald-400">Tapir MCP Ready (Python 3.12)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Video Render Queue:</span>
                    <span className="text-cyan-400">BullMQ + Redis</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating Low-Credit Warning */}
      <LowCreditBanner
        credits={clientData?.credits ?? 0}
        onOpenPricing={() => setActiveTab('api')}
      />

      {/* User Account Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail={user?.email ?? ''}
        tier={clientData?.tier ?? (isPaidUser ? 'PRO' : 'FREE')}
        credits={clientData?.credits ?? 0}
        onSignOut={handleSignOut}
      />
    </div>
  );
}