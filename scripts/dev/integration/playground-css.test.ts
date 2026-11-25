import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publishPlaygroundCss } from '../playground-css';

const light = ':root{--neoverse-color-surface-canvas:white;--neoverse-space-3:12px}';
const dark = ':root{--neoverse-color-surface-canvas:black;--neoverse-space-3:12px}';

test('readers get the last complete stylesheet until a new build succeeds', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neoverse-css-'));
  const target = join(directory, 'playground.css');
  const partialWritten = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  try {
    await writeFile(target, light);
    const update = publishPlaygroundCss(target, async (output) => {
      try {
        await writeFile(output, ':root{');
      } finally {
        partialWritten.resolve();
      }
      await finish.promise;
      await writeFile(output, dark);
    });
    try {
      await partialWritten.promise;
      expect(await readFile(target, 'utf8')).toBe(light);
    } finally {
      finish.resolve();
      await update;
    }
    expect(await readFile(target, 'utf8')).toBe(dark);

    await expect(publishPlaygroundCss(target, (output) => writeFile(output, ''))).rejects.toThrow(
      'missing foundation tokens',
    );
    expect(await readFile(target, 'utf8')).toBe(dark);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
