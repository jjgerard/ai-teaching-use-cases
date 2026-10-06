# Uses and acknowledgement audit (give this to each agent)

Instead of asking "does the document say AI is allowed for study", this audit records **what for**: for each specific use of AI, in which setting, with what stance, and whether it must be acknowledged. It also records
the document's default when a brief is silent, who decides, and how acknowledgement works. Everything needs a verbatim quote. Anything the document does not say stays empty.

## Inputs

- `data/policy/uses-schema.json`: the closed vocabularies (`uses`, `contexts`, `stances`, `conditions`, `acknowledge`, `default_when_silent`, `decided_by`, `acknowledgement`). Read all of it.
- `data/policy/run1/uses/<batch>-input.json`: your documents, a list of `{doc_id}`.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference about what the institution does elsewhere.

## Task

Read the whole document. For each **specific use** in the vocabulary that the document speaks to, write one row per setting:

- `use`, `context` (study, assessed_work, exams_or_supervised, research_or_thesis, unspecified): a row per use and per setting. If the same sentence covers several uses (a list of permitted uses), write one row for each use it names, each with the same quote or the clearest part of it.
- `stance`: permitted, conditional, discouraged, prohibited or required. Use `conditional` only when the quote states a condition, and then list it in `conditions` (needs_permission, needs_acknowledgement, approved_tool_only, limited_extent, no_personal_data, other_rules_apply, account_or_age_limit, not_required_to_use). A cautionary "be careful with" is `discouraged`.
- `acknowledge`: `required` if the quote or the document says this use must be acknowledged or declared; `not_required` if it says this use needs no acknowledgement; otherwise `not_stated`.
- `quote` (verbatim from the snapshot, at most 60 words, no ellipsis and no "[...]"; if a sentence is split by a page or link break, quote the longest contiguous part that still makes the statement) and `anchor` (nearest heading or null).

A general statement does not name a use: "AI can support your learning" or "AI is permitted unless the brief says otherwise" are **not** use rows. Record them under `default_when_silent` or leave them out. A row needs the document to name the activity (or a clear synonym).
"No AI at all in this assessment" with no named activity: write one `generate_assessed_text` row with context `assessed_work`, stance `prohibited`, and quote it. A named scale or tier list (for example a traffic-light or AI assessment scale) gives one row per use it names, each with its tier's stance, and `decided_by` includes `tiered_scale`.

## Rulings from the pilot (apply them)

- **"Prohibited unless explicit permission" is `conditional` with `needs_permission`**, not `prohibited`. A flat ban with no route to permission is `prohibited`.
- **"In limited ways", "to some extent", "only minor changes"** is `conditional` with `limited_extent`. **"Be careful", "not recommended", "should not"** is `discouraged`.
- **A use may appear more than once in one setting when the stances differ** (for example a permitted form and a prohibited form of the same use, or conflicting tiers): write each as its own row, with a `tier` or a short qualifier in `tier` if it helps. Only an identical use, setting, tier and stance is rejected as a duplicate.
- **Tiers and scales.** One row per use per tier: put the tier's name in `tier` (at most 4 words) and give each its own stance. The same use may then appear several times in one setting, once per tier. A tier that names no activity ("selective use", "integral use", "no AI") is a row for `any_use` with that tier's stance (a tier that makes AI integral is `required`).
- **Worked examples.** An example labelled misconduct gives `prohibited` for the use it illustrates; one labelled acceptable gives `permitted`. Do not take acknowledgement from an example unless the example says so.
- **Acknowledgement duty.** `always_required` when the quote says any or all AI use must be acknowledged or declared, including where it is tied to a consequence ("or it is plagiarism"). `conditional` only when the quote limits it (by extent, assessment type, or "if the brief requires it"). `recommended` for should, encouraged, good practice.
- **`default_when_silent`:** only when the document says what applies if the brief or lecturer says nothing. "Unless specified otherwise you may X, Y, Z" is `use_by_use_rule` (and write the use rows); "unless specified otherwise AI is allowed" is `permit_all`.
- **When both a general line and a tier or per-use list exist, code the detail;** keep the general line for `default_when_silent` or `decided_by`.

Document-level fields (use null or an empty list when the document is silent):
- `default_when_silent`: `{value, quote}` from the schema, only if the document says what applies when the brief or lecturer says nothing.
- `decided_by`: a list of `{value, quote}` (institution_wide, school_or_department, module_or_lecturer, assessment_brief, tiered_scale).
- `acknowledgement`: `duty` (always_required, conditional, recommended, not_required), `contents` (list), `location` (list), `records`, `referencing`, `consequence`, and `exempt` (list of `{what, quote}` where `what` is a use id or one of the `exempt_other` values). Each is `{value, quote}` (lists of them).
  - `duty` is about whether the student must say they used AI; a requirement to cite in the reference list goes under `referencing`.

Do not record: staff-only duties; rules about data or tools (that is another vocabulary); sanctions or processes; support and training.
If the document says nothing about uses, return `"uses": []`; that is a valid result.

## Output: one file per document, `data/policy/run1/uses/<batch>/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>",
     "uses": [{"use": "...", "context": "...", "stance": "...", "acknowledge": "...", "conditions": [], "quote": "...", "anchor": "..."}],
     "default_when_silent": {"value": "...", "quote": "..."} | null,
     "decided_by": [{"value": "...", "quote": "..."}],
     "acknowledgement": {"duty": {"value": "...", "quote": "..."} | null, "contents": [], "location": [], "records": null, "referencing": null, "consequence": null, "exempt": []}}

## Validate

    node policy/uses.js validate data/policy/run1/uses/<batch>

Fix every ERROR. Do not run git. Use a private `mktemp -d` for scripting. If a tool call is denied by the permission system, stop and report it.

## Report (under 100 words)

Per document: number of use rows, whether a default and a duty were found. List anything that fit no use or value, and any use you were tempted to add.
