import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Cloud, FileStack, Globe, Wrench, ArrowLeft, Download, Upload, FlaskConical, type LucideIcon } from "lucide-react";
import { Badge, Button, Callout, Card, CodeBlock, Mono, StatusPill, useToast } from "../components/ui";
import { ConnectionTest } from "../components/domain";
import { useApp } from "../context/AppContext";
import type { Agent, AgentSource } from "../data/agents";
import { DeclareModel, Field, inputCls } from "./fields";
import { cn } from "../lib/cn";

type Opt = "https" | "mcp" | "platform" | "batch" | "cloud";
const OPTIONS: { id: Opt; title: string; best: string; icon: LucideIcon }[] = [
  { id: "https", title: "HTTPS endpoint", best: "In-house agents with an API", icon: Globe },
  { id: "mcp", title: "Tool harness (MCP)", best: "Agents that call tools", icon: Wrench },
  { id: "platform", title: "Agent platform", best: "Agents built on a vendor platform", icon: Boxes },
  { id: "batch", title: "Batch file", best: "Locked-down environments", icon: FileStack },
  { id: "cloud", title: "Run in your cloud", best: "Strict data residency", icon: Cloud },
];

const REQUEST_MAP = `// Verilo test case  →  your API request
{
  "case_id":        "$.id",                 // e.g. "case_0412"
  "claim":          "$.claim",              // cause, dates, amounts
  "documents":      "$.documents[*]",       // policy, schedule, quotes
  "policy_ref":     "$.policy.reference"    // e.g. "TMI-HOME-v3"
}
// The answer key is never sent.`;
const RESPONSE_MAP = `// Your API response  →  Verilo answer
{
  "covered":     "$.decision.covered",      // boolean
  "settlement":  "$.decision.amount",       // decimal string, AUD
  "action":      "$.decision.next_step",    // pay | refer_senior_assessor | request_info | decline
  "reasoning":   "$.explanation",           // judged by reviewer agents
  "citations":   "$.clauses[*]"
}`;
const TOOLS = [
  { name: "get_policy", does: "Returns the policy wording and schedule for the case", stub: "Harness fixture" },
  { name: "get_claim_documents", does: "Returns quotes, photos and notes for the case", stub: "Harness fixture" },
  { name: "calculate_settlement", does: "Agent-side calculator; inputs and output recorded", stub: "Recorded" },
  { name: "post_payment", does: "Would pay the member", stub: "STUBBED · records only, never pays" },
];

export function DirectConnect() {
  const [opt, setOpt] = useState<Opt | null>(null);
  const nav = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {OPTIONS.map((o) => (
          <button key={o.id} onClick={() => setOpt(o.id)} aria-pressed={opt === o.id}
            className={cn("rounded-lg border p-4 text-left", opt === o.id ? "border-ink ring-1 ring-ink" : "border-border bg-bg hover:bg-bg-muted")}>
            <o.icon className="mb-3 size-5 text-text-2" aria-hidden />
            <div className="font-medium text-text">{o.title}</div>
            <div className="mt-1 text-[12px] text-text-3">Best for: {o.best}</div>
          </button>
        ))}
      </div>
      <Callout tone="info" title="Pre-connected Sandbox agent" action={<Button size="sm" icon={FlaskConical} onClick={() => nav("/agents/sandbox?tab=connection")}>Open sandbox</Button>}>
        Runs in your browser, so a demo never depends on network access.
      </Callout>
      {opt === "https" && <HttpsWizard />}
      {opt === "mcp" && <McpWizard />}
      {opt === "platform" && <PlatformWizard />}
      {opt === "batch" && <BatchWizard />}
      {opt === "cloud" && <CloudWizard />}
    </div>
  );
}

