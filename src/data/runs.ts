export type RunType = "Full qualification" | "Monthly refresh" | "Weekly health check" | "Smoke test";
export type Trigger = "Model change" | "Vendor release" | "Prompt change" | "Rule change" | "Schedule";
export const RUN_CASES: Record<RunType, number> = { "Full qualification": 1000, "Monthly refresh": 300, "Weekly health check": 100, "Smoke test": 50 };

export interface Run {
  id: string;
  agent: string;
  type: RunType;
  trigger: Trigger;
  started: string; // display date
  iso: string;
  status: "Complete" | "Running" | "Scheduled";
  decision?: "Approved" | "Approved with conditions" | "Rejected" | "Insufficient evidence";
  score?: number;
  versions: string;
}

/** 11 runs in November 2026 (runs this month), plus earlier history. Scripted. */
export const runs: Run[] = [
  { id: "run_2026-11-11_mo02", agent: "Member Onboarding Agent", type: "Smoke test", trigger: "Prompt change", started: "11 Nov 2026", iso: "2026-11-11", status: "Complete", decision: "Approved", score: 94, versions: "0.9.0" },
  { id: "run_2026-11-11_ct07", agent: "Coverage Triage Agent", type: "Weekly health check", trigger: "Schedule", started: "11 Nov 2026", iso: "2026-11-11", status: "Complete", decision: "Approved", score: 91, versions: "2.4.0" },
  { id: "run_2026-11-10_ms04", agent: "Motor Settlement Agent", type: "Weekly health check", trigger: "Schedule", started: "10 Nov 2026", iso: "2026-11-10", status: "Complete", decision: "Approved with conditions", score: 85, versions: "1.7.1" },
  { id: "run_2026-11-07_cd41", agent: "ClaimDesk Agent", type: "Weekly health check", trigger: "Schedule", started: "7 Nov 2026", iso: "2026-11-07", status: "Complete", decision: "Approved", score: 92, versions: "4.1.3" },
  { id: "run_2026-11-05_ct06", agent: "Coverage Triage Agent", type: "Full qualification", trigger: "Rule change", started: "5 Nov 2026", iso: "2026-11-05", status: "Complete", decision: "Approved", score: 91, versions: "2.4.0" },
  { id: "run_2026-11-05_cd40", agent: "ClaimDesk Agent", type: "Smoke test", trigger: "Rule change", started: "5 Nov 2026", iso: "2026-11-05", status: "Complete", decision: "Approved", score: 93, versions: "4.1.3" },
  { id: "run_2026-11-04_ct05", agent: "Coverage Triage Agent", type: "Weekly health check", trigger: "Schedule", started: "4 Nov 2026", iso: "2026-11-04", status: "Complete", decision: "Approved", score: 90, versions: "2.4.0" },
  { id: "run_2026-11-03_ms03", agent: "Motor Settlement Agent", type: "Weekly health check", trigger: "Schedule", started: "3 Nov 2026", iso: "2026-11-03", status: "Complete", decision: "Approved with conditions", score: 84, versions: "1.7.1" },
  { id: "run_2026-11-03_mo01", agent: "Member Onboarding Agent", type: "Weekly health check", trigger: "Schedule", started: "3 Nov 2026", iso: "2026-11-03", status: "Complete", decision: "Approved", score: 93, versions: "0.9.0" },
  { id: "run_2026-11-01_cd39", agent: "ClaimDesk Agent", type: "Monthly refresh", trigger: "Schedule", started: "1 Nov 2026", iso: "2026-11-01", status: "Complete", decision: "Approved", score: 92, versions: "4.1.3" },
  { id: "run_2026-11-01_ms02", agent: "Motor Settlement Agent", type: "Monthly refresh", trigger: "Schedule", started: "1 Nov 2026", iso: "2026-11-01", status: "Complete", decision: "Approved with conditions", score: 84, versions: "1.7.1" },
  { id: "run_2026-10-14_cd38", agent: "ClaimDesk Agent", type: "Smoke test", trigger: "Vendor release", started: "14 Oct 2026", iso: "2026-10-14", status: "Complete", decision: "Approved", score: 93, versions: "4.1.3" },
  { id: "run_2026-10-01_cd37", agent: "ClaimDesk Agent", type: "Monthly refresh", trigger: "Schedule", started: "1 Oct 2026", iso: "2026-10-01", status: "Complete", decision: "Approved", score: 91, versions: "4.1.3" },
  { id: "run_2026-09-22_ms01", agent: "Motor Settlement Agent", type: "Full qualification", trigger: "Model change", started: "22 Sep 2026", iso: "2026-09-22", status: "Complete", decision: "Approved with conditions", score: 84, versions: "1.6.0 → 1.7.1" },
];

/** The qualification run created by the demo flow. */
export const qualificationRun: Run = {
  id: "run_2026-11-12_cd50", agent: "ClaimDesk Agent", type: "Full qualification", trigger: "Model change", started: "12 Nov 2026", iso: "2026-11-12",
  status: "Complete", decision: "Approved with conditions", score: 93, versions: "4.1.3 → 5.0.0",
};
