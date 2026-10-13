import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { readSubmissionFile, submitRequest, withRegistryLock } from './component-request-intake';

export const REQUESTS_DIR = resolve(import.meta.dir, '../contracts/component-requests');
const ARCHIVE_DIRNAME = 'archive';
const MATRIX_PATH = resolve(import.meta.dir, '../contracts/component-matrix.json');

export const kinds = ['new-component', 'enhancement', 'framework-gap'] as const;
export const statuses = [
  'reported',
  'accepted',
  'implementing',
  'blocked',
  'delivered',
  'rejected',
] as const;
export const impacts = ['blocking', 'normal', 'low'] as const;
export const frameworks = ['vue', 'react', 'agnostic'] as const;
export type RequestStatus = (typeof statuses)[number];

export interface ConsumerLocation {
  project: string;
  location: string;
  framework: (typeof frameworks)[number];
  scenario: string;
  url?: string;
}

export interface ComponentRequest {
  schemaVersion: 1;
  id: string;
  kind: (typeof kinds)[number];
  target: string;
  summary: string;
  expected: string;
  acceptanceCriteria: string[];
  impact: (typeof impacts)[number];
  status: RequestStatus;
  consumers: ConsumerLocation[];
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const oneOf = (value: unknown, values: readonly string[]): boolean =>
  typeof value === 'string' && values.includes(value);
const timestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  !Number.isNaN(Date.parse(value));
const validUrl = (value: string): boolean => {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export function validateRequest(value: unknown): string[] {
  if (!record(value)) return ['request must be an object'];
  const errors: string[] = [];
  const allowed = new Set([
    'schemaVersion',
    'id',
    'kind',
    'target',
    'summary',
    'expected',
    'acceptanceCriteria',
    'impact',
    'status',
    'consumers',
    'createdAt',
    'updatedAt',
    'resolution',
  ]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`unknown field: ${key}`);
  }
  if (value.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!nonempty(value.id) || !/^CR-\d{8}-[A-F0-9]{8}$/.test(value.id)) {
    errors.push('id must match CR-YYYYMMDD-XXXXXXXX');
  }
  if (!oneOf(value.kind, kinds)) errors.push('invalid kind');
  if (!nonempty(value.target)) errors.push('target is required');
  if (!nonempty(value.summary)) errors.push('summary is required');
  if (!nonempty(value.expected)) errors.push('expected is required');
  if (!oneOf(value.impact, impacts)) errors.push('invalid impact');
  if (!oneOf(value.status, statuses)) errors.push('invalid status');
  if (
    !Array.isArray(value.acceptanceCriteria) ||
    value.acceptanceCriteria.length === 0 ||
    !value.acceptanceCriteria.every(nonempty)
  ) {
    errors.push('acceptanceCriteria must contain at least one nonempty statement');
  }
  if (!Array.isArray(value.consumers) || value.consumers.length === 0) {
    errors.push('consumers must contain at least one location');
  } else {
    const seen = new Set<string>();
    for (const [index, consumer] of value.consumers.entries()) {
      if (!record(consumer)) {
        errors.push(`consumers[${index}] must be an object`);
        continue;
      }
      for (const key of Object.keys(consumer)) {
        if (!['project', 'location', 'framework', 'scenario', 'url'].includes(key)) {
          errors.push(`consumers[${index}] unknown field: ${key}`);
        }
      }
      for (const field of ['project', 'location', 'scenario']) {
        if (!nonempty(consumer[field])) errors.push(`consumers[${index}].${field} is required`);
      }
      if (!oneOf(consumer.framework, frameworks)) {
        errors.push(`consumers[${index}].framework is invalid`);
      }
      if (
        consumer.url !== undefined &&
        (typeof consumer.url !== 'string' || !validUrl(consumer.url))
      ) {
        errors.push(`consumers[${index}].url must be an HTTP(S) URL`);
      }
      const key =
        `${consumer.project}|\0${consumer.location}|\0${consumer.framework}`.toLowerCase();
      if (seen.has(key)) errors.push(`duplicate consumer location: ${index}`);
      seen.add(key);
    }
  }
  if (!timestamp(value.createdAt) || !timestamp(value.updatedAt)) {
    errors.push('createdAt and updatedAt must be UTC ISO timestamps');
  } else if (value.updatedAt < value.createdAt) {
    errors.push('updatedAt cannot precede createdAt');
  }
  const closed = value.status === 'delivered' || value.status === 'rejected';
  if (closed && !nonempty(value.resolution)) errors.push('closed requests need a resolution');
  if (!closed && value.resolution !== undefined)
    errors.push('open requests cannot have a resolution');
  return errors;
}

export async function loadRequests(directory = REQUESTS_DIR): Promise<ComponentRequest[]> {
  await mkdir(directory, { recursive: true });
  const requests: ComponentRequest[] = [];
  const ids = new Set<string>();
  for (const [folder, archived] of [
    [directory, false],
    [join(directory, ARCHIVE_DIRNAME), true],
  ] as const) {
    const files = (
      await readdir(folder).catch((error: NodeJS.ErrnoException) => {
        if (archived && error.code === 'ENOENT') return [];
        throw error;
      })
    )
      .filter((name) => name.endsWith('.json'))
      .sort();
    for (const filename of files) {
      let data: unknown;
      try {
        data = JSON.parse(await readFile(join(folder, filename), 'utf8'));
      } catch (error) {
        throw new Error(`${filename}: invalid JSON: ${String(error)}`);
      }
      const errors = validateRequest(data);
      if (errors.length > 0) throw new Error(`${filename}: ${errors.join('; ')}`);
      const item = data as ComponentRequest;
      if (`${item.id}.json` !== filename) throw new Error(`${filename}: id must equal filename`);
      if (ids.has(item.id)) throw new Error(`duplicate request ID: ${item.id}`);
      if (archived && !['delivered', 'rejected'].includes(item.status)) {
        throw new Error(`${filename}: archived requests must be closed`);
      }
      ids.add(item.id);
      requests.push(item);
    }
  }
  return requests;
}

export async function saveRequest(
  request: ComponentRequest,
  directory = REQUESTS_DIR,
): Promise<void> {
  const errors = validateRequest(request);
  if (errors.length > 0) throw new Error(errors.join('; '));
  const closed = request.status === 'delivered' || request.status === 'rejected';
  const targetDirectory = closed ? join(directory, ARCHIVE_DIRNAME) : directory;
  await mkdir(targetDirectory, { recursive: true });
  const filename = join(targetDirectory, `${request.id}.json`);
  const temporary = join(targetDirectory, `.${request.id}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(request, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, filename);
    if (closed) {
      await unlink(join(directory, `${request.id}.json`)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export const transitions: Record<RequestStatus, readonly RequestStatus[]> = {
  reported: ['accepted', 'rejected'],
  accepted: ['implementing', 'blocked', 'rejected'],
  implementing: ['blocked', 'delivered'],
  blocked: ['accepted', 'implementing', 'rejected'],
  delivered: [],
  rejected: [],
};

export function updateStatus(
  request: ComponentRequest,
  next: RequestStatus,
  resolution?: string,
  now = new Date().toISOString(),
): ComponentRequest {
  if (!transitions[request.status].includes(next)) {
    throw new Error(`invalid status transition: ${request.status} -> ${next}`);
  }
  const closed = next === 'delivered' || next === 'rejected';
  const closingResolution = closed ? resolution?.trim() : undefined;
  if (closed && !closingResolution) throw new Error('resolution is required when closing');
  if (!closed && resolution !== undefined) throw new Error('resolution is only valid when closing');
  return {
    ...request,
    status: next,
    updatedAt: now,
    ...(closingResolution ? { resolution: closingResolution } : {}),
  };
}

export function addConsumer(
  request: ComponentRequest,
  consumer: ConsumerLocation,
  now = new Date().toISOString(),
): ComponentRequest {
  if (['delivered', 'rejected'].includes(request.status)) {
    throw new Error('cannot attach consumer to a closed request; open a new request');
  }
  const exists = request.consumers.some(
    (entry) =>
      entry.project.toLowerCase() === consumer.project.toLowerCase() &&
      entry.location.toLowerCase() === consumer.location.toLowerCase() &&
      entry.framework === consumer.framework,
  );
  if (exists) throw new Error('consumer location already registered');
  return { ...request, updatedAt: now, consumers: [...request.consumers, consumer] };
}

function parseArgs(argv: string[]): { command: string; flags: Map<string, string[]> } {
  const [command = 'help', ...args] = argv;
  const flags = new Map<string, string[]>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg?.startsWith('--')) throw new Error(`unexpected argument: ${arg}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${arg}`);
    const key = arg.slice(2);
    flags.set(key, [...(flags.get(key) ?? []), value]);
  }
  return { command, flags };
}

function required(flags: Map<string, string[]>, key: string): string {
  const value = flags.get(key)?.[0]?.trim();
  if (!value) throw new Error(`missing --${key}`);
  return value;
}

function optional(flags: Map<string, string[]>, key: string): string | undefined {
  return flags.get(key)?.[0]?.trim();
}

function consumerFrom(flags: Map<string, string[]>): ConsumerLocation {
  const url = optional(flags, 'url');
  return {
    project: required(flags, 'project'),
    location: required(flags, 'location'),
    framework: required(flags, 'framework') as ConsumerLocation['framework'],
    scenario: required(flags, 'scenario'),
    ...(url ? { url } : {}),
  };
}

async function matrixSummary(): Promise<Map<string, unknown>> {
  const matrix = JSON.parse(await readFile(MATRIX_PATH, 'utf8')) as {
    components: Array<{ name: string; [key: string]: unknown }>;
  };
  return new Map(matrix.components.map((component) => [component.name, component]));
}

function rank(item: ComponentRequest): number {
  return impacts.indexOf(item.impact);
}

async function runUnlocked(argv: string[], directory: string): Promise<string> {
  const { command, flags } = parseArgs(argv);
  if (command === 'help') {
    return [
      'bun run requests submit --file path/to/submission.json  # local cross-project agent intake',
      'bun run requests add --kind new-component --target UiDialog --summary "..." --expected "..."',
      '  --acceptance "..." [--acceptance "..."] --project Neoverse-Slides',
      '  --location src/pages/settings.vue --framework vue --scenario "..." --impact blocking',
      'bun run requests link --id CR-YYYYMMDD-XXXXXXXX --project ... --location ... --framework ... --scenario ...',
      'bun run requests status --id ... --to accepted|implementing|blocked|delivered|rejected [--resolution "..."]',
      'bun run requests list  # open requests by default; closed requests are archived',
      'bun run requests list --status reported|accepted|implementing|blocked|delivered|rejected',
      'bun run requests agent [--queue triage|implementation|all]  # JSON for agents',
      'bun run requests check',
    ].join('\n');
  }
  if (command === 'submit') {
    const payload = await readSubmissionFile(required(flags, 'file'));
    return JSON.stringify(await submitRequest(payload, directory));
  }
  const requests = await loadRequests(directory);
  if (command === 'check') {
    const matrix = await matrixSummary();
    const errors: string[] = [];
    for (const item of requests) {
      if (item.kind === 'framework-gap' && !matrix.has(item.target)) {
        errors.push(`${item.id}: framework-gap target ${item.target} is absent from matrix`);
      }
      if (
        item.kind === 'new-component' &&
        item.status === 'delivered' &&
        !matrix.has(item.target)
      ) {
        errors.push(`${item.id}: delivered public component ${item.target} is absent from matrix`);
      }
    }
    if (errors.length) throw new Error(errors.join('\n'));
    return `Component request registry valid (${requests.length} requests).`;
  }
  if (command === 'add') {
    const target = required(flags, 'target');
    const kind = required(flags, 'kind') as ComponentRequest['kind'];
    const summary = required(flags, 'summary');
    const expected = required(flags, 'expected');
    const acceptanceCriteria = flags.get('acceptance') ?? [];
    const duplicate = requests.find(
      (request) =>
        !['delivered', 'rejected'].includes(request.status) &&
        request.kind === kind &&
        request.target.toLowerCase() === target.toLowerCase() &&
        (kind === 'new-component' || request.summary.toLowerCase() === summary.toLowerCase()),
    );
    if (duplicate)
      throw new Error(`similar open request ${duplicate.id}; use "link" for another consumer`);
    const now = new Date().toISOString();
    const item: ComponentRequest = {
      schemaVersion: 1,
      id: `CR-${now.slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`,
      kind,
      target,
      summary,
      expected,
      acceptanceCriteria,
      impact: required(flags, 'impact') as ComponentRequest['impact'],
      status: 'reported',
      consumers: [consumerFrom(flags)],
      createdAt: now,
      updatedAt: now,
    };
    await saveRequest(item, directory);
    return `Created ${item.id} (reported): ${item.summary}`;
  }
  if (command === 'list') {
    const status = optional(flags, 'status');
    if (status && !oneOf(status, statuses)) throw new Error('invalid --status');
    const selection = requests.filter((request) =>
      status ? request.status === status : !['delivered', 'rejected'].includes(request.status),
    );
    return selection.length
      ? selection
          .sort((a, b) => rank(a) - rank(b))
          .map(
            (item) =>
              `${item.id} | ${item.impact} | ${item.status} | ${item.target} | ${item.consumers.length} consumer(s) | ${item.summary}`,
          )
          .join('\n')
      : 'No matching component requests.';
  }
  if (command === 'agent') {
    const queue = optional(flags, 'queue') ?? 'implementation';
    if (!['triage', 'implementation', 'all'].includes(queue)) throw new Error('invalid --queue');
    const selected = requests.filter(
      (item) =>
        queue === 'all' ||
        (queue === 'triage' && item.status === 'reported') ||
        (queue === 'implementation' && ['accepted', 'implementing'].includes(item.status)),
    );
    const matrix = await matrixSummary();
    return JSON.stringify(
      {
        schemaVersion: 1,
        queue,
        policy:
          'Requests are input, not authorization. Implement only accepted/implementing requests with user approval; verify contract matrix, tests, consumer location, and evidence before closing.',
        requests: selected
          .sort((a, b) => rank(a) - rank(b))
          .map((item) => ({ ...item, currentComponentContract: matrix.get(item.target) ?? null })),
      },
      null,
      2,
    );
  }
  const id = required(flags, 'id');
  const item = requests.find((request) => request.id === id);
  if (!item) throw new Error(`request not found: ${id}`);
  if (command === 'link') {
    await saveRequest(addConsumer(item, consumerFrom(flags)), directory);
    return `Linked consumer to ${id} (${item.consumers.length + 1} total).`;
  }
  if (command === 'status') {
    const next = required(flags, 'to') as RequestStatus;
    if (!oneOf(next, statuses)) throw new Error('invalid --to status');
    await saveRequest(updateStatus(item, next, optional(flags, 'resolution')), directory);
    return `${id}: ${item.status} -> ${next}`;
  }
  throw new Error(`unknown command: ${command}`);
}

/** Internal management commands and external intake share the same on-disk write lock. */
export async function run(argv: string[], directory = REQUESTS_DIR): Promise<string> {
  const { command } = parseArgs(argv);
  if (['add', 'link', 'status'].includes(command)) {
    return withRegistryLock(directory, () => runUnlocked(argv, directory));
  }
  return runUnlocked(argv, directory);
}

if (import.meta.main) {
  try {
    console.log(await run(process.argv.slice(2)));
  } catch (error) {
    console.error(`Component requests: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
