import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  addConsumer,
  type ComponentRequest,
  type ConsumerLocation,
  impacts,
  loadRequests,
  REQUESTS_DIR,
  saveRequest,
  validateRequest,
} from './component-requests';

export interface ComponentSubmission {
  schemaVersion: 1;
  kind: ComponentRequest['kind'];
  target: string;
  summary: string;
  expected: string;
  acceptanceCriteria: string[];
  impact: ComponentRequest['impact'];
  consumer: ConsumerLocation;
}

export type IntakeResult = {
  action: 'created' | 'linked' | 'updated' | 'unchanged';
  id: string;
  status: ComponentRequest['status'];
  consumerCount: number;
};

const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();
const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

export function validateSubmission(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['submission must be a JSON object'];
  }
  const input = value as Record<string, unknown>;
  const allowed = new Set([
    'schemaVersion',
    'kind',
    'target',
    'summary',
    'expected',
    'acceptanceCriteria',
    'impact',
    'consumer',
  ]);
  const errors = Object.keys(input)
    .filter((field) => !allowed.has(field))
    .map((field) => `unknown submission field: ${field}`);
  const now = new Date().toISOString();
  errors.push(
    ...validateRequest({
      schemaVersion: input.schemaVersion,
      id: 'CR-20000101-00000000',
      kind: input.kind,
      target: input.target,
      summary: input.summary,
      expected: input.expected,
      acceptanceCriteria: input.acceptanceCriteria,
      impact: input.impact,
      status: 'reported',
      consumers: [input.consumer],
      createdAt: now,
      updatedAt: now,
    }),
  );
  if (JSON.stringify(value).length > 64_000) errors.push('submission exceeds 64 KB');
  return errors;
}

/**
 * mkdir is exclusive on both Windows and Linux. All registry CLI mutations
 * are serialized to avoid lost updates from concurrent consumer agents.
 */
export async function withRegistryLock<T>(directory: string, action: () => Promise<T>): Promise<T> {
  await mkdir(directory, { recursive: true });
  const lock = join(directory, '.write-lock');
  const started = Date.now();
  while (true) {
    try {
      await mkdir(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now() - started > 15_000) {
        throw new Error(
          'component request registry locked; remove .write-lock only after verifying no writer is running',
        );
      }
      await sleep(50);
    }
  }
  try {
    return await action();
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

function matchingConsumer(a: ConsumerLocation, b: ConsumerLocation): boolean {
  return (
    normalize(a.project) === normalize(b.project) &&
    normalize(a.location) === normalize(b.location) &&
    a.framework === b.framework
  );
}

/**
 * Public local intake API. Consumer agents can submit and link reported needs,
 * but cannot approve, implement, or close them through this interface.
 */
export async function submitRequest(
  value: unknown,
  directory = REQUESTS_DIR,
): Promise<IntakeResult> {
  const errors = validateSubmission(value);
  if (errors.length) throw new Error(errors.join('; '));
  const input = value as ComponentSubmission;
  return withRegistryLock(directory, async () => {
    const requests = await loadRequests(directory);
    const open = requests.filter(
      (item) =>
        !['delivered', 'rejected'].includes(item.status) &&
        item.kind === input.kind &&
        normalize(item.target) === normalize(input.target) &&
        (input.kind === 'new-component' || normalize(item.summary) === normalize(input.summary)) &&
        (input.kind !== 'framework-gap' ||
          item.consumers.some((consumer) => consumer.framework === input.consumer.framework)),
    );
    const existing = open.find((item) => normalize(item.expected) === normalize(input.expected));
    if (!existing && open.length > 0) {
      throw new Error(
        `possible conflict with ${open[0]?.id}: same target, different expected behavior; review manually`,
      );
    }
    if (existing) {
      const consumerExists = existing.consumers.some((consumer) =>
        matchingConsumer(consumer, input.consumer),
      );
      // Once approved, different criteria need human re-review; do not silently widen scope.
      const newCriteria = input.acceptanceCriteria.filter(
        (criterion) =>
          !existing.acceptanceCriteria.some(
            (current) => normalize(current) === normalize(criterion),
          ),
      );
      if (newCriteria.length && existing.status !== 'reported') {
        throw new Error(
          `request ${existing.id} is ${existing.status}: new criteria require maintainer review`,
        );
      }
      const impact =
        existing.status === 'reported' &&
        impacts.indexOf(input.impact) < impacts.indexOf(existing.impact)
          ? input.impact
          : existing.impact;
      const changed = !consumerExists || newCriteria.length > 0 || impact !== existing.impact;
      if (!changed) {
        return {
          action: 'unchanged',
          id: existing.id,
          status: existing.status,
          consumerCount: existing.consumers.length,
        };
      }
      const updated = {
        ...(consumerExists ? existing : addConsumer(existing, input.consumer)),
        ...(newCriteria.length
          ? {
              acceptanceCriteria: [...existing.acceptanceCriteria, ...newCriteria],
            }
          : {}),
        impact,
        updatedAt: new Date().toISOString(),
      };
      await saveRequest(updated, directory);
      return {
        action: consumerExists ? 'updated' : 'linked',
        id: updated.id,
        status: updated.status,
        consumerCount: updated.consumers.length,
      };
    }
    const now = new Date().toISOString();
    const created: ComponentRequest = {
      schemaVersion: 1,
      id: `CR-${now.slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`,
      kind: input.kind,
      target: input.target.trim(),
      summary: input.summary.trim(),
      expected: input.expected.trim(),
      acceptanceCriteria: input.acceptanceCriteria.map((text) => text.trim()),
      impact: input.impact,
      status: 'reported',
      consumers: [input.consumer],
      createdAt: now,
      updatedAt: now,
    };
    await saveRequest(created, directory);
    return { action: 'created', id: created.id, status: created.status, consumerCount: 1 };
  });
}

/** Read a consumer project's JSON file, relative to the caller's current directory. */
export async function readSubmissionFile(path: string): Promise<unknown> {
  if ((await stat(path)).size > 64_000) throw new Error('submission exceeds 64 KB');
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}
