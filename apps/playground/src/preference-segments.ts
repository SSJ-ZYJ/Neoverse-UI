import { glassMaterial, type Material, materials } from '@neoverse-ui/tokens';
import { appCopy, type Locale, type LocalizedText, localize, localized } from './playground-content';

export const materialNames = {
  glass: localized(glassMaterial.name.en, glassMaterial.name.zh),
  solid: localized('Solid', '实体'),
  frosted: localized('Frosted (experimental foundation preview)', '磨砂（实验性基础预览）'),
} as const satisfies Record<Material, LocalizedText>;

/** Short labels for the toolbar plate; the accessible name keeps the full material name. */
export function materialSegments(locale: Locale) {
  const short = {
    glass: localized('Glass', '玻璃'),
    solid: localized('Solid', '实体'),
    frosted: localized('Frosted (exp.)', '磨砂（实验）'),
  } as const;

  return materials.map((value) => ({
    value,
    label: localize(short[value], locale),
    ariaLabel: localize(materialNames[value], locale),
  }));
}

export const themeGlyphPaths = {
  system: 'M3 4h18v13H3V4Zm4 16h10m-5-3v3',
  light:
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  dark: 'M20.9 14.1A9.2 9.2 0 0 1 9.9 3.2 9.2 9.2 0 1 0 20.9 14.1Z',
};

export const languageCodes = ['en', 'zh'] as const;
export const languageNames = { en: localized('English', '英文'), zh: appCopy.language.options.zh };

export function languageSegments(locale: Locale) {
  return languageCodes.map((value) => ({
    value,
    label: value === 'en' ? 'EN' : localize(languageNames.zh, locale),
    ariaLabel: localize(languageNames[value], locale),
  }));
}
