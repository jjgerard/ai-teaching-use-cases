# Presence audit brief (give this to each audit agent)

The statement classification only covers the 6 to 15 points extracted from each document, and those were chosen as the most distinctive rules. A statement type that is
missing for a document may therefore still be stated somewhere in it (a short mention of training, a link to a course, a sentence on data protection).
This audit reads each whole document against the full vocabulary and records every statement type the document actually makes, with a verbatim quote.

## Inputs

- `data/policy/run1/audit/aN-input.json`: your documents, each as `{doc_id, already: [type ids]}`. `already` lists types already recorded for that document: skip those.
- The vocabulary `data/policy/run1/claims/statement-types.v1.json`: for each type read the `definition` and `decision_rule`, including the tie-break wording.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference about what the institution does elsewhere.

## Task

For each document, go through EVERY type not in `already` and decide whether the document itself states it. Read the whole text, including bullet lists, FAQs, headings with
descriptive text and link or button labels that carry the statement in their own words (for example a label "Online course: using generative AI in your studies" states that a
course is provided). Navigation chrome and page titles alone do not count.

A type counts only when a **verbatim quote** from the snapshot makes that statement under the type's decision rule. A passing topic mention that does not make the statement does not count.
If the match is borderline, do not count it: list it under `unsure` instead.

## Output: `data/policy/run1/audit/aN/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>", "checked_types": <int, how many types you examined>,
     "found": [{"type": "<type id>", "quote": "<verbatim, at most 60 words, no ellipsis>", "anchor": "<nearest heading or null>"}],
     "unsure": [{"type": "<type id>", "quote": "<verbatim>", "why": "<at most 15 words>"}]}

One entry per type at most. `quote` must be a verbatim substring of the snapshot (whitespace, hyphens and curly quotes are ignored when matching).

## Validate

    node policy/presence.js validate data/policy/run1/audit/aN

Fix every ERROR. Do not run git. Use a private `mktemp -d` for any scripting.

## Report (under 100 words)

Per document: types examined, found, unsure.
