import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Building2, Check, ChevronDown, LayoutGrid, LogOut, Presentation, Search, TriangleAlert } from "lucide-react";
import { Logo, Popover, MenuItem, MenuLabel, MenuDivider, Avatar, Badge, Switch } from "../ui";
import { useApp } from "../../context/AppContext";
import { personas, workspaces, type PersonaId, type WorkspaceId } from "../../data/personas";
import { navItems } from "./Sidebar";

function useMenu() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) };
}

const triggerCls = "inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2 text-[13px] text-text-2 hover:bg-bg-muted hover:border-border";

export function TopBar() {
  const { persona, setPersona, workspace, setWorkspace, presenter, setPresenter } = useApp();
  const nav = useNavigate();
  const product = useMenu(), ws = useMenu(), bell = useMenu(), user = useMenu();
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = q ? navItems.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-bg px-4">
      <Link to="/" className="mr-3 flex w-[208px] items-center rounded-md" aria-label="Verilo home"><Logo /></Link>

      {/* Product switcher */}
      <div className="relative">
        <button className={triggerCls} onClick={product.toggle} aria-haspopup="menu" aria-expanded={product.open}>
          <LayoutGrid className="size-4 text-text-3" aria-hidden /><span className="font-medium text-text">Qualify</span><ChevronDown className="size-3.5 text-text-3" aria-hidden />
        </button>
        <Popover open={product.open} onClose={product.close}>
          <MenuLabel>Products</MenuLabel>
          <MenuItem active onClick={product.close} hint={<Check className="size-4" />}>
            <div>Qualify</div><div className="text-[12px] font-normal text-text-3">Before every change and on a schedule</div>
          </MenuItem>
          <MenuItem disabled hint={<Badge>Coming next</Badge>}>
            <div>Real-World</div><div className="text-[12px] text-text-3">Back-tests on your past claims</div>
          </MenuItem>
          <MenuItem disabled hint={<Badge>Coming next</Badge>}>
            <div>Live</div><div className="text-[12px] text-text-3">Known-answer cases in production</div>
          </MenuItem>
        </Popover>
      </div>

      <span className="h-5 w-px bg-border" aria-hidden />

      {/* Workspace switcher */}
      <div className="relative">
        <button className={triggerCls} onClick={ws.toggle} aria-haspopup="menu" aria-expanded={ws.open}>
          <Building2 className="size-4 text-text-3" aria-hidden /><span className="text-text">{workspace.name}</span><ChevronDown className="size-3.5 text-text-3" aria-hidden />
        </button>
        <Popover open={ws.open} onClose={ws.close} className="min-w-[280px]">
          <MenuLabel>Workspaces</MenuLabel>
          {(Object.keys(workspaces) as WorkspaceId[]).map((id) => (
            <MenuItem key={id} active={workspace.id === id} onClick={() => { setWorkspace(id); ws.close(); nav("/"); }}
              hint={workspace.id === id ? <Check className="size-4" /> : undefined}>
              <div>{workspaces[id].name}</div><div className="text-[12px] font-normal text-text-3">{workspaces[id].kind}</div>
            </MenuItem>
          ))}
        </Popover>
      </div>

      <Badge tone="info" className="ml-1">Sandbox</Badge>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-[300px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-3" aria-hidden />
        <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); e.currentTarget.blur(); } if (e.key === "Enter" && results[0]) { nav(results[0].to); setQ(""); } }}
          placeholder="Search agents, runs, evidence" aria-label="Search"
          className="h-8 w-full rounded-md border border-border-strong bg-bg pl-8 pr-12 text-[13px] text-text placeholder:text-text-4" />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-bg-subtle px-1.5 font-mono text-[11px] text-text-3">⌘K</kbd>
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-bg py-1 shadow-raised" role="listbox">
            {results.map((r) => (
              <button key={r.to} onClick={() => { nav(r.to); setQ(""); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-bg-muted">
                <r.icon className="size-4 text-text-3" aria-hidden />{r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button onClick={bell.toggle} aria-label="Notifications, 1 unread" aria-haspopup="menu" aria-expanded={bell.open} className="relative rounded-md p-2 text-text-2 hover:bg-bg-muted">
          <Bell className="size-[18px]" aria-hidden />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning ring-2 ring-bg" />
        </button>
        <Popover open={bell.open} onClose={bell.close} align="right" className="w-[360px]">
          <MenuLabel>Notifications</MenuLabel>
          <MenuItem onClick={() => { bell.close(); nav("/qualify/connect"); }}>
            <div className="flex gap-2.5">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <div>
                <div className="font-medium text-text">Model change detected</div>
                <div className="text-[12px] text-text-3">ClaimDesk Agent moves from Model 4.1 to Model 5.0. Model 4.1 retires 15 Feb 2027.</div>
              </div>
            </div>
          </MenuItem>
        </Popover>
      </div>

      {/* User / persona menu */}
      <div className="relative">
        <button onClick={user.toggle} aria-haspopup="menu" aria-expanded={user.open} className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-bg-muted">
          <Avatar name={persona.name} />
          <span className="text-left leading-tight">
            <span className="block text-[13px] font-medium text-text">{persona.name}</span>
            <span className="block text-[12px] text-text-3">{persona.role}</span>
          </span>
          <ChevronDown className="size-3.5 text-text-3" aria-hidden />
        </button>
        <Popover open={user.open} onClose={user.close} align="right" className="w-[300px]">
          <MenuLabel>Demo persona</MenuLabel>
          {(Object.keys(personas) as PersonaId[]).map((id) => (
            <MenuItem key={id} active={persona.id === id} onClick={() => { setPersona(id); user.close(); }}
              hint={persona.id === id ? <Check className="size-4" /> : undefined}>
              <div>{personas[id].role}</div>
              <div className="text-[12px] font-normal text-text-3">{personas[id].blurb}</div>
            </MenuItem>
          ))}
          <MenuDivider />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="inline-flex items-center gap-2 text-[13px] text-text-2"><Presentation className="size-4 text-text-3" aria-hidden />Presenter mode</span>
            <Switch checked={presenter} onChange={setPresenter} label={<span className="sr-only">Presenter mode</span>} />
          </div>
          <MenuDivider />
          <MenuItem disabled hint={<LogOut className="size-4" />}>Sign out</MenuItem>
        </Popover>
      </div>
    </header>
  );
}
