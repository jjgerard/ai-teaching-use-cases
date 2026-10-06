# Statement types v2 (draft, not yet applied to any classification)

Built by `make-v2.js` from v1. 77 types (66 revised from v1 plus 11 new). No existing classification or audit row has been changed; `claims.json` and `presence.json` are still under v1.

## Changes

- Retired (rows become unclassified): consider_whether_ai_fits_learning_outcomes, institution_embraces_ai_enabled_education, ai_misconduct_handled_under_existing_policy, guidance_is_provisional_and_will_be_updated (blurry definitions: many 'unsure' audit results or partial fits)
- Merged must_acknowledge_or_declare_ai_use + should_or_encouraged_to_acknowledge_ai_use into acknowledge_or_declare_ai_use (strength is already recorded in the force field)
- Merged submit_declaration_form_with_assessment + declaration_must_state_tool_and_how_used into declaration_form_or_content
- Merged submitted_work_must_be_own_not_ai_generated + ai_must_not_write_assessed_work_for_you into work_must_be_own_not_written_by_ai
- Folded support_services_available_for_ai_questions into training_and_guidance_resources_provided
- Flagged general_advice on 4 types that track document length (leave out of pair tests); flagged staff_phase on 2 staff types
- Clarified ai_reference_format_or_personal_communication to include worked examples and tool entries
- Added 11 types; 4 further ideas held on a watch list (only 2 institutions each)

## New types

### Use library sources, not AI, for facts (`use_library_sources_not_ai_for_facts`, group accuracy_and_responsibility)

Students are told to find or check facts and sources through library databases or by reading the sources themselves, not through AI.

**Decision rule.** Use when the quote recommends library search, scholarly databases or reading the texts yourself in place of, or before, AI, or says AI is not a database or source of knowledge. Not this: a general warning that output may be wrong (ai_output_may_be_wrong_so_verify_it); a ban on citing AI as a source (do_not_use_ai_references_or_treat_ai_as_source).

Supporting points: bedfordshire-students-genai-202610:p12, bpp-students-genai-202610:p14, highlands-and-islands-students-genai-202610:p12, derby-students-genai-202610:p04, kcl-students-genai-202610:p12

### Do not put own work into AI (`do_not_put_own_work_into_ai_tools`, group data_and_privacy)

Students should not upload or paste their own drafts, finished work or large amounts of their own writing into AI tools.

**Decision rule.** Use when the quote tells students not to put their own original work, drafts or final assignments into external AI tools, with or without a stated reason such as ownership or detection. Not this: other people's copyright material (do_not_upload_copyright_or_third_party_material); university teaching materials (do_not_upload_university_teaching_materials); asking AI to rewrite the student's text as a use rule (no_ai_rewriting_or_paraphrasing_beyond_proofreading).

Supporting points: west-london-students-genai-202610:p14, highlands-and-islands-students-genai-202610:p04, birmingham-students-genai-202610:p08

### Misconduct terms defined (`misconduct_terms_defined`, group integrity_and_consequences)

The document defines an integrity term such as contract cheating, false authorship or passing off, rather than only prohibiting it.

**Decision rule.** Use when the quote is a definition of a misconduct term (what it 'involves', 'refers to', 'occurs when'), including definitions that mention AI as one of the means. Not this: a quote that labels AI use as misconduct without defining a term (passing_off_ai_work_as_own_is_misconduct, undeclared_or_unreferenced_ai_use_is_misconduct, use_beyond_permitted_is_misconduct).

Supporting points: wrexham-students-genai-202610:p01, york-students-genai-202610:p02, estate-management-students-genai-202610:p06

### Penalty tariff, repeat offences and factors (`sanction_tariff_and_penalty_factors`, group integrity_and_consequences)

The document sets out how penalties are decided: tariffs, treatment of first, repeat or concurrent offences, and factors weighed.

**Decision rule.** Use when the quote states how sanctions are graded or what is taken into account in choosing one (gravity, advantage gained, first offence, repeat or concurrent offences, induction period, effect of a prior warning letter). Not this: that penalties exist, or that a named penalty applies to AI misconduct (penalties_for_ai_misconduct_stated); a first or minor offence handled educatively with no tariff detail (first_or_minor_offence_handled_educatively).

