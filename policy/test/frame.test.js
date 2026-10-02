const test = require("node:test");
const assert = require("node:assert");
const { parseItem, looksLikeHei, tierOf } = require("../frame.js");

test("name heuristic: universities and colleges in, health partnerships and schools out", () => {
  for (const n of ["University of Ulster", "Queen Mary University of London", "Royal Holloway, University of London", "Atlantic Technological University", "Birkbeck, University of London", "Arts University Bournemouth"]) assert.equal(looksLikeHei(n), true, n);
  for (const n of ["Cambridge University Hospitals NHS Foundation Trust", "Cambridge University Health Partners", "Bedford Primary School", "Medical Research Council", "Oxford University Press", "University Academy Holbeach", "City College Norwich"]) assert.equal(looksLikeHei(n), false, n);
});
test("tiers: college/institute/conservatoire names are left to a human, not auto-flagged", () => {
  assert.equal(tierOf("Trinity College Dublin"), "other_candidate");
  assert.equal(tierOf("Royal Academy of Music"), "other_candidate");
  assert.equal(tierOf("City College Norwich"), "other_candidate");
  assert.equal(tierOf("University of Ulster"), "university_name");
  assert.equal(tierOf("NHS Trust X"), "unlikely");
  assert.equal(tierOf("Acme Ltd"), "unlikely");
});
test("parseItem reads a ROR v2 record defensively", () => {
  const r = parseItem({ id: "https://ror.org/x", names: [{ value: "University A", types: ["ror_display", "label"] }, { value: "UA", types: ["acronym"] }], locations: [{ geonames_details: { country_code: "GB", country_subdivision_name: "Scotland" } }], links: [{ type: "website", value: "https://a.ac.uk" }], established: 1900 });
  assert.deepEqual([r.name, r.acronym, r.country, r.region, r.website, r.include, r.tier], ["University A", "UA", "GB", "Scotland", "https://a.ac.uk", null, "university_name"]);
  assert.equal(parseItem({ id: "y" }).name, "");
});
