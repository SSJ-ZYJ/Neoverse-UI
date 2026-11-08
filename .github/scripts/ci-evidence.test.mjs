import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergedPull, verifiedByCi } from './ci-evidence.mjs';

const headSha = 'a'.repeat(40);
const mergeCommit = 'f'.repeat(40);

function pull(overrides = {}) {
  return {
    number: 42,
    merged_at: '2026-11-05T00:00:00Z',
    merge_commit_sha: mergeCommit,
    base: { ref: 'main' },
    head: { sha: headSha },
    ...overrides,
  };
}

function run(overrides = {}) {
  return {
    name: 'CI',
    path: '.github/workflows/ci.yml',
    event: 'pull_request',
    head_sha: headSha,
    status: 'completed',
    conclusion: 'success',
    ...overrides,
  };
}

test('the merge commit of a main pull request carries CI evidence', () => {
  const found = mergedPull([pull()], mergeCommit);
  assert.equal(found?.number, 42);
  assert.equal(verifiedByCi(found, [run()]), true);
});

test('commits only associated with a pull request are not its merge commit', () => {
  // A branch commit inside the pull request reports the same pull, but it is
  // not what GitHub landed on main.
  assert.equal(mergedPull([pull()], headSha), undefined);
  // The same pull request seen from another branch reports the same merge commit
  // but a different base; only the merge into main counts.
  assert.equal(mergedPull([pull({ base: { ref: 'dev' } })], mergeCommit), undefined);
  assert.equal(mergedPull([pull({ merged_at: null })], mergeCommit), undefined);
  assert.equal(mergedPull([pull({ head: {} })], mergeCommit), undefined);
  assert.equal(mergedPull([], mergeCommit), undefined);
  assert.equal(verifiedByCi(undefined, [run()]), false);
});

test('only a completed successful CI pull-request run for that head counts', () => {
  const found = mergedPull([pull()], mergeCommit);
  assert.equal(verifiedByCi(found, []), false);
  assert.equal(
    verifiedByCi(found, [run({ path: '.github/workflows/cross-browser-smoke.yml' })]),
    false,
  );
  assert.equal(verifiedByCi(found, [run({ event: 'push' })]), false);
  assert.equal(verifiedByCi(found, [run({ status: 'in_progress', conclusion: null })]), false);
  assert.equal(verifiedByCi(found, [run({ conclusion: 'failure' })]), false);
  assert.equal(verifiedByCi(found, [run({ head_sha: 'b'.repeat(40) })]), false);
});

test('a failed run elsewhere in the list cannot erase a passing run', () => {
  const found = mergedPull([pull()], mergeCommit);
  assert.equal(verifiedByCi(found, [run(), run({ conclusion: 'failure' })]), true);
});

test('an unrelated pull request in the list is ignored when a merged one exists', () => {
  assert.equal(mergedPull([pull({ merged_at: null }), pull()], mergeCommit)?.number, 42);
});

test('only the workflow file that owns the required gates is evidence', () => {
  const found = mergedPull([pull()], mergeCommit);
  // Two workflow definitions may share a `name:` value. Only `ci.yml` carries
  // the required gates, so a same-named run must not satisfy release evidence.
  assert.equal(verifiedByCi(found, [run({ path: '.github/workflows/release.yml' })]), false);
  // A run without a resolvable workflow path is unproven and fails closed.
  assert.equal(verifiedByCi(found, [run({ path: undefined })]), false);
});

test('a malformed head SHA cannot match a malformed run record', () => {
  // Without the guard, an empty head SHA compares equal to a run that also
  // lacks `head_sha`, which would report evidence for an unknown commit.
  assert.equal(
    verifiedByCi({ head: {} }, [
      { event: 'pull_request', status: 'completed', conclusion: 'success' },
    ]),
    false,
  );
  assert.equal(verifiedByCi({ head: { sha: '' } }, [run({ head_sha: '' })]), false);
});

test('a pull request record without a merge commit is not a merged commit', () => {
  assert.equal(mergedPull([pull({ merge_commit_sha: undefined })], undefined), undefined);
  assert.equal(mergedPull([pull({ merge_commit_sha: null })], null), undefined);
});

test('non-array API payloads fail closed', () => {
  assert.equal(mergedPull(null, mergeCommit), undefined);
  assert.equal(mergedPull({}, mergeCommit), undefined);
  assert.equal(verifiedByCi(pull(), null), false);
  assert.equal(verifiedByCi(pull(), {}), false);
});

test('cancelled, skipped and timed-out runs are not evidence', () => {
  const found = mergedPull([pull()], mergeCommit);
  for (const conclusion of [
    'cancelled',
    'skipped',
    'timed_out',
    'neutral',
    'action_required',
    'stale',
  ]) {
    assert.equal(verifiedByCi(found, [run({ conclusion })]), false, conclusion);
  }
});
