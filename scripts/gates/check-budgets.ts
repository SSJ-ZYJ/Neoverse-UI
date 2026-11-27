import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Scale and directory governance budgets, described in scripts/AGENTS.md and
// docs/AGENTS.md. Soft limits produce REVIEW, hard limits fail. Exceptions are
// dated audit records, not a permission to raise a limit; each record must stay
// within its ceiling and name a removal condition.

const root = resolve(import.meta.dir, '../..');
const configPath = resolve(import.meta.dir, 'quality-budgets.json');

export type Category = 'source' | 'css' | 'test';

export interface Exception {
  ceiling: number;
  reason: string;
}

export interface Budgets {
  limits: Record<Category, [number, number]>;
  directoryLimits?: Record<Category, [number, number]>;
  forbiddenDirectoryNames?: string[];
  exceptions: Record<string, Exception>;
  directoryExceptions?: Record<string, Exception>;
}

export type Severity = 'EXCEEDED' | 'REVIEW' | 'NEAR' | 'AT LIMIT';

export interface Finding {
  file: string;
  lines: number;
  limit: number;
  severity: Severity;
}

export interface DirectoryFinding {
  directory: string;
  files: number;
  limit: number;
  severity: Severity;
}

const CATEGORIES: Category[] = ['source', 'css', 'test'];
const DATED_REASON = /^\d{4}-\d{2}-\d{2}:\s*\S/;
const GOVERNED_DIRECTORY = /^(?:packages|apps|scripts|tests)\//;

export function categoryOf(file: string): Category | null {
  if (/(?:\.test|\.spec)\.tsx?$/.test(file)) return 'test';
  if (file.endsWith('.css')) return 'css';
  if (/\.(ts|tsx|vue)$/.test(file)) return 'source';
  return null;
}

export function directoryOf(file: string): string {
  const normalized = file.replaceAll('\\', '/');
  const slash = normalized.lastIndexOf('/');
  return slash < 0 ? '.' : normalized.slice(0, slash);
}

export function directoryCategoryOf(directory: string, files: string[]): Category | null {
  if (!GOVERNED_DIRECTORY.test(`${directory}/`)) return null;
  if (
    directory === 'tests/e2e' ||
    directory.startsWith('tests/e2e/') ||
    directory.endsWith('/tests')
  ) {
    return 'test';
  }
  const counts: Record<Category, number> = { source: 0, css: 0, test: 0 };
  for (const file of files) {
    const category = categoryOf(file);
    if (category) counts[category] += 1;
  }
  const total = counts.source + counts.css + counts.test;
  if (total === 0) return null;
  if (counts.css >= counts.source && counts.css >= counts.test && counts.css > 0) return 'css';
  if (counts.test > counts.source && counts.test > 0) return 'test';
  return 'source';
}

// A trailing newline terminates the last line; it does not start an empty one.
export function lineCount(source: string): number {
  if (source.length === 0) return 0;
  const lines = source.split('\n');
  return source.endsWith('\n') ? lines.length - 1 : lines.length;
}

export function severityOf(lines: number, soft: number, hard: number): Severity | null {
  if (lines <= soft) return null;
  if (lines > hard) return 'EXCEEDED';
  const remaining = hard - lines;
  const near = Math.max(hard * 0.05, 10);
  if (remaining <= 2) return 'AT LIMIT';
  if (remaining < near) return 'NEAR';
  return 'REVIEW';
}

export interface BudgetInput {
  files: string[];
  sizes: Map<string, number>;
  budgets: Budgets;
}

export interface BudgetResult {
  errors: string[];
  findings: Finding[];
  directoryFindings: DirectoryFinding[];
}

// `git ls-files --cached` also reports files deleted from the working tree but
// not yet staged. Measuring one would crash on ENOENT, so the gate measures only
// paths that still exist.
export function existingFiles(files: string[], exists: (file: string) => boolean): string[] {
  return files.filter((file) => file.length > 0 && exists(file));
}

function validateExceptionRecord(target: string, exception: Exception, errors: string[]): void {
  if (!DATED_REASON.test(exception.reason)) {
    errors.push(`${target}: exception reason must start with a date and a description`);
  }
  if (!Number.isInteger(exception.ceiling) || exception.ceiling < 1) {
    errors.push(`${target}: exception ceiling must be a positive integer`);
  }
}

