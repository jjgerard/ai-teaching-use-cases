# Review of the 74 statement types (v1): which are least helpful

Evidence: `vocab-usage.tsv` (made by `vocab-usage.js`): for each type, the number of the 115 documents where it was found (extracted points plus whole-document audit), points classified to it, share of those points that fit only partly, audit "unsure" count, and the closest other type by document overlap (Jaccard). Not yet computed per type: double-coding agreement.

## 1. Blurry definition (retire or tighten)

- `consider_whether_ai_fits_learning_outcomes`: 11 found, 23 unsure. The audit coder could rarely tell whether a document says this.
- `institution_embraces_ai_enabled_education`: 58 found, 19 unsure, 27% partial. Tone, not a rule.
- `ai_misconduct_handled_under_existing_policy`: 36 found, 22 unsure. Usually an inference from silence.
- `guidance_is_provisional_and_will_be_updated`: a property of the document, not a rule. 33% partial.
- `should_or_encouraged_to_acknowledge_ai_use`: 33% partial, 7 unsure against 12 found. The force field already records should versus must.
- `support_services_available_for_ai_questions`: 18 unsure, 39 found; overlaps `training_and_guidance_resources_provided`.
- `ai_output_may_be_included_when_assessment_allows`: 25% partial, 11 unsure; overlaps `some_assessments_require_or_build_in_ai_use`.

## 2. Too rare to compare across regions (8 or fewer of 115 documents)

`get_consent_before_recording_or_transcribing_others` (5), `first_or_minor_offence_handled_educatively` (6), `strict_liability_ignorance_no_defence` (6), `students_not_required_to_use_ai` (6), `ai_detectors_not_to_be_used` (7), `compliant_declared_use_not_misconduct` (7), `institution_does_not_endorse_or_provide_listed_tools` (7), `account_and_age_restrictions_on_ai_services` (8), `staff_not_to_use_ai_to_grade_or_give_feedback` (8), `research_use_of_ai_needs_ethics_approval_or_consent` (8). With 3 documents in Northern Ireland and 7 in Wales, no region can show a difference on these. Keep them for description, not for tests. The two staff types belong to the staff phase.

## 3. Near-duplicates (merge candidates)

- Declaration cluster: `must_acknowledge_or_declare_ai_use`, `declaration_must_state_tool_and_how_used`, `submit_declaration_form_with_assessment`, `should_or_encouraged_to_acknowledge_ai_use`, `reference_ai_use_with_citation`. Six-way split of one theme; overlaps up to 0.45.
- "Do not submit AI work as yours": `passing_off_ai_work_as_own_is_misconduct`, `submitted_work_must_be_own_not_ai_generated`, `ai_must_not_write_assessed_work_for_you`.
- `keep_record_of_ai_interactions` and `include_prompts_and_outputs_as_evidence` (keep versus hand in).
- `do_not_upload_copyright_or_third_party_material` and `do_not_upload_university_teaching_materials`; `do_not_enter_personal_or_sensitive_data`, `personal_or_confidential_data_only_under_stated_conditions` and `comply_with_data_protection_law_and_policy`.

## 4. Generic advice that tracks document length

`ai_output_may_be_wrong_so_verify_it` (72), `bias_and_exclusion_risks_to_consider` (55), `ai_should_support_not_replace_own_thinking` (57), `ai_permitted_for_study_and_preparation` (64), `institution_embraces_ai_enabled_education` (58). They overlap each other at 0.5 to 0.67 because long documents say all of them. They produce many "significant" pairs that are mostly document size. `training_and_guidance_resources_provided` (92 of 115) varies little across institutions, so it separates nothing; it is still worth reporting as a finding.

## 5. Gaps in the other direction

See `NEXT-PLAN.md`: about 16 recurring statements with no type yet.

## Suggested v2 changes (not applied)

Retire 4 (section 1, first four plus `support_services`), fold `should_or_encouraged` into `must_acknowledge_or_declare_ai_use`, collapse the declaration cluster to two types (duty, content or form), merge the three "own work" types into two, flag section 4 types as "general advice" and leave them out of the pair tests, and add the 16 candidates. Result: roughly 74 to 70 retained plus 16 new. Nothing changes until you agree, because any change means re-running the classification and the audit for the affected types.
