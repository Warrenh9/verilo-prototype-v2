import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/pdf-text.json";
import { settleClaim, tempAccommodationCap, jewelleryPayable } from "./settlement";
import { judgeAnswer } from "./verdict";
import { parsePolicyText, ruleCardFromParse } from "./parser";
import { scoreRun, withConfirmedFailure, zeroFailureUpperBound, wilsonUpper, nonInferiority, weightedScore } from "./scorer";
import { runPanel, validatePanel, voteWeight, type Vote } from "./panel";
import { buildLedger, verifyLedger, commitSeed, verifySeed, sha256Hex, hashObject } from "./hash";
import { demoRuleCard } from "../data/policy";
import { trap1, trap2, traps, bundleExpectations } from "../data/traps";
import { claimDeskRun } from "../data/results";

const fx = fixtures as Record<string, { name: string; pages: string[] }>;
const bundle = (names: string[]) => parsePolicyText(names.map((n) => fx[n]));

describe("settlement engine (BRIEF §5)", () => {
  it("trap 1 correct answer: $399,250.00, refer to senior assessor", () => {
    const s = settleClaim(demoRuleCard, trap1.facts);
    expect(s).toMatchObject({ covered: true, settlement: "399250.00", action: "refer_senior_assessor", excess: "750.00", cap: "400000.00" });
  });
  it("trap 2 correct answer: covered, $84,400.00, no referral, cites END-07 §3.1 and §4.1", () => {
    const s = settleClaim(demoRuleCard, trap2.facts);
    expect(s).toMatchObject({ covered: true, settlement: "84400.00", action: "pay", excess: "2000.00", excessType: "flood" });
    expect(s.citations).toEqual(expect.arrayContaining(["TMI-END-07 3.1", "TMI-END-07 4.1"]));
  });
  for (const trap of traps)
    for (const v of trap.variants)
      it(`${trap.id}: "${v.label}" → $${v.expected.settlement}`, () => {
        expect(settleClaim(demoRuleCard, trap.facts, v.mistakes).settlement).toBe(v.expected.settlement);
      });
  it("flood before END-07's effective date is still excluded", () => {
    expect(settleClaim(demoRuleCard, { ...trap2.facts, eventDate: "2025-06-30" })).toMatchObject({ covered: false, declineClause: "4.2(c)" });
  });
  it("excluded causes are declined", () => {
    expect(settleClaim(demoRuleCard, { ...trap1.facts, cause: "wear_and_tear" }).action).toBe("decline");
  });
  it("missing quote or proof → request information", () => {
    expect(settleClaim(demoRuleCard, { ...trap2.facts, hasQuote: false }).action).toBe("request_info");
  });
  it("sub-limits", () => {
    expect(jewelleryPayable(demoRuleCard, "4200")).toBe("3000.00");
    expect(jewelleryPayable(demoRuleCard, "4200", true)).toBe("4200.00");
    expect(tempAccommodationCap(demoRuleCard, "400000", "1200", 60)).toBe("40000.00"); // 12 months max, 10% SI cap
    expect(tempAccommodationCap(demoRuleCard, "400000", "800", 20)).toBe("16000.00");
  });
});

describe("verdict logic", () => {
  for (const trap of traps)
    for (const v of trap.variants)
      it(`${trap.id}: "${v.label}" → ${v.expected.summary}`, () => {
        const s = settleClaim(demoRuleCard, trap.facts, v.mistakes);
        const verdict = judgeAnswer(demoRuleCard, trap.facts, { covered: v.covered ?? s.covered, settlement: s.settlement, action: v.action ?? s.action });
        expect(verdict.pass).toBe(v.expected.pass);
        expect(verdict.severity).toBe(v.expected.severity);
        expect(verdict.summary).toBe(v.expected.summary);
        if (v.expected.diagnosis) expect(verdict.diagnosis).toContain(v.expected.diagnosis);
      });
  it("tolerance: +$0.01 passes, −$0.01 is a critical underpayment", () => {
    const base = { covered: true, action: "refer_senior_assessor" as const };
    expect(judgeAnswer(demoRuleCard, trap1.facts, { ...base, settlement: "399250.01" }).pass).toBe(true);
    expect(judgeAnswer(demoRuleCard, trap1.facts, { ...base, settlement: "399250.02" }).severity).toBe("high");
    expect(judgeAnswer(demoRuleCard, trap1.facts, { ...base, settlement: "399249.99" }).severity).toBe("critical");
  });
});

