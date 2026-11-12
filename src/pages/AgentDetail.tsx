import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Button, Callout, Card, DataTable, EmptyState, KeyValue, Mono, PageHeader, StatusPill, Tabs } from "../components/ui";
import { ConnectionTest, DecisionPill, HealthDot, decisionTone } from "../components/domain";
import type { AgentVersion } from "../data/agents";
import { runs, RUN_CASES, type Run } from "../data/runs";
import { useApp } from "../context/AppContext";

type Tab = "summary" | "versions" | "runs" | "connection" | "certification";

export function AgentDetailPage() {
  const { agentId } = useParams();
  const nav = useNavigate();
  const { persona, agents, certifiedV5 } = useApp();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) ?? "summary");
  const a = agents.find((x) => x.id === agentId);
  if (!a) return <EmptyState title="Agent not found" action={<Button onClick={() => nav("/agents")}>Back to agents</Button>} />;
  const agentRuns = runs.filter((r) => r.agent === a.name);
  const pending = a.lastDecision === "Change pending";

  return (
    <>
      <Link to="/agents" className="mb-3 inline-flex items-center gap-1 text-[13px] text-brand-ink hover:underline"><ArrowLeft className="size-4" />Agents</Link>
      <PageHeader title={a.name} description={`${a.useCase} · ${a.vendor}`}
        actions={<>
          <StatusPill tone={decisionTone(a.source)}>{a.source}</StatusPill>
          <DecisionPill label={a.lastDecision} />
          {pending && <Button variant="primary" icon={Play} onClick={() => nav("/qualify/connect")} disabled={!persona.can.runQualification} disabledReason="Your role can't start a qualification">Start qualification</Button>}
        </>} />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[
        { key: "summary", label: "Summary" }, { key: "versions", label: "Versions", count: a.versions.length },
        { key: "runs", label: "Runs", count: agentRuns.length }, { key: "connection", label: "Connection" }, { key: "certification", label: "Certification" },
      ]} />

      {tab === "summary" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {pending && <div className="lg:col-span-2"><Callout tone="warning" title="Model change pending">Cobaltline is moving ClaimDesk from Model 4.1 (retiring 15 Feb 2027) to Model 5.0. Decide by 16 Jan 2027.</Callout></div>}
          <Card title="Assurance">
            <KeyValue items={[
              { k: "Last decision", v: <DecisionPill label={a.lastDecision} /> },
              { k: "Last score", v: a.lastScore ?? "—" },
              { k: "Signed rule card", v: a.ruleCard },
              { k: "Next test", v: a.nextTest },
              { k: "Business owner", v: a.owner },
            ]} />
          </Card>
          <Card title="Agent">
            <KeyValue items={[
              { k: "Use case", v: a.useCase },
              { k: "Supplier", v: a.vendor },
              { k: "Model family", v: a.modelFamily },
              { k: "Pinned version", v: a.pinnedVersion, mono: true },
              { k: "Connection", v: a.connection },
            ]} />
            <p className="mt-3 text-[12px] text-text-3">Reviewer agents from {a.modelFamily} are excluded from this agent's panel.</p>
          </Card>
        </div>
      )}

      {tab === "versions" && (
        <Card padded={false}>
          <DataTable<AgentVersion> rows={a.versions} rowKey={(v) => v.snapshot} columns={[
            { key: "label", header: "Version", render: (v) => <Mono>{v.label}</Mono> },
            { key: "model", header: "Model", render: (v) => v.model },
            { key: "snap", header: "Pinned snapshot", render: (v) => <Mono>{v.snapshot}</Mono> },
            { key: "status", header: "Status", render: (v) => <StatusPill tone={v.status === "Live" ? "success" : v.status === "Candidate" ? "info" : v.status === "Retiring" ? "warning" : "neutral"}>{v.status}</StatusPill> },
            { key: "note", header: "Note", render: (v) => <span className="text-text-3">{v.note ?? ""}</span> },
          ]} />
        </Card>
      )}

      {tab === "runs" && (
        <Card padded={false}>
          <DataTable<Run> rows={agentRuns} rowKey={(r) => r.id} empty={<EmptyState title="No runs yet" body="Runs appear here after the first test." />} columns={[
            { key: "id", header: "Run", render: (r) => <Mono>{r.id}</Mono> },
            { key: "type", header: "Type", render: (r) => `${r.type} · ${RUN_CASES[r.type].toLocaleString()}` },
            { key: "trigger", header: "Trigger", render: (r) => r.trigger },
            { key: "versions", header: "Versions", render: (r) => <Mono>{r.versions}</Mono> },
            { key: "date", header: "Started", render: (r) => r.started },
            { key: "decision", header: "Decision", render: (r) => r.decision && <DecisionPill label={r.decision} /> },
            { key: "score", header: "Score", align: "right", render: (r) => r.score ?? "—" },
          ]} />
        </Card>
      )}

      {tab === "connection" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Card title="Connection">
            <KeyValue items={[
              { k: "Method", v: a.connection },
              { k: "Health", v: <HealthDot health={a.connectionHealth} /> },
              { k: "Last successful call", v: a.lastCall },
              { k: "Pinned version", v: a.pinnedVersion, mono: true },
              { k: "Harness", v: "Side-effecting tools stubbed" },
              { k: "Data region", v: "Australia" },
            ]} />
          </Card>
          <Card title="Test the connection"><ConnectionTest /></Card>
        </div>
      )}

      {tab === "certification" && (
        a.certification ? (
          <Card title="Vendor certification" highlight>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill tone="brand">{a.certification.status} · {certifiedV5 ? "Model 5.0" : a.certification.version}</StatusPill>
              <span className="text-[13px] text-text-3">valid to {certifiedV5 ? "30 Nov 2027" : a.certification.validTo}</span>
            </div>
            <p className="mb-4 max-w-2xl text-[13px]">
              {a.vendor} passed Verilo's locked standard suite for home claims on this version. This is independent assurance on a fixed suite, not a guarantee;
              Tallowood still qualifies the agent on its own signed rules.
            </p>
            <KeyValue items={[
              { k: "Certificate", v: <Link to="/certificate" className="inline-flex items-center gap-1 text-brand-ink hover:underline">{certifiedV5 ? "verilo.au/cert/cobaltline-claimdesk-5-0" : a.certification.link}<ExternalLink className="size-3.5" /></Link> },
              { k: "Model 5.0", v: certifiedV5 ? <StatusPill tone="brand">Certified · valid to 30 Nov 2027</StatusPill> : <StatusPill tone="info">Certification pending</StatusPill> },
              { k: "Model 4.1", v: "Certified · valid to 15 Feb 2027" },
            ]} />
          </Card>
        ) : <Card><EmptyState title="No vendor certification" body="Certification applies to agents supplied through Verilo Connect. Your own qualification results are under Runs." /></Card>
      )}
    </>
  );
}
