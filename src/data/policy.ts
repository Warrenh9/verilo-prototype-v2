import type { RuleCard } from "../engine/types";

/** Policy clauses, BRIEF §5. */
export const policyDocs = [
  { ref: "TMI-HOME-v3", title: "Tallowood Home Insurance wording v3", effective: "2024-01-01", effectiveText: "1 Jan 2024" },
  { ref: "TMI-END-07", title: "Endorsement 07", effective: "2025-07-01", effectiveText: "1 Jul 2025", note: "Takes precedence" },
];

export interface Clause { id: string; text: string; source: string; deletedBy?: string; insertedBy?: string }
export const clauses: Clause[] = [
  { id: "3.1", text: "Basic excess $750 for each claim", source: "TMI-HOME-v3" },
  { id: "3.2", text: "Flood excess $2,000", source: "TMI-END-07", insertedBy: "END-07 §4.1" },
  { id: "3.3", text: "Only the highest applicable excess is deducted for each event", source: "TMI-HOME-v3" },
  { id: "4.2(a)", text: "Not covered: wear and tear", source: "TMI-HOME-v3" },
  { id: "4.2(b)", text: "Not covered: gradual damage", source: "TMI-HOME-v3" },
  { id: "4.2(c)", text: "Not covered: flood", source: "TMI-HOME-v3", deletedBy: "END-07 §3.1 from 1 Jul 2025" },
  { id: "5.1", text: "Most we pay for building damage is the building sum insured", source: "TMI-HOME-v3" },
  { id: "5.2", text: "Excess is deducted after applying the limits in 5.1", source: "TMI-HOME-v3" },
  { id: "5.3", text: "Jewellery and watches: $3,000 per item unless specified", source: "TMI-HOME-v3" },
  { id: "5.4", text: "Temporary accommodation: up to 10% of building sum insured, no more than 12 months", source: "TMI-HOME-v3" },
  { id: "6.1", text: "Settlement above $250,000 must be referred to a senior assessor before payment", source: "TMI-HOME-v3" },
  { id: "6.2", text: "If a repair quote or proof of ownership is missing, request it before deciding", source: "TMI-HOME-v3" },
];

/** Shown verbatim in a CodeBlock. */
export const RULE_CARD_TEXT = `RULE CARD  TMI-HOME-v3 + END-07   precedence: END-07 > TMI-HOME-v3 > CLAIMS-MANUAL
COVER   building: storm, fire, escape_of_liquid, theft, flood   [END07-3.1 deletes 4.2(c)]
EXCL    wear_and_tear [4.2a]  gradual_damage [4.2b]
EXCESS  basic=750 flood=2000 rule=highest_single_per_event      [3.1, END07-4.1, 3.3]
LIMIT   building=min(loss, sum_insured) excess_after_limits     [5.1, 5.2]
        jewellery_item=3000  temp_accom=min(10% SI, 12 months)  [5.3, 5.4]
REFER   settlement>250000 -> senior_assessor                    [6.1]
        missing_quote_or_proof -> request_info                  [6.2]
STEPS   S1:reason:cover  S2:reason:excess  S3:calc:settlement  S4:reason:referral`;

const H = (clause: string) => ({ doc: "TMI-HOME-v3", clause, effective: "2024-01-01" });
const END07 = (clause: string, note: string) => ({ doc: "TMI-END-07", clause, effective: "2025-07-01", note });

/** The signed rule card as structured data. Tests check the parser rebuilds exactly this from the sample PDFs. */
export const demoRuleCard: RuleCard = {
  id: "TMI-HOME-v3+TMI-END-07",
  title: "Tallowood Home Insurance + Endorsement 07",
  precedence: ["TMI-END-07", "TMI-HOME-v3"],
  coveredEvents: ["storm", "fire", "escape_of_liquid", "theft", "flood"],
  exclusions: [
    { cause: "wear_and_tear", clause: "4.2(a)", source: H("4.2(a)") },
    { cause: "gradual_damage", clause: "4.2(b)", source: H("4.2(b)") },
    { cause: "flood", clause: "4.2(c)", source: H("4.2(c)"), deletedBy: END07("3.1", "deletes 4.2(c)") },
  ],
  basicExcess: "750",
  floodExcess: "2000",
  floodExcessFrom: "2025-07-01",
  excessRule: "highest_single_per_event",
  safetyNetPct: "0",
  excessAfterLimits: true,
  jewelleryItemLimit: "3000",
  tempAccomPct: "10",
  tempAccomMonths: 12,
  referralThreshold: "250000",
  requestInfoIfMissing: true,
  sources: {
    basicExcess: H("3.1"),
    floodExcess: END07("4.1", "inserts 3.2"),
    excessRule: H("3.3"),
    floodExclusion: H("4.2(c)"),
    buildingLimit: H("5.1"),
    excessOrder: H("5.2"),
    jewelleryItemLimit: H("5.3"),
    tempAccom: H("5.4"),
    referralThreshold: H("6.1"),
    missingInfo: H("6.2"),
  },
};

export const signature = {
  signer: "Head of Home Claims, Tallowood Mutual",
  signedOn: "4 Nov 2026",
  signedAt: "2026-11-04T10:12:00+11:00",
};

/** Scripted second-extractor cross-check: one difference, resolved by the policy owner. */
export const crossCheck = {
  extractorA: "Extractor A · Family A",
  extractorB: "Extractor B · Family B",
  agreed: 14,
  differences: [
    {
      field: "Flood cover",
      a: "Covered — 4.2(c) deleted by END-07 §3.1 from 1 Jul 2025",
      b: "Excluded under 4.2(c)",
      cause: "Extractor B missed END-07 §3.1",
      resolution: "Endorsement 07 removes the flood exclusion from 1 Jul 2025",
      resolvedBy: "Head of Home Claims, Tallowood Mutual",
    },
  ],
};

/** Ruled-card versions for the Rule cards page. */
export const ruleCards = [
  { id: "rc_tmi_home_v3_end07", name: "Tallowood Home v3 + Endorsement 07", version: "3.07", status: "Signed" as const, signer: "Head of Home Claims, Tallowood Mutual", date: "4 Nov 2026", agents: ["ClaimDesk Agent", "Coverage Triage Agent"] },
  { id: "rc_tmi_home_v3", name: "Tallowood Home v3", version: "3.00", status: "Signed" as const, signer: "Head of Home Claims, Tallowood Mutual", date: "12 Dec 2023", agents: [], superseded: true },
  { id: "rc_tmi_motor_v2", name: "Tallowood Motor v2", version: "2.01", status: "Signed" as const, signer: "Head of Motor Claims, Tallowood Mutual", date: "18 Aug 2026", agents: ["Motor Settlement Agent"] },
  { id: "rc_tmi_onboarding_v1", name: "Member onboarding procedures v1", version: "1.00", status: "Awaiting signature" as const, signer: "—", date: "—", agents: ["Member Onboarding Agent"] },
  { id: "rc_tmi_contents_v1", name: "Tallowood Contents v1 (draft)", version: "0.3", status: "Draft" as const, signer: "—", date: "—", agents: [] },
];
