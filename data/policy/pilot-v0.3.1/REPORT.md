# Pilot round 3: holdout (codebook 0.3.1)

Eight documents the vocabulary was not designed from (Helsinki, Glasgow, Exeter, Harvard FAS, Cambridge staff
assessment, Irish HEA framework, Picardie charter in French, Toronto FAQ), coded by four coders (`codes.json`).
Four of the eight were independently coded a second time by two further coders
(`double-coded/codes-second-coder.json`). Both sets validate against `codebook-0.3.1.json` with 0 errors.

| | Set A (8 docs) | Set B (4 docs) |
|---|---|---|
| cells | 620 | 313 |
| coded | 229 | 135 |
| not_stated | 252 | 119 |
| not_applicable | 127 | 57 |
| misfit | 12 (1.9%) | 2 (0.6%) |

Misfit rate across the three rounds: 3.6% (round 1) -> 1.6% (round 2, same documents as the revision) ->
1.9% (round 3, unseen documents). The holdout rate is close to the tuned rate, so the revisions generalised
rather than overfitting the first eight documents.

## Independent agreement (A vs B, same codebook version, 4 documents)

306 cells compared. Kind of answer agrees on 96%. Where both gave a value (119 cells), exact agreement is
92% and mean Jaccard overlap 96%. Disagreements concentrate in `precedence`, `use_*`, `external_frameworks_adopted`.

**Cautions.** All coders are instances of one model, so this is not human-human reliability and is probably
optimistic. Four documents is a small sample. The method still requires human double-coding of a sample.

## Remaining weak spots (decision rules, not missing values)

- `use_*` where a blanket default ban makes every use "conditional" (Toronto, Maynooth, Picardie).
- `default_when_silent` when the rule is about acknowledgement rather than permission.
- `precedence` for documents that defer to institutional autonomy.
- `issued_by_type` for "Office of ..." units.
- `institutional_posture`: permit_within_rules vs encourage is a judgement call everywhere it appears.
- `states_user_remains_responsible` is true in almost every document; do not use it to compare.

## v0.4.0 changes (from the holdout)

16 values added, each seen in a holdout document (referencing, marking and feedback, access, peer review,
misconduct framing, sector monitoring, inclusion by design, sector-network templates, licensed third-party
tools, academic executive offices, partial precedence, validated-tools-only, acknowledgement-only defaults);
`ai_marking_feedback_rule` becomes multi; new variable `restricts_model_training_on_user_work`; row field
`rule_source` (own_text | template_wording | quoted_other_policy) for rules that come from sample wording or
another body's quoted text; rule that a blanket permission alone leaves `use_*` not_stated.

## Not data yet

`data/policy/codes.json` is empty: the dataset proper starts after v0.4.0, because rows coded under one version
are rejected under another. Sixteen documents are registered; none is coded under v0.4.0.
