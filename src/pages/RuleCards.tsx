import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp } from "lucide-react";
import { Button, Card, CodeBlock, DataTable, Drawer, KeyValue, Mono, PageHeader } from "../components/ui";
import { DecisionPill } from "../components/domain";
import { ruleCards } from "../data/policy";
import { useQualify } from "../context/QualifyContext";

interface Row { id: string; name: string; version: string; status: string; signer: string; date: string; agents: string; text?: string; hash?: string; superseded?: boolean }

export function RuleCardsPage() {
  const nav = useNavigate();
  const { cards } = useQualify();
  const [open, setOpen] = useState<Row | null>(null);
  const demo = cards.find((c) => c.origin === "demo");
  const loaded: Row[] = cards.filter((c) => c.origin === "loaded").map((c) => ({
    id: c.card.id, name: `${c.card.title} (from documents)`, version: "draft", status: c.status, signer: c.signer ?? "—",
    date: c.signedAt ? new Date(c.signedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", year: "numeric" }) : "—", agents: "—", text: c.text, hash: c.hash,
  }));
  const rows: Row[] = [...loaded, ...ruleCards.map((r, i) => ({ ...r, agents: r.agents.join(", ") || "—", text: i === 0 ? demo?.text : undefined, hash: i === 0 ? demo?.hash : undefined }))];

  return (
    <>
      <PageHeader title="Rule cards" description="Your policy rules in a form code can check: drafted from your wordings by AI, cross-checked by a second AI from a different provider, and signed by your policy owner."
        actions={<Button icon={FileUp} onClick={() => nav("/qualify/rules")}>Build from documents</Button>} />
      <Card padded={false}>
        <DataTable<Row> rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setOpen(r)}
          filters={[{ key: "status", label: "Status", options: ["Signed", "Awaiting signature", "Draft"], get: (r) => r.status }]}
          columns={[
            { key: "name", header: "Rule card", sortValue: (r) => r.name, render: (r) => <span className="font-medium text-text">{r.name}{r.superseded && <span className="ml-2 font-normal text-text-3">superseded</span>}</span> },
            { key: "version", header: "Version", render: (r) => <Mono>{r.version}</Mono> },
            { key: "status", header: "Status", render: (r) => <DecisionPill label={r.status} /> },
            { key: "signer", header: "Signed by", render: (r) => r.signer },
            { key: "date", header: "Date", render: (r) => r.date },
            { key: "agents", header: "Used by", render: (r) => <span className="text-text-3">{r.agents}</span> },
          ]} />
      </Card>
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} subtitle={open && <DecisionPill label={open.status} />} width={720}>
        {open && (
          <div className="space-y-4">
            <KeyValue items={[{ k: "Version", v: open.version, mono: true }, { k: "Signed by", v: open.signer }, { k: "Date", v: open.date }, ...(open.hash ? [{ k: "Signature SHA-256", v: open.hash, mono: true }] : [])]} />
            {open.text ? <CodeBlock code={open.text} caption="Signed rule card" /> : <p className="text-[13px] text-text-3">Rule card text is available for the Tallowood Home cards in this demo.</p>}
          </div>
        )}
      </Drawer>
    </>
  );
}
