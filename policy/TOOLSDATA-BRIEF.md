# Tools and data audit (give this to each agent)

This audit records what a document says about **the AI tools people may use and the data they may put into them**: which kinds of tool the institution provides, approves, allows or rules out, which kinds of data may or may not be entered, what safeguards people are asked to apply, and which laws are named. Rules about what AI may be used *for* (study, assessed work) are in the uses schema, and academic misconduct is in the misconduct schema; do not record them here. Everything needs a verbatim quote. Anything the document does not say stays empty.

## Inputs

- `data/policy/toolsdata-schema.json`: the closed vocabularies (`tool_classes`, `tool_stances`, `data_types`, `data_stances`, `conditions`, `safeguards`, `legal`, `audience`). Read all of it, including the one-line definitions.
- `data/policy/run1/toolsdata/<batch>-input.json`: your documents, a list of `{doc_id}`.
- The document text: `data/policy/snapshots/<doc_id>.txt`. Work only from this text. No memory, no other pages, no inference about what the institution does elsewhere.

## Task

Read the whole document, then record every statement the vocabularies can hold, whether it is addressed to students, staff or both.

- `tools`: `{tool_class, stance, audience, name, conditions, ai_named, quote, anchor}`. The class says what kind of tool the statement is about, the stance what the document says about it. `name` is the product name when the statement names one (for example "Microsoft Copilot") and `null` otherwise. `conditions` lists schema conditions and is required (at least one) when the stance is `conditional`.
- `data`: `{data_type, stance, audience, conditions, ai_named, quote, anchor}`. The type says what kind of data, the stance what the document says about entering it into AI tools.
- `safeguards`: `{value, audience, ai_named, quote, anchor}` for steps people are asked to take (check terms and privacy, opt out of training, use an institutional account, follow the data protection policy, and so on).
- `legal`: `{value, audience, ai_named, quote, anchor}` for each law or licence the document names in connection with AI tools or data.

`audience` is `students`, `staff`, `both` or `unspecified` (a rule addressed to "users" or to "everyone" is `both`; use `unspecified` only when the text does not say who it is for).

`ai_named` is `true` only when the quote itself names AI, generative AI, an AI tool or a named AI product. A rule about "uploading university materials to websites or tools" is `false`.

One row per tool class, stance and audience; per data type, stance and audience; per safeguard and audience; per law and audience. Choose the clearest quote; if a statement appears several times, use the one that names AI. If a sentence is split by a page or table break, quote the longest contiguous part that still makes the statement. At most 60 words, no ellipsis and no "[...]".

## Rulings

- **A prohibition on uploading something to AI tools is a `data` row** (stance `prohibited`), not a tool row. "You must not upload lecture slides to external AI tools" is `university_materials` / `prohibited`; if it also says "external", add `external_or_consumer_tools` / `warned` only when the document warns about outside tools in its own words.
- **Use only tools that are approved or provided:** `approved_or_validated_tools` / `conditional` with `approved_tool_only`, or `permitted` where the document simply lists approved tools. A named institutional product (Copilot via the university account) is `institution_provided_tool` / `provided` with `name`.
- **"The university does not endorse any specific tool"** is `not_endorsed`; "we recommend university-supported tools over external ones" is `recommended` for `institution_provided_tool` and, if it contrasts with outside tools, `discouraged` is **not** assumed unless it says to avoid them.
- **AI detection tools:** record a row only when the statement concerns whether students or staff may use detectors or submit work to them (for example "do not upload student work to AI-checking sites" is `ai_detection_tools` / `prohibited` and `student_work` / `prohibited`). The institution's own use of Turnitin in misconduct cases belongs in the misconduct schema.
- **Writing and translation tools** (Grammarly, paraphrasing, translation software): record stance statements about the tool class here; the use itself (rewrite your own text, translate) is in the uses schema.
- **Consent and permission:** "do not enter others' work without their consent" is `others_work_and_copyright` / `conditional` with `needs_permission`. "Staff may put student work into approved tools only with the student's consent" is `student_work` / `conditional` with `needs_permission` and `approved_tool_only`, audience `staff`.
- **Risk warnings without a rule:** "AI tools may store what you type" is `warned` (tool class or data type as fits). Do not turn warnings into prohibitions.
- **Do not record:** what AI may be used for, acknowledgement rules, support and training, misconduct offences and penalties, staff duties unrelated to tools or data (setting assessments, marking), environmental impact, bias.
- A statement that fits no value goes in your report, not in a nearby value.

A document with nothing on tools or data gets empty lists: a valid result.

## Output: one file per document, `data/policy/run1/toolsdata/<batch>/<doc_id>.json`

    {"doc_id": "...", "coder": "<name>",
     "tools": [{"tool_class": "...", "stance": "...", "audience": "both", "name": null, "conditions": [], "ai_named": true, "quote": "...", "anchor": "..."}],
     "data": [{"data_type": "...", "stance": "...", "audience": "students", "conditions": [], "ai_named": true, "quote": "...", "anchor": null}],
     "safeguards": [{"value": "...", "audience": "both", "ai_named": false, "quote": "...", "anchor": null}],
     "legal": [{"value": "...", "audience": "unspecified", "ai_named": false, "quote": "...", "anchor": null}]}

## Validate

    node policy/toolsdata.js validate data/policy/run1/toolsdata/<batch>

Fix every ERROR. Do not run git. Use a private `mktemp -d` for scripting; do not touch files in /tmp you did not create. If a tool call is denied, stop and report it.

## Report (under 120 words)

Per document: number of tool, data, safeguard and legal rows. List anything that fit no value and any value that was hard to apply.
