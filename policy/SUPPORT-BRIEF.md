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

## Output: one file per document, `data/policy/run1/support/<batch>/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>", "found": [{"form": "...", "requirement": "...", "audience": "...", "name": "...", "quote": "...", "anchor": "..."}]}

## Validate

    node policy/support.js validate data/policy/run1/support/<batch>

Fix every ERROR. Do not run git. Use a private `mktemp -d` for any scripting. If a tool call is denied by the permission system, stop and report it.

## Report (under 80 words)

Per document: the forms found with their requirement level, and flag any form you found hard to place.
