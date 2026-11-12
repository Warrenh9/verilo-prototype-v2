import Decimal from "decimal.js";

/* ---------- statistics helpers (pure) ---------- */

/** One-sided 95% upper bound on a failure rate when 0 failures are seen in n: 1 − 0.05^(1/n). */
export const zeroFailureUpperBound = (n: number, alpha = 0.05) => 1 - Math.pow(alpha, 1 / n);

/** Wilson score interval upper bound (z = 1.96). */
export function wilsonUpper(k: number, n: number, z = 1.96) {
  const p = k / n, z2 = z * z;
  return (p + z2 / (2 * n) + z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
}

/** Exact upper bound for k failures in n (Clopper-Pearson style, one-sided) via bisection on the binomial CDF. */
function binomUpper(k: number, n: number, alpha = 0.05) {
  if (k === 0) return zeroFailureUpperBound(n, alpha);
  const cdf = (p: number) => { let s = 0, t = Math.pow(1 - p, n); for (let i = 0; i <= k; i++) { s += t; t *= ((n - i) / (i + 1)) * (p / (1 - p)); } return s; };
  let lo = k / n, hi = 1;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (cdf(mid) > alpha) lo = mid; else hi = mid; }
  return hi;
}

function erfc(x: number) {
  // Abramowitz–Stegun 7.1.26, |error| < 1.5e-7
  const t = 1 / (1 + 0.3275911 * x);
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return y * Math.exp(-x * x);
}
/** McNemar test (no continuity correction), chi-square with 1 df. */
export const mcnemarP = (b: number, c: number) => erfc(Math.sqrt(((b - c) ** 2) / (b + c) / 2));

/**
 * Paired non-inferiority on pass rates. b = current pass / candidate fail, c = the reverse.
 * Difference (candidate − current) = (c − b)/n, SE = √(b + c)/n, one-sided 95% lower bound with z = 1.645.
 */
export function nonInferiority(b: number, c: number, n: number, marginPp: number, z = 1.645) {
  const diffPp = ((c - b) / n) * 100;
  const sePp = (Math.sqrt(b + c) / n) * 100;
  const lowerPp = diffPp - z * sePp;
  return { diffPp, sePp, lowerPp, marginPp, pass: lowerPp >= marginPp, pValue: mcnemarP(b, c) };
}

/* ---------- run scoring ---------- */

export interface SubScore { key: string; label: string; weight: string; n: number; nLabel?: string; value: string; ciLow: string; ciHigh: string; meanVotes?: string; humanResolvedPct?: string }

export interface RunInput {
  subScores: SubScore[];
  /** Bootstrap 95% CI of the overall score, computed upstream from case-level resamples. */
  scoreCi: [string, string];
  critical: { n: number; failures: number };
  high: { n: number; failureTrapTypes: string[]; maxRate: number };
  pairs: { currentPassCandidateFail: number; currentFailCandidatePass: number; n: number; marginPp: number };
  independence: { effectiveReviewers: number; panelSize: number; canaryLowerBounds: number[]; minEffective: number; minCanary: number };
  coverage: { casesPerTrapType: Record<string, number>; minPerType: number };
  conditionRules: { trapType: string; minShareOfHighFailures: number; text: string }[];
}

export type Decision = "Approve" | "Approve with conditions" | "Reject" | "Insufficient evidence";
export interface Gate { key: "critical" | "high" | "nonInferiority" | "independence" | "coverage"; label: string; pass: boolean; detail: string }

export interface RunResult {
  rawScore: string; // 1dp, e.g. "93.3"
  score: number; // displayed, after any cap
  displayRange: [number, number];
  ciDetail: [string, string];
  capped: boolean;
  gates: Gate[];
  conditions: string[];
  decision: Decision;
  nonInferiority: ReturnType<typeof nonInferiority>;
}

export const CRITICAL_CAP = 59;
const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;

/** Weighted score: 100 × Σ weight × value, in decimal arithmetic. */
export function weightedScore(subs: SubScore[]) {
  return subs.reduce((s, x) => s.plus(new Decimal(x.weight).times(x.value)), new Decimal(0)).times(100);
}

