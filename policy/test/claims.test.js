const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { checkTypes, checkClass } = require("../claims.js");
function fx() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "clm-")); const pts = ["a", "b", "c", "d"].map((d) => ({ doc_id: d, point_id: "p01" }));
  fs.writeFileSync(path.join(root, "points.json"), JSON.stringify(pts));
  const types = { types: [{ id: "keep_records", label: "Keep prompts and outputs", group: "disclosure_and_evidence", definition: "d", decision_rule: "r", examples: ["a:p01", "b:p01", "c:p01"] }] };
  const tf = path.join(root, "types.json"); fs.writeFileSync(tf, JSON.stringify(types)); return { root, tf };
}
test("a valid vocabulary passes", () => { const { root, tf } = fx(); assert.deepEqual(checkTypes(tf, { root }).errs, []); });
test("examples must come from three institutions and exist", () => { const { root, tf } = fx(); const j = JSON.parse(fs.readFileSync(tf)); j.types[0].examples = ["a:p01", "a:p01", "z:p09"]; fs.writeFileSync(tf, JSON.stringify(j)); const e = checkTypes(tf, { root }).errs.join("\n"); assert.match(e, /not a point/); assert.match(e, /3 institutions/); });
test("classification rows are checked against the vocabulary and fit rules", () => {
  const { root, tf } = fx(); const d = path.join(root, "out"); fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "x.json"), JSON.stringify({ coder: "t", rows: [{ ref: "a:p01", claim: "keep_records", claim2: null, fit: "clear", suggest: null }, { ref: "b:p01", claim: "nonsense", fit: "clear" }, { ref: "c:p01", claim: "unclassified", fit: "clear" }, { ref: "d:p01", claim: "unclassified", fit: "none", suggest: "something new" }] }));
  const r = checkClass(tf, [d], { root }); const e = r.errs.join("\n"); assert.match(e, /b:p01: claim "nonsense"/); assert.match(e, /c:p01: unclassified requires fit none/); assert.ok(!/a:p01|d:p01/.test(e)); assert.equal(r.rows.length, 4);
});
