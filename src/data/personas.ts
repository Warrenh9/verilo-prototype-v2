export type WorkspaceId = "tallowood" | "cobaltline";
export type PersonaId = "policyOwner" | "modelRisk" | "auditor" | "vendorAdmin";

export interface Persona {
  id: PersonaId;
  role: string;
  name: string; // fictional
  title: string;
  workspace: WorkspaceId;
  blurb: string;
  can: { sign: boolean; review: boolean; runQualification: boolean; replay: boolean; manageIntegrations: boolean; editSettings: boolean };
}

export const workspaces: Record<WorkspaceId, { id: WorkspaceId; name: string; short: string; kind: string }> = {
  tallowood: { id: "tallowood", name: "Tallowood Mutual Insurance", short: "TMI", kind: "Insurer" },
  cobaltline: { id: "cobaltline", name: "Cobaltline (vendor)", short: "CL", kind: "AI agent vendor" },
};

export const personas: Record<PersonaId, Persona> = {
  policyOwner: {
    id: "policyOwner", role: "Claims policy owner", name: "Dana Whitfield", title: "Head of Home Claims, Tallowood Mutual",
    workspace: "tallowood", blurb: "Signs rule cards",
    can: { sign: true, review: false, runQualification: true, replay: true, manageIntegrations: true, editSettings: true },
  },
  modelRisk: {
    id: "modelRisk", role: "Model risk reviewer", name: "Marcus Oyelaran", title: "Model Risk Manager, Tallowood Mutual",
    workspace: "tallowood", blurb: "Works the review queue",
    can: { sign: false, review: true, runQualification: true, replay: true, manageIntegrations: false, editSettings: false },
  },
  auditor: {
    id: "auditor", role: "Internal auditor", name: "Helen Kwok", title: "Senior Internal Auditor, Tallowood Mutual",
    workspace: "tallowood", blurb: "Read-only, can replay evidence",
    can: { sign: false, review: false, runQualification: false, replay: true, manageIntegrations: false, editSettings: false },
  },
  vendorAdmin: {
    id: "vendorAdmin", role: "Vendor admin", name: "Sam Petrakis", title: "Platform Lead, Cobaltline",
    workspace: "cobaltline", blurb: "Cobaltline workspace",
    can: { sign: false, review: false, runQualification: true, replay: true, manageIntegrations: true, editSettings: true },
  },
};
