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

Not proposed: read first. Six readers retrieved 61 documents from 13 countries plus UNESCO (universities,
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

## Scaling up: UK and Ireland, one institution-wide document each

Status of the tooling (all dependency-free, all tested: `npm run policy:test`):

| Step | Tool | Notes |
|---|---|---|
| 1. Sampling frame | `node policy/frame.js GB IE` | Candidates from the Research Organization Registry. `data/policy/frame.json` has 630: 181 `university_name` (165 GB, 16 IE), 345 `other_candidate`, 104 `unlikely`. The tier is a name heuristic only. A human sets `include` true/false against the official register (OfS/HESA for UK providers, HEA for Ireland). Run it with `NODE_USE_ENV_PROXY=1` inside a sandbox that forces a proxy; not needed on a normal machine. |
| 2. Find each institution's document | search, by an agent or a person | One institution-wide student-facing page each to start. Write `targets.json` (`doc_id`, `url`). An institution with no public guidance, or whose page cannot be fetched, gets an explicit outcome (found / not_found / blocked), not silence. |
| 3. Archive | `node policy/fetch.js fetch targets.json --contact you@example.org` | Run on your own machine. Honest User-Agent, obeys robots.txt, 3 s between requests to a host, never tries to defeat a bot wall (those are recorded `blocked`; save the page in your browser and use `fetch.js import saved.html --id ... --url ...`). Changed pages keep their old snapshot in `snapshots-history/`, so change over time is analysable. `fetch.js status` lists everything not `ok`. |
| 4. Register | `documents.json` | `level`, `audience` (list), `domains` (list), dates. Judgement calls, so a person or a coder does it, and the validator checks it. |
| 5. Code | agents against `codebook.json` | Two independent coders on a sample (about 10%), `node policy/agreement.js` for the figure. Quotes are checked against the snapshot by the validator. |
| 6. Page | over `data/policy/*.json` | After there is enough to show. |

### Honest limits

- The frame is only as good as its curation. Names containing "college" or "institute" are left to a human.
- Reading by reachability is over. With a frame, "blocked" and "not found" are findings about named institutions.
- Agreement figures so far come from instances of one model, so they are optimistic. Human double-coding of a sample is required before any prevalence claim.
- Cost, from the pilot: roughly 50-60k tokens per document for coding alone.

## Next

1. Curate `data/policy/frame.json` (set `include`).
2. Trial discovery on about 20 institutions to check the procedure and the cost.
3. Scale to the whole frame; then PGR and staff extensions for a stratified subset.
4. Build the page.
