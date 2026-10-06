# Targeted audit of the new v2 statement types (give this to each audit agent)

Vocabulary v2 added 11 statement types. The earlier whole-document audit did not look for them. This pass reads each whole document and records, for the 11 new types only,
whether the document itself makes that statement, with a verbatim quote.

## Inputs

- `data/policy/run1/audit-v2/bN-input.json`: your documents, each as `{doc_id, types: [11 type ids]}`.
- The vocabulary `data/policy/run1/claims/statement-types.v2.json`: read the `definition` and `decision_rule` of the 11 types listed in your input (and only those). Each rule says how the type differs from its neighbour types; a quote that fits a neighbour better does not count here.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference about what the institution does elsewhere.

## Task

For each document, go through each of the 11 types and decide whether the document states it. Read the whole text, including bullet lists, FAQs, headings with descriptive text and link or button labels that carry the statement in their own words. Navigation chrome and page titles alone do not count.

A type counts only when a **verbatim quote** from the snapshot makes that statement under the type's decision rule. A passing topic mention does not count. If the match is borderline, do not count it: list it under `unsure`.
Expect most types to be absent from most documents. Do not stretch a quote to fit.

## Output: `data/policy/run1/audit-v2/bN/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>", "checked_types": 11,
     "found": [{"type": "<type id>", "quote": "<verbatim, at most 60 words, no ellipsis or '[...]'>", "anchor": "<nearest heading or null>"}],
     "unsure": [{"type": "<type id>", "quote": "<verbatim>", "why": "<at most 15 words>"}]}

One entry per type at most. `quote` must be a verbatim substring of the snapshot (whitespace, hyphens and curly quotes are ignored when matching). If a sentence is split by a page or link break, quote the longest contiguous part that still makes the statement.

## Validate

    node policy/presence.js validate data/policy/run1/audit-v2/bN --types data/policy/run1/claims/statement-types.v2.json

Fix every ERROR. Do not run git. Use a private `mktemp -d` for any scripting. If a tool call is denied by the permission system, stop and report it; do not look for another route to the same data.

## Report (under 80 words)

Per document: found and unsure counts and the type ids found.
