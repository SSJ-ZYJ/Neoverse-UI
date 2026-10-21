import { expect, type Page, test } from '@playwright/test';

const palette = (page: Page) =>
  page.evaluate(() => ({
    attribute: document.documentElement.getAttribute('data-theme'),
    scheme: getComputedStyle(document.documentElement).colorScheme,
    canvas: getComputedStyle(document.body).backgroundColor,
  }));

const storedTheme = (page: Page) =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('neoverse-design-lab.preferences');
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || !('theme' in parsed)) {
      return null;
    }

    return (parsed as { theme: unknown }).theme;
  });

test('React fixture resolves the explicit theme query like the Design Lab frame', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

  await page.goto('/react-fixture?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
  const light = await palette(page);
  expect(light.attribute).toBe('light');
  expect(light.scheme).toBe('light');

  await page.goto('/react-fixture?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
  const dark = await palette(page);
  expect(dark.attribute).toBe('dark');
  expect(dark.scheme).toBe('dark');

  expect(dark.canvas).not.toBe(light.canvas);
});

test('React fixture follows the system theme without an explicit selection', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });

  expect(await palette(page)).toMatchObject({ attribute: null, scheme: 'light' });

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(async () => (await palette(page)).scheme).toBe('dark');
  expect((await palette(page)).attribute).toBeNull();
});

test('React fixture theme control reuses the shared mode vocabulary and preference record', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });

  const control = page.getByRole('radiogroup', { name: 'Playground theme' });
  await expect(control).toBeVisible();
  await expect(control.getByRole('radio')).toHaveCount(3);

  await control.getByRole('radio', { name: 'Dark', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => storedTheme(page)).toBe('dark');
  expect(new URL(page.url()).searchParams.get('theme')).toBe('dark');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // The Design Lab shell resolves the same preference record, so both surfaces align.
  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('radiogroup', { name: 'Playground theme' })
    .getByRole('radio', { name: 'System', exact: true })
    .check();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect.poll(() => storedTheme(page)).toBe('system');
});
