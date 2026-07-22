// Persists the full set of approved entries by committing data/community.json
// straight to GitHub — this is what makes them survive a from-scratch rebuild
// on a host with no persistent disk (e.g. Render's free tier): a fresh
// instance always pulls the latest commit, so anything already approved is
// baked in again on boot (see db.js). Holds ALL approved entries (originally
// curated + community-submitted) once anything has ever been edited/deleted
// via the admin dashboard, not just community submissions.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // "owner/repo"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE_PATH = "data/community.json";

const configured = !!(GITHUB_TOKEN && GITHUB_REPO);

if (!configured) {
  console.warn(
    "Git persistence disabled — set GITHUB_TOKEN and GITHUB_REPO to have approved entries committed back to the repo."
  );
}

async function githubRequest(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "case-study-catalog",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`GitHub API ${method} ${url} -> ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// getEntriesFn is called fresh on every attempt (not just once up front) so a
// retry reflects the database's current state at that moment, not a stale
// snapshot from before the conflict — otherwise a retry could overwrite a
// second, faster write with older data instead of just failing loudly.
async function syncApprovedEntriesToGit(getEntriesFn, attempt = 1) {
  if (!configured) return;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;

  let sha;
  try {
    const existing = await githubRequest("GET", `${apiUrl}?ref=${GITHUB_BRANCH}`);
    sha = existing.sha;
  } catch (err) {
    sha = undefined; // file doesn't exist on this branch yet — first sync will create it
  }

  const entries = getEntriesFn();
  const content = Buffer.from(JSON.stringify(entries, null, 2) + "\n", "utf8").toString("base64");

  try {
    await githubRequest("PUT", apiUrl, {
      message: `Sync community.json (${entries.length} approved ${entries.length === 1 ? "entry" : "entries"})`,
      content,
      branch: GITHUB_BRANCH,
      sha,
    });
  } catch (err) {
    // 409/422 here almost always means someone else's write landed between
    // our GET and PUT — retry with a fresh sha and a fresh entries snapshot
    // rather than silently dropping the change.
    const isConflict = err.status === 409 || err.status === 422;
    if (isConflict && attempt < 5) {
      await new Promise((r) => setTimeout(r, 150 * attempt));
      return syncApprovedEntriesToGit(getEntriesFn, attempt + 1);
    }
    console.error("Failed to push data/community.json to git:", err.message);
  }
}

module.exports = { syncApprovedEntriesToGit, configured };
