import Decimal from "decimal.js";
import { INSURED_EVENTS, type Exclusion, type RuleCard, type RuleField, type Source } from "./types";

/**
 * Template parser for "Verilo demo policy format v1". Reads only the phrases in BRIEF §6; ignores all other text.
 * Never invents a value: anything not found is listed in `missing`.
 */

export interface DocInfo {
  name: string;
  kind: "wording" | "endorsement" | "unknown";
  ref?: string;
  amends?: string;
  insurer?: string;
  product?: string;
  effective?: string; // ISO
  effectiveText?: string;
  endorsementNo?: string;
}

export interface ClauseChange { kind: "deleted" | "inserted"; clause: string; by: Source; text?: string }

export interface ParsedFields {
  basicExcess?: string;
  floodExcess?: string;
  excessRule?: "highest_single_per_event";
  floodExcluded?: boolean;
  wearAndTearExcluded?: boolean;
  gradualDamageExcluded?: boolean;
  safetyNetPct?: string;
  excessAfterLimits?: boolean;
  jewelleryItemLimit?: string;
  tempAccomPct?: string;
  tempAccomMonths?: number;
  referralThreshold?: string;
  requestInfoIfMissing?: boolean;
}

export interface ParseResult {
  inDemoFormat: boolean;
  documents: DocInfo[];
  fields: ParsedFields;
  sources: Partial<Record<RuleField, Source>>;
  changes: ClauseChange[];
  /** Human-readable names of rule fields not found. */
  missing: { field: RuleField; label: string }[];
  /** Fields found, for the "Not in the demo format" message. */
  found: string[];
  warnings: string[];
}

