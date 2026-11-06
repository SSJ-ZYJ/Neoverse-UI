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
  assert.equal(verifiedByCi(found, [run({ name: 'Cross-browser risk checks' })]), false);
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
