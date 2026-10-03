const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../points.js");
function fixture(points, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pts-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "documents.json"), JSON.stringify([{ doc_id: "d1" }]));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "Students must not upload module materials to public tools. Keep copies of your prompts – you may be asked for them.\n");
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", extracted_at: "2026-10-03", no_points_reason: null, points, ...extra })); return { root, f };
}
const good = { point_id: "p01", quote: "Students must not upload module materials to public tools.", anchor: null, addressee: "student", force: "must_not", topic: "data_privacy_and_confidentiality", specific: true, gist: "Do not upload module materials to public AI tools." };
test("a verbatim, well-formed point passes", () => { const { root, f } = fixture([good]); assert.deepEqual(validateFile(f, { root }).errs, []); });
test("a quote that is not in the snapshot is rejected", () => { const { root, f } = fixture([{ ...good, quote: "Students may upload anything." }]); assert.match(validateFile(f, { root }).errs.join(), /not in the snapshot/); });
test("whitespace, dashes and quotes are ignored when matching", () => { const { root, f } = fixture([{ ...good, quote: "Keep copies of your prompts - you may be asked for them." }]); assert.deepEqual(validateFile(f, { root }).errs, []); });
test("off-list values, long gists and stitched quotes are rejected", () => {
  const { root, f } = fixture([{ ...good, force: "ought", topic: "vibes", gist: "word ".repeat(30), quote: "Students must ... public tools." }]); const e = validateFile(f, { root }).errs.join("\n");
  assert.match(e, /force/); assert.match(e, /topic/); assert.match(e, /gist/); assert.match(e, /ellipsis/);
});
test("no points requires a reason", () => { const { root, f } = fixture([]); assert.match(validateFile(f, { root }).errs.join(), /no no_points_reason/); const g = fixture([], { no_points_reason: "hub page" }); assert.deepEqual(validateFile(g.f, { root: g.root }).errs, []); });
