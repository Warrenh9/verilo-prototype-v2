import type { Action, Claim, Mistakes, Severity, Diagnosis } from "../engine/types";

/** Planted traps from BRIEF §5. Wrong answers are produced by the engine from `mistakes`, not typed. */
export interface TrapVariant {
  label: string;
  mistakes: Mistakes;
  covered?: boolean; // agent's coverage decision if different from the engine's
  action?: Action; // agent's action override
  expected: { settlement: string; pass: boolean; severity?: Severity; diagnosis?: Diagnosis; summary: string };
}
export interface Trap { id: string; trapType: string; title: string; critical: boolean; facts: Claim; description: string; mustCite?: string[]; variants: TrapVariant[] }

export const trap1: Trap = {
  id: "trap_s1_sum_insured",
  trapType: "S1",
  title: "Sum-insured limit, excess order and referral",
  critical: true,
  description: "Storm damage on 9 Mar 2026. Repair quote $412,600; building sum insured $400,000.",
  facts: { cause: "storm", eventDate: "2026-03-09", loss: "412600", sumInsured: "400000" },
  variants: [
    { label: "Correct, refers to senior assessor", mistakes: {}, expected: { settlement: "399250.00", pass: true, summary: "Pass" } },
    { label: "Correct amount, pays without referral", mistakes: { skipReferral: true }, action: "pay", expected: { settlement: "399250.00", pass: false, severity: "high", diagnosis: "escalation_error:missed_referral", summary: "Paid without required referral" } },
    { label: "Excess deducted before the limit", mistakes: { excessBeforeLimit: true }, expected: { settlement: "400000.00", pass: false, severity: "high", diagnosis: "limit_error:excess_before_limit", summary: "Overpaid $750.00" } },
    { label: "Ignores the sum insured", mistakes: { ignoreLimit: true }, expected: { settlement: "411850.00", pass: false, severity: "high", diagnosis: "limit_error:no_cap", summary: "Overpaid $12,600.00" } },
    { label: "Applies the flood excess to a storm claim", mistakes: { excessOverride: "flood" }, expected: { settlement: "398000.00", pass: false, severity: "critical", diagnosis: "excess_error:wrong_excess", summary: "Underpaid $1,250.00" } },
  ],
};

export const trap2: Trap = {
  id: "trap_c1_flood_endorsement",
  trapType: "C1",
  title: "Flood exclusion removed by endorsement",
  critical: true,
  description: "Flood damage on 14 Feb 2026. The documents include the original wording with clause 4.2(c) and Endorsement 07. Assessed repair cost $86,400; building sum insured $650,000.",
  facts: { cause: "flood", eventDate: "2026-02-14", loss: "86400", sumInsured: "650000" },
  mustCite: ["END-07 §3.1", "END-07 §4.1"],
  variants: [
    { label: "Correct, covered", mistakes: {}, expected: { settlement: "84400.00", pass: true, summary: "Pass" } },
    { label: "Declines under deleted clause 4.2(c)", mistakes: { applyDeletedExclusions: true }, expected: { settlement: "0.00", pass: false, severity: "critical", diagnosis: "cover_error:deleted_exclusion_applied", summary: "Wrongful decline, underpaid $84,400.00" } },
    { label: "Covered, basic excess instead of flood excess", mistakes: { excessOverride: "basic" }, expected: { settlement: "85650.00", pass: false, severity: "high", diagnosis: "excess_error:wrong_excess", summary: "Overpaid $1,250.00" } },
    { label: "Deducts both excesses", mistakes: { doubleExcess: true }, expected: { settlement: "83650.00", pass: false, severity: "critical", diagnosis: "excess_error:double_excess", summary: "Underpaid $750.00" } },
  ],
};

export const traps = [trap1, trap2];

/** BRIEF §6 expected results per sample bundle (test fixtures). */
export const bundleExpectations = [
  { bundle: ["TMI-HOME-v3.pdf", "TMI-END-07.pdf"], label: "TMI-HOME-v3 + TMI-END-07",
    trap1: { settlement: "399250.00", action: "refer_senior_assessor" as Action }, trap2: { covered: true, settlement: "84400.00" } },
  { bundle: ["TMI-HOME-v3.pdf"], label: "TMI-HOME-v3 alone",
    trap1: { settlement: "399250.00", action: "refer_senior_assessor" as Action }, trap2: { covered: false, settlement: "0.00", declineClause: "4.2(c)" } },
  { bundle: ["TMI-PREMIER-v1.pdf"], label: "TMI-PREMIER-v1",
    trap1: { settlement: "412100.00", action: "refer_senior_assessor" as Action }, trap2: { covered: true, settlement: "85400.00" } },
];
