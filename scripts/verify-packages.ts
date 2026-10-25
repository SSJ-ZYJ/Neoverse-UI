import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative } from 'node:path';
import {
  type ReleasePackage,
  verifyInstalledPackages,
  waitForPublishedPackages,
} from './verify-published';

const repositoryRoot = join(import.meta.dir, '..');
const npmRegistry = 'https://registry.npmjs.org/';
const published = process.argv.includes('--published');
const packageDirs = [
  'tokens',
  'motion',
  'overlay-runtime',
  'giscus-theme',
  'glass-runtime',
  'tailwind',
  'vue',
  'react',
] as const;

type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  description?: string;
  license?: string;
  repository?: unknown;
  homepage?: string;
  bugs?: { url?: string };
  exports?: unknown;
  dependencies?: Record<string, string>;
  publishConfig?: { access?: string; registry?: string };
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run(command: string[], cwd: string) {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(
      `${command.join(' ')} failed in ${cwd}\n${stdout.trim()}\n${stderr.trim()}`.trim(),
    );
  }
  return stdout.trim();
}

function exportTargets(value: unknown): string[] {
  if (typeof value === 'string') return value.startsWith('./') ? [value] : [];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(exportTargets);
}

const rootLicense = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].find((name) =>
  existsSync(join(repositoryRoot, name)),
);
assert(
  rootLicense,
  'A root LICENSE file is required before public publishing. Choose the project license first.',
);
const rootPackage = JSON.parse(
  await readFile(join(repositoryRoot, 'package.json'), 'utf8'),
) as PackageJson;
assert(rootPackage.license, 'The root package.json must declare the chosen SPDX license.');
// Git can check out identical license text with different platform line endings.
// Git 可将同一许可证文本以不同平台换行符检出。
const rootLicenseText = (await readFile(join(repositoryRoot, rootLicense), 'utf8')).replace(
  /\r\n/g,
  '\n',
);

const tempRoot = await mkdtemp(join(tmpdir(), 'neoverse-ui-release-'));
const packDir = join(tempRoot, 'packs');
const consumerDir = join(tempRoot, 'consumer');
await mkdir(packDir, { recursive: true });

