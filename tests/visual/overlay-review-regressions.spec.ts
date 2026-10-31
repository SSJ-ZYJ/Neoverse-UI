import { expect, type Page, test } from '@playwright/test';

async function useLegacyPopoverFallback(page: Page) {
  await page.addInitScript(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });
}

const adapters = [
  { name: 'Vue', url: '/frame?theme=light&lang=en&contract-fixtures=1#controls' },
  { name: 'React', url: '/react-fixture?lang=en&contract-fixtures=1' },
] as const;

for (const adapter of adapters) {
  for (const mode of ['native', 'fallback'] as const) {
    test(`${adapter.name} keeps overlay ARIA and menu focus aligned while disabling / ${mode}`, async ({
      page,
    }) => {
      if (mode === 'fallback') await useLegacyPopoverFallback(page);
      await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });

      const popover = page.locator('[data-overlay-controlled-popover]');
      const popoverTrigger = popover.locator('.ui-popover__trigger');
      const popoverPanel = popover.locator('.ui-popover__content');
      await popoverTrigger.click();
      await expect(popoverPanel).toBeVisible();
      await expect(popoverTrigger).toHaveAttribute('aria-expanded', 'true');

      // Programmatic activation doesn't light-dismiss the controlled popover.
      await page.locator('[data-overlay-toggle-disabled]').evaluate((button: HTMLElement) => {
        button.click();
      });
      await expect(popoverTrigger).toBeDisabled();
      await expect(popoverTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(popoverPanel).toBeHidden();

      await page.locator('[data-overlay-toggle-disabled]').evaluate((button: HTMLElement) => {
        button.click();
      });
      await expect(popoverTrigger).toBeEnabled();
      await expect(popoverPanel).toBeVisible();
      await expect(popoverTrigger).toHaveAttribute('aria-expanded', 'true');

      // The controlled popover rejects dismissal and would reopen, closing
      // the native auto-popover menu. Isolate these two interaction cases.
      await page.locator('[data-overlay-unmount]').click();
      await expect(popover).toHaveCount(0);

      const menu = page.locator(
        adapter.name === 'Vue'
          ? '[data-overlay-dropdown]'
          : '[data-react-adapter="UiDropdownMenu"]',
      );
      const menuTrigger = menu.locator('.ui-dropdown-menu__trigger');
      const menuPanel = menu.locator('.ui-dropdown-menu__panel');
      await menuTrigger.click();
      await expect(menuPanel).toBeVisible();
      await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');

      await page.locator('[data-overlay-toggle-menu-disabled]').evaluate((button: HTMLElement) => {
        button.click();
      });
      await expect(menuTrigger).toBeDisabled();
      await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(menuPanel).toBeHidden();
      await expect(menu.locator('.ui-dropdown-menu__item:first-child')).not.toBeFocused();

      await page.locator('[data-overlay-toggle-menu-disabled]').evaluate((button: HTMLElement) => {
        button.click();
      });
      await expect(menuTrigger).toBeEnabled();
      // A native light-dismiss may already have closed this uncontrolled menu
      // when the external toggle was activated. Its ARIA state must agree with
      // the eventual panel visibility either way.
      await expect
        .poll(
          async () =>
            ((await menuTrigger.getAttribute('aria-expanded')) === 'true') ===
            (await menuPanel.isVisible()),
        )
        .toBe(true);
    });

    for (const zoom of [0.8, 1.5, 2]) {
      test(`${adapter.name} clamps and flips zoomed overlay at the viewport edge / ${mode} / ${zoom}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await useLegacyPopoverFallback(page);
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });

        const popover = page.locator('[data-overlay-controlled-popover]');
        await expect(popover).toBeVisible();
        await popover.evaluate((container, zoomFactor) => {
          const element = container as HTMLElement;
          element.style.position = 'fixed';
          element.style.left = 'calc(100vw - 170px)';
          element.style.top = 'calc(100vh - 120px)';
          const panel = element.querySelector<HTMLElement>('.ui-popover__content');
          if (!panel) throw new Error('Overlay not found');
          panel.style.zoom = String(zoomFactor);
        }, zoom);

        // Programmatic activation avoids unrelated Playground specimens covering
        // the viewport-edge test trigger's coordinates.
        await popover.locator('.ui-popover__trigger').evaluate((button: HTMLElement) => {
          button.click();
        });
        const panel = popover.locator('.ui-popover__content');
        await expect(panel).toBeVisible();
        // Visibility can precede the opening animation and tracked positioning.
        // Keep the same bounds, but wait for them in one layout measurement.
        await expect(async () => {
          const { bounds, viewport } = await panel.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              bounds: { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom },
              // Mobile emulation can use a larger layout viewport than requested.
              viewport: { width: innerWidth, height: innerHeight },
            };
          });
          expect(bounds.x, 'overlay left').toBeGreaterThanOrEqual(-1);
          expect(bounds.right, 'overlay right').toBeLessThanOrEqual(viewport.width + 1);
          expect(bounds.y, 'overlay top').toBeGreaterThanOrEqual(-1);
          expect(bounds.bottom, 'overlay bottom').toBeLessThanOrEqual(viewport.height + 1);
        }).toPass({ timeout: 5_000 });
      });
    }
  }
}