function useSave() {
  const { addAgent } = useApp();
  const nav = useNavigate();
  const toast = useToast();
  return (name: string, connection: string, source: AgentSource, m: { family: string; version: string }) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-agent";
    const agent: Agent = {
      id, name, vendor: source === "Platform" ? "Tallowood (via agent platform)" : "Tallowood (in-house)", source, useCase: "Connected in this session",
      connection, connectionHealth: "Healthy", lastCall: "Just now", modelFamily: m.family as Agent["modelFamily"], pinnedVersion: m.version,
      lastDecision: "Scheduled", nextTest: "Smoke test · on save", ruleCard: "Choose at first run", owner: "—",
      versions: [{ label: "1.0.0", model: m.family + " model", snapshot: m.version, status: "Live" }],
    };
    addAgent(agent);
    toast({ tone: "success", title: `${name} connected`, body: `${connection} · pinned ${m.version}` });
    nav(`/agents/${id}?tab=connection`);
  };
}

function SaveBar({ ok, tested, onSave }: { ok: boolean; tested: boolean; onSave: () => void }) {
  const { persona } = useApp();
  return (
    <div className="mt-5 flex justify-end border-t border-border pt-4">
      <Button variant="primary" disabled={!ok || !tested || !persona.can.manageIntegrations}
        disabledReason={!persona.can.manageIntegrations ? "Your role can't connect agents" : !ok ? "Declare the agent name, model family and pinned version" : "Run a test first"} onClick={onSave}>Save connection</Button>
    </div>
  );
}

const valid = (n: string, m: { family: string; version: string }) => !!n && !!m.family && m.version.length > 5;

function HttpsWizard() {
  const save = useSave();
  const [name, setName] = useState("Contents Claims Agent");
  const [url, setUrl] = useState("https://agents.tallowood.example/contents/v1/decide");
  const [auth, setAuth] = useState("OAuth client credentials");
  const [m, setM] = useState({ family: "", version: "" });
  const [tested, setTested] = useState(false);
  return (
    <Card title="HTTPS endpoint">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Agent name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Endpoint URL"><input className={inputCls + " font-mono"} value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
        <Field label="Authentication">
          <select className={inputCls} value={auth} onChange={(e) => setAuth(e.target.value)}><option>OAuth client credentials</option><option>API key</option></select>
        </Field>
        <Field label={auth === "API key" ? "API key" : "Client ID"}><input className={inputCls + " font-mono"} defaultValue={auth === "API key" ? "••••••••••••••••" : "verilo-harness-au"} /></Field>
      </div>
      <div className="mt-4"><DeclareModel value={m} onChange={setM} /></div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CodeBlock code={REQUEST_MAP} caption="Request mapping · JSON preview" />
        <CodeBlock code={RESPONSE_MAP} caption="Response mapping · JSON preview" />
      </div>
      <div className="mt-4"><ConnectionTest onDone={() => setTested(true)} /></div>
      <SaveBar ok={valid(name, m)} tested={tested} onSave={() => save(name, "HTTPS endpoint", "In-house", m)} />
    </Card>
  );
}

function McpWizard() {
  const save = useSave();
  const [name, setName] = useState("Contents Settlement Agent");
  const [m, setM] = useState({ family: "", version: "" });
  const [tested, setTested] = useState(false);
  return (
    <Card title="Tool harness (MCP)">
      <p className="mb-4 text-[13px]">Point your agent at Verilo's MCP server. Verilo provides the agent's tools as stubs, so nothing real moves.</p>
      <div className="mb-4 flex items-center gap-2 text-[13px]">Server <Mono className="rounded border border-border bg-bg-subtle px-2 py-1">mcp.verilo.au/tallowood/harness</Mono></div>
      <table className="mb-4 w-full text-[13px]">
        <thead className="bg-bg-subtle text-left text-text-3"><tr><th className="h-9 px-3 font-medium">Tool</th><th className="px-3 font-medium">What it does</th><th className="px-3 font-medium">In the harness</th></tr></thead>
        <tbody>{TOOLS.map((t) => (
          <tr key={t.name} className="border-t border-border"><td className="h-10 px-3"><Mono>{t.name}</Mono></td><td className="px-3">{t.does}</td>
            <td className="px-3">{t.name === "post_payment" ? <StatusPill tone="warning">{t.stub}</StatusPill> : <span className="text-text-3">{t.stub}</span>}</td></tr>
        ))}</tbody>
      </table>
      <Field label="Agent name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="mt-4"><DeclareModel value={m} onChange={setM} /></div>
      <div className="mt-4"><ConnectionTest onDone={() => setTested(true)} /></div>
      <SaveBar ok={valid(name, m)} tested={tested} onSave={() => save(name, "Tool harness (MCP)", "In-house", m)} />
    </Card>
  );
}

