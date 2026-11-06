import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Release skips re-verification only when CI already passed the pull request
// that produced the pushed commit: branch protection keeps `main` strictly up
// to date and rejects non-fast-forward pushes, so a push carries exactly the
// commit GitHub created for that pull request and the merged tree is the tree
// CI tested. Anything unproven fails closed and keeps the full release
// verification.
const CI_WORKFLOW_NAME = 'CI';
const RELEASE_BRANCH = 'main';

// The pushed commit must be the commit GitHub recorded as landing a pull request
// on `main` — its merge, squash or rebase result. Commits merely associated with
// a pull request (its branch commits, or the same pull request seen from another
// branch) do not qualify.
export function mergedPull(pulls, headSha) {
  return pulls.find(
    (pull) =>
      pull?.merged_at &&
      pull?.base?.ref === RELEASE_BRANCH &&
      pull?.merge_commit_sha === headSha &&
      typeof pull?.head?.sha === 'string' &&
      pull.head.sha.length > 0,
  );
}

// CI must have completed successfully on the pull request head that landed, so
// the browser matrix and quality gates ran on the tree this commit contains.
export function verifiedByCi(pull, runs) {
  if (!pull) return false;
  const headSha = pull.head.sha;
  return runs.some(
    (run) =>
      run?.name === CI_WORKFLOW_NAME &&
      run?.event === 'pull_request' &&
      run?.head_sha === headSha &&
      run?.status === 'completed' &&
      run?.conclusion === 'success',
  );
}

function ghApi(path) {
  return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const headSha = process.argv[2];
  const { GITHUB_REPOSITORY: repository } = process.env;
  let verified = false;
  try {
    if (!headSha || !repository) throw new Error('Expected a commit SHA and GITHUB_REPOSITORY');
    const pull = mergedPull(ghApi(`repos/${repository}/commits/${headSha}/pulls`), headSha);
    if (pull) {
      const runs = ghApi(
        `repos/${repository}/actions/runs?event=pull_request&head_sha=${pull.head.sha}&per_page=100`,
      ).workflow_runs;
      verified = verifiedByCi(pull, runs ?? []);
    }
  } catch (error) {
    console.error(`CI evidence lookup failed: ${error instanceof Error ? error.message : error}`);
    verified = false;
  }
  process.stdout.write(`ci-verified=${verified}\n`);
}
