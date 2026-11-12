import { useEffect, useRef, useState } from "react";
import { Activity, PlugZap } from "lucide-react";
import { Button, Mono, StatusPill, Tooltip, type Tone } from "./ui";
import type { Source } from "../engine/types";
import { cn } from "../lib/cn";

/** Decision / status word → tone. Every status is shown with icon + word. */
export function decisionTone(label?: string): Tone {
  switch (label) {
    case "Approve": case "Approved": case "Signed": case "Healthy": case "Complete": case "Pass": return "success";
    case "Approve with conditions": case "Approved with conditions": case "Change pending": case "Awaiting signature": case "Degraded": case "Nominated review": return "warning";
    case "Reject": case "Rejected": case "Offline": case "Fail": return "danger";
    case "Scheduled": case "Running": case "Candidate": return "info";
    case "Vendor-certified": case "Verified": case "Certified": return "brand";
    default: return "neutral";
  }
}
export const DecisionPill = ({ label }: { label: string }) => <StatusPill tone={decisionTone(label)} spin={label === "Running"}>{label}</StatusPill>;

/** Clause source chip: "TMI-END-07 §4.1 · inserts 3.2". */
export function SourceChip({ source, text }: { source?: Source; text?: string }) {
  if (!source) return <span className="text-[12px] text-warning">Entered by policy owner</span>;
  const chip = (
    <span tabIndex={0} className="inline-flex items-center whitespace-nowrap rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[11.5px] text-brand-ink">
      {source.doc} §{source.clause}{source.note ? ` · ${source.note}` : ""}
    </span>
  );
  return text ? <Tooltip content={text}>{chip}</Tooltip> : chip;
}

/** Scripted round trip: one sample case through the harness, with timings. Side-effecting tools are stubbed. */
const STEPS: { at: number; line: string; tone?: "warn" | "ok" }[] = [
  { at: 0, line: "→ send case smoke_0001 (storm, quote $18,900, SI $610,000) — answer key withheld" },
  { at: 38, line: "← agent acknowledged" },
  { at: 112, line: "  tool get_policy(TMI-HOME-v3) → harness fixture" },
  { at: 164, line: "  tool get_claim_documents(smoke_0001) → 2 documents" },
  { at: 911, line: "  tool calculate_settlement → agent-side, value recorded" },
  { at: 1206, line: "  tool post_payment → STUBBED · recorded, not paid", tone: "warn" },
  { at: 1418, line: "← answer: covered · $18,150.00 · pay", tone: "ok" },
];

export function ConnectionTest({ onDone, label = "Test connection" }: { onDone?: () => void; label?: string }) {
  const [shown, setShown] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    timers.current.forEach(clearTimeout);
    setShown(-1); setRunning(true);
    STEPS.forEach((s, i) => timers.current.push(window.setTimeout(() => {
      setShown(i);
      if (i === STEPS.length - 1) { setRunning(false); onDone?.(); }
    }, s.at)));
  };
  const done = shown === STEPS.length - 1;
  return (
    <div>
      <div className="flex items-center gap-3">
        <Button icon={PlugZap} onClick={run} loading={running}>{label}</Button>
        {done && <StatusPill tone="success">Round trip 1.42 s</StatusPill>}
        {!done && !running && <span className="text-[13px] text-text-3">Sends one sample case. Nothing real moves.</span>}
      </div>
      {shown >= 0 && (
        <div className="mt-3 rounded-lg border border-border bg-bg-subtle p-3 font-mono text-[12px] leading-6" aria-live="polite">
          {STEPS.slice(0, shown + 1).map((s) => (
            <div key={s.at} className="flex gap-3">
              <span className="w-14 shrink-0 text-right text-text-3 tnum">{s.at} ms</span>
              <span className={cn(s.tone === "warn" ? "text-warning" : s.tone === "ok" ? "text-success" : "text-text-2")}>{s.line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HealthDot({ health }: { health: "Healthy" | "Degraded" | "Offline" }) {
  return <StatusPill tone={decisionTone(health)} icon={Activity}>{health}</StatusPill>;
}

export const Snapshot = ({ id }: { id: string }) => <Mono>{id}</Mono>;
