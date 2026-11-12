import Decimal from "decimal.js";
import type { Claim, Exclusion, Mistakes, RuleCard, Settlement } from "./types";

const D = (v: string | number) => new Decimal(v);
export const money = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);

/** An exclusion applies unless an endorsement deleted it on or before the event date. */
export function exclusionActive(ex: Exclusion, eventDate: string, ignoreDeletions = false) {
  if (ignoreDeletions || !ex.deletedBy) return true;
  return !!ex.deletedBy.effective && eventDate < ex.deletedBy.effective;
}

/**
 * Settle a building claim against a signed rule card.
 * S1 cover → S2 excess (highest single applicable) → S3 limit, then excess after limits → S4 referral / missing information.
 * `mistakes` reproduces planted wrong answers through the same arithmetic.
 */
export function settleClaim(card: RuleCard, claim: Claim, mistakes: Mistakes = {}): Settlement {
  const citations: string[] = [];
  const cite = (s?: { doc: string; clause: string }) => s && citations.push(`${s.doc} ${s.clause}`);

  // S1 cover
  const blocking = card.exclusions.find((ex) => ex.cause === claim.cause && exclusionActive(ex, claim.eventDate, mistakes.applyDeletedExclusions));
  const insured = card.coveredEvents.includes(claim.cause);
  if (!insured || blocking) {
    if (blocking) cite(blocking.source);
    return { covered: false, declineClause: blocking?.clause, excess: "0.00", excessType: "none", cap: "0.00", settlement: "0.00", action: "decline", citations };
  }
  for (const ex of card.exclusions) if (ex.cause === claim.cause && ex.deletedBy) cite(ex.deletedBy);

  // S2 excess
  const basic = D(card.basicExcess);
  const floodApplies = claim.cause === "flood" && card.floodExcess !== undefined && (!card.floodExcessFrom || claim.eventDate >= card.floodExcessFrom);
  const flood = card.floodExcess !== undefined ? D(card.floodExcess) : undefined;
  let excess: Decimal;
  let excessType: Settlement["excessType"];
  if (mistakes.doubleExcess && flood) { excess = basic.plus(flood); excessType = "basic+flood"; }
  else if (mistakes.excessOverride === "flood" && flood) { excess = flood; excessType = "flood"; }
  else if (mistakes.excessOverride === "basic") { excess = basic; excessType = "basic"; }
  else if (floodApplies && flood!.gt(basic)) { excess = flood!; excessType = "flood"; } // highest single applicable excess
  else { excess = basic; excessType = "basic"; }
  cite(card.sources.basicExcess);
  if (excessType !== "basic") cite(card.sources.floodExcess);

  // S3 limit and settlement
  const cap = D(claim.sumInsured).times(D(100).plus(card.safetyNetPct)).div(100);
  const loss = D(claim.loss);
  let amount: Decimal;
  if (mistakes.ignoreLimit) amount = loss.minus(excess);
  else if (mistakes.excessBeforeLimit || !card.excessAfterLimits) amount = Decimal.min(loss.minus(excess), cap);
  else amount = Decimal.min(loss, cap).minus(excess);
  amount = Decimal.max(amount, 0);
  cite(card.sources.buildingLimit);

  // S4 referral and missing information
  let action: Settlement["action"] = "pay";
  if (card.requestInfoIfMissing && (claim.hasQuote === false || claim.hasProofOfOwnership === false)) { action = "request_info"; cite(card.sources.missingInfo); }
  else if (!mistakes.skipReferral && amount.gt(card.referralThreshold)) { action = "refer_senior_assessor"; cite(card.sources.referralThreshold); }

  return { covered: true, excess: money(excess), excessType, cap: money(cap), settlement: money(amount), action, citations };
}

/** Temporary accommodation cap: min(claimed, pct% of building sum insured); months beyond the limit are not paid. */
export function tempAccommodationCap(card: RuleCard, sumInsured: string, weeklyCost: string, weeks: number) {
  const pct = D(card.tempAccomPct ?? 0);
  const maxWeeks = Math.floor(((card.tempAccomMonths ?? 0) * 52) / 12);
  const claimed = D(weeklyCost).times(Math.min(weeks, maxWeeks));
  return money(Decimal.min(claimed, D(sumInsured).times(pct).div(100)));
}

/** Per-item jewellery/watch sub-limit unless the item is specified. */
export function jewelleryPayable(card: RuleCard, itemValue: string, specified = false) {
  if (specified || !card.jewelleryItemLimit) return money(D(itemValue));
  return money(Decimal.min(D(itemValue), D(card.jewelleryItemLimit)));
}
