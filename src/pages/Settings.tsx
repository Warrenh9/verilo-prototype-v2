import { useState } from "react";
import { KeyRound, Plus, ShieldCheck } from "lucide-react";
import { Avatar, Badge, Button, Card, KeyValue, Mono, PageHeader, StatusPill, Switch, Tabs, Timeline, useToast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { personas } from "../data/personas";
import { nominatedReviewers } from "../data/reviews";
import { standardsMapping } from "../data/evidence";

type Tab = "members" | "reviewers" | "sso" | "keys" | "webhooks" | "region" | "standards" | "audit";

const AUDIT = [
  { at: "12 Nov 2026, 12:21", text: "Evidence pack ep_2026-11-12_7a3d sealed; copy sent to Tallowood audit" },
  { at: "12 Nov 2026, 09:03", text: "Qualification run_2026-11-12_cd50 started by Dana Whitfield" },
  { at: "12 Nov 2026, 08:55", text: "Priya Nandakumar recorded a review decision on rv_103" },
  { at: "4 Nov 2026, 10:12", text: "Rule card Tallowood Home v3 + Endorsement 07 signed by Head of Home Claims" },
  { at: "28 Oct 2026, 16:40", text: "Model change notice received from Cobaltline (ClaimDesk Model 5.0)" },
  { at: "14 Oct 2026, 11:05", text: "API key vk_live_…8c21 created by Dana Whitfield" },
];

export function SettingsPage() {
  const { persona } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("members");
  const [hooks, setHooks] = useState({ decision: true, review: true, change: true });
  const ro = !persona.can.editSettings;
  const reason = "Your role can view settings but not change them";
  const tallowood = Object.values(personas).filter((p) => p.workspace === "tallowood");

  return (
    <>
      <PageHeader title="Settings" description="Tallowood Mutual Insurance workspace" />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[
        { key: "members", label: "Members and roles" }, { key: "reviewers", label: "Nominated reviewers" }, { key: "sso", label: "SSO" }, { key: "keys", label: "API keys" },
        { key: "webhooks", label: "Webhooks" }, { key: "region", label: "Data region" }, { key: "standards", label: "Standards" }, { key: "audit", label: "Audit log" },
      ]} />

      {tab === "members" && (
        <Card title="Members and roles" padded={false} actions={<Button size="sm" icon={Plus} disabled={ro} disabledReason={reason}>Invite</Button>}>
          <table className="w-full text-[13px]">
            <thead className="bg-bg-subtle text-left text-text-3"><tr><th className="h-10 px-4 font-medium">Member</th><th className="px-4 font-medium">Role</th><th className="px-4 font-medium">Can</th></tr></thead>
            <tbody>{tallowood.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="h-12 px-4"><span className="inline-flex items-center gap-2"><Avatar name={p.name} />{p.name}<span className="text-text-3">· {p.title.split(",")[0]}</span></span></td>
                <td className="px-4">{p.role}</td>
                <td className="px-4"><div className="flex flex-wrap gap-1">{Object.entries(p.can).filter(([, v]) => v).map(([k]) => <Badge key={k}>{k.replace(/([A-Z])/g, " $1").toLowerCase()}</Badge>)}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}

      {tab === "reviewers" && (
        <Card title="Nominated reviewers" actions={<Button size="sm" icon={Plus} disabled={ro} disabledReason={reason}>Nominate</Button>}>
          <p className="mb-3 text-[13px]">Human reviews go only to people Tallowood nominates. Critical items need two reviewers from outside the team that runs the agent. Verilo staff never review.</p>
          <KeyValue items={nominatedReviewers.map((r) => ({ k: <span className="inline-flex items-center gap-2"><Avatar name={r.name} size={24} />{r.name}</span>, v: `${r.team} · ${r.role}` }))} />
        </Card>
      )}

      {tab === "sso" && (
        <Card title="Single sign-on">
          <KeyValue items={[
            { k: "Status", v: <StatusPill tone="success" icon={ShieldCheck}>Configured</StatusPill> },
            { k: "Protocol", v: "SAML 2.0" },
            { k: "Identity provider", v: "Tallowood corporate directory" },
            { k: "Enforced for", v: "All members" },
            { k: "Role mapping", v: "Directory groups → Verilo roles" },
          ]} />
        </Card>
      )}

      {tab === "keys" && (
        <Card title="API keys" actions={<Button size="sm" icon={KeyRound} disabled={ro} disabledReason={reason} onClick={() => toast({ tone: "success", title: "Key created", body: "Shown once. Store it in your secrets manager." })}>Create key</Button>}>
          <KeyValue items={[
            { k: "Production · harness", v: "vk_live_••••••••8c21", mono: true },
            { k: "Sandbox", v: "vk_test_••••••••41af", mono: true },
            { k: "Batch uploads", v: "vk_live_••••••••d907", mono: true },
          ]} />
        </Card>
      )}

      {tab === "webhooks" && (
        <Card title="Webhooks">
          <KeyValue items={[
            { k: "Endpoint", v: "https://hooks.tallowood.example/verilo", mono: true },
            { k: "Decision ready", v: <Switch checked={hooks.decision} disabled={ro} onChange={(v) => setHooks({ ...hooks, decision: v })} label={<span className="sr-only">Decision ready</span>} /> },
            { k: "Review assigned", v: <Switch checked={hooks.review} disabled={ro} onChange={(v) => setHooks({ ...hooks, review: v })} label={<span className="sr-only">Review assigned</span>} /> },
            { k: "Model change detected", v: <Switch checked={hooks.change} disabled={ro} onChange={(v) => setHooks({ ...hooks, change: v })} label={<span className="sr-only">Model change detected</span>} /> },
            { k: "Last delivery", v: <StatusPill tone="success">200 OK · 12 Nov 2026, 12:21</StatusPill> },
          ]} />
        </Card>
      )}

      {tab === "region" && (
        <Card title="Data region" highlight>
          <KeyValue items={[
            { k: "Region", v: <StatusPill tone="brand" icon={ShieldCheck}>Australia</StatusPill> },
            { k: "Cases, answers and evidence", v: "Stored and processed in Australia" },
            { k: "Reviewer-agent calls", v: "Routed through Australian endpoints" },
            { k: "Retention", v: "[__] years (set to your policy)" },
          ]} />
        </Card>
      )}

      {tab === "standards" && (
        <Card title="Standards mapping">
          <p className="mb-3 text-[13px]">Evidence packs include a mapping to these standards. Control references are placeholders.</p>
          {standardsMapping.map((s) => (
            <div key={s.standard} className="flex items-center justify-between border-b border-border py-2.5 text-[13px] last:border-b-0">
              <span className="font-medium text-text">{s.standard}</span>
              <span className="text-text-3">{s.items.length} topics · <Mono>[control ref]</Mono></span>
            </div>
          ))}
        </Card>
      )}

      {tab === "audit" && <Card title="Audit log"><Timeline items={AUDIT.map((a) => ({ title: a.text, meta: a.at }))} /></Card>}
    </>
  );
}
