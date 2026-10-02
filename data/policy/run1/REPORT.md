# Student layer, tier 1 (60 institutions): run report, 2026-10-02

Frame and sampling: `../FRAME-REVIEW.md`, `draw.js`, `sample.json` (seeded, stratified; tier 2 holds the other 110 in random order).
Codebook v0.4.0 throughout. Branch `claude/intelligent-rubin-6lsqps`. Nothing merged, no PR, catalog app untouched, nothing deployed.

## Coverage of the 60

| Outcome | n |
|---|---|
| Document archived and coded | 47 |
| Found but not archived (blocked, JS shell or robots.txt; listed in `FOR-USER-FETCH.md`) | 12 |
| Searched, nothing found | 3 (Stranmillis, St Mary's Belfast, SRUC) |
| Archived but deferred (Ravensbourne: whole 85,000-word regulations PDF) | 1 |

Coded: 3,666 rows, 47 documents (England 20, Scotland 9, Wales 7, Northern Ireland 2, Ireland 9; counted from `documents.json` and `institutions.json`).
Validator: 0 errors, 20 warnings (recorded misfits, 30 cells). `npm run policy:test`: 46 pass.

## What the documents are (read before any analysis)

The coders' own THIN/UNSUITABLE flags put about 28 of the 47 outside "institution-wide student guidance on generative AI": hub or pointer pages
(Liverpool, QUB, Cardiff Met, Stirling, Cranfield, Ulster, TCD, ATU, TUS, South Wales, West Scotland, Surrey, Lincoln), library guides, whole
misconduct policies or procedures with AI in a clause (Kingston, MTU, ICR, Wrexham), staff or governance documents (Aston, UCC, Cambridge, TU Dublin,
Aberystwyth), and thin pages. Most of their variables are `not_stated`. Those flags are the coders' judgement and are not coded as a variable.
`instrument_force` and `issued_by_type` must be controlled for, and a "suitable only" analysis would rest on about 19 institutions.
Hub pages cannot be registered with an empty domain list, so they carry the baseline `assessed_work`; their assessment variables read
`not_stated` where `not_applicable` would be more accurate.

## Double-coding (5 documents, seeded random draw over all coded documents, `double-sample.json`)

Southampton, UCC, Essex, Heriot-Watt, ICR. Second coder saw only the snapshot and the codebook. Same model as the first coder.

| Measure | Value |
|---|---|
| Kind of answer, all 390 cells | 91% |
| Kind of answer, excluding 8 staff/teaching/PGR variables | 98% (350 cells) |
| Exact value where both gave a value | 87% (84 cells), mean Jaccard 90% |
| Per document, exact | 81% to 93% |

- The 91% to 98% gap is a registration artifact: the first coders registered `teaching_practice` (Southampton, UCC, Heriot-Watt) or staff audiences, the
  second coders worked from the baseline. Domain registration is itself unreliable: for UCC and Heriot-Watt both coders wanted `teaching_practice`, for
  Southampton only the first did. The 8 variables were chosen after seeing the by-variable table, which is post hoc.
- Weakest variables where both coded (small n): `default_when_silent` 25% (n=4), `misconduct_framed_as` 20% (n=5), `precedence` 50% (n=2),
  `disclosure_contents` 50% (n=2), `permission_set_by` 75%, `ethical_concerns_named` 75%.
- 84 compared cells over 5 mostly thin documents is a small base. The figure is optimistic (one model) and supports no prevalence claim.
  Human double-coding of a sample is still required.

## Cost (subagent tokens as reported by each agent)

| Step | Total | Per unit |
|---|---|---|
| Discovery, 40 institutions (+58k for TU Dublin redo) | 600k | 15k |
| Primary coding, 46 documents (+181k wasted on the wrong TU Dublin document) | 3,111k | 67.6k |
| Second coding, 5 documents | 526k | 105k |
| Total | about 4.5M | |

Extrapolating to the remaining 110 institutions (about 105 with documents): discovery about 1.7M, coding about 7M, 5 to 6 more doubles about 0.6M, so about 9M.

## Problems found and fixed this run

- Frame: duplicate rows and 119 records missing from the ROR crawl (see FRAME-REVIEW.md).
- Doc-id generator produced leading dashes and a Birmingham collision. Fixed in `draw.js`; discovery outputs remapped.
- `fetch.js` saved Word documents as raw bytes (Bangor). It now extracts `.docx` text and refuses to save other binaries (new test).
- TU Dublin: the first-pass URL was UNESCO's global guidance hosted on tudublin.ie. Withdrawn, rediscovered (a `.docx` of TU Dublin's own guidelines). Its first coding is kept in `excluded/`.
- Discovery agents confirmed documents through a summarising fetch tool that misreads PDFs. Only the archive step is a real check.
- Three proposed dates were dropped as ambiguous (`registration-overrides.json`). Other dates rest on printed labels and are quote-checked.
- One coder briefly ran another coder's script from a shared scratch folder (no cross-document effect). Later agents were told to use private temp folders.

## Codebook wishlist for a v0.5.0 (collected from 52 coder reports; not applied, so no rows are invalidated)

- `precedence`: priority set by a named officer; students told to follow staff guidance.
- `referencing_requirement`: defers to a parent guidance document; optional acknowledgement form; "distinct from referencing".
- `misconduct_framed_as`: fabrication or falsification; contract cheating.
- `instrument_force`: library guide; competency or proficiency framework; framework of institutional commitments; hub page that embeds one rule.
- `issued_by_type`: international body; named officers or working group; library-authored guide.
- `external_frameworks_adopted`: academic-integrity bodies (ICAI, UK Charter, NAIN, OECD).
- `use_*` and `institutional_posture`: "discouraged, not prohibited"; "may breach, check with tutor"; "uses described but not ruled on".
- `default_when_silent`: "generally permitted but the brief may restrict"; "brief decides, no default stated".
- Audience value for taught-only students (ug and pgt without pgr). A `level` value for international or sector documents.
- A "domain not covered" state, or allowing an empty `domains`, for hub pages.
- A way to flag a generic misconduct policy with an AI clause as a document kind.

## Not done

Staff and PGR layer; tier 2 (110 institutions); OfS register check of the England frame; human double-coding; the page.
