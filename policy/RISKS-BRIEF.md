# Risks and responsibilities audit (give this to each agent)

This audit records what a document says about **the risks of generative AI** and **who is responsible for what**: which hazards it names (wrong output, bias, privacy, copyright, environmental cost and so on), and which duties it puts on students, staff, the institution or providers. Rules about what AI may be used *for* are in the uses schema, tools and data in the toolsdata schema, and academic misconduct (offences, detection, penalties) in the misconduct schema; do not record them here. Everything needs a verbatim quote. Anything the document does not say stays empty.

## Inputs

- `data/policy/risks-schema.json`: the closed vocabularies (`risks`, `duties`, `bearers`, `strengths`, `audience`). Read all of it, including the one-line definitions.
- `data/policy/run1/risks/<batch>-input.json`: your documents, a list of `{doc_id}`.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference.

## Task

Read the whole document, then record every statement the vocabularies can hold.

- `risks`: `{risk, audience, ai_named, quote, anchor}` for each hazard the document says AI has or creates. `audience` is who the statement is addressed to: `students`, `staff`, `both` (or "everyone", "users") or `unspecified`.
- `responsibilities`: `{duty, bearer, strength, ai_named, quote, anchor}` for each duty. `bearer` is who must do it (`students`, `staff`, `both`, `institution`, `provider`, `unspecified`). `strength` is `must` (an obligation: must, required, will be expected to), `should` (advice or expectation: should, encouraged, recommended) or `will` (an institutional commitment: we will, the university commits to).

`ai_named` is `true` only when the quote itself names AI, generative AI, an AI tool or a named AI product.

One row per risk and audience; one per duty, bearer and strength. Choose the clearest quote; if a statement appears several times, use the one that names AI. At most 60 words, no ellipsis and no "[...]". If a sentence is split by a page or table break, quote the longest contiguous part that still makes the statement.

## Rulings

- A risk is something the document says **can go wrong or cause harm**. A rule is not a risk: "do not upload personal data" is a toolsdata row, not a risk row. "AI tools may store what you type" is `privacy_or_data_exposure` here.
- **Detector unreliability** (false positives, bias against some writers) is not a risk here; it stays in the misconduct schema. Bias in AI *output or training* is `bias_or_discrimination`.
- **"Be responsible" in general terms** is `use_ethically_and_responsibly`. **Remaining responsible for the output or its accuracy** is `accountable_for_output`; **checking it** is `verify_output`. A sentence can support both; give each its own row only when the wording supports both.
- **"Follow the university's policies/the law"** is `comply_with_policy_and_law`. Named laws themselves are in toolsdata.
- **Assessing risk before use** (DPIA, risk assessment, ethics or approval process before adopting a tool) is `assess_risk_before_use`, borne by whoever the text names, often the institution or staff.
- **Human oversight:** "staff must not rely solely on AI for marking" or "a human will review decisions" is `human_oversight`.
- **Training and awareness:** "staff should complete AI training" or "students should keep up with guidance" is `stay_informed_and_trained`; "we will invest in AI literacy" is the same duty with bearer `institution`, strength `will`.
- **Institutional commitments** ("we will review this guidance", "we will keep detection tools under review", "we will ensure equitable access") use `keep_guidance_under_review` or `ensure_equitable_access`, bearer `institution`, strength `will`.
- **Not required to use AI** ("students will not be expected to use AI tools") is `no_compulsion_to_use`, bearer `institution` or `staff` as the text says.
- Do **not** record: what AI may be used for, tools and data stances, acknowledgement or declaration rules, misconduct offences, penalties and processes, the burden of proof, or generic statements of the institution's mission.
- A statement that fits no value goes in your report, not in a nearby value.

A document with nothing on risks or responsibilities gets empty lists: a valid result.

## Output: one file per document, `data/policy/run1/risks/<batch>/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>",
     "risks": [{"risk": "...", "audience": "both", "ai_named": true, "quote": "...", "anchor": null}],
     "responsibilities": [{"duty": "...", "bearer": "students", "strength": "must", "ai_named": true, "quote": "...", "anchor": null}]}

## Validate

    node policy/risks.js validate data/policy/run1/risks/<batch>

Fix every ERROR. Do not run git. Use a private `mktemp -d` for scripting; do not touch files in /tmp you did not create. If a tool call is denied, stop and report it.

## Report (under 120 words)

Per document: number of risk and responsibility rows. List anything that fit no value and any value that was hard to apply.
