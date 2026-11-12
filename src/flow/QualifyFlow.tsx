import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button, Card, KeyValue, Mono, StatusPill, Stepper } from "../components/ui";
import { DecisionPill } from "../components/domain";
import { ConnectStep, flowVersions } from "./ConnectStep";
import { RulesStep } from "./RulesStep";
import { RunStep } from "./RunStep";
import { DecisionStep } from "./DecisionStep";
import { suites } from "../data/suite";
import { useQualify } from "../context/QualifyContext";
import { agents } from "../data/agents";

export const flowSteps = ["connect", "rules", "run", "decision"] as const;
const labels = ["Connect", "Rules", "Run", "Decision"];

export function QualifyFlow() {
  const { step = "connect" } = useParams();
  const nav = useNavigate();
  const q = useQualify();
  const i = Math.max(0, flowSteps.indexOf(step as (typeof flowSteps)[number]));
  const agent = agents.find((a) => a.id === q.agentId)!;
  const v = flowVersions[q.agentId];
  const card = q.selectedCard;
  const cardSigned = card?.status === "Signed";
  const canReach = (n: number) => n <= 1 || (n === 2 && cardSigned) || (n === 3 && cardSigned && q.runState === "done");

  useEffect(() => { if (i > q.maxStep && canReach(i)) q.setMaxStep(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!canReach(i)) nav(cardSigned ? "/qualify/run" : "/qualify/rules", { replace: true }); }, [i, cardSigned, q.runState]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo(0, 0); }, [i]);

  const go = (n: number) => nav(`/qualify/${flowSteps[n]}`);
  const next: { label: string; disabled?: boolean; reason?: string } | null =
    i === 0 ? { label: "Continue to rules" }
    : i === 1 ? { label: "Continue to run", disabled: !cardSigned, reason: "Sign the rule card first" }
    : i === 2 ? { label: "See decision", disabled: q.runState !== "done", reason: "Wait for the run to finish, or skip to results" }
    : null;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-text-3">Qualification · {agent.name}</div>
          <h1 className="text-[24px] leading-8">{v.current.label} → {v.candidate.label}</h1>
        </div>
        <Button variant="ghost" icon={X} onClick={() => nav("/")}>Exit</Button>
      </div>
      <div className="mb-6 rounded-lg border border-border bg-bg px-5 py-4">
        <Stepper steps={labels} current={i} onSelect={(n) => canReach(n) && go(n)} maxReached={cardSigned ? Math.max(q.maxStep, i) : Math.min(1, Math.max(q.maxStep, i))} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {i === 0 && <ConnectStep />}
          {i === 1 && <RulesStep />}
          {i === 2 && <RunStep />}
          {i === 3 && <DecisionStep />}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button icon={ArrowLeft} disabled={i === 0} onClick={() => go(i - 1)}>Back</Button>
            {next && <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={next.disabled} disabledReason={next.reason} onClick={() => go(i + 1)}>{next.label}</Button>}
          </div>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card title="Summary">
            <KeyValue items={[
              { k: "Agent", v: agent.name },
              { k: "Connection", v: agent.sandbox ? <StatusPill tone="info">Sandbox</StatusPill> : <StatusPill tone="brand">Verified</StatusPill> },
              { k: "Connection test", v: q.connectionTested ? <StatusPill tone="success">Passed</StatusPill> : <span className="text-text-3">Not run</span> },
              { k: "Current", v: <span className="block"><span className="block">{v.current.label}</span><Mono className="text-text-3">{v.current.snapshot}</Mono></span> },
              { k: "Candidate", v: <span className="block"><span className="block">{v.candidate.label}</span><Mono className="text-text-3">{v.candidate.snapshot}</Mono></span> },
              { k: "Rule card", v: card ? (card.origin === "demo" ? "Home v3 + END-07" : "From loaded documents") : "—" },
              { k: "Signature", v: card ? <DecisionPill label={card.status} /> : "—" },
              ...(card?.hash ? [{ k: "SHA-256", v: card.hash.slice(0, 16) + "…", mono: true }] : []),
              { k: "Suite", v: i >= 2 ? (() => { const s = suites.find((x) => x.id === q.suiteId)!; return `${s.name} · ${s.cases.toLocaleString()}`; })() : <span className="text-text-3">Chosen at Run</span> },
              { k: "Run", v: q.runState === "done" ? <StatusPill tone="success">Complete</StatusPill> : q.runState === "running" ? <StatusPill tone="info" spin>Running</StatusPill> : <span className="text-text-3">Not started</span> },
              { k: "Decide by", v: "16 Jan 2027" },
            ]} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