describe("policy parser (BRIEF §6)", () => {
  it("rebuilds the signed demo rule card from TMI-HOME-v3 + TMI-END-07", () => {
    const p = bundle(["TMI-HOME-v3.pdf", "TMI-END-07.pdf"]);
    expect(p.inDemoFormat).toBe(true);
    expect(p.missing).toEqual([]);
    const card = ruleCardFromParse(p);
    expect({ ...card, title: demoRuleCard.title }).toEqual(demoRuleCard);
    expect(p.changes.map((c) => `${c.kind} ${c.clause} by ${c.by.doc} §${c.by.clause}`)).toEqual(["deleted 4.2(c) by TMI-END-07 §3.1", "inserted 3.2 by TMI-END-07 §4.1"]);
  });
  it("order of documents does not matter", () => {
    expect(ruleCardFromParse(bundle(["TMI-END-07.pdf", "TMI-HOME-v3.pdf"]))).toEqual(ruleCardFromParse(bundle(["TMI-HOME-v3.pdf", "TMI-END-07.pdf"])));
  });
  for (const e of bundleExpectations)
    it(`${e.label}: trap 1 and trap 2 match the §6 table`, () => {
      const p = bundle(e.bundle);
      expect(p.missing).toEqual([]);
      const card = ruleCardFromParse(p);
      expect(settleClaim(card, trap1.facts)).toMatchObject(e.trap1);
      expect(settleClaim(card, trap2.facts)).toMatchObject(e.trap2);
    });
  it("Premier: 10% safety net, $500 excess, $1,000 flood excess", () => {
    const c = ruleCardFromParse(bundle(["TMI-PREMIER-v1.pdf"]));
    expect(c).toMatchObject({ safetyNetPct: "10", basicExcess: "500", floodExcess: "1000", tempAccomMonths: 18, jewelleryItemLimit: "5000" });
  });
  it("same agent answer passes with the endorsement and fails without it", () => {
    const withEnd = ruleCardFromParse(bundle(["TMI-HOME-v3.pdf", "TMI-END-07.pdf"]));
    const alone = ruleCardFromParse(bundle(["TMI-HOME-v3.pdf"]));
    const answer = { covered: true, settlement: "84400.00", action: "pay" as const };
    expect(judgeAnswer(withEnd, trap2.facts, answer).pass).toBe(true);
    expect(judgeAnswer(alone, trap2.facts, answer)).toMatchObject({ pass: false, diagnosis: ["cover_error:excluded_cause_paid"] });
  });
  it("unrelated PDF: not in the demo format, nothing invented", () => {
    const p = bundle(["unrelated-facilities-report.pdf"]);
    expect(p.inDemoFormat).toBe(false);
    expect(p.found).toEqual([]);
    expect(p.missing).toHaveLength(10);
    expect(p.fields).toEqual({});
    expect(p.warnings[0]).toMatch(/Not in the demo format/);
  });
  it("endorsement alone asks for its wording", () => {
    const p = bundle(["TMI-END-07.pdf"]);
    expect(p.inDemoFormat).toBe(false);
    expect(p.warnings.join(" ")).toMatch(/No policy wording loaded/);
  });
  it("a missing clause is flagged, not filled", () => {
    const text = fx["TMI-HOME-v3.pdf"].pages[0].replace(/6\.1 Your claim[\s\S]*?\$250,000\./, "");
    const p = parsePolicyText([{ name: "x.pdf", pages: [text] }]);
    expect(p.missing.map((m) => m.field)).toEqual(["referralThreshold"]);
    expect(() => ruleCardFromParse(p)).toThrow(/referral threshold/);
  });
});

