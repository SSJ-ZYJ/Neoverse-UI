import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyPaths, outputs } from './ci-classify.mjs';

function expectChecks(files, expected) {
  assert.deepEqual(classifyPaths(files), expected, files.join(', '));
}

const docs = { metadataChecks: false, qualityChecks: false, visualChecks: false };
const metadata = { metadataChecks: true, qualityChecks: false, visualChecks: false };
const quality = { metadataChecks: false, qualityChecks: true, visualChecks: false };
const visual = { metadataChecks: false, qualityChecks: true, visualChecks: true };

test('ordinary documentation and issue templates need no runtime verification', () => {
  expectChecks(['README.md', 'docs/releasing.md', '.github/ISSUE_TEMPLATE/bug.md'], docs);
  expectChecks(['docs/architecture.md', 'AGENTS.md'], docs);
});

test('changesets, request archives, and workflow edits use lightweight metadata verification', () => {
  expectChecks(['.changeset/terminal-light-contrast.md'], metadata);
  expectChecks(['.changeset/config.json'], metadata);
  expectChecks(['contracts/component-requests/archive/CR-001.json'], metadata);
  expectChecks(['.github/workflows/verify.yml'], metadata);
  expectChecks(['.github/scripts/ci-scope.sh'], metadata);
});

test('generated contract document and quality tooling require source checks without browser work', () => {
  expectChecks(['docs/component-contract-matrix.md'], quality);
  expectChecks(['scripts/check-changeset-targets.ts'], quality);
  expectChecks(['tests/contracts.test.ts'], quality);
});

test('runtime, visual tests, contract definitions and dependency changes need full coverage', () => {
  for (const file of [
    'packages/react/src/index.tsx',
    'packages/tokens/themes/light.css',
    'apps/playground/src/app.tsx',
    'apps/playground/src/fixture.md',
    'tests/visual/playground-shell.spec.ts',
    'contracts/component-matrix.json',
    'playwright.config.ts',
    'playwright.cross-browser.config.ts',
    'bun.lock',
    'package.json',
    'unclassified-runtime-config.js',
  ]) {
    expectChecks([file], visual);
  }
});

test('directories that do not exist cannot silently downgrade coverage', () => {
  // `themes/` was listed once but has never existed in this repository. A
  // stale allow-list entry is invisible: nothing fails when the directory is
  // missing, and a future re-introduction would silently take the listed
  // branch instead of the conservative default. Unknown top-level paths must
  // still select both gates.
  expectChecks(['themes/light.css'], visual);
  expectChecks(['brand-new-package/src/index.ts'], visual);
  expectChecks(['.workbuddy/notes.txt'], visual);
});

test('mixed changes take the union of required checks', () => {
  expectChecks(['docs/README.md', '.changeset/patch.md', 'scripts/check-requests.ts'], {
    metadataChecks: true,
    qualityChecks: true,
    visualChecks: false,
  });
  expectChecks(['.github/workflows/ci.yml', 'packages/glass-runtime/src/index.ts'], {
    metadataChecks: true,
    qualityChecks: true,
    visualChecks: true,
  });
});

test('output keys match the reusable workflow inputs', () => {
  assert.equal(outputs(visual), 'metadata-checks=false\nquality-checks=true\nvisual-checks=true');
  expectChecks([], docs);
});
