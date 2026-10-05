# Support and training forms audit (give this to each agent)

The statement "the institution offers training, guidance or support on AI" is true of most documents but says nothing about **what** is offered. This audit records, for each document, every **form** of
help the document says the institution offers, with a verbatim quote, how binding it is and who it is for.

## Inputs

- `data/policy/support-forms.json`: the closed list of forms (`id`, `definition`, `rule`), the `requirement` values and the `audience` values. Read all of it, including each form's rule and what it is not.
- `data/policy/run1/support/<batch>-input.json`: your documents, a list of `{doc_id}`.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference about what the institution offers elsewhere.

## Task

Read the whole document, including bullet lists, FAQs and link or button labels that carry the offer in their own words (a label "Online course: using generative AI in your studies" states that a course is offered). For each form that the document says is offered, write one row.
Count only what the document itself says is offered by the institution (or its library, skills or learning service). Do not count: a bare instruction to check with a tutor about permission; a link to an external tool; the institution's own rules; resources that are only about something other than AI.
If a form is offered in several places, choose the clearest quote and the strongest requirement level. A document that offers nothing gets an empty list: that is a valid result.

For each row:
- `form`: one id from the list.
- `requirement`: mandatory, advised, optional, planned or unspecified, per the definitions in the file. Use the wording of the quote; if the quote does not say, use `unspecified` (not `optional`).
- `audience`: students, staff, both or unspecified.
- `name`: optional, at most 12 words, the name of the thing offered if the quote gives one (for example "Generative AI Awareness HUB course").
- `quote`: verbatim from the snapshot, at most 60 words, no ellipsis and no "[...]". If a sentence is split by a page or link break, quote the longest contiguous part that still makes the statement.
- `anchor`: nearest heading or null.

## Rulings from the pilot (apply them)

- **Requirement level follows the wording, not the tone.** `mandatory` only for must, required, mandatory, "need to complete", or a stated condition (before an assessment, before using AI). `advised` for should, please complete, you are expected to, recommended, auto-enrolled. `optional` for bare imperatives to look something up ("Access the course", "See our guide", "Visit the hub") and for plain availability. `unspecified` when the quote only names the thing (a link label, a title).
- **Audience:** `both` when the quote names staff and students together (including "colleagues and students"); `students` only when the quote is addressed to students or says students; `staff` only when addressed to staff; otherwise `unspecified`.
- **One quote may carry several forms** (for example a course that also teaches prompting): record each form with the same quote.
- **The institution's own guidance PDF or page for students counts as `guide_toolkit_or_hub`.**
- **Do not record** as a form: the right to use an institutional AI tool or licence (this belongs to a different statement type); coversheet or declaration templates; "ask your tutor or lecturer" instructions about permission; governance groups, principles and policy statements; the library as a general research gateway with no AI content. A named person or service that offers help with AI counts (`named_academic_support`); a generic instruction to ask a tutor does not.

## Output: one file per document, `data/policy/run1/support/<batch>/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>", "found": [{"form": "...", "requirement": "...", "audience": "...", "name": "...", "quote": "...", "anchor": "..."}]}

## Validate

    node policy/support.js validate data/policy/run1/support/<batch>

Fix every ERROR. Do not run git. Use a private `mktemp -d` for any scripting. If a tool call is denied by the permission system, stop and report it.

## Report (under 80 words)

Per document: the forms found with their requirement level, and flag any form you found hard to place.
