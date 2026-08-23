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
import ManageAudits from "./pages/audit/ManageAudits";
import ActiveAudits from "./pages/audit/ActiveAudits";
import PastAudits from "./pages/audit/PastAudits";
import AuditEngagementDetail from "./pages/audit/AuditEngagementDetail";
import { useParams } from "react-router";
import ComplianceModule from "./pages/compliance-full/ComplianceModule";
import ControlManagement from "./pages/controls/ControlManagement";
import ManageAssets from "./pages/assets/ManageAssets";
import AssetGroups from "./pages/assets/AssetGroups";
import Insights from "./pages/ai/Insights";
import Assistant from "./pages/ai/Assistant";
import RiskAssessments from "./pages/assessments/RiskAssessments";
import RiskAssessmentDetail from "./pages/assessments/RiskAssessmentDetail";
import Questionnaires from "./pages/assessments/Questionnaires";
import QuestionnaireDetail from "./pages/assessments/QuestionnaireDetail";
import ThirdParty from "./pages/assessments/ThirdParty";
import ThirdPartyDetail from "./pages/assessments/ThirdPartyDetail";
import Respond from "./pages/assessments/Respond";
import DynamicRiskReport from "./pages/reporting/DynamicRiskReport";
import ComplianceReports from "./pages/reporting/ComplianceReports";
import Organizations from "./pages/context/Organizations";
import OrganizationDetail from "./pages/context/OrganizationDetail";
import Domains from "./pages/context/Domains";
import Parameters from "./pages/context/Parameters";
import Groups from "./pages/context/Groups";
import GroupDetail from "./pages/context/GroupDetail";
import Mail from "./pages/settings/Mail";
import Backup from "./pages/settings/Backup";

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
            <Route path="/context/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/context/domains" element={<Domains />} />
            <Route path="/context/parameters" element={<Parameters />} />
            <Route path="/context/groups" element={<Groups />} />
            <Route path="/context/groups/:id" element={<GroupDetail />} />

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
            <Route path="/risk/view" element={<ViewRisks />} />
            <Route path="/risk/scoring" element={<RiskScoring />} />
            <Route path="/risk/reviews" element={<ManagementReviews />} />
            <Route path="/risk/close" element={<CloseRisks />} />
            <Route path="/risk/poam" element={<POAM />} />
            <Route path="/risk/score-history" element={<ScoreHistory />} />

            <Route path="/compliance" element={<Navigate to="/compliance/dashboard" replace />} />
            <Route path="/compliance/:page" element={<ComplianceModuleWrapper />} />
            <Route path="/compliance-module" element={<Navigate to="/compliance/dashboard" replace />} />

            <Route path="/controls/management" element={<ControlManagement />} />

            <Route path="/audit/manage" element={<ManageAudits />} />
            <Route path="/audit/active" element={<ActiveAudits />} />
            <Route path="/audit/past" element={<PastAudits />} />
            <Route path="/audit/engagements/:id" element={<AuditEngagementDetail />} />
            <Route path="/audit/universe" element={<Navigate to="/audit/manage" replace />} />

            <Route path="/assets/manage" element={<ManageAssets />} />
            <Route path="/assets/groups" element={<AssetGroups />} />

            <Route path="/ai/insights" element={<Insights />} />
            <Route path="/ai/assistant" element={<Assistant />} />

            <Route path="/assessments/risk" element={<RiskAssessments />} />
            <Route path="/assessments/risk/:id" element={<RiskAssessmentDetail />} />
            <Route path="/assessments/questionnaires" element={<Questionnaires />} />
            <Route path="/assessments/questionnaires/:id" element={<QuestionnaireDetail />} />
            <Route path="/assessments/third-party" element={<ThirdParty />} />
            <Route path="/assessments/third-party/:id" element={<ThirdPartyDetail />} />
            <Route path="/assessments/respond/:token" element={<Respond />} />

            <Route path="/reporting/executive" element={<Dashboard />} />
            <Route path="/reporting/dynamic-risk" element={<DynamicRiskReport />} />
            <Route path="/reporting/compliance" element={<ComplianceReports />} />

            <Route path="/settings/mail" element={<Mail />} />
            <Route path="/settings/backup" element={<Backup />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
