// Persists approved community submissions by committing data/community.json
// straight to GitHub — this is what makes approved entries survive a
// from-scratch rebuild on a host with no persistent disk (e.g. Render's free
// tier): a fresh instance always pulls the latest commit, so anything
// already approved is baked in as seed data again on boot (see db.js).
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
    throw new Error(`GitHub API ${method} ${url} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function syncApprovedEntriesToGit(entries) {
  if (!configured) return;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;

  let sha;
  try {
    const existing = await githubRequest("GET", `${apiUrl}?ref=${GITHUB_BRANCH}`);
    sha = existing.sha;
  } catch (err) {
    sha = undefined; // file doesn't exist on this branch yet — first sync will create it
  }

  const content = Buffer.from(JSON.stringify(entries, null, 2) + "\n", "utf8").toString("base64");
  try {
    await githubRequest("PUT", apiUrl, {
      message: `Sync community.json (${entries.length} approved ${entries.length === 1 ? "entry" : "entries"})`,
      content,
      branch: GITHUB_BRANCH,
      sha,
    });
  } catch (err) {
    console.error("Failed to push data/community.json to git:", err.message);
  }
}

module.exports = { syncApprovedEntriesToGit, configured };
