import { NavLink } from "react-router-dom";
import { Bot, FileCheck2, FlaskConical, LayoutDashboard, Plug, ScrollText, Settings, ShieldCheck, UserCheck, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/rule-cards", label: "Rule cards", icon: ScrollText },
  { to: "/runs", label: "Test runs", icon: FlaskConical },
  { to: "/reviews", label: "Reviews", icon: UserCheck },
  { to: "/evidence", label: "Evidence", icon: FileCheck2 },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <nav aria-label="Main" className="fixed left-0 top-14 bottom-0 flex w-[240px] flex-col border-r border-border bg-bg-subtle">
      <ul className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === "/"}
              className={({ isActive }) => cn(
                "relative flex h-9 items-center gap-2.5 rounded-md px-3 text-[14px]",
                isActive ? "bg-bg font-medium text-text border border-border" : "text-text-2 border border-transparent hover:bg-bg-muted hover:text-text",
              )}>
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                  <Icon className={cn("size-4", isActive ? "text-text" : "text-text-3")} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-5 py-4 text-[12px] text-text-3 space-y-1.5">
        <div className="flex items-center gap-2 text-text-2"><ShieldCheck className="size-4 text-brand-ink" aria-hidden />Hosted in Australia</div>
        <div>Demo data — fictional companies</div>
      </div>
    </nav>
  );
}
