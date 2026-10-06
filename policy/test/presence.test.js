const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../presence.js");
function fx(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prs-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "We run a short online course on using AI – sign up on the skills hub. Do not enter personal data.\n");
  const tf = path.join(root, "types.json"); fs.writeFileSync(tf, JSON.stringify({ types: [{ id: "training_available" }, { id: "no_personal_data" }] }));
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", checked_types: 2, found: [], unsure: [], ...body })); return { root, tf, f };
}
test("a verbatim quote for a vocabulary type passes", () => { const { root, tf, f } = fx({ found: [{ type: "training_available", quote: "We run a short online course on using AI - sign up on the skills hub." }] }); assert.deepEqual(validateFile(f, { root, typesFile: tf }).errs, []); });
test("an unknown type, a stitched quote and a missing quote are rejected", () => {
  const { root, tf, f } = fx({ found: [{ type: "nope", quote: "Do not enter personal data." }, { type: "no_personal_data", quote: "Do not ... data." }, { type: "training_available", quote: "Free weekly workshops." }] });
  const e = validateFile(f, { root, typesFile: tf }).errs.join("\n"); assert.match(e, /not in the vocabulary/); assert.match(e, /stitch/); assert.match(e, /not in the snapshot/);
});
test("the same type cannot be listed twice", () => { const q = "Do not enter personal data."; const { root, tf, f } = fx({ found: [{ type: "no_personal_data", quote: q }, { type: "no_personal_data", quote: q }] }); assert.match(validateFile(f, { root, typesFile: tf }).errs.join(), /listed twice/); });
