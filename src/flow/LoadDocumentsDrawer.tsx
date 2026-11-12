import { DragEvent, useRef, useState } from "react";
import { FileText, FileUp, Lock, X } from "lucide-react";
import { Badge, Button, Callout, Drawer, Mono, Skeleton, StatusPill } from "../components/ui";
import { SourceChip } from "../components/domain";
import { readPdfText } from "../lib/pdfText";
import { FIELD_LABELS, normalise, parsePolicyText, ruleCardFromParse, type ParseResult, type ParsedFields } from "../engine/parser";
import { renderRuleCard } from "../engine/ruleCardText";
import type { RuleField } from "../engine/types";
import type { SignedCard, CardClause } from "../context/QualifyContext";
import { cn } from "../lib/cn";

export const TEMPLATE_EXTRACTOR = "Template parser · Verilo demo policy format v1";

const SAMPLES = [
  { label: "Home v3 + Endorsement 07", files: ["TMI-HOME-v3.pdf", "TMI-END-07.pdf"] },
  { label: "Home v3 alone", files: ["TMI-HOME-v3.pdf"] },
  { label: "Premier v1", files: ["TMI-PREMIER-v1.pdf"] },
  { label: "Unrelated PDF", files: ["unrelated-facilities-report.pdf"] },
];

/** Inputs the policy owner fills for fields the parser could not find. */
const MISSING_INPUTS: Record<RuleField, { key: keyof ParsedFields; label: string; kind: "number" | "bool"; trueValue?: unknown }[]> = {
  basicExcess: [{ key: "basicExcess", label: "Basic excess ($)", kind: "number" }],
  floodExcess: [{ key: "floodExcess", label: "Flood excess ($)", kind: "number" }],
  excessRule: [{ key: "excessRule", label: "Only the highest single excess per event", kind: "bool", trueValue: "highest_single_per_event" }],
  floodExclusion: [{ key: "floodExcluded", label: "Flood excluded", kind: "bool", trueValue: true }],
  buildingLimit: [{ key: "safetyNetPct", label: "Safety net above sum insured (%)", kind: "number" }],
  excessOrder: [{ key: "excessAfterLimits", label: "Excess deducted after limits", kind: "bool", trueValue: true }],
  jewelleryItemLimit: [{ key: "jewelleryItemLimit", label: "Jewellery item limit ($)", kind: "number" }],
  tempAccom: [{ key: "tempAccomPct", label: "Temporary accommodation (% of SI)", kind: "number" }, { key: "tempAccomMonths", label: "Temporary accommodation (months)", kind: "number" }],
  referralThreshold: [{ key: "referralThreshold", label: "Refer to senior assessor above ($)", kind: "number" }],
  missingInfo: [{ key: "requestInfoIfMissing", label: "Request missing quote or proof before deciding", kind: "bool", trueValue: true }],
};

/** Pull the clause text for the source panel straight from the document text (never invented). */
function clauseText(text: string, id: string) {
  const t = normalise(text);
  if (id === "4.2(c)") return t.match(/\(c\) loss or damage caused by flood\.?/)?.[0];
  return t.match(new RegExp(`(?:^| )${id.replace(".", "\\.")} (.+?)(?= \\d+\\.\\d+ | Section \\d| \\d+ [A-Z][a-z]+ [a-z]|$)`))?.[1];
}

