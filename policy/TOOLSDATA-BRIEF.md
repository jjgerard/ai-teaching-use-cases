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

## Rulings from the pilot (apply them)

Two independent coders agreed on 75% of tool, data, safeguard and law values (tools 54%, data 78%, safeguards 100%, laws 86%). The disagreements were mostly about stances for tools, so:

- **`not_endorsed`, `discouraged`, `prohibited`:** "does not support", "does not recommend", "does not endorse" is `not_endorsed`. "Advises against", "should avoid", "not recommended for use" is `discouraged`. "Must not use", "not permitted" is `prohibited`. AI detectors the institution "does not support" are `ai_detection_tools` / `not_endorsed`.
- **Outside tools as a class** (`external_or_consumer_tools`): record a row only when the document states a general stance about tools outside the institution's provision: `prohibited` if they are banned outright, `conditional` (with `approved_tool_only` or `meets_security_policy`) if they are allowed under conditions, `warned` if the document only warns. A ban on entering one kind of data into outside tools is a `data` row, not a tool row.
- **Writing and translation tools** (Grammarly and the like): the stance is the document's own rule about the tool class. "Basic checks are fine, generative features not unless permitted" is `conditional` with `needs_permission`; do not add a second `warned` row for the same sentence. `provided` only when the institution supplies the tool.
- **One row per class, stance and audience** can leave out a second provided tool (for example a screen-reader tool beside Copilot). Record the institution's main AI tool and put the product name in `name`.
- **`permitted` data rows** only where the document explicitly says the data may be entered ("you may enter your own work"). Do not infer permission from silence.
- **Personal and confidential:** "personal, confidential or sensitive data" gets both a `personal_data` row and a `confidential_or_client_data` row when the quote names both.
- **Assessments:** assessment briefs, exam papers and marking schemes the institution sets are `assessment_material`. Work students submit is `student_work`. "Assessments" with no further word, in a rule about university materials, is `university_materials`.
- **Laws:** "intellectual property law" counts as `copyright`. `terms_of_service` only where the document names a tool's terms or licence; "check the terms" as an instruction is also the safeguard `check_terms_and_privacy`.
- **Conditions:** under-18 or parental-permission rules are `conditional` with `needs_permission`. "Ethics review might be required" is `ethics_approval`. A rule that names the institution's own policy (information security, ICT policy) is `meets_security_policy`.
- **Fit no value (do not record, list in your report):** age bans, impact-assessment duties (DPIA and similar), named national guidelines, assistive technology for disability adjustments, the institution's own use of detection tools, and use rules for particular tools (they belong in the uses schema).

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
