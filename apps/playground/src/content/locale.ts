export type Locale = 'en' | 'zh';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh';
}

/** Resolve the shell language before paint and when the workspace mounts. */
export function resolveWorkspaceLocale(
  query: unknown,
  stored: unknown,
  browserLanguage: string,
  valid = isLocale,
): Locale {
  if (valid(query)) return query;
  if (valid(stored)) return stored;
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export interface LocalizedText {
  readonly en: string;
  readonly zh: string;
}

export const localized = (en: string, zh: string): LocalizedText => ({ en, zh });

export const localizedTerm = (en: string, zh: string): LocalizedText =>
  localized(en, `${en} · ${zh}`);

export function localize(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

/* The English suffix is a reading aid for Chinese labels only. */
export function catalogueSecondary(label: LocalizedText, locale: Locale): string | undefined {
  if (locale !== 'zh' || label.en === label.zh) return undefined;
  return label.en;
}

export function formatLocalized(
  value: LocalizedText,
  locale: Locale,
  replacements: Record<string, string | number> = {},
): string {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)),
    localize(value, locale),
  );
}
