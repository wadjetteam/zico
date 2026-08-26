import { Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PolicyManagement from "./pages/governance/PolicyManagement";
import PolicyDetail from "./pages/governance/PolicyDetail";
import DefineExceptions from "./pages/governance/DefineExceptions";
import DocumentProgram from "./pages/governance/DocumentProgram";
import RolesPermissions from "./pages/governance/RolesPermissions";
import RoleDetail from "./pages/governance/RoleDetail";
import Committees from "./pages/governance/Committees";
import CommitteeDetail from "./pages/governance/CommitteeDetail";
import ExecutiveDashboard from "./pages/governance/ExecutiveDashboard";
import GovernanceDashboard from "./pages/governance/GovernanceDashboard";
import ExceptionRegister from "./pages/governance/ExceptionRegister";
import SubmitRisk from "./pages/risk/SubmitRisk";
import ViewRisks from "./pages/risk/ViewRisks";
import RiskScoring from "./pages/risk/RiskScoring";
import ManagementReviews from "./pages/risk/ManagementReviews";
import CloseRisks from "./pages/risk/CloseRisks";
import POAM from "./pages/risk/POAM";
import ScoreHistory from "./pages/risk/ScoreHistory";
import FollowingUp from "./pages/risk/FollowingUp";
import RiskTreatment from "./pages/risk/RiskTreatment";
import { useParams } from "react-router";
import ComplianceModule from "./pages/compliance-full/ComplianceModule";
import AuditModule from "./pages/audit/AuditModule";
import ReportsPage from "./pages/reports/ReportsPage";
import ControlManagement from "./pages/controls/ControlManagement";
import ManageAssets from "./pages/assets/ManageAssets";
import AssetGroups from "./pages/assets/AssetGroups";
import Insights from "./pages/ai/Insights";
import Assistant from "./pages/ai/Assistant";
import Organizations from "./pages/context/Organizations";
import OrganizationDetail from "./pages/context/OrganizationDetail";
import Domains from "./pages/context/Domains";
import Parameters from "./pages/context/Parameters";
import Mail from "./pages/settings/Mail";
import Backup from "./pages/settings/Backup";
import RiskOwners from "./pages/settings/RiskOwners";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function ComplianceModuleWrapper() {
  const { page } = useParams();
  return <ComplianceModule page={page} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/context/organizations" element={<Organizations />} />
            <Route path="/context" element={<Navigate to="/context/organizations" replace />} />
            <Route path="/context/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/context/domains" element={<Domains />} />
            <Route path="/context/parameters" element={<Parameters />} />

            <Route path="/governance" element={<Navigate to="/governance/dashboard" replace />} />
            <Route path="/governance/dashboard" element={<GovernanceDashboard />} />
            <Route path="/governance/policies" element={<PolicyManagement />} />
            <Route path="/governance/policies/:id" element={<PolicyDetail />} />
            <Route path="/governance/exceptions" element={<ExceptionRegister />} />
            <Route path="/governance/documents" element={<DocumentProgram />} />
            <Route path="/governance/roles" element={<RolesPermissions />} />
            <Route path="/governance/roles/:id" element={<RoleDetail />} />
            <Route path="/governance/committees" element={<Committees />} />
            <Route path="/governance/committees/:id" element={<CommitteeDetail />} />
            <Route path="/governance/executive" element={<ExecutiveDashboard />} />

            <Route path="/risk/submit" element={<SubmitRisk />} />
            <Route path="/risk" element={<Navigate to="/risk/view" replace />} />
            <Route path="/risks/new" element={<SubmitRisk />} />
            <Route path="/risk/view" element={<ViewRisks />} />
            <Route path="/risks" element={<ViewRisks />} />
            <Route path="/risks/heatmap" element={<ViewRisks />} />
            <Route path="/risk/scoring" element={<RiskScoring />} />
            <Route path="/risk/reviews" element={<ManagementReviews />} />
            <Route path="/risks/reviews" element={<ManagementReviews />} />
            <Route path="/risk/close" element={<CloseRisks />} />
            <Route path="/risk/poam" element={<POAM />} />
            <Route path="/risks/poam" element={<POAM />} />
            <Route path="/risk/score-history" element={<ScoreHistory />} />
            <Route path="/risks/score-history" element={<ScoreHistory />} />
            <Route path="/risks/parameters" element={<Parameters />} />
            <Route path="/risk/users" element={<RiskOwners />} />
            <Route path="/following-up" element={<FollowingUp />} />
            <Route path="/risk/following-up" element={<FollowingUp />} />
            <Route path="/risk/treatment" element={<RiskTreatment />} />

            <Route path="/compliance" element={<Navigate to="/dashboard" replace />} />
            <Route path="/compliance/dashboard" element={<Navigate to="/dashboard?tab=compliance" replace />} />
            <Route path="/compliance/:page" element={<ComplianceModuleWrapper />} />
            <Route path="/compliance-module" element={<Navigate to="/compliance/dashboard" replace />} />

            <Route path="/controls/management" element={<ControlManagement />} />

            <Route path="/audit-module" element={<AuditModule />} />
            <Route path="/audit-module/:page" element={<AuditModule />} />
            <Route path="/audit/*" element={<Navigate to="/audit-module" replace />} />

            <Route path="/assets/manage" element={<ManageAssets />} />
            <Route path="/assets/groups" element={<AssetGroups />} />

            <Route path="/ai/insights" element={<Insights />} />
            <Route path="/ai/assistant" element={<Assistant />} />

            <Route path="/reporting/executive" element={<Dashboard />} />

            <Route path="/reports/all" element={<ReportsPage moduleFilter="all" />} />
            <Route path="/reports/compliance" element={<ReportsPage moduleFilter="compliance" />} />
            <Route path="/reports/risk" element={<ReportsPage moduleFilter="risk" />} />
            <Route path="/reports/audit" element={<ReportsPage moduleFilter="audit" />} />
            <Route path="/reports/asset" element={<ReportsPage moduleFilter="asset" />} />
            <Route path="/reports/platform" element={<ReportsPage moduleFilter="platform" />} />

            <Route path="/settings/mail" element={<Mail />} />
            <Route path="/settings/users" element={<Navigate to="/risk/users" replace />} />
            <Route path="/settings/backup" element={<Backup />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
