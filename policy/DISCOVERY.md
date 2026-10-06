# Finding each institution's document (procedure, from the 20-institution trial)

Goal: one institution-wide, student-facing page or document on generative AI per institution in the frame.

1. **Start from the frame row.** Use its `website` domain. Confirm the institution is a teaching institution
   (federal awarding and validating bodies are `out_of_frame`).
2. **Search with the domain filter, not `site:`.** The search tool ignores `site:` and returns other universities.
   Use its `allowed_domains` option with the institution's own domain, then a few free-text queries
   ("<name> generative AI students guidance", "<name> academic integrity artificial intelligence").
   Guard against name collisions (St Mary's Belfast vs Twickenham; Queen Margaret vs Queen Mary; Leeds vs Leeds Trinity).
3. **Choose the document in this order:** the main student guidance on generative AI; else an institution-wide
   policy or principles statement that covers students; else the academic-integrity policy section that names AI
   (record `fallback: true`). A library guide is acceptable only if it is the institution's own student guidance
   (record the kind); prefer the policy it points to.
4. **Record one outcome:**
   - `found`: retrieved and confirmed.
   - `found_unverified`: a plausible URL you could not retrieve.
   - `not_found`: at least four distinct queries including the domain filter, and the reasons listed.
   - `unresolved`: the site could not be reached at all, so absence is not a finding.
   - `out_of_frame`: not a teaching institution.
5. **Archive with `policy/fetch.js`**, never by hand. Blocked pages stay `blocked`; use `fetch.js import` for pages
   saved in a browser. A page whose text is under about 300 words is `thin` and a weak coding target.
6. **Note other pages** (PGR, staff) as URLs only. They are the extension layer, not part of this step.
