import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { personas, workspaces, type Persona, type PersonaId, type WorkspaceId } from "../data/personas";
import { agents as baseAgents, type Agent } from "../data/agents";

interface AppState {
  persona: Persona;
  setPersona: (id: PersonaId) => void;
  workspace: (typeof workspaces)[WorkspaceId];
  setWorkspace: (id: WorkspaceId) => void;
  presenter: boolean;
  /** Set when Cobaltline completes certification of ClaimDesk Model 5.0 in the vendor flow. */
  certifiedV5: boolean;
  setCertifiedV5: (v: boolean) => void;
  /** All agents: demo data plus any connected through the direct-connect wizard. */
  agents: Agent[];
  addAgent: (a: Agent) => void;
  setPresenter: (v: boolean) => void;
}
const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<PersonaId>("policyOwner");
  const [presenter, setPresenter] = useState(false);
  const [certifiedV5, setCertifiedV5] = useState(false);
  const [extra, setExtra] = useState<Agent[]>([]);
  const value = useMemo<AppState>(() => {
    const persona = personas[personaId];
    return {
      persona,
      setPersona: setPersonaId,
      workspace: workspaces[persona.workspace],
      // Workspace and persona move together: Cobaltline is the vendor admin's view.
      setWorkspace: (id) => setPersonaId(id === "cobaltline" ? "vendorAdmin" : personaId === "vendorAdmin" ? "policyOwner" : personaId),
      presenter,
      certifiedV5,
      setCertifiedV5,
      agents: [...baseAgents, ...extra],
      addAgent: (a) => setExtra((xs) => [...xs.filter((x) => x.id !== a.id), a]),
      setPresenter,
    };
  }, [personaId, presenter, certifiedV5, extra]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}
