import { useNavigate } from "react-router-dom";
import { ArrowRight, Bot, CalendarClock, FlaskConical, KeyRound, Play, UserCheck } from "lucide-react";
import { Button, Callout, Card, DataTable, PageHeader, StatTile, Timeline } from "../components/ui";
import { DecisionPill } from "../components/domain";
import { agents, upcomingChanges } from "../data/agents";
import { runs, RUN_CASES, type Run } from "../data/runs";
import { reviewQueue } from "../data/reviews";
import { useApp } from "../context/AppContext";

export function OverviewPage() {
  const nav = useNavigate();
  const { persona, workspace } = useApp();
  const underAssurance = agents.filter((a) => !a.sandbox).length;
  const thisMonth = runs.filter((r) => r.iso.startsWith("2026-11")).length;
  const canRun = persona.can.runQualification && workspace.id === "tallowood";

  return (
    <>
      <PageHeader title="Overview" description={`Independent assurance for the AI agents ${workspace.name} relies on.`} />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Agents under assurance" value={underAssurance} icon={Bot} hint="1 change pending" />
        <StatTile label="Runs this month" value={thisMonth} icon={FlaskConical} hint="November 2026" />
        <StatTile label="Open reviews" value={reviewQueue.length} icon={UserCheck} tone="warning" hint="1 critical" />
        <StatTile label="Next forced model change" value="15 Feb 2027" icon={CalendarClock} hint="Model 4.1 retires" />
      </div>

      <div className="mb-6">
        <Callout tone="warning" title="Model change detected"
          action={<Button variant="primary" icon={Play} onClick={() => nav("/qualify/connect")} disabled={!canRun} disabledReason="Your role can view results but not start a qualification">Start qualification</Button>}>
          Cobaltline has announced ClaimDesk Agent moves from Model 4.1 to Model 5.0. Model 4.1 retires 15 Feb 2027. Decide whether to accept the change by 16 Jan 2027.
        </Callout>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Card title="Recent runs" padded={false} actions={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => nav("/runs")}>All runs</Button>}>
          <DataTable<Run> rows={runs.slice(0, 6)} rowKey={(r) => r.id} onRowClick={(r) => nav(`/agents/${agentIdFor(r.agent)}`)}
            columns={[
              { key: "agent", header: "Agent", render: (r) => <span className="font-medium text-text">{r.agent}</span> },
              { key: "type", header: "Run", nowrap: true, render: (r) => <span>{r.type} <span className="text-text-3 tnum">· {RUN_CASES[r.type].toLocaleString()}</span></span> },
              { key: "trigger", header: "Trigger", nowrap: true, render: (r) => r.trigger },
              { key: "date", header: "Started", nowrap: true, render: (r) => r.started.replace(" 2026", "") },
              { key: "decision", header: "Decision", nowrap: true, render: (r) => r.decision && <DecisionPill label={r.decision} /> },
              { key: "score", header: "Score", align: "right", render: (r) => r.score ?? "—" },
            ]} />
        </Card>
        <div className="space-y-6">
          <Card title="Upcoming changes">
            <Timeline items={upcomingChanges.map((u) => ({
              title: u.title, meta: u.date, body: u.agent,
              tone: u.kind === "forced" ? "danger" : u.kind === "deadline" ? "warning" : "default",
            }))} />
          </Card>
          <Card highlight>
            <div className="flex gap-3">
              <KeyRound className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden />
              <div className="text-[13px]">
                <div className="mb-1 text-[14px] font-semibold text-text">The answer key never reaches the agent</div>
                Code checks every number. Reviewer agents on different model families judge only how the agent reasoned, never what the right answer is.
                Cases they can't settle go to reviewers you nominate.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export const agentIdFor = (name: string) => agents.find((a) => a.name === name)?.id ?? "claimdesk";
