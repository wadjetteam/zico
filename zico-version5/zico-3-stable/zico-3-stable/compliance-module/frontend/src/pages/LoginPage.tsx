import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { T } from "../lib/theme";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <form onSubmit={handleSubmit} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 40, width: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: T.accent }}>WADJET</h1>
        <p style={{ fontSize: 13, color: T.textSecondary, marginBottom: 24 }}>Compliance Module — Sign in</p>
        {error && <div style={{ background: T.redSoft, color: T.red, padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 16 }}>{error}</div>}
        <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "10px 14px", color: T.textPrimary, fontSize: 13 }} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginBottom: 20, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "10px 14px", color: T.textPrimary, fontSize: 13 }} />
        <button type="submit" disabled={loading} style={{ width: "100%", background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 16, textAlign: "center" }}>Default: admin / admin123</p>
      </form>
    </div>
  );
}
