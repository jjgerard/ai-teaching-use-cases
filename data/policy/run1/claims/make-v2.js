// Builds statement-types.v2.json from v1: retire, merge, flag, and add new types. Run from repo root.
const fs = require("fs"); const D = "data/policy/run1/claims/";
const v1 = JSON.parse(fs.readFileSync(D + "statement-types.v1.json", "utf8"));
const T = Object.fromEntries(v1.types.map((t) => [t.id, JSON.parse(JSON.stringify(t))]));
const map = {}; // v1 id -> v2 id | null (retired)
const RETIRED = ["consider_whether_ai_fits_learning_outcomes", "institution_embraces_ai_enabled_education", "ai_misconduct_handled_under_existing_policy", "guidance_is_provisional_and_will_be_updated"];
for (const id of RETIRED) map[id] = null;
const merges = [
  { from: ["must_acknowledge_or_declare_ai_use", "should_or_encouraged_to_acknowledge_ai_use"], id: "acknowledge_or_declare_ai_use", label: "Acknowledge or declare AI use", group: "disclosure_and_evidence",
    definition: "Students are required, expected or encouraged to acknowledge, disclose or declare AI use in submitted work.",
    decision_rule: "Use for a general duty to acknowledge or disclose AI use where no form, no disclosure content and no citation format is the main point. Record the strength of wording (must, should, encouraged) in the point's force field, not in the type. Declaration precedence ladder: (1) a named form, coversheet, statement submitted with the work, or declaring non-use, or what the disclosure must contain (tool, version, purpose, how used): declaration_form_or_content; (2) attaching prompts or outputs: include_prompts_and_outputs_as_evidence; (3) a bare duty: this type. A statement that some uses need no acknowledgement is uses_exempt_from_acknowledgement. Not this: the consequence of not declaring (undeclared_or_unreferenced_ai_use_is_misconduct); citation mechanics (reference_ai_use_with_citation)." },
  { from: ["submit_declaration_form_with_assessment", "declaration_must_state_tool_and_how_used"], id: "declaration_form_or_content", label: "AI declaration form or required content", group: "disclosure_and_evidence",
    definition: "Students submit a standard declaration, statement or form about AI use, or a disclosure must state the tool, version and how it was used.",
    decision_rule: "Use when the quote names a formal vehicle for disclosure (declaration form, coversheet, signed statement, appendix or section of the submission, scale-based statement), says when, where or whether it is submitted (including non-use statements and help completing it), or specifies what a disclosure must contain (tool name, version, date, purpose, extent, how output was used or modified, model example statements, thesis methodology statements). Takes precedence over acknowledge_or_declare_ai_use whenever a form, place or content is mentioned. Not this: attaching transcripts (include_prompts_and_outputs_as_evidence); that in-person work needs no declaration (uses_exempt_from_acknowledgement)." },
  { from: ["submitted_work_must_be_own_not_ai_generated", "ai_must_not_write_assessed_work_for_you"], id: "work_must_be_own_not_written_by_ai", label: "Work must be your own, not AI-written", group: "use_rules",
    definition: "Work handed in for assessment must be the student's own, and students must not hand in AI-generated content as theirs or have AI write, answer or complete the assessed work for them.",
    decision_rule: "Use for an imperative or principle (must, must not, should be) that submitted work is the student's own, that AI output must not be copied, pasted or handed in as theirs, or that students must not prompt AI to produce the essay, answer or work itself (whole or large parts), with no misconduct label. Precedence: if the quote labels it misconduct, plagiarism, cheating or false authorship, use passing_off_ai_work_as_own_is_misconduct; if it only says AI should support learning or thinking, use ai_should_support_not_replace_own_thinking; if it concerns altering the student's own text, use no_ai_rewriting_or_paraphrasing_beyond_proofreading. Lighter wording such as 'poor practice' for unmodified AI content still belongs here." },
  { from: ["training_and_guidance_resources_provided", "support_services_available_for_ai_questions"], id: "training_and_guidance_resources_provided", label: "Training, guidance or support offered on AI", group: "support_and_training",
    definition: "The institution offers or commits to provide courses, guides, checklists, toolkits, resources or named staff or services that help with AI.",
    decision_rule: "Use when the quote describes or promises a course, guide, checklist, quiz, badge or resource, or names a person, team or service (library, writing support, disability team, wellbeing, IT, information security) who can help with AI-related skills, questions or data security, and does not require anyone to take the training, including pointers to guidance on how to acknowledge AI use. Precedence: if students are required or advised to complete it, use complete_training_before_using_ai. Not this: asking staff about permission (ask_tutor_when_unsure); a statement that a tool (not training) is available (institution_provides_or_recommends_tool); training woven into programmes as a curriculum aim (ai_literacy_built_into_curriculum)." }
];
const out = []; const done = new Set();
for (const t of v1.types) {
  if (RETIRED.includes(t.id) || done.has(t.id)) continue;
  const m = merges.find((x) => x.from.includes(t.id));
  if (m) {
    for (const f of m.from) { done.add(f); map[f] = m.id; }
    const ex = [...new Set(m.from.flatMap((f) => T[f].examples))];
    out.push({ id: m.id, label: m.label, group: m.group, definition: m.definition, decision_rule: m.decision_rule, examples: ex.slice(0, 8), n_institutions: null, n_points: null, v1_merged_from: m.from });
  } else { map[t.id] = t.id; out.push(t); }
}
// stale ids left in v1 rules
map.do_not_submit_ai_generated_content_as_own = "work_must_be_own_not_written_by_ai"; map.recommended_institution_provided_tool = "institution_provides_or_recommends_tool"; map.ai_output_can_be_wrong_or_fabricated = "ai_output_may_be_wrong_so_verify_it";
// cross-references in decision rules
const rep = (s) => s.replace(/\b[a-z][a-z0-9_]{12,}\b/g, (w) => (w in map ? (map[w] === null ? "(no type: retired)" : map[w]) : w));
for (const t of out) { if (!t.v1_merged_from) t.decision_rule = rep(t.decision_rule); }
// small clarifications
const cite = out.find((t) => t.id === "ai_reference_format_or_personal_communication");
cite.decision_rule += " Includes worked examples of citing an AI response and entries for citing a tool as a website or software.";
// flags
for (const id of ["ai_output_may_be_wrong_so_verify_it", "bias_and_exclusion_risks_to_consider", "ai_should_support_not_replace_own_thinking", "ai_permitted_for_study_and_preparation"]) out.find((t) => t.id === id).general_advice = true;
for (const id of ["staff_not_to_use_ai_to_grade_or_give_feedback", "staff_should_disclose_own_ai_use"]) out.find((t) => t.id === id).staff_phase = true;
// new types, each supported by points from at least 3 institutions
const N = (id, label, group, definition, decision_rule, examples) => out.push({ id, label, group, definition, decision_rule, examples, n_institutions: null, n_points: null, new_in_v2: true });
N("use_library_sources_not_ai_for_facts", "Use library sources, not AI, for facts", "accuracy_and_responsibility",
  "Students are told to find or check facts and sources through library databases or by reading the sources themselves, not through AI.",
  "Use when the quote recommends library search, scholarly databases or reading the texts yourself in place of, or before, AI, or says AI is not a database or source of knowledge. Not this: a general warning that output may be wrong (ai_output_may_be_wrong_so_verify_it); a ban on citing AI as a source (do_not_use_ai_references_or_treat_ai_as_source).",
  ["bedfordshire-students-genai-202610:p12", "bpp-students-genai-202610:p14", "highlands-and-islands-students-genai-202610:p12", "derby-students-genai-202610:p04", "kcl-students-genai-202610:p12"]);
