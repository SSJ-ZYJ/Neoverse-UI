import { describe, expect, test } from 'bun:test';
import {
  type Budgets,
  categoryOf,
  checkBudgets,
  existingFiles,
  lineCount,
  severityOf,
} from './check-budgets';

const budgets = (exceptions: Budgets['exceptions'] = {}): Budgets => ({
  limits: { source: [300, 500], css: [400, 600], test: [400, 700] },
  exceptions,
});

const input = (files: string[], sizes: Array<[string, number]>, config: Budgets = budgets()) => ({
  files,
  sizes: new Map(sizes),
  budgets: config,
});

describe('category classification', () => {
  test('separates tests, styles and source', () => {
    expect(categoryOf('a/b.test.ts')).toBe('test');
    expect(categoryOf('a/b.spec.tsx')).toBe('test');
    expect(categoryOf('a/b.css')).toBe('css');
    expect(categoryOf('a/b.ts')).toBe('source');
    expect(categoryOf('a/b.vue')).toBe('source');
    expect(categoryOf('a/b.md')).toBeNull();
  });
});

describe('working-tree file list', () => {
  test('drops blank entries and paths deleted from the working tree', () => {
    const present = new Set(['a.ts', 'b.css']);
    expect(
      existingFiles(['a.ts', '', 'b.css', 'deleted.vue'], (file) => present.has(file)),
    ).toEqual(['a.ts', 'b.css']);
  });
});

describe('line counting', () => {
  test('returns zero for an empty file', () => {
    expect(lineCount('')).toBe(0);
  });

  test('does not count a trailing newline as an extra line', () => {
    expect(lineCount('a\nb\n')).toBe(2);
    expect(lineCount('a\n')).toBe(1);
  });

  test('counts the last line without a trailing newline', () => {
    expect(lineCount('a\nb')).toBe(2);
    expect(lineCount('a')).toBe(1);
  });
});

describe('severity bands', () => {
  test('returns null at or below the soft limit', () => {
    expect(severityOf(300, 300, 500)).toBeNull();
  });

  test('marks an exceeded hard limit distinctly', () => {
    expect(severityOf(501, 300, 500)).toBe('EXCEEDED');
  });

  test('marks two units from the hard limit as AT LIMIT', () => {
    expect(severityOf(498, 300, 500)).toBe('AT LIMIT');
  });
});

describe('budget validation', () => {
  test('passes files within limits', () => {
    const result = checkBudgets(input(['a.ts'], [['a.ts', 120]]));
    expect(result.errors).toEqual([]);
    expect(result.findings).toEqual([]);
  });

  test('fails a file over the hard limit without an exception', () => {
    const result = checkBudgets(input(['a.ts'], [['a.ts', 520]]));
    expect(result.errors).toContain(
      'a.ts:1: 520 lines exceeds the source hard limit 500; register an exception or split the file',
    );
  });

  test('reports REVIEW and NEAR findings without failing', () => {
    const result = checkBudgets(
      input(
        ['a.ts', 'b.ts'],
        [
          ['a.ts', 310],
          ['b.ts', 480],
        ],
      ),
    );
    expect(result.errors).toEqual([]);
    expect(result.findings.map((finding) => finding.severity)).toEqual(['REVIEW', 'NEAR']);
  });

  test('accepts an exception when the file is at or below the ceiling', () => {
    for (const size of [580, 600]) {
      const result = checkBudgets(
        input(
          ['a.ts'],
          [['a.ts', size]],
          budgets({
            'a.ts': { ceiling: 600, reason: '2026-11-22: Entry point; remove after the split.' },
          }),
        ),
      );
      expect(result.errors).toEqual([]);
    }
  });

  test('rejects an exception when the file exceeds the ceiling', () => {
    const result = checkBudgets(
      input(
        ['a.ts'],
        [['a.ts', 610]],
        budgets({
          'a.ts': { ceiling: 600, reason: '2026-11-22: Entry point; remove after the split.' },
        }),
      ),
    );
    expect(result.errors).toContain(
      'a.ts: 610 lines exceeds exception ceiling 600; raise the ceiling with justification or split the file',
    );
  });

  test('rejects an exception within the hard limit', () => {
    const result = checkBudgets(
      input(
        ['a.ts'],
        [['a.ts', 200]],
        budgets({
          'a.ts': { ceiling: 200, reason: '2026-11-22: Entry point; remove after the split.' },
        }),
      ),
    );
    expect(result.errors).toContain('a.ts: exception is within the hard limit 500; remove it');
  });

  test('rejects an exception with an undated or empty reason', () => {
    const result = checkBudgets(
      input(['a.ts'], [['a.ts', 600]], budgets({ 'a.ts': { ceiling: 600, reason: 'Large file' } })),
    );
    expect(result.errors).toContain(
      'a.ts: exception reason must start with a date and a description',
    );
  });

  test('rejects an exception pointing at a missing file', () => {
    const result = checkBudgets(
      input(
        ['a.ts'],
        [['a.ts', 120]],
        budgets({
          'missing.ts': { ceiling: 600, reason: '2026-11-22: Removed file; delete this entry.' },
        }),
      ),
    );
    expect(result.errors).toContain('missing.ts: exception names a file that does not exist');
  });
});

describe('directory governance budgets', () => {
  const dirBudgets = (directoryExceptions: Budgets['directoryExceptions'] = {}): Budgets => ({
    limits: { source: [300, 500], css: [400, 600], test: [400, 700] },
    directoryLimits: { source: [15, 25], css: [15, 25], test: [15, 25] },
    forbiddenDirectoryNames: ['utils', 'helpers', 'common', 'misc'],
    exceptions: {},
    directoryExceptions,
  });

  test('flags directories that exceed the direct-file hard limit without an exception', () => {
    const files = Array.from({ length: 26 }, (_, index) => `packages/demo/src/file-${index}.ts`);
    const result = checkBudgets(
      input(
        files,
        files.map((file) => [file, 20]),
        dirBudgets(),
      ),
    );
    expect(result.errors).toContain(
      'packages/demo/src: 26 direct files exceeds the source directory hard limit 25; split by domain responsibility or register a dated exception',
    );
  });

  test('accepts a dated directory exception within ceiling and rejects stale ones', () => {
    const files = Array.from({ length: 26 }, (_, index) => `packages/demo/src/file-${index}.css`);
    const accepted = checkBudgets(
      input(
        files,
        files.map((file) => [file, 20]),
        dirBudgets({
          'packages/demo/src': {
            ceiling: 30,
            reason: '2026-11-27: Legacy styles awaiting domain split.',
          },
        }),
      ),
    );
    expect(accepted.errors).toEqual([]);

    const stale = checkBudgets(
      input(
        files.slice(0, 10),
        files.slice(0, 10).map((file) => [file, 20]),
        dirBudgets({
          'packages/demo/src': {
            ceiling: 30,
            reason: '2026-11-27: Legacy styles awaiting domain split.',
          },
        }),
      ),
    );
    expect(stale.errors).toContain(
      'packages/demo/src: directory exception is within the hard limit 25; remove it',
    );
  });

  test('rejects forbidden generic dumping-ground directory names', () => {
    const result = checkBudgets(
      input(
        ['packages/demo/src/utils/format.ts'],
        [['packages/demo/src/utils/format.ts', 20]],
        dirBudgets(),
      ),
    );
    expect(result.errors).toContain(
      'packages/demo/src/utils: forbidden generic directory name "utils"; organize files by domain responsibility instead',
    );
  });
});
