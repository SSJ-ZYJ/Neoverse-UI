export type AssetExistenceSource = {
  exists: () => Promise<boolean>;
};

export type AssetAvailabilityOptions = {
  attempts?: number;
  delay?: () => Promise<void>;
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
