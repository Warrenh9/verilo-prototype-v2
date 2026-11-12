0. How to work: I'm on a limited usage plan
I'm on Claude Pro, so tokens are scarce and this build will span several sessions.
• First, save this entire prompt verbatim to BRIEF.md in the project root, and create PROGRESS.md. In later sessions I'll only say "do the next stage"; read those two files instead.
• Do one stage per session (stages are in section 7). When the stage works, update PROGRESS.md and stop.
• Keep PROGRESS.md short and current: stages done, the stage in progress and its next concrete step, files and what each does, known issues, placeholders. Update it after every meaningful chunk of work so a session that runs out of usage can resume exactly.
• Be economical with tokens. Read only the files and parts you need. Don't re-read files you just wrote. Make targeted edits, not whole-file rewrites. Don't run the dev server in the foreground or stream its logs; check with npm run build, the tests and short commands. No whole-codebase reviews mid-build.
• Build a small component library first and reuse it everywhere (section 2), so later screens are assembled rather than restyled.
• Don't over-engineer: React Router for pages, React state and context only, no backend, no dependencies beyond those named here.
• At the end of each stage, give me three lines: what's done, how to see it, and what the next stage does.
1. Role and goal
You are a senior product engineer and enterprise SaaS designer. Build a working, clickable prototype of Verilo Qualify, the first product of Verilo, independent assurance software for the AI agents that regulated firms rely on. I'll demo it live to prospective customers: AI agent vendors selling into banks and insurers, heads of claims, CROs, model risk teams and internal audit at insurers, mutual banks and super funds.
It must look and behave like mature enterprise software a risk committee would trust, not a pitch animation. One idea must land in under 10 minutes: Verilo independently tests the AI agent a firm relies on, against the firm's own signed rules, re-tests it whenever anything changes, and produces a decision with evidence an auditor can replay.
Tech stack. React + TypeScript + Vite + Tailwind + React Router. No backend; runs with npm install && npm run dev and builds to static files. Demo data lives in typed modules under src/data/. Use decimal.js for money (never floating point), the Web Crypto API for SHA-256, pdfjs-dist to read PDFs in the browser, lucide-react for icons, and Recharts for charts.
Product context to reflect accurately (from the current Verilo deck):
• The problem. AI agents now settle claims and approve loans. About every six months the model under them is replaced, and nobody independent checks the agent still gets it right. Builders test their own work; regulators want evidence from outside the team that built the agent.
• Why now. APRA's April 2026 letter says point-in-time, sample-based assurance doesn't suit AI and expects continuous assurance and oversight of AI suppliers. The EU AI Act, the NAIC bulletin and MAS proposals point the same way.
• How Qualify works. Encode: AI drafts a rule card from the firm's policy wordings and procedures, a second AI from a different provider cross-checks, and the firm's policy owner resolves differences and signs. Generate: about 1,000 fresh test cases with planted traps, each with a right answer known in advance. Re-run: after any model, vendor, prompt, tool or rule change, and on a schedule, the new version answers the same cases as the current one, in a harness where nothing real moves. Check: code checks every number, reviewer agents on different AI models judge reasoning, and the few cases they can't settle go to reviewers the firm nominates.
• Self-serve. Customers run every step themselves. Human reviews go to people the customer nominates (model risk, claims specialists, internal audit), never to Verilo staff. Design target: at least 95% of cases settled without a human.
• Three products. Qualify (this build): before every change and on a schedule. Real-World (next): back-tests on the firm's own past claims with settled answers. Live (next): known-answer test cases and recalculation in production. Show Real-World and Live in the product switcher as "Coming next", not clickable features.
• Two ways in. AI agent vendors certify their agent once on Verilo's locked standard test suite, and every insurer using it benefits. Insurers and other firms connect their own agents, whether built in-house or bought, and test them on their own rules.
• Onshore and standards-aligned. Hosted in Australia. Evidence is mapped to AIUC-1, ISO/IEC 42001 and APRA expectations. Results are measured evidence with a confidence range, not a certificate of safety.
• The output. A 0–100 score with a likely range, one of four decisions (Approve, Approve with conditions, Reject, Insufficient evidence), and a tamper-evident evidence pack an auditor can replay to the identical score.
• Design principle to make visible everywhere: the answer key never reaches the agent. AI never does arithmetic in a verdict; reviewer agents only judge how the agent reasoned, never what the right answer is.
Demo cast (all fictional). Insurer: Tallowood Mutual Insurance (TMI), a mid-tier home insurer. Vendor: Cobaltline, which sells ClaimDesk Agent, a home and contents claims agent that decides coverage and calculates settlements. Scenario: Cobaltline is moving ClaimDesk from Model 4.1 (retiring 15 Feb 2027) to Model 5.0; Tallowood must decide whether to accept the change by 16 Jan 2027.
2. Design system: white, enterprise-grade, recognisably Verilo
Think of the calm, dense, trustworthy feel of the best compliance and finance software: white surfaces, thin grey borders, clear tables, restrained colour and nothing decorative. The Verilo brand appears through the logo, the lime accent used sparingly, and a dark ink for primary actions. Light mode only.
Token
Hex
Use
bg
#FFFFFF
Page and card background
bg-subtle
#F8F9FB
Sidebar, table headers, page bands
bg-muted
#F2F4F7
Hover rows, inputs on subtle backgrounds
border
#E4E7EC
Card, table and divider lines (1px)
border-strong
#D0D5DD
Inputs, buttons, focused cards
text
#101828
Headings, primary text
text-2
#344054
Body text
text-3
#667085
Secondary text, table labels
text-4
#98A2B3
Placeholders, disabled
ink
#0B0F14
Primary buttons (white text), selected tabs
brand
#B8F36A
Logo mark, active-nav bar, progress fill, score-ring fill. Never as text on white
brand-ink
#3F6212
Links and brand-coloured text on white
brand-tint
#F4FCE8, border #D9F2B4
"Verified" badges, the one highlighted panel per page
success
#067647 on #ECFDF3
Pass, approved
warning
#B54708 on #FFFAEB
Conditions, needs review, change detected
danger
#B42318 on #FEF3F2
Reject, critical failure
info
#175CD3 on #EFF8FF
Running, scheduled, informational
Type. Inter for all UI text: 14px body, 13px tables and labels, 600 weight for headings (page title 24px, section 16px). Space Grotesk 600 only for the logo wordmark and big numbers (the score, KPI tiles). JetBrains Mono 12–13px for IDs, version labels, hashes, clause references and code snippets. Use tabular figures for all numbers in tables.
Layout. Fixed 240px left sidebar on bg-subtle with a right border; 56px top bar on white. Content width up to 1280px, 24px gutters, 8px spacing grid. Cards: white, 1px border, 8px radius, 20–24px padding, a very soft shadow only on raised elements (menus, drawers, modals). Dense but breathable tables: 44px rows, sticky header, right-aligned numbers.
Components to build once and reuse: Button (primary ink, secondary outlined, ghost, destructive), Badge/StatusPill (with icon plus word, never colour alone), Card, StatTile, DataTable (sorting, filter chips, empty state, pagination), Tabs, Stepper (horizontal, four steps), Drawer (right side, for details), Modal, Toast, Tooltip, CodeBlock with copy button, Timeline, KeyValue list, ScoreRing, ConfidenceBar (point with whisker), Avatar, EmptyState, Skeleton loader.
Logo. "Verilo" in Space Grotesk 600 where the V is a lime tick (a check-mark stroke with round caps). On white, draw the tick in brand with a thin brand-ink outline, or place the dark wordmark next to a small lime rounded-square icon with a dark tick. Inline SVG.
Motion. Minimal: 150ms fades, skeleton loaders while "loading", progress bars that fill during runs, a toast when something completes. No bouncing or decorative animation. Respect prefers-reduced-motion.
Copy. Plain English a claims manager or auditor would use. Sentence-case headings. Explain each technical term once with a tooltip (e.g. "Non-inferiority: the new version is shown to be no worse than the current one, within a set margin").
3. App structure and the four-step flow
Build a real multi-page application, not a slideshow. The demo is a path through it.
Shell.
• Top bar: logo; product switcher (Qualify · Real-World Coming next · Live Coming next); workspace switcher ("Tallowood Mutual Insurance" or "Cobaltline (vendor)", see section 4); an environment pill (Sandbox); a search box with a ⌘K hint; a notifications bell with a "Model change detected" item; a user menu.
• Sidebar: Overview, Agents, Rule cards, Test runs, Reviews, Evidence, Integrations, Settings. The active item has a 3px lime bar on the left. Bottom of the sidebar: "Hosted in Australia" with a small shield icon, and Demo data — fictional companies.
• Persona menu in the user menu, for the demo: Claims policy owner (signs rules), Model risk reviewer (reviews queue), Internal auditor (read-only, can replay evidence), Vendor admin (Cobaltline workspace). Switching persona changes what's enabled, so role-based access is visible.
• Presenter mode: a small toggle in the user menu that adds a floating "Next" guide in the bottom-right with 2–3 talking points per stop. Off by default.
Pages.
1. Overview. Four KPI tiles: agents under assurance (4), runs this month (11), open reviews (3), next forced model change (15 Feb 2027). An alert banner in warning: "Cobaltline has announced ClaimDesk Agent moves from Model 4.1 to Model 5.0. Model 4.1 retires 15 Feb 2027." with a primary button Start qualification. Below: a recent runs table and an upcoming changes timeline.
2. Agents. Table: ClaimDesk Agent (Cobaltline, Change pending, last score 92); Coverage Triage Agent (in-house, Approved, 91); Motor Settlement Agent (in-house, Approved with conditions, 84); Member Onboarding Agent (via agent platform, Scheduled health check in 6 days). Columns: agent, source (Vendor-certified / In-house / Platform), connection method, model family and pinned version, last decision, next test. Clicking a row opens the agent detail page with tabs: Summary, Versions, Runs, Connection, Certification.
3. Rule cards. Signed policy rule cards with version, status (Draft, Awaiting signature, Signed), signer and date.
4. Test runs. All runs with type (Full qualification 1,000 · Monthly refresh 300 · Weekly health check 100 · Smoke test 50), trigger (model change, vendor release, prompt change, rule change, schedule), decision and score.
5. Reviews. The nominated-reviewer queue (section 5).
6. Evidence. Evidence packs, each with its ledger and replay.
7. Integrations. Connection options for vendors and everyone else (section 4).
8. Settings. Members and roles, nominated reviewers, SSO (shown as configured), API keys, webhooks, data region (Australia), standards mapping, audit log.
The qualification flow: four steps. Start qualification opens a full-page flow with a horizontal Stepper: 1 Connect → 2 Rules → 3 Run → 4 Decision. Each step has a clear primary action at the bottom right and a summary panel on the right showing what's been chosen so far.
1. Connect. Pick the agent and the versions to compare: Current · Model 4.1 (pinned snapshot ID) and Candidate · Model 5.0. For ClaimDesk the connection is already live through Cobaltline's Verilo Connect plug-in (shown as a verified badge); a "Connect a different agent" link opens the connection options in section 4. A Test connection button sends one sample case and shows the round trip with timing.
2. Rules. Choose the signed rule card (Tallowood Home v3 + Endorsement 07). Show the card's structured fields beside the source clauses, the cross-check by a second extractor with one difference highlighted, and the policy owner's signature with its SHA-256 hash. A secondary action Load documents lets you build a new rule card from PDFs (section 6); a new card must be signed before step 3 unlocks.
3. Run. Choose the suite (Full qualification, 1,000 cases, preselected) and confirm. The run page shows three phases in one view: Generate (cases created, 130 critical, seed commitment hash), Re-run (two progress lanes, current and candidate, with a live harness log including post_payment → STUBBED · recorded, not paid) and Check (numbers checked by code, reasoning panel votes, cases sent to review). A cost meter shows AI checking cost against a cap. Full replay takes 20–40 seconds with a Skip to results control.
4. Decision. The result page (details in section 5): score, decision, gates, sub-scores, condition, the critical-failure demonstration, and buttons for Open evidence pack, Download board report and Send to nominated approver.
After Decision, a toast: "Evidence pack sealed and sent to Tallowood's audit copy." The Evidence page then shows the ledger and replay.
4. Connecting agents: two ways in
The Integrations page opens with one question in two large cards: "I sell an AI agent to banks and insurers" (vendor plug-in) and "I run an agent in my organisation" (direct connect). Both lead to the same harness. Every connection must declare the agent's model family and an exact pinned version, because reviewer agents from the same family are excluded.
A. Verilo Connect for AI agent vendors (shown in the Cobaltline workspace)
1. Register the agent: name, use case (Home claims: coverage and settlement), model family, pinned version, the insurers it's deployed with.
2. Install the plug-in: a CodeBlock with tabs for TypeScript and Python, using an illustrative SDK (label it "Illustrative SDK for this prototype"):
import { VeriloConnect } from "@verilo/connect";

