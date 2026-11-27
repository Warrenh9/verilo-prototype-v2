import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleX, FileCheck2, FileDown, Send } from "lucide-react";
import { findingsFrom } from "./findings";
import { Badge, Button, Callout, Card, ConfidenceBar, DataTable, Drawer, KeyValue, Modal, Mono, ScoreRing, StatusPill, Switch, useToast } from "../components/ui";
import { DecisionPill } from "../components/domain";
import { NonInferiorityChart, PanelChart } from "../components/charts";
import { useQualify } from "../context/QualifyContext";
import { claimDeskRun, runMeta } from "../data/results";
import { nominatedReviewers } from "../data/reviews";
import { scoreRun, withConfirmedFailure, type Decision } from "../engine/scorer";
import { runPanel } from "../engine/panel";
import { buildCaseRows, type CaseRow } from "./decisionCases";
import { cn } from "../lib/cn";

export const decisionWord: Record<Decision, string> = {
  Approve: "Approved", "Approve with conditions": "Approved with conditions", Reject: "Rejected", "Insufficient evidence": "Insufficient evidence",
};
const SEV: Record<string, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

export function DecisionStep() {
  const q = useQualify();
  const nav = useNavigate();
  const toast = useToast();
  const { simulate, setSimulate } = q;
  const [detail, setDetail] = useState(false);
  const [open, setOpen] = useState<CaseRow | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [approver, setApprover] = useState(nominatedReviewers[0].name);
  const card = q.selectedCard!;

  const rows = useMemo(() => buildCaseRows(card.card, simulate), [card, simulate]);
  const result = useMemo(() => {
    const t2 = rows.find((r) => r.id === "case_0217")!;
    // The simulated failure goes through the real verdict logic and the real scorer.
    const input = simulate && t2.failSeverity === "critical" ? withConfirmedFailure(claimDeskRun, "critical", "C1") : claimDeskRun;
    return scoreRun(input);
  }, [rows, simulate]);
  const reject = result.decision === "Reject";
  const findings = useMemo(() => findingsFrom(rows), [rows]);

  useEffect(() => {
    if (q.sealed) return;
    q.setSealed(true);
    toast({ tone: "success", title: "Evidence pack sealed and sent to Tallowood's audit copy.", body: runMeta.evidencePack });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {card.origin === "loaded" && <Callout tone="info" title="Agent results: scripted demo run">Code verdicts in the cases table use the rule card built from your documents. Agent answers, votes and the overall score are scripted.</Callout>}

      <Card padded={false}>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={result.score} label={result.capped ? "Capped" : `Likely range ${result.displayRange[0]}–${result.displayRange[1]}`} tone={reject ? "danger" : "brand"} />
            <StatusPill tone={reject ? "danger" : result.decision === "Approve" ? "success" : "warning"} className="h-7 px-3 text-[13px]">{decisionWord[result.decision]}</StatusPill>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-text-3">ClaimDesk Agent · {runMeta.candidate.label} vs {runMeta.current.label}</div>
            <h2 className="mt-1 text-[20px]">{reject ? "Reject the change" : "Accept the change, with a condition"}</h2>
            <p className="mt-2 max-w-2xl text-[13px]">
              {result.capped
                ? <>Score capped at <b>{result.score}</b> out of 100 because of one confirmed critical error. Before the cap it would have scored {result.rawScore}.</>
                : <>Score <b>{result.score}</b> out of 100, likely between {result.displayRange[0]} and {result.displayRange[1]}{detail && <> (bootstrap 95% CI <Mono>{result.ciDetail[0]}–{result.ciDetail[1]}</Mono>)</>}.</>}
              {" "}This is measured evidence with a confidence range for your model validation, not a guarantee.
            </p>
            {reject && <div className="mt-3"><Callout tone="danger" title="One confirmed critical error caps the score, whatever the other 999 cases show.">Model 5.0 declined a covered flood claim under clause 4.2(c), which Endorsement 07 deleted. The customer would have been underpaid $84,400.00.</Callout></div>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" icon={FileCheck2} onClick={() => nav("/evidence")}>Open evidence pack</Button>
              <Button icon={FileDown} onClick={() => nav("/report")}>Download board report</Button>
              <Button icon={Send} onClick={() => setSendOpen(true)}>Send to nominated approver</Button>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-bg-subtle px-4 py-3">
              <Switch checked={simulate} onChange={setSimulate} label={<span><span className="font-medium text-text">Simulate one critical failure</span>: the new model wrongly declines the covered flood claim ($0 instead of $84,400), and everything is re-scored</span>} />
            </div>
          </div>
        </div>
      </Card>

      {result.conditions.map((c) => !reject && <Callout key={c} tone="warning" title="Condition">{c} <span className="text-text-3">(3 of the 5 serious errors were this kind of claim.)</span></Callout>)}

      <Card title="What went wrong" actions={<span className="text-[12px] text-text-3">From the {rows.length} sample cases below · amounts checked by code</span>}>
        <table className="w-full text-[13px]">
          <thead className="text-left text-text-3"><tr><th className="pb-2 font-medium">Finding</th><th className="pb-2 font-medium">Policy clause</th><th className="pb-2 font-medium">Impact</th><th className="pb-2 font-medium">Severity</th></tr></thead>
          <tbody>
            {findings.map((x) => (
              <tr key={x.trap} className="border-t border-border align-top">
                <td className="py-2.5 pr-4 text-text">{x.finding}{x.count > 1 && <span className="text-text-3"> · {x.count} cases</span>}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap"><Mono>{x.clause}</Mono></td>
                <td className="py-2.5 pr-4">{x.impact}</td>
                <td className="py-2.5"><StatusPill tone={x.severity === "critical" ? "danger" : "warning"}>{SEV[x.severity]}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-end">
        <Switch checked={detail} onChange={setDetail} label="Show statistical detail" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Pass/fail checks">
          <ul className="space-y-3">
            {result.gates.map((g) => (
              <li key={g.key} className="flex gap-3">
                {g.pass ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-text">{g.label}<StatusPill tone={g.pass ? "success" : "danger"}>{g.pass ? "Pass" : "Fail"}</StatusPill></div>
                  <div className="text-[13px] text-text-3">{g.detail}</div>
                  {detail && <div className="mt-0.5 font-mono text-[11px] text-text-3">{g.technical}</div>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Score breakdown">
          {claimDeskRun.subScores.map((s) => (
            <ConfidenceBar key={s.key} label={s.label} weight={detail ? `×${s.weight}` : undefined} value={Number(s.value)} low={Number(s.ciLow)} high={Number(s.ciHigh)} min={0.8} max={1} format={detail ? undefined : (v) => `${(v * 100).toFixed(1)}%`} />
          ))}
          <p className="mt-2 text-[12px] text-text-3">{detail ? "Point estimate with 95% interval; weights shown after each label. n from 180 (escalation) to 944 (regression pairs)." : "Share of cases right in each area. The shaded bar is the likely range."}</p>
        </Card>
      </div>

      <Card title="Is Model 5.0 at least as good as Model 4.1?">
        <NonInferiorityChart detail={detail} diff={result.nonInferiority.diffPp} lower={result.nonInferiority.lowerPp} se={result.nonInferiority.sePp} margin={result.nonInferiority.marginPp} />
        <div className="mt-3 text-[13px]">On the same 1,000 cases, Model 4.1 got <b className="tnum">22</b> right that Model 5.0 got wrong, and Model 5.0 got <b className="tnum">18</b> right that 4.1 got wrong. <span className="text-warning">Yes, but only just.</span>{detail && <> McNemar p = <Mono>{result.nonInferiority.pValue.toFixed(2)}</Mono>.</>}</div>
      </Card>

      <Card title="Cases" padded={false} actions={<span className="text-[12px] text-text-3">Sample of {rows.length} from 1,000 · checked against the answer key in code</span>}>
        <DataTable<CaseRow> rows={rows} rowKey={(r) => r.id} onRowClick={setOpen} pageSize={12}
          filters={[
            { key: "trap", label: "Trap", options: [...new Set(rows.map((r) => r.trapType))].sort(), get: (r) => r.trapType },
            { key: "sev", label: "Severity", options: ["Critical", "High", "Medium"], get: (r) => SEV[r.severity] },
            { key: "out", label: "Outcome", options: ["Pass", "Fail", "Nominated review"], get: (r) => r.outcome },
          ]}
          columns={[
            { key: "id", header: "Case", nowrap: true, render: (r) => <Mono>{r.id}</Mono> },
            { key: "trap", header: "Trap", render: (r) => <Badge>{r.trapType}</Badge> },
            { key: "title", header: "Scenario", render: (r) => <span className="text-text">{r.title}</span> },
            { key: "sev", header: "Severity", render: (r) => SEV[r.severity] },
            { key: "verdict", header: "Result", render: (r) => <span className={cn(!r.pass && r.outcome === "Fail" && "text-danger")}>{r.summary}</span> },
            { key: "votes", header: "AI reviews", align: "right", render: (r) => runPanel(r.votes, r.critical).points.length },
            { key: "out", header: "Outcome", nowrap: true, render: (r) => <DecisionPill label={r.outcome} /> },
          ]} />
      </Card>

      <Drawer open={!!open} onClose={() => setOpen(null)} width={640} title={open?.title ?? ""} subtitle={open && <span className="inline-flex items-center gap-2"><Mono>{open.id}</Mono><Badge>{open.trapType}</Badge>{SEV[open.severity]}</span>}>
        {open && (
          <div className="space-y-5 text-[13px]">
            <section><h3 className="mb-1 text-[13px] text-text-3">Case given to the agent</h3><p className="text-text">{open.prompt}</p><p className="mt-1 text-[12px] text-text-3">The answer key was not included.</p></section>
            <section><h3 className="mb-1 text-[13px] text-text-3">Agent's answer</h3><p className="rounded-md border border-border bg-bg-subtle p-3 text-text">{open.answerText}</p></section>
            <section>
              <h3 className="mb-1 text-[13px] text-text-3">Checked by code</h3>
              <KeyValue items={[
                ...(open.key ? [{ k: "Answer key (computed)", v: open.key }] : []),
                ...(open.answer ? [{ k: "Agent", v: open.answer }] : []),
                { k: "Result", v: <span className="inline-flex items-center gap-2"><DecisionPill label={open.outcome} />{open.failSeverity && <StatusPill tone={open.failSeverity === "critical" ? "danger" : "warning"}>{SEV[open.failSeverity]}</StatusPill>}</span> },
                { k: "Finding", v: open.summary },
                ...(open.diagnosis.length ? [{ k: "Diagnosis", v: open.diagnosis.join(", "), mono: true }] : []),
              ]} />
            </section>
            <section>
              <h3 className="mb-2 text-[13px] text-text-3">AI reviewers judge the reasoning only{open.critical ? " (critical case: needs three agreeing reviews)" : ""}</h3>
              <PanelChart votes={open.votes} critical={open.critical} />
              <ol className="mt-3 divide-y divide-border rounded-md border border-border">
                {open.votes.map((v, i) => (
                  <li key={i} className="flex gap-3 px-3 py-2">
                    <span className="w-5 text-text-3 tnum">{i + 1}</span>
                    <span className="w-16 shrink-0">{v.family}</span>
                    <StatusPill tone={v.verdict === "pass" ? "success" : "danger"}>{v.verdict === "pass" ? "Pass" : "Fail"}</StatusPill>
                    <span className="min-w-0 flex-1 text-text-2">{v.reason}</span>
                    <Mono>{v.clause}</Mono>
                  </li>
                ))}
              </ol>
              {open.outcome === "Nominated review" && <div className="mt-3"><Callout tone="warning" title="Sent to nominated review">9 votes without settling. A reviewer Tallowood nominated decides; see Reviews.</Callout></div>}
            </section>
          </div>
        )}
      </Drawer>

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Send to nominated approver"
        footer={<><Button onClick={() => setSendOpen(false)}>Cancel</Button><Button variant="primary" icon={Send} onClick={() => { setSendOpen(false); toast({ tone: "success", title: `Sent to ${approver}`, body: "Decision, condition and evidence pack link" }); }}>Send</Button></>}>
        <p className="mb-3 text-[13px]">The approver receives the decision, the condition and a link to evidence pack <Mono>{runMeta.evidencePack}</Mono>.</p>
        <label className="text-[13px] text-text-3">Approver
          <select value={approver} onChange={(e) => setApprover(e.target.value)} className="mt-1 block h-9 w-full rounded-md border border-border-strong bg-bg px-2 text-[14px] text-text">
            {nominatedReviewers.filter((r) => !r.role.includes("read-only")).map((r) => <option key={r.name} value={r.name}>{r.name} · {r.team}</option>)}
          </select>
        </label>
      </Modal>
    </div>
  );
}
