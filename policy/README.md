# AI policy atlas: method and status

A comparison of university, sector and government AI guidance across regions, audiences and
time. Standalone page in this site, in the style of the language atlas, linked from the nav
once there is data to show.

**Status: vocabulary v0.2.0 derived, pilot coding not yet done.** 76 variables, derived from reading
61 documents (see below). Provisional until the pilot has been coded and its misfits read.

## The rule

Every analytical value is typed and closed. Prose lives only in `evidence_quote`, `page_ref`
and `misfit_note`, and nothing reads those programmatically. This exists because the
language atlas was filled with prose first and had to be coded afterwards (its
`research/ABSENCE-VS-CODING.md` and `NOTHING-HERE-VALUES.md` record what that cost).

## Tables (`data/policy/`)

| File | One row is |
|---|---|
| `institutions.json` | an institution or jurisdiction |
| `documents.json` | one dated snapshot of one document (`url_id` ties snapshots together) |
| `codes.json` | one variable coded for one document, with its evidence |
| `snapshots/<doc_id>.txt` | archived text of the document, so quotes can be verified |

## States, not just values

| State | Meaning |
|---|---|
| `none_exists` | the document says there is no such thing (quote required) |
| `not_stated` | read, and it doesn't answer |
| `not_applicable` | doesn't apply to this audience, or a gate variable rules it out |
| `value: null` + `misfit_note` | it answers, but no listed value fits. Never forced to the nearest value |

## What `validate.js` enforces

- off-list, wrongly typed or prose values are errors
- any substantive value needs an `evidence_quote`; `none_exists` and misfits too
- if a snapshot exists, the quote must occur in it
- numbers need `unit`, `counted` and `basis` (the atlas's series rows lacked these)
- a variable with `applies_to` that excludes the audience must be `not_applicable`
- gates: if the gate variable's value is in `if_in`, the dependent must be `not_applicable`
  (this is what would have caught the atlas's 15 "no newcomer category" contradictions)
- documents: closed enums, ISO dates, `retrieved` required
- the codebook is self-checked: every value has a gloss, every variable declares its grain
- per-variable gap report: coded / none_exists / not_stated / not_applicable / misfit / uncoded

```
npm run policy:validate
npm run policy:test
```

Ordinals stay ordinal and are never averaged (the atlas rule: nothing is scored).

## How the vocabulary was derived

Not proposed: read first. Six readers retrieved 61 documents from 14 countries (universities,
regulators, funders and governments; students, PGR and staff audiences) with no scheme in mind,
archiving the text to `data/policy/snapshots/` and noting what each document tells its reader to
do, what it is silent on, what it says does not exist, and what was hard to categorise. The
variables are the groupings those notes forced. Each variable has a `question`, each value has a
decision-rule `gloss`, and each value lists the `precedent` documents that forced it, so adding or
splitting a value is an argument from evidence.

Things the reading forced that a proposed scheme would have missed:

- *Who decides* and *what applies when they are silent* matter more than allowed-versus-banned.
  Harvard, Stanford, UBC, Toronto, Helsinki and Heidelberg defer to the instructor; their silent
  defaults then differ (`default_when_silent`).
- Tier schemes differ in shape (two-lane, three-tier, four-level, supervised/unsupervised), and the
  tier types recur (`tiers_present`).
- Disclosure is five questions, not one: whether, exemptions, contents, location, enforcement.
- Documents differ in how binding they say they are (`instrument_force`), including within one
  document (Edinburgh's thesis guidance is "not Mandatory" but says "must").
- Some documents exclude an audience or topic by design (`audiences_excluded`,
  `topics_out_of_scope`), which is a finding, not a gap.
- Per-use permissions are comparable one use at a time (`use_*`).

Reader limits: sites behind bot walls or returning 403 (Ulster's own pages, Oxford, QUB, UCL, Imperial,
Leeds, Cardiff, UCD, Melbourne, NUS and others) were not retrieved and are absent, not coded.
Ulster's own student, doctoral and staff pages are among them, so Ulster is currently represented
only by its library guide. Sampling is therefore by reachability, and the page must say so.

## Next

1. Pilot-code a spread of documents against this codebook, read the misfits, revise (v0.3).
2. Re-retrieve what was blocked (or take pasted text) and extend the snapshot set.
3. Build the page over `data/policy/*.json`.
