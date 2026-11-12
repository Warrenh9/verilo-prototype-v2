import { Link } from "react-router-dom";
import { ArrowRight, Bot, FlaskConical } from "lucide-react";
import { Card, Mono, StatusPill } from "../components/ui";
import { ConnectionTest } from "../components/domain";
import { agents } from "../data/agents";
import { useQualify } from "../context/QualifyContext";
import { cn } from "../lib/cn";

/** Current vs candidate versions for each agent that can be qualified in the flow. */
export const flowVersions: Record<string, { current: { label: string; snapshot: string }; candidate: { label: string; snapshot: string } }> = {
  claimdesk: { current: { label: "Model 4.1", snapshot: "model-4.1-2026-03-02" }, candidate: { label: "Model 5.0", snapshot: "model-5.0-2026-10-14" } },
  sandbox: { current: { label: "Sandbox 1.0", snapshot: "sandbox-1.0.0" }, candidate: { label: "Sandbox 1.1", snapshot: "sandbox-1.1.0" } },
};

export function ConnectStep() {
  const { agentId, setAgentId, setConnectionTested } = useQualify();
  const choices = agents.filter((a) => a.id in flowVersions);
  const agent = agents.find((a) => a.id === agentId)!;
  const v = flowVersions[agentId];

  return (
    <div className="space-y-6">
      <Card title="Agent">
        <div role="radiogroup" aria-label="Agent" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {choices.map((a) => {
            const on = a.id === agentId;
            return (
              <button key={a.id} role="radio" aria-checked={on} onClick={() => { setAgentId(a.id); setConnectionTested(false); }}
                className={cn("rounded-lg border p-4 text-left", on ? "border-ink ring-1 ring-ink" : "border-border hover:bg-bg-muted")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium text-text">{a.sandbox ? <FlaskConical className="size-4" aria-hidden /> : <Bot className="size-4" aria-hidden />}{a.name}</div>
                  <span className={cn("mt-0.5 size-4 rounded-full border", on ? "border-[5px] border-ink" : "border-border-strong")} aria-hidden />
                </div>
                <div className="mt-1 text-[13px] text-text-3">{a.vendor} · {a.modelFamily}</div>
                <div className="mt-2">{a.sandbox ? <StatusPill tone="info">Works offline</StatusPill> : <StatusPill tone="brand">Verified · Verilo Connect plug-in</StatusPill>}</div>
              </button>
            );
          })}
        </div>
        <Link to="/integrations" className="mt-3 inline-flex items-center gap-1 text-[13px] text-brand-ink hover:underline">Connect a different agent<ArrowRight className="size-3.5" /></Link>
      </Card>

      <Card title="Versions to compare">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {([["Current", v.current, "Live today"], ["Candidate", v.candidate, "Proposed change"]] as const).map(([k, x, note]) => (
            <div key={k} className="rounded-lg border border-border p-4">
              <div className="text-[12px] font-medium text-text-3">{k} · {note}</div>
              <div className="mt-1 text-[16px] font-semibold text-text">{x.label}</div>
              <div className="mt-1 text-[12px] text-text-3">Pinned snapshot <Mono>{x.snapshot}</Mono></div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-text-3">
          Both versions answer the same cases in a harness where nothing real moves. Reviewer agents from {agent.modelFamily}, the agent's own model family, are excluded.
        </p>
      </Card>

      <Card title="Connection" actions={agent.sandbox ? <StatusPill tone="info">Sandbox · local</StatusPill> : <StatusPill tone="brand">Verified</StatusPill>}>
        <p className="mb-4 text-[13px]">
          {agent.sandbox
            ? "The sandbox agent runs in your browser, so the demo never depends on network access."
            : "Live through Cobaltline's Verilo Connect plug-in. Cobaltline declared the model family and pinned version; every connection must."}
        </p>
        <ConnectionTest onDone={() => setConnectionTested(true)} />
      </Card>
    </div>
  );
}
