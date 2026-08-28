import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about ISO/IEC 27002:2022 controls and I'll answer from the retrieved regulation context." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const { data } = await api.post("/ai/chat", { message: text });
      setMessages((m) => [...m, { role: "assistant", text: data.reply, sources: data.sources }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "The assistant service is unavailable right now." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Grounded Q&A over ISO/IEC 27002:2022, powered by the local RAG pipeline." />
      <div className="card flex h-[calc(100vh-16rem)] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-gold-gradient text-black" : "border border-line bg-ink-deep text-neutral-300"}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.sources?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line/60 pt-2">
                    {m.sources.map((s, j) => (
                      <span key={j} className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-neutral-400">
                        Control {s.control_id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {busy && <p className="text-xs text-neutral-600">Assistant is thinking…</p>}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-line p-4">
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about ISO 27002 controls…" />
          <button className="btn-primary" disabled={busy}><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </>
  );
}
