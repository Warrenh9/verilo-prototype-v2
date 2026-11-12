import type { Family } from "../engine/panel";

export type AgentSource = "Vendor-certified" | "In-house" | "Platform" | "Sandbox";
export type DecisionLabel = "Approved" | "Approved with conditions" | "Rejected" | "Insufficient evidence" | "Change pending" | "Scheduled";

export interface AgentVersion { label: string; model: string; snapshot: string; status: "Live" | "Candidate" | "Retired" | "Retiring"; note?: string }
export interface Agent {
  id: string;
  name: string;
  vendor: string; // "Cobaltline" or "Tallowood (in-house)"
  source: AgentSource;
  useCase: string;
  connection: string;
  connectionHealth: "Healthy" | "Degraded" | "Offline";
  lastCall: string;
  modelFamily: Family;
  pinnedVersion: string;
  lastDecision: DecisionLabel;
  lastScore?: number;
  nextTest: string;
  ruleCard: string;
  owner: string;
  versions: AgentVersion[];
  certification?: { status: string; version: string; validTo: string; link: string };
  sandbox?: boolean;
}

export const agents: Agent[] = [
  {
    id: "claimdesk", name: "ClaimDesk Agent", vendor: "Cobaltline", source: "Vendor-certified", useCase: "Home claims: coverage and settlement",
    connection: "Verilo Connect plug-in", connectionHealth: "Healthy", lastCall: "12 Nov 2026, 09:41 AEDT",
    modelFamily: "Family C", pinnedVersion: "model-4.1-2026-03-02", lastDecision: "Change pending", lastScore: 92,
    nextTest: "Decide by 16 Jan 2027", ruleCard: "Tallowood Home v3 + Endorsement 07", owner: "Head of Home Claims",
    versions: [
      { label: "5.0.0", model: "Model 5.0", snapshot: "model-5.0-2026-10-14", status: "Candidate", note: "Announced by Cobaltline 28 Oct 2026" },
      { label: "4.1.3", model: "Model 4.1", snapshot: "model-4.1-2026-03-02", status: "Retiring", note: "Retires 15 Feb 2027" },
      { label: "4.0.2", model: "Model 4.0", snapshot: "model-4.0-2025-09-18", status: "Retired" },
    ],
    certification: { status: "Certified", version: "Model 4.1", validTo: "15 Feb 2027", link: "verilo.au/cert/cobaltline-claimdesk-4-1" },
  },
  {
    id: "coverage-triage", name: "Coverage Triage Agent", vendor: "Tallowood (in-house)", source: "In-house", useCase: "Home claims: first-notice coverage triage",
    connection: "HTTPS endpoint", connectionHealth: "Healthy", lastCall: "12 Nov 2026, 07:02 AEDT",
    modelFamily: "Family A", pinnedVersion: "model-a-2026-06-20", lastDecision: "Approved", lastScore: 91,
    nextTest: "Weekly health check · 18 Nov 2026", ruleCard: "Tallowood Home v3 + Endorsement 07", owner: "Claims Operations",
    versions: [{ label: "2.4.0", model: "Family A model", snapshot: "model-a-2026-06-20", status: "Live" }],
  },
  {
    id: "motor-settlement", name: "Motor Settlement Agent", vendor: "Tallowood (in-house)", source: "In-house", useCase: "Motor claims: settlement calculation",
    connection: "Tool harness (MCP)", connectionHealth: "Healthy", lastCall: "11 Nov 2026, 22:15 AEDT",
    modelFamily: "Family B", pinnedVersion: "model-b-2026-08-05", lastDecision: "Approved with conditions", lastScore: 84,
    nextTest: "Monthly refresh · 1 Dec 2026", ruleCard: "Tallowood Motor v2", owner: "Head of Motor Claims",
    versions: [{ label: "1.7.1", model: "Family B model", snapshot: "model-b-2026-08-05", status: "Live" }],
  },
  {
    id: "member-onboarding", name: "Member Onboarding Agent", vendor: "Tallowood (via agent platform)", source: "Platform", useCase: "New member onboarding checks",
    connection: "Agent platform · via implementation partner", connectionHealth: "Healthy", lastCall: "10 Nov 2026, 16:40 AEDT",
    modelFamily: "Family A", pinnedVersion: "model-a-2026-04-11", lastDecision: "Scheduled",
    nextTest: "Health check in 6 days · 18 Nov 2026", ruleCard: "Member onboarding procedures v1", owner: "Member Services",
    versions: [{ label: "0.9.0", model: "Family A model", snapshot: "model-a-2026-04-11", status: "Live" }],
  },
  {
    id: "sandbox", name: "Sandbox Claims Agent", vendor: "Verilo sandbox", source: "Sandbox", useCase: "Offline demo agent (runs in the browser)",
    connection: "Sandbox (local)", connectionHealth: "Healthy", lastCall: "Always available", modelFamily: "Family B", pinnedVersion: "sandbox-1.0.0",
    lastDecision: "Approved", lastScore: 95, nextTest: "On demand", ruleCard: "Tallowood Home v3 + Endorsement 07", owner: "Demo",
    versions: [{ label: "1.0.0", model: "Sandbox", snapshot: "sandbox-1.0.0", status: "Live" }], sandbox: true,
  },
];

export const upcomingChanges = [
  { date: "18 Nov 2026", title: "Weekly health check", agent: "Member Onboarding Agent", kind: "schedule" as const },
  { date: "1 Dec 2026", title: "Monthly refresh", agent: "Motor Settlement Agent", kind: "schedule" as const },
  { date: "16 Jan 2027", title: "Decision due: accept Model 5.0?", agent: "ClaimDesk Agent", kind: "deadline" as const },
  { date: "15 Feb 2027", title: "Model 4.1 retires", agent: "ClaimDesk Agent", kind: "forced" as const },
];
