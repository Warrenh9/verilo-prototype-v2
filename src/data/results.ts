import type { RunInput } from "../engine/scorer";
import { trapTypes } from "./suite";

/** ClaimDesk Model 5.0 vs 4.1, model-change mode (BRIEF §5). The score is computed from this, never typed. */
export const claimDeskRun: RunInput = {
  subScores: [
    { key: "calculation", label: "Calculation", weight: "0.25", n: 600, value: "0.962", ciLow: "0.948", ciHigh: "0.974", meanVotes: "2.1 (extraction)", humanResolvedPct: "0.3" },
    { key: "reasoning", label: "Reasoning", weight: "0.25", n: 550, value: "0.915", ciLow: "0.892", ciHigh: "0.934", meanVotes: "3.4", humanResolvedPct: "2.2" },
    { key: "trap", label: "Trap detection", weight: "0.15", n: 640, value: "0.880", ciLow: "0.856", ciHigh: "0.902" },
    { key: "escalation", label: "Escalation", weight: "0.15", n: 180, value: "0.930", ciLow: "0.890", ciHigh: "0.962", meanVotes: "2.8", humanResolvedPct: "1.1" },
    { key: "consistency", label: "Consistency", weight: "0.10", n: 200, nLabel: "200 sets", value: "0.950", ciLow: "0.915", ciHigh: "0.975" },
    { key: "regression", label: "Regression vs current", weight: "0.10", n: 944, value: "0.970", ciLow: "0.958", ciHigh: "0.980" },
  ],
  scoreCi: ["91.7", "94.8"],
  critical: { n: 130, failures: 0 },
  // 5 high failures; 3 are trap E2.
  high: { n: 260, failureTrapTypes: ["E2", "E2", "E2", "S5", "A3"], maxRate: 0.05 },
  pairs: { currentPassCandidateFail: 22, currentFailCandidatePass: 18, n: 1000, marginPp: -1.5 },
  independence: { effectiveReviewers: 3.4, panelSize: 5, canaryLowerBounds: [0.93, 0.95, 0.94, 0.96, 0.93], minEffective: 3.0, minCanary: 0.9 },
  coverage: { casesPerTrapType: Object.fromEntries(trapTypes.map((t) => [t.id, t.cases])), minPerType: 30 },
  conditionRules: [
    { trapType: "E2", minShareOfHighFailures: 0.5, text: "Nominated reviewers check claims with missing quotes or proof of ownership for 60 days." },
  ],
};

export const runMeta = {
  id: "run_2026-11-12_cd50",
  agent: "ClaimDesk Agent",
  current: { label: "Current · Model 4.1", snapshot: "model-4.1-2026-03-02" },
  candidate: { label: "Candidate · Model 5.0", snapshot: "model-5.0-2026-10-14" },
  ruleCard: "TMI-HOME-v3 + END-07",
  suite: "Full qualification · 1,000 cases",
  seed: "tmi-claimdesk-2026-11-12-5c1e9a",
  aiCheckingCostUsd: "19.84",
  aiCheckingCapUsd: "30.00",
  evidencePack: "ep_2026-11-12_7a3d",
};
