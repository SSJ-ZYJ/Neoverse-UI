import { expect, type Locator, type Page } from '@playwright/test';

export const themes = ['light', 'dark'] as const;
export type Theme = (typeof themes)[number];

/**
 * The two adapters share one contract, so most modules run the same scenario
 * against both fixtures. The Vue fixture is the Design Lab frame; React mounts
 * the same contract fixtures on its own route.
 */
export type Adapter = {
  name: 'Vue' | 'React';
  url: (theme: Theme, hash?: string) => string;
};

export const adapters: readonly Adapter[] = [
  {
    name: 'Vue',
    url: (theme, hash = 'forms') => `/frame?theme=${theme}&lang=en&contract-fixtures=1#${hash}`,
  },
  {
    name: 'React',
    url: (theme) => `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`,
  },
];

/** Removes the native popover API so the runtime takes its fallback path. */
export async function disablePopoverApi(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });
}

/** Reads the submitted entries of a form as a plain record. */
export async function formValues(form: Locator): Promise<Record<string, string>> {
  return form.evaluate((element) =>
    Object.fromEntries(
      Array.from(new FormData(element as HTMLFormElement).entries(), ([name, value]) => [
        name,
        String(value),
      ]),
    ),
  );
}

export async function describedTexts(control: Locator): Promise<Array<string | null>> {
  return control.evaluate((element) =>
    (element.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? null),
  );
}

/** Asserts that an overlay panel is open, whichever dismissal path owns it. */
export async function expectPanelOpen(panel: Locator): Promise<void> {
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute('hidden', '');
}

/** A panel must leave the layout and its trigger must report the collapsed state. */
export async function expectPanelClosed(panel: Locator, trigger: Locator): Promise<void> {
  await expect(panel).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

export async function openContextMenuAtZone(page: Page, offset = { x: 24, y: 16 }) {
  const zone = page.locator('[data-context-menu-zone]');
  await zone.scrollIntoViewIfNeeded();
  const box = await zone.boundingBox();
  if (box === null) throw new Error('The context menu zone must be laid out');
  await page.mouse.click(box.x + offset.x, box.y + offset.y, { button: 'right' });
  const panel = page.locator('.ui-context-menu');
  await expect(panel).toBeVisible();
  return panel;
}

/** The document must never scroll sideways at a supported viewport. */
export async function expectNoPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'the page must not scroll horizontally').toBeLessThanOrEqual(1);
}
