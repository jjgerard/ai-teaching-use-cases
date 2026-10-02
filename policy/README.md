# AI policy atlas: method and status

A comparison of university, sector and government AI guidance across regions, audiences and
time. Standalone page in this site, in the style of the language atlas, linked from the nav
once there is data to show.

**Status: infrastructure only.** No policy variables exist yet and no documents are coded.
`codebook.json` has `"variables": []` on purpose (see "Why no variables yet").

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

## Why no variables yet

The atlas derived its vocabularies by reading the corpus, not by proposing a scheme, because a
scheme built from expectation codes cleanly and means nothing. So variables come from reading
roughly 40 real documents with no scheme in mind, grouping what they do, then naming values
with the documents that forced each one as its gloss/precedent.

That reading has not happened: the build environment's network policy blocks
`www.ulster.ac.uk`, `www.executiveoffice-ni.gov.uk` and other university and government hosts.
Nothing should be inferred from search snippets or memory.

## Next

1. Allow the hosts (or supply the documents as text), and archive each to `snapshots/`.
2. Read, derive variables, write them into `codebook.json` with glosses, gates and grains.
3. Pilot-code the three Ulster pages and the NI draft strategy; read the misfits; revise.
4. Build the page over `data/policy/*.json`.
