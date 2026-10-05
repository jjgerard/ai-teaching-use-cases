# Targeted audit for the eight added uses (give this to each agent)

The uses vocabulary was extended with the activities at the "cannot" end of the spectrum, so that one list with one permissibility scale covers what AI may and may not be used for. The earlier audit did not look for these eight.
Follow `policy/USES-BRIEF.md` for everything (rows, stances, settings, conditions, `acknowledge`, quotes, rulings) with these differences:

- Only the eight new uses: `fabricate_data_or_references`, `copy_or_paraphrase_others_work`, `disguise_ai_use`, `harmful_or_deceptive_content`, `delegate_to_ai_agent`, `critical_analysis_and_evaluation`, `personal_advice`, `job_applications`. Read their definitions in `data/policy/uses-schema.json`. Write rows for no other use.
- Input: `data/policy/run1/uses-new/nN-input.json`. Output: one file per document in `data/policy/run1/uses-new/nN/<doc_id>.json`, with the same shape as the main audit but only `uses` filled: set `"default_when_silent": null`, `"decided_by": []`, `"acknowledgement": null`.
- A rule that something is **prohibited or misconduct** is the stance `prohibited` for that use (for example, "fabricating data is misconduct" is `fabricate_data_or_references` / prohibited; "using a humaniser to hide AI use" is `disguise_ai_use` / prohibited; "AI agents are not permitted" is `delegate_to_ai_agent` / prohibited). Use the setting the quote gives, else `unspecified`.
- The document must name the activity. Do not stretch a general ban to cover these uses.
- Expect most documents to have none of these: an empty `uses` list is a normal result.

Validate with `node policy/uses.js validate data/policy/run1/uses-new/nN`. Do not run git. Use a private `mktemp -d` for scripts. If a tool call is denied, stop and report it.

Report (under 60 words): per document, the rows found (use and stance).
