import type { LedgerInput } from "../engine/hash";
import { RULE_CARD_TEXT, signature } from "./policy";
import { runMeta } from "./results";
import { sd } from "../lib/demoClock";

/** Ledger events for evidence pack ep_2026-11-12_7a3d. Hashes are computed at runtime from these payloads. */
export const evidenceLedgerItems = (seedCommitment: string, scoreHash: string): LedgerInput[] => [
  { type: "Rule card signed", at: signature.signedAt, payload: { ruleCard: "TMI-HOME-v3 + END-07", text: RULE_CARD_TEXT, signer: signature.signer } },
  { type: "Seed committed", at: sd("2026-11-12T09:02:11+11:00"), payload: { commitment: seedCommitment } },
  { type: "Suite generated", at: sd("2026-11-12T09:02:40+11:00"), payload: { cases: 1000, critical: 130, high: 260, trapTypes: 18 } },
  { type: "Run started", at: sd("2026-11-12T09:03:05+11:00"), payload: { run: runMeta.id, current: runMeta.current.snapshot, candidate: runMeta.candidate.snapshot, harness: "side effects stubbed" } },
  { type: "Reviewer votes recorded", at: sd("2026-11-12T11:48:30+11:00"), payload: { votes: 2731, families: ["Family A", "Family B"], excluded: "Family C (agent's own)" } },
  { type: "Nominated review", at: sd("2026-11-12T12:20:04+11:00"), payload: { cases: 16, reviewers: ["Model Risk", "Claims Quality"], veriloStaffInvolved: false } },
  { type: "Score computed", at: sd("2026-11-12T12:21:00+11:00"), payload: { scoreHash } },
];

export const standardsMapping = [
  { standard: "AIUC-1", items: [
    { topic: "Third-party testing of AI agents", evidence: ["Run started", "Reviewer votes recorded", "Score computed"] },
    { topic: "Adversarial robustness", evidence: ["Suite generated (A1–A3 traps)"] },
    { topic: "Human oversight of contested outcomes", evidence: ["Nominated review"] },
  ] },
  { standard: "ISO/IEC 42001", items: [
    { topic: "Verification and validation of AI systems", evidence: ["Suite generated", "Score computed"] },
    { topic: "Documented requirements and change control", evidence: ["Rule card signed", "Run started"] },
  ] },
  { standard: "APRA CPS 230", items: [
    { topic: "Management of material service providers", evidence: ["Run started (vendor model change)", "Score computed"] },
    { topic: "Operational risk controls and testing", evidence: ["Seed committed", "Reviewer votes recorded", "Nominated review"] },
  ] },
];