Supporting points: kingston-london-students-genai-202610:p06, mtu-students-genai-202610:p09, bishop-grosseteste-students-genai-202610:p06

### How detector reports are handled (`ai_detector_reports_interpretation_or_handling`, group integrity_and_consequences)

The document says who may use AI-detection software or how its reports are read, or raises data-protection concerns about detectors.

**Decision rule.** Use when the quote restricts detector use to named officers, says how a similarity or detection report is interpreted (including that no percentage threshold applies), or raises GDPR or intellectual-property concerns about detection tools. Not this: that detectors are unreliable and not the sole basis (ai_detectors_unreliable_not_sole_basis); that detectors are not used at all (ai_detectors_not_to_be_used); that staff can detect AI use (ai_use_may_be_detected_by_staff_or_software).

Supporting points: lancashire-students-genai-202610:p12, east-anglia-students-genai-202610:p12, middlesex-london-students-genai-202610:p11

### Using tools to disguise AI use (`using_ai_or_tools_to_disguise_ai_use`, group integrity_and_consequences)

Using AI, humanising or paraphrasing tools to hide that text was AI-produced is called out as a problem.

**Decision rule.** Use when the quote names concealment or disguising of AI use (humanising text, paraphrasing or re-writing tools used to avoid detection or that produce false authorship). Not this: a general limit on rewriting the student's own text (no_ai_rewriting_or_paraphrasing_beyond_proofreading); a plain duty to declare (acknowledge_or_declare_ai_use).

Supporting points: lancashire-students-genai-202610:p06, york-students-genai-202610:p13, edinburgh-napier-students-genai-202610:p10

### Placement, employer or client rules apply (`placement_or_client_rules_apply`, group use_rules)

On placement or in work with clients or employers, students must follow the provider's AI rules and protect client information.

**Decision rule.** Use when the quote tells students to check or follow a placement provider's or employer's AI policy, protect client confidentiality or client data, or treats AI use in live recruitment activities as restricted. Not this: personal data in general (do_not_enter_personal_or_sensitive_data); university approval for a tool (institution_provides_or_recommends_tool).

Supporting points: suffolk-students-genai-202610:p07, bpp-students-genai-202610:p10, ucb-students-genai-202610:p07

### AI governance or oversight described (`ai_governance_or_oversight_described`, group staff_and_governance)

The institution describes its own governance of AI: risk assessment, accountable roles, human oversight or published principles or strategy.

**Decision rule.** Use when the quote describes how the institution governs AI (risk assessment, ethics review, a designated owner, human-in-the-loop, explainability duties, an AI strategy or governance principles) or points readers to those principles. Not this: rules students must follow when using AI (use_rules types); staff duties in setting assessments (staff_must_state_ai_expectations_in_assessments).

Supporting points: aston-students-genai-202610:p04, ucd-students-genai-202610:p05, law-students-genai-202610:p08

### AI literacy built into the curriculum (`ai_literacy_built_into_curriculum`, group support_and_training)

The institution commits to teaching AI skills or literacy within programmes, as a curriculum aim or learning outcome.

**Decision rule.** Use when the quote says AI or digital literacy is taught within courses or programmes, is a learning outcome, or is a curriculum aim. Not this: optional courses, guides or resources (training_and_guidance_resources_provided); required training before use (complete_training_before_using_ai).

Supporting points: norwich-arts-students-genai-202610:p03, sheffield-students-genai-202610:p06, aub-students-genai-202610:p12, tus-students-genai-202610:p06

### Referral and investigation process for AI cases (`specialist_referral_or_investigation_process`, group integrity_and_consequences)

The document describes how suspected AI misconduct is investigated: specialist analysis, the right to open a formal investigation, or proceeding if the student does not attend.

**Decision rule.** Use when the quote describes a step in handling a suspected case (referral to a specialist or digital-forensic function, the right to invoke formal investigation, investigation proceeding if the student is absent). Not this: appeal and fairness rights (fair_process_and_appeal_rights_in_misconduct_cases); an oral viva to test authorship (oral_viva_or_panel_to_verify_authorship); the penalty (penalties_for_ai_misconduct_stated).

Supporting points: bimm-students-genai-202610:p13, mtu-students-genai-202610:p13, winchester-students-genai-202610:p02

### Separate rules for research or publication (`separate_guidance_for_researchers_or_publication`, group use_rules)

