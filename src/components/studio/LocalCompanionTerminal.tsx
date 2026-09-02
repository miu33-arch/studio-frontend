"use client";

import React, { useState } from "react";

export function LocalCompanionTerminal() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<any[]>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/companion/directive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: currentInput, context: "coding" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Companion offline");

      setResponseLog((prev) => [data, ...prev]);
    } catch (err: any) {
      setResponseLog((prev) => [{ success: false, response: err.message }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #222", backgroundColor: "#0b0b0b", padding: "20px", fontFamily: "monospace", color: "#00f3ff", margin: "20px 0" }}>
      <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "15px", letterSpacing: "1px" }}>
        SOVEREIGN COMPANION NODE // AIR-GAPPED INFERENCE
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a local instruction..."
          style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #333", color: "#fff", padding: "10px", fontFamily: "monospace", outline: "none" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: "#00f3ff", color: "#000", border: "none", padding: "10px 20px", fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "..." : "SEND"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
        {responseLog.map((log, idx) => (
          <div key={idx} style={{ borderLeft: "2px solid #00ff66", paddingLeft: "10px", fontSize: "0.85rem" }}>
            <div style={{ color: "#888", fontSize: "0.7rem" }}>{log.timestamp || "LOCAL EXCEPTION"}</div>
            <div style={{ color: log.success ? "#00ff66" : "#ff3366" }}>{log.response}</div>
          </div>
        ))}
      </div>
    </div>
  );
}