import { describe, expect, test } from 'bun:test';
import { readAssetMtime, waitForAssets } from './asset-state';

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

describe('waitForAssets', () => {
  test('returns immediately when every asset is available', async () => {
    let delayCount = 0;

    await expect(
      waitForAssets([{ exists: async () => true }, { exists: async () => true }], {
        attempts: 3,
        delay: async () => {
          delayCount += 1;
        },
      }),
    ).resolves.toBe(true);
    expect(delayCount).toBe(0);
  });

  test('retries a transiently missing asset before failing the request', async () => {
    let checks = 0;
    let delayCount = 0;

    await expect(
      waitForAssets(
        [
          {
            exists: async () => {
              checks += 1;
              return checks >= 2;
            },
          },
          { exists: async () => true },
        ],
        {
          attempts: 3,
          delay: async () => {
            delayCount += 1;
          },
        },
      ),
    ).resolves.toBe(true);
    expect(delayCount).toBe(1);
  });

  test('returns false after the configured retry budget is exhausted', async () => {
    let delayCount = 0;

    await expect(
      waitForAssets([{ exists: async () => false }], {
        attempts: 3,
        delay: async () => {
          delayCount += 1;
        },
      }),
    ).resolves.toBe(false);
    expect(delayCount).toBe(2);
  });
});
