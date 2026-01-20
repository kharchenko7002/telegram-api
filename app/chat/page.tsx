"use client";

import { useState } from "react";

type Melding = { fra: "bruker" | "bot"; tekst: string };

export default function ChatSide() {
  const [meldinger, setMeldinger] = useState<Melding[]>([
    { fra: "bot", tekst: "Hei! Hvordan kan jeg hjelpe deg i dag?" },
  ]);
  const [input, setInput] = useState("");
  const [laster, setLaster] = useState(false);

  async function send() {
    const tekst = input.trim();
    if (!tekst || laster) return;

    setMeldinger((m) => [...m, { fra: "bruker", tekst }]);
    setInput("");
    setLaster(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ melding: tekst }),
      });

      const data = await res.json();
      setMeldinger((m) => [...m, { fra: "bot", tekst: data.svar ?? "Noe gikk galt." }]);
    } catch {
      setMeldinger((m) => [...m, { fra: "bot", tekst: "Kunne ikke koble til serveren." }]);
    } finally {
      setLaster(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Chat</h1>

      <div
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 12,
          height: 420,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {meldinger.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.fra === "bruker" ? "flex-end" : "flex-start",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #444",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.tekst}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Skriv en melding…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />
        <button
          onClick={send}
          disabled={laster}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            opacity: laster ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
