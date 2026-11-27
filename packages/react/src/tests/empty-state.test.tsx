import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiEmptyState } from '../components/display/empty-state';

test('empty state keeps accessible headings and consumer-owned actions', () => {
  const html = renderToStaticMarkup(
    <UiEmptyState
      title="No projects"
      description="Create one to begin"
      icon={<svg aria-hidden="true" />}
      action={<button type="button">Create</button>}
      data-fixture="empty"
    />,
  );
  expect(html).toContain('data-fixture="empty"');
  expect(html).toMatch(/aria-labelledby="([^"]+)"/);
  expect(html).toMatch(/aria-describedby="([^"]+)"/);
  expect(html).toContain('class="ui-empty-state__icon" aria-hidden="true"');
  expect(html).toContain('<button type="button">Create</button>');
});

test('empty state does not add empty wrappers when slots are absent', () => {
  const html = renderToStaticMarkup(<UiEmptyState title="Nothing" />);
  expect(html).not.toContain('ui-empty-state__icon');
  expect(html).not.toContain('ui-empty-state__action');
  expect(html).not.toContain('aria-describedby');
});
