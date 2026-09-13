import { describe, expect, test } from 'bun:test';
import { readAssetMtime } from './asset-state';

describe('readAssetMtime', () => {
  test('returns the asset mtime when the file exists', async () => {
    await expect(
      readAssetMtime({
        stat: async () => ({ mtimeMs: 1234 }),
      }),
    ).resolves.toBe(1234);
  });

  test('treats a temporarily missing watch asset as unavailable instead of throwing', async () => {
    await expect(
      readAssetMtime({
        stat: async () => {
          throw Object.assign(new Error('missing'), { code: 'ENOENT' });
        },
      }),
    ).resolves.toBeNull();
  });

  test('does not hide unexpected filesystem errors', async () => {
    const failure = Object.assign(new Error('permission denied'), { code: 'EACCES' });

    await expect(
      readAssetMtime({
        stat: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
  });
});
