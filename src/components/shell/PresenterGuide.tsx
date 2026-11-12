import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Presentation } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useQualify } from "../../context/QualifyContext";
import type { WorkspaceId } from "../../data/personas";

interface Stop { path: string; title: string; points: string[]; workspace: WorkspaceId }
export const STOPS: Stop[] = [
  { path: "/", workspace: "tallowood", title: "The trigger", points: [
    "Tallowood relies on Cobaltline's ClaimDesk Agent to decide home claims.",
    "Cobaltline is swapping the model underneath: 4.1 retires 15 Feb 2027. Nobody independent checks the new one still gets it right.",
    "APRA's April 2026 letter expects continuous assurance, not point-in-time samples." ] },
  { path: "/qualify/connect", workspace: "tallowood", title: "1 · Connect", points: [
    "Current Model 4.1 vs candidate Model 5.0, both pinned to exact snapshots.",
    "Connected through Cobaltline's plug-in. Test connection: post_payment is stubbed — nothing real moves." ] },
  { path: "/qualify/rules", workspace: "tallowood", title: "2 · Rules", points: [
    "Tallowood's own wording and Endorsement 07, as a rule card. A second AI from a different provider cross-checked it.",
    "The one difference — flood — was resolved and signed by the policy owner. SHA-256 recorded.",
    "Load documents: Home v3 alone flips the flood claim to a decline. Same agent answer, different signed rules." ] },
  { path: "/qualify/run", workspace: "tallowood", title: "3 · Run", points: [
    "1,000 fresh cases, 130 critical, 18 trap types. Seed committed before generation.",
    "Both versions answer the same cases. The answer key never reaches the agent.",
    "Code checks every number; reviewer agents judge reasoning; ~US$20 of AI checking." ] },
  { path: "/qualify/decision", workspace: "tallowood", title: "4 · Decision", points: [
    "93, likely 92–95: approve with a condition — missing quotes or proof get human checks for 60 days.",
    "Non-inferior, narrowly. Open a case to see how the reviewer panel settles.",
    "Flip 'Simulate one critical failure': one wrongful decline caps the score at 59 and rejects." ] },
  { path: "/evidence", workspace: "tallowood", title: "Evidence", points: [
    "Every step is hash-chained. Replay reproduces the identical score hash.",
    "Tamper test: edit one entry and verification breaks from there on.",
    "Mapped to AIUC-1, ISO/IEC 42001 and APRA CPS 230; board report in one click." ] },
  { path: "/integrations", workspace: "cobaltline", title: "The vendor's side", points: [
    "Cobaltline installs the plug-in once and gates every release.",
    "Certifies on Verilo's locked suite — can't see tests or answers. Disputes go to a reviewer customers accept.",
    "Certify, then share the link and badge." ] },
  { path: "/agents/claimdesk", workspace: "tallowood", title: "Back at Tallowood", points: [
    "ClaimDesk shows Vendor-certified on Model 5.0, linked to the certificate.",
    "Tallowood still qualifies it on its own signed rules — both ways in, one harness." ] },
];

export function PresenterGuide() {
  const { presenter, setWorkspace } = useApp();
  const q = useQualify();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const idx = Math.max(0, STOPS.findIndex((s) => s.path === pathname || (s.path !== "/" && pathname.startsWith(s.path))));
  const stop = STOPS[idx];

  const goTo = (i: number) => {
    const s = STOPS[i];
    if (!s) return;
    if (s.path === "/qualify/decision" && q.runState !== "done") q.setRunState("done");
    setWorkspace(s.workspace);
    nav(s.path === "/agents/claimdesk" ? "/agents/claimdesk?tab=certification" : s.path);
  };

  useEffect(() => {
    if (!presenter) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === "n" || e.key === "N") goTo(idx + 1);
      if (e.key === "p" || e.key === "P") goTo(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!presenter) return null;
  return (
    <aside aria-label="Presenter guide" className="no-print anim-fade fixed bottom-6 right-6 z-30 w-[340px] rounded-lg border border-border bg-bg shadow-raised">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-text"><Presentation className="size-4" aria-hidden />Stop {idx + 1} of {STOPS.length} · {stop.title}</span>
        <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand guide" : "Collapse guide"} className="rounded p-1 text-text-3 hover:bg-bg-muted">{collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button>
      </div>
      {!collapsed && (
        <ul className="space-y-2 px-4 py-3 text-[13px] text-text-2">
          {stop.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-ink" />{p}</li>)}
        </ul>
      )}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <button onClick={() => goTo(idx - 1)} disabled={idx === 0} className="inline-flex items-center gap-1 rounded-md px-2 h-8 text-[13px] text-text-2 hover:bg-bg-muted disabled:opacity-40"><ArrowLeft className="size-4" />Back</button>
        <span className="text-[11px] text-text-3">N / P keys</span>
        <button onClick={() => goTo(idx + 1)} disabled={idx === STOPS.length - 1} className="inline-flex items-center gap-1 rounded-md bg-ink px-3 h-8 text-[13px] font-medium text-white disabled:opacity-40">Next<ArrowRight className="size-4" /></button>
      </div>
    </aside>
  );
}
