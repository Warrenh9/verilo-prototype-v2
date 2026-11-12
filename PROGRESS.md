# Progress

## Stages
- [x] 1 Foundation — done
- [x] 2 Engine — done (51 tests; 93.3 Approve with conditions; 59 Reject with trap-2 wrongful decline)
- [x] 3 Core pages + steps 1–2 — done (Overview alert → Connect → Rules → signed card verified in headless browser, no console errors)
- [x] 4 Steps 3–4, Reviews, Evidence — done (full flow verified in headless browser: run → 93 Approved with conditions; switch → 59 Rejected; replay identical hash; tamper breaks entries 5–7; JSON download; reviews blinded + logged)
- [x] 5 Integrations + finish — done. ALL STAGES COMPLETE.

## Acceptance checklist (verified 12 Nov 2026, headless Chromium + vitest)
- [x] Build passes, no console errors on any route; 51 tests pass
- [x] White enterprise look; lime never used as text (grep `text-brand` = 0); low-contrast text-4 only on placeholders/disabled
- [x] Figures match §5; 93.3 computed by `weightedScore`
- [x] Engine reproduces $399,250.00, $84,400.00 and every wrong variant (tests)
- [x] Sample bundles reproduce §6 table; unrelated PDF → "Not in the demo format"
- [x] Signing → real SHA-256, unlocks Run; only policy owner can sign
- [x] Critical switch → 59 / Rejected via judgeAnswer + scorer
- [x] Replay → identical score hash; tamper breaks entries 5–7
- [x] Vendor registers → installs → gates → certifies → shares; Tallowood sees Model 5.0 Vendor-certified
- [x] All five direct-connect options reachable; Sandbox agent offline (no network calls; fonts bundled)
- [x] Demo path keyboard-drivable: presenter guide N/P keys step through 8 stops
- No horizontal overflow at 1024×768 or 1920×1080

## Possible follow-ups (not required)
- App state is in memory: a browser reload resets signing, run, certification. Reload only at the start of a demo.
- ⌘K search matches page names only.

## Stack / conventions
- Vite 5, React 18, TS, Tailwind v4 (tokens in `src/index.css` `@theme`: bg, bg-subtle, bg-muted, border, border-strong, text, text-2..4, ink, brand, brand-ink, brand-tint, brand-border, success/warning/danger/info + `-bg`). Fonts via @fontsource (offline). `font-display`, `font-mono`, `tnum` utility.
- HashRouter. Routes in `src/App.tsx`. `/ui` = component gallery. `/qualify/:step` (connect|rules|run|decision) uses FlowLayout.
- Extra deps beyond brief: @fontsource fonts, vitest, @types/node.
- `npm test` = vitest (config in vite.config.ts, `src/**/*.test.ts`). Money = decimal strings.

## Files
- `src/components/ui/` — library (import from `components/ui`): primitives (Button w/ disabledReason, Badge, StatusPill, Card, StatTile, Tooltip, Term, KeyValue, Avatar, EmptyState, Skeleton(Rows), Callout, Mono, ProgressBar, Switch, PageHeader), overlays (Drawer, Modal, ToastProvider/useToast, Popover, MenuItem/Label/Divider), data (DataTable, Tabs, Stepper, Timeline, CodeBlock), viz (ScoreRing, ConfidenceBar), Logo
- `src/components/shell/` — TopBar, Sidebar (navItems), Layout (AppLayout, FlowLayout), PresenterGuide (stub)
- `src/context/AppContext.tsx` — persona/workspace/presenter; `persona.can.*`
- `src/pages/` — `index.tsx` (exports; placeholders remain for Test runs, Integrations, Settings), `Overview.tsx`, `Agents.tsx`, `AgentDetail.tsx` (tabs), `RuleCards.tsx` (table + drawer), `ComponentGallery.tsx` (/ui)
- `src/components/domain.tsx` — decisionTone, DecisionPill, SourceChip, ConnectionTest (scripted round trip), HealthDot
- `src/context/QualifyContext.tsx` — flow state: agentId, connectionTested, cards (SignedCard: card, text, origin demo|loaded, status, signer, signedAt, hash, extractor, clauses, enteredFields), selectedCard, addCard, signCard (SHA-256 via hashObject), maxStep
- `src/flow/` — QualifyFlow (stepper, summary aside, gated Continue; run/decision redirect to rules if card unsigned), ConnectStep (+ flowVersions), RulesStep (fields beside clauses, cross-check, engine preview of traps, rule card text, signature/sign), LoadDocumentsDrawer (drop/choose/sample PDFs from `public/samples`, parse, missing-field inputs, Not-in-demo-format message, Create rule card)
- `src/engine/ruleCardText.ts` — renderRuleCard for loaded cards
- `src/flow/RunStep.tsx` — suite picker, 30 s replay (Generate / Re-run lanes / Check), harness log, cost meter, Skip to results; sets `q.runState`
- `src/flow/DecisionStep.tsx` — ScoreRing, gates, ConfidenceBars, NI chart, condition, cases table + drawer w/ PanelChart, critical-failure switch (judgeAnswer → withConfirmedFailure → scoreRun), evidence/report/send buttons, sealed toast; exports `decisionWord`
- `src/flow/decisionCases.ts` — `buildCaseRows(card, simulate)`: 12 sample cases, verdicts computed by engine against selected card
- `src/components/charts.tsx` — PanelChart (Recharts), NonInferiorityChart
- `src/pages/Reviews.tsx` — blinded queue, decide-before-votes, 2 reviewers for critical, decision log; `persona.can.review`
- `src/pages/Evidence.tsx` — ledger (verifyLedger), tamper switch (entry 5), replay (chain + seed + score hash), standards tab, JSON download
- `src/pages/BoardReport.tsx` — `/report`, print-styled one-pager (outside layouts)
- `src/lib/evidencePack.ts` — buildEvidencePack, replayScoreHash, downloadJson
- `src/engine/`
  - `types.ts` RuleCard, Claim, Settlement, Mistakes, Severity, Diagnosis
  - `settlement.ts` `settleClaim(card, claim, mistakes?)`, `tempAccommodationCap`, `jewelleryPayable`, `money`
  - `verdict.ts` `judgeAnswer(card, claim, answer)` → pass/severity/diagnosis/summary/key
  - `scorer.ts` `scoreRun(RunInput)` → rawScore, score, displayRange, gates, conditions, decision; `withConfirmedFailure`; stats helpers
  - `panel.ts` `runPanel(votes, critical)`, `validatePanel`, `PANEL` thresholds
  - `parser.ts` `parsePolicyText(docs)` → {inDemoFormat, documents, fields, sources, changes, missing, found, warnings}; `ruleCardFromParse(parse, overrides?)` (overrides = values the policy owner enters for missing fields)
  - `hash.ts` `sha256Hex`, `canonicalJson`, `hashObject`, `commitSeed/verifySeed`, `buildLedger`, `verifyLedger`
  - `engine.test.ts`; `__fixtures__/pdf-text.json` (pdf.js text of samples)
