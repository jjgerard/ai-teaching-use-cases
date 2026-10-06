# Vocabulary reassessment: from 77 statement types to specific vocabularies

Prompted by the request to look at specific uses. The 77 flat statement types mix very different things (a use rule, a duty, a service, a penalty). Most can be folded into a few **faceted vocabularies**, each a closed schema with specific values and a stance for every value, so that every institution gets a value or an explicit "not stated". Mapping: `claims/facet-map.json` (made by `facet-map.js`).

## Facets

### Uses of AI (use x setting x stance x acknowledgement) (20 types folded)

| Statement type | Becomes |
|---|---|
| Default: no AI unless expressly permitted | default_when_silent = prohibit_all |
| Default: AI allowed unless restricted | default_when_silent = permit_all |
| No AI at all in a given assessment | stance prohibited, context assessed_work (whole assessment) |
| AI output may be included where assessment allows | use include_ai_output_in_work |
| Work must be your own, not AI-written | use generate_assessed_text = prohibited |
| No AI rewriting beyond proofreading | use rewrite_or_paraphrase_own_text = prohibited |
| Translation tools restricted or conditional | use translate |
| Do not cite AI or its references | use rely_on_ai_as_source = prohibited |
| Spelling, grammar and proofreading help allowed | use check_language |
| AI allowed for study, revision and preparation | uses revise_or_practise, explain_or_tutor, generate_ideas, plan_or_structure (context study) |
| Assistive technology and adjustments allowed | use assistive_use |
| Lecturer or module leader sets AI rules | decided_by = module_or_lecturer |
| Follow assessment brief and local guidance | decided_by = assessment_brief |
| Assessments sorted into AI-use tiers | decided_by = tiered_scale |
| Some assessments require or critique AI use | stance required, context assessed_work |
| Students are not required to use AI | stance field: not required (condition) |
| Placement, employer or client rules apply | condition other_rules_apply (placement or client) |
| Separate rules for research or publication | context research_or_thesis |
| Use library sources, not AI, for facts | use rely_on_ai_as_source = discouraged |
| Account and age limits on AI services | condition account_or_age_limit |

### Acknowledgement (duty, exempt uses, form, contents, records, referencing, consequence) (11 types folded)

| Statement type | Becomes |
|---|---|
| Acknowledge or declare AI use | duty |
| AI declaration form or required content | location, contents |
| Include prompts and outputs as evidence | contents prompts_and_outputs |
| Keep a record of your AI interactions | records |
| Keep drafts and notes to prove authorship | records (drafts) |
| Follow the referencing guide for AI | referencing = follow_guide |
| Cite AI use like any other source | referencing = cite_in_reference_list |
| How to format an AI citation | referencing (format) |
| Some AI uses need no acknowledgement | exempt_uses |
| Hiding or not acknowledging AI is misconduct | consequence = misconduct |
| Properly declared permitted use is not misconduct | consequence = safe_if_declared |

### Support and guidance (forms, requirement level) (4 types folded)

| Statement type | Becomes |
|---|---|
| Training, guidance or support offered on AI | support forms (done) |
| Complete training before using AI | support forms, requirement mandatory/advised |
| AI literacy built into the curriculum | support forms (course in curriculum) |
| Ask your tutor if unsure | support forms: named_academic_support (only if presented as help) |

### Data and tools (what may go into AI tools, which tools, tool properties) (12 types folded)

| Statement type | Becomes |
|---|---|
| Do not enter personal or confidential data | data class personal |
| Data only with approval or safeguards | data class personal, stance conditional |
| Do not upload university teaching materials | data class university_materials |
| Mind copyright when uploading others' work | data class third_party_copyright |
| Do not put own work into AI | data class own_work |
| Get consent before recording or transcribing others | data class recordings |
| Comply with data protection law and policy | data: legal duty |
| AI tools may keep or train on input | tool property: stores or trains on inputs |
| Provided tool has data protection assurances | tool property: assurances |
| Institution provides, recommends or requires a tool | tool status: provided |
| Institution does not endorse listed AI tools | tool status: not endorsed |
| Turn off or avoid built-in AI features | tool status: built-in features |

### Integrity (what counts as misconduct, detection, process, outcome) (16 types folded)

| Statement type | Becomes |
|---|---|
| Presenting AI work as own is misconduct | what counts as misconduct: passing_off |
| Use beyond what is permitted is misconduct | what counts: beyond_permitted |
| Fabricated references or data is misconduct | what counts: fabrication |
| Using tools to disguise AI use | what counts: disguise |
| Misconduct terms defined | definitions |
| Penalties for AI misconduct stated | outcome: penalties |
| Penalty tariff, repeat offences and factors | outcome: tariff |
| First offences handled educatively | outcome: educative first offence |
| Ignorance or accident is no defence | rule: strict liability |
| Oral questioning to verify authorship | process: viva |
| Fair process and right to appeal | process: appeal |
| Referral and investigation process for AI cases | process: referral |
| AI use may be spotted or detected | detection: may be detected |
| AI detection tools not used | detection: not used |
| AI detectors unreliable, not sole evidence | detection: unreliable |
| How detector reports are handled | detection: handling |

### Risks and responsibilities (accuracy, bias, environment, others work, student responsibility) (7 types folded)

| Statement type | Becomes |
|---|---|
| AI output can be wrong: check it | risk: accuracy |
| You are responsible for AI-derived content | responsibility: student |
| Consider bias and exclusion in AI | risk: bias |
| AI has an environmental cost | risk: environment |
| AI draws on others' work without credit | risk: others' work |
| Ensure equal access to AI tools | risk: equal access |
| AI should support, not replace, your thinking | principle: own thinking |

### Roles and governance (staff duties, assessment design, governance, research ethics) (7 types folded)

| Statement type | Becomes |
|---|---|
| Staff must state AI expectations clearly | staff duty |
| Assessment redesigned to test own understanding | assessment design |
| Staff should not use AI to mark | staff duty |
| Staff should disclose their own AI use | staff duty |
| AI governance or oversight described | governance |
| Students have a voice in shaping AI policy | governance: student voice |
| Research use of AI needs ethics approval | research ethics |

## Status

- **Built:** support forms (10 forms, requirement, audience: `data/policy/support-forms.json`); uses and acknowledgement (19 uses x 5 settings x 5 stances, acknowledgement requirement per use, default when silent, decided by, acknowledgement mechanics: `data/policy/uses-schema.json`, piloted).
- **Drafted, not built:** data and tools (data classes: personal, confidential, third-party copyright, university materials, own work, recordings; tool status: provided, recommended, not endorsed, built-in features; tool properties); integrity (what counts as misconduct, detection stance, process steps, outcomes); risks and responsibility; roles and governance.
- **Left over as plain statements:** none in the mapping; the principle that AI should support not replace your thinking is kept under risks and responsibility as a principle value.
