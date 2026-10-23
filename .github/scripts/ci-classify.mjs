import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// A visual change also needs source quality checks. Unknown paths fail closed.
export function classifyPaths(paths) {
  const checks = { metadataChecks: false, qualityChecks: false, visualChecks: false };

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
      (!path.includes('/') && path.endsWith('.md')) ||
      /(?:^|\/)(?:README|CHANGELOG|CONTRIBUTING|AGENTS)\.md$/.test(path)
    ) {
      // Non-contract documentation never changes the shipped UI.
    } else if (
      path.startsWith('tests/visual/') ||
      path.startsWith('packages/') ||
      path.startsWith('apps/') ||
      path.startsWith('themes/') ||
      path.startsWith('contracts/') ||
      path === 'package.json' ||
      path === 'bun.lock' ||
      /^playwright(?:\.[\w-]+)?\.config\.ts$/.test(path)
    ) {
      checks.visualChecks = true;
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
      checks.visualChecks = true;
    }
  }

  return checks;
}

export function outputs(checks) {
  return [
    `metadata-checks=${checks.metadataChecks}`,
    `quality-checks=${checks.qualityChecks}`,
    `visual-checks=${checks.visualChecks}`,
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
