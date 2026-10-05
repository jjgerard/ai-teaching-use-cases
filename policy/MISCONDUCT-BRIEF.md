# Academic misconduct audit (give this to each agent)

This audit records what a document says about **academic misconduct involving AI**: what counts as an offence, how it is detected, how a case is handled and what the outcomes are. Rules about what AI may be used for belong to a different schema; here we record only the offence, detection, process and outcome side.
Every value needs a verbatim quote. Anything the document does not say stays empty.

## Inputs

- `data/policy/misconduct-schema.json`: the closed vocabularies (`offences`, `liability`, `detection`, `process`, `outcomes`, `scope`). Read all of it.
- `data/policy/run1/misconduct/<batch>-input.json`: your documents, a list of `{doc_id}`.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference about what the institution does elsewhere.

## Task

Read the whole document. First set `scope`: `ai_specific` (mainly about AI), `general_misconduct` (a general misconduct or integrity procedure or regulation with some AI wording) or `none` (no misconduct content at all).
Then, for each vocabulary value the document states, write one row: `{value, ai_named, quote, anchor}`.

- **`ai_named`** is `true` only when the quote itself names AI, generative AI, an AI tool, or AI-generated content. Generic misconduct wording ("fabricating data", "the panel will hear the case", "appeal within 10 days") is `ai_named: false`. Record generic wording too: it is how the institution's whole procedure applies to AI cases, and the page will show the two separately.
- `offences`: what the document says counts as an offence (undeclared_use, unauthorised_use, passing_off, fabrication_or_falsification, disguising_use, contract_cheating_or_ghostwriting, misuse_of_others_work, exam_or_supervised_breach, data_or_upload_breach). A statement that an action "is misconduct", "breaches the policy", "may be treated as plagiarism" or "is an offence" counts.
- `liability`: strict liability, intent considered, or ignorance mitigates.
- `detection`: `{method, stance, ai_named, quote}` with methods and stances from the schema. Use `unreliable` for "results are not proof / not sufficient on their own", `restricted` for "only used by named officers or under conditions", `not_used` for "we do not use detection software".
- `process`: steps of handling a case (informal_conversation, referral_to_officer_or_panel, investigation, student_right_to_respond, hearing, proceeds_if_absent, support_for_student, appeal, timescale, standard_of_proof).
- `outcomes`: what can happen (educative_first_offence, warning, mark_reduction, zero_for_work, resubmission, module_failure, suspension_or_exclusion, degree_effect, repeat_offence_escalation, tariff_or_factors, penalty_stated_without_detail).
- `definitions`: terms the document defines (term at most four words), with the defining quote.

One row per value (for `detection`, one per method and stance). Choose the clearest quote; if a value appears in several places, use the one that names AI if there is one.
A tariff table or a list of penalties by offence may be quoted by its clearest single line; do not stitch lines. If a sentence is split by a page or table break, quote the longest contiguous part that still makes the statement.

## Rulings from the pilot (apply them)

- **One quote may support several values.** "Unacknowledged AI-generated content is plagiarism" is both `passing_off` and `undeclared_use`; give each its own row with the same quote.
- **`undeclared_use`** needs the document to call not acknowledging or not declaring AI an offence (misconduct, plagiarism, a breach). A bare duty to declare, with no consequence stated, is not an offence row.
- **Liability:** "intent is not required but is relevant to the penalty" is both `strict_liability` and `intent_considered`. "Intentional or inadvertent" is `strict_liability`. `ignorance_mitigates` only where the document says inexperience or ignorance counts in the student's favour (a poor-practice route, an induction period, lower penalty).
- **Detection:** "similarity checking software to detect plagiarism or AI misuse" gets a row for both `similarity_software` and `ai_detection_software`. "Detection software" with no further word is `ai_detection_software` only when AI is named in the quote. A stated warning that results are unreliable is stance `unreliable` for the method it concerns.
- **Process:** an informal first meeting is `informal_conversation`; a formal hearing, panel or exploratory interview is `hearing`; an oral check of understanding is `oral_viva_or_interview`. A timescale needs an actual period ("within 10 working days"); "timely manner" is not one.
- **Outcomes:** `zero_for_work` is a zero for the piece; `module_failure` is failing the module; a cap on the mark is `mark_cap`; a "formal reprimand" or written warning is `warning`. Where one sentence covers two outcomes, write both.
- **New values** added after the pilot: offences `facilitating_or_collusion`, `impersonation_or_coercion`, `self_plagiarism_or_multiple_submission`; process `records_or_register`; outcomes `mark_cap`, `award_withdrawn_or_post_award`, `professional_referral`.

Do not record: what AI may be used for (uses schema), data and tool rules, support and training, staff-only duties of setting assessments.
A document with no misconduct content gets `scope: "none"` and empty lists: a valid result.

## Output: one file per document, `data/policy/run1/misconduct/<batch>/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>", "scope": "ai_specific|general_misconduct|none",
     "offences": [{"value": "...", "ai_named": true, "quote": "...", "anchor": "..."}],
     "liability": [], "detection": [{"method": "...", "stance": "...", "ai_named": false, "quote": "...", "anchor": null}],
     "process": [], "outcomes": [], "definitions": [{"term": "...", "ai_named": false, "quote": "..."}]}

## Validate

    node policy/misconduct.js validate data/policy/run1/misconduct/<batch>

Fix every ERROR. Do not run git. Use a private `mktemp -d` for scripting; do not touch files in /tmp you did not create. If a tool call is denied, stop and report it.

## Report (under 100 words)

Per document: scope, number of offence, detection, process and outcome rows. List anything that fit no value and any value that was hard to apply.
