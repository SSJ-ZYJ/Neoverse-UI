export type AssetStatSource = {
  stat: () => Promise<{ mtimeMs: number } | null>;
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
