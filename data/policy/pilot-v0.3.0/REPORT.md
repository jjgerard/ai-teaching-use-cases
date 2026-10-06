# Pilot round 2 (codebook 0.3.0)

Same 8 documents as round 1, coded by four fresh coders (r2-1..4) who were told not to read round-1 codes.
`codes.json` validates against `codebook-0.3.0.json` with 0 errors.

## Effect of the v0.3.0 revision

| | Round 1 (0.2.0) | Round 2 (0.3.0) |
|---|---|---|
| coded with a value | 226 | 250 |
| not_stated | 254 | 190 |
| not_applicable | 106 | 166 |
| misfit | 22 (3.6%) | 10 (1.6%) |

`not_stated` fell because cells that meant "this does not apply to this kind of document" are now
`not_applicable` (the NI strategy has about 35 applicable variables instead of 76).

## Agreement, round 1 vs round 2 (`node policy/agreement.js`)

- 608 cells compared; agreement on the kind of answer 83%.
- Where both coders gave a value (222 cells): exact agreement 83%, mean Jaccard 88%.

**Read these numbers with three cautions.**
1. About half the disagreements are artefacts of the codebook changing between rounds (new values such as
   `live_translation_prohibited`, `students_all`, `parent_institutional_policy` could not be chosen in round 1).
2. Rounds 1 and 2 used the same 8 documents the revision was written from, so the improvement in misfits is
   partly tuning. The holdout is round 3 on documents the vocabulary has not seen.
3. All coders are instances of the same model, so this is not human-human reliability and probably overstates it.
   The method still calls for human double-coding of a sample.

## Where coders genuinely disagreed

1. **`use_*` permitted vs conditional** (8 cells): the boundary was unclear when acknowledgement is the only
   condition. v0.3.1 adds an explicit decision rule.
2. **List inclusion** (data_entry_rules, sanctions_stated, disclosure_contents, legal_instruments_named): coders
   include different numbers of items. Root cause: one evidence quote cannot support several values. v0.3.1
   requires `evidence_quotes` (a quote per value) for multi variables.
3. **Documents with different rules for two audiences** (UKRI applicants vs assessors; Warwick staff vs student box):
   one cell cannot hold both. v0.3.1 adds `audience_scope` so a variable can be coded once per audience.
4. **default_when_silent** misfit on Edinburgh (a use-by-use default) and Warwick ("see the table"): v0.3.1 adds
   `use_by_use_rule` and `permit_with_acknowledgement`.
5. **precedence** misfit on Edinburgh ("check your course; our prohibitions stand"): v0.3.1 adds `layered`.

## v0.3.1 changes

Values: default_when_silent (+2), precedence (+layered), disclosure_obligation (+required_for_published_or_significant_output),
misconduct_framed_as (+breach_of_other_policy), non_institutional_tool_rule (+2), accessibility_provisions (+1),
access_equity_provisions (+1), data_entry_rules (+confidential_unspecified). Types: staff_disclose_own_ai_use and
ai_recording_transcription become multi. Rules written into variable questions: only adopted frameworks count as
`external_frameworks_adopted`; `issued_by_type` is coded from text, never a URL; disclosure contents from worked
examples count only if the document says the acknowledgement should include them. Row conventions: `evidence_quotes`,
`audience_scope`.

## Deferred (still one document, or a design question)

- staff-specific `use_*` variables (use_* are framed around students' submitted work and fit staff uses awkwardly)
- "assessors must not infer AI use" (UKRI)
- a document's domains are tagged by hand; NI mentions teachers using AI for grading but is tagged
  public_services + school_education, so that content has no applicable variable. Worth deciding whether a
  document may carry a domain it only touches (then variables apply but are mostly not_stated).
