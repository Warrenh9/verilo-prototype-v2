import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, Copy, Lock, ShieldCheck, Webhook } from "lucide-react";
import { Button, Callout, Card, CodeBlock, KeyValue, Mono, ProgressBar, StatusPill, Stepper, Switch, useToast } from "../components/ui";
import { ConnectionTest } from "../components/domain";
import { useApp } from "../context/AppContext";
import { Field, inputCls } from "./fields";

const STEPS = ["Register", "Install plug-in", "Release gate", "Certify", "Share"];

const TS = `import { VeriloConnect } from "@verilo/connect";

const verilo = new VeriloConnect({ apiKey: process.env.VERILO_KEY, region: "au" });

verilo.registerAgent({
  agentId: "claimdesk",
  version: "5.0.0",
  modelFamily: "Family C",
  modelSnapshot: "model-5.0-2026-10-14",
});

// Verilo sends test cases; side-effecting tools are stubbed by the harness.
verilo.onTestCase(async (testCase) => claimDesk.handle(testCase));`;

const PY = `from verilo_connect import VeriloConnect
import os

verilo = VeriloConnect(api_key=os.environ["VERILO_KEY"], region="au")

verilo.register_agent(
    agent_id="claimdesk",
    version="5.0.0",
    model_family="Family C",
    model_snapshot="model-5.0-2026-10-14",
)

# Verilo sends test cases; side-effecting tools are stubbed by the harness.
@verilo.on_test_case
async def handle(test_case):
    return await claim_desk.handle(test_case)`;

const CI = `# .ci/verilo-release-gate.yml — illustrative
verilo-release-gate:
  stage: release
  script:
    - verilo gate run --agent claimdesk --version "$RELEASE_VERSION" \\
        --suite home-claims-standard --compare-to live
    # Exits non-zero if the new version is worse than the live one
  rules:
    - changes: [ "models/**", "prompts/**", "tools/**" ]`;

