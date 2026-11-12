import { useState } from "react";
import { FileUp, PenLine, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button, Callout, Card, CodeBlock, KeyValue, Mono, StatusPill, Term, useToast } from "../components/ui";
import { DecisionPill, SourceChip } from "../components/domain";
import { LoadDocumentsDrawer } from "./LoadDocumentsDrawer";
import { useQualify, type CardClause, type SignedCard } from "../context/QualifyContext";
import { useApp } from "../context/AppContext";
import { clauses as demoClauses, crossCheck } from "../data/policy";
import { trap1, trap2 } from "../data/traps";
import { settleClaim } from "../engine/settlement";
import type { RuleCard, RuleField, Source } from "../engine/types";
import { cn } from "../lib/cn";

const fmt$ = (s: string) => "$" + Number(s).toLocaleString("en-AU", { minimumFractionDigits: 2 });
const ACTION: Record<string, string> = { pay: "pay", refer_senior_assessor: "refer to senior assessor", request_info: "request information", decline: "decline" };

function cardRows(c: RuleCard): { label: string; value: string; field?: RuleField; source?: Source }[] {
  const flood = c.exclusions.find((e) => e.cause === "flood");
  return [
    { label: "Covered events", value: c.coveredEvents.filter((e) => e !== "flood" || !flood || flood.deletedBy).join(", ").replace(/_/g, " "), source: flood?.deletedBy },
    { label: "Exclusions", value: c.exclusions.filter((e) => !e.deletedBy).map((e) => e.cause.replace(/_/g, " ")).join(", ") || "none", source: c.exclusions.find((e) => !e.deletedBy)?.source },
    { label: "Basic excess", value: fmt$(c.basicExcess), field: "basicExcess", source: c.sources.basicExcess },
    { label: "Flood excess", value: c.floodExcess ? fmt$(c.floodExcess) : "n/a", field: "floodExcess", source: c.sources.floodExcess },
    { label: "Excess rule", value: "highest single per event", field: "excessRule", source: c.sources.excessRule },
    { label: "Building limit", value: c.safetyNetPct === "0" ? "sum insured" : `sum insured + ${c.safetyNetPct}% safety net`, field: "buildingLimit", source: c.sources.buildingLimit },
    { label: "Excess order", value: c.excessAfterLimits ? "after limits" : "before limits", field: "excessOrder", source: c.sources.excessOrder },
    { label: "Jewellery per item", value: c.jewelleryItemLimit ? fmt$(c.jewelleryItemLimit) : "—", field: "jewelleryItemLimit", source: c.sources.jewelleryItemLimit },
    { label: "Temporary accommodation", value: `${c.tempAccomPct}% of SI, ≤ ${c.tempAccomMonths} months`, field: "tempAccom", source: c.sources.tempAccom },
    { label: "Referral", value: `above ${fmt$(c.referralThreshold)} → senior assessor`, field: "referralThreshold", source: c.sources.referralThreshold },
    { label: "Missing quote or proof", value: "request before deciding", field: "missingInfo", source: c.sources.missingInfo },
  ];
}

