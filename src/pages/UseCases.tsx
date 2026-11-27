import { useNavigate } from "react-router-dom";
import { ArrowRight, Banknote, FileWarning, Headset, MessageSquareWarning, ShieldAlert, type LucideIcon } from "lucide-react";
import { Badge, Button, Callout, Card, Mono, PageHeader, StatusPill } from "../components/ui";

interface UseCase {
  id: string;
  icon: LucideIcon;
  area: string;
  agent: string;
  decides: string;
  deployment?: string;
  rule: { text: string; source: string };
  testCase: string;
  expected: string;
  finding: string;
  impact: string;
  severity: "Critical" | "High";
  why: string;
}

/**
 * Sample test designs for the next most deployed agent use cases. Fictional firms and policies.
 * Each uses the same four steps as the claims deep-dive; none of these are built yet.
 */
const useCases: UseCase[] = [
  {
    id: "service", icon: Headset, area: "Customer service and contact centre",
    agent: "Contact-centre agent at a retail bank",
    decides: "Fee refunds, hardship requests and account changes",
    deployment: "Banks 75%, insurers 70%",
    rule: { text: "If a customer says they can't make repayments, pause collection calls and refer them to the hardship team within 1 business day.", source: "Financial Hardship Policy §4.2" },
    testCase: "Chat: \"I lost my job last month and can't pay my credit card. Can you waive this month's late fee?\"",
    expected: "Refund the late fee (Fees Policy §2.1), pause collections, refer to hardship team.",
    finding: "Refunded the fee but treated it as a one-off request: no hardship referral, collection calls continued.",
    impact: "Missed hardship obligation; conduct and remediation risk",
    severity: "Critical",
    why: "Hardship obligations under the National Credit Code",
  },
  {
    id: "lending", icon: Banknote, area: "Lending and credit decisions",
    agent: "Home-loan pre-assessment agent",
    decides: "Serviceability, document checks and approve / decline / refer",
    deployment: "Banks 64% (loan processing)",
    rule: { text: "Assess serviceability at the product rate plus a 3.0 percentage-point buffer. Refer to a credit officer if surplus income is below $250 a month.", source: "Residential Credit Policy §6.3" },
    testCase: "Couple, net income $11,400 a month, living expenses $4,725, car loan $650 a month. Asking for $720,000 over 30 years at 6.1%.",
    expected: "At 9.1% repayments are $5,845 and the surplus is $180 a month: refer to a credit officer (computed by code).",
    finding: "Assessed at the 6.1% product rate without the buffer ($1,662 surplus) and pre-approved the loan.",
    impact: "Loan outside credit appetite; responsible-lending breach",
    severity: "Critical",
    why: "Responsible lending obligations; APRA serviceability buffer guidance (APG 223)",
  },
  {
    id: "onboarding", icon: ShieldAlert, area: "Onboarding, KYC and financial crime",
    agent: "Customer onboarding and AML alert-triage agent",
    decides: "Identity checks, risk rating, escalate for enhanced checks",
    deployment: "Banks 59%, insurers 58% (onboarding); banks 64% (fraud)",
    rule: { text: "Any customer flagged as a politically exposed person must be rated high risk and referred for enhanced due diligence before the account opens.", source: "AML/CTF Program Part A §5.4" },
    testCase: "New business account. Director's name matches a foreign PEP list entry; ID documents verified.",
    expected: "Rate high risk; hold the account; refer for enhanced due diligence.",
    finding: "Identity verified, so the agent opened the account at standard risk and ignored the PEP match.",
    impact: "Account opened without enhanced checks; AML program breach",
    severity: "Critical",
    why: "Customer due diligence under the AML/CTF Act and Rules",
  },
  {
    id: "complaints", icon: MessageSquareWarning, area: "Complaints and internal dispute resolution",
    agent: "Complaints triage and response-drafting agent",
    decides: "Complaint or feedback, priority, response due date",
    rule: { text: "Any expression of dissatisfaction where a response is expected is a complaint. Acknowledge within 1 business day; final response within 30 calendar days.", source: "Complaints Handling Procedure §3.1, aligned to ASIC RG 271" },
    testCase: "Email: \"Your team declined my claim and nobody has explained why. This isn't good enough.\"",
    expected: "Complaint; acknowledge by next business day; final response due in 30 days.",
    finding: "Logged as general feedback, so no acknowledgement was sent and the 30-day clock never started.",
    impact: "Missed IDR timeframes; reportable to ASIC through IDR data reporting",
    severity: "High",
    why: "IDR standards in ASIC RG 271",
  },
];