export function VendorFlow() {
  const { workspace, setCertifiedV5, certifiedV5, setWorkspace } = useApp();
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(certifiedV5 ? 4 : 0);
  const [reach, setReach] = useState(certifiedV5 ? 4 : 0);
  const [form, setForm] = useState({ name: "ClaimDesk Agent", useCase: "Home claims: coverage and settlement", family: "Family C", version: "model-5.0-2026-10-14", insurers: ["Tallowood Mutual Insurance"] });
  const [pluginOk, setPluginOk] = useState(certifiedV5);
  const [blockWorse, setBlockWorse] = useState(true);
  const [webhookSent, setWebhookSent] = useState(false);
  const [cert, setCert] = useState<"idle" | "running" | "done">(certifiedV5 ? "done" : "idle");
  const [certP, setCertP] = useState(certifiedV5 ? 100 : 0);
  const isVendor = workspace.id === "cobaltline";

  const go = (n: number) => { setStep(n); setReach((r) => Math.max(r, n)); };
  const startCert = () => {
    setCert("running");
    let p = 0;
    const id = window.setInterval(() => {
      p += 4; setCertP(p);
      if (p >= 100) { window.clearInterval(id); setCert("done"); setCertifiedV5(true); toast({ tone: "success", title: "Certified · Model 5.0", body: "Passed Verilo's locked standard suite for home claims" }); }
    }, 160);
  };

  if (!isVendor) {
    return (
      <Callout tone="info" title="Verilo Connect is set up from the vendor's workspace" action={<Button variant="primary" onClick={() => setWorkspace("cobaltline")}>Switch to Cobaltline (vendor)</Button>}>
        AI agent vendors register their agent, install the plug-in, gate releases and certify once on Verilo's locked standard suite. Every insurer using the agent benefits.
      </Callout>
    );
  }

  const canNext = step === 0 ? form.name && form.version && form.family : step === 1 ? pluginOk : step === 2 ? true : step === 3 ? cert === "done" : false;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-bg px-5 py-4"><Stepper steps={STEPS} current={step} onSelect={go} maxReached={reach} /></div>

      {step === 0 && (
        <Card title="Register the agent">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Agent name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Use case"><input className={inputCls} value={form.useCase} onChange={(e) => setForm({ ...form, useCase: e.target.value })} /></Field>
            <Field label="Model family" hint="Reviewer agents from this family are excluded from your panel.">
              <select className={inputCls} value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })}>{["Family A", "Family B", "Family C"].map((f) => <option key={f}>{f}</option>)}</select>
            </Field>
            <Field label="Pinned model version" hint="Exact snapshot. A floating alias is not accepted."><input className={inputCls + " font-mono"} value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></Field>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-[13px] text-text-3">Deployed with</legend>
            {["Tallowood Mutual Insurance", "Kestrel Bay Insurance", "Harbourline Mutual"].map((i) => (
              <label key={i} className="mr-6 inline-flex items-center gap-2 text-[13px]">
                <input type="checkbox" className="accent-[#0B0F14]" checked={form.insurers.includes(i)} onChange={(e) => setForm({ ...form, insurers: e.target.checked ? [...form.insurers, i] : form.insurers.filter((x) => x !== i) })} />{i}
              </label>
            ))}
          </fieldset>
        </Card>
      )}

      {step === 1 && (
        <Card title="Install the plug-in">
          <CodeBlock tabs={[{ label: "TypeScript", code: TS }, { label: "Python", code: PY }]} caption="Illustrative SDK for this prototype" />
          <div className="mt-4"><ConnectionTest label="Check plug-in" onDone={() => setPluginOk(true)} /></div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Release gate">
          <p className="mb-4 text-[13px]">Every model, prompt or tool change triggers a re-test automatically. The gate can block the release if the new version is worse than the live one.</p>
          <KeyValue items={[
            { k: <span className="inline-flex items-center gap-1.5"><Webhook className="size-4" />Webhook URL</span>, v: "https://hooks.verilo.au/v1/gate/cobaltline/claimdesk", mono: true },
            { k: "Signing secret", v: "whsec_••••••••••••3f9a", mono: true },
            { k: "Block release if worse", v: <Switch checked={blockWorse} onChange={setBlockWorse} label={<span className="sr-only">Block release if worse</span>} /> },
          ]} />
          <div className="mt-4"><CodeBlock code={CI} caption="CI step · illustrative" /></div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => setWebhookSent(true)}>Send test event</Button>
            {webhookSent && <StatusPill tone="success">Delivered · 200 OK · 184 ms</StatusPill>}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Certify on Verilo's locked standard suite">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <KeyValue items={[
              { k: "Suite", v: "Home claims standard suite" },
              { k: "Version", v: form.version, mono: true },
              { k: "Cases", v: "1,000 fresh, with planted traps" },
              { k: "Disputed cases", v: "[Partner audit firm] accepted by your customers" },
            ]} />
            <div className="rounded-lg border border-border bg-bg-subtle p-4 text-[13px]">
              <div className="mb-1 flex items-center gap-2 font-semibold text-text"><Lock className="size-4" aria-hidden />Locked</div>
              Cobaltline can't see or edit the tests or the answers. Disputes go to a reviewer your customers accept — never Cobaltline's own team or Verilo staff.
            </div>
          </div>
          {cert === "idle" && <Button variant="primary" icon={ShieldCheck} onClick={startCert}>Start certification run</Button>}
          {cert !== "idle" && (
            <div>
              <div className="mb-1 flex justify-between text-[13px]"><span>{cert === "done" ? "Complete" : "Running locked suite…"}</span><span className="tnum">{certP}%</span></div>
              <ProgressBar value={certP} label="Certification progress" />
              {cert === "done" && <div className="mt-3"><Callout tone="success" title="Passed Verilo's locked standard suite on Model 5.0">All gates passed. Score [__] (standard-suite results to be confirmed). This is evidence for your customers' model validation, not a guarantee.</Callout></div>}
            </div>
          )}
        </Card>
      )}

      {step === 4 && (
        <Card title="Share the certificate" highlight>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <StatusPill tone="brand" icon={BadgeCheck}>Certified · Model 5.0 · valid to 30 Nov 2027</StatusPill>
              <p className="mt-3 text-[13px]">Means ClaimDesk Agent passed Verilo's locked standard suite for home claims on <Mono>model-5.0-2026-10-14</Mono>. Each insurer can still qualify it on its own signed rules.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Mono className="rounded border border-border bg-bg px-2 py-1">verilo.au/cert/cobaltline-claimdesk-5-0</Mono>
                <Button size="sm" icon={Copy} onClick={() => { navigator.clipboard?.writeText("https://verilo.au/cert/cobaltline-claimdesk-5-0").catch(() => {}); toast({ tone: "success", title: "Link copied" }); }}>Copy link</Button>
                <Button size="sm" onClick={() => nav("/certificate")}>Open certificate page</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-bg p-4 text-center">
              <div className="mb-2 text-[12px] text-text-3">Badge</div>
              <CertBadge />
            </div>
          </div>
          <div className="mt-6 border-t border-brand-border pt-4">
            <Button variant="primary" iconRight={ArrowRight} onClick={() => { setWorkspace("tallowood"); nav("/agents/claimdesk?tab=certification"); }}>See it as Tallowood</Button>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button icon={ArrowLeft} disabled={step === 0} onClick={() => go(step - 1)}>Back</Button>
        {step < 4 && <Button variant="primary" iconRight={ArrowRight} disabled={!canNext} disabledReason={step === 1 ? "Check the plug-in first" : step === 3 ? "Run certification first" : "Complete the required fields"} onClick={() => go(step + 1)}>{step === 0 ? "Register agent" : "Continue"}</Button>}
      </div>
    </div>
  );
}

export function CertBadge() {
  return (
    <svg width="208" height="40" viewBox="0 0 208 40" role="img" aria-label="Verilo certified, ClaimDesk Model 5.0">
      <rect x="0.5" y="0.5" width="207" height="39" rx="7" fill="#FFFFFF" stroke="#D0D5DD" />
      <rect x="8" y="8" width="24" height="24" rx="5" fill="#B8F36A" />
      <path d="M14 20.5l3.6 3.6L26 15.5" fill="none" stroke="#0B0F14" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="42" y="18" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" fill="#101828">Verilo certified</text>
      <text x="42" y="31" fontFamily="Inter, sans-serif" fontSize="10" fill="#475467">ClaimDesk · Model 5.0 · to 11/2027</text>
    </svg>
  );
}
