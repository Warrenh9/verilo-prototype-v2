import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button, Logo } from "../components/ui";
import { buildEvidencePack, type EvidencePack } from "../lib/evidencePack";
import { claimDeskRun, runMeta } from "../data/results";
import { decisionWord } from "../flow/DecisionStep";
import { zeroFailureUpperBound } from "../engine/scorer";

/** One-page, print-styled board report. Use the browser's print dialog to save as PDF. */
export function BoardReport() {
  const nav = useNavigate();
  const [pack, setPack] = useState<EvidencePack | null>(null);
  useEffect(() => { buildEvidencePack().then(setPack); }, []);
  const r = pack?.result;

  return (
    <div className="min-h-screen bg-bg-muted py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[794px] justify-between">
        <Button icon={ArrowLeft} onClick={() => nav(-1)}>Back</Button>
        <Button variant="primary" icon={Printer} onClick={() => window.print()}>Print or save as PDF</Button>
      </div>
      <article className="mx-auto max-w-[794px] bg-white p-12 text-[12px] leading-relaxed shadow-raised print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-ink pb-4">
          <div>
            <Logo size={22} />
            <h1 className="mt-3 text-[20px]">AI agent change: board report</h1>
            <div className="text-text-3">Tallowood Mutual Insurance · prepared {new Date("2026-11-12").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
          <div className="text-right">
            <div className="text-text-3">Independent assurance</div>
            <div className="font-mono text-[11px]">{runMeta.evidencePack}</div>
          </div>
        </header>

        {!r ? <p className="py-8">Preparing…</p> : (
          <>
            <section className="grid grid-cols-[150px_1fr] gap-6 border-b border-border py-5">
              <div className="text-center">
                <div className="font-display text-[56px] font-semibold leading-none text-text">{r.score}</div>
                <div className="text-text-3">Likely range {r.displayRange[0]}–{r.displayRange[1]}</div>
              </div>
              <div>
                <div className="text-[16px] font-semibold text-text">Decision: {decisionWord[r.decision]}</div>
                <p className="mt-1">ClaimDesk Agent (Cobaltline) moving from Model 4.1 to Model 5.0. Model 4.1 retires 15 Feb 2027; decision due 16 Jan 2027.
                  Tested on 1,000 fresh cases against Tallowood's signed rule card ({runMeta.ruleCard}), current and candidate side by side, with no real payments.</p>
                {r.conditions.map((c) => <p key={c} className="mt-2 border-l-4 border-warning pl-3 text-text"><b>Condition:</b> {c}</p>)}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-8 border-b border-border py-5">
              <div>
                <h2 className="mb-2 text-[13px]">Gates</h2>
                <table className="w-full"><tbody>
                  {r.gates.map((g) => <tr key={g.key} className="border-t border-border"><td className="py-1.5 pr-2">{g.label}</td><td className="py-1.5 text-right font-semibold">{g.pass ? "✓ Pass" : "✗ Fail"}</td></tr>)}
                </tbody></table>
              </div>
              <div>
                <h2 className="mb-2 text-[13px]">Sub-scores (95% interval)</h2>
                <table className="w-full tnum"><tbody>
                  {claimDeskRun.subScores.map((s) => <tr key={s.key} className="border-t border-border"><td className="py-1.5 pr-2">{s.label} <span className="text-text-3">×{s.weight}</span></td><td className="py-1.5 text-right font-mono text-[11px]">{s.value} ({s.ciLow}–{s.ciHigh})</td></tr>)}
                </tbody></table>
              </div>
            </section>

            <section className="border-b border-border py-5">
              <h2 className="mb-2 text-[13px]">What this means</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>No critical failures in 130 critical cases; 95% upper bound on the critical failure rate {(zeroFailureUpperBound(claimDeskRun.critical.n) * 100).toFixed(1)}%.</li>
                <li>Model 5.0 is no worse than Model 4.1 within a −1.5 percentage-point margin (lower bound {r.nonInferiority.lowerPp.toFixed(2)} pp) — narrowly.</li>
                <li>Weakest area: claims with a missing quote or proof of ownership (3 of 5 high-severity failures), hence the 60-day condition.</li>
                <li>98.4% of cases were settled without a human; the rest went to reviewers Tallowood nominated.</li>
              </ul>
            </section>

            <footer className="pt-4 text-[11px] text-text-3">
              <p>Score hash <span className="font-mono">{pack!.scoreHash}</span>. Replaying evidence pack {pack!.id} reproduces this score exactly.</p>
              <p className="mt-1">Results are measured evidence with a confidence range for model validation, not a certificate of safety or a guarantee. Hosted in Australia. Demo data — fictional companies.</p>
            </footer>
          </>
        )}
      </article>
    </div>
  );
}
