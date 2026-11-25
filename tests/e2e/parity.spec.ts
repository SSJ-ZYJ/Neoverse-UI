import type { Page } from '@playwright/test';
import { expect, test } from '../support/e2e';

const adapterNames = [
  'UiBadge',
  'UiControlSurface',
  'UiNavigationItem',
  'UiSegmentedControl',
  'UiSkeleton',
  'UiStatusIndicator',
  'UiTooltipSurface',
  'UiStatCard',
  'UiTimeline',
  'UiStepFlow',
  'UiTable',
  'UiDisclosure',
  'UiScrollbar',
] as const;

const storedTheme = (page: Page) =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('neoverse-design-lab.preferences');
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || !('theme' in parsed)) return null;
    return (parsed as { theme: unknown }).theme;
  });

test.describe('parity', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`every React adapter renders inside the ${theme} theme`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/react-fixture?theme=${theme}&lang=zh&contract-fixtures=1`);

      await expect(page.locator('[data-react-parity-fixture]')).toBeVisible();
      for (const name of adapterNames) {
        await expect(page.locator(`[data-react-adapter="${name}"]`)).toHaveCount(1);
      }
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(
        page.locator('[data-react-adapter="UiStepFlow"] [aria-current="step"]'),
      ).toHaveCount(1);
      const navigation = page.getByRole('button', { name: '首页', exact: true }).filter({
        has: page.locator('[data-contract-navigation-suffix]'),
      });
      await expect(navigation.locator('[data-contract-navigation-suffix]')).toHaveText('· 01');
      await expect(navigation.locator('[data-contract-navigation-decoration]')).toBeVisible();
      const notice = page.locator('[data-react-adapter="UiNotice"]');
      await expect(notice).toHaveJSProperty('tagName', 'ARTICLE');
      await expect(notice.getByRole('button')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('the explicit theme query wins over the system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/react-fixture?theme=light&lang=en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.goto('/react-fixture?theme=dark&lang=en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('the fixture follows the system theme when no selection exists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/react-fixture?lang=en');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe('dark');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  });

  test('the theme control stores the shared preference without touching the URL', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/react-fixture?lang=en');
    const control = page.getByRole('radiogroup', { name: 'Playground theme' });

    await expect(control.getByRole('radio')).toHaveCount(3);
    const dark = control.getByRole('radio', { name: 'Dark', exact: true });
    await expect(dark.locator('svg')).toBeVisible();
    await expect(dark).toHaveText('');
    await dark.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => storedTheme(page)).toBe('dark');
    expect(new URL(page.url()).searchParams.has('theme')).toBe(false);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/?lang=en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const toolbar = page.getByRole('banner');
    if (testInfo.project.use.hasTouch) {
      await expect(
        toolbar.getByRole('button', { name: /Cycle theme/ }).locator('svg'),
      ).toBeVisible();
    } else {
      const options = toolbar
        .getByRole('radiogroup', { name: 'Playground theme' })
        .getByRole('radio');
      await expect(options).toHaveCount(3);
      for (const option of await options.all()) {
        await expect(option.locator('svg')).toBeVisible();
        await expect(option).toHaveText('');
      }
    }

    await page.goto('/react-fixture?lang=en');
    const system = control.getByRole('radio', { name: 'System', exact: true });
    await expect(system.locator('svg')).toBeVisible();
    await system.click();
    await expect(system).toBeChecked();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect.poll(() => storedTheme(page)).toBe('system');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe('dark');
  });

  test('Vue and React expose the same control names and roles', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      for (const adapter of [
        { name: 'Vue', url: `/frame?theme=${theme}&lang=en&contract-fixtures=1#forms` },
        { name: 'React', url: `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1` },
      ]) {
        await page.goto(adapter.url);
        const form = page.locator('[data-contract-form]');
        await expect(
          form.getByRole('checkbox', { name: 'Notifications', exact: true }),
        ).toHaveCount(1);
        await expect(
          form.getByRole('switch', { name: 'Synchronization', exact: true }),
        ).toHaveCount(1);
        await expect(form.getByRole('radiogroup', { name: 'Channel', exact: true })).toHaveCount(1);
        await expect(
          form.getByRole('radiogroup', { name: 'Channel', exact: true }).getByRole('radio'),
        ).toHaveCount(3);
      }
    }
  });
});
