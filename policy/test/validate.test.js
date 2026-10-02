// Tests use a synthetic codebook (toy_* variables). Nothing here is policy content.
const test = require("node:test");
const assert = require("node:assert");
const { validate, checkCodebook } = require("../validate.js");
const real = require("../codebook.json");

const codebook = {
  ...real,
  version: "t1",
  variables: [
    { id: "toy_disclosure", type: "enum", grain: "document", question: "q", values: [{ id: "required", gloss: "g" }, { id: "optional", gloss: "g" }] },
    { id: "toy_format", type: "boolean", grain: "document", question: "q", gate: { variable: "toy_disclosure", if_in: ["none_exists"] } },
    { id: "toy_scheme", type: "enum", grain: "document", question: "q", values: [{ id: "none", gloss: "g" }, { id: "levels", gloss: "g" }] },
    { id: "toy_n", type: "integer", grain: "document", question: "q", min: 2, gate: { variable: "toy_scheme", only_if_in: ["levels"] } },
    { id: "toy_strategy", type: "enum", grain: "document", question: "q", values: [{ id: "a", gloss: "g" }], applies_to_levels: ["government"] },
    { id: "toy_levels", type: "integer", grain: "document", question: "q", min: 0 },
    { id: "toy_tools", type: "multi", grain: "list", question: "q", values: [{ id: "a", gloss: "g" }, { id: "b", gloss: "g" }] },
    { id: "toy_supervisor", type: "boolean", grain: "document", question: "q", applies_to: ["pgr"] },
  ],
};
const institutions = [{ institution_id: "i1" }];
const doc = (o = {}) => ({ doc_id: "d1", institution_id: "i1", level: "institution", audience: "ug", status: "live", format: "webpage", published: "2025-01-01", last_updated: "2025-06-01", retrieved: "2026-10-02", ...o });
const code = (variable_id, value, o = {}) => ({ doc_id: "d1", variable_id, value, evidence_quote: "q", coder: "x", coded_at: "2026-10-02", codebook_version: "t1", ...o });
const run = (codes, documents = [doc()], snapshots = {}) => validate({ institutions, documents, codes, codebook, snapshots });
const hasErr = (r, re) => assert.ok(r.errors.some((e) => re.test(e)), `expected /${re}/ in ${JSON.stringify(r.errors)}`);