function PlatformWizard() {
  const save = useSave();
  const [tile, setTile] = useState<string | null>(null);
  const [name, setName] = useState("Policy Servicing Agent");
  const [m, setM] = useState({ family: "", version: "" });
  const [tested, setTested] = useState(false);
  return (
    <Card title="Agent platform">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {["Platform A", "Platform B", "Platform C"].map((p) => (
          <button key={p} onClick={() => setTile(p)} aria-pressed={tile === p} className={cn("rounded-lg border p-4 text-left", tile === p ? "border-ink ring-1 ring-ink" : "border-border hover:bg-bg-muted")}>
            <Boxes className="mb-2 size-5 text-text-3" aria-hidden /><div className="font-medium text-text">{p}</div>
            <Badge className="mt-2">via implementation partner</Badge>
          </button>
        ))}
      </div>
      {tile && (
        <>
          <Field label="Agent name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="mt-4"><DeclareModel value={m} onChange={setM} /></div>
          <div className="mt-4"><ConnectionTest onDone={() => setTested(true)} /></div>
          <SaveBar ok={valid(name, m)} tested={tested} onSave={() => save(name, `${tile} · via implementation partner`, "Platform", m)} />
        </>
      )}
    </Card>
  );
}

function BatchWizard() {
  const [uploaded, setUploaded] = useState<number | null>(null);
  const download = () => {
    const lines = Array.from({ length: 50 }, (_, i) => JSON.stringify({ case_id: `smoke_${String(i + 1).padStart(4, "0")}`, claim: { cause: ["storm", "fire", "flood", "theft"][i % 4], loss: String(10000 + i * 731), sum_insured: "500000" }, documents: ["policy", "schedule", "quote"] }));
    const url = URL.createObjectURL(new Blob([lines.join("\n") + "\n"], { type: "application/x-ndjson" }));
    const a = document.createElement("a"); a.href = url; a.download = "verilo-smoke-50.jsonl"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card title="Batch file">
      <ol className="space-y-4 text-[13px]">
        <li><div className="mb-2 font-medium text-text">1. Download the suite</div><Button icon={Download} onClick={download}>Smoke test · 50 cases (JSONL)</Button><span className="ml-2 text-text-3">No answer keys are included.</span></li>
        <li><div className="font-medium text-text">2. Run it in your environment</div><div className="text-text-3">One JSON answer per line, same <Mono>case_id</Mono>.</div></li>
        <li>
          <div className="mb-2 font-medium text-text">3. Upload the answers</div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border-strong px-3 h-9 hover:bg-bg-muted"><Upload className="size-4" aria-hidden />Choose answers file
            <input type="file" accept=".jsonl,.json,.txt" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setUploaded((await f.text()).split("\n").filter((l) => l.trim()).length); }} />
          </label>
          {uploaded !== null && <div className="mt-2"><StatusPill tone="success">{uploaded} answers received · checking is identical to a live run</StatusPill></div>}
        </li>
      </ol>
    </Card>
  );
}

function CloudWizard() {
  const toast = useToast();
  return (
    <Card title="Run in your cloud">
      <p className="text-[13px]">For strict data residency, Verilo's runner is deployed in your own cloud account. Cases, agent answers and checking stay inside your boundary; only hashes and scores leave for the evidence ledger.</p>
      <ul className="mt-3 space-y-1 text-[13px] text-text-2">
        <li>• Same harness, stubs and checking code as hosted Verilo</li>
        <li>• Reviewer-agent calls go through your approved model endpoints</li>
        <li>• Evidence packs replay identically</li>
      </ul>
      <Button className="mt-4" variant="primary" onClick={() => toast({ tone: "success", title: "Setup requested", body: "A Verilo engineer will contact your platform team" })}>Request setup</Button>
    </Card>
  );
}

export const BackLink = ({ onClick }: { onClick: () => void }) => <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onClick}>All connection options</Button>;
