# Pilot round 1 (codebook 0.2.0)

8 documents x 76 variables = 608 cells, coded by four independent coders (pilot-1..4) from the archived
snapshots only. `codes.json` validates against `codebook-0.2.0.json` with 0 errors.

| Cells | Count | Share |
|---|---|---|
| coded with a value | 226 | 37% |
| not_stated | 254 | 42% |
| not_applicable | 106 | 17% |
| misfit (value null) | 22 | 3.6% |

Documents: NI strategy (government), UKRI policy (funder), Ulster library guide, Maynooth UG/PGT guide,
Edinburgh student / PGR / staff pages (one institution, three audiences), Warwick Law School policy.

## What the pilot showed

1. **Applicability is the main structural failure, not missing values.** Role-specific variables stayed
   applicable to documents they cannot concern (audience `all` on a government strategy covered
   supervisor_role and thesis_disclosure_forms), so they could only be `not_stated`, which pollutes the gap
   statistics. Assessment variables applied to staff and funder documents for the same reason. Conversely a
   *student* document that states a rule about staff conduct (Maynooth: "GenAI tools will not be used by staff
   to grade") could not be coded, because the staff variables were gated on audience. Fix: applicability by
   what the document *covers* (domains), not only who it addresses.
2. **Single-valued variables that should be lists:** non_institutional_tool_rule (Edinburgh PGR says both
   "prefer ELM" and "do not enter confidential data"), sanctions_stated.
3. **`assessment_scheme: none` cannot express silence** (it needs a quote), so coders used not_stated, which
   then forced the dependants to not_applicable. Remove `none`.
4. **Missing values** (each seen in a pilot document): pointer pages (instrument_force), parent policy /
   government framework / published scale as external frameworks, third-party confidential data, access
   removal as a sanction, "allowed with a preferred tool" and "discouraged" for staff uploading and marking,
   drafting permitted for applications, conditional record-keeping, relative review timing, "planned, not yet
   provided" training, research misconduct and breach of confidentiality as offence frames, live translation
   in recording rules, FOI in legal instruments, `students_all` in the audience lists, and a set of government
   commitments (public notice of AI interaction, oversight structure, supplier requirements, user guidance).
5. **Gloss gaps:** disclosure_obligation could not decide "should acknowledge" where failure to acknowledge is
   stated to be misconduct (Edinburgh, Maynooth).
6. **Near-universal variable:** states_user_remains_responsible discriminates little.

## Sibling contrast (Edinburgh student vs PGR)

The two pages are near-verbatim. Real differences land exactly where the PGR-specific variables are
(supervisor_role, thesis_disclosure_forms, ethics_approval, evidence_retention, disclosure_location,
data_entry_rules). Two apparent differences were artefacts of the page text (issued_by_type, use_study_revision),
which is a reminder that a not_stated can reflect extraction rather than policy.

## Not acted on (one precedent only; recorded for when a second document shows it)

- "assessors must not infer whether AI was used" (UKRI)
- named prohibited conduct such as offensive media and non-consensual voice or image use (Maynooth)
- a `use_*` context axis (seminar, publication, staff work): handled by domains instead
