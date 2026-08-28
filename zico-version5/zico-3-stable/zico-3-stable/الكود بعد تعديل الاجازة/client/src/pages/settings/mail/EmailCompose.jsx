import { useCallback, useEffect, useState } from "react";
import { Clock, Edit3, FileText, Plus, Save, Send, X } from "lucide-react";
import api from "../../../api/client";
import RecipientPicker from "./RecipientPicker";
import RichTextEditor from "./RichTextEditor";
import AttachmentUpload from "./AttachmentUpload";
import ScheduleControl from "./ScheduleControl";
import DraftList from "./DraftList";

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
        active ? "border border-gold/20 bg-gold/10 text-gold" : "border border-transparent text-neutral-500 hover:text-neutral-300"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      {label && <label className="label mb-1.5">{label}</label>}
      <input className="input" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;
  return (
    <div
      className={`fixed right-6 top-6 z-[60] flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl ${
        type === "success" ? "border-emerald-700/60 bg-emerald-950/90 text-emerald-300" : "border-red-800/60 bg-red-950/90 text-red-300"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

const EMPTY_RECIPIENTS = { toUserIds: [], toRoles: [], toEmails: [], ccEmails: [], bccEmails: [] };

export default function EmailCompose() {
  const [tab, setTab] = useState("compose");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [recipients, setRecipients] = useState(EMPTY_RECIPIENTS);
  const [attachments, setAttachments] = useState([]);
  const [schedule, setSchedule] = useState({ scheduledAt: null });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshDrafts, setRefreshDrafts] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const resetForm = () => {
    setSubject("");
    setBodyHtml("");
    setRecipients(EMPTY_RECIPIENTS);
    setAttachments([]);
    setSchedule({ scheduledAt: null });
    setEditingId(null);
  };

  const buildPayload = (extra = {}) => ({
    subject,
    bodyHtml: bodyHtml || "<p></p>",
    recipients,
    attachmentIds: attachments.map((a) => a.id),
    scheduledAt: schedule.scheduledAt ? new Date(schedule.scheduledAt).toISOString() : null,
    ...extra,
  });

  const saveDraft = async () => {
    setSaving(true);
    try {
      if (editingId) await api.put(`/email/messages/${editingId}`, buildPayload());
      else await api.post("/email/messages", buildPayload({ send: false }));
      showToast(editingId ? "Draft updated" : "Draft saved");
      setRefreshDrafts((n) => n + 1);
      if (!editingId) resetForm();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save draft", "error");
    } finally {
      setSaving(false);
    }
  };

  const sendOrSchedule = async () => {
    if (!subject.trim()) {
      showToast("Subject is required", "error");
      return;
    }
    setSaving(true);
    try {
      let msgId = editingId;
      if (!msgId) {
        const { data } = await api.post("/email/messages", buildPayload({ send: false }));
        msgId = data.message._id;
      }

      if (schedule.scheduledAt) {
        await api.put(`/email/messages/${msgId}`, { scheduledAt: new Date(schedule.scheduledAt).toISOString() });
        showToast("Message scheduled");
      } else {
        const { data } = await api.post(`/email/messages/${msgId}/send`);
        showToast(data.message?.status === "sent" ? "Message sent" : "Send completed with issues");
      }

      setRefreshDrafts((n) => n + 1);
      resetForm();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to send message", "error");
    } finally {
      setSaving(false);
    }
  };

  const editMessage = (msg) => {
    setEditingId(msg._id);
    setSubject(msg.subject || "");
    setBodyHtml(msg.bodyHtml || "");
    setRecipients({
      toUserIds: msg.recipients?.toUserIds || [],
      toRoles: msg.recipients?.toRoles || [],
      toEmails: msg.recipients?.toEmails || [],
      ccEmails: msg.recipients?.ccEmails || [],
      bccEmails: msg.recipients?.bccEmails || [],
    });
    setAttachments((msg.attachments || []).map((a) => ({ id: a.id || "", name: a.filename || "(attached file)" })));
    setSchedule({ scheduledAt: msg.scheduledAt ? new Date(msg.scheduledAt).toISOString().slice(0, 16) : null });
    setTab("compose");
  };

  const isScheduled = !!schedule.scheduledAt;

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <TabButton active={tab === "compose"} icon={editingId ? Edit3 : Plus} label={editingId ? "Edit" : "Compose"} onClick={() => setTab("compose")} />
        <TabButton active={tab === "drafts"} icon={FileText} label="Drafts & Scheduled" onClick={() => setTab("drafts")} />
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 rounded-lg border border-gold/15 bg-gold/5 px-3 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:text-neutral-200"
          >
            <X size={12} />
            New message
          </button>
        )}
      </div>

      {tab === "compose" ? (
        <div className="mx-auto max-w-3xl">
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject…" />

          <RecipientPicker value={recipients} onChange={setRecipients} />

          <div className="mb-4">
            <label className="label mb-1.5">Body</label>
            <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
          </div>

          <AttachmentUpload files={attachments} onChange={setAttachments} />

          <div className="mb-4">
            <label className="label mb-1.5">Schedule</label>
            <ScheduleControl value={schedule} onChange={setSchedule} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={saveDraft} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save as Draft"}
            </button>
            <button type="button" className="btn-primary" onClick={sendOrSchedule} disabled={saving || !subject.trim()}>
              {isScheduled ? <Clock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {saving ? "Processing…" : isScheduled ? "Schedule" : "Send Now"}
            </button>
          </div>
        </div>
      ) : (
        <DraftList onEdit={editMessage} refreshTrigger={refreshDrafts} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
