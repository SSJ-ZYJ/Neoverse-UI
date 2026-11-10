import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// A rendered UI change also needs source quality checks. Unknown paths fail closed.
export function classifyPaths(paths) {
  const checks = { metadataChecks: false, qualityChecks: false, browserChecks: false };

  for (const path of paths) {
    if (!path) continue;

    if (path === 'docs/component-contract-matrix.md') {
      checks.qualityChecks = true;
    } else if (path.startsWith('.github/ISSUE_TEMPLATE/')) {
      // Issue forms do not participate in source, package, or release validation.
    } else if (
      path.startsWith('.changeset/') ||
      path.startsWith('.github/') ||
      path.startsWith('contracts/component-requests/')
    ) {
      checks.metadataChecks = true;
    } else if (
      path.startsWith('docs/') ||
      path.startsWith('.agents/') ||
      (!path.includes('/') && path.endsWith('.md')) ||
      /(?:^|\/)(?:README|CHANGELOG|CONTRIBUTING|AGENTS)\.md$/.test(path)
    ) {
      // Documentation never changes the shipped UI, but current-state docs and
      // dated process material are both checked by check:docs, so they take the
      // metadata gate instead of skipping validation entirely.
      checks.metadataChecks = true;
    } else if (
      path.startsWith('tests/e2e/') ||
      path.startsWith('tests/support/') ||
      path.startsWith('packages/') ||
      path.startsWith('apps/') ||
      path.startsWith('contracts/') ||
      path === 'package.json' ||
      path === 'bun.lock' ||
      /^playwright(?:\.[\w-]+)?\.config\.ts$/.test(path)
    ) {
      checks.browserChecks = true;
      checks.qualityChecks = true;
    } else if (
      path.startsWith('scripts/check-') ||
      path.startsWith('scripts/verify-') ||
      path.startsWith('tests/') ||
      /^(?:biome|tsconfig|stylelint|eslint)[\w.-]*\.(?:json|js|cjs|mjs|ts)$/.test(path)
    ) {
      checks.qualityChecks = true;
    } else {
      checks.qualityChecks = true;
      checks.browserChecks = true;
    }
  }

  return checks;
}

export function outputs(checks) {
  return [
    `metadata-checks=${checks.metadataChecks}`,
    `quality-checks=${checks.qualityChecks}`,
    `browser-checks=${checks.browserChecks}`,
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head] = process.argv.slice(2);
  if (!base || !head) throw new Error('Expected BASE_SHA and HEAD_SHA');
  const names = execFileSync('git', ['diff', '--name-only', '-z', base, head], {
    encoding: 'utf8',
  }).split('\0');
  process.stdout.write(`${outputs(classifyPaths(names))}\n`);
}
