/* Single persistence entry for Design Lab preferences. The shell and the React
   runtime fixture share one storage record so a theme chosen on either surface
   is picked up by the other one. */

export const playgroundPreferencesKey = 'neoverse-design-lab.preferences';

export type PreferenceRecord = Record<string, unknown>;

export function readPreferences(key = playgroundPreferencesKey): PreferenceRecord {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as PreferenceRecord;
  } catch {
    return {};
  }
}

export function writePreferences(next: PreferenceRecord): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      playgroundPreferencesKey,
      JSON.stringify({ ...readPreferences(), ...next }),
    );
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}