N("do_not_put_own_work_into_ai_tools", "Do not put own work into AI", "data_and_privacy",
  "Students should not upload or paste their own drafts, finished work or large amounts of their own writing into AI tools.",
  "Use when the quote tells students not to put their own original work, drafts or final assignments into external AI tools, with or without a stated reason such as ownership or detection. Not this: other people's copyright material (do_not_upload_copyright_or_third_party_material); university teaching materials (do_not_upload_university_teaching_materials); asking AI to rewrite the student's text as a use rule (no_ai_rewriting_or_paraphrasing_beyond_proofreading).",
  ["west-london-students-genai-202610:p14", "highlands-and-islands-students-genai-202610:p04", "birmingham-students-genai-202610:p08"]);
N("misconduct_terms_defined", "Misconduct terms defined", "integrity_and_consequences",
  "The document defines an integrity term such as contract cheating, false authorship or passing off, rather than only prohibiting it.",
  "Use when the quote is a definition of a misconduct term (what it 'involves', 'refers to', 'occurs when'), including definitions that mention AI as one of the means. Not this: a quote that labels AI use as misconduct without defining a term (passing_off_ai_work_as_own_is_misconduct, undeclared_or_unreferenced_ai_use_is_misconduct, use_beyond_permitted_is_misconduct).",
  ["wrexham-students-genai-202610:p01", "york-students-genai-202610:p02", "estate-management-students-genai-202610:p06"]);
