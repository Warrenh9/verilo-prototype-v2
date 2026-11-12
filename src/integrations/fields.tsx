import { ReactNode } from "react";

export const inputCls = "mt-1 block h-9 w-full rounded-md border border-border-strong bg-bg px-2.5 text-[13px] text-text placeholder:text-text-4";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-[13px] font-medium text-text-2">
      {label}
      {children}
      {hint && <span className="mt-1 block text-[12px] font-normal text-text-3">{hint}</span>}
    </label>
  );
}

/** Every connection must declare the agent's model family and an exact pinned version. */
export function DeclareModel({ value, onChange }: { value: { family: string; version: string }; onChange: (v: { family: string; version: string }) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Model family" hint="Reviewer agents from the same family are excluded.">
        <select className={inputCls} value={value.family} onChange={(e) => onChange({ ...value, family: e.target.value })}>
          <option value="">Choose…</option>{["Family A", "Family B", "Family C"].map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Pinned model version" hint="Exact snapshot ID, e.g. model-a-2026-06-20.">
        <input className={inputCls + " font-mono"} value={value.version} placeholder="model-…" onChange={(e) => onChange({ ...value, version: e.target.value.trim() })} />
      </Field>
    </div>
  );
}
