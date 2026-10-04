export type AssetStatSource = {
  stat: () => Promise<{ mtimeMs: number } | null>;
};

export type AssetExistenceSource = {
  exists: () => Promise<boolean>;
};

export type AssetAvailabilityOptions = {
  attempts?: number;
  delay?: () => Promise<void>;
};

const isMissingAssetError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';

export const readAssetMtime = async (asset: AssetStatSource): Promise<number | null> => {
  try {
    const stat = await asset.stat();
    return stat?.mtimeMs ?? null;
  } catch (error: unknown) {
    if (isMissingAssetError(error)) {
      return null;
    }

    throw error;
  }
};

export const waitForAssets = async (
  assets: readonly AssetExistenceSource[],
  options: AssetAvailabilityOptions = {},
): Promise<boolean> => {
  const attempts = Math.max(Math.trunc(options.attempts ?? 1), 1);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const availability = await Promise.all(assets.map((asset) => asset.exists()));
    if (availability.every(Boolean)) {
      return true;
    }

    if (attempt < attempts - 1) {
      await options.delay?.();
    }
  }

  return false;
};