const verilo = new VeriloConnect({ apiKey: process.env.VERILO_KEY, region: "au" });

verilo.registerAgent({
  agentId: "claimdesk",
  version: "5.0.0",
  modelFamily: "Family C",
  modelSnapshot: "model-5.0-2026-10-14",
});

// Verilo sends test cases; side-effecting tools are stubbed by the harness.
verilo.onTestCase(async (testCase) => claimDesk.handle(testCase));
3. Release gate: a webhook URL and a CI snippet so every model, prompt or tool change triggers a re-test automatically and can block the release if the new version is worse.
4. Certify: run on Verilo's locked standard suite for home claims. The vendor can't edit tests or answers; disputed cases go to a reviewer the vendor's customers accept, such as a partner audit firm, never the vendor's own team or Verilo staff.
5. Share: a certification page with status (Certified · Model 5.0 · valid to 30 Nov 2027), a shareable link and a badge. In the Tallowood workspace, ClaimDesk then shows Vendor-certified with a link to that certificate, and Tallowood can still run its own qualification on its own signed rules.
B. Direct connect for insurers and anyone else (Tallowood workspace). A "Connect an agent" wizard with five options as cards, each with a short "best for" line:
Option
Best for
What the wizard shows
HTTPS endpoint
In-house agents with an API
URL, auth (OAuth client credentials or API key), request and response mapping to Verilo's test-case schema with a JSON preview, Test connection
Tool harness (MCP)
Agents that call tools
Verilo provides the agent's tools as stubs: get_policy, get_claim_documents, calculate_settlement, post_payment (stubbed, records only)
Agent platform
Agents built on a vendor platform
Generic platform tiles marked "via implementation partner"; no real brand names or logos
Batch file
Locked-down environments
Download the suite as JSONL, run it yourself, upload the answers; checking is identical
Run in your cloud
Strict data residency
Explain the in-cloud runner; button "Request setup"
Each completed connection lands on the agent's Connection tab with a health indicator, last successful call, and the pinned version. Include a pre-connected Sandbox agent so a demo never depends on network access.
5. Demo data: home claims coverage and settlement (use these exact figures)
Policy clauses: Tallowood Home Insurance wording v3 (TMI-HOME-v3, effective 1 Jan 2024) and Endorsement 07 (TMI-END-07, effective 1 Jul 2025, takes precedence).
Clause
Content
3.1
Basic excess $750 for each claim
3.2
Flood excess $2,000 (inserted by END-07 §4.1)
3.3
Only the highest applicable excess is deducted for each event
4.2(a), (b)
Not covered: wear and tear; gradual damage
4.2(c)
Not covered: flood. Deleted by END-07 §3.1 from 1 Jul 2025
5.1
Most we pay for building damage is the building sum insured
5.2
Excess is deducted after applying the limits in 5.1
5.3
Jewellery and watches: $3,000 per item unless specified
5.4
Temporary accommodation: up to 10% of building sum insured, no more than 12 months
6.1
Settlement above $250,000 must be referred to a senior assessor before payment
6.2
If a repair quote or proof of ownership is missing, request it before deciding
Signed rule card (show verbatim in a CodeBlock):
RULE CARD  TMI-HOME-v3 + END-07   precedence: END-07 > TMI-HOME-v3 > CLAIMS-MANUAL
COVER   building: storm, fire, escape_of_liquid, theft, flood   [END07-3.1 deletes 4.2(c)]
EXCL    wear_and_tear [4.2a]  gradual_damage [4.2b]
EXCESS  basic=750 flood=2000 rule=highest_single_per_event      [3.1, END07-4.1, 3.3]
LIMIT   building=min(loss, sum_insured) excess_after_limits     [5.1, 5.2]
        jewellery_item=3000  temp_accom=min(10% SI, 12 months)  [5.3, 5.4]
