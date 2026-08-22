import { useEffect, useState } from "react";
import { Clock, Edit2, FileText, RefreshCw, Send, Trash2 } from "lucide-react";
import api from "../../../api/client";

const STATUS_STYLES = {
  draft: "border-gold/40 bg-gold/10 text-gold-light",
  sent: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  scheduled: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  sending: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  failed: "border-red-800/60 bg-red-950/40 text-red-300",
  partially_failed: "border-orange-800/60 bg-orange-950/40 text-orange-300",
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return <span className={`chip ${s}`}>{String(status || "draft").replace("_", " ")}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const recipientCount = (msg) => {
  const r = msg.recipients || {};
  return (r.toUserIds?.length || 0) + (r.toRoles?.length || 0) + (r.toEmails?.length || 0);
};

export default function DraftList({ onEdit, refreshTrigger }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const fetchMessages = async (status = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = status ? { status } : { mine: "true" };
      const { data } = await api.get("/email/messages", { params });
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setFilter(status);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/email/messages/${id}`);
      fetchMessages();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleSendNow = async (id) => {
    try {
      await api.post(`/email/messages/${id}/send`);
      fetchMessages();
    } catch (err) {
      setError(err?.response?.data?.message || "Send failed");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">My Drafts & Scheduled</h3>
        <div className="flex gap-2">
          {["", "draft", "scheduled", "sent", "failed"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => fetchMessages(s)}
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                filter === s
                  ? "border-gold/25 bg-gold/10 text-gold"
                  : "border-gold/10 bg-gold/5 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {s || "All"}
            </button>
          ))}
          <button type="button" onClick={() => fetchMessages()} className="rounded-lg p-1 text-neutral-500 hover:text-neutral-300">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Clock size={16} className="animate-spin text-neutral-600" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-xs text-red-400">{error}</p>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <FileText size={24} className="text-white/10" />
          <p className="mt-2 text-xs text-neutral-600">No messages yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-line bg-white/[0.02]">
                {["Subject", "Recipients", "Status", "Scheduled", "Sent", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg._id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.02]">
                  <td className="max-w-[220px] truncate px-3 py-2.5 font-medium text-neutral-200">{msg.subject || "(no subject)"}</td>
                  <td className="px-3 py-2.5 text-neutral-500">{recipientCount(msg)}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={msg.status} />
                  </td>
                  <td className="px-3 py-2.5 text-neutral-500">{formatDate(msg.scheduledAt)}</td>
                  <td className="px-3 py-2.5 text-neutral-500">{formatDate(msg.sentAt)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {(msg.status === "draft" || msg.status === "scheduled") && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit?.(msg)}
                            className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-white/5 hover:text-gold"
                            title="Edit"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendNow(msg._id)}
                            className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-white/5 hover:text-gold"
                            title="Send now"
                          >
                            <Send size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(msg._id)}
                            className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-red-950/40 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