try {
  const packedPackages = new Map<string, string>();
  const publicVersions = new Map<string, string>();
  const releasePackages: ReleasePackage[] = [];
  for (const dirName of packageDirs) {
    const manifest = JSON.parse(
      await readFile(join(repositoryRoot, 'packages', dirName, 'package.json'), 'utf8'),
    ) as PackageJson;
    assert(manifest.name && manifest.version, `${dirName}: package name and version are required`);
    publicVersions.set(manifest.name, manifest.version);
    releasePackages.push(manifest as ReleasePackage);
  }

  if (published) {
    await waitForPublishedPackages(releasePackages);
  }

  for (const dirName of published ? [] : packageDirs) {
    const packageDir = join(repositoryRoot, 'packages', dirName);
    const sourcePackage = JSON.parse(
      await readFile(join(packageDir, 'package.json'), 'utf8'),
    ) as PackageJson;

    assert(
      typeof sourcePackage.name === 'string' && sourcePackage.name.startsWith('@neoverse-ui/'),
      `${dirName}: invalid package name`,
    );
    assert(sourcePackage.version, `${sourcePackage.name}: version is required`);
    assert(sourcePackage.private !== true, `${sourcePackage.name}: publishable package is private`);
    assert(sourcePackage.description, `${sourcePackage.name}: description is required`);
    assert(sourcePackage.license, `${sourcePackage.name}: license metadata is required`);
    assert(
      sourcePackage.license === rootPackage.license,
      `${sourcePackage.name}: license metadata must match the root package`,
    );
    const packageLicense = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].find((name) =>
      existsSync(join(packageDir, name)),
    );
    assert(packageLicense, `${sourcePackage.name}: package LICENSE file is required`);
    assert(
      (await readFile(join(packageDir, packageLicense), 'utf8')).replace(/\r\n/g, '\n') ===
        rootLicenseText,
      `${sourcePackage.name}: package LICENSE must match the root LICENSE`,
    );
    assert(sourcePackage.repository, `${sourcePackage.name}: repository metadata is required`);
    assert(sourcePackage.homepage, `${sourcePackage.name}: homepage metadata is required`);
    assert(sourcePackage.bugs?.url, `${sourcePackage.name}: bugs.url metadata is required`);
    assert(
      sourcePackage.publishConfig?.access === 'public',
      `${sourcePackage.name}: publishConfig.access must be public`,
    );
    assert(
      sourcePackage.publishConfig?.registry === npmRegistry,
      `${sourcePackage.name}: publishConfig.registry must be ${npmRegistry}`,
    );

    const packOutput = await run(
      ['bun', 'pm', 'pack', '--destination', packDir, '--quiet'],
      packageDir,
    );
    const tarball = packOutput.split(/\r?\n/).filter(Boolean).at(-1);
    assert(tarball, `${sourcePackage.name}: bun pm pack did not return a tarball path`);

    const tarballPath = tarball.trim();
    const packedJsonText = await run(
      ['tar', '-xOf', tarballPath, 'package/package.json'],
      repositoryRoot,
    );
    const packedJson = JSON.parse(packedJsonText) as PackageJson;
    assert(
      !packedJsonText.includes('workspace:'),
      `${sourcePackage.name}: workspace: leaked into tarball`,
    );
    assert(packedJson.name === sourcePackage.name, `${sourcePackage.name}: packed name mismatch`);
    assert(
      packedJson.version === sourcePackage.version,
      `${sourcePackage.name}: packed version mismatch`,
    );
    for (const [name, range] of Object.entries(packedJson.dependencies ?? {})) {
      if (!name.startsWith('@neoverse-ui/')) continue;
      const version = publicVersions.get(name);
      assert(version, `${sourcePackage.name}: unknown public dependency ${name}`);
      assert(
        Bun.semver.satisfies(version, range),
        `${sourcePackage.name}: dependency ${name}@${range} excludes release version ${version}`,
      );
    }

    const entries = (await run(['tar', '-tzf', tarballPath], repositoryRoot)).split(/\r?\n/);
    assert(
      entries.includes('package/README.md'),
      `${sourcePackage.name}: README.md is missing from tarball`,
    );
    assert(
      entries.some((entry) => /^package\/LICENSE(?:\.(?:md|txt))?$/i.test(entry)),
      `${sourcePackage.name}: LICENSE is missing from tarball`,
    );
    assert(
      !entries.some((entry) => /(?:^|\/)src\//.test(entry) || /(?:^|\/)tests?\//.test(entry)),
      `${sourcePackage.name}: source/test files leaked into tarball`,
    );
    assert(
      !entries.some((entry) => /\.test\.(?:js|d\.ts|d\.ts\.map|js\.map)$/.test(entry)),
      `${sourcePackage.name}: compiled tests leaked into tarball`,
    );
    if (sourcePackage.name === '@neoverse-ui/tailwind') {
      assert(
        !entries.includes('package/dist/playground.css'),
        '@neoverse-ui/tailwind: playground.css must not be published',
      );
      const consumerCss = await run(
        ['tar', '-xOf', tarballPath, 'package/dist/index.css'],
        repositoryRoot,
      );
      for (const fragment of [
        '.sr-only{',
        '.material-glass-elevated{',
        '.ui-button{',
        '.ui-table-region{',
        '.ui-disclosure__content{',
        ':where(.ui-input,.ui-textarea,.ui-select){',
        '.ui-choice__native',
        '.ui-switch__native',
        '.ui-field__message',
        '.ui-overlay-panel--fallback-open',
        '.ui-dropdown-menu__item',
        '.ui-stat-card',
        '.ui-stat-grid',
        '.ui-timeline',
        '.ui-step-flow',
      ]) {
        assert(
          consumerCss.includes(fragment),
          `@neoverse-ui/tailwind: compiled consumer bundle is missing ${fragment}`,
        );
      }
      assert(
        !consumerCss.includes('.material-glass-card{'),
        '@neoverse-ui/tailwind: removed glass-card material leaked into the consumer bundle',
      );
    }

    if (sourcePackage.name === '@neoverse-ui/vue' || sourcePackage.name === '@neoverse-ui/react') {
      const adapterCss = await run(
        ['tar', '-xOf', tarballPath, 'package/dist/index.css'],
        repositoryRoot,
      );
      assert(
        adapterCss.includes("@import '@neoverse-ui/tailwind/index.css';"),
        `${sourcePackage.name}: index.css must forward the compiled Tailwind consumer bundle`,
      );
      assert(
        !adapterCss.includes("@import '@neoverse-ui/tailwind/components.css';") &&
          !adapterCss.includes("@import '@neoverse-ui/tailwind/theme.css';"),
        `${sourcePackage.name}: index.css must not expose a source-only or components-only style path`,
      );
    }

    for (const target of exportTargets(packedJson.exports)) {
      const entry = `package/${target.slice(2)}`;
      assert(entries.includes(entry), `${sourcePackage.name}: export target ${target} is missing`);
    }

    packedPackages.set(sourcePackage.name, tarballPath);
  }

  await mkdir(consumerDir, { recursive: true });
  const localTarballsDir = join(consumerDir, 'packages');
  await mkdir(localTarballsDir, { recursive: true });

  const dependencies: Record<string, string> = { react: '^19.2.0', vue: '^3.5.0' };
  if (published) {
    for (const expected of releasePackages) dependencies[expected.name] = expected.version;
  }
  const overrides: Record<string, string> = {};
  for (const [name, tarball] of packedPackages) {
    const destination = join(localTarballsDir, basename(tarball));
    await copyFile(tarball, destination);
    const localSpecifier = `file:${relative(consumerDir, destination).replaceAll('\\', '/')}`;
    dependencies[name] = localSpecifier;
    overrides[name] = localSpecifier;
  }

  await writeFile(
    join(consumerDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'neoverse-ui-release-smoke',
        private: true,
        type: 'module',
        dependencies,
        ...(published ? {} : { overrides }),
        devDependencies: { '@types/node': '^22.0.0', typescript: '^5.6.0' },
      },
      null,
      2,
    )}\n`,
  );

  // Registry checks exercise the published baseline, not unversioned source additions.
  // Local tarball verification must also compile and load every candidate API below.
  const candidateSmoke = published
    ? ''
    : `import * as ReactAdapters from '@neoverse-ui/react';\n` +
      `import { UiTerminalEcho, type TerminalEchoProps } from '@neoverse-ui/vue';\n` +
      `for (const name of ['UiControlSurface', 'UiNavigationItem', 'UiSegmentedControl', 'UiBadge', 'UiStatusIndicator', 'UiTooltipSurface', 'UiSkeleton', 'UiScrollbar', 'UiTerminalSurface', 'UiTerminalTranscript', 'UiTerminalLine', 'UiTerminalPrompt', 'UiTerminalEcho', 'UiStatCard', 'UiTimeline', 'UiStepFlow'] as const) if (typeof ReactAdapters[name] !== 'function') throw new Error('missing React adapter: ' + name);\n` +
      `const reactSegments: ReactAdapters.UiSegmentedControlProps = { options: [{ value: 'en', label: 'English' }], value: 'en', onValueChange: value => { void value; } };\n` +
      `const reactPrompt: ReactAdapters.UiTerminalPromptProps = { label: 'Command', value: 'he', suggestion: 'help', segments: [{ id: 'host', label: 'local', tone: 'host' }] };\n` +
      `const reactEcho: ReactAdapters.UiTerminalEchoProps = { text: 'echo hello', segments: reactPrompt.segments };\n` +
      `const reactMetric: ReactAdapters.UiStatCardProps = { label: 'Latency', value: 0, unit: 'ms' };\n` +
      `const terminalEchoProps: TerminalEchoProps = { text: 'echo hello', segments: terminalPromptProps.segments };\n` +
      `if (!UiTerminalEcho) throw new Error('missing Vue terminal echo');\n` +
      `void [reactSegments, reactPrompt, reactEcho, reactMetric, terminalEchoProps];\n`;

  await writeFile(
    join(consumerDir, 'smoke.ts'),
    `import { existsSync } from 'node:fs';\n` +
      `import { fileURLToPath } from 'node:url';\n` +
      `import { UiAction as ReactUiAction, UiPresence as ReactUiPresence, useUiPresence } from '@neoverse-ui/react';\n` +
      `import { UiCheckbox as ReactUiCheckbox, UiRadioGroup as ReactUiRadioGroup, UiSwitch as ReactUiSwitch, UiField as ReactUiField, UiPopover as ReactUiPopover, UiDropdownMenu as ReactUiDropdownMenu, type UiFieldControlAttrs } from '@neoverse-ui/react';\n` +
      `import { UiButton, UiNotice, UiTooltipSurface, UiPresence as VueUiPresence, presence, staggerStyle } from '@neoverse-ui/vue';\n` +
      `import { UiTerminalSurface, UiTerminalLine, UiTerminalTranscript, UiTerminalPrompt, type TerminalSurfaceProps, type TerminalLineProps, type TerminalTranscriptProps, type TerminalPromptProps } from '@neoverse-ui/vue';\n` +
      `import { UiStatCard, UiTimeline, UiStepFlow, type StatCardProps, type TimelineProps, type StepFlowProps } from '@neoverse-ui/vue';\n` +
      `import { UiCheckbox as VueUiCheckbox, UiRadioGroup as VueUiRadioGroup, UiSwitch as VueUiSwitch, UiField as VueUiField, UiPopover as VueUiPopover, UiDropdownMenu as VueUiDropdownMenu, type FieldControlAttrs } from '@neoverse-ui/vue';\n` +
      `import { showAnchoredOverlay, hideAnchoredOverlay, stopOverlayTracking, positionAnchoredOverlay, resolveAnchoredPosition, type AnchoredOverlayOptions } from '@neoverse-ui/overlay-runtime';\n` +
      `import { cssVariables } from '@neoverse-ui/tokens';\n` +
      `import { createGlassRenderer } from '@neoverse-ui/glass-runtime';\n` +
      `import { startViewTransition, createParticleDissolve, particleDissolvePresets, presenceVariants } from '@neoverse-ui/motion';\n` +
      `if (!ReactUiAction || !UiButton || !UiNotice || !UiTooltipSurface || !cssVariables || !createGlassRenderer) throw new Error('public JS exports are incomplete');\n` +
      `if (![ReactUiCheckbox, ReactUiRadioGroup, ReactUiSwitch, ReactUiField, ReactUiPopover, ReactUiDropdownMenu, VueUiCheckbox, VueUiRadioGroup, VueUiSwitch, VueUiField, VueUiPopover, VueUiDropdownMenu].every(Boolean)) throw new Error('public form/overlay exports are incomplete');\n` +
      `if (![UiTerminalSurface, UiTerminalLine, UiTerminalTranscript, UiTerminalPrompt].every(Boolean)) throw new Error('public terminal exports are incomplete');\n` +
      `const statCardProps: StatCardProps = { label: 'Latency', value: 0, unit: 'ms' };\n` +
      `const timelineProps: TimelineProps = { items: [{ id: 'release', title: 'Release', time: 'October', dateTime: '2026-10' }] };\n` +
      `const stepFlowProps: StepFlowProps = { items: [{ id: 'build', title: 'Build', status: 'current', statusLabel: 'In progress' }] };\n` +
      `if (![UiStatCard, UiTimeline, UiStepFlow].every(Boolean)) throw new Error('public presentation exports are incomplete');\n` +
      `void [statCardProps, timelineProps, stepFlowProps];\n` +
      `const terminalSurfaceProps: TerminalSurfaceProps = { title: 'Smoke terminal', density: 'compact' };\n` +
      `const terminalLineProps: TerminalLineProps = { text: 'Ready', tone: 'normal' };\n` +
      `const terminalTranscriptProps: TerminalTranscriptProps = { followTail: true };\n` +
      `const terminalPromptProps: TerminalPromptProps = { label: 'Smoke input', segments: [{ id: 'host', label: 'neoverse', tone: 'host' }] };\n` +
      `if (terminalSurfaceProps.title !== 'Smoke terminal' || terminalLineProps.text !== 'Ready' || !terminalTranscriptProps.followTail || terminalPromptProps.label !== 'Smoke input' || cssVariables.components.terminal.cursor !== '--neoverse-terminal-cursor') throw new Error('public terminal types/tokens are incomplete');\n` +
      `if (![showAnchoredOverlay, hideAnchoredOverlay, stopOverlayTracking, positionAnchoredOverlay, resolveAnchoredPosition].every((entry) => typeof entry === 'function')) throw new Error('public Overlay Runtime exports are incomplete');\n` +
      `const vueFieldAttrs: FieldControlAttrs = { id: 'email', 'aria-describedby': 'email-help', required: true };\n` +
      `const reactFieldAttrs: UiFieldControlAttrs = vueFieldAttrs;\n` +
      `const overlayPlacement: AnchoredOverlayOptions['placement'] = 'auto';\n` +
      `const position = resolveAnchoredPosition({ trigger: { top: 10, right: 110, bottom: 50, left: 10, width: 100, height: 40 }, overlayWidth: 200, overlayHeight: 100, viewport: { width: 800, height: 600 }, gap: 8, placement: overlayPlacement });\n` +
      `if (reactFieldAttrs['aria-describedby'] !== 'email-help' || position.top !== 58) throw new Error('public form/overlay contracts are incomplete');\n` +
      `if (!ReactUiPresence || !VueUiPresence || typeof useUiPresence !== 'function' || typeof startViewTransition !== 'function' || typeof createParticleDissolve !== 'function') throw new Error('public Motion/Presence exports are incomplete');\n` +
      `if (presence('pop', 'top')['data-neoverse-motion'] !== 'pop' || !('--neoverse-motion-enter-delay' in staggerStyle(1)) || !presenceVariants.includes('rise') || !particleDissolvePresets.medium) throw new Error('public Motion/Presence contracts are incomplete');\n` +
      `for (const specifier of ['@neoverse-ui/tokens/css', '@neoverse-ui/motion/css', '@neoverse-ui/giscus-theme/light.css', '@neoverse-ui/giscus-theme/dark.css', '@neoverse-ui/tailwind/index.css', '@neoverse-ui/tailwind/theme.css', '@neoverse-ui/tailwind/components.css', '@neoverse-ui/tailwind/prose.css', '@neoverse-ui/vue/index.css', '@neoverse-ui/react/index.css']) {\n` +
      `  const resolved = import.meta.resolve(specifier);\n` +
      `  if (!existsSync(fileURLToPath(resolved))) throw new Error(\`missing CSS export: \${specifier}\`);\n` +
      `}\n` +
      candidateSmoke,
  );

  await writeFile(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          skipLibCheck: true,
          lib: ['ES2022', 'DOM'],
          noEmit: true,
        },
        include: ['smoke.ts'],
      },
      null,
      2,
    )}\n`,
  );

  const registryArgs = published
    ? ['--registry', npmRegistry, '--no-cache', '--ignore-scripts']
    : [];
  if (published) {
    await writeFile(
      join(consumerDir, '.npmrc'),
      `registry=${npmRegistry}\n@neoverse-ui:registry=${npmRegistry}\n`,
    );
  }
  await run(['bun', 'install', ...registryArgs], consumerDir);
  if (published) await verifyInstalledPackages(consumerDir, releasePackages);
  await run(['bun', 'smoke.ts'], consumerDir);
  await run(['bunx', 'tsc', '--project', 'tsconfig.json'], consumerDir);

  console.log(
    `${published ? 'Published registry' : 'Release'} package verification passed for ${packageDirs.length} package(s).`,
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
