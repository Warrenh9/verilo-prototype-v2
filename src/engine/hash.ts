/** SHA-256 via the Web Crypto API (browser and Node ≥ 20). */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Deterministic JSON: object keys sorted at every level, so the same content always hashes the same. */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
}

export const hashObject = (v: unknown) => sha256Hex(canonicalJson(v));

/** Seed commitment: publish H(seed) before generation, reveal the seed afterwards. */
export const commitSeed = (seed: string) => sha256Hex(`verilo-seed:${seed}`);
export const verifySeed = async (seed: string, commitment: string) => (await commitSeed(seed)) === commitment;

/* ---------- hash-chained ledger ---------- */

export interface LedgerInput { type: string; at: string; payload: unknown }
export interface LedgerEntry extends LedgerInput { index: number; payloadHash: string; prevHash: string; hash: string }
export const GENESIS = "0".repeat(64);

const entryHash = (index: number, type: string, at: string, payloadHash: string, prevHash: string) =>
  sha256Hex(`${index}|${type}|${at}|${payloadHash}|${prevHash}`);

export async function buildLedger(items: LedgerInput[]): Promise<LedgerEntry[]> {
  const out: LedgerEntry[] = [];
  let prev = GENESIS;
  for (const [index, it] of items.entries()) {
    const payloadHash = await hashObject(it.payload);
    const hash = await entryHash(index, it.type, it.at, payloadHash, prev);
    out.push({ ...it, index, payloadHash, prevHash: prev, hash });
    prev = hash;
  }
  return out;
}

export interface EntryCheck { index: number; payloadOk: boolean; linkOk: boolean; hashOk: boolean; ok: boolean }

/**
 * Recompute every hash from the stored payloads. An edited entry fails its payload check, and every
 * later entry fails because the chain no longer links to recomputed hashes.
 */
export async function verifyLedger(entries: LedgerEntry[]): Promise<{ ok: boolean; firstBroken: number | null; checks: EntryCheck[] }> {
  const checks: EntryCheck[] = [];
  let prev = GENESIS;
  let broken = false;
  for (const e of entries) {
    const payloadHash = await hashObject(e.payload);
    const hash = await entryHash(e.index, e.type, e.at, payloadHash, prev);
    const payloadOk = payloadHash === e.payloadHash;
    const linkOk = e.prevHash === prev;
    const hashOk = hash === e.hash;
    broken = broken || !(payloadOk && linkOk && hashOk);
    checks.push({ index: e.index, payloadOk, linkOk, hashOk, ok: !broken });
    prev = hash; // recomputed, so a tamper propagates forward
  }
  const firstBroken = checks.find((c) => !c.ok)?.index ?? null;
  return { ok: firstBroken === null, firstBroken, checks };
}
