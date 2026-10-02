# Handoff: AI policy atlas, UK and Ireland scale-up

For a session that picks this up cold. Read this file, then `policy/README.md`, `policy/DISCOVERY.md`,
`policy/CODING-BRIEF.md`, `data/policy/trial/REPORT.md` and `data/policy/pilot-v0.3.1/REPORT.md`.

## What the project is

A comparison of university, sector and government AI guidance across regions, audiences (students, PGR, staff) and time, as a
standalone page in the style of the language atlas, linked from the AI case-studies site (this repo, `jjgerard/ai-teaching-use-cases`).
The lesson from `jjgerard/language-atlas` (read its `research/ABSENCE-VS-CODING.md`): data filled in as prose first was unanalysable.
So everything here is typed and closed, and prose is allowed only as evidence quotes.

Work is on branch `claude/intelligent-rubin-6lsqps`. Nothing is merged to master and there is no PR. Do not open one unless asked.
Do not touch the case-study catalog app (`src/`, `public/`) or deploy anything.

## What exists and works

- `policy/codebook.json` v0.4.0: 78 variables, each with a question, decision-rule glosses and precedent documents.
  Derived by reading 61 documents, revised over three pilot rounds. Round 3 was a holdout: 1.9% misfits; independent re-coding of
  4 documents agreed 96% (kind of answer) and 92% (exact value). Both coders were the same model, so human double-coding of a
  sample is still required before any prevalence claim.
- `policy/validate.js` enforces: closed values, quote-verbatim-in-snapshot, `none_exists`/`not_stated`/`not_applicable`/misfit states,
  gates and applicability (audience, level, domains), per-value evidence for multi variables, `audience_scope`, typed numbers.
- `policy/fetch.js` (archive; honest user agent; robots.txt; per-host delay; **never bypasses bot walls**; manual import; keeps old
  snapshots in `snapshots-history/`), `policy/frame.js` (candidate frame from ROR), `policy/agreement.js` (inter-coder agreement).
- `data/policy/frame.json`: 630 GB/IE candidates: 181 `university_name`, 345 `other_candidate`, 104 `unlikely`. `include` is null on all.
- `data/policy/snapshots/`: 61 archived documents (the reading set). `documents.json` registers 16 of them; none is coded under v0.4.0, so
  `data/policy/codes.json` is empty by design. Older coded rounds are archived in `data/policy/pilot-v*/` with their own codebook copies.
- `data/policy/trial/`: a 20-institution trial of the whole procedure (see its REPORT.md).
- `npm run policy:test` (45 tests) and `npm run policy:validate` must stay green.

## The task

Cover the UK and Ireland: **one institution-wide, student-facing document per institution**, then PGR and staff extensions for a
stratified subset. Steps:

1. **Curate the frame.** Set `include` (true/false) on `data/policy/frame.json`, with `include_reason` for exclusions, against the
   official registers (OfS for England; SFC for Scotland; Medr for Wales; DfE for Northern Ireland; HEA for Ireland). Further-education
   colleges and royal medical colleges are in the `other_candidate` tier. Federal awarding bodies (National University of Ireland,
   University of Wales) are out of frame. Ask the user to confirm the curated list before the expensive steps.
2. **Discover** each institution's document in batches (about 5 institutions per agent), following `policy/DISCOVERY.md` exactly.
   Record one outcome each: found / found_unverified / not_found / unresolved / out_of_frame. An unreachable site is `unresolved`,
   not a finding. Outputs: `outcomes.json` rows and a `targets.json` (`doc_id`, `url`).
3. **Archive** with `policy/fetch.js`. In a sandbox that forces a proxy run it as
   `NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1 node policy/fetch.js fetch targets.json --contact "https://github.com/jjgerard/ai-teaching-use-cases"`.
   The `--contact` goes to third-party sites in the User-Agent: use the repo URL, never a person's email. Blocked, `js_shell` and
   `needs_text` documents are listed by `node policy/fetch.js status`; the user fetches those on a normal machine (or saves the page in a
   browser and uses `fetch.js import`). Do not try to get around a bot wall.
4. **Register** each archived document in `documents.json` and its institution in `institutions.json`: `level`, `audience` (a list;
   `students_all`, `staff_all` are allowed), `domains` (a list), dates (ISO; `date_known: false` where none is shown), `retrieved`.
5. **Code** with agents following `policy/CODING-BRIEF.md` (about 2 documents per agent). Every row carries the codebook's current
   version. Code about 10% of documents twice, independently, and report `node policy/agreement.js a.json b.json --by-variable`.
6. **Merge** validated codes into `data/policy/codes.json`, run the validator, commit.
7. Only then discuss building the page. Do not build it before there is data to show.

## Rules that must hold

- No policy content from inference or memory. Every coded value traces to a verbatim quote in an archived snapshot.
- Never bypass a bot wall, login or captcha. Record it as blocked and move on.
- Rows coded under one codebook version are rejected under another. If you change the codebook, bump the version and re-code or archive.
- Keep the page honest: coverage is by a curated frame, not by search. "Not found", "blocked" and "unresolved" are recorded outcomes about
  named institutions. Agreement figures from one model are optimistic. No prevalence claim without human double-coding of a sample.
- Commit to the branch with clear messages; push to the same branch. No force-push.

## Known pitfalls

- The search tool ignores `site:`; use its domain filter with the institution's own domain. Watch name collisions (St Mary's Belfast vs
  Twickenham, Queen Margaret vs Queen Mary, Leeds vs Leeds Trinity).
- `node --test` needs a glob, not a directory (`npm run policy:test` already does this).
- Node's built-in `fetch` ignores the sandbox proxy unless `NODE_USE_ENV_PROXY=1`.
- Pages without a `<main>` keep their navigation menu in the snapshot (Essex). Quotes still verify; word counts are inflated.
- Agents writing into one shared folder can overwrite each other's scripts: give each its own output directory.
- The documents are not one kind (library guides, policy PDFs, FAQs). Analysis must control for `instrument_force` and `issued_by_type`.
- Only one PGR page turned up across 20 institutions: the PGR extension may be much thinner than the student layer.

## Budget

From the trial and pilot: discovery about 18k tokens per institution; coding about 50-60k tokens per document. For about 181 institutions
that is roughly 3M for discovery plus 9-11M for coding. If budget is short, run a stratified subset (for example 60 institutions across
England, Scotland, Wales, Northern Ireland and Ireland) and say so on the page.
