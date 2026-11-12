import { buildLedger, commitSeed, hashObject, type LedgerEntry } from "../engine/hash";
import { scoreRun, type RunResult } from "../engine/scorer";
import { claimDeskRun, runMeta } from "../data/results";
import { evidenceLedgerItems } from "../data/evidence";

export interface EvidencePack { id: string; seed: string; commitment: string; result: RunResult; scoreHash: string; ledger: LedgerEntry[] }

/** Build evidence pack ep_2026-11-12_7a3d: every hash is computed here from the recorded inputs. */
export async function buildEvidencePack(): Promise<EvidencePack> {
  const commitment = await commitSeed(runMeta.seed);
  const result = scoreRun(claimDeskRun);
  const scoreHash = await hashObject({ inputs: claimDeskRun, result });
  const ledger = await buildLedger(evidenceLedgerItems(commitment, scoreHash));
  return { id: runMeta.evidencePack, seed: runMeta.seed, commitment, result, scoreHash, ledger };
}

/** Replay: recompute the score from the recorded inputs, exactly as an auditor would. */
export async function replayScoreHash(inputs = claimDeskRun) {
  const copy = structuredClone(inputs);
  return hashObject({ inputs: copy, result: scoreRun(copy) });
}

export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
