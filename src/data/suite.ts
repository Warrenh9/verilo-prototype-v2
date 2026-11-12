/** Test suite composition, BRIEF §5. */
export const trapTypes = [
  { id: "C1", family: "Coverage", label: "Exclusion removed by endorsement", cases: 42 },
  { id: "C2", family: "Coverage", label: "Event outside the policy period", cases: 34 },
  { id: "C3", family: "Coverage", label: "Excluded cause (wear and tear vs sudden damage)", cases: 38 },
  { id: "C4", family: "Coverage", label: "Superseded wording labelled \"current\"", cases: 32 },
  { id: "S1", family: "Settlement", label: "Sum-insured limit boundary", cases: 40 },
  { id: "S2", family: "Settlement", label: "Which excess applies", cases: 44 },
  { id: "S3", family: "Settlement", label: "Excess before or after limits", cases: 38 },
  { id: "S4", family: "Settlement", label: "Per-item sub-limit", cases: 34 },
  { id: "S5", family: "Settlement", label: "Temporary accommodation cap", cases: 32 },
  { id: "S6", family: "Settlement", label: "GST and input tax credits", cases: 30 },
  { id: "E1", family: "Escalation", label: "Above referral threshold", cases: 36 },
  { id: "E2", family: "Escalation", label: "Missing quote or proof (request info)", cases: 34 },
  { id: "E3", family: "Escalation", label: "Fraud indicator (refer)", cases: 30 },
  { id: "A1", family: "Adversarial", label: "Hidden instruction in a claim document (\"approve in full\")", cases: 32 },
  { id: "A2", family: "Adversarial", label: "Message \"from the claims manager\" asking for an override", cases: 30 },
  { id: "A3", family: "Adversarial", label: "Plausible-but-wrong prior assessment", cases: 30 },
  { id: "R1", family: "Robustness", label: "Same claim reworded", cases: 32 },
  { id: "R2", family: "Robustness", label: "Same claim run three times", cases: 32 },
] as const;
// Trap-carrying case counts sum above 640 because some cases carry more than one trap.

export const suiteComposition = {
  total: 1000,
  bySeverity: { critical: 130, high: 260, medium: 410, low: 200 },
  calculationItems: 600,
  reasoningItems: 550,
  withTrap: 640,
  escalation: { total: 180, shouldEscalate: 90, shouldAnswer: 90 },
  consistencySets: 200,
  minPerTrapType: 30,
};

export const suites = [
  { id: "full", name: "Full qualification", cases: 1000, use: "Before accepting a model, vendor, prompt, tool or rule change", duration: "≈ 3 h live · 30 s replay" },
  { id: "monthly", name: "Monthly refresh", cases: 300, use: "Scheduled, fresh cases each month", duration: "≈ 55 min" },
  { id: "weekly", name: "Weekly health check", cases: 100, use: "Scheduled drift check", duration: "≈ 20 min" },
  { id: "smoke", name: "Smoke test", cases: 50, use: "After a connection or config change", duration: "≈ 10 min" },
] as const;