test("a clean row passes", () => assert.deepEqual(run([code("toy_disclosure", "required")]).errors, []));
test("off-list value is refused", () => hasErr(run([code("toy_disclosure", "sometimes")]), /not one of/));
test("prose in a coded field is refused", () => hasErr(run([code("toy_levels", "about three, depending")]), /expected a integer/));
test("a value with no evidence is refused", () => hasErr(run([code("toy_disclosure", "required", { evidence_quote: "" })]), /evidence_quote/));
test("none_exists needs a quote", () => hasErr(run([code("toy_disclosure", "none_exists", { evidence_quote: undefined })]), /none_exists needs/));
test("not_stated needs no quote", () => assert.deepEqual(run([code("toy_disclosure", "not_stated", { evidence_quote: undefined })]).errors, []));
test("a number without unit/counted/basis is refused", () => hasErr(run([code("toy_levels", 3)]), /needs unit/));
test("a typed number passes", () => assert.deepEqual(run([code("toy_levels", 3, { unit: "levels", counted: "scheme levels", basis: "stated" })]).errors, []));
test("multi must be a non-empty list of listed values", () => {
  hasErr(run([code("toy_tools", ["a", "z"])]), /"z" is not one of/);
  hasErr(run([code("toy_tools", [])]), /non-empty/);
});
test("misfit: null needs a note and is never forced", () => {
  hasErr(run([code("toy_disclosure", null)]), /misfit_note/);
  const r = run([code("toy_disclosure", null, { misfit_note: "says X, no value for X" })]);
  assert.deepEqual(r.errors, []);
  assert.equal(r.gaps.toy_disclosure.misfit, 1);
});
test("the Belarus case: none_exists on the gate forbids a positive dependent", () => {
  const r = run([code("toy_disclosure", "none_exists"), code("toy_format", true)]);
  hasErr(r, /rules this out/);
  assert.deepEqual(run([code("toy_disclosure", "none_exists"), code("toy_format", "not_applicable")]).errors, []);
});
test("a variable for another audience must be not_applicable", () => {
  hasErr(run([code("toy_supervisor", true)]), /does not apply to audience ug/);
  assert.deepEqual(run([code("toy_supervisor", "not_applicable")]).errors, []);
  assert.deepEqual(run([code("toy_supervisor", true)], [doc({ audience: "pgr" })]).errors, []);
});
test("quote must occur in the archived snapshot", () => {
  hasErr(run([code("toy_disclosure", "required", { evidence_quote: "not in text" })], [doc()], { d1: "Students must declare use." }), /does not occur/);
  assert.deepEqual(run([code("toy_disclosure", "required", { evidence_quote: "must  declare" })], [doc()], { d1: "Students MUST declare use." }).errors, []);
});
test("quote matching ignores PDF hyphenation and curly quotes", () => {
  const snap = { d1: "regionwide guidelines and the Executive\u2019s plan" };
  assert.deepEqual(run([code("toy_disclosure", "required", { evidence_quote: "region-wide guidelines and the Executive's plan" })], [doc()], snap).errors, []);
});
test("booleans take true only: false is refused", () => hasErr(run([code("toy_supervisor", false, {})], [doc({ audience: "pgr" })]), /true only/));
test("only_if_in gate: dependent applicable only when the gate says so", () => {
  hasErr(run([code("toy_scheme", "none"), code("toy_n", 3, { unit: "levels", counted: "c", basis: "stated" })]), /only applies when toy_scheme/);
  hasErr(run([code("toy_n", 3, { unit: "levels", counted: "c", basis: "stated" })]), /not coded for this document/);
  assert.deepEqual(run([code("toy_scheme", "levels"), code("toy_n", 3, { unit: "levels", counted: "c", basis: "stated" })]).errors, []);
  assert.deepEqual(run([code("toy_scheme", "none"), code("toy_n", "not_applicable", { evidence_quote: undefined })]).errors, []);
});
test("applies_to_levels: a strategy-only variable is not_applicable on an institution document", () => {
  hasErr(run([code("toy_strategy", "a")]), /does not apply to level institution/);
  assert.deepEqual(run([code("toy_strategy", "a")], [doc({ level: "government" })]).errors, []);
});
test("stale codebook version is flagged", () => hasErr(run([code("toy_disclosure", "required", { codebook_version: "t0" })]), /coded under codebook/));
test("document fields are closed and dates ISO", () => {
  const r = run([], [doc({ audience: "everyone", published: "1/2/25", retrieved: null })]);
  hasErr(r, /audience/); hasErr(r, /ISO/); hasErr(r, /retrieved/);
});
test("a null last_updated needs date_known:false", () => {
  hasErr(run([], [doc({ last_updated: null })]), /date_known/);
  assert.deepEqual(run([], [doc({ last_updated: null, date_known: false })]).errors, []);
});
test("gaps count uncoded, not_stated and none_exists separately", () => {
  const r = run([code("toy_disclosure", "not_stated", { evidence_quote: undefined })], [doc(), doc({ doc_id: "d2" })]);
  assert.deepEqual([r.gaps.toy_disclosure.not_stated, r.gaps.toy_disclosure.uncoded], [1, 1]);
});
test("codebook self-check: values need glosses, grain, valid gates", () => {
  const bad = { ...real, variables: [{ id: "v", type: "enum", values: [{ id: "none_exists", gloss: "" }], gate: { variable: "nope", if_in: [] } }] };
  const e = checkCodebook(bad).join("\n");
  assert.match(e, /gloss/); assert.match(e, /reserved state/); assert.match(e, /grain/); assert.match(e, /unknown variable/);
});
