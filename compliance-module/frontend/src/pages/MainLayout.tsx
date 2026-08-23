import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { T, FONT_STACK } from "../lib/theme";
import { ComplianceDashboard } from "./ComplianceDashboard";
import { FrameworksPage } from "./FrameworksPage";
import { RequirementsPage } from "./RequirementsPage";
import { AssessmentsPage } from "./AssessmentsPage";
import { EvidencePage } from "./EvidencePage";
import { GapsPage } from "./GapsPage";
import { RemediationPage } from "./RemediationPage";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "◫" },
  { key: "frameworks", label: "Frameworks & Regulations", icon: "⚖" },
  { key: "requirements", label: "Requirements", icon: "☑" },
  { key: "assessments", label: "Assessments", icon: "📋" },
  { key: "evidence", label: "Evidence", icon: "📄" },
  { key: "gaps", label: "Compliance Gaps", icon: "⚠" },
  { key: "remediation", label: "Remediation", icon: "🔧" },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <ComplianceDashboard goTo={setPage} />;
      case "frameworks": return <FrameworksPage />;
      case "requirements": return <RequirementsPage />;
      case "assessments": return <AssessmentsPage />;
      case "evidence": return <EvidencePage />;
      case "gaps": return <GapsPage goTo={setPage} />;
      case "remediation": return <RemediationPage />;
      default: return <ComplianceDashboard goTo={setPage} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: FONT_STACK }}>
      <aside style={{ width: 230, background: T.sidebarBg, borderRight: `1px solid ${T.panelBorder}`, display: "flex", flexDirection: "column", position: "fixed", height: "100vh" }}>
        <div style={{ padding: "20px 18px", borderBottom: `1px solid ${T.panelBorder}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>WADJET</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Compliance Module</div>
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
          {NAV.map((item) => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", borderRadius: 8, background: page === item.key ? T.accentSoft : "transparent", color: page === item.key ? T.accent : T.textSecondary, fontSize: 12.5, fontWeight: page === item.key ? 600 : 400, cursor: "pointer", marginBottom: 2, textAlign: "left" }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: `1px solid ${T.panelBorder}` }}>
          <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500 }}>{user?.fullName}</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8 }}>{user?.role}</div>
          <button onClick={logout} style={{ background: "transparent", border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "6px 12px", color: T.textSecondary, fontSize: 11, cursor: "pointer" }}>Sign Out</button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 230, background: T.bg, minHeight: "100vh" }}>
        <header style={{ height: 56, borderBottom: `1px solid ${T.panelBorder}`, display: "flex", alignItems: "center", padding: "0 28px", position: "sticky", top: 0, background: T.bg, zIndex: 10 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600 }}>{NAV.find((n) => n.key === page)?.label}</h1>
        </header>
        <div style={{ padding: "24px 28px" }}>{renderPage()}</div>
      </main>
    </div>
  );
}