export function LoadDocumentsDrawer({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (c: SignedCard) => void }) {
  const [files, setFiles] = useState<{ name: string; pages: string[] }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [entered, setEntered] = useState<Record<string, string>>({});
  const input = useRef<HTMLInputElement>(null);

  const parse: ParseResult | null = files.length ? parsePolicyText(files) : null;

  const addFiles = async (list: File[]) => {
    setBusy(true);
    const errs: string[] = [];
    const read: { name: string; pages: string[] }[] = [];
    for (const f of list) {
      try { read.push(await readPdfText(f)); } catch { errs.push(`${f.name} couldn't be read as a PDF.`); }
    }
    setFiles((cur) => [...cur.filter((c) => !read.some((r) => r.name === c.name)), ...read]);
    setErrors(errs);
    setBusy(false);
  };
  const loadSample = async (names: string[]) => {
    reset();
    const list = await Promise.all(names.map(async (n) => new File([await (await fetch(`${import.meta.env.BASE_URL}samples/${n}`)).blob()], n, { type: "application/pdf" })));
    await addFiles(list);
  };
  const reset = () => { setFiles([]); setErrors([]); setEntered({}); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); addFiles(Array.from(e.dataTransfer.files)); };

  const needed = parse?.missing.flatMap((m) => MISSING_INPUTS[m.field]) ?? [];
  const valid = (k: string, kind: string) => kind === "bool" ? entered[k] === "yes" || entered[k] === "no" : /^\d+(\.\d+)?$/.test(entered[k] ?? "");
  const complete = !!parse?.inDemoFormat && needed.every((n) => valid(n.key, n.kind));

  const [createError, setCreateError] = useState<string>();
  const create = () => {
    try { doCreate(); } catch (e) { setCreateError((e as Error).message + ". This prototype's engine needs that rule to build a card."); }
  };
  const doCreate = () => {
    if (!parse) return;
    const overrides: Partial<ParsedFields> = {};
    for (const n of needed) {
      const v = entered[n.key];
      (overrides as Record<string, unknown>)[n.key] = n.kind === "bool" ? (v === "yes" ? n.trueValue : n.key === "excessRule" ? undefined : false) : n.key === "tempAccomMonths" ? Number(v) : v;
    }
    const card = ruleCardFromParse(parse, overrides);
    card.id = `${card.id}#loaded-${Date.now().toString(36)}`;
    const wording = files.find((f) => parsePolicyText([f]).documents[0].kind === "wording");
    const wText = wording ? wording.pages.join(" ") : "";
    const clauses: CardClause[] = ["3.1", "3.2", "3.3", "4.2(c)", "5.1", "5.2", "5.3", "5.4", "6.1", "6.2"].flatMap((id) => {
      const ins = parse.changes.find((c) => c.kind === "inserted" && c.clause === id);
      const del = parse.changes.find((c) => c.kind === "deleted" && c.clause === id);
      const text = ins?.text ?? clauseText(wText, id);
      if (!text) return [];
      return [{ id, text, source: ins ? ins.by.doc : card.precedence[card.precedence.length - 1], insertedBy: ins && `${ins.by.doc} §${ins.by.clause}`, deletedBy: del && `${del.by.doc} §${del.by.clause} from ${del.by.effective}` }];
    });
    onCreate({ card, text: renderRuleCard(card), origin: "loaded", status: "Awaiting signature", extractor: TEMPLATE_EXTRACTOR, clauses, enteredFields: parse.missing.map((m) => m.field) });
    reset();
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} width={680} title="Load policy documents" subtitle={<span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" />Read in your browser with pdf.js. Files never leave this machine.</span>}
      footer={<>
        <Button onClick={() => { reset(); onClose(); }}>Cancel</Button>
        <Button variant="primary" disabled={!complete} disabledReason={parse && !parse.inDemoFormat ? "These documents aren't in the demo format" : "Enter the flagged fields first"} onClick={create}>Create rule card</Button>
      </>}>
      <div className="space-y-5">
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
          className={cn("rounded-lg border border-dashed px-6 py-8 text-center", drag ? "border-ink bg-bg-muted" : "border-border-strong bg-bg-subtle")}>
          <FileUp className="mx-auto mb-2 size-6 text-text-3" aria-hidden />
          <div className="text-[14px] font-medium text-text">Drop one policy wording PDF and any endorsements</div>
          <div className="mt-1 text-[13px] text-text-3">or</div>
          <Button size="sm" className="mt-2" onClick={() => input.current?.click()}>Choose files</Button>
          <input ref={input} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-text-3">Sample documents:</span>
          {SAMPLES.map((s) => <Button key={s.label} size="sm" variant="ghost" className="border-border" onClick={() => loadSample(s.files)}>{s.label}</Button>)}
        </div>

        {createError && <Callout tone="danger">{createError}</Callout>}
        {errors.map((e) => <Callout key={e} tone="danger">{e}</Callout>)}
        {busy && <div className="space-y-2"><Skeleton /><Skeleton className="w-2/3" /></div>}

        {parse && !busy && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-[13px] text-text-3">Extractor: <span className="font-medium text-text-2">{TEMPLATE_EXTRACTOR}</span></div>
              <Button size="sm" variant="ghost" icon={X} onClick={reset}>Clear</Button>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {parse.documents.map((d) => (
                <li key={d.name} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                  <FileText className="size-4 text-text-3" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-text">{d.name}</div>
                    <div className="text-[12px] text-text-3">{d.kind === "unknown" ? "Not recognised" : `${d.kind === "wording" ? "Policy wording" : `Endorsement No. ${d.endorsementNo}`} · ${d.ref}${d.amends ? ` · amends ${d.amends}` : ""} · effective ${d.effectiveText ?? "?"}`}</div>
                  </div>
                  <StatusPill tone={d.kind === "unknown" ? "danger" : "success"}>{d.kind === "unknown" ? "Unrecognised" : "Read"}</StatusPill>
                </li>
              ))}
            </ul>
            {parse.warnings.filter((w) => !/Not in the demo format/.test(w)).map((w) => <Callout key={w} tone="warning">{w}</Callout>)}

            {!parse.inDemoFormat ? (
              <Callout tone="danger" title="Not in the demo format">
                This prototype reads only the Verilo demo policy format v1. Nothing has been filled in.
                <div className="mt-2 grid grid-cols-2 gap-4 text-[12px]">
                  <div><div className="font-semibold text-text">Found</div>{parse.found.length ? parse.found.map((f) => <div key={f}>✓ {f}</div>) : <div>Nothing recognisable</div>}</div>
                  <div><div className="font-semibold text-text">Not found</div>{["Policy wording title", ...parse.missing.map((m) => m.label)].map((f) => <div key={f}>✗ {f}</div>)}</div>
                </div>
              </Callout>
            ) : (
              <>
                {parse.changes.length > 0 && (
                  <div className="rounded-lg border border-border">
                    <div className="border-b border-border bg-bg-subtle px-4 py-2 text-[12px] font-medium text-text-3">Changes by endorsement (endorsement takes precedence from its effective date)</div>
                    {parse.changes.map((c) => (
                      <div key={c.kind + c.clause} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
                        <span className={cn(c.kind === "deleted" && "line-through text-text-3")}>Clause {c.clause}{c.text ? `: ${c.text}` : ""}</span>
                        <Badge tone={c.kind === "deleted" ? "danger" : "info"}>{c.kind === "deleted" ? "Deleted" : "Inserted"} by {c.by.doc} §{c.by.clause}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <table className="w-full text-[13px]">
                  <thead className="bg-bg-subtle text-left text-text-3"><tr><th className="px-3 py-2 font-medium">Field</th><th className="px-3 py-2 font-medium">Value</th><th className="px-3 py-2 font-medium">Source</th></tr></thead>
                  <tbody>
                    {(Object.keys(FIELD_LABELS) as RuleField[]).map((f) => {
                      const miss = parse.missing.find((m) => m.field === f);
                      return (
                        <tr key={f} className={cn("border-b border-border", miss && "bg-warning-bg")}>
                          <td className="px-3 py-2 text-text-2">{FIELD_LABELS[f]}</td>
                          <td className="px-3 py-2">
                            {miss ? (
                              <div className="space-y-1.5">
                                <StatusPill tone="warning">Not found — policy owner to enter</StatusPill>
                                {MISSING_INPUTS[f].map((n) => n.kind === "number" ? (
                                  <label key={n.key} className="block text-[12px] text-text-3">{n.label}
                                    <input inputMode="decimal" value={entered[n.key] ?? ""} onChange={(e) => setEntered({ ...entered, [n.key]: e.target.value.trim() })}
                                      className="mt-0.5 block h-8 w-40 rounded-md border border-border-strong bg-bg px-2 font-mono text-[12px] text-text" />
                                  </label>
                                ) : (
                                  <label key={n.key} className="block text-[12px] text-text-3">{n.label}
                                    <select value={entered[n.key] ?? ""} onChange={(e) => setEntered({ ...entered, [n.key]: e.target.value })} className="mt-0.5 block h-8 rounded-md border border-border-strong bg-bg px-2 text-[12px] text-text">
                                      <option value="">Choose…</option><option value="yes">Yes</option><option value="no">No</option>
                                    </select>
                                  </label>
                                ))}
                              </div>
                            ) : <Mono className="text-text">{fieldValue(parse.fields, f)}</Mono>}
                          </td>
                          <td className="px-3 py-2">{!miss && (parse.sources[f] ? <SourceChip source={parse.sources[f]} /> : <span className="text-[12px] text-text-3">No clause: not excluded</span>)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}

const aud = (v?: string) => "$" + Number(v).toLocaleString("en-AU");

export function fieldValue(f: ParsedFields, k: RuleField): string {
  switch (k) {
    case "basicExcess": return aud(f.basicExcess);
    case "floodExcess": return f.floodExcess ? aud(f.floodExcess) : "n/a (flood excluded)";
    case "excessRule": return "highest single per event";
    case "floodExclusion": return f.floodExcluded ? "flood excluded" : "flood covered";
    case "buildingLimit": return f.safetyNetPct === "0" ? "sum insured" : `sum insured + ${f.safetyNetPct}%`;
    case "excessOrder": return f.excessAfterLimits ? "after limits" : "before limits";
    case "jewelleryItemLimit": return aud(f.jewelleryItemLimit);
    case "tempAccom": return `${f.tempAccomPct}% of SI, ${f.tempAccomMonths} months`;
    case "referralThreshold": return `> ${aud(f.referralThreshold)}`;
    case "missingInfo": return "request before deciding";
  }
}
