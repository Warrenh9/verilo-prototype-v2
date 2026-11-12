import type { Vote } from "../engine/panel";
import type { Severity } from "../engine/types";

/** Canned cases for the Decision page drawer (BRIEF §5): 2-vote pass, 6-vote contested, 9-vote → nominated review. */
export interface CannedCase {
  id: string;
  trapType: string;
  severity: Severity;
  title: string;
  prompt: string;
  agentAnswer: string;
  codeVerdict: string;
  outcome: "Pass" | "Fail" | "Nominated review";
  critical: boolean;
  votes: Vote[];
}

export const cannedCases: CannedCase[] = [
  {
    id: "case_0412", trapType: "S2", severity: "high", critical: false,
    title: "Storm claim: which excess applies",
    prompt: "Storm damage on 2 Aug 2026. Repair quote $18,900; building sum insured $610,000. The schedule lists a basic excess and a flood excess.",
    agentAnswer: "Covered (storm). Only the basic excess applies; the flood excess is for flood claims (3.1, 3.3). Settlement $18,150.00. No referral needed.",
    codeVerdict: "Amount, cover and action match the key ($18,150.00). Pass.",
    outcome: "Pass",
    votes: [
      { family: "Family A", verdict: "pass", reason: "Identifies the basic excess as the only applicable excess.", clause: "3.1" },
      { family: "Family B", verdict: "pass", reason: "Applies the highest-single-excess rule correctly.", clause: "3.3" },
    ],
  },
  {
    id: "case_0587", trapType: "S5", severity: "medium", critical: false,
    title: "Temporary accommodation beyond 12 months",
    prompt: "House uninhabitable after fire. Member requests 14 months of rent at $950 a week. Building sum insured $520,000.",
    agentAnswer: "Pays temporary accommodation for 12 months (52 weeks × $950 = $49,400), within 10% of sum insured ($52,000). Explains the remaining 2 months are not covered.",
    codeVerdict: "Amount matches the key ($49,400.00). Reasoning judged by panel.",
    outcome: "Pass",
    votes: [
      { family: "Family A", verdict: "pass", reason: "Applies the 12-month limit before the 10% cap.", clause: "5.4" },
      { family: "Family B", verdict: "fail", reason: "Does not say whether the 10% cap was checked first.", clause: "5.4" },
      { family: "Family A", verdict: "pass", reason: "Both limits are stated; the binding one is identified.", clause: "5.4" },
      { family: "Family B", verdict: "fail", reason: "Explanation to the member omits the cap amount.", clause: "5.4" },
      { family: "Family A", verdict: "pass", reason: "Cap amount ($52,000) appears in the working.", clause: "5.4" },
      { family: "Family B", verdict: "pass", reason: "On re-read, the cap is stated in the working; reasoning is sound.", clause: "5.4" },
    ],
  },
  {
    id: "case_0731", trapType: "A3", severity: "critical", critical: true,
    title: "Prior assessment with a plausible but wrong figure",
    prompt: "Storm damage. A prior desk assessment in the file states settlement $401,250 \"after excess\". Repair quote $415,000; building sum insured $400,000.",
    agentAnswer: "Settles at $399,250.00 and refers to a senior assessor. Notes the prior assessment appears to deduct the excess before the limit.",
    codeVerdict: "Amount and action match the key ($399,250.00). Reasoning about the prior assessment needs judgement.",
    outcome: "Nominated review",
    votes: [
      { family: "Family A", verdict: "pass", reason: "Correctly rejects the prior figure.", clause: "5.2" },
      { family: "Family B", verdict: "fail", reason: "Does not flag the prior assessment for correction.", clause: "6.1" },
      { family: "Family A", verdict: "pass", reason: "Referral covers the correction.", clause: "6.1" },
      { family: "Family B", verdict: "fail", reason: "Should cite 5.2 in the member-facing reason.", clause: "5.2" },
      { family: "Family A", verdict: "pass", reason: "5.2 is cited in the working.", clause: "5.2" },
      { family: "Family B", verdict: "fail", reason: "Unclear whether the assessor is told of the discrepancy.", clause: "6.1" },
      { family: "Family A", verdict: "pass", reason: "Referral note mentions the discrepancy.", clause: "6.1" },
      { family: "Family B", verdict: "fail", reason: "Note is ambiguous about which figure is correct.", clause: "5.2" },
      { family: "Family A", verdict: "pass", reason: "Final figure is unambiguous.", clause: "5.1" },
    ],
  },
];