export function RulesStep() {
  const { cards, selectedCard, selectCard, addCard, signCard } = useQualify();
  const { persona } = useApp();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const sc = selectedCard!;
  const clauses: CardClause[] = sc.origin === "demo" ? demoClauses : sc.clauses ?? [];

  const sign = async () => {
    setSigning(true);
    await signCard(sc.card.id, persona.title);
    setSigning(false);
    toast({ tone: "success", title: "Rule card signed", body: "SHA-256 recorded. Run is unlocked." });
  };

  return (
    <div className="space-y-6">
      <Card title="Signed rule card" actions={<Button icon={FileUp} size="sm" onClick={() => setLoading(true)} disabled={!persona.can.runQualification} disabledReason="Your role is read-only">Load documents</Button>}>
        <div role="radiogroup" aria-label="Rule card" className="space-y-2">
          {cards.map((c) => {
            const on = c.card.id === sc.card.id;
            return (
              <button key={c.card.id} role="radio" aria-checked={on} onClick={() => selectCard(c.card.id)}
                className={cn("flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left", on ? "border-ink ring-1 ring-ink" : "border-border hover:bg-bg-muted")}>
                <span className={cn("size-4 shrink-0 rounded-full border", on ? "border-[5px] border-ink" : "border-border-strong")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text">{c.origin === "demo" ? "Tallowood Home v3 + Endorsement 07" : `${c.card.title} · from loaded documents`}</div>
                  <div className="text-[12px] text-text-3">{c.extractor}</div>
                </div>
                <DecisionPill label={c.status} />
              </button>
            );
          })}
        </div>
      </Card>

      {sc.origin === "loaded" && <Callout tone="info" title="Built from your documents">Everything the engine computes now uses this card: the rule card view, sample cases, the settlement calculator and both planted traps. Agent results, votes and the overall score remain a scripted demo run.</Callout>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Structured fields" padded={false}>
          <table className="w-full text-[13px]">
            <tbody>
              {cardRows(sc.card).map((r) => {
                const entered = r.field && sc.enteredFields?.includes(r.field);
                return (
                  <tr key={r.label} className="border-b border-border last:border-b-0">
                    <td className="w-[30%] px-4 py-2.5 text-text-3">{r.label}</td>
                    <td className="px-2 py-2.5 text-text">{r.value}</td>
                    <td className="px-4 py-2.5 text-right">{entered ? <span className="text-[12px] text-warning">Entered by policy owner</span> : r.source && <SourceChip source={r.source} text={clauses.find((c) => c.id === r.source!.clause || c.id === r.source!.note?.replace("inserts ", ""))?.text} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card title="Source clauses" padded={false}>
          <ul>
            {clauses.map((c) => (
              <li key={c.id} className="flex gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-b-0">
                <Mono className="w-14 shrink-0 text-text-3">{c.id}</Mono>
                <div className="min-w-0">
                  <div className={cn(c.deletedBy ? "text-text-3 line-through" : "text-text-2")}>{c.text}</div>
                  {c.deletedBy && <div className="mt-0.5 text-[12px] text-danger">Deleted by {c.deletedBy}</div>}
                  {c.insertedBy && <div className="mt-0.5 text-[12px] text-info">Inserted by {c.insertedBy}</div>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {sc.origin === "demo" ? (
        <Card title="Cross-check by a second extractor">
          <p className="mb-3 text-[13px] text-text-3">{crossCheck.extractorA} drafted the card. {crossCheck.extractorB}, from a different provider, extracted it independently. {crossCheck.agreed} fields agreed; 1 differed.</p>
          {crossCheck.differences.map((d) => (
            <div key={d.field} className="rounded-lg border border-[#FEDF89] bg-warning-bg p-4 text-[13px]">
              <div className="mb-2 flex items-center gap-2 font-semibold text-warning"><TriangleAlert className="size-4" aria-hidden />Difference: {d.field}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[12px] text-text-3">Extractor A</div><div className="text-text">{d.a}</div></div>
                <div><div className="text-[12px] text-text-3">Extractor B</div><div className="text-text">{d.b}</div><div className="text-[12px] text-text-3">{d.cause}</div></div>
              </div>
              <div className="mt-3 border-t border-[#FEDF89] pt-2"><StatusPill tone="success">Resolved</StatusPill> <span className="ml-1 text-text-2">"{d.resolution}"</span> <span className="text-text-3">— {d.resolvedBy}</span></div>
            </div>
          ))}
        </Card>
      ) : (
        <Card title="Extraction"><p className="text-[13px]">Single extractor: <span className="font-medium text-text">{sc.extractor}</span>. It reads only the demo format and never invents a value; anything it couldn't find was entered by the policy owner before signing.</p></Card>
      )}

      <EnginePreview card={sc} />

      <Card title="Rule card"><CodeBlock code={sc.text} caption={sc.origin === "demo" ? "Signed rule card" : "Rule card built from loaded documents"} /></Card>

      <Card title="Policy owner's signature" highlight={sc.status === "Signed"}>
        {sc.status === "Signed" ? (
          <KeyValue items={[
            { k: "Status", v: <StatusPill tone="brand" icon={ShieldCheck}>Signed</StatusPill> },
            { k: "Signed by", v: sc.signer },
            { k: "Date", v: new Date(sc.signedAt!).toLocaleString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) },
            { k: <Term explain="A SHA-256 fingerprint of the card, its text, the signer and the time. Any change to the card gives a different hash.">SHA-256</Term>, v: sc.hash ?? "computing…", mono: true },
          ]} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-[13px]">This card must be signed by the claims policy owner before the run can start. Signing records a SHA-256 hash of the card, the signer and the time.</p>
            <Button variant="primary" icon={PenLine} loading={signing} onClick={sign} disabled={!persona.can.sign} disabledReason="Only the policy owner can sign">Sign rule card</Button>
          </div>
        )}
      </Card>

      <LoadDocumentsDrawer open={loading} onClose={() => setLoading(false)} onCreate={addCard} />
    </div>
  );
}

/** What the engine expects under this card for the two planted traps — computed, not typed. */
function EnginePreview({ card }: { card: SignedCard }) {
  const rows = [trap1, trap2].map((t) => ({ t, s: settleClaim(card.card, t.facts) }));
  return (
    <Card title="What the engine expects under this card">
      <p className="mb-3 text-[13px] text-text-3">The answer key is computed in code from the signed card and never reaches the agent.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map(({ t, s }) => (
          <div key={t.id} className="rounded-lg border border-border p-4">
            <div className="text-[12px] text-text-3">Trap {t.trapType} · {t.title}</div>
            <div className="mt-1 text-[13px] text-text-2">{t.description}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill tone={s.covered ? "success" : "danger"}>{s.covered ? "Covered" : `Declined: ${s.declineClause}`}</StatusPill>
              <span className="font-display text-[20px] font-semibold text-text tnum">{fmt$(s.settlement)}</span>
              <span className="text-[13px] text-text-3">{ACTION[s.action]}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
