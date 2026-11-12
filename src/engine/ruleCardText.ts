import type { RuleCard } from "./types";

const short = (ref: string) => ref.replace(/^TMI-(END-)/, "$1");
const tag = (ref: string) => short(ref).replace(/-/g, "");
const pad = (s: string, n = 64) => (s.length >= n ? s + " " : s + " ".repeat(n - s.length));

/** Render a rule card in the signed-card text format (used for cards built from loaded documents). */
export function renderRuleCard(card: RuleCard): string {
  const [base, ...rest] = [...card.precedence].reverse();
  const ends = rest.reverse();
  const cite = (src?: { doc: string; clause: string }) => (!src ? "entered" : src.doc === base ? src.clause : `${tag(src.doc)}-${src.clause}`);
  const flood = card.exclusions.find((e) => e.cause === "flood");
  const covered = card.coveredEvents.filter((c) => c !== "flood" || !flood || flood.deletedBy);
  const coverNote = flood?.deletedBy ? `[${tag(flood.deletedBy.doc)}-${flood.deletedBy.clause} deletes ${flood.clause}]` : flood ? `[flood excluded ${flood.clause}]` : "";
  const excl = card.exclusions.filter((e) => !e.deletedBy).map((e) => `${e.cause} [${e.clause.replace(/[()]/g, "")}]`).join("  ");
  const limit = card.safetyNetPct === "0" ? "min(loss, sum_insured)" : `min(loss, sum_insured x ${100 + Number(card.safetyNetPct)}%)`;
  const excessCites = [cite(card.sources.basicExcess), card.floodExcess ? cite(card.sources.floodExcess) : null, cite(card.sources.excessRule)].filter(Boolean).join(", ");
  return [
    `RULE CARD  ${[base, ...ends.map(short)].join(" + ")}   precedence: ${[...ends.map(short), base].join(" > ")} > CLAIMS-MANUAL`,
    pad(`COVER   building: ${covered.join(", ")}`) + coverNote,
    `EXCL    ${excl || "none"}`,
    pad(`EXCESS  basic=${card.basicExcess}${card.floodExcess ? ` flood=${card.floodExcess}` : ""} rule=${card.excessRule}`) + `[${excessCites}]`,
    pad(`LIMIT   building=${limit} ${card.excessAfterLimits ? "excess_after_limits" : "excess_before_limits"}`) + `[${cite(card.sources.buildingLimit)}, ${cite(card.sources.excessOrder)}]`,
    pad(`        jewellery_item=${card.jewelleryItemLimit ?? "?"}  temp_accom=min(${card.tempAccomPct ?? "?"}% SI, ${card.tempAccomMonths ?? "?"} months)`) + `[${cite(card.sources.jewelleryItemLimit)}, ${cite(card.sources.tempAccom)}]`,
    pad(`REFER   settlement>${card.referralThreshold} -> senior_assessor`) + `[${cite(card.sources.referralThreshold)}]`,
    pad(`        missing_quote_or_proof -> request_info`) + `[${cite(card.sources.missingInfo)}]`,
    `STEPS   S1:reason:cover  S2:reason:excess  S3:calc:settlement  S4:reason:referral`,
  ].join("\n");
}
