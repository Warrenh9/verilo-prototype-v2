import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button, Card, DataTable, Mono, PageHeader, Timeline } from "../components/ui";
import { DecisionPill } from "../components/domain";
import { runs, qualificationRun, RUN_CASES, type Run } from "../data/runs";
import { suites } from "../data/suite";
import { useQualify } from "../context/QualifyContext";
import { useApp } from "../context/AppContext";
import { agentIdFor } from "./Overview";

export function TestRunsPage() {
  const nav = useNavigate();
  const q = useQualify();
  const { persona } = useApp();
  const all = q.runState === "done" ? [qualificationRun, ...runs] : runs;
  return (
    <>
      <PageHeader title="Test runs" description="Re-tests after any model, vendor, prompt, tool or rule change, and on a schedule. Every run writes to an evidence pack."
        actions={<Button variant="primary" icon={Play} onClick={() => nav("/qualify/connect")} disabled={!persona.can.runQualification} disabledReason="Your role can't start a run">New qualification</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {suites.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-bg p-4">
            <div className="flex items-baseline justify-between"><span className="text-[13px] font-medium text-text">{s.name}</span><span className="font-display text-[22px] font-semibold text-text tnum">{s.cases.toLocaleString()}</span></div>
            <div className="mt-1 text-[12px] text-text-3">{s.use}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Card padded={false}>
          <DataTable<Run> rows={all} rowKey={(r) => r.id} pageSize={10} onRowClick={(r) => r.id === qualificationRun.id ? nav("/qualify/decision") : nav(`/agents/${agentIdFor(r.agent)}?tab=runs`)}
            filters={[
              { key: "type", label: "Type", options: Object.keys(RUN_CASES), get: (r) => r.type },
              { key: "trigger", label: "Trigger", options: ["Model change", "Vendor release", "Prompt change", "Rule change", "Schedule"], get: (r) => r.trigger },
            ]}
            columns={[
              { key: "id", header: "Run", nowrap: true, render: (r) => <Mono>{r.id}</Mono> },
              { key: "agent", header: "Agent", sortValue: (r) => r.agent, render: (r) => <span className="text-text">{r.agent}</span> },
              { key: "type", header: "Type", nowrap: true, render: (r) => <span>{r.type} <span className="text-text-3 tnum">· {RUN_CASES[r.type].toLocaleString()}</span></span> },
              { key: "trigger", header: "Trigger", nowrap: true, render: (r) => r.trigger },
              { key: "date", header: "Started", nowrap: true, sortValue: (r) => r.iso, render: (r) => r.started },
              { key: "decision", header: "Decision", nowrap: true, render: (r) => r.decision && <DecisionPill label={r.decision} /> },
              { key: "score", header: "Score", align: "right", sortValue: (r) => r.score ?? 0, render: (r) => r.score ?? "—" },
            ]} initialSort={{ key: "date", dir: "desc" }} />
        </Card>
        <Card title="Schedules">
          <Timeline items={[
            { title: "Weekly health check · 100", meta: "Mondays 02:00 AEDT", body: "All agents" },
            { title: "Monthly refresh · 300", meta: "1st of month", body: "Fresh cases every month" },
            { title: "Smoke test · 50", meta: "On any change", body: "Triggered by webhook" },
            { title: "Full qualification · 1,000", meta: "On model, vendor or rule change", body: "Required before accepting a change" },
          ]} />
        </Card>
      </div>
    </>
  );
}
