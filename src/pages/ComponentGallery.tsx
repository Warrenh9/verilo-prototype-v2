import { useState } from "react";
import { Bot, FlaskConical, Play, Trash2 } from "lucide-react";
import {
  Avatar, Badge, Button, Callout, Card, CodeBlock, ConfidenceBar, DataTable, Drawer, KeyValue, Modal, PageHeader, ProgressBar,
  ScoreRing, Skeleton, StatTile, StatusPill, Stepper, Switch, Tabs, Term, Timeline, useToast, Mono,
} from "../components/ui";

type Row = { id: string; name: string; score: number; status: string };
const rows: Row[] = Array.from({ length: 14 }, (_, i) => ({ id: `r${i}`, name: `Sample row ${i + 1}`, score: 70 + ((i * 7) % 30), status: i % 3 ? "Pass" : "Review" }));

/** Internal page (/ui) showing every library component in the Verilo style. Not in the nav. */
export function ComponentGallery() {
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState<"a" | "b">("a");
  const [on, setOn] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Internal" title="Component library" description="Every reusable component, in one place." />
      <Card title="Buttons and status">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" icon={Play}>Start qualification</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive" icon={Trash2}>Destructive</Button>
          <Button variant="primary" disabled disabledReason="Only the policy owner can sign">Sign rule card</Button>
          <Button loading>Loading</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill tone="success">Approved</StatusPill>
          <StatusPill tone="warning">Approved with conditions</StatusPill>
          <StatusPill tone="danger">Reject</StatusPill>
          <StatusPill tone="info" spin>Running</StatusPill>
          <StatusPill tone="brand">Verified</StatusPill>
          <StatusPill>Draft</StatusPill>
          <Badge>Coming next</Badge>
        </div>
      </Card>
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Agents under assurance" value="4" icon={Bot} />
        <StatTile label="Runs this month" value="11" icon={FlaskConical} hint="2 running" />
        <StatTile label="Open reviews" value="3" tone="warning" hint="1 critical" />
        <StatTile label="Next forced model change" value="15 Feb 2027" hint="Model 4.1 retires" />
      </div>
      <Callout tone="warning" title="Model change detected" action={<Button variant="primary" size="sm">Start qualification</Button>}>
        Cobaltline has announced ClaimDesk Agent moves from Model 4.1 to Model 5.0.
      </Callout>
      <div className="grid grid-cols-2 gap-6">
        <Card title="Score and confidence">
          <div className="flex items-center gap-6">
            <ScoreRing score={93} label="Likely range 92–95" />
            <div className="flex-1">
              <ConfidenceBar label="Calculation" weight="0.25" value={0.962} low={0.948} high={0.974} />
              <ConfidenceBar label="Reasoning" weight="0.25" value={0.915} low={0.892} high={0.934} />
            </div>
          </div>
        </Card>
        <Card title="Stepper, tabs, switch, progress">
          <Stepper steps={["Connect", "Rules", "Run", "Decision"]} current={1} />
          <Tabs className="mt-5" value={tab} onChange={setTab} tabs={[{ key: "a", label: "Summary" }, { key: "b", label: "Versions", count: 3 }]} />
          <div className="mt-4 space-y-3">
            <Switch checked={on} onChange={setOn} label="Simulate one critical failure" />
            <ProgressBar value={62} label="Candidate lane" />
            <p className="text-[13px]">A <Term explain="Non-inferiority: the new version is shown to be no worse than the current one, within a set margin.">non-inferiority</Term> test.</p>
          </div>
        </Card>
      </div>
      <Card title="Data table" padded={false}>
        <DataTable rows={rows} rowKey={(r) => r.id} pageSize={5} onRowClick={() => setDrawer(true)}
          filters={[{ key: "s", label: "Outcome", options: ["Pass", "Review"], get: (r) => r.status }]}
          columns={[
            { key: "name", header: "Case", render: (r) => r.name, sortValue: (r) => r.name },
            { key: "status", header: "Outcome", render: (r) => <StatusPill tone={r.status === "Pass" ? "success" : "warning"}>{r.status}</StatusPill> },
            { key: "score", header: "Score", align: "right", render: (r) => r.score, sortValue: (r) => r.score },
          ]} />
      </Card>
      <div className="grid grid-cols-2 gap-6">
        <Card title="Code block"><CodeBlock caption="Illustrative SDK for this prototype" tabs={[{ label: "TypeScript", code: 'import { VeriloConnect } from "@verilo/connect";' }, { label: "Python", code: "from verilo_connect import VeriloConnect" }]} /></Card>
        <Card title="Timeline and key values">
          <Timeline items={[{ title: "Rule card signed", meta: "4 Nov 2026", tone: "brand" }, { title: "Model change announced", meta: "Today", tone: "warning" }, { title: "Model 4.1 retires", meta: "15 Feb 2027" }]} />
          <div className="mt-4"><KeyValue items={[{ k: "Pinned snapshot", v: "model-5.0-2026-10-14", mono: true }, { k: "Owner", v: <span className="inline-flex items-center gap-2"><Avatar name="Dana Whitfield" size={22} />Dana Whitfield</span> }]} /></div>
        </Card>
      </div>
      <Card title="Overlays and loading">
        <div className="flex gap-2">
          <Button onClick={() => setDrawer(true)}>Open drawer</Button>
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button onClick={() => toast({ tone: "success", title: "Evidence pack sealed and sent to Tallowood's audit copy." })}>Show toast</Button>
        </div>
        <div className="mt-4 space-y-2"><Skeleton className="w-2/3" /><Skeleton className="w-1/2" /></div>
      </Card>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Case detail" subtitle={<Mono>case_0412</Mono>}><p>Drawer content.</p></Drawer>
      <Modal open={modal} onClose={() => setModal(false)} title="Confirm" footer={<><Button onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" onClick={() => setModal(false)}>Confirm</Button></>}><p>Modal content.</p></Modal>
    </div>
  );
}