describe("scorer", () => {
  it("raw score 93.3 is computed from the sub-score table", () => {
    expect(weightedScore(claimDeskRun.subScores).toFixed(3)).toBe("93.275");
  });
  it("ClaimDesk 5.0 vs 4.1 → 93, range 92–95, Approve with conditions", () => {
    const r = scoreRun(claimDeskRun);
    expect(r.rawScore).toBe("93.3");
    expect(r.score).toBe(93);
    expect(r.displayRange).toEqual([92, 95]);
    expect(r.decision).toBe("Approve with conditions");
    expect(r.gates.every((g) => g.pass)).toBe(true);
    expect(r.conditions).toEqual(["Nominated reviewers check claims with missing quotes or proof of ownership for 60 days."]);
  });
  it("gate statistics match §5", () => {
    expect((zeroFailureUpperBound(130) * 100).toFixed(1)).toBe("2.3");
    expect((wilsonUpper(5, 260) * 100).toFixed(1)).toBe("4.4");
    const ni = nonInferiority(22, 18, 1000, -1.5);
    expect(ni.diffPp.toFixed(1)).toBe("-0.4");
    expect(ni.sePp.toFixed(2)).toBe("0.63");
    expect(ni.lowerPp.toFixed(2)).toBe("-1.44");
    expect(ni.pass).toBe(true);
    expect(ni.pValue.toFixed(2)).toBe("0.53");
  });
  it("one confirmed critical failure (trap 2 wrongful decline) → 59, Reject", () => {
    const s = settleClaim(demoRuleCard, trap2.facts, { applyDeletedExclusions: true });
    const v = judgeAnswer(demoRuleCard, trap2.facts, { covered: s.covered, settlement: s.settlement, action: s.action });
    expect(v.severity).toBe("critical");
    const r = scoreRun(withConfirmedFailure(claimDeskRun, v.severity as "critical", trap2.trapType));
    expect(r.score).toBe(59);
    expect(r.capped).toBe(true);
    expect(r.decision).toBe("Reject");
    expect(r.gates.find((g) => g.key === "critical")!.pass).toBe(false);
  });
  it("decision rules", () => {
    const noCond = { ...claimDeskRun, high: { ...claimDeskRun.high, failureTrapTypes: ["S5", "A3"] } };
    expect(scoreRun(noCond).decision).toBe("Approve");
    expect(scoreRun({ ...claimDeskRun, pairs: { ...claimDeskRun.pairs, currentPassCandidateFail: 40 } }).decision).toBe("Reject");
    expect(scoreRun({ ...claimDeskRun, independence: { ...claimDeskRun.independence, effectiveReviewers: 2.1 } }).decision).toBe("Insufficient evidence");
    expect(scoreRun({ ...claimDeskRun, coverage: { ...claimDeskRun.coverage, casesPerTrapType: { ...claimDeskRun.coverage.casesPerTrapType, S6: 12 } } }).decision).toBe("Insufficient evidence");
    expect(scoreRun({ ...noCond, scoreCi: ["80.0", "86.0"] }).decision).toBe("Approve with conditions");
    expect(scoreRun({ ...noCond, scoreCi: ["65.0", "75.0"] }).decision).toBe("Reject");
  });
});

