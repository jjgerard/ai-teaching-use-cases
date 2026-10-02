# Trial: 20 institutions, discovery and archive

Sample: `sample.json` (seed 42; stratified 10 England, 3 Scotland, 2 Wales, 2 Northern Ireland, 3 Ireland,
drawn from the `university_name` tier of `../frame.json`, excluding institutions already in the dataset).
Four discovery agents (5 institutions each), then `policy/fetch.js` on every URL found, run from a sandbox.

## Discovery (`outcomes.json`)

| Outcome | Count |
|---|---|
| found (retrieved and confirmed) | 13 |
| found_unverified (URL looks right, could not be retrieved) | 3 |
| not_found | 3 |
| out_of_frame | 1 |

- A document URL is known for 16 of 20 institutions (80%).
- The three `not_found` are not equally strong: University of Wales was searched properly and has registered
  students but no AI guidance anywhere the agent looked; St Mary's (Belfast) and Stranmillis returned no usable
  pages at all, so those two are **unresolved**, not findings.
- `out_of_frame` is National University of Ireland (a federal awarding body). University of Wales is a similar
  validating body. 2 of 20 frame entries were not ordinary teaching institutions, so the frame needs curation.
- Two institutions only had a fallback document (an academic-integrity page that mentions AI).
- The documents are not one kind: 7 webpages, 3 library guides, 2 PDFs, 2 policy documents, 2 FAQs. "The
  institution-wide student document" is whatever the institution publishes, so analysis must control for
  `instrument_force` and `issued_by_type`.
- Other pages noted along the way: 16 of 20 institutions had at least one other page recorded, but only **one**
  was a PGR page (nine were staff pages). The agents were not searching hard for those, but the PGR extension
  may be much thinner than the student layer.

## Archive (`manifest.json`, `snapshots/`)

| Status | Count |
|---|---|
| ok | 13 (2 thin: Cranfield 255 words, Stirling 275) |
| blocked | 2 (Leicester: bot challenge; Bucks: HTTP 403) |
| js_shell / needs_text | 1 (Lancaster: renders no text without JavaScript) |

End to end, 13 of 20 institutions (65%) have an archived document that is ready to code. The remaining seven are
a mixture of blocked (to be fetched from a normal machine or imported by hand), unresolved, and out of frame.

Bugs the trial found in `fetch.js`, all fixed and tested: an obfuscated JavaScript challenge served with HTTP 200
was not detected; empty script shells were labelled `needs_text`; `\r\n` line endings left long runs of blank lines.
Not fixed: pages without a `<main>` keep their navigation menu in the text (Essex). Quotes still verify, but word
counts are inflated and a coder has to read past the menu.

## Cost

Discovery used about 353k tokens for 20 institutions (about 17.6k each; 126 tool calls). Archiving is negligible.
Coding was not part of the trial; the pilot cost is roughly 50-60k tokens per document. For one document per UK and
Irish institution (about 181), that projects to roughly 3M for discovery plus 9-11M for coding. That is a large
fraction of what remains in this session, so the full run needs either a reduced scope or a second session.

## Procedure changes

See `policy/DISCOVERY.md`. Main ones: use the search tool's domain filter with the institution's own domain (the
`site:` operator is ignored and returns other universities); watch for name collisions (St Mary's Belfast vs
Twickenham, Queen Margaret vs Queen Mary, Leeds vs Leeds Trinity); a `not_found` needs a stated reason and an
unreachable site is `unresolved`, not a finding; fetch with `fetch.js`, not hand-rolled extraction.