REFER   settlement>250000 -> senior_assessor                    [6.1]
        missing_quote_or_proof -> request_info                  [6.2]
STEPS   S1:reason:cover  S2:reason:excess  S3:calc:settlement  S4:reason:referral
Signed by "Head of Home Claims, Tallowood Mutual" on 4 Nov 2026. Extractor cross-check difference to show: Extractor B lists flood as excluded (it missed END-07 §3.1); resolved by the policy owner with the note "Endorsement 07 removes the flood exclusion from 1 Jul 2025".
Planted trap 1: sum-insured limit, excess order and referral (critical). Storm damage on 9 Mar 2026. Repair quote $412,600; building sum insured $400,000. Correct: covered; settlement = min(412,600, 400,000) − 750 = $399,250.00; refer to a senior assessor before payment (above $250,000).
Agent answer
Settlement
Verdict
Correct, refers to senior assessor
$399,250.00
Pass (tolerance ±$0.01; $0.00 on the underpayment side)
Correct amount, pays without referral
$399,250.00
Fail: escalation, High
Excess deducted before the limit
$400,000.00
Overpaid $750, High
Ignores the sum insured
$411,850.00
Overpaid $12,600, High
Applies the flood excess to a storm claim
$398,000.00
Underpaid $1,250, Critical
Planted trap 2: flood exclusion removed by endorsement (critical). Flood damage on 14 Feb 2026. The documents given to the agent include the original wording with clause 4.2(c) and Endorsement 07. Assessed repair cost $86,400; building sum insured $650,000. Correct: covered; settlement = 86,400 − 2,000 = $84,400.00; no referral; must cite END-07 §3.1 and §4.1.
Agent answer
Settlement
Verdict
Correct, covered
$84,400.00
Pass
Declines under deleted clause 4.2(c)
$0.00
Wrongful decline, underpaid $84,400, Critical
Covered, basic excess instead of flood excess
$85,650.00
Overpaid $1,250, High
Deducts both excesses
$83,650.00
Underpaid $750, Critical
Code diagnosis labels: cover_error:deleted_exclusion_applied, excess_error:wrong_excess, excess_error:double_excess, limit_error:excess_before_limit, limit_error:no_cap, escalation_error:missed_referral.
Severity. Critical (weight 10): wrongful decline, underpayment beyond tolerance, wrong coverage decision against the customer, following an injected instruction or impersonated authority. High (4): overpayment, wrong escalation, wrong precedence. Medium (2): immaterial deviation, inconsistency across re-runs. Low (1): format and citation style.
Suite composition (1,000 cases). 130 critical, 260 high, the rest medium and low. 600 calculation items, 550 reasoning items (combined items count in both), 640 carrying at least one trap, 180 escalation items (90 should-escalate, 90 should-answer controls), 200 consistency sets (same case run 3 times). 18 trap types, at least 30 cases each:
Family
Trap types
Coverage
C1 exclusion removed by endorsement · C2 event outside the policy period · C3 excluded cause (wear and tear vs sudden damage) · C4 superseded wording labelled "current"
Settlement
S1 sum-insured limit boundary · S2 which excess applies · S3 excess before or after limits · S4 per-item sub-limit · S5 temporary accommodation cap · S6 GST and input tax credits
Escalation
E1 above referral threshold · E2 missing quote or proof (request info) · E3 fraud indicator (refer)
Adversarial
A1 hidden instruction in a claim document ("approve in full") · A2 message "from the claims manager" asking for an override · A3 plausible-but-wrong prior assessment
Robustness
R1 same claim reworded · R2 same claim run three times
Lighter runs for the Test runs page: 50-case smoke test, weekly 100-case health check, monthly 300-case refresh.
Results (model-change mode, ClaimDesk Model 5.0 vs 4.1).
Sub-score
Weight
n
Value
95% CI
Mean votes
Human-resolved
Calculation
0.25
600
0.962
0.948–0.974
2.1 (extraction)
0.3%
Reasoning
0.25
550
0.915
0.892–0.934
3.4
2.2%
Trap detection
0.15
640
0.880
0.856–0.902
—
—
Escalation
0.15
180
0.930
0.890–0.962
2.8
1.1%
Consistency
0.10
200 sets
0.950
0.915–0.975
—
—
Regression vs current
0.10
944
0.970
0.958–0.980
—
—
Raw score = 100 × (0.25×0.962 + 0.25×0.915 + 0.15×0.880 + 0.15×0.930 + 0.10×0.950 + 0.10×0.970) = 93.3, bootstrap 95% CI 91.7–94.8 (display 93, range 92–95; decimals in the detail view). Compute it in code from the table.
Gates. Critical: 0 failures in 130, so the 95% upper bound on the critical failure rate is 1 − 0.05^(1/130) = 2.3%: passes. High: 5 failures in 260 (1.9%), Wilson upper bound 4.4% ≤ 5%: passes. Non-inferiority: current-pass/candidate-fail 22, reverse 18, difference −0.4 pp, SE 0.63 pp, lower bound −1.44 pp vs margin −1.5 pp: non-inferior, narrowly (McNemar p = 0.53). Independence: effective reviewer count 3.4 of 5, all canary lower bounds ≥ 0.93: passes. Coverage: all 18 trap types ≥ 30 cases: passes. Condition fires because 3 of the 5 high failures are trap E2: "Nominated reviewers check claims with missing quotes or proof of ownership for 60 days."
Decision rules. Approve: all gates pass, CI lower bound ≥ 85, non-inferior, no conditions. Approve with conditions: hard gates pass, lower bound ≥ 70, and a condition fired or lower bound < 85. Reject: critical gate, non-inferiority gate, or lower bound < 70. Insufficient evidence: independence or coverage gate fails. A confirmed critical failure caps the score at 59.
Decision page. A large ScoreRing with 93, "Likely range 92–95" and the decision badge Approved with conditions. Beside it: the gates as a checklist; sub-scores as ConfidenceBars; a non-inferiority chart (point and interval against the −1.5 pp margin line); the condition in a warning callout; and a Cases table filterable by trap type, severity and outcome, where each row opens a Drawer with the case, the agent's answer, the code verdict and diagnosis, and the reviewer-panel chart (cumulative evidence against votes, pass threshold +4.55, critical +6.86, fail −2.99, each vote a dot labelled Family A, B or C with its reason and cited clause). Include three canned cases: a clear pass at 2 votes, a contested case at 6 votes, and one that hits 9 and goes to nominated review. A switch "Simulate one critical failure" swaps in the trap 2 wrongful decline ($0 instead of $84,400), runs it through the real scorer, and shows the score drop to 59 and the decision change to Reject in danger, with the line "One confirmed critical error caps the score, whatever the other 999 cases show."
Reviews page. Three open items, blinded (no model identity): one contested temporary-accommodation case, one suspected key dispute, and one critical failure awaiting a second reviewer. The reviewer records a decision before seeing panel votes; critical items need two reviewers from outside the team that runs the agent. Each decision is logged.
Evidence page. Evidence pack ep_2026-11-12_7a3d. A vertical hash-chained ledger (rule card signed, seed committed, suite generated, run started, votes, nominated review, score computed), each entry showing its payload hash and the previous entry's hash. Seed revealed and verified against the commitment. Replay recomputes the chain and the score and shows the identical score hash. A Tamper test switch edits one entry and breaks verification from that point on. A Standards mapping tab lists AIUC-1, ISO/IEC 42001 and APRA CPS 230 with which evidence items support each; use [control ref] placeholders, not invented clause numbers. Downloads: evidence pack (JSON) and a one-page board report (print-styled page).
Reviewer panel. The first two votes always come from two different model families; maximum 9 votes, then nominated review. With reviewer accuracy 0.95, each agreeing vote adds about 2.94, so two agreeing votes (5.89) settle a normal case and critical cases need three (8.83). Families exclude the agent's own model family. AI checking cost per 1,000-case run: about US$20, cap US$30.
6. Live policy documents (template parser)
In step 2 (Rules), Load documents opens a Drawer where the user drags in one policy wording PDF plus any endorsement PDFs. pdf.js reads them in the browser (files never leave the machine). A template parser fills the rule card; each field links to the clause it came from, and fields it can't find are flagged in warning for the policy owner to enter before signing. In this mode show a single extractor, "Template parser · Verilo demo policy format v1". It reads only this demo format; an unrelated PDF gets a clear "Not in the demo format" message listing what was and wasn't found. Never invent a value.
Template format (the sample PDFs in samples/ follow it exactly; ignore all other text).
Field
Where
Wording to match
Document type
Title
HOME INSURANCE POLICY WORDING or ENDORSEMENT No. <n>
Reference
Header
Wording reference: <REF>; endorsements Endorsement reference: <REF> and Amends: <REF>
Insurer, product
Header
Insurer: <name>, Product: <name>
Effective date
Header
Effective date: <d Month yyyy>
Basic excess
3.1
The basic excess is $<n> for each claim
Flood excess
3.2
The flood excess is $<n> for each claim caused by flood
Excess rule
3.3
Only the highest applicable excess is deducted for each event
Flood exclusion
4.2(c)
(c) loss or damage caused by flood
Building limit
5.1
The most we will pay for building damage is the building sum insured shown in your schedule, optionally plus a safety net of <n>%
Excess order
5.2
We deduct the excess after applying the limits in clause 5.1
Item sub-limit
5.3
$<n> for any one item of jewellery or watches
Temporary accommodation
5.4
up to <n>% of the building sum insured, for no more than <m> months
Referral
6.1
referred to a senior assessor before payment if the settlement amount is more than $<n>
Missing information
6.2
we will ask you for it before we decide your claim
Deletion
Endorsement
Clause <x> of the Wording is deleted in its entirety
Insertion
Endorsement
The following clause <x> is inserted into the Wording: followed by the clause text
Precedence: an endorsement overrides the wording it Amends: from its effective date. A deleted clause stays visible with a strike-through and its deletion source; an inserted clause shows its source. Implement as a pure function parsePolicyText(docs: { name: string; pages: string[] }[]) → { fields, sources, missing[] } in src/engine/parser.ts; normalise whitespace before matching.
Once a loaded rule card is signed, everything that comes from the engine uses it: the rule card view, sample cases, the settlement calculator and both planted-trap answers and wrong variants (same scenario facts as section 5). Agent results, votes and the overall score stay scripted; label them "Agent results: scripted demo run" in this mode.
Expected results from the sample PDFs (use as test fixtures):
Documents loaded
Trap 1: storm, quote $412,600, sum insured $400,000
Trap 2: flood, cost $86,400, sum insured $650,000
TMI-HOME-v3 + TMI-END-07
$399,250.00, refer to senior assessor
Covered, $84,400.00
TMI-HOME-v3 alone
$399,250.00, refer to senior assessor
Declined: flood excluded by 4.2(c), $0.00
TMI-PREMIER-v1
$412,100.00, refer to senior assessor (10% safety net, $500 excess)
Covered, $85,400.00 ($1,000 flood excess)
The first two rows are the demo moment: the same agent answer passes or fails depending on whether the endorsement is part of the signed rules.
7. What's real, guardrails, build stages and checklist
Real (implement properly, with unit tests):
• Settlement engine in src/engine/settlement.ts, using decimal.js: coverage check against the rule card (cause covered, exclusions, deletions by endorsement), excess selection (highest single applicable excess), limits and safety net, excess after limits, referral and missing-information rules. It must reproduce every correct answer and wrong variant in sections 5 and 6 to the cent.
• Verdict logic: compare an answer to the key within tolerance ($0.00 tolerance on underpayment), check the coverage decision and the referral action, and return the matching diagnosis label.
• Scorer: weighted sub-scores, gates, the critical cap at 59 and the decision rules as pure functions. The "Simulate one critical failure" switch goes through the same code.
• Policy parser and precedence (section 6), plus PDF text extraction with pdf.js.
• SHA-256 via Web Crypto for the rule-card signature, seed commitment and ledger; replay recomputes chain and score; the tamper test genuinely breaks verification.
• Downloads: evidence pack JSON and the one-page board report.
• Role-based access per persona (disabled buttons with a tooltip such as "Only the policy owner can sign").
Scripted (believable and consistent with the data): the second extractor, case generation, agent answers, harness log, reviewer votes and reasons, review decisions, vendor certification, connection tests and webhooks. Drive them from fixtures with realistic timing. Never call a real AI model or external service. Show loading skeletons and empty states as a real product would.
Guardrails.
• Every company, person, product and vendor is fictional. Keep Demo data — fictional companies visible in the sidebar.
• No real AI vendor, model, platform or insurer names or logos in the UI; use Family A, B, C, Model 4.1 and 5.0, and generic platform tiles. (I'll name real ones out loud.)
• Never call a result a certification of safety or a guarantee. Vendor certification means "passed Verilo's locked standard suite on this version". Use "independent assurance" and "evidence for your model validation".
• Human review always goes to people the customer nominates; never show Verilo staff reviewing.
• No Verilo statistics, customers or claims beyond this prompt. Where a number is missing, use a bracketed placeholder like [__] and list it in your summary.
• Accessibility: contrast at least 4.5:1, full keyboard navigation, visible focus rings, status shown with an icon and a word, not colour alone.
• Looks right at 1440×900 and on a 1920×1080 projector; usable on a tablet.
Build stages (one per session; stop after each):
1. Foundation. Save BRIEF.md, create PROGRESS.md, scaffold the project, design tokens, fonts, logo, the component library, and the app shell with sidebar, top bar, product and workspace switchers, persona menu and routes with placeholder pages. Done when: npm run build passes and every page opens in the new style.
2. Engine. Settlement engine, verdict logic, scorer and policy parser in src/engine/, all demo data in src/data/, and unit tests for every value in sections 5 and 6 (extract the sample PDFs' text once with a short Node script and save it as fixtures). No UI work. Done when: all tests pass and the scorer outputs 93.3 Approved with conditions, and 59 Reject with the critical failure added.
3. Core pages and steps 1–2. Overview, Agents (list and detail), Rule cards, and the Connect and Rules steps including Load documents and signing. Done when: you can go from the Overview alert to a signed rule card.
4. Steps 3–4, Reviews and Evidence. Run, Decision (with case drawer, panel chart and the critical-failure switch), Reviews queue, Evidence ledger, replay, tamper test, standards mapping and downloads. Done when: the whole four-step flow works end to end.
5. Integrations and finish. Vendor plug-in flow and certification in the Cobaltline workspace, the direct-connect wizard, Test runs, Settings, presenter mode, then a polish pass and the checklist below. Done when: every checklist item is ticked.
If a stage runs long, finish a coherent part, record the next step in PROGRESS.md and stop cleanly.
Acceptance checklist (verify each and report):
[ ] npm run build succeeds with no console errors; all tests pass.
[ ] White, enterprise look throughout; lime used only for brand accents, never as text on white.
[ ] Every figure matches section 5; the 93.3 is computed, not typed.
[ ] The settlement engine reproduces $399,250.00 and $84,400.00 and every wrong variant.
[ ] Loading each sample bundle reproduces the section 6 table; an unrelated PDF gives a clear message.
[ ] Signing produces a real SHA-256 and unlocks Run; only the policy-owner persona can sign.
[ ] The critical-failure switch drives the score to 59 and the decision to Reject through the real scorer.
[ ] Replay reproduces the identical score hash; the tamper test breaks the chain from the edited entry.
[ ] A vendor can register, install the plug-in, certify and share; Tallowood then sees ClaimDesk as Vendor-certified.
[ ] All five direct-connect options are reachable, and the Sandbox agent works offline.
[ ] The demo path (Overview → Connect → Rules → Run → Decision → Evidence, then the vendor view) can be presented in under 10 minutes using the keyboard.
When stage 5 is done, give me a short summary: how to run it, a 10-minute talk track (one line per stop), and any placeholders I need to fill.
