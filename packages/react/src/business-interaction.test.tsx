import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiDialog, UiToast } from './index';

test('Dialog and Toast defer browser-only portals until mounted', () => {
  const dialog = renderToStaticMarkup(
    <UiDialog open title="Review changes" onOpenChange={() => undefined}>
      Review details
    </UiDialog>,
  );
  const toast = renderToStaticMarkup(
    <UiToast open message="Saved" dismissLabel="Dismiss" onOpenChange={() => undefined} />,
  );
  expect(dialog).toBe('');
  expect(toast).toBe('');
});
