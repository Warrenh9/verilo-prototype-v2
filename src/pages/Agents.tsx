import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button, Card, DataTable, Mono, PageHeader, StatusPill } from "../components/ui";
import { DecisionPill, decisionTone } from "../components/domain";
import type { Agent } from "../data/agents";
import { useApp } from "../context/AppContext";

export function AgentsPage() {
  const nav = useNavigate();
  const { persona, agents, certifiedV5 } = useApp();
  return (
    <>
      <PageHeader title="Agents" description="Every AI agent under independent assurance, with its pinned model version and latest decision."
        actions={<Button variant="primary" icon={Plus} onClick={() => nav("/integrations")} disabled={!persona.can.manageIntegrations} disabledReason="Your role can't connect agents">Connect an agent</Button>} />
      <Card padded={false}>
        <DataTable<Agent> rows={agents} rowKey={(a) => a.id} onRowClick={(a) => nav(`/agents/${a.id}`)}
          filters={[{ key: "source", label: "Source", options: ["Vendor-certified", "In-house", "Platform", "Sandbox"], get: (a) => a.source }]}
          columns={[
            { key: "name", header: "Agent", sortValue: (a) => a.name, render: (a) => (
              <div className="py-1.5"><div className="font-medium text-text">{a.name}</div><div className="text-[12px] text-text-3">{a.vendor}</div></div>
            ) },
            { key: "source", header: "Source", nowrap: true, render: (a) => <span className="inline-flex flex-col items-start gap-0.5"><StatusPill tone={decisionTone(a.source)}>{a.source}</StatusPill>{a.id === "claimdesk" && <span className="text-[11px] text-text-3">{certifiedV5 ? "Model 5.0 certified" : "Model 4.1 certified"}</span>}</span> },
            { key: "conn", header: "Connection", render: (a) => a.connection },
            { key: "model", header: "Model family · pinned version", render: (a) => <div><div>{a.modelFamily}</div><Mono className="text-text-3">{a.pinnedVersion}</Mono></div> },
            { key: "decision", header: "Last decision", nowrap: true, sortValue: (a) => a.lastDecision, render: (a) => <span className="inline-flex items-center gap-2"><DecisionPill label={a.lastDecision} />{a.lastScore !== undefined && <span className="text-text-3 tnum">{a.lastScore}</span>}</span> },
            { key: "next", header: "Next test", render: (a) => a.nextTest },
          ]} />
      </Card>
    </>
  );
}
