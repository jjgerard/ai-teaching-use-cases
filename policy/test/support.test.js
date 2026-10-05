const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../support.js");
function fx(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sup-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "We run a short online course on using AI. The Skills Centre offers workshops. You must complete the quiz.\n");
  const ff = path.join(root, "forms.json"); fs.writeFileSync(ff, JSON.stringify({ forms: [{ id: "course_or_module" }, { id: "workshop_or_live_session" }], requirement: { mandatory: "", optional: "" }, audience: { students: "", both: "" } }));
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", found: [], ...body })); return { root, ff, f };
}
test("a verbatim quote with valid form, requirement and audience passes", () => { const { root, ff, f } = fx({ found: [{ form: "course_or_module", requirement: "optional", audience: "students", quote: "We run a short online course on using AI." }] }); assert.deepEqual(validateFile(f, { root, formsFile: ff }).errs, []); });
test("an empty found list is valid, a missing list is not", () => { const a = fx({}); assert.deepEqual(validateFile(a.f, { root: a.root, formsFile: a.ff }).errs, []); const b = fx({ found: undefined }); assert.match(validateFile(b.f, { root: b.root, formsFile: b.ff }).errs.join(), /found must be a list/); });
test("unknown form or value, a stitched quote and a quote not in the snapshot are rejected", () => {
  const { root, ff, f } = fx({ found: [{ form: "nope", requirement: "optional", audience: "students", quote: "You must complete the quiz." }, { form: "course_or_module", requirement: "sometimes", audience: "all", quote: "We run ... AI." }, { form: "workshop_or_live_session", requirement: "optional", audience: "both", quote: "Free weekly drop-ins." }] });
  const e = validateFile(f, { root, formsFile: ff }).errs.join("\n"); assert.match(e, /not in the vocabulary/); assert.match(e, /requirement must be/); assert.match(e, /audience must be/); assert.match(e, /stitch/); assert.match(e, /not in the snapshot/);
});
test("the same form cannot be listed twice", () => { const q = "The Skills Centre offers workshops."; const { root, ff, f } = fx({ found: [{ form: "workshop_or_live_session", requirement: "optional", audience: "both", quote: q }, { form: "workshop_or_live_session", requirement: "optional", audience: "both", quote: q }] }); assert.match(validateFile(f, { root, formsFile: ff }).errs.join(), /listed twice/); });
