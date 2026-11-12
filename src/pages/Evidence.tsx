import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleX, FileDown, FileJson, Link2, RotateCcw } from "lucide-react";
import { Badge, Button, Callout, Card, KeyValue, Mono, PageHeader, SkeletonRows, StatusPill, Switch, Tabs, Term } from "../components/ui";
import { useApp } from "../context/AppContext";
import { buildEvidencePack, downloadJson, replayScoreHash, type EvidencePack } from "../lib/evidencePack";
import { verifyLedger, verifySeed, type EntryCheck, type LedgerEntry } from "../engine/hash";
import { standardsMapping } from "../data/evidence";
import { runMeta } from "../data/results";
import { cn } from "../lib/cn";

const TAMPER_INDEX = 4;
const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

interface Replay { chainOk: boolean; firstBroken: number | null; seedOk: boolean; scoreHash: string; identical: boolean }

export function EvidencePage() {
  const nav = useNavigate();
  const { persona } = useApp();
  const [pack, setPack] = useState<EvidencePack | null>(null);
  const [tamper, setTamper] = useState(false);
  const [checks, setChecks] = useState<EntryCheck[] | null>(null);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [tab, setTab] = useState<"ledger" | "standards">("ledger");

  useEffect(() => { buildEvidencePack().then(setPack); }, []);

  const ledger: LedgerEntry[] = !pack ? [] : tamper
    ? pack.ledger.map((e) => (e.index === TAMPER_INDEX ? { ...e, payload: { ...(e.payload as object), votes: 2730 } } : e))
    : pack.ledger;

  useEffect(() => { if (pack) verifyLedger(ledger).then((r) => setChecks(r.checks)); setReplay(null); }, [pack, tamper]); // eslint-disable-line react-hooks/exhaustive-deps

  const runReplay = async () => {
    if (!pack) return;
    setReplaying(true); setReplay(null);
    const [chain, seedOk, scoreHash] = await Promise.all([verifyLedger(ledger), verifySeed(pack.seed, pack.commitment), replayScoreHash()]);
    await new Promise((r) => setTimeout(r, 900));
    const recorded = (ledger[ledger.length - 1].payload as { scoreHash: string }).scoreHash;
    setReplay({ chainOk: chain.ok, firstBroken: chain.firstBroken, seedOk, scoreHash, identical: chain.ok && scoreHash === recorded });
    setReplaying(false);
  };

  return (
    <>
      <PageHeader title="Evidence" description="Tamper-evident evidence packs. An auditor can replay any pack to the identical score."
        actions={<>
          <Button icon={FileJson} disabled={!pack} onClick={() => pack && downloadJson(`${pack.id}.json`, { pack: pack.id, agent: "ClaimDesk Agent", versions: [runMeta.current, runMeta.candidate], ruleCard: runMeta.ruleCard, seed: pack.seed, seedCommitment: pack.commitment, result: pack.result, scoreHash: pack.scoreHash, ledger: pack.ledger })}>Evidence pack (JSON)</Button>
          <Button icon={FileDown} onClick={() => nav("/report")}>Board report</Button>
        </>} />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div><div className="text-[12px] text-text-3">Evidence pack</div><Mono className="text-[14px] text-text">{runMeta.evidencePack}</Mono></div>
          <div><div className="text-[12px] text-text-3">Run</div><Mono>{runMeta.id}</Mono></div>
          <div><div className="text-[12px] text-text-3">Decision</div><StatusPill tone="warning">Approved with conditions · 93</StatusPill></div>
          <div><div className="text-[12px] text-text-3">Sealed</div><span className="text-[13px] text-text">12 Nov 2026 · copy sent to Tallowood audit</span></div>
          <div><div className="text-[12px] text-text-3">Region</div><span className="text-[13px] text-text">Australia</span></div>
        </div>
      </Card>

      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ key: "ledger", label: "Ledger and replay" }, { key: "standards", label: "Standards mapping" }]} />

      {tab === "ledger" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <Card title={<Term explain="Each entry stores the SHA-256 of its payload and of the entry before it, so changing any entry breaks every link after it.">Hash-chained ledger</Term>}
            actions={<Switch checked={tamper} onChange={setTamper} label="Tamper test" />}>
            {tamper && <div className="mb-4"><Callout tone="danger" title="Tamper test on">Entry {TAMPER_INDEX + 1} has been edited (reviewer votes 2,731 → 2,730). Verification fails from that entry onwards.</Callout></div>}
            {!pack || !checks ? <SkeletonRows rows={7} /> : (
              <ol className="relative">
                {ledger.map((e, i) => {
                  const c = checks[i];
                  return (
                    <li key={e.index} className="relative flex gap-4 pb-4 last:pb-0">
                      {i < ledger.length - 1 && <span aria-hidden className={cn("absolute left-[13px] top-7 h-[calc(100%-16px)] w-[2px]", c?.ok && checks[i + 1]?.ok ? "bg-brand" : c?.ok ? "bg-border-strong" : "bg-danger")} />}
                      <span className={cn("relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold tnum", c?.ok ? "border-brand-border bg-brand-tint text-brand-ink" : "border-[#FECDCA] bg-danger-bg text-danger")}>{i + 1}</span>
                      <div className={cn("min-w-0 flex-1 rounded-lg border p-3", c?.ok ? "border-border" : "border-[#FECDCA] bg-danger-bg/40")}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-text">{e.type}</span>
                          <span className="flex items-center gap-2 text-[12px] text-text-3">{fmt(e.at)}{c?.ok ? <StatusPill tone="success">Verified</StatusPill> : <StatusPill tone="danger">{!c?.payloadOk ? "Payload changed" : "Chain broken"}</StatusPill>}</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-[96px_1fr] gap-x-2 gap-y-0.5 text-[12px]">
                          <span className="text-text-3">Payload hash</span><Mono className="truncate">{e.payloadHash}</Mono>
                          <span className="text-text-3">Previous hash</span><Mono className="truncate text-text-3">{e.prevHash}</Mono>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <div className="space-y-6">
            <Card title="Replay">
              <p className="mb-3 text-[13px]">Recompute every hash in the chain, check the seed against its commitment, and recompute the score from the recorded inputs.</p>
              <Button variant="primary" icon={RotateCcw} loading={replaying} disabled={!pack || !persona.can.replay} onClick={runReplay}>Replay evidence pack</Button>
              {replay && (
                <ul className="anim-fade mt-4 space-y-2 text-[13px]">
                  <Check ok={replay.chainOk} text={replay.chainOk ? "Chain verified: 7 of 7 entries" : `Chain broken from entry ${replay.firstBroken! + 1}`} />
                  <Check ok={replay.seedOk} text="Seed matches its commitment" />
                  <Check ok={replay.identical} text={replay.identical ? "Identical score hash" : "Score hash cannot be trusted: chain broken"} />
                  <li className="rounded-md border border-border bg-bg-subtle p-2"><div className="text-[12px] text-text-3">Recomputed score hash</div><Mono className="break-all text-[11px]">{replay.scoreHash}</Mono></li>
                </ul>
              )}
            </Card>
            <Card title="Seed">
              {!pack ? <SkeletonRows rows={3} /> : (
                <KeyValue items={[
                  { k: "Committed before generation", v: <Mono className="break-all text-[11px]">{pack.commitment}</Mono> },
                  { k: "Revealed seed", v: pack.seed, mono: true },
                  { k: "Check", v: <StatusPill tone="success">Verified against commitment</StatusPill> },
                ]} />
              )}
            </Card>
            <Card title="Score">
              {!pack ? <SkeletonRows rows={2} /> : (
                <KeyValue items={[
                  { k: "Raw score", v: `${pack.result.rawScore} (CI ${pack.result.ciDetail[0]}–${pack.result.ciDetail[1]})` },
                  { k: "Decision", v: "Approved with conditions" },
                  { k: "Score hash", v: <Mono className="break-all text-[11px]">{pack.scoreHash}</Mono> },
                ]} />
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "standards" && (
        <div className="space-y-6">
          <Callout tone="info">Evidence is mapped to standards to support your model validation. Control references are placeholders to be confirmed against each standard.</Callout>
          {standardsMapping.map((s) => (
            <Card key={s.standard} title={s.standard} padded={false}>
              <table className="w-full text-[13px]">
                <thead className="bg-bg-subtle text-left text-text-3"><tr><th className="h-10 px-4 font-medium">Control</th><th className="px-4 font-medium">Topic</th><th className="px-4 font-medium">Supporting evidence</th></tr></thead>
                <tbody>
                  {s.items.map((it) => (
                    <tr key={it.topic} className="border-t border-border">
                      <td className="h-11 px-4"><Mono>{it.control}</Mono></td>
                      <td className="px-4 text-text">{it.topic}</td>
                      <td className="px-4 py-2"><div className="flex flex-wrap gap-1.5">{it.evidence.map((ev) => <Badge key={ev}><Link2 className="size-3" aria-hidden />{ev}</Badge>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return <li className={cn("flex items-center gap-2", ok ? "text-success" : "text-danger")}>{ok ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}<span className="font-medium">{text}</span></li>;
}