- `src/lib/pdfText.ts` — browser `readPdfText(file)` (pdf.js worker via `?url`)
- `src/data/` — `policy.ts` (clauses, RULE_CARD_TEXT verbatim, demoRuleCard, signature, crossCheck, ruleCards list), `traps.ts` (trap1/2 + variants via mistakes, bundleExpectations), `suite.ts` (18 trap types w/ counts, composition, suites), `results.ts` (claimDeskRun RunInput, runMeta), `agents.ts` (5 agents incl. sandbox, upcomingChanges), `runs.ts` (14 runs, 11 in Nov; qualificationRun), `cases.ts` (3 canned panel cases), `reviews.ts` (queue + nominated reviewers), `evidence.ts` (ledger items fn, standards mapping)
- `samples/` — TMI-HOME-v3.pdf, TMI-END-07.pdf, TMI-PREMIER-v1.pdf, unrelated-facilities-report.pdf. Regenerate: `node scripts/make-samples.mjs && node scripts/extract-fixtures.mjs`

## Assumptions made (not in brief)
- Severity split of the 1,000: medium 410, low 200. Per-trap case counts (30–44) invented within the ≥30 rule.
- Independence gate thresholds: effective reviewers ≥ 3.0, canary lower bounds ≥ 0.90. High gate limit 5%.
- Condition rule: fires when one trap type is ≥ 50% of high failures.
- NI uses n = 1,000 pairs (gives SE 0.63 pp as in brief); McNemar without continuity correction (p = 0.53).
- Premier sample: jewellery $5,000, temp accommodation 18 months (not in brief; don't affect the §6 table).
- Model 4.1 snapshot id `model-4.1-2026-03-02`; fictional person names for personas/reviewers.

## Known issues
- ClaimDesk Certification tab shows Model 4.1 cert + "Model 5.0 certification pending"; stage 5 vendor flow should flip it (add a flag to AppContext).
- `public/samples/` is a copy of `samples/` (sample buttons in the drawer fetch it).
- Search only matches nav pages.

## Placeholders
- Standards mapping uses `[control ref]` (by design).

## Stage 5 files
- `src/integrations/` — VendorFlow (5 steps, CertBadge), DirectConnect (5 options, saves agent via `addAgent` → agent Connection tab), fields (Field, DeclareModel)
- `src/pages/Integrations.tsx`, `Certificate.tsx` (`/certificate`), `TestRuns.tsx`, `Settings.tsx` (8 tabs, read-only unless `can.editSettings`)
- `src/components/shell/PresenterGuide.tsx` — STOPS (8), Next/Back, N/P keys, switches workspace per stop
- AppContext: `certifiedV5`, `agents` (base + connected), `addAgent`

## Placeholders to fill
- `[control ref]` — standards mapping control references (AIUC-1, ISO/IEC 42001, APRA CPS 230)
- `[Partner audit firm]` — vendor-dispute reviewer
- `[__]` — vendor standard-suite certification score; data retention years (Settings → Data region)
- Invented fictional values: 2,731 reviewer votes; 16 cases to nominated review (98.4% settled without a human); US$19.84 cost; run/seed/snapshot IDs; per-trap case counts; medium 410 / low 200; Premier jewellery $5,000 and 18 months; persona/reviewer names; insurers Kestrel Bay Insurance, Harbourline Mutual; gate thresholds (independence ≥ 3.0 / canary ≥ 0.90, condition ≥ 50% of high failures)