describe("reviewer panel", () => {
  const v = (family: Vote["family"], verdict: Vote["verdict"]): Vote => ({ family, verdict, reason: "", clause: "" });
  it("vote weight ≈ 2.94; two agree = 5.89; three = 8.83", () => {
    expect(voteWeight().toFixed(2)).toBe("2.94");
    expect((2 * voteWeight()).toFixed(2)).toBe("5.89");
    expect((3 * voteWeight()).toFixed(2)).toBe("8.83");
  });
  it("clear pass at 2 votes; critical needs 3", () => {
    expect(runPanel([v("Family A", "pass"), v("Family B", "pass")])).toMatchObject({ outcome: "pass", settledAt: 2 });
    expect(runPanel([v("Family A", "pass"), v("Family B", "pass"), v("Family A", "pass")], true)).toMatchObject({ outcome: "pass", settledAt: 3 });
  });
  it("contested case settles at 6; deadlock goes to nominated review at 9", () => {
    const seq = (s: string) => [...s].map((c, i) => v(i % 2 ? "Family B" : "Family A", c === "P" ? "pass" : "fail"));
    expect(runPanel(seq("PFPFPP"))).toMatchObject({ outcome: "pass", settledAt: 6 });
    expect(runPanel(seq("PFPFPFPFP"))).toMatchObject({ outcome: "nominated_review" });
    expect(runPanel(seq("FF"))).toMatchObject({ outcome: "fail", settledAt: 2 });
  });
  it("first two votes from different families; agent's own family excluded", () => {
    expect(validatePanel([v("Family A", "pass"), v("Family A", "pass")], "Family C")).toMatch(/different/);
    expect(validatePanel([v("Family C", "pass")], "Family C")).toMatch(/model family/);
    expect(validatePanel([v("Family A", "pass"), v("Family B", "pass")], "Family C")).toBeNull();
  });
});

describe("hashing and ledger", () => {
  it("SHA-256 known vector", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("canonical hashing ignores key order", async () => {
    expect(await hashObject({ a: 1, b: [1, { d: 2, c: 3 }] })).toBe(await hashObject({ b: [1, { c: 3, d: 2 }], a: 1 }));
  });
  it("seed commitment verifies", async () => {
    const c = await commitSeed("s1");
    expect(await verifySeed("s1", c)).toBe(true);
    expect(await verifySeed("s2", c)).toBe(false);
  });
  it("ledger verifies, and a tampered entry breaks the chain from that point", async () => {
    const items = ["rule_card_signed", "seed_committed", "suite_generated", "run_started", "votes", "nominated_review", "score_computed"].map((type, i) => ({ type, at: `2026-11-12T0${i}:00:00Z`, payload: { i } }));
    const ledger = await buildLedger(items);
    expect((await verifyLedger(ledger)).ok).toBe(true);
    const tampered = ledger.map((e) => (e.index === 3 ? { ...e, payload: { i: 99 } } : e));
    const r = await verifyLedger(tampered);
    expect(r.firstBroken).toBe(3);
    expect(r.checks.map((c) => c.ok)).toEqual([true, true, true, false, false, false, false]);
  });
  it("replaying the score gives the identical score hash", async () => {
    expect(await hashObject(scoreRun(claimDeskRun))).toBe(await hashObject(scoreRun(structuredClone(claimDeskRun))));
  });
});

describe("demo data consistency", async () => {
  const { cannedCases } = await import("../data/cases");
  it("canned cases settle at 2 votes, 6 votes, and go to nominated review at 9", () => {
    expect(cannedCases.map((c) => { const r = runPanel(c.votes, c.critical); return [r.outcome, r.points.length]; }))
      .toEqual([["pass", 2], ["pass", 6], ["nominated_review", 9]]);
    for (const c of cannedCases) expect(validatePanel(c.votes, "Family C")).toBeNull();
  });
  it("canned case figures recompute", () => {
    expect(settleClaim(demoRuleCard, { cause: "storm", eventDate: "2026-08-02", loss: "18900", sumInsured: "610000" }).settlement).toBe("18150.00");
    expect(settleClaim(demoRuleCard, { cause: "storm", eventDate: "2026-08-02", loss: "415000", sumInsured: "400000" })).toMatchObject({ settlement: "399250.00", action: "refer_senior_assessor" });
    expect(tempAccommodationCap(demoRuleCard, "520000", "950", 61)).toBe("49400.00");
  });
});
