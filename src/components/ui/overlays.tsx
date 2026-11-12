import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { StatusPill, type Tone } from "./primitives";

/** Shared behaviour: Esc closes, focus moves in on open, Tab is trapped, focus restores on close. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    (focusables()[0] ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);
  return ref;
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div className="anim-fade absolute inset-0 bg-ink/20" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} tabIndex={-1}
        className="anim-slide absolute right-0 top-0 flex h-full max-w-full flex-col border-l border-border bg-bg shadow-raised" style={{ width }}>
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px]">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[13px] text-text-3">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-text-3 hover:bg-bg-muted"><X className="size-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, children, footer, width = 480 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="anim-fade absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} tabIndex={-1}
        className="anim-fade relative w-full rounded-lg border border-border bg-bg shadow-raised" style={{ maxWidth: width }}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[16px]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-text-3 hover:bg-bg-muted"><X className="size-5" /></button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Toast ---------- */
interface ToastItem { id: number; tone: Tone; title: string; body?: string }
const ToastCtx = createContext<(t: Omit<ToastItem, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { ...t, id }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="anim-fade flex min-w-[340px] items-start gap-3 rounded-lg border border-border bg-bg px-4 py-3 shadow-raised">
            <StatusPill tone={t.tone}>{t.tone === "success" ? "Done" : t.tone === "danger" ? "Error" : "Note"}</StatusPill>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-text">{t.title}</div>
              {t.body && <div className="text-[13px] text-text-3">{t.body}</div>}
            </div>
            <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} aria-label="Dismiss" className={cn("rounded p-0.5 text-text-3 hover:bg-bg-muted")}><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Menu (popover) ---------- */
export function Popover({ open, onClose, children, align = "left", className }: { open: boolean; onClose: () => void; children: ReactNode; align?: "left" | "right"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} role="menu" className={cn("anim-fade absolute top-full z-30 mt-1.5 min-w-[240px] rounded-lg border border-border bg-bg py-1.5 shadow-raised", align === "right" ? "right-0" : "left-0", className)}>
      {children}
    </div>
  );
}
export function MenuItem({ children, onClick, disabled, active, hint }: { children: ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean; hint?: ReactNode }) {
  return (
    <button role="menuitem" disabled={disabled} onClick={onClick}
      className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-text-2", disabled ? "cursor-not-allowed text-text-4" : "hover:bg-bg-muted focus-visible:bg-bg-muted", active && "font-medium text-text")}>
      <span className="flex-1">{children}</span>
      {hint}
    </button>
  );
}
export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-3 pb-1 pt-2 text-[12px] font-medium text-text-3">{children}</div>;
}
export const MenuDivider = () => <div className="my-1.5 border-t border-border" />;
