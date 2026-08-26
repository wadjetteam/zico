import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I can summarise your risk register, draft review notes and flag overdue assessments. What would you like to look at?" },
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
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "The assistant service is unavailable right now." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Conversational analysis over your GRC data. Responses are placeholders until a provider is connected." />
      <div className="card flex h-[calc(100vh-16rem)] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-gold-gradient text-black" : "border border-line bg-ink-deep text-neutral-300"}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {busy && <p className="text-xs text-neutral-600">Assistant is thinking…</p>}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-line p-4">
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about risks, controls or vendors…" />
          <button className="btn-primary" disabled={busy}><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </>
  );
}