export function checkBudgets(input: BudgetInput): BudgetResult {
  const { files, sizes, budgets } = input;
  const errors: string[] = [];
  const findings: Finding[] = [];
  const directoryFindings: DirectoryFinding[] = [];

  for (const [file, exception] of Object.entries(budgets.exceptions)) {
    validateExceptionRecord(file, exception, errors);
    if (!files.includes(file)) errors.push(`${file}: exception names a file that does not exist`);
  }

  for (const file of files) {
    const category = categoryOf(file);
    if (!category || !CATEGORIES.includes(category)) continue;
    const lines = sizes.get(file) ?? 0;
    const [soft, hard] = budgets.limits[category];
    const exception = budgets.exceptions[file];

    if (exception) {
      if (lines > exception.ceiling) {
        errors.push(
          `${file}: ${lines} lines exceeds exception ceiling ${exception.ceiling}; raise the ceiling with justification or split the file`,
        );
      }
      if (lines <= hard) {
        errors.push(`${file}: exception is within the hard limit ${hard}; remove it`);
      }
      continue;
    }

    const severity = severityOf(lines, soft, hard);
    if (!severity) continue;
    findings.push({ file, lines, limit: hard, severity });
    if (severity === 'EXCEEDED') {
      errors.push(
        `${file}:1: ${lines} lines exceeds the ${category} hard limit ${hard}; register an exception or split the file`,
      );
    }
  }

  const byDirectory = new Map<string, string[]>();
  for (const file of files) {
    if (!categoryOf(file)) continue;
    const directory = directoryOf(file);
    if (!GOVERNED_DIRECTORY.test(`${directory}/`)) continue;
    const list = byDirectory.get(directory);
    if (list) list.push(file);
    else byDirectory.set(directory, [file]);
  }

  const forbiddenNames = new Set(budgets.forbiddenDirectoryNames ?? []);
  if (forbiddenNames.size > 0) {
    const flagged = new Set<string>();
    for (const directory of byDirectory.keys()) {
      const segments = directory.split('/');
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index] ?? '';
        if (!forbiddenNames.has(segment)) continue;
        const offending = segments.slice(0, index + 1).join('/');
        if (flagged.has(offending)) continue;
        flagged.add(offending);
        errors.push(
          `${offending}: forbidden generic directory name "${segment}"; organize files by domain responsibility instead`,
        );
      }
    }
  }

  const directoryLimits = budgets.directoryLimits;
  const directoryExceptions = budgets.directoryExceptions ?? {};
  for (const [directory, exception] of Object.entries(directoryExceptions)) {
    validateExceptionRecord(directory, exception, errors);
    if (!byDirectory.has(directory)) {
      errors.push(`${directory}: directory exception names a directory with no governed files`);
    }
  }

  if (directoryLimits) {
    for (const [directory, directFiles] of byDirectory) {
      const category = directoryCategoryOf(directory, directFiles);
      if (!category) continue;
      const count = directFiles.length;
      const [soft, hard] = directoryLimits[category];
      const exception = directoryExceptions[directory];

      if (exception) {
        if (count > exception.ceiling) {
          errors.push(
            `${directory}: ${count} direct files exceeds directory exception ceiling ${exception.ceiling}; split by domain responsibility`,
          );
        }
        if (count <= hard) {
          errors.push(
            `${directory}: directory exception is within the hard limit ${hard}; remove it`,
          );
        }
        continue;
      }

      const severity = severityOf(count, soft, hard);
      if (!severity) continue;
      directoryFindings.push({ directory, files: count, limit: hard, severity });
      if (severity === 'EXCEEDED') {
        errors.push(
          `${directory}: ${count} direct files exceeds the ${category} directory hard limit ${hard}; split by domain responsibility or register a dated exception`,
        );
      }
    }
  }

  return { errors, findings, directoryFindings };
}

function main(): void {
  const budgets = JSON.parse(readFileSync(configPath, 'utf8')) as Budgets;
  const files = existingFiles(
    execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
    }).split('\n'),
    (file) => existsSync(resolve(root, file)),
  );
  const sizes = new Map(
    files
      .filter((file) => categoryOf(file))
      .map((file) => [file, lineCount(readFileSync(resolve(root, file), 'utf8'))] as const),
  );
  const { errors, findings, directoryFindings } = checkBudgets({ files, sizes, budgets });
  const reviews = findings.filter((finding) => finding.severity === 'REVIEW').length;
  const near = findings.filter((finding) => finding.severity === 'NEAR').length;
  const atLimit = findings.filter((finding) => finding.severity === 'AT LIMIT').length;
  const exceeded = findings.filter((finding) => finding.severity === 'EXCEEDED').length;
  const dirReviews = directoryFindings.filter((finding) => finding.severity !== 'EXCEEDED').length;
  const dirExceeded = directoryFindings.filter((finding) => finding.severity === 'EXCEEDED').length;
  const reviewed = files.filter((file) => categoryOf(file)).length;
  const summary =
    `${reviewed} files, ${Object.keys(budgets.exceptions).length} file exceptions, ` +
    `${Object.keys(budgets.directoryExceptions ?? {}).length} directory exceptions, ` +
    `${reviews} REVIEW, ${near} NEAR, ${atLimit} AT LIMIT, ${exceeded} EXCEEDED, ` +
    `${dirReviews} dir REVIEW, ${dirExceeded} dir EXCEEDED.`;
  if (errors.length > 0) {
    console.error('Scale budget check failed:');
    for (const error of errors) console.error(`- ${error}`);
    console.error(`Summary: ${summary}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Scale budgets passed for ${summary}`);
}

if (import.meta.main) main();
