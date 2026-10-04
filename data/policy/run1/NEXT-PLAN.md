# Next phase: completeness and cross-regional depth (before staff)

Written 2026-10-04 after the presence audit. Requested scope: fill gaps in the student layer, add more documents per institution, and add other countries.

## What the student layer holds now

- 128 registered documents, one general student-facing document per institution. By region: England 84, Scotland 14, Ireland 15, Wales 7, Northern Ireland 3, plus 4 reading-set documents from other countries.
- 25 documents are under 500 words (mostly library or skills landing pages), so some "absences" are only thin pages.
- 44 documents are not archived (bot walls, scripts, robots): listed in `FOR-USER-FETCH.md`. Big names among them: UCL, Oxford, Leeds, Imperial, QMUL, LSE, Cardiff, Nottingham.
- Full 78-variable coding exists for 47 documents (tier 1). Tier 2 has guidance points (6 to 15 per document), statement types, and the whole-document audit, but not the 78 variables.
- The statement vocabulary (74 types) is not exhaustive. Of 1,263 classified points, 63 fit no type and 171 fit partly. Reading the 219 suggested labels gives about 16 recurring statements with no type yet (see below).
- Each institution is one document. Misconduct regulations, assessment regulations, library guides and module templates are mostly absent, so cross-regional comparison is confounded by document type.

## Candidate new statement types (from unclassified and partial points)

1. Use library databases and read sources yourself rather than rely on AI (about 7 points)
2. Do not put your own work or drafts into AI tools; you own the copyright in your work (about 5)
3. Agentic AI or AI agents banned or restricted; do not share credentials with agents (about 4)
4. Definitions of contract cheating, essay mills, false authorship (about 4)
5. Sanction tariff detail: repeat and concurrent offences, warning letters, factors in setting penalties (about 6)
6. How detection reports are interpreted; detectors restricted to officers; data-protection concerns about detectors (about 4)
7. Using AI or paraphrasing tools to disguise AI use (about 3)
8. Default rule when the assessment brief is silent (about 4)
9. Placement provider, client confidentiality and client data (about 3)
10. Governance: risk assessment, human in the loop, explainability, business owner (about 5)
11. Worked examples or formats for citing AI (about 5)
12. AI literacy or skills built into the curriculum (about 5)
13. Prompting-technique advice (about 2)
14. Harmful uses named: deepfakes, harassment, therapy or health advice (about 3)
15. Referral to digital-forensic or specialist investigation; investigation proceeds if the student is absent (about 3)
16. Pointer to separate guidance for doctoral researchers or publisher policies (about 3)

These are candidates from labels the classifier suggested. They become types only after a definition, a decision rule and a held-out check.

## Workstreams and rough token cost

Budget left is about 14.9M tokens. Costs use per-document figures from this run (discovery 18k per institution; points, statement types and audit about 100k per document; full 78-variable coding 55k per document).

| Stream | Work | Rough cost |
|---|---|---|
| A. Fill gaps | vocabulary v2 (about 16 new types), targeted audit of those types over all documents | 1.5M to 2M |
| A. Fill gaps | full 78-variable coding of 68 tier-2 documents | 3.7M |
| A. Fill gaps | the 44 missing documents: you fetch them locally; then points, types and audit | 0 for fetching, about 4M to process |
| B. More documents per institution | start with the thin regions: NI (3), Wales (7), Scotland (14), Ireland (15). Second document each: misconduct or assessment regulations, library guide. Discovery plus processing | about 4.5M for about 39 institutions |
| C. More countries | new frame and discovery, a pilot of about 3 jurisdictions with 10 institutions each | about 3M for the pilot; about 7M for 60 institutions |

Everything in full is over budget and would leave nothing for staff. Recommended order: A vocabulary first (cheap, changes every later count), then B for the thin regions, then a small C pilot. A's 78-variable coding and the 44 fetches come after the user chooses.
