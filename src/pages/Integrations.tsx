import { useState } from "react";
import { Building2, Store } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { VendorFlow } from "../integrations/VendorFlow";
import { DirectConnect, BackLink } from "../integrations/DirectConnect";
import { cn } from "../lib/cn";

export function IntegrationsPage() {
  const { workspace } = useApp();
  const [path, setPath] = useState<"vendor" | "direct" | null>(workspace.id === "cobaltline" ? "vendor" : null);
  const Big = ({ id, icon: Icon, title, body }: { id: "vendor" | "direct"; icon: typeof Store; title: string; body: string }) => (
    <button onClick={() => setPath(id)} aria-pressed={path === id}
      className={cn("rounded-lg border p-6 text-left", path === id ? "border-ink ring-1 ring-ink" : "border-border bg-bg hover:bg-bg-muted")}>
      <Icon className="mb-3 size-6 text-text-2" aria-hidden />
      <div className="text-[16px] font-semibold text-text">{title}</div>
      <p className="mt-1 text-[13px] text-text-3">{body}</p>
    </button>
  );
  return (
    <>
      <PageHeader title="Integrations" description="Two ways in, one harness. Every connection declares the agent's model family and an exact pinned version, because reviewer agents from the same family are excluded." />
      {!path ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Big id="vendor" icon={Store} title="I sell an AI agent to banks and insurers" body="Install the Verilo Connect plug-in, gate every release, and certify once on Verilo's locked standard suite. Every insurer using your agent benefits." />
          <Big id="direct" icon={Building2} title="I run an agent in my organisation" body="Connect your own agent — built in-house or bought — and test it on your own signed rules." />
        </div>
      ) : (
        <>
          <div className="mb-4"><BackLink onClick={() => setPath(null)} /></div>
          <h2 className="mb-4 text-[16px]">{path === "vendor" ? "Verilo Connect for AI agent vendors" : "Connect an agent"}</h2>
          {path === "vendor" ? <VendorFlow /> : <DirectConnect />}
        </>
      )}
    </>
  );
}
