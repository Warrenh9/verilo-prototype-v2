import { useEffect, useRef, useState } from "react";
import { Bot, Calculator, FastForward, Hash, Play, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { Badge, Button, Card, Mono, ProgressBar, StatusPill, Term } from "../components/ui";
import { useQualify } from "../context/QualifyContext";
import { useApp } from "../context/AppContext";
import { suites } from "../data/suite";
import { runMeta } from "../data/results";
import { commitSeed } from "../engine/hash";
import { flowVersions } from "./ConnectStep";
import { cn } from "../lib/cn";

const DURATION = 30000; // full replay ≈ 30 s
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const phase = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

const LOG_TEMPLATES = [
  (n: string, lane: string) => `[${lane}] case_${n} get_policy(TMI-HOME-v3) → fixture`,
  (n: string, lane: string) => `[${lane}] case_${n} get_claim_documents → 3 documents`,
  (n: string, lane: string) => `[${lane}] case_${n} calculate_settlement → recorded`,
  (n: string, lane: string) => `[${lane}] case_${n} post_payment → STUBBED · recorded, not paid`,
  (n: string, lane: string) => `[${lane}] case_${n} answer received · key withheld from agent`,
];

export function RunStep() {
  const q = useQualify();
  const { persona } = useApp();
  const [t, setT] = useState(q.runState === "done" ? 1 : 0);
  const [commit, setCommit] = useState("");
  const start = useRef(0);
  const v = flowVersions[q.agentId];
  const suite = suites.find((s) => s.id === q.suiteId)!;
  const N = suite.cases;

  useEffect(() => { commitSeed(runMeta.seed).then(setCommit); }, []);
  useEffect(() => {
    if (q.runState !== "running") return;
    start.current = performance.now() - t * DURATION;
    const id = window.setInterval(() => {
      const nt = clamp((performance.now() - start.current) / DURATION);
      setT(nt);
      if (nt >= 1) { window.clearInterval(id); q.setRunState("done"); }
    }, 100);
    return () => window.clearInterval(id);
  }, [q.runState]); // eslint-disable-line react-hooks/exhaustive-deps

  const gen = phase(t, 0, 0.12), cur = phase(t, 0.1, 0.72), cand = phase(t, 0.12, 0.8), chk = phase(t, 0.55, 1);
  const scale = N / 1000;
  const cost = (19.84 * scale * chk).toFixed(2);
  const logLines = Array.from({ length: Math.floor(cand * 60) }, (_, i) => {
    const lane = i % 2 ? "candidate" : "current";
    return LOG_TEMPLATES[i % LOG_TEMPLATES.length](String(1 + Math.floor((i / 60) * N)).padStart(4, "0"), lane);
  }).slice(-9);

  if (q.runState === "idle") {
    return (
      <div className="space-y-6">
        <Card title="Choose the test suite">
          <div role="radiogroup" aria-label="Suite" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {suites.map((s) => {
              const on = s.id === q.suiteId;
              return (
                <button key={s.id} role="radio" aria-checked={on} onClick={() => q.setSuiteId(s.id)}
                  className={cn("rounded-lg border p-4 text-left", on ? "border-ink ring-1 ring-ink" : "border-border hover:bg-bg-muted")}>
                  <div className="flex items-center justify-between"><span className="font-medium text-text">{s.name}</span><span className="font-display text-[18px] font-semibold text-text tnum">{s.cases.toLocaleString()}</span></div>
                  <div className="mt-1 text-[13px] text-text-3">{s.use}</div>
                  <div className="mt-1 text-[12px] text-text-3">{s.duration}</div>
                </button>
              );
            })}
          </div>
        </Card>
        <Card title="Confirm">
          <ul className="mb-4 space-y-1.5 text-[13px]">
            <li>• Fresh cases with planted traps, each with a right answer computed in code from your signed rule card.</li>
            <li>• {v.current.label} and {v.candidate.label} answer the same cases in a harness where nothing real moves.</li>
            <li>• The answer key never reaches the agent. Reviewer agents judge reasoning only.</li>
          </ul>
          <Button variant="primary" size="lg" icon={Play} onClick={() => q.setRunState("running")} disabled={!persona.can.runQualification} disabledReason="Your role can't start a run">Start {suite.name.toLowerCase()}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg px-5 py-3">
        <div className="flex items-center gap-3">
          {q.runState === "done" ? <StatusPill tone="success">Run complete</StatusPill> : <StatusPill tone="info" spin>Running</StatusPill>}
          <Mono>{runMeta.id}</Mono>
          <span className="text-[13px] text-text-3">{suite.name} · {N.toLocaleString()} cases</span>
        </div>
        {q.runState === "running" && <Button size="sm" icon={FastForward} onClick={() => { setT(1); q.setRunState("done"); }}>Skip to results</Button>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PhaseCard n={1} title="Generate" icon={Sparkles} p={gen}>
          <Metric label="Cases created" value={Math.round(N * gen).toLocaleString()} />
          <Metric label="Critical cases" value={Math.round(130 * scale * gen)} />
          <Metric label="Trap types" value={Math.round(18 * gen)} />
          <div className="mt-3 text-[12px] text-text-3"><Term explain="The seed is hashed and recorded before any case is generated, then revealed afterwards so an auditor can check the cases weren't chosen after the fact.">Seed commitment</Term></div>
          <Mono className="block break-all text-[11px]">{gen > 0 ? commit : "—"}</Mono>
        </PhaseCard>

        <PhaseCard n={2} title="Re-run" icon={Bot} p={Math.min(cur, cand)}>
          <Lane label={`Current · ${v.current.label}`} p={cur} n={N} />
          <Lane label={`Candidate · ${v.candidate.label}`} p={cand} n={N} />
          <p className="mt-2 text-[12px] text-text-3"><ShieldCheck className="mr-1 inline size-3.5 text-brand-ink" aria-hidden />Side-effecting tools are stubbed.</p>
        </PhaseCard>

        <PhaseCard n={3} title="Check" icon={Calculator} p={chk}>
          <Metric label="Numbers checked by code" value={Math.round(600 * scale * chk).toLocaleString()} />
          <Metric label="Reasoning panel votes" value={Math.round(2731 * scale * chk).toLocaleString()} />
          <Metric label="Sent to nominated reviewers" value={Math.round(16 * scale * chk)} icon={UserCheck} />
          <Metric label="Settled without a human" value={chk > 0 ? "98.4%" : "—"} />
        </PhaseCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Card title="Harness log" actions={<Badge tone="info">Live</Badge>}>
          <div className="h-[232px] overflow-hidden rounded-md border border-border bg-bg-subtle p-3 font-mono text-[12px] leading-6" aria-live="off">
            {logLines.length === 0 ? <span className="text-text-3">Waiting for cases…</span> : logLines.map((l, i) => (
              <div key={i} className={cn("truncate", l.includes("STUBBED") ? "text-warning" : "text-text-2")}>{l}</div>
            ))}
          </div>
        </Card>
        <Card title="AI checking cost">
          <div className="font-display text-[30px] font-semibold text-text tnum">US${cost}</div>
          <div className="mb-3 text-[13px] text-text-3">of US${runMeta.aiCheckingCapUsd} cap · about US$20 per 1,000 cases</div>
          <ProgressBar value={Number(cost)} max={30} label="AI checking cost against cap" />
          <p className="mt-3 text-[12px] text-text-3">Reviewer agents from Family A and Family B only. The agent's own family (Family C) is excluded.</p>
        </Card>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-text-3"><Hash className="size-3.5" aria-hidden />Every step is written to a hash-chained evidence ledger.</div>
    </div>
  );
}

function PhaseCard({ n, title, icon: Icon, p, children }: { n: number; title: string; icon: typeof Bot; p: number; children: React.ReactNode }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><span className="text-text-3 tnum">{n}</span><Icon className="size-4" aria-hidden />{title}</span>}
      actions={p >= 1 ? <StatusPill tone="success">Done</StatusPill> : p > 0 ? <StatusPill tone="info" spin>{Math.round(p * 100)}%</StatusPill> : <StatusPill>Waiting</StatusPill>}>
      <ProgressBar value={p * 100} label={`${title} progress`} />
      <div className="mt-3">{children}</div>
    </Card>
  );
}
function Metric({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof Bot }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 text-[13px] last:border-b-0">
      <span className="inline-flex items-center gap-1.5 text-text-3">{Icon && <Icon className="size-3.5" aria-hidden />}{label}</span>
      <span className="font-medium text-text tnum">{value}</span>
    </div>
  );
}
function Lane({ label, p, n }: { label: string; p: number; n: number }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[13px]"><span className="text-text-2">{label}</span><span className="text-text-3 tnum">{Math.round(n * p).toLocaleString()} / {n.toLocaleString()}</span></div>
      <ProgressBar value={p * 100} label={label} />
    </div>
  );
}
