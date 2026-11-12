/**
 * Reviewer panel: sequential evidence from AI reviewer votes on the agent's reasoning (never on the right answer).
 * Each vote adds ±ln(acc/(1−acc)) ≈ ±2.94 at 95% accuracy. Stop when evidence crosses a threshold; after 9 votes go to nominated review.
 */
export type Family = "Family A" | "Family B" | "Family C";
export interface Vote { family: Family; verdict: "pass" | "fail"; reason: string; clause: string }

export const PANEL = { accuracy: 0.95, passThreshold: 4.55, criticalPassThreshold: 6.86, failThreshold: -2.99, maxVotes: 9 };
export const voteWeight = (acc = PANEL.accuracy) => Math.log(acc / (1 - acc));

export type PanelOutcome = "pass" | "fail" | "nominated_review" | "open";
export interface PanelResult { points: { vote: number; evidence: number; family: Family; verdict: Vote["verdict"] }[]; outcome: PanelOutcome; settledAt?: number; threshold: number }

/** Families eligible to review: never the agent's own model family. */
export const eligibleFamilies = (agentFamily: Family, all: Family[] = ["Family A", "Family B", "Family C"]) => all.filter((f) => f !== agentFamily);

/** The first two votes must come from two different model families, and none from the agent's family. */
export function validatePanel(votes: Vote[], agentFamily: Family) {
  if (votes.some((v) => v.family === agentFamily)) return "A reviewer shares the agent's model family";
  if (votes.length >= 2 && votes[0].family === votes[1].family) return "First two votes must come from different model families";
  if (votes.length > PANEL.maxVotes) return `More than ${PANEL.maxVotes} votes`;
  return null;
}

export function runPanel(votes: Vote[], critical = false): PanelResult {
  const w = voteWeight();
  const up = critical ? PANEL.criticalPassThreshold : PANEL.passThreshold;
  let e = 0;
  const points: PanelResult["points"] = [];
  for (let i = 0; i < votes.length && i < PANEL.maxVotes; i++) {
    e += votes[i].verdict === "pass" ? w : -w;
    points.push({ vote: i + 1, evidence: e, family: votes[i].family, verdict: votes[i].verdict });
    if (e >= up) return { points, outcome: "pass", settledAt: i + 1, threshold: up };
    if (e <= PANEL.failThreshold) return { points, outcome: "fail", settledAt: i + 1, threshold: up };
  }
  return { points, outcome: points.length >= PANEL.maxVotes ? "nominated_review" : "open", threshold: up };
}
