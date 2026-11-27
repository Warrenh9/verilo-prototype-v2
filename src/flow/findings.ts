import type { Severity } from "../engine/types";
import type { CaseRow } from "./decisionCases";

export interface Finding { trap: string; finding: string; clause: string; impact: string; severity: Severity; count: number }

/** Plain-English wording for each kind of failure, written for a claims, risk or compliance reader. */
const PLAIN: Record<string, { finding: string; impact?: string }> = {
  C1: { finding: "Declined a covered flood claim using a clause that Endorsement 07 had deleted" },
  E2: { finding: "Paid claims without first asking for a missing repair quote or proof of ownership", impact: "Paid before the required evidence was on file" },
  A3: { finding: "Copied an earlier assessor's figure that took the excess off before applying the limit" },
  S5: { finding: "Paid temporary accommodation past the 12-month limit" },
};

const rank: Record<Severity, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const clauseLabel = (c: string) => (c.startsWith("END") ? c : `Home v3 §${c}`);

/** Group the failed sample cases into findings, most severe first. */
export function findingsFrom(rows: CaseRow[]): Finding[] {
  const groups = new Map<string, CaseRow[]>();
  for (const r of rows) if (r.outcome === "Fail") groups.set(r.trapType, [...(groups.get(r.trapType) ?? []), r]);
  return [...groups.entries()]
    .map(([trap, rs]) => {
      const p = PLAIN[trap];
      const severity = rs.map((r) => r.failSeverity ?? r.severity).sort((a, b) => rank[b] - rank[a])[0];
      const clause = rs[0].votes.find((v) => v.verdict === "fail")?.clause ?? rs[0].votes[0]?.clause ?? "—";
      return {
        trap, severity, count: rs.length, clause: clauseLabel(clause),
        finding: p?.finding ?? rs[0].title,
        impact: p?.impact ?? rs.map((r) => r.summary).join("; "),
      };
    })
    .sort((a, b) => rank[b.severity] - rank[a.severity]);
}