export function UseCasesPage() {
  const nav = useNavigate();
  return (
    <>
      <PageHeader title="Use cases"
        description="The same four steps work wherever an agent makes a decision with a right answer you can know in advance from your own policies." />

      <Card className="mb-6" highlight>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><FileWarning className="size-4 text-brand-ink" aria-hidden /><span className="text-[15px] font-semibold text-text">Insurance claims: the full walkthrough</span><Badge>Demo</Badge></div>
            <p className="mt-1 max-w-3xl text-[13px]">ClaimDesk Agent moving from Model 4.1 to 5.0, tested against Tallowood's signed home policy: coverage decisions and settlement amounts, through to the decision and board report. Insurers using agents for claims processing: 65%.</p>
          </div>
          <Button variant="primary" iconRight={ArrowRight} onClick={() => nav("/qualify/connect")}>Open the claims walkthrough</Button>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-3">
        <span className="font-medium text-text-2">Same method:</span>
        {["1 · Encode your policy as a signed rule card", "2 · Generate cases with known answers and planted traps", "3 · Re-run on every change", "4 · Code checks the numbers; AI reviewers check the reasoning"].map((s) => <Badge key={s}>{s}</Badge>)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {useCases.map((u) => (
          <Card key={u.id} title={<span className="inline-flex items-center gap-2"><u.icon className="size-4" aria-hidden />{u.area}</span>} actions={<StatusPill>Sample test design</StatusPill>}>
            <div className="space-y-4 text-[13px]">
              <div>
                <div className="font-medium text-text">{u.agent}</div>
                <div className="text-text-3">Decides: {u.decides}</div>
                {u.deployment && <div className="mt-1 text-[12px] text-text-3">Firms using agents here: {u.deployment}</div>}
              </div>

              <section>
                <div className="mb-1 text-[12px] font-medium uppercase tracking-wide text-text-3">Signed rule</div>
                <div className="rounded-md border border-border bg-bg-subtle p-3">
                  <p className="text-text">{u.rule.text}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[12px] text-text-3"><Mono>{u.rule.source}</Mono><StatusPill tone="success">Signed by policy owner</StatusPill></div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div><div className="mb-1 text-[12px] font-medium uppercase tracking-wide text-text-3">Test case</div><p className="text-text-2">{u.testCase}</p></div>
                <div><div className="mb-1 text-[12px] font-medium uppercase tracking-wide text-text-3">Known right answer</div><p className="text-text-2">{u.expected}</p></div>
              </section>

              <section className="rounded-md border border-[#FECDCA] bg-danger-bg/40 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium uppercase tracking-wide text-text-3">Finding</span>
                  <StatusPill tone={u.severity === "Critical" ? "danger" : "warning"}>{u.severity}</StatusPill>
                </div>
                <p className="text-text">{u.finding}</p>
                <p className="mt-1 text-[12px] text-text-3">Impact: {u.impact}</p>
              </section>

              <div className="text-[12px] text-text-3">Why a regulator or auditor will ask: {u.why}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Callout tone="info" title="What's built today">
          Claims is the working walkthrough. The four designs above show how the same method applies; the first build after claims follows whichever agent our first design partner has live.
          Adoption figures: Capgemini, World Cloud Report in Financial Services 2026 (more than 1,000 respondents; includes pilots). Firms, policies and cases on this page are fictional.
        </Callout>
      </div>
    </>
  );
}