The document points to separate guidance for doctoral or postgraduate researchers, or to supervisor or publisher rules for research use.

**Decision rule.** Use when the quote refers readers to a separate postgraduate-research or doctoral guidance document, tells researchers to agree AI use with a supervisor, or to check publishers' AI policies. Not this: research ethics approval or consent for AI use (research_use_of_ai_needs_ethics_approval_or_consent).

Supporting points: westminster-students-genai-202610:p06, coventry-students-genai-202610:p13, st-andrews-students-genai-202610:p11

## Merged types

### Work must be your own, not AI-written (`work_must_be_own_not_written_by_ai`)

Work handed in for assessment must be the student's own, and students must not hand in AI-generated content as theirs or have AI write, answer or complete the assessed work for them.

**Decision rule.** Use for an imperative or principle (must, must not, should be) that submitted work is the student's own, that AI output must not be copied, pasted or handed in as theirs, or that students must not prompt AI to produce the essay, answer or work itself (whole or large parts), with no misconduct label. Precedence: if the quote labels it misconduct, plagiarism, cheating or false authorship, use passing_off_ai_work_as_own_is_misconduct; if it only says AI should support learning or thinking, use ai_should_support_not_replace_own_thinking; if it concerns altering the student's own text, use no_ai_rewriting_or_paraphrasing_beyond_proofreading. Lighter wording such as 'poor practice' for unmodified AI content still belongs here.

### Acknowledge or declare AI use (`acknowledge_or_declare_ai_use`)

Students are required, expected or encouraged to acknowledge, disclose or declare AI use in submitted work.

**Decision rule.** Use for a general duty to acknowledge or disclose AI use where no form, no disclosure content and no citation format is the main point. Record the strength of wording (must, should, encouraged) in the point's force field, not in the type. Declaration precedence ladder: (1) a named form, coversheet, statement submitted with the work, or declaring non-use, or what the disclosure must contain (tool, version, purpose, how used): declaration_form_or_content; (2) attaching prompts or outputs: include_prompts_and_outputs_as_evidence; (3) a bare duty: this type. A statement that some uses need no acknowledgement is uses_exempt_from_acknowledgement. Not this: the consequence of not declaring (undeclared_or_unreferenced_ai_use_is_misconduct); citation mechanics (reference_ai_use_with_citation).

### AI declaration form or required content (`declaration_form_or_content`)

Students submit a standard declaration, statement or form about AI use, or a disclosure must state the tool, version and how it was used.

**Decision rule.** Use when the quote names a formal vehicle for disclosure (declaration form, coversheet, signed statement, appendix or section of the submission, scale-based statement), says when, where or whether it is submitted (including non-use statements and help completing it), or specifies what a disclosure must contain (tool name, version, date, purpose, extent, how output was used or modified, model example statements, thesis methodology statements). Takes precedence over acknowledge_or_declare_ai_use whenever a form, place or content is mentioned. Not this: attaching transcripts (include_prompts_and_outputs_as_evidence); that in-person work needs no declaration (uses_exempt_from_acknowledgement).

### Training, guidance or support offered on AI (`training_and_guidance_resources_provided`)

The institution offers or commits to provide courses, guides, checklists, toolkits, resources or named staff or services that help with AI.

**Decision rule.** Use when the quote describes or promises a course, guide, checklist, quiz, badge or resource, or names a person, team or service (library, writing support, disability team, wellbeing, IT, information security) who can help with AI-related skills, questions or data security, and does not require anyone to take the training, including pointers to guidance on how to acknowledge AI use. Precedence: if students are required or advised to complete it, use complete_training_before_using_ai. Not this: asking staff about permission (ask_tutor_when_unsure); a statement that a tool (not training) is available (institution_provides_or_recommends_tool); training woven into programmes as a curriculum aim (ai_literacy_built_into_curriculum).

## Watch list (fewer than 3 institutions, not types yet)

- AI agents or agentic browsers banned or restricted, no credential sharing: 2 institutions; needs a third before it can be a type
- Prompting-technique advice: 2 institutions
- Default rule when the assessment brief is silent: 2 institutions; other 'unless otherwise stated' quotes already fit default_ai_permitted_unless_restricted or default_ai_banned_unless_authorised
- Harmful or unsuitable uses named (deepfakes, harassment, therapy or medical advice): 2 institutions
