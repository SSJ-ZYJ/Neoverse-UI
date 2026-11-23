import type { SpecimenField, SpecimenSession } from './lab-specimen-config';
import { readPreferences, writePreferences } from './playground-preferences';

type EditSource = SpecimenField['source'];

interface StoredEdit {
  readonly source: EditSource;
  readonly key: string;
  readonly value: unknown;
}

type StoredSessions = Record<string, StoredEdit[]>;

const sources: readonly EditSource[] = ['preset', 'props', 'state'];
const sourceOrder: Record<EditSource, number> = { preset: 0, props: 1, state: 2 };

function isSource(value: unknown): value is EditSource {
  return typeof value === 'string' && sources.some((source) => source === value);
}

function isStoredEdit(value: unknown): value is StoredEdit {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const edit = value as Partial<StoredEdit>;
  return (
    isSource(edit.source) &&
    typeof edit.key === 'string' &&
    (edit.value === null ||
      typeof edit.value === 'string' ||
      typeof edit.value === 'number' ||
      typeof edit.value === 'boolean')
  );
}

function readSessions(): StoredSessions {
  const stored = readPreferences().specimens;
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {};
  const sessions: StoredSessions = {};
  for (const [id, edits] of Object.entries(stored)) {
    if (Array.isArray(edits) && edits.every(isStoredEdit)) sessions[id] = edits;
  }
  return sessions;
}

export function readSpecimenEdits(id: string): readonly StoredEdit[] {
  return readSessions()[id] ?? [];
}

export function snapshotSpecimenSession(session: SpecimenSession): readonly StoredEdit[] {
  return session.fields
    .filter((field) => field.source === 'preset' || field.edited)
    .map(({ source, key, value }) => ({ source, key, value }))
    .filter((edit) => isStoredEdit(edit));
}

export function restoreSpecimenSession(session: SpecimenSession, id: string): void {
  const edits = [...readSpecimenEdits(id)].sort(
    (left, right) => sourceOrder[left.source] - sourceOrder[right.source],
  );
  for (const { source, key, value } of edits) session.edit(source, key, value);
}

export function persistSpecimenSession(id: string, edits: readonly StoredEdit[]): void {
  if (edits.length === 0) return;
  const sessions = readSessions();
  if (JSON.stringify(sessions[id] ?? []) === JSON.stringify(edits)) return;
  writePreferences({ specimens: { ...sessions, [id]: edits } });
}

export function clearSpecimenSession(id: string): void {
  const sessions = readSessions();
  if (!(id in sessions)) return;
  const next = { ...sessions };
  delete next[id];
  writePreferences({ specimens: next });
}