export function scoreRun(input: RunInput): RunResult {
  const raw = weightedScore(input.subScores);
  const crit = input.critical;
  const critUpper = binomUpper(crit.failures, crit.n);
  const highK = input.high.failureTrapTypes.length;
  const highUpper = wilsonUpper(highK, input.high.n);
  const ni = nonInferiority(input.pairs.currentPassCandidateFail, input.pairs.currentFailCandidatePass, input.pairs.n, input.pairs.marginPp);
  const ind = input.independence;
  const indPass = ind.effectiveReviewers >= ind.minEffective && ind.canaryLowerBounds.every((b) => b >= ind.minCanary);
  const thin = Object.entries(input.coverage.casesPerTrapType).filter(([, n]) => n < input.coverage.minPerType);
  const types = Object.keys(input.coverage.casesPerTrapType).length;

  const gates: Gate[] = [
    { key: "critical", label: "Critical failures", pass: crit.failures === 0,
      detail: `${crit.failures} failures in ${crit.n}; 95% upper bound on the critical failure rate ${pct(critUpper)}` },
    { key: "high", label: "High-severity failures", pass: highUpper <= input.high.maxRate,
      detail: `${highK} failures in ${input.high.n} (${pct(highK / input.high.n)}); Wilson upper bound ${pct(highUpper)} vs ${pct(input.high.maxRate, 0)} limit` },
    { key: "nonInferiority", label: "Non-inferiority vs current", pass: ni.pass,
      detail: `difference ${ni.diffPp.toFixed(1)} pp, lower bound ${ni.lowerPp.toFixed(2)} pp vs margin ${ni.marginPp.toFixed(1)} pp (McNemar p = ${ni.pValue.toFixed(2)})` },
    { key: "independence", label: "Reviewer independence", pass: indPass,
      detail: `effective reviewer count ${ind.effectiveReviewers.toFixed(1)} of ${ind.panelSize}; lowest canary lower bound ${Math.min(...ind.canaryLowerBounds).toFixed(2)}` },
    { key: "coverage", label: "Trap coverage", pass: thin.length === 0,
      detail: thin.length ? `${thin.length} trap types below ${input.coverage.minPerType} cases` : `all ${types} trap types ≥ ${input.coverage.minPerType} cases` },
  ];
  const g = Object.fromEntries(gates.map((x) => [x.key, x.pass])) as Record<Gate["key"], boolean>;

  const conditions = input.conditionRules
    .filter((r) => highK > 0 && input.high.failureTrapTypes.filter((t) => t === r.trapType).length / highK >= r.minShareOfHighFailures)
    .map((r) => r.text);

  const capped = crit.failures > 0;
  const ciLow = new Decimal(input.scoreCi[0]), ciHigh = new Decimal(input.scoreCi[1]);
  const effLow = capped ? Decimal.min(ciLow, CRITICAL_CAP) : ciLow;

  let decision: Decision;
  if (!g.independence || !g.coverage) decision = "Insufficient evidence";
  else if (!g.critical || !g.nonInferiority || effLow.lt(70)) decision = "Reject";
  else if (g.high && effLow.gte(85) && conditions.length === 0) decision = "Approve";
  else if (g.high && effLow.gte(70)) decision = "Approve with conditions";
  else decision = "Reject";

  const score = capped ? CRITICAL_CAP : raw.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  const displayRange: [number, number] = capped
    ? [CRITICAL_CAP, CRITICAL_CAP]
    : [ciLow.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(), ciHigh.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()];

  return { rawScore: raw.toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toFixed(1), score, displayRange, ciDetail: [ciLow.toFixed(1), ciHigh.toFixed(1)], capped, gates, conditions, decision, nonInferiority: ni };
}

/** Feed one confirmed case verdict into a run (used by "Simulate one critical failure"). */
export function withConfirmedFailure(input: RunInput, severity: "critical" | "high", trapType: string): RunInput {
  if (severity === "critical") return { ...input, critical: { ...input.critical, failures: input.critical.failures + 1 } };
  return { ...input, high: { ...input.high, failureTrapTypes: [...input.high.failureTrapTypes, trapType] } };
}
