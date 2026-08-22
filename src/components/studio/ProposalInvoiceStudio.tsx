"use client";

import { useState } from "react";
import { Printer, Sparkles, ShieldCheck, Plus, Trash2 } from "lucide-react";

interface ScopeItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

export default function ProposalInvoiceStudio() {
  const [projectName, setProjectName] = useState("CYBER_STRUCTURE_BIM_01");
  const [clientName, setClientName] = useState("KRONOS_DYNAMICS");
  const [creditPack, setCreditPack] = useState("Pro Scale Pack (2,000 Credits)");
  const [positionType, setPositionType] = useState("Spatial BIM Lead");
  const [currency, setCurrency] = useState<"PHP" | "USD" | "SAR">("PHP");
  const [taxPercent, setTaxPercent] = useState<number>(12);

  const [items, setItems] = useState<ScopeItem[]>([
    { id: "1", description: "BIM 3D Model LOD 400 Structure", qty: 1, rate: 45000 },
    { id: "2", description: "Spatial Gesture & WebGL Interactivity Bridge", qty: 1, rate: 30000 },
    { id: "3", description: "Synthetic AI Video Walkthrough (4K)", qty: 2, rate: 12500 },
  ]);

  const currencySymbols = {
    PHP: "₱",
    USD: "$",
    SAR: "﷼",
  };

  const addItem = () => {
    const newItem: ScopeItem = {
      id: Date.now().toString(),
      description: "New Scope Deliverable",
      qty: 1,
      rate: 10000,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ScopeItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.qty) || 0) * (Number(item.rate) || 0),
    0
  );
  const tax = subtotal * (taxPercent / 100);
  const total = subtotal + tax;
  const currSym = currencySymbols[currency];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4 print:space-y-0 print:m-0 print:p-0">
      {/* Top Banner (Hidden in Print) */}
      <div className="flex items-center justify-between p-4 border border-cyan-500/30 rounded-xl bg-slate-950/80 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold">
            DOC_ENGINE
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-white tracking-wide">
              INSTANT PROPOSAL & INVOICE STUDIO
            </h2>
            <p className="font-mono text-[11px] text-slate-400">
              Dynamic scope management, multi-currency conversion, and live A4 print simulation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 print:block">
        {/* Left Side: Parameters & Scope Editor (Hidden in Print) */}
        <div className="lg:col-span-5 border border-cyan-500/30 rounded-xl bg-slate-950 p-4 font-mono text-xs space-y-4 print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <span className="text-cyan-400 font-bold uppercase">Contract Parameters</span>
            <span className="text-[10px] text-slate-500">LIVE SYNC</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">PROJECT IDENTIFIER</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white font-mono outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">CLIENT ENTITY</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white font-mono outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">CURRENCY</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white font-mono outline-none text-xs"
                >
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (﷼)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">TAX / VAT (%)</label>
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white font-mono outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">ALLOCATED CREDIT TIER</label>
              <select
                value={creditPack}
                onChange={(e) => setCreditPack(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white font-mono outline-none text-xs"
              >
                <option>Starter Pack (500 Credits)</option>
                <option>Pro Scale Pack (2,000 Credits)</option>
                <option>Studio Fleet Pack (7,500 Credits)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Deliverable Scope Matrix Editor */}
          <div className="pt-3 border-t border-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-bold uppercase">Deliverable Scope Items</span>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded transition-all"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-slate-200 text-[11px] outline-none"
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                      className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-500 block mb-0.5">QTY:</span>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">UNIT RATE ({currSym}):</span>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: High-Precision Live A4 Document Preview */}
        <div className="lg:col-span-7 border border-cyan-500/30 rounded-xl bg-slate-950 p-4 font-mono flex flex-col items-center print:border-none print:p-0 print:bg-white print:w-full">
          <div className="w-full flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4 text-xs print:hidden">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>LIVE PDF SIMULATOR (A4)</span>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>

          {/* Clean White Printable Paper */}
          <div className="w-full max-w-125 bg-white text-slate-900 rounded-lg p-8 shadow-2xl space-y-4 text-[11px] leading-relaxed border border-slate-200 print:shadow-none print:border-none print:max-w-none print:p-0 print:w-full print:m-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h1 className="font-bold text-base text-slate-950 tracking-tight">MIU_33 STUDIO</h1>
                <p className="text-[9px] text-slate-500 font-mono">DIGITAL ARCHITECTURE & AI SYSTEMS</p>
                <p className="text-[9px] text-slate-500 font-mono">AUTH GATEWAY: HTTPS://MIU33ARCHSTUDIO.XYZ</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-slate-950 text-white font-bold rounded text-[9px]">
                  OFFICIAL PROPOSAL
                </span>
                <p className="text-[9px] text-slate-500 mt-1">HASH: MIU-{Math.floor(100000 + Math.random() * 900000)}</p>
              </div>
            </div>

            {/* Meta Table */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-[10px]">
              <div>
                <span className="text-slate-400 block font-bold">CLIENT IDENTIFIER:</span>
                <span className="text-slate-900 font-bold">{clientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">PROJECT TARGET:</span>
                <span className="text-slate-900 font-bold">{projectName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">SYSTEM ARCHETYPE:</span>
                <span className="text-slate-900">{positionType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">CREDIT ALLOCATION:</span>
                <span className="text-slate-900 font-bold">{creditPack}</span>
              </div>
            </div>

            {/* Scope Matrix */}
            <div>
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500">
                    <th className="py-1">DELIVERABLE SCOPE</th>
                    <th className="py-1 text-center">QTY</th>
                    <th className="py-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 text-slate-800 font-medium">{item.description}</td>
                      <td className="py-1.5 text-center text-slate-600">{item.qty}</td>
                      <td className="py-1.5 text-right font-bold text-slate-900">
                        {currSym}{((item.qty || 0) * (item.rate || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-right text-[10px]">
              <div className="flex justify-between text-slate-500">
                <span>SUBTOTAL:</span>
                <span>{currSym}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT / TAX ({taxPercent}%):</span>
                <span>{currSym}{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-bold text-xs pt-1 border-t border-slate-300">
                <span>FINAL SETTLEMENT:</span>
                <span className="text-cyan-700">{currSym}{total.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Sign-off */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CRYPTOGRAPHICALLY VERIFIED PROPOSAL</span>
              </div>
              <span>PAGE 01 // 01</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}