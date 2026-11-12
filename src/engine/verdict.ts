import Decimal from "decimal.js";
import { money, settleClaim } from "./settlement";
import type { Action, Claim, Diagnosis, Mistakes, RuleCard, Settlement, Severity } from "./types";

export interface AgentAnswer {
  covered: boolean;
  settlement: string;
  action: Action;
  citedClauses?: string[];
}

export interface Verdict {
  pass: boolean;
  severity?: Severity;
  diagnosis: Diagnosis[];
  /** Positive = overpaid, negative = underpaid. */
  difference: string;
  summary: string; // e.g. "Overpaid $750.00", "Wrongful decline, underpaid $84,400.00"
  key: Settlement;
}

/** Overpayment tolerance; underpayment tolerance is $0.00. */
export const OVER_TOLERANCE = new Decimal("0.01");

const fmt = (d: Decimal) => "$" + Number(money(d.abs())).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Planted mistakes we can recognise by recomputing them through the engine, most specific first. */
const KNOWN: { label: Diagnosis; m: Mistakes }[] = [
  { label: "cover_error:deleted_exclusion_applied", m: { applyDeletedExclusions: true } },
  { label: "excess_error:double_excess", m: { doubleExcess: true } },
  { label: "excess_error:wrong_excess", m: { excessOverride: "flood" } },
  { label: "excess_error:wrong_excess", m: { excessOverride: "basic" } },
  { label: "limit_error:excess_before_limit", m: { excessBeforeLimit: true } },
  { label: "limit_error:no_cap", m: { ignoreLimit: true } },
];

/**
 * Compare an agent's answer with the answer key computed in code. AI never does this arithmetic.
 * Coverage, amount (±$0.01 over, $0.00 under) and the referral action are checked separately.
 */
export function judgeAnswer(card: RuleCard, claim: Claim, answer: AgentAnswer): Verdict {
  const key = settleClaim(card, claim);
  const diff = new Decimal(answer.settlement).minus(key.settlement);
  const diagnosis: Diagnosis[] = [];
  let severity: Severity | undefined;
  const raise = (s: Severity) => { if (!severity || rank[s] > rank[severity]) severity = s; };
  const parts: string[] = [];

  // Amount: identify which known mistake reproduces the agent's figure.
  const amountWrong = diff.lt(0) || diff.gt(OVER_TOLERANCE);
  if (amountWrong || answer.covered !== key.covered) {
    const match = KNOWN.find(({ m }) => {
      const v = settleClaim(card, claim, m);
      return v.settlement === money(new Decimal(answer.settlement)) && v.covered === answer.covered && v.settlement !== key.settlement;
    });
    if (key.covered && !answer.covered) {
      diagnosis.push(match?.label ?? "cover_error:wrongful_decline");
      raise("critical");
      parts.push(`Wrongful decline, underpaid ${fmt(diff)}`);
    } else if (!key.covered && answer.covered) {
      diagnosis.push("cover_error:excluded_cause_paid");
      raise("high");
      parts.push(`Paid an excluded claim, overpaid ${fmt(diff)}`);
    } else {
      diagnosis.push(match?.label ?? "amount_error:unclassified");
      if (diff.lt(0)) { raise("critical"); parts.push(`Underpaid ${fmt(diff)}`); }
      else { raise("high"); parts.push(`Overpaid ${fmt(diff)}`); }
    }
  }

  // Referral / escalation (only meaningful when cover matches).
  if (key.covered && answer.covered && answer.action !== key.action) {
    const missed = key.action === "refer_senior_assessor" || key.action === "request_info";
    diagnosis.push(missed ? "escalation_error:missed_referral" : "escalation_error:unneeded_referral");
    raise("high");
    parts.push(!missed ? "Referred when not required" : key.action === "request_info" ? "Decided without requesting missing information" : "Paid without required referral");
  }

  const pass = diagnosis.length === 0;
  return { pass, severity, diagnosis, difference: money(diff), summary: pass ? "Pass" : parts.join("; "), key };
}

const rank: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
