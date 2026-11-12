import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, KeyValue, Logo, StatusPill } from "../components/ui";
import { CertBadge } from "../integrations/VendorFlow";
import { useApp } from "../context/AppContext";

/** Shareable certificate page (verilo.au/cert/cobaltline-claimdesk-5-0 in production). */
export function CertificatePage() {
  const nav = useNavigate();
  const { certifiedV5 } = useApp();
  const v = certifiedV5 ? { model: "Model 5.0", snap: "model-5.0-2026-10-14", to: "30 Nov 2027" } : { model: "Model 4.1", snap: "model-4.1-2026-03-02", to: "15 Feb 2027" };
  return (
    <div className="min-h-screen bg-bg-subtle py-10">
      <div className="mx-auto max-w-[720px] px-6">
        <Button className="no-print mb-4" icon={ArrowLeft} onClick={() => nav(-1)}>Back</Button>
        <div className="rounded-lg border border-border bg-bg p-10">
          <div className="flex items-center justify-between"><Logo /><span className="font-mono text-[12px] text-text-3">verilo.au/cert/cobaltline-claimdesk-{certifiedV5 ? "5-0" : "4-1"}</span></div>
          <h1 className="mt-8 text-[24px]">ClaimDesk Agent</h1>
          <div className="text-text-3">Cobaltline · Home claims: coverage and settlement</div>
          <div className="my-6 flex items-center gap-4"><StatusPill tone="brand" className="h-7 px-3 text-[13px]">Certified · {v.model} · valid to {v.to}</StatusPill><CertBadge /></div>
          <KeyValue items={[
            { k: "Pinned version", v: v.snap, mono: true },
            { k: "Model family", v: "Family C" },
            { k: "Suite", v: "Verilo home claims standard suite (locked)" },
            { k: "Disputed cases reviewed by", v: "[Partner audit firm]" },
            { k: "Evidence", v: "Hosted in Australia; replayable evidence pack available to customers" },
          ]} />
          <p className="mt-6 rounded-md bg-bg-subtle p-4 text-[13px]">
            This certificate means the agent passed Verilo's locked standard suite on this version. It is independent assurance on a fixed suite, not a certification of safety or a guarantee.
            Each insurer should still qualify the agent on its own signed rules.
          </p>
        </div>
      </div>
    </div>
  );
}
