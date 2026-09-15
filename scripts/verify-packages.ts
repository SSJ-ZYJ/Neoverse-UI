import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative } from 'node:path';

const repositoryRoot = join(import.meta.dir, '..');
const npmRegistry = 'https://registry.npmjs.org/';
const packageDirs = ['tokens', 'motion', 'glass-runtime', 'tailwind', 'vue'] as const;

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
const rootLicenseText = await readFile(join(repositoryRoot, rootLicense), 'utf8');

const tempRoot = await mkdtemp(join(tmpdir(), 'neoverse-ui-release-'));
const packDir = join(tempRoot, 'packs');
const consumerDir = join(tempRoot, 'consumer');
await mkdir(packDir, { recursive: true });

try {
  const packedPackages = new Map<string, string>();

  for (const dirName of packageDirs) {
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
      (await readFile(join(packageDir, packageLicense), 'utf8')) === rootLicenseText,
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

  const dependencies: Record<string, string> = { vue: '^3.5.0' };
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
        overrides,
        devDependencies: { '@types/node': '^22.0.0', typescript: '^5.6.0' },
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    join(consumerDir, 'smoke.ts'),
    `import { existsSync } from 'node:fs';\n` +
      `import { fileURLToPath } from 'node:url';\n` +
      `import { UiButton, UiNotice, UiTooltipSurface } from '@neoverse-ui/vue';\n` +
      `import { cssVariables } from '@neoverse-ui/tokens';\n` +
      `import { createGlassRenderer } from '@neoverse-ui/glass-runtime';\n` +
      `if (!UiButton || !UiNotice || !UiTooltipSurface || !cssVariables || !createGlassRenderer) throw new Error('public JS exports are incomplete');\n` +
      `for (const specifier of ['@neoverse-ui/tokens/css', '@neoverse-ui/motion/css', '@neoverse-ui/tailwind/index.css', '@neoverse-ui/tailwind/theme.css', '@neoverse-ui/tailwind/components.css', '@neoverse-ui/vue/index.css']) {\n` +
      `  const resolved = import.meta.resolve(specifier);\n` +
      `  if (!existsSync(fileURLToPath(resolved))) throw new Error(\`missing CSS export: \${specifier}\`);\n` +
      `}\n`,
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

  await run(['bun', 'install'], consumerDir);
  await run(['bun', 'smoke.ts'], consumerDir);
  await run(['bunx', 'tsc', '--project', 'tsconfig.json'], consumerDir);

  console.log(`Release package verification passed for ${packageDirs.length} package(s).`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
