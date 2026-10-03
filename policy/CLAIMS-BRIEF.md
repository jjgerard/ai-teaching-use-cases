# Classifying points into statement types (give this to each classification agent)

You assign each guidance point to one **statement type** from a closed vocabulary (`data/policy/run1/claims/<types file>`), so that statements can be
counted and compared across institutions. Work only from the verbatim `quote` of each point and the vocabulary's definitions and decision rules.
Do not use memory, other web pages, or other agents' classifications.

## Input and output

Input: a JSON array of points (`ref`, `quote`, `topic`, `force`, `addressee`). The `topic`, `force` and `addressee` are hints from an earlier pass, not answers.
Output: `<OUT>/<name>.json`

    {"coder": "<name>", "rows": [
      {"ref": "<ref>", "claim": "<type id | unclassified>", "claim2": "<a different type id, or null>",
       "fit": "clear | partial | none", "suggest": "<at most 12 words, or null>"}]}

One row for EVERY input point.

## Rules

- Choose the single type whose definition and decision rule best match what the quote says. Read the decision rules of neighbouring types before choosing.
- `claim2`: use only when the quote makes a second distinct claim that another type captures. Most points need none.
- `fit`: `clear` when a type matches well; `partial` when the best type only half captures it (say what is missing in `suggest`); `none` when no type fits: then
  `claim` is `unclassified` and `suggest` is a short label for the missing type. Never force a poor match: an honest `unclassified` is more useful than a wrong type.
- Direction matters: types that say "may" and "may not" are different. Wording strength matters where the vocabulary separates "must" from "should".
- Validate with `node policy/claims.js validate <types file> <your output dir>` and fix every ERROR. Do not run git. Use a private `mktemp -d` for scratch.

## Report (under 100 words)

Counts of clear / partial / none, and the three most common `suggest` themes if any.
