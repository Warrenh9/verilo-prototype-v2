import { ReactNode, useMemo, useState, KeyboardEvent } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Copy } from "lucide-react";
import { cn } from "../../lib/cn";
import { EmptyState, SkeletonRows } from "./primitives";

/* ---------- DataTable ---------- */
export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
  nowrap?: boolean;
}
export interface FilterDef<T> { key: string; label: string; options: string[]; get: (row: T) => string }

export function DataTable<T>({
  columns, rows, rowKey, onRowClick, filters, pageSize = 10, loading, empty, initialSort, dense,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  filters?: FilterDef<T>[];
  pageSize?: number;
  loading?: boolean;
  empty?: ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  dense?: boolean;
}) {
  const [sort, setSort] = useState(initialSort);
  const [active, setActive] = useState<Record<string, string | undefined>>({});
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => (filters ?? []).every((f) => !active[f.key] || f.get(r) === active[f.key]));
    const col = sort && columns.find((c) => c.key === sort.key);
    if (col?.sortValue) {
      const sv = col.sortValue;
      out = [...out].sort((a, b) => {
        const x = sv(a), y = sv(b);
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return sort!.dir === "asc" ? c : -c;
      });
    }
    return out;
  }, [rows, filters, active, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, pages - 1);
  const visible = filtered.slice(p * pageSize, p * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : undefined) : { key, dir: "asc" }));

  return (
    <div>
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-5 py-3">
          {filters.map((f) => (
            <div key={f.key} className="flex flex-wrap items-center gap-1.5" role="group" aria-label={f.label}>
              <span className="mr-1 text-[12px] text-text-3">{f.label}</span>
              {["All", ...f.options].map((o) => {
                const on = (active[f.key] ?? "All") === o;
                return (
                  <button key={o} aria-pressed={on} onClick={() => { setActive((a) => ({ ...a, [f.key]: o === "All" ? undefined : o })); setPage(0); }}
                    className={cn("h-7 rounded-full border px-2.5 text-[12px]", on ? "border-ink bg-ink text-white" : "border-border-strong bg-bg text-text-2 hover:bg-bg-muted")}>
                    {o}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-bg-subtle">
            <tr className="border-b border-border">
              {columns.map((c) => {
                const s = sort?.key === c.key ? sort.dir : undefined;
                const Icon = s === "asc" ? ChevronUp : s === "desc" ? ChevronDown : ChevronsUpDown;
                return (
                  <th key={c.key} scope="col" style={{ width: c.width }} aria-sort={s === "asc" ? "ascending" : s === "desc" ? "descending" : undefined}
                    className={cn("h-10 px-4 font-medium text-text-3 whitespace-nowrap", c.align === "right" ? "text-right" : "text-left")}>
                    {c.sortValue ? (
                      <button onClick={() => toggleSort(c.key)} className={cn("inline-flex items-center gap-1 hover:text-text", c.align === "right" && "flex-row-reverse")}>
                        {c.header}<Icon className="size-3.5" aria-hidden />
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          {!loading && (
            <tbody>
              {visible.map((r) => (
                <tr key={rowKey(r)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  onKeyDown={onRowClick ? (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(r); } } : undefined}
                  className={cn("border-b border-border last:border-b-0", onRowClick && "cursor-pointer hover:bg-bg-muted focus-visible:bg-bg-muted")}>
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 text-text-2", c.nowrap && "whitespace-nowrap", dense ? "h-10" : "h-11", c.align === "right" && "text-right tnum")}>{c.render(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {loading && <SkeletonRows rows={5} />}
      {!loading && filtered.length === 0 && (empty ?? <EmptyState title="Nothing to show" body="No rows match the current filters." />)}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 h-11 text-[13px] text-text-3">
          <span className="tnum">{p * pageSize + 1}–{Math.min(filtered.length, (p + 1) * pageSize)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)} className="rounded-md border border-border-strong p-1 disabled:opacity-40 hover:bg-bg-muted"><ChevronLeft className="size-4" /></button>
            <button aria-label="Next page" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="rounded-md border border-border-strong p-1 disabled:opacity-40 hover:bg-bg-muted"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<K extends string>({ tabs, value, onChange, className }: { tabs: { key: K; label: ReactNode; count?: number }[]; value: K; onChange: (k: K) => void; className?: string }) {
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const next = tabs[(i + d + tabs.length) % tabs.length];
    onChange(next.key);
    (e.currentTarget.parentElement?.children[(i + d + tabs.length) % tabs.length] as HTMLElement)?.focus();
  };
  return (
    <div role="tablist" className={cn("flex gap-1 border-b border-border", className)}>
      {tabs.map((t, i) => {
        const on = t.key === value;
        return (
          <button key={t.key} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => onChange(t.key)} onKeyDown={(e) => onKey(e, i)}
            className={cn("-mb-px inline-flex h-10 items-center gap-2 border-b-2 px-3 text-[14px]", on ? "border-ink text-text font-medium" : "border-transparent text-text-3 hover:text-text")}>
            {t.label}
            {t.count !== undefined && <span className="rounded-full bg-bg-muted px-1.5 text-[12px] text-text-3 tnum">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Stepper (horizontal) ---------- */
export function Stepper({ steps, current, onSelect, maxReached }: { steps: string[]; current: number; onSelect?: (i: number) => void; maxReached?: number }) {
  const reach = maxReached ?? current;
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current, on = i === current, can = !!onSelect && i <= reach;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <button disabled={!can} onClick={() => onSelect?.(i)} aria-current={on ? "step" : undefined}
              className={cn("flex items-center gap-2 rounded-md px-1 py-1", can && "hover:bg-bg-muted", !can && "cursor-default")}>
              <span className={cn("flex size-7 items-center justify-center rounded-full border text-[13px] font-semibold tnum",
                done ? "border-ink bg-ink text-white" : on ? "border-ink bg-bg text-text ring-4 ring-brand/60" : "border-border-strong bg-bg text-text-3")}>
                {done ? <Check className="size-4" aria-label="Completed" /> : i + 1}
              </span>
              <span className={cn("text-[14px] whitespace-nowrap", on ? "font-semibold text-text" : done ? "text-text-2" : "text-text-3")}>{s}</span>
            </button>
            {i < steps.length - 1 && <span aria-hidden className={cn("h-px flex-1 min-w-6", done ? "bg-ink" : "bg-border-strong")} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Timeline ---------- */
export function Timeline({ items }: { items: { title: ReactNode; meta?: ReactNode; body?: ReactNode; icon?: ReactNode; tone?: "default" | "brand" | "warning" | "danger" }[] }) {
  return (
    <ol className="relative">
      {items.map((it, i) => (
        <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 && <span aria-hidden className="absolute left-[11px] top-6 h-[calc(100%-20px)] w-px bg-border" />}
          <span className={cn("relative z-[1] mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-bg",
            it.tone === "brand" ? "border-brand-border bg-brand-tint text-brand-ink" : it.tone === "warning" ? "border-[#FEDF89] bg-warning-bg text-warning" : it.tone === "danger" ? "border-[#FECDCA] bg-danger-bg text-danger" : "border-border-strong text-text-3")}>
            {it.icon ?? <span className="size-1.5 rounded-full bg-current" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <div className="text-[14px] font-medium text-text">{it.title}</div>
              {it.meta && <div className="text-[12px] text-text-3">{it.meta}</div>}
            </div>
            {it.body && <div className="mt-0.5 text-[13px] text-text-3">{it.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- CodeBlock ---------- */
export function CodeBlock({ code, tabs, caption, wrap }: { code?: string; tabs?: { label: string; code: string }[]; caption?: ReactNode; wrap?: boolean }) {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const text = tabs ? tabs[i].code : code ?? "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard may be blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg-subtle">
      <div className="flex items-center justify-between border-b border-border bg-bg px-3 h-10">
        <div className="flex items-center gap-1">
          {tabs ? tabs.map((t, j) => (
            <button key={t.label} onClick={() => setI(j)} aria-pressed={i === j}
              className={cn("h-7 rounded-md px-2.5 text-[12px] font-medium", i === j ? "bg-ink text-white" : "text-text-3 hover:bg-bg-muted")}>{t.label}</button>
          )) : <span className="text-[12px] text-text-3">{caption}</span>}
        </div>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 h-7 text-[12px] text-text-3 hover:bg-bg-muted" aria-label="Copy code">
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={cn("overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.6] text-text", wrap && "whitespace-pre-wrap")}><code>{text}</code></pre>
      {tabs && caption && <div className="border-t border-border px-3 py-2 text-[12px] text-text-3">{caption}</div>}
    </div>
  );
}
