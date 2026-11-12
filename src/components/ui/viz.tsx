import { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Large score ring: lime fill on a grey track, number in Space Grotesk. */
export function ScoreRing({ score, size = 168, label, tone = "brand" }: { score: number; size?: number; label?: ReactNode; tone?: "brand" | "danger" }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`Score ${Math.round(score)} out of 100`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2F4F7" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone === "danger" ? "#B42318" : "#B8F36A"} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} className="transition-[stroke-dasharray] duration-150" />
        <circle cx={size / 2} cy={size / 2} r={r + stroke / 2} fill="none" stroke="#E4E7EC" strokeWidth={1} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-[52px] leading-none font-semibold text-text tnum">{Math.round(score)}</span>
        {label && <span className="mt-1 text-[12px] text-text-3">{label}</span>}
      </div>
    </div>
  );
}

/** Point estimate with a whisker for its 95% interval on a 0–1 (or custom) axis. */
export function ConfidenceBar({ label, value, low, high, min = 0.8, max = 1, format = (v: number) => v.toFixed(3), weight }: {
  label: ReactNode; value: number; low: number; high: number; min?: number; max?: number; format?: (v: number) => string; weight?: string;
}) {
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <div className="grid grid-cols-[minmax(140px,1fr)_2fr_auto] items-center gap-4 py-2">
      <div className="text-[13px] text-text-2">
        {label}{weight && <span className="ml-1.5 text-text-3 tnum">{weight}</span>}
      </div>
      <div className="relative h-6" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand" style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})` }} />
        <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-text-3" style={{ left: pos(low) }} />
        <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-text-3" style={{ left: pos(high) }} />
        <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-bg" style={{ left: pos(value) }} />
      </div>
      <div className={cn("text-right font-mono text-[12px] text-text-2 tnum whitespace-nowrap")}>
        {format(value)} <span className="text-text-3">({format(low)}–{format(high)})</span>
      </div>
    </div>
  );
}
