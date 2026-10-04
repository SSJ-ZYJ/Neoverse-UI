export {};

const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
]);

const tracked = Bun.spawnSync({
  cmd: ['git', 'ls-files', '-co', '--exclude-standard'],
  stdout: 'pipe',
  stderr: 'pipe',
});

if (tracked.exitCode !== 0) {
  throw new Error(`git ls-files failed: ${tracked.stderr.toString().trim()}`);
}

const files = tracked.stdout
  .toString()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => {
    const dot = file.lastIndexOf('.');
    return dot >= 0 && textExtensions.has(file.slice(dot).toLowerCase());
  });

const decoder = new TextDecoder('utf-8', { fatal: true });
const issues: string[] = [];

for (const file of files) {
  const source = Bun.file(file);
  if (!(await source.exists())) continue;
  const bytes = new Uint8Array(await source.arrayBuffer());
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    issues.push(`${file}: UTF-8 BOM is not allowed`);
    continue;
  }

  let text: string;
  try {
    text = decoder.decode(bytes);
  } catch {
    issues.push(`${file}: invalid UTF-8`);
    continue;
  }

  if (text.includes('\uFFFD')) {
    issues.push(`${file}: contains U+FFFD replacement character`);
  }
}

if (issues.length > 0) {
  throw new Error(['Text integrity check failed:', ...issues].join('\n'));
}

console.log(`Text integrity check passed for ${files.length} file(s).`);
