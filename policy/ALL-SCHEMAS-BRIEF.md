# Five-schema audit of a new document (give this to each agent)

Each document below has not been coded yet. Code it for **all five schemas**, reading each document once and then writing five files per document. Apply each original brief exactly, including its rulings:

1. **Uses and acknowledgement**: `policy/USES-BRIEF.md` with `data/policy/uses-schema.json`. The schema now also holds the eight added uses (fabricate data or references, copy or paraphrase others' work, disguise AI use, harmful or deceptive content, delegate to an AI agent, critical analysis and evaluation, personal advice, job applications); code them too, following `policy/USES-NEW-BRIEF.md` for those uses (a document must name the activity).
2. **Support and training forms**: `policy/SUPPORT-BRIEF.md` with `data/policy/support-forms.json`.
3. **Academic misconduct**: `policy/MISCONDUCT-BRIEF.md` with `data/policy/misconduct-schema.json`.
4. **Tools and data**: `policy/TOOLSDATA-BRIEF.md` with `data/policy/toolsdata-schema.json`.
5. **Risks and responsibilities**: `policy/RISKS-BRIEF.md` with `data/policy/risks-schema.json`.

Recall standard: a second reader will not check your work for omissions, so record every statement the vocabularies can hold, including a second row for a statement that supports another key (a different tier, audience, stance, bearer or strength), as `policy/COMPLETENESS-BRIEF.md` describes in its Task section. Where the briefs differ on file naming, use the paths below. Anything the document does not say stays empty; an empty result is normal.

## Inputs and outputs (batch `yN`)

- Input: `data/policy/run1/uses/yN-input.json` (the same list is in the other four folders).
- Text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text.
- Outputs, one file per document in each folder, with `<batch>` = `yN` and the coder name `y-yN`:
  - `data/policy/run1/uses/yN/<doc_id>.json`
  - `data/policy/run1/support/yN/<doc_id>.json`
  - `data/policy/run1/misconduct/yN/<doc_id>.json`
  - `data/policy/run1/toolsdata/yN/<doc_id>.json`
  - `data/policy/run1/risks/yN/<doc_id>.json`

## Validate

    node policy/uses.js validate data/policy/run1/uses/yN
    node policy/support.js validate data/policy/run1/support/yN
    node policy/misconduct.js validate data/policy/run1/misconduct/yN
    node policy/toolsdata.js validate data/policy/run1/toolsdata/yN
    node policy/risks.js validate data/policy/run1/risks/yN

Fix every ERROR. Do not run git. Use a private `mktemp -d` for scripting. If a tool call is denied, stop and report it.

## Report (under 150 words)

Per document: rows per schema (uses, support, misconduct, tools/data, risks). One line on anything that fit no value or was hard to apply, and the kind of page if it was a landing page or index with little text.
