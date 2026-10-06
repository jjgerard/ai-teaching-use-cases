# Statement types: deriving the vocabulary (give this to the derivation agent)

The guidance points (`data/policy/points.json`) are verbatim quotes tagged with a coarse theme, wording strength and addressee. That is too coarse to
show trends. This pass builds a **closed list of recurring statement types**: the specific things institutions actually say ("the default is that AI
is not allowed unless the module permits it", "you must keep your prompts and outputs", "do not upload university teaching materials"). Each point is
later assigned one type, so that we can count in how many institutions each type appears and which types appear together.

## Method (derive from the text, do not propose a scheme from memory)

1. Read ALL the points in your input file (`ref`, verbatim `quote`, coarse `topic`, `force`, `addressee`). Work only from these quotes.
2. Group quotes that make the same kind of claim, whatever the wording or the institution. Name each group. Merge near-duplicates; split a group when
   the claims point in different directions (for example "AI may be used for X" and "AI may not be used for X" are different types, and so are
   "must declare" and "should declare").
3. Keep a type only if it has **at least 3 supporting quotes from at least 3 different institutions** (the institution is the part of `ref` before the colon, and
   institutions differ when the document id differs). Quotes that fit no type stay unclassified; do not invent a type for a one-off.
4. Aim for 40 to 70 types. Types are statements about what to do or what holds, not topics. Do not name specific tools or institutions in a type id
   (use "named institution-provided tool", not "Copilot"). Use plain, specific ids in snake_case.
5. For each type write a decision rule precise enough that two readers would agree, and say how it differs from its nearest neighbour type.

## Output: `data/policy/run1/claims/<OUT>.json`

    {"version": "0.x", "derived_from": "<n> points from <n> institutions", "types": [
      {"id": "snake_case_id", "label": "<8 words max, plain English>", "group": "<one of: use_rules, disclosure_and_evidence, referencing, data_and_privacy, tools,
        assessment_design, integrity_and_consequences, accuracy_and_responsibility, support_and_training, staff_and_governance, ethics_and_equity, other>",
       "definition": "<one sentence>", "decision_rule": "<when to use it, and how it differs from the nearest type>",
       "examples": ["<ref>", "<ref>", "<ref>"], "n_institutions": <int>, "n_points": <int>}],
     "unclassified_note": "<one or two sentences on what kinds of quotes stayed unclassified>"}

`examples` are refs copied from the input. Do not paraphrase quotes in the file. Validate with `node policy/claims.js types <file>`.

## Report (under 200 words)

Number of types, number of input points assigned to some type (count them), the biggest 5 types, and anything you found hard to separate.