export const FIELD_LABELS: Record<RuleField, string> = {
  basicExcess: "Basic excess (3.1)",
  floodExcess: "Flood excess (3.2)",
  excessRule: "Excess rule (3.3)",
  floodExclusion: "Flood exclusion (4.2(c))",
  buildingLimit: "Building limit (5.1)",
  excessOrder: "Excess order (5.2)",
  jewelleryItemLimit: "Jewellery item sub-limit (5.3)",
  tempAccom: "Temporary accommodation (5.4)",
  referralThreshold: "Referral threshold (6.1)",
  missingInfo: "Missing information rule (6.2)",
};

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export function parseDate(text: string): string | undefined {
  const m = text.trim().match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  if (!m) return;
  const mi = MONTHS.indexOf(m[2].toLowerCase());
  if (mi < 0) return;
  return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export const normalise = (s: string) => s.replace(/\s+/g, " ").trim();
const num = (s: string) => new Decimal(s.replace(/,/g, "")).toString();
const LABELS = "(?=\\s(?:Wording reference|Endorsement reference|Amends|Insurer|Product|Effective date):|\\s\\d+(?:\\.\\d+)?\\s|$)";

function readDocInfo(name: string, text: string): DocInfo {
  const info: DocInfo = { name, kind: "unknown" };
  const end = text.match(/ENDORSEMENT No\. (\d+)/);
  if (end) { info.kind = "endorsement"; info.endorsementNo = end[1]; }
  else if (/HOME INSURANCE POLICY WORDING/.test(text)) info.kind = "wording";
  info.ref = text.match(/(?:Wording|Endorsement) reference: (\S+)/)?.[1];
  info.amends = text.match(/Amends: (\S+)/)?.[1];
  info.insurer = text.match(new RegExp(`Insurer: (.+?)${LABELS}`))?.[1];
  info.product = text.match(new RegExp(`Product: (.+?)${LABELS}`))?.[1];
  const eff = text.match(/Effective date: (\d{1,2} [A-Za-z]+ \d{4})/)?.[1];
  if (eff) { info.effectiveText = eff; info.effective = parseDate(eff); }
  return info;
}

type Hit = { field: RuleField; apply: (f: ParsedFields) => void };

/** Match the clause phrases in a run of text. `clause` is the clause number the text sits in. */
function matchClauses(text: string): Hit[] {
  const hits: Hit[] = [];
  let m: RegExpMatchArray | null;
  if ((m = text.match(/The basic excess is \$([\d,]+(?:\.\d{2})?) for each claim/))) { const v = num(m[1]); hits.push({ field: "basicExcess", apply: (f) => (f.basicExcess = v) }); }
  if ((m = text.match(/The flood excess is \$([\d,]+(?:\.\d{2})?) for each claim caused by flood/))) { const v = num(m[1]); hits.push({ field: "floodExcess", apply: (f) => (f.floodExcess = v) }); }
  if (/Only the highest applicable excess is deducted for each event/.test(text)) hits.push({ field: "excessRule", apply: (f) => (f.excessRule = "highest_single_per_event") });
  if (/\(c\) loss or damage caused by flood/.test(text)) hits.push({ field: "floodExclusion", apply: (f) => (f.floodExcluded = true) });
  if ((m = text.match(/The most we will pay for building damage is the building sum insured shown in your schedule(?:, plus a safety net of (\d+(?:\.\d+)?)%)?/))) {
    const v = m[1] ?? "0"; hits.push({ field: "buildingLimit", apply: (f) => (f.safetyNetPct = v) });
  }
  if (/We deduct the excess after applying the limits in clause 5\.1/.test(text)) hits.push({ field: "excessOrder", apply: (f) => (f.excessAfterLimits = true) });
  if ((m = text.match(/\$([\d,]+) for any one item of jewellery or watches/))) { const v = num(m[1]); hits.push({ field: "jewelleryItemLimit", apply: (f) => (f.jewelleryItemLimit = v) }); }
  if ((m = text.match(/up to (\d+(?:\.\d+)?)% of the building sum insured, for no more than (\d+) months/))) {
    const p = m[1], mo = Number(m[2]); hits.push({ field: "tempAccom", apply: (f) => { f.tempAccomPct = p; f.tempAccomMonths = mo; } });
  }
  if ((m = text.match(/referred to a senior assessor before payment if the settlement amount is more than \$([\d,]+)/))) { const v = num(m[1]); hits.push({ field: "referralThreshold", apply: (f) => (f.referralThreshold = v) }); }
  if (/we will ask you for it before we decide your claim/.test(text)) hits.push({ field: "missingInfo", apply: (f) => (f.requestInfoIfMissing = true) });
  return hits;
}

/** Template clause number for each field (wording numbering). */
const FIELD_CLAUSE: Record<RuleField, string> = {
  basicExcess: "3.1", floodExcess: "3.2", excessRule: "3.3", floodExclusion: "4.2(c)", buildingLimit: "5.1",
  excessOrder: "5.2", jewelleryItemLimit: "5.3", tempAccom: "5.4", referralThreshold: "6.1", missingInfo: "6.2",
};
const CLAUSE_FIELD = Object.fromEntries(Object.entries(FIELD_CLAUSE).map(([k, v]) => [v, k])) as Record<string, RuleField>;

export function parsePolicyText(docs: { name: string; pages: string[] }[]): ParseResult {
  const texts = docs.map((d) => ({ name: d.name, text: normalise(d.pages.join(" ")) }));
  const documents = texts.map((t) => readDocInfo(t.name, t.text));
  const fields: ParsedFields = {};
  const sources: ParseResult["sources"] = {};
  const changes: ClauseChange[] = [];
  const warnings: string[] = [];

  // 1. Wordings first (base layer).
  const wordings = documents.map((d, i) => ({ d, text: texts[i].text })).filter((x) => x.d.kind === "wording");
  if (wordings.length > 1) warnings.push(`More than one policy wording loaded; using ${wordings[0].d.ref ?? wordings[0].d.name}.`);
  const base = wordings[0];
  if (base) {
    for (const h of matchClauses(base.text)) {
      h.apply(fields);
      sources[h.field] = { doc: base.d.ref ?? base.d.name, clause: FIELD_CLAUSE[h.field], effective: base.d.effective };
    }
    if (/\(a\) loss or damage caused by wear and tear/.test(base.text)) fields.wearAndTearExcluded = true;
    if (/\(b\) gradual damage/.test(base.text)) fields.gradualDamageExcluded = true;
  }

  // 2. Endorsements, oldest effective date first, override the wording they amend.
  const ends = documents.map((d, i) => ({ d, text: texts[i].text })).filter((x) => x.d.kind === "endorsement")
    .sort((a, b) => (a.d.effective ?? "").localeCompare(b.d.effective ?? ""));
  for (const e of ends) {
    if (!base || e.d.amends !== base.d.ref) { warnings.push(`${e.d.ref ?? e.d.name} amends ${e.d.amends ?? "an unknown wording"}, which is not loaded; ignored.`); continue; }
    const ref = e.d.ref ?? e.d.name;
    for (const m of e.text.matchAll(/(\d+\.\d+) Clause (\S+) of the Wording is deleted in its entirety/g)) {
      const by: Source = { doc: ref, clause: m[1], effective: e.d.effective, note: `deletes ${m[2]}` };
      changes.push({ kind: "deleted", clause: m[2], by });
      const field = CLAUSE_FIELD[m[2]];
      if (field === "floodExclusion") { fields.floodExcluded = false; }
    }
    for (const m of e.text.matchAll(/(\d+\.\d+) The following clause (\S+) is inserted into the Wording: (.+?)(?=\s\d+(?:\.\d+)? [A-Z]|$)/g)) {
      const by: Source = { doc: ref, clause: m[1], effective: e.d.effective, note: `inserts ${m[2]}` };
      changes.push({ kind: "inserted", clause: m[2], by, text: m[3] });
      for (const h of matchClauses(m[3])) { h.apply(fields); sources[h.field] = by; }
    }
  }

  const has: Record<RuleField, boolean> = {
    basicExcess: fields.basicExcess !== undefined, floodExcess: fields.floodExcess !== undefined, excessRule: !!fields.excessRule,
    floodExclusion: fields.floodExcluded !== undefined, buildingLimit: fields.safetyNetPct !== undefined, excessOrder: fields.excessAfterLimits !== undefined,
    jewelleryItemLimit: fields.jewelleryItemLimit !== undefined, tempAccom: fields.tempAccomPct !== undefined,
    referralThreshold: fields.referralThreshold !== undefined, missingInfo: fields.requestInfoIfMissing !== undefined,
  };
  // An absent flood exclusion clause just means flood is not excluded; flood excess is only needed if flood is covered.
  if (!has.floodExclusion && base) { fields.floodExcluded = false; has.floodExclusion = true; }
  if (!has.floodExcess && fields.floodExcluded) has.floodExcess = true;

  const missing = (Object.keys(has) as RuleField[]).filter((k) => !has[k] || !base).map((field) => ({ field, label: FIELD_LABELS[field] }));
  const found = [
    ...documents.filter((d) => d.kind !== "unknown").map((d) => `${d.kind === "wording" ? "Policy wording" : "Endorsement"} ${d.ref ?? ""}`.trim()),
    ...(Object.keys(sources) as RuleField[]).map((f) => FIELD_LABELS[f]),
  ];
  const inDemoFormat = documents.some((d) => d.kind !== "unknown") && !!base;
  if (!base) warnings.push(documents.some((d) => d.kind === "endorsement") ? "No policy wording loaded. Add the wording the endorsement amends." : "Not in the demo format: no policy wording or endorsement title found.");

  return { inDemoFormat, documents, fields, sources, changes, missing, found, warnings };
}

/** Build a signed-ready rule card from a complete parse. Throws if required fields are missing. */
export function ruleCardFromParse(p: ParseResult, overrides: Partial<ParsedFields> = {}): RuleCard {
  const f = { ...p.fields, ...overrides };
  const need = <T,>(v: T | undefined, label: string): T => { if (v === undefined) throw new Error(`Missing ${label}`); return v; };
  const base = p.documents.find((d) => d.kind === "wording");
  const ends = p.documents.filter((d) => d.kind === "endorsement" && d.amends === base?.ref);
  const baseRef = base?.ref ?? "WORDING";
  const src = (clause: string): Source => ({ doc: baseRef, clause, effective: base?.effective });
  const deletion = (clause: string) => p.changes.find((c) => c.kind === "deleted" && c.clause === clause)?.by;

  const exclusions: Exclusion[] = [];
  if (f.wearAndTearExcluded) exclusions.push({ cause: "wear_and_tear", clause: "4.2(a)", source: src("4.2(a)") });
  if (f.gradualDamageExcluded) exclusions.push({ cause: "gradual_damage", clause: "4.2(b)", source: src("4.2(b)") });
  const floodDel = deletion("4.2(c)");
  if (p.sources.floodExclusion?.doc === baseRef || floodDel) exclusions.push({ cause: "flood", clause: "4.2(c)", source: src("4.2(c)"), deletedBy: floodDel });

  return {
    id: [baseRef, ...ends.map((e) => e.ref)].join("+"),
    title: [base?.product ?? baseRef, ...ends.map((e) => `Endorsement ${e.endorsementNo}`)].join(" + "),
    precedence: [...ends.map((e) => e.ref!).reverse(), baseRef],
    coveredEvents: INSURED_EVENTS,
    exclusions,
    basicExcess: need(f.basicExcess, "basic excess"),
    floodExcess: f.floodExcess,
    floodExcessFrom: p.sources.floodExcess?.doc !== baseRef ? p.sources.floodExcess?.effective : undefined,
    excessRule: need(f.excessRule, "excess rule"),
    safetyNetPct: need(f.safetyNetPct, "building limit"),
    excessAfterLimits: need(f.excessAfterLimits, "excess order"),
    jewelleryItemLimit: f.jewelleryItemLimit,
    tempAccomPct: f.tempAccomPct,
    tempAccomMonths: f.tempAccomMonths,
    referralThreshold: need(f.referralThreshold, "referral threshold"),
    requestInfoIfMissing: need(f.requestInfoIfMissing, "missing information rule"),
    sources: p.sources,
  };
}
