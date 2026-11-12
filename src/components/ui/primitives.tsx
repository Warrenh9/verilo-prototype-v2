import { ButtonHTMLAttributes, ReactNode, forwardRef, useId, useState } from "react";
import { BadgeCheck, CircleCheck, CircleDashed, CircleX, Info, Inbox, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  /** Shown as a tooltip when disabled, e.g. "Only the policy owner can sign". */
  disabledReason?: string;
}
const variantCls: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-[#1d2430] border border-ink",
  secondary: "bg-bg text-text border border-border-strong hover:bg-bg-muted",
  ghost: "bg-transparent text-text-2 border border-transparent hover:bg-bg-muted",
  destructive: "bg-danger text-white border border-danger hover:bg-[#912018]",
};
const sizeCls: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-[14px] gap-2",
  lg: "h-10 px-4 text-[14px] gap-2",
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon: Icon, iconRight: IconRight, loading, disabled, disabledReason, className, children, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  const btn = (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-150",
        variantCls[variant],
        sizeCls[size],
        isDisabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
      {IconRight && <IconRight className="size-4" aria-hidden />}
    </button>
  );
  if (disabled && disabledReason) return <Tooltip content={disabledReason}><span tabIndex={0} className="inline-flex rounded-md">{btn}</span></Tooltip>;
  return btn;
});

/* ---------- Badge / StatusPill ---------- */
export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";
const toneCls: Record<Tone, string> = {
  success: "bg-success-bg text-success border-[#ABEFC6]",
  warning: "bg-warning-bg text-warning border-[#FEDF89]",
  danger: "bg-danger-bg text-danger border-[#FECDCA]",
  info: "bg-info-bg text-info border-[#B2DDFF]",
  neutral: "bg-bg-muted text-text-2 border-border",
  brand: "bg-brand-tint text-brand-ink border-brand-border",
};
const toneIcon: Record<Tone, LucideIcon> = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleX,
  info: Info,
  neutral: CircleDashed,
  brand: BadgeCheck,
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 h-[22px] text-[12px] font-medium whitespace-nowrap", toneCls[tone], className)}>
      {children}
    </span>
  );
}
/** Status always has an icon plus a word – never colour alone. */
export function StatusPill({ tone = "neutral", icon, spin, children, className }: { tone?: Tone; icon?: LucideIcon; spin?: boolean; children: ReactNode; className?: string }) {
  const Icon = icon ?? (spin ? LoaderCircle : toneIcon[tone]);
  return (
    <Badge tone={tone} className={className}>
      <Icon className={cn("size-3.5", spin && "animate-spin")} aria-hidden />
      {children}
    </Badge>
  );
}

/* ---------- Card ---------- */
export function Card({ title, actions, children, className, padded = true, highlight }: { title?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; padded?: boolean; highlight?: boolean }) {
  return (
    <section className={cn("rounded-lg border", highlight ? "bg-brand-tint border-brand-border" : "bg-bg border-border", className)}>
      {(title || actions) && (
        <header className={cn("flex items-center justify-between gap-3 border-b px-5 h-[52px]", highlight ? "border-brand-border" : "border-border")}>
          <h2 className="text-[16px]">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

/* ---------- StatTile ---------- */
export function StatTile({ label, value, hint, icon: Icon, tone }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; tone?: Tone }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-5">
      <div className="flex items-center justify-between text-[13px] text-text-3">
        <span>{label}</span>
        {Icon && <Icon className="size-4 text-text-3" aria-hidden />}
      </div>
      <div className="mt-2 font-display text-[30px] leading-9 font-semibold text-text tnum">{value}</div>
      {hint && <div className="mt-1 text-[13px]">{tone ? <StatusPill tone={tone}>{hint}</StatusPill> : <span className="text-text-3">{hint}</span>}</div>}
    </div>
  );
}

/* ---------- Tooltip ---------- */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "anim-fade pointer-events-none absolute left-1/2 z-50 w-max max-w-[280px] -translate-x-1/2 rounded-md bg-ink px-2.5 py-1.5 text-[12px] leading-snug font-normal text-white shadow-raised",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
/** A term with a dotted underline that explains itself on hover/focus. */
export function Term({ children, explain }: { children: ReactNode; explain: ReactNode }) {
  return (
    <Tooltip content={explain}>
      <span tabIndex={0} className="cursor-help underline decoration-dotted decoration-text-4 underline-offset-4">{children}</span>
    </Tooltip>
  );
}

/* ---------- KeyValue ---------- */
export function KeyValue({ items, cols = 1 }: { items: { k: ReactNode; v: ReactNode; mono?: boolean }[]; cols?: 1 | 2 }) {
  return (
    <dl className={cn("grid gap-x-6", cols === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0 text-[13px]">
          <dt className="text-text-3 shrink-0">{it.k}</dt>
          <dd className={cn("text-text text-right min-w-0 break-words", it.mono && "font-mono text-[12px]")}>{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-bg-muted border border-border text-text-2 font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon: Icon = Inbox, title, body, action }: { icon?: LucideIcon; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <span className="mb-3 inline-flex size-10 items-center justify-center rounded-lg border border-border bg-bg-subtle">
        <Icon className="size-5 text-text-3" aria-hidden />
      </span>
      <div className="text-[14px] font-semibold text-text">{title}</div>
      {body && <p className="mt-1 max-w-sm text-[13px] text-text-3">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton block rounded-md h-4", className)} />;
}
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={i % 2 ? "w-4/5" : "w-full"} />)}
    </div>
  );
}

/* ---------- Callout ---------- */
export function Callout({ tone = "info", title, children, action }: { tone?: Tone; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const Icon = toneIcon[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", toneCls[tone])} role={tone === "danger" || tone === "warning" ? "alert" : "status"}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-[14px]">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className="text-text-2">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/* ---------- Mono / ProgressBar / Switch ---------- */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] text-text-2", className)}>{children}</span>;
}
export function ProgressBar({ value, max = 100, label, tone = "brand" }: { value: number; max?: number; label?: string; tone?: "brand" | "info" | "warning" | "danger" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = { brand: "bg-brand", info: "bg-info", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-bg-muted border border-border">
      <div className={cn("h-full transition-[width] duration-150", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-[13px] text-text-2 select-none", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 rounded-full border transition-colors duration-150", checked ? "bg-ink border-ink" : "bg-bg-muted border-border-strong")}
      >
        <span className={cn("absolute left-0 top-0.5 size-3.5 rounded-full bg-white shadow transition-transform duration-150", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </button>
      {label}
    </label>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[13px] text-text-3">{eyebrow}</div>}
        <h1 className="text-[24px] leading-8">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-text-3">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