N("sanction_tariff_and_penalty_factors", "Penalty tariff, repeat offences and factors", "integrity_and_consequences",
  "The document sets out how penalties are decided: tariffs, treatment of first, repeat or concurrent offences, and factors weighed.",
  "Use when the quote states how sanctions are graded or what is taken into account in choosing one (gravity, advantage gained, first offence, repeat or concurrent offences, induction period, effect of a prior warning letter). Not this: that penalties exist, or that a named penalty applies to AI misconduct (penalties_for_ai_misconduct_stated); a first or minor offence handled educatively with no tariff detail (first_or_minor_offence_handled_educatively).",
  ["kingston-london-students-genai-202610:p06", "mtu-students-genai-202610:p09", "bishop-grosseteste-students-genai-202610:p06"]);
N("ai_detector_reports_interpretation_or_handling", "How detector reports are handled", "integrity_and_consequences",
  "The document says who may use AI-detection software or how its reports are read, or raises data-protection concerns about detectors.",
  "Use when the quote restricts detector use to named officers, says how a similarity or detection report is interpreted (including that no percentage threshold applies), or raises GDPR or intellectual-property concerns about detection tools. Not this: that detectors are unreliable and not the sole basis (ai_detectors_unreliable_not_sole_basis); that detectors are not used at all (ai_detectors_not_to_be_used); that staff can detect AI use (ai_use_may_be_detected_by_staff_or_software).",
  ["lancashire-students-genai-202610:p12", "east-anglia-students-genai-202610:p12", "middlesex-london-students-genai-202610:p11"]);
N("using_ai_or_tools_to_disguise_ai_use", "Using tools to disguise AI use", "integrity_and_consequences",
  "Using AI, humanising or paraphrasing tools to hide that text was AI-produced is called out as a problem.",
  "Use when the quote names concealment or disguising of AI use (humanising text, paraphrasing or re-writing tools used to avoid detection or that produce false authorship). Not this: a general limit on rewriting the student's own text (no_ai_rewriting_or_paraphrasing_beyond_proofreading); a plain duty to declare (acknowledge_or_declare_ai_use).",
  ["lancashire-students-genai-202610:p06", "york-students-genai-202610:p13", "edinburgh-napier-students-genai-202610:p10"]);
N("placement_or_client_rules_apply", "Placement, employer or client rules apply", "use_rules",
  "On placement or in work with clients or employers, students must follow the provider's AI rules and protect client information.",
  "Use when the quote tells students to check or follow a placement provider's or employer's AI policy, protect client confidentiality or client data, or treats AI use in live recruitment activities as restricted. Not this: personal data in general (do_not_enter_personal_or_sensitive_data); university approval for a tool (institution_provides_or_recommends_tool).",
  ["suffolk-students-genai-202610:p07", "bpp-students-genai-202610:p10", "ucb-students-genai-202610:p07"]);
N("ai_governance_or_oversight_described", "AI governance or oversight described", "staff_and_governance",
  "The institution describes its own governance of AI: risk assessment, accountable roles, human oversight or published principles or strategy.",
  "Use when the quote describes how the institution governs AI (risk assessment, ethics review, a designated owner, human-in-the-loop, explainability duties, an AI strategy or governance principles) or points readers to those principles. Not this: rules students must follow when using AI (use_rules types); staff duties in setting assessments (staff_must_state_ai_expectations_in_assessments).",
  ["aston-students-genai-202610:p04", "ucd-students-genai-202610:p05", "law-students-genai-202610:p08"]);
N("ai_literacy_built_into_curriculum", "AI literacy built into the curriculum", "support_and_training",
  "The institution commits to teaching AI skills or literacy within programmes, as a curriculum aim or learning outcome.",
  "Use when the quote says AI or digital literacy is taught within courses or programmes, is a learning outcome, or is a curriculum aim. Not this: optional courses, guides or resources (training_and_guidance_resources_provided); required training before use (complete_training_before_using_ai).",
  ["norwich-arts-students-genai-202610:p03", "sheffield-students-genai-202610:p06", "aub-students-genai-202610:p12", "tus-students-genai-202610:p06"]);
