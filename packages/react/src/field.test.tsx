import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiField, UiInput } from './index.js';

test('Field binds native required and disabled controls to description and validation messages', () => {
  const html = renderToStaticMarkup(
    <UiField
      controlId="release-email"
      label="Email"
      description="Release updates"
      message="Invalid email"
      descriptionId="release-help"
      messageId="release-error"
      required
      disabled
    >
      {(attrs) => <UiInput {...attrs} type="email" validation="error" />}
    </UiField>,
  );
  expect(html).toContain('for="release-email"');
  expect(html).toContain('id="release-help"');
  expect(html).toContain('id="release-error"');
  expect(html).toContain('aria-describedby="release-help release-error"');
  expect(html).toContain('required=""');
  expect(html).toContain('disabled=""');
});

test('Field generates distinct SSR description ids and avoids dangling associations', () => {
  const html = renderToStaticMarkup(
    <div>
      <UiField description="First help">{(attrs) => <input {...attrs} />}</UiField>
      <UiField description="Second help">{(attrs) => <input {...attrs} />}</UiField>
      <UiField>{(attrs) => <input {...attrs} />}</UiField>
    </div>,
  );
  const ids = [...html.matchAll(/<p id="([^"]+)"/g)].map((match) => match[1]);
  const associations = [...html.matchAll(/aria-describedby="([^"]+)"/g)].map((match) => match[1]);
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
  expect(associations).toEqual(ids);
});
