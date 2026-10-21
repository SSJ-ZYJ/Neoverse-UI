import { expect, type Page, test } from '@playwright/test';

async function disableNativePopover(page: Page) {
  await page.addInitScript(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });
}

const fixtures = [
  {
    adapter: 'Vue',
    url: '/frame?theme=light&lang=en&contract-fixtures=1#forms-select',
    selector: '[data-form-select]',
  },
  {
    adapter: 'React',
    url: '/react-fixture?lang=en&contract-fixtures=1',
    selector: '[data-react-adapter="UiSelect"]',
  },
] as const;

for (const fixture of fixtures) {
  for (const mode of ['native', 'fallback'] as const) {
    for (const state of ['disabled', 'readonly'] as const) {
      test(`${fixture.adapter} Select closes and cleans up when switched to ${state} / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disableNativePopover(page);
        await page.goto(fixture.url, { waitUntil: 'domcontentloaded' });
        const select = page.locator(fixture.selector);
        const summary = select;
        const details = select.locator('xpath=ancestor::details');
        const panel = details.locator('.ui-select__popover');
        await summary.click();
        await expect(summary).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
        const control = page.locator(`[data-select-block-${state}]`);
        await control.evaluate((element: HTMLElement) => element.click());
        await expect(summary).toHaveAttribute('aria-expanded', 'false');
        await expect(summary).toHaveAttribute('aria-disabled', 'true');
        await expect(panel).toBeHidden();
        await expect(details).not.toHaveAttribute('open');
        await expect(panel).not.toHaveClass(/ui-select__popover--fallback-open/);
        if (mode === 'native') {
          expect(await panel.evaluate((element) => element.matches(':popover-open'))).toBe(false);
        }
        await control.evaluate((element: HTMLElement) => element.click());
        await expect(summary).not.toHaveAttribute('aria-disabled', 'true');
        await expect(panel).toBeHidden();
        await summary.click();
        await expect(summary).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
      });
    }
  }
}
