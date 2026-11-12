import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import type { RuleCard } from "../engine/types";
import { demoRuleCard, RULE_CARD_TEXT, signature } from "../data/policy";
import { hashObject } from "../engine/hash";

export interface CardClause { id: string; text: string; source: string; deletedBy?: string; insertedBy?: string }

export interface SignedCard {
  card: RuleCard;
  text: string;
  /** "demo" = the pre-signed Tallowood card; "loaded" = built from PDFs in this session. */
  origin: "demo" | "loaded";
  status: "Awaiting signature" | "Signed";
  signer?: string;
  signedAt?: string;
  hash?: string;
  extractor: string;
  /** Source clauses shown beside the fields (demo card uses data/policy clauses). */
  clauses?: CardClause[];
  /** Fields the policy owner entered because the parser could not find them. */
  enteredFields?: string[];
}

interface QualifyState {
  agentId: string;
  setAgentId: (id: string) => void;
  connectionTested: boolean;
  setConnectionTested: (v: boolean) => void;
  cards: SignedCard[];
  selectedCardId: string;
  selectCard: (id: string) => void;
  addCard: (c: SignedCard) => void;
  signCard: (id: string, signer: string) => Promise<void>;
  selectedCard?: SignedCard;
  maxStep: number;
  suiteId: string;
  setSuiteId: (id: string) => void;
  runState: "idle" | "running" | "done";
  setRunState: (s: "idle" | "running" | "done") => void;
  sealed: boolean;
  setSealed: (v: boolean) => void;
  setMaxStep: (n: number) => void;
}

const Ctx = createContext<QualifyState | null>(null);

/** Hash that a policy owner's signature covers: the structured card, its text, signer and time. */
export const signaturePayload = (c: SignedCard, signer: string, signedAt: string) => ({ card: c.card, text: c.text, signer, signedAt });

export function QualifyProvider({ children }: { children: ReactNode }) {
  const [agentId, setAgentId] = useState("claimdesk");
  const [connectionTested, setConnectionTested] = useState(false);
  const [maxStep, setMaxStep] = useState(0);
  const [suiteId, setSuiteId] = useState("full");
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");
  const [sealed, setSealed] = useState(false);
  const [cards, setCards] = useState<SignedCard[]>([
    { card: demoRuleCard, text: RULE_CARD_TEXT, origin: "demo", status: "Signed", signer: signature.signer, signedAt: signature.signedAt, extractor: "Extractor A · Family A, cross-checked by Extractor B · Family B" },
  ]);
  const [selectedCardId, selectCard] = useState(demoRuleCard.id);

  // The demo card's signature hash is computed for real on load.
  useEffect(() => {
    const c = cards[0];
    if (c.hash) return;
    hashObject(signaturePayload(c, c.signer!, c.signedAt!)).then((hash) => setCards((cs) => cs.map((x, i) => (i === 0 ? { ...x, hash } : x))));
  }, [cards]);

  const value = useMemo<QualifyState>(() => ({
    agentId, setAgentId, connectionTested, setConnectionTested, cards, selectedCardId, selectCard, maxStep, setMaxStep, suiteId, setSuiteId, runState, setRunState, sealed, setSealed,
    selectedCard: cards.find((c) => c.card.id === selectedCardId),
    addCard: (c) => { setCards((cs) => [...cs.filter((x) => x.card.id !== c.card.id || x.origin === "demo"), c]); selectCard(c.card.id); },
    signCard: async (id, signer) => {
      const c = cards.find((x) => x.card.id === id);
      if (!c) return;
      const signedAt = new Date().toISOString();
      const hash = await hashObject(signaturePayload(c, signer, signedAt));
      setCards((cs) => cs.map((x) => (x.card.id === id ? { ...x, status: "Signed", signer, signedAt, hash } : x)));
    },
  }), [agentId, connectionTested, cards, selectedCardId, maxStep, suiteId, runState, sealed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQualify() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useQualify outside QualifyProvider");
  return v;
}
