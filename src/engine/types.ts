/** Shared engine types. Money is always a decimal string ("399250.00") – never a JS float. */

export type Cause = "storm" | "fire" | "escape_of_liquid" | "theft" | "flood" | "wear_and_tear" | "gradual_damage";
export const INSURED_EVENTS: Cause[] = ["storm", "fire", "escape_of_liquid", "theft", "flood"];

/** Where a rule-card value came from, e.g. { doc: "TMI-END-07", clause: "4.1", note: "inserts 3.2" }. */
export interface Source { doc: string; clause: string; effective?: string; note?: string }

export interface Exclusion {
  cause: Cause;
  clause: string; // e.g. "4.2(c)"
  source: Source;
  /** Present when an endorsement deleted the exclusion; it stays visible, struck through. */
  deletedBy?: Source;
}

export interface RuleCard {
  id: string;
  title: string;
  /** Documents in precedence order, highest first, e.g. ["TMI-END-07", "TMI-HOME-v3"]. */
  precedence: string[];
  coveredEvents: Cause[];
  exclusions: Exclusion[];
  basicExcess: string;
  /** Flood excess and the date it starts to apply (an inserted clause applies from its endorsement's date). */
  floodExcess?: string;
  floodExcessFrom?: string;
  excessRule: "highest_single_per_event";
  safetyNetPct: string; // "0" or e.g. "10"
  excessAfterLimits: boolean;
  jewelleryItemLimit?: string;
  tempAccomPct?: string;
  tempAccomMonths?: number;
  referralThreshold: string;
  requestInfoIfMissing: boolean;
  sources: Partial<Record<RuleField, Source>>;
}

export type RuleField =
  | "basicExcess" | "floodExcess" | "excessRule" | "floodExclusion" | "buildingLimit" | "excessOrder"
  | "jewelleryItemLimit" | "tempAccom" | "referralThreshold" | "missingInfo";

export interface Claim {
  cause: Cause;
  eventDate: string; // ISO yyyy-mm-dd
  loss: string; // repair quote or assessed cost
  sumInsured: string;
  hasQuote?: boolean; // default true
  hasProofOfOwnership?: boolean; // default true
}

export type Action = "pay" | "refer_senior_assessor" | "request_info" | "decline";

export interface Settlement {
  covered: boolean;
  declineClause?: string;
  excess: string;
  excessType: "basic" | "flood" | "basic+flood" | "none";
  cap: string;
  settlement: string; // 2dp
  action: Action;
  citations: string[];
}

/** Deliberate mistakes, used to generate the planted wrong answers through the same engine. */
export interface Mistakes {
  excessBeforeLimit?: boolean;
  ignoreLimit?: boolean;
  excessOverride?: "basic" | "flood";
  doubleExcess?: boolean;
  applyDeletedExclusions?: boolean;
  skipReferral?: boolean;
}

export type Severity = "critical" | "high" | "medium" | "low";
export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 10, high: 4, medium: 2, low: 1 };

export type Diagnosis =
  | "cover_error:deleted_exclusion_applied"
  | "cover_error:wrongful_decline"
  | "cover_error:excluded_cause_paid"
  | "excess_error:wrong_excess"
  | "excess_error:double_excess"
  | "limit_error:excess_before_limit"
  | "limit_error:no_cap"
  | "escalation_error:missed_referral"
  | "escalation_error:unneeded_referral"
  | "amount_error:unclassified";
