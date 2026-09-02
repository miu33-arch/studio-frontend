"use client";

import React, { useEffect, useState } from "react";

export function DirectiveHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/companion/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.logs);
      }
    } catch (err) {
      console.error("Failed to load local ledger history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div style={{ border: "1px solid #222", backgroundColor: "#0b0b0b", padding: "20px", fontFamily: "monospace", color: "#00f3ff", margin: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <span style={{ fontSize: "0.8rem", color: "#888", letterSpacing: "1px" }}>
          SOVEREIGN LOCAL LEDGER // PERSISTENT STORAGE
        </span>
        <button
          onClick={fetchHistory}
          style={{ backgroundColor: "transparent", border: "1px solid #333", color: "#00f3ff", padding: "5px 10px", fontSize: "0.7rem", cursor: "pointer" }}
        >
          SYNC LEDGER
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: "0.8rem", color: "#666" }}>Loading persistent state...</div>
      ) : history.length === 0 ? (
        <div style={{ fontSize: "0.8rem", color: "#666" }}>No local records found in sovereign store.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
          {history.map((item) => (
            <div key={item.id} style={{ borderLeft: "2px solid #00f3ff", paddingLeft: "10px", fontSize: "0.85rem", backgroundColor: "#050505", padding: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.7rem", marginBottom: "5px" }}>
                <span>CONTEXT: {item.context}</span>
                <span>{item.savedAt}</span>
              </div>
              <div style={{ color: "#fff", marginBottom: "5px" }}>&gt; {item.input}</div>
              <div style={{ color: "#00ff66", fontSize: "0.8rem" }}>{item.response}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}