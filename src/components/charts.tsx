import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { PANEL, runPanel, type Vote } from "../engine/panel";
import { Term } from "./ui";

const FAMILY_FILL: Record<string, string> = { "Family A": "#0B0F14", "Family B": "#FFFFFF", "Family C": "#98A2B3" };

/** Cumulative evidence against votes, with pass / critical-pass / fail thresholds. Each dot is labelled with its family. */
export function PanelChart({ votes, critical }: { votes: Vote[]; critical: boolean }) {
  const r = runPanel(votes, critical);
  const data = [{ vote: 0, evidence: 0, family: "", verdict: "" }, ...r.points.map((p) => ({ ...p, evidence: Number(p.evidence.toFixed(2)) }))];
  return (
    <div>
      <div className="h-[220px]" role="img" aria-label={`Reviewer panel: ${r.points.length} votes, outcome ${r.outcome.replace("_", " ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 64, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#E4E7EC" vertical={false} />
            <XAxis dataKey="vote" type="number" domain={[0, PANEL.maxVotes]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} tick={{ fontSize: 12, fill: "#667085" }} stroke="#D0D5DD" label={{ value: "Votes", position: "insideBottomRight", offset: -2, fontSize: 12, fill: "#667085" }} />
            <YAxis domain={[-6, 10]} ticks={[-6, -3, 0, 3, 6, 9]} tick={{ fontSize: 12, fill: "#667085" }} stroke="#D0D5DD" width={32} />
            <ReferenceLine y={PANEL.passThreshold} stroke="#067647" strokeDasharray="4 3" label={{ value: "Pass +4.55", position: "right", fontSize: 11, fill: "#067647" }} />
            <ReferenceLine y={PANEL.criticalPassThreshold} stroke="#175CD3" strokeDasharray="4 3" label={{ value: "Critical +6.86", position: "right", fontSize: 11, fill: "#175CD3" }} />
            <ReferenceLine y={PANEL.failThreshold} stroke="#B42318" strokeDasharray="4 3" label={{ value: "Fail −2.99", position: "right", fontSize: 11, fill: "#B42318" }} />
            <ReferenceLine y={0} stroke="#D0D5DD" />
            <RTooltip formatter={(v) => [Number(v).toFixed(2), "Evidence"]} labelFormatter={(l) => `Vote ${l}`} contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#E4E7EC" }} />
            <Line type="linear" dataKey="evidence" stroke="#344054" strokeWidth={1.5} isAnimationActive={false}
              dot={(p: { cx?: number; cy?: number; index?: number; payload?: { family: string; verdict: string } }) => {
                if (!p.index || p.cx === undefined || p.cy === undefined) return <g key={`d${p.index}`} />;
                const fam = p.payload!.family;
                return (
                  <g key={`d${p.index}`}>
                    <circle cx={p.cx} cy={p.cy} r={5} fill={FAMILY_FILL[fam]} stroke={p.payload!.verdict === "fail" ? "#B42318" : "#0B0F14"} strokeWidth={1.5} />
                    <text x={p.cx} y={p.cy - 9} textAnchor="middle" fontSize={10} fill="#667085">{fam.replace("Family ", "")}</text>
                  </g>
                );
              }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap gap-4 text-[12px] text-text-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border border-ink bg-ink" />Family A</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border border-ink bg-bg" />Family B</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border border-danger bg-bg" />Red outline = fail vote</span>
        <span>Each agreeing vote adds ≈ 2.94 (reviewer accuracy 0.95).</span>
      </div>
    </div>
  );
}

/** Non-inferiority: difference (candidate − current) with its 90% two-sided interval against the margin. */
export function NonInferiorityChart({ diff, lower, se, margin }: { diff: number; lower: number; se: number; margin: number }) {
  const upper = diff + (diff - lower);
  const min = -2.5, max = 1.5;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  const ticks = [-2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5];
  return (
    <div>
      <div className="relative h-24" role="img" aria-label={`Difference ${diff.toFixed(1)} percentage points, lower bound ${lower.toFixed(2)}, margin ${margin}`}>
        <div className="absolute inset-y-0 left-0 bg-danger-bg" style={{ width: pos(margin) }} />
        <div className="absolute inset-y-0 w-px border-l-2 border-dashed border-danger" style={{ left: pos(margin) }} />
        <div className="absolute top-1 text-[11px] text-danger" style={{ left: `calc(${pos(margin)} - 92px)` }}>Margin {margin} pp</div>
        <div className="absolute inset-y-0 w-px bg-border-strong" style={{ left: pos(0) }} />
        <div className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-ink" style={{ left: pos(lower), width: `calc(${pos(upper)} - ${pos(lower)})` }} />
        <div className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 bg-ink" style={{ left: pos(lower) }} />
        <div className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 bg-ink" style={{ left: pos(upper) }} />
        <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-brand" style={{ left: pos(diff) }} />
        <div className="absolute bottom-1 -translate-x-1/2 font-mono text-[11px] text-text-2" style={{ left: pos(lower) }}>{lower.toFixed(2)}</div>
        <div className="absolute bottom-1 -translate-x-1/2 font-mono text-[11px] text-text-2" style={{ left: pos(diff) }}>{diff.toFixed(1)}</div>
      </div>
      <div className="relative mt-1 h-4 border-t border-border">
        {ticks.map((t) => <span key={t} className="absolute -translate-x-1/2 font-mono text-[11px] text-text-3" style={{ left: pos(t) }}>{t}</span>)}
      </div>
      <p className="mt-3 text-[12px] text-text-3">
        Pass-rate difference, candidate minus current, in percentage points (SE {se.toFixed(2)} pp). <Term explain="Non-inferiority: the new version is shown to be no worse than the current one, within a set margin.">Non-inferior</Term> if the lower bound stays right of the margin.
      </p>
    </div>
  );
}
