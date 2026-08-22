import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail as MailIcon, Send, Settings as SettingsIcon, XCircle } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import EmailCompose from "./mail/EmailCompose";

const inputStyle = "input";

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

function StatusPill({ connected, lastVerifyError }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
          connected ? "border border-emerald-700/60 bg-emerald-950/40 text-emerald-300" : "border border-neutral-700 bg-neutral-900 text-neutral-400"
        }`}
      >
        {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {connected ? "Connected" : "Not connected"}
      </span>
      {!connected && lastVerifyError && (
        <span className="max-w-[320px] truncate text-[11px] text-neutral-600" title={lastVerifyError}>
          {lastVerifyError}
        </span>
      )}
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="label mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const EMPTY_FORM = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpAppPassword: "",
  fromEmail: "",
  fromName: "Wadjet GRC",
  replyTo: "",
};

export default function Mail() {
  const [tab, setTab] = useState("settings");
  const [status, setStatus] = useState({ connected: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [testEmail, setTestEmail] = useState("");
  const [recentEmails, setRecentEmails] = useState([]);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/email/status");
      setStatus(data);
      if (data.fromEmail) {
        setForm((f) => ({
          ...f,
          fromEmail: data.fromEmail,
          fromName: data.fromName || f.fromName,
          smtpHost: data.smtpHost || f.smtpHost,
          smtpPort: data.smtpPort || f.smtpPort,
          smtpUser: data.smtpUser || f.smtpUser,
        }));
      }
    } catch {
      /* server down — keep last state */
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await api.get("/email/recent");
      setRecentEmails(data.logs || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchRecent();
  }, [fetchStatus, fetchRecent]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/email/config", { ...form, smtpPort: Number(form.smtpPort) });
      setMessage({ type: "success", text: "SMTP configuration saved. Verifying connection…" });
      setTimeout(fetchStatus, 3000);
      setTimeout(fetchRecent, 3500);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect email integration? Notifications will stop sending until reconfigured.")) return;
    await api.post("/email/disconnect");
    setStatus((s) => ({ ...s, connected: false, lastVerifyError: null }));
    fetchStatus();
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    setMessage(null);
    try {
      await api.post("/email/test", { to: testEmail });
      setMessage({ type: "success", text: `Test email sent to ${testEmail}.` });
      fetchRecent();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  return (
    <>
      <PageHeader
        title="Mail"
        subtitle="Configure the SMTP connection, compose and schedule outbound messages from the platform."
        actions={
          <div className="flex items-center gap-2">
            <TabButton active={tab === "settings"} icon={SettingsIcon} label="Settings" onClick={() => setTab("settings")} />
            <TabButton active={tab === "compose"} icon={Send} label="Compose" onClick={() => setTab("compose")} />
            {tab === "settings" && <StatusPill connected={status.connected} lastVerifyError={status.lastVerifyError} />}
          </div>
        }
      />

      {tab === "settings" ? (
        <div className="mx-auto max-w-4xl">
          {message && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300"
                  : "border-red-800/60 bg-red-950/40 text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className={`card p-5 ${status.connected ? "shadow-gold" : ""}`}>
            <div className="mb-4 flex items-center gap-2">
              <MailIcon className="h-4 w-4 text-gold" />
              <h2 className="heading text-sm font-semibold text-neutral-100">SMTP configuration</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SMTP host">
                <input className={inputStyle} value={form.smtpHost} onChange={set("smtpHost")} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="SMTP port">
                <input className={inputStyle} type="number" value={form.smtpPort} onChange={set("smtpPort")} placeholder="587" />
              </Field>
            </div>

            <Field label="SMTP user (your mailbox address)">
              <input className={inputStyle} value={form.smtpUser} onChange={set("smtpUser")} placeholder="notifications@yourbank.com" />
            </Field>

            <Field label="App password">
              <input
                className={inputStyle}
                type="password"
                value={form.smtpAppPassword}
                onChange={set("smtpAppPassword")}
                placeholder="App password (never your normal login password)"
                autoComplete="new-password"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="From name">
                <input className={inputStyle} value={form.fromName} onChange={set("fromName")} />
              </Field>
              <Field label="From email">
                <input className={inputStyle} value={form.fromEmail} onChange={set("fromEmail")} placeholder="notifications@yourbank.com" />
              </Field>
            </div>

            <Field label="Reply-to (optional)">
              <input className={inputStyle} value={form.replyTo} onChange={set("replyTo")} placeholder="Leave empty to reply to the From address" />
            </Field>

            <div className="mt-2 flex items-center gap-3">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving…" : "Save & verify"}
              </button>
              {status.connected && (
                <button className="btn-danger" onClick={handleDisconnect}>
                  Disconnect
                </button>
              )}
            </div>
            <p className="mt-3 text-[11px] text-neutral-600">
              Credentials are encrypted at rest (AES-256-GCM) and never exposed through the API.
            </p>
          </div>

          <div className="card mt-6 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Send className="h-4 w-4 text-gold" />
              <h2 className="heading text-sm font-semibold text-neutral-100">Send test email</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className={inputStyle}
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <button
                className="btn-primary whitespace-nowrap"
                onClick={handleSendTest}
                disabled={!status.connected || !testEmail || sendingTest}
              >
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {sendingTest ? "Sending…" : "Send test"}
              </button>
            </div>
          </div>

          <div className="card mt-6 p-5">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              <h2 className="heading text-sm font-semibold text-neutral-100">Recent activity</h2>
            </div>
            {recentEmails.length === 0 ? (
              <p className="text-sm text-neutral-500">No emails sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">To</th>
                      <th className="pb-2 pr-4 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmails.map((log) => (
                      <tr key={log._id} className="border-t border-line">
                        <td className="py-2 pr-4 text-neutral-500">{new Date(log.sentAt).toLocaleString()}</td>
                        <td className="py-2 pr-4 text-neutral-200">{log.to}</td>
                        <td className="max-w-[260px] truncate py-2 pr-4 text-neutral-200">{log.subject}</td>
                        <td className="py-2">
                          <span
                            className={`chip ${
                              log.status === "failed"
                                ? "border-red-800/60 bg-red-950/40 text-red-300"
                                : "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmailCompose />
      )}
    </>
  );
}
