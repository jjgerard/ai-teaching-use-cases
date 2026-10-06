# Coding brief (give this to each coding agent)

You are coding policy documents against the vocabulary in `policy/codebook.json`. The point is a comparison that can be
counted, so every answer must be a value from a closed list, never prose. Where the vocabulary cannot honestly express
what a document says, the most useful thing you can produce is a recorded misfit, not a forced value.

## Inputs, in this order

1. `policy/README.md` and the header comments of `policy/validate.js` (rules and states).
2. `policy/codebook.json`. Every variable has a `question`, a `type`, `values[].gloss` (the decision rule) and `precedent`
   documents. Read `states`, `misfit`, `domainsRule` and `rowRules`.
   - `applies_to`, `applies_to_levels`, `applies_to_domains` and `gate.only_if_in` decide applicability. If a variable does not
     apply to this document (audience, level, domains) or its gate is not met, it MUST be `not_applicable`.
3. The document's snapshot `data/policy/snapshots/<doc_id>.txt`. **Code only from this text.** No memory, no other pages, no URLs.
4. `data/policy/documents.json` and `institutions.json` (they hold your document's metadata: level, audience list, domains). Do not edit.

## Output

One row per variable per document (plus extra rows if you use `audience_scope`), as a JSON array in
`<OUT>/<doc_id>.json`. Row shape:

    {"doc_id": "...", "variable_id": "...", "value": ..., "evidence_quote": "...", "evidence_quotes": {"value_id": "quote"},
     "page_ref": null, "coder": "<your coder name>", "coded_at": "<today, ISO>", "codebook_version": "<the codebook's version>",
     "misfit_note": null, "audience_scope": null, "rule_source": null}

## Value forms

- enum/ordinal: one value id. multi: a non-empty array of value ids. boolean: `true` only, never `false`.
- integer/number: the number plus `unit`, `counted`, `basis` strings on the row. date: ISO.
- The document says nothing about it: `"not_stated"` (no quote needed).
- The document says outright that there is no such thing: `"none_exists"` plus a quote.
- It does not apply (audience, level, domain or gate): `"not_applicable"` (no quote).
- The document DOES answer but no listed value is honest: `"value": null`, a verbatim `evidence_quote`, and a `misfit_note` saying
  what the document says that no value carries. Never pick the nearest value to avoid this.
- `evidence_quote` is a VERBATIM substring of the snapshot (the validator checks, ignoring whitespace, hyphens and curly quotes).
  One sentence or less. Do not stitch separate passages with "...".
- **multi variables need `evidence_quotes`: a verbatim quote for EVERY value.** One quote cannot evidence several values.
- `audience_scope` (an audience id): when one document gives different rules to two audiences it addresses, code the variable once
  per audience. Gates and applicability read the whole-document row, so give a whole-document row too.
- `rule_source`: `own_text` (default), `template_wording` (sample wording the document offers others to adopt) or
  `quoted_other_policy` (another body's wording quoted inside the document). Do not confuse it with the numeric `basis` column.
- Code each variable from THIS document's text alone. Never import what a sibling page of the same institution says.
- If the document states only a blanket permission and lists no per-use rules, leave the `use_*` variables `not_stated`.
- `issued_by_type` is never coded from a URL. Code the document's own words only.
- When a gloss does not decide a case, say so in your notes. Do not guess silently.

## Independence

Do not read any other coding of any document, and do not open other coders' output folders or the `data/policy/pilot-*/` archives.
Independent coding is what the agreement figure measures.

## Validate before reporting

    T=$(mktemp -d); mkdir $T/snapshots
    cp data/policy/institutions.json data/policy/documents.json $T/; cp data/policy/snapshots/*.txt $T/snapshots/
    python3 -c "import sys,json; print(json.dumps([r for f in sys.argv[1:] for r in json.load(open(f))]))" <your files> > $T/codes.json
    node policy/validate.js $T

Fix every ERROR. Warnings about uncoded variables for documents you were not given are expected.
Do not edit anything under `policy/` or `data/policy/` (codebook, validator, snapshots, tables). Write only your codes files and notes.

## Report (under 450 words, no document text pasted wholesale)

MISFITS (variable, short quote, what is missing); AMBIGUOUS (two defensible values and why you chose); WANTED (value or
variable the document made you want); UNUSED/USELESS; COULD-NOT-APPLY (rules you could not follow); VALIDATOR (final line).
