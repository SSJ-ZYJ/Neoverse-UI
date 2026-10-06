import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { UiPresence } from './presence.js';

test('UiPresence renders the shared Motion attributes and entrance class', () => {
  const markup = renderToStaticMarkup(
    <UiPresence as="span" className="consumer-presence" origin="top" show variant="pop">
      Presence content
    </UiPresence>,
  );

  expect(markup).toContain('data-neoverse-motion="pop"');
  expect(markup).toContain('data-neoverse-motion-origin="top"');
  expect(markup).toContain('class="nv-appear consumer-presence"');
  expect(markup).toContain('>Presence content</span>');
  expect(markup).not.toContain('nv-vanish');
});

test('UiPresence stays unmounted when initially hidden', () => {
  const markup = renderToStaticMarkup(
    <UiPresence show={false} variant="veil">
      Hidden content
    </UiPresence>,
  );

  expect(markup).toBe('');
});
