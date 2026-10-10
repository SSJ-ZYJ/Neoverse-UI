import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  addConsumer,
  type ComponentRequest,
  loadRequests,
  run,
  saveRequest,
  updateStatus,
  validateRequest,
} from './component-requests';

const directories: string[] = [];
async function temporaryDirectory(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neoverse-component-request-'));
  directories.push(dir);
  return dir;
}

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

const initial: ComponentRequest = {
  schemaVersion: 1,
  id: 'CR-20261010-A1B2C3D4',
  kind: 'new-component',
  target: 'UiDialog',
  summary: 'Reusable confirmation dialog needed',
  expected: 'Modal dialog with focus trap and return focus',
  acceptanceCriteria: ['Escape closes dialog', 'Focus returns to trigger'],
  impact: 'blocking',
  status: 'reported',
  consumers: [
    {
      project: 'Neoverse-Slides',
      location: 'src/pages/settings.vue',
      framework: 'vue',
      scenario: 'Delete presentation',
    },
  ],
  createdAt: '2026-10-10T02:00:00.000Z',
  updatedAt: '2026-10-10T02:00:00.000Z',
};

describe('component request registry', () => {
  test('validates shape, dates, unique consumers and closing evidence', () => {
    expect(validateRequest(initial)).toEqual([]);
    expect(validateRequest({ ...initial, impact: 'immediate' })).toContain('invalid impact');
    expect(validateRequest({ ...initial, status: 'delivered' })).toContain(
      'closed requests need a resolution',
    );
    expect(
      validateRequest({
        ...initial,
        consumers: [initial.consumers[0], initial.consumers[0]],
      }),
    ).toContain('duplicate consumer location: 1');
    expect(
      validateRequest({
        ...initial,
        consumers: [{ ...initial.consumers[0], url: 'file:///secrets' }],
      }),
    ).toContain('consumers[0].url must be an HTTP(S) URL');
  });

  test('isolates requests into per-ID files and rejects filename drift', async () => {
    const directory = await temporaryDirectory();
    await saveRequest(initial, directory);
    expect((await loadRequests(directory))[0]).toEqual(initial);
    const raw = await readFile(join(directory, `${initial.id}.json`), 'utf8');
    expect(JSON.parse(raw)).toEqual(initial);
    await writeFile(join(directory, 'wrong.json'), raw);
    await expect(loadRequests(directory)).rejects.toThrow('id must equal filename');
  });

  test('links multiple projects to one request, without duplication', () => {
    const consumer = {
      project: 'Neoverse-Docs',
      location: 'src/pages/docs.vue',
      framework: 'vue' as const,
      scenario: 'Confirm route navigation',
    };
    const linked = addConsumer(initial, consumer, '2026-10-10T03:00:00.000Z');
    expect(linked.consumers).toHaveLength(2);
    expect(initial.consumers).toHaveLength(1);
    expect(() => addConsumer(linked, consumer)).toThrow('already registered');
  });

  test('enforces approval lifecycle and requires evidence on delivery', () => {
    expect(() => updateStatus(initial, 'delivered')).toThrow('invalid status transition');
    const accepted = updateStatus(initial, 'accepted', undefined, '2026-10-10T03:00:00.000Z');
    const inProgress = updateStatus(
      accepted,
      'implementing',
      undefined,
      '2026-10-10T04:00:00.000Z',
    );
    expect(() => updateStatus(inProgress, 'delivered')).toThrow('resolution is required');
    const delivered = updateStatus(
      inProgress,
      'delivered',
      'commit abc and browser checks',
      '2026-10-10T05:00:00.000Z',
    );
    expect(validateRequest(delivered)).toEqual([]);
    const initialConsumer = initial.consumers[0];
    if (!initialConsumer) throw new Error('missing fixture consumer');
    expect(() => addConsumer(delivered, initialConsumer)).toThrow('closed request');
    expect(() => updateStatus(delivered, 'accepted')).toThrow('invalid status transition');
  });

  test('CLI supports add, dedup, link, triage and implementation JSON view', async () => {
    const directory = await temporaryDirectory();
    const flags = [
      '--kind',
      'new-component',
      '--target',
      'UiDialog',
      '--summary',
      'Need modal confirmation',
      '--expected',
      'Accessible modal',
      '--acceptance',
      'Escape closes',
      '--acceptance',
      'Return focus',
      '--impact',
      'blocking',
      '--project',
      'Neoverse-Slides',
      '--location',
      'src/pages/settings.vue',
      '--framework',
      'vue',
      '--scenario',
      'Delete presentation',
    ];
    const response = await run(['add', ...flags], directory);
    const id = response.match(/CR-\d{8}-[A-F0-9]{8}/)?.[0];
    expect(id).toBeDefined();
    await expect(run(['add', ...flags], directory)).rejects.toThrow('similar open request');
    expect(JSON.parse(await run(['agent', '--queue', 'triage'], directory)).requests).toHaveLength(
      1,
    );
    expect(JSON.parse(await run(['agent'], directory)).requests).toHaveLength(0);
    await run(
      [
        'link',
        '--id',
        id as string,
        '--project',
        'Neoverse-Docs',
        '--location',
        'src/pages/docs.vue',
        '--framework',
        'vue',
        '--scenario',
        'Leave edited page',
      ],
      directory,
    );
    expect((await loadRequests(directory))[0]?.consumers).toHaveLength(2);
    await run(['status', '--id', id as string, '--to', 'accepted'], directory);
    const implementation = JSON.parse(await run(['agent'], directory));
    expect(implementation.requests).toHaveLength(1);
    expect(implementation.requests[0].currentComponentContract).toBeNull();
    expect(implementation.requests[0].acceptanceCriteria).toEqual([
      'Escape closes',
      'Return focus',
    ]);
    expect(await run(['check'], directory)).toContain('valid (1 requests)');
  });

  test('contract matrix catches delivered components that are not registered', async () => {
    const directory = await temporaryDirectory();
    await saveRequest(
      {
        ...initial,
        status: 'delivered',
        resolution: 'Implemented',
        target: 'UiNotImplemented',
      },
      directory,
    );
    await expect(run(['check'], directory)).rejects.toThrow('absent from matrix');
  });
});
