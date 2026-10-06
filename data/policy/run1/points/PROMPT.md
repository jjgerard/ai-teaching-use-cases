# Instructions for a guidance-points extraction agent

Repo: /home/user/ai-teaching-use-cases (branch claude/intelligent-rubin-6lsqps). Today is 2026-10-03.

1. Read `policy/POINTS-BRIEF.md` first and follow it exactly. It defines what a meaningful point is, the output format and the validator.
2. You are given a batch name (bN), a coder name (pts-bN) and a list of documents. Work only from `data/policy/snapshots/<doc_id>.txt` for each.
3. Write one file per document to `data/policy/run1/points/bN/<doc_id>.json`. Validate with `node policy/points.js validate data/policy/run1/points/bN` and fix every ERROR.
4. Do not read any coded data (`data/policy/codes.json`, `data/policy/run1/codes*`, `pilot-*`), other agents' output, or other web pages. Do not run git. Do scripting only in your own `mktemp -d`.
5. Lessons from the pilot (apply them):
   - Prefer the concrete: named tools, prohibitions, thresholds, forms, consequences, rights, worked examples. Skip navigation chrome, repeated text and boilerplate.
   - If a rule is repeated in several places, quote the clearest instance once.
   - Bulleted lists: quote one full bullet or the sentence that carries the rule; never quote only a lead-in such as "You may use GenAI for:".
   - A gist restates only what its quote says. Do not add context from elsewhere in the document.
   - If the document is a whole regulation or procedure with only a few AI sentences, extract just those (a few points are fine).
   - If it sets no rules and only points elsewhere, give `no_points_reason` and no points. If it only describes resources, you may keep a few `explains` points, marked `specific: false` where general.
6. Final report under 120 words: per document, the number of points and one clause on how rule-rich it is; flag any document that is not really student guidance (staff-only, a whole regulation, hub page).
