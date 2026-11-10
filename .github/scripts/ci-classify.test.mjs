import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyPaths, outputs } from './ci-classify.mjs';

function expectChecks(files, expected) {
  assert.deepEqual(classifyPaths(files), expected, files.join(', '));
}

const docs = {
  metadataChecks: false,
  qualityChecks: false,
  browserChecks: false,
  opticsChecks: false,
};
const metadata = { ...docs, metadataChecks: true };
const quality = { ...docs, qualityChecks: true };
const browser = { ...quality, browserChecks: true };
const optics = { ...browser, opticsChecks: true };
const opticsOnly = { ...quality, opticsChecks: true };

test('documentation and issue templates need metadata checks but no runtime verification', () => {
  expectChecks(['README.md', 'docs/releasing.md', '.github/ISSUE_TEMPLATE/bug.md'], metadata);
  expectChecks(['docs/architecture.md', 'AGENTS.md'], metadata);
  // Dated process material lives outside docs/ but still takes the metadata
  // gate, so check:docs validates it.
  expectChecks(['.agents/notes/archives/acceptance-2026-11-01-cross-browser.md'], metadata);
  expectChecks(['.agents/notes/plans/ui-current-plan.md'], metadata);
  expectChecks(['docs/AGENTS.md'], metadata);
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

test('runtime, browser tests, contract definitions and dependency changes need full coverage', () => {
  for (const file of [
    'packages/react/src/index.tsx',
    'apps/playground/src/app.tsx',
    'apps/playground/src/fixture.md',
    'tests/e2e/playground.spec.ts',
    'tests/support/e2e.ts',
    'contracts/component-matrix.json',
    'playwright.config.ts',
    'playwright.cross-browser.config.ts',
    'unclassified-runtime-config.js',
  ]) {
    expectChecks([file], browser);
  }
});

test('optical source and harness changes run the dedicated SwiftShader gate', () => {
  for (const file of [
    'packages/glass-runtime/src/index.ts',
    'packages/tokens/src/material.css',
    'packages/tailwind/src/theme.css',
    'apps/playground/src/glass-runtime.ts',
    'package.json',
    'bun.lock',
  ]) {
    expectChecks([file], optics);
  }
  for (const file of [
    'tests/optics/glass.spec.ts',
    'tests/support/glass-optics.ts',
    'playwright.optics.config.ts',
  ]) {
    expectChecks([file], opticsOnly);
  }
  expectChecks(['docs/material-standards.md'], metadata);
});

test('directories that do not exist cannot silently downgrade coverage', () => {
  // `themes/` was listed once but has never existed in this repository. A
  // stale allow-list entry is invisible: nothing fails when the directory is
  // missing, and a future re-introduction would silently take the listed
  // branch instead of the conservative default. Unknown top-level paths must
  // still select both gates.
  expectChecks(['themes/light.css'], browser);
  expectChecks(['brand-new-package/src/index.ts'], browser);
  expectChecks(['.workbuddy/notes.txt'], browser);
});

test('mixed changes take the union of required checks', () => {
  expectChecks(['docs/README.md', '.changeset/patch.md', 'scripts/check-requests.ts'], {
    metadataChecks: true,
    qualityChecks: true,
    browserChecks: false,
    opticsChecks: false,
  });
  expectChecks(['.github/workflows/ci.yml', 'packages/glass-runtime/src/index.ts'], {
    metadataChecks: true,
    qualityChecks: true,
    browserChecks: true,
    opticsChecks: true,
  });
});

test('output keys match the reusable workflow inputs', () => {
  assert.equal(
    outputs(browser),
    'metadata-checks=false\nquality-checks=true\nbrowser-checks=true\noptics-checks=false',
  );
  expectChecks([], docs);
});
