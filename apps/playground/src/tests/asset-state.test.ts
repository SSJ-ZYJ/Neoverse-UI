import { describe, expect, test } from 'bun:test';
import { waitForAssets } from '../app/asset-state';

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
