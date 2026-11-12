import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, FlowLayout } from "./components/shell/Layout";
import { QualifyFlow } from "./flow/QualifyFlow";
import { ComponentGallery } from "./pages/ComponentGallery";
import { BoardReport } from "./pages/BoardReport";
import { CertificatePage } from "./pages/Certificate";
import {
  OverviewPage, AgentsPage, AgentDetailPage, RuleCardsPage, TestRunsPage, ReviewsPage, EvidencePage, IntegrationsPage, SettingsPage, NotFoundPage,
} from "./pages";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/:agentId" element={<AgentDetailPage />} />
        <Route path="rule-cards" element={<RuleCardsPage />} />
        <Route path="runs" element={<TestRunsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="ui" element={<ComponentGallery />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="report" element={<BoardReport />} />
      <Route path="certificate" element={<CertificatePage />} />
      <Route element={<FlowLayout />}>
        <Route path="qualify" element={<Navigate to="/qualify/connect" replace />} />
        <Route path="qualify/:step" element={<QualifyFlow />} />
      </Route>
    </Routes>
  );
}