N("specialist_referral_or_investigation_process", "Referral and investigation process for AI cases", "integrity_and_consequences",
  "The document describes how suspected AI misconduct is investigated: specialist analysis, the right to open a formal investigation, or proceeding if the student does not attend.",
  "Use when the quote describes a step in handling a suspected case (referral to a specialist or digital-forensic function, the right to invoke formal investigation, investigation proceeding if the student is absent). Not this: appeal and fairness rights (fair_process_and_appeal_rights_in_misconduct_cases); an oral viva to test authorship (oral_viva_or_panel_to_verify_authorship); the penalty (penalties_for_ai_misconduct_stated).",
  ["bimm-students-genai-202610:p13", "mtu-students-genai-202610:p13", "winchester-students-genai-202610:p02"]);
N("separate_guidance_for_researchers_or_publication", "Separate rules for research or publication", "use_rules",
  "The document points to separate guidance for doctoral or postgraduate researchers, or to supervisor or publisher rules for research use.",
  "Use when the quote refers readers to a separate postgraduate-research or doctoral guidance document, tells researchers to agree AI use with a supervisor, or to check publishers' AI policies. Not this: research ethics approval or consent for AI use (research_use_of_ai_needs_ethics_approval_or_consent).",
  ["westminster-students-genai-202610:p06", "coventry-students-genai-202610:p13", "st-andrews-students-genai-202610:p11"]);
const ids = new Set(out.map((t) => t.id));
// every cross-reference must resolve
const bad = []; for (const t of out) for (const w of t.decision_rule.match(/\b[a-z][a-z0-9_]{12,}\b/g) || []) if (w.includes("_") && !ids.has(w) && !/^(no_type)/.test(w)) bad.push(t.id + " -> " + w);
const v2 = { version: "2.0", derived_from: "v1 (74 types) revised after the presence audit; 11 types added from unclassified points", types: out,
  unclassified_note: v1.unclassified_note,
  watch_list: [
    { idea: "AI agents or agentic browsers banned or restricted, no credential sharing", institutions: ["aston-students-genai-202610", "edinburgh-student-genai-guidelines-202610"], why: "2 institutions; needs a third before it can be a type" },
    { idea: "Prompting-technique advice", institutions: ["hull-students-genai-202610", "heriot-watt-students-genai-202610"], why: "2 institutions" },
    { idea: "Default rule when the assessment brief is silent", institutions: ["bristol-students-genai-202610", "birkbeck-london-students-genai-202610"], why: "2 institutions; other 'unless otherwise stated' quotes already fit default_ai_permitted_unless_restricted or default_ai_banned_unless_authorised" },
    { idea: "Harmful or unsuitable uses named (deepfakes, harassment, therapy or medical advice)", institutions: ["ucb-students-genai-202610", "manchester-students-genai-202610"], why: "2 institutions" }
  ],
  v1_to_v2: map,
  changes: [
    "Retired (rows become unclassified): " + RETIRED.join(", ") + " (blurry definitions: many 'unsure' audit results or partial fits)",
    "Merged must_acknowledge_or_declare_ai_use + should_or_encouraged_to_acknowledge_ai_use into acknowledge_or_declare_ai_use (strength is already recorded in the force field)",
    "Merged submit_declaration_form_with_assessment + declaration_must_state_tool_and_how_used into declaration_form_or_content",
    "Merged submitted_work_must_be_own_not_ai_generated + ai_must_not_write_assessed_work_for_you into work_must_be_own_not_written_by_ai",
    "Folded support_services_available_for_ai_questions into training_and_guidance_resources_provided",
    "Flagged general_advice on 4 types that track document length (leave out of pair tests); flagged staff_phase on 2 staff types",
    "Clarified ai_reference_format_or_personal_communication to include worked examples and tool entries",
    "Added 11 types; 4 further ideas held on a watch list (only 2 institutions each)"
  ] };
fs.writeFileSync(D + "statement-types.v2.json", JSON.stringify(v2, null, 1));
console.log("types", out.length, "new", out.filter((t) => t.new_in_v2).length, "unresolved refs:", bad);
