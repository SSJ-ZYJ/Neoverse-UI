import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  type ComponentSubmission,
  readSubmissionFile,
  submitRequest,
  validateSubmission,
  withRegistryLock,
} from './component-request-intake';
import { type ComponentRequest, loadRequests, run } from './component-requests';

const dirs: string[] = [];
async function temp(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neoverse-external-agent-'));
  dirs.push(dir);
  return dir;
}
afterEach(async () => {
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

const submission: ComponentSubmission = {
  schemaVersion: 1,
  kind: 'new-component',
  target: 'UiDialog',
  summary: 'Consumer needs a modal dialog',
  expected: 'Shared accessible dialog with focus restoration',
  acceptanceCriteria: ['Escape closes the dialog', 'Light and dark themes'],
  impact: 'normal',
  consumer: {
    project: 'Neoverse-Slides',
    location: 'src/pages/settings.vue',
    framework: 'vue',
    scenario: 'Confirm deleting a presentation',
  },
};

describe('local external agent intake', () => {
  test('accepts only intake schema, never owner-controlled state', () => {
    expect(validateSubmission(submission)).toEqual([]);
    expect(validateSubmission({ ...submission, status: 'accepted' })).toContain(
      'unknown submission field: status',
    );
    expect(
      validateSubmission({
        ...submission,
        consumer: { ...submission.consumer, url: 'file:///tmp' },
      }),
    ).toContain('consumers[0].url must be an HTTP(S) URL');
    expect(validateSubmission({ ...submission, acceptanceCriteria: [] })).toContain(
      'acceptanceCriteria must contain at least one nonempty statement',
    );
  });

  test('creates, retries idempotently, links another project, and upgrades reported impact', async () => {
    const dir = await temp();
    const created = await submitRequest(submission, dir);
    expect(created.action).toBe('created');
    expect(created.status).toBe('reported');
    expect((await submitRequest(submission, dir)).action).toBe('unchanged');
    const added = await submitRequest(
      {
        ...submission,
        impact: 'blocking',
        acceptanceCriteria: [...submission.acceptanceCriteria, 'Return focus to trigger'],
        consumer: {
          project: 'Neoverse-Docs',
          location: 'src/pages/editor.vue',
          framework: 'vue',
          scenario: 'Confirm leaving unsaved editor',
        },
      },
      dir,
    );
    expect(added.action).toBe('linked');
    expect(added.id).toBe(created.id);
    expect(added.consumerCount).toBe(2);
    const [current] = await loadRequests(dir);
    expect(current?.impact).toBe('blocking');
    expect(current?.acceptanceCriteria).toHaveLength(3);
    expect((await readdir(dir)).filter((filename) => filename.endsWith('.json'))).toHaveLength(1);
  });

  test('does not merge incompatible behavior, widen approved scope, or overwrite terminal requests', async () => {
    const dir = await temp();
    const created = await submitRequest(submission, dir);
    await expect(
      submitRequest({ ...submission, expected: 'Non-modal popover' }, dir),
    ).rejects.toThrow('different expected behavior');
    await run(['status', '--id', created.id, '--to', 'accepted'], dir);
    await expect(
      submitRequest(
        {
          ...submission,
          acceptanceCriteria: [...submission.acceptanceCriteria, 'New behavior'],
        },
        dir,
      ),
    ).rejects.toThrow('require maintainer review');
    expect((await loadRequests(dir))[0]?.status).toBe('accepted');
  });

  test('external JSON file is read and registered without UI repository working directory', async () => {
    const consumerRoot = await temp();
    const registry = await temp();
    const source = join(consumerRoot, 'request.json');
    await writeFile(source, JSON.stringify(submission));
    expect(await readSubmissionFile(source)).toEqual(submission);
    const response = JSON.parse(await run(['submit', '--file', source], registry)) as {
      action: string;
      id: string;
    };
    expect(response.action).toBe('created');
    expect((await loadRequests(registry))[0]?.id).toBe(response.id);
    const file = JSON.parse(
      await readFile(join(registry, `${response.id}.json`), 'utf8'),
    ) as ComponentRequest;
    expect(file.consumers[0]?.project).toBe('Neoverse-Slides');
  });

  test('invokes public CLI from a separate consumer process and directory', async () => {
    const consumerRoot = await temp();
    const registry = await temp();
    await writeFile(join(consumerRoot, 'request.json'), JSON.stringify(submission));
    const cliUrl = pathToFileURL(resolve(import.meta.dir, 'component-requests.ts')).href;
    const source = `const { run } = await import(${JSON.stringify(cliUrl)}); console.log(await run(['submit', '--file', 'request.json'], ${JSON.stringify(registry)}));`;
    const invoke = () =>
      Bun.spawnSync({
        cmd: [process.execPath, '-e', source],
        cwd: consumerRoot,
        stdout: 'pipe',
        stderr: 'pipe',
      });
    const first = invoke();
    expect(first.exitCode).toBe(0);
    const result = JSON.parse(first.stdout.toString()) as { action: string; id: string };
    expect(result.action).toBe('created');
    const repeated = invoke();
    expect(repeated.exitCode).toBe(0);
    expect((JSON.parse(repeated.stdout.toString()) as { action: string }).action).toBe('unchanged');
    expect((await loadRequests(registry))[0]?.id).toBe(result.id);
  });

  test('serializes concurrent submissions without losing linked consumers', async () => {
    const dir = await temp();
    const submissions = Array.from({ length: 15 }, (_, index) => ({
      ...submission,
      consumer: { ...submission.consumer, project: `Project-${index}` },
    }));
    const results = await Promise.all(submissions.map((item) => submitRequest(item, dir)));
    expect(new Set(results.map((result) => result.id)).size).toBe(1);
    expect((await loadRequests(dir))[0]?.consumers).toHaveLength(15);
    expect((await readdir(dir)).filter((filename) => filename.endsWith('.json'))).toHaveLength(1);
  });

  test('a failed write releases the lock', async () => {
    const dir = await temp();
    await expect(
      withRegistryLock(dir, async () => {
        throw new Error('simulated crash');
      }),
    ).rejects.toThrow('simulated crash');
    expect((await submitRequest(submission, dir)).action).toBe('created');
  });
});
