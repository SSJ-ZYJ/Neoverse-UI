import type { Locator, Page } from '@playwright/test';
import {
  adapters,
  disablePopoverApi,
  expect,
  expectPanelClosed,
  expectPanelOpen,
  test,
} from '../support/e2e';

test.describe('modal and transient feedback', () => {
  for (const adapter of adapters) {
    test(`${adapter.name}: Escape closes the modal and restores focus`, async ({ page }) => {
      await page.goto(adapter.url('light', 'overlays'));
      const trigger =
        adapter.name === 'Vue'
          ? page.locator('#overlays-dialog [data-dialog-open]')
          : page.locator('[data-react-adapter="UiDialog"] [data-dialog-open]');
      // WebKit does not move focus to a button on pointer activation, so a
      // clicked trigger never owned focus for the dialog to return. Keyboard
      // activation exercises the return-to-invoker contract on every engine.
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.locator('dialog.ui-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-labelledby', /dialog-title|title/);
      const title = dialog.locator('.ui-dialog__title');
      await expect(title).toHaveCSS('font-size', '18px');
      await title.evaluate((element) =>
        element.style.setProperty('--neoverse-typography-title-md-size', '26px'),
      );
      await expect(title).toHaveCSS('font-size', '26px');
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test(`${adapter.name}: a portaled modal keeps its invocation paint through exit`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'));
      const source = page.locator(
        adapter.name === 'Vue' ? '#overlays-dialog' : '[data-react-adapter="UiDialog"]',
      );
      await source.evaluate((element) => element.setAttribute('data-neoverse-material', 'frosted'));
      const trigger = source.locator('[data-dialog-open]');
      await trigger.press('Enter');
      const dialog = page.locator('dialog.ui-dialog');
      const scrim = page.locator('.ui-dialog__backdrop[data-open="true"]');
      await expect(dialog).toHaveCSS('backdrop-filter', /blur\(12px\)/);
      await expect(scrim).toHaveCSS('opacity', '1');
      const frostedScrim = await scrim.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await source.evaluate((element) => element.setAttribute('data-neoverse-material', 'solid'));
      await expect(dialog).toHaveCSS('backdrop-filter', 'none');
      await expect(scrim).not.toHaveCSS('background-color', frostedScrim);
      const scrimFill = await scrim.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await scrim.evaluate((element) => {
        const observer = new MutationObserver(() => {
          if (element.hasAttribute('data-open')) return;
          element.setAttribute('data-test-exit-fill', getComputedStyle(element).backgroundColor);
          observer.disconnect();
        });
        observer.observe(element, { attributeFilter: ['data-open'] });
      });
      await page.keyboard.press('Escape');
      await expect(page.locator('.ui-dialog__backdrop[data-test-exit-fill]')).toHaveAttribute(
        'data-test-exit-fill',
        scrimFill,
      );
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    for (const theme of ['light', 'dark'] as const) {
      test(`${adapter.name}: feedback stays compact, exposes its action and top-right dismiss button, and fits long notifications / ${theme}`, async ({
        page,
      }) => {
        const readDismissGeometry = (toast: Locator) =>
          toast.evaluate((element) => {
            const surface = element.querySelector<HTMLElement>('.ui-toast__surface');
            const dismiss = element.querySelector<HTMLElement>('.ui-toast__dismiss');
            if (!surface || !dismiss) throw new Error('Missing toast surface or dismiss button');
            const message = element.querySelector<HTMLElement>('.ui-toast__message');
            const action = element.querySelector<HTMLElement>('[data-toast-action]');
            const toastRect = surface.getBoundingClientRect();
            const dismissRect = dismiss.getBoundingClientRect();
            const messageRect = message?.getBoundingClientRect() ?? null;
            const actionRect = action?.getBoundingClientRect() ?? null;
            const style = getComputedStyle(dismiss);
            const alphaMatch =
              style.backgroundColor.match(/\/\s*([\d.]+)\s*\)/) ??
              style.backgroundColor.match(/^rgba\(.*,\s*([\d.]+)\s*\)/);
            return {
              hasIcon: dismiss.querySelector('svg') !== null,
              width: dismissRect.width,
              height: dismissRect.height,
              radius: Number.parseFloat(style.borderTopLeftRadius),
              alpha: alphaMatch?.[1] === undefined ? 1 : Number(alphaMatch[1]),
              topOutset: toastRect.top - dismissRect.top,
              rightOutset: dismissRect.right - toastRect.right,
              messageRight: messageRect?.right ?? null,
              actionRight: actionRect?.right ?? null,
              dismissLeft: dismissRect.left,
              toastHeight: toastRect.height,
            };
          });

        await page.goto(adapter.url(theme, 'status-feedback'));
        const fixture = page.locator(
          adapter.name === 'Vue' ? '#status-feedback-toast' : '[data-react-adapter="UiToast"]',
        );
        await fixture.locator('[data-toast-open="compact"]').click();
        const toast = page.locator('.ui-toast[role="status"]');
        const surface = toast.locator('.ui-toast__surface');
        const compactDismissButton = toast.getByRole('button', { name: 'Dismiss notification' });
        await expect(toast.getByRole('button')).toHaveCount(1);
        await expect(compactDismissButton).toBeVisible();
        await expect(surface).toHaveCSS('backdrop-filter', /blur\(18px\)/);
        await expect(compactDismissButton).toHaveCSS('backdrop-filter', /blur\(18px\)/);
        const { alpha, width, height } = await surface.evaluate((element) => {
          const { backgroundColor } = getComputedStyle(element);
          const match =
            backgroundColor.match(/\/\s*([\d.]+)\s*\)/) ??
            backgroundColor.match(/^rgba\(.*,\s*([\d.]+)\s*\)/);
          const rect = element.getBoundingClientRect();
          return {
            alpha: match?.[1] === undefined ? 1 : Number(match[1]),
            width: rect.width,
            height: rect.height,
          };
        });
        expect(alpha).toBeCloseTo(0.2);
        expect(width).toBeLessThan(230);
        expect(height).toBeLessThanOrEqual(42);
        const compactDismiss = await readDismissGeometry(toast);
        expect(compactDismiss.hasIcon).toBe(true);
        expect(compactDismiss.alpha).toBeCloseTo(0.2);
        expect(compactDismiss.width).toBeGreaterThanOrEqual(24);
        expect(compactDismiss.height).toBeCloseTo(compactDismiss.width, 0);
        expect(compactDismiss.radius).toBeGreaterThanOrEqual(compactDismiss.width / 2);
        expect(compactDismiss.topOutset).toBeGreaterThan(0);
        expect(compactDismiss.topOutset).toBeLessThan(compactDismiss.width / 2);
        expect(compactDismiss.rightOutset).toBeGreaterThan(0);
        expect(compactDismiss.rightOutset).toBeLessThan(compactDismiss.width / 2);
        expect(compactDismiss.topOutset).toBeCloseTo(compactDismiss.rightOutset, 1);
        expect(compactDismiss.messageRight ?? 0).toBeLessThanOrEqual(compactDismiss.dismissLeft);
        await compactDismissButton.click();
        await expect(toast).toBeHidden();

        await fixture.locator('[data-toast-open="action"]').click();
        const action = toast.locator('[data-toast-action]');
        const actionDismissButton = toast.getByRole('button', { name: 'Dismiss notification' });
        await expect(action).toBeVisible();
        await expect(actionDismissButton).toBeVisible();
        await expect(toast.getByRole('button')).toHaveCount(2);
        const actionDismiss = await readDismissGeometry(toast);
        expect(actionDismiss.hasIcon).toBe(true);
        expect(actionDismiss.width).toBeCloseTo(compactDismiss.width, 0);
        expect(actionDismiss.height).toBeCloseTo(compactDismiss.height, 0);
        expect(actionDismiss.radius).toBeGreaterThanOrEqual(actionDismiss.width / 2);
        expect(actionDismiss.topOutset).toBeGreaterThan(0);
        expect(actionDismiss.topOutset).toBeLessThan(actionDismiss.width / 2);
        expect(actionDismiss.rightOutset).toBeGreaterThan(0);
        expect(actionDismiss.rightOutset).toBeLessThan(actionDismiss.width / 2);
        expect(actionDismiss.topOutset).toBeCloseTo(actionDismiss.rightOutset, 1);
        expect(actionDismiss.topOutset).toBeCloseTo(compactDismiss.topOutset, 1);
        expect(actionDismiss.actionRight ?? 0).toBeLessThanOrEqual(actionDismiss.dismissLeft);
        await actionDismissButton.click();
        await expect(toast).toBeHidden();
        await expect(fixture.locator('[data-toast-details]')).toBeHidden();

        await fixture.locator('[data-toast-open="action"]').click();
        await action.click();
        await expect(fixture.locator('[data-toast-details]')).toBeVisible();
        await expect(toast).toBeHidden();

        await fixture.locator('[data-toast-open="notification"]').click();
        const notificationDismissButton = toast.getByRole('button', {
          name: 'Dismiss notification',
        });
        await expect(notificationDismissButton).toBeVisible();
        const notification = await toast.evaluate((el) => {
          const { left, right, height: h } = el.getBoundingClientRect();
          return { left, right, height: h, viewport: document.documentElement.clientWidth };
        });
        expect(notification.height).toBeGreaterThan(height);
        expect(notification.left > 0 && notification.right < notification.viewport).toBe(true);
        const notificationDismiss = await readDismissGeometry(toast);
        expect(notificationDismiss.hasIcon).toBe(true);
        expect(notificationDismiss.width).toBeCloseTo(compactDismiss.width, 0);
        expect(notificationDismiss.height).toBeCloseTo(compactDismiss.height, 0);
        expect(notificationDismiss.radius).toBeGreaterThanOrEqual(notificationDismiss.width / 2);
        expect(notificationDismiss.topOutset).toBeGreaterThan(0);
        expect(notificationDismiss.topOutset).toBeLessThan(notificationDismiss.width / 2);
        expect(notificationDismiss.rightOutset).toBeGreaterThan(0);
        expect(notificationDismiss.rightOutset).toBeLessThan(notificationDismiss.width / 2);
        expect(notificationDismiss.topOutset).toBeCloseTo(notificationDismiss.rightOutset, 1);
        expect(notificationDismiss.topOutset).toBeCloseTo(actionDismiss.topOutset, 1);
        expect(notificationDismiss.messageRight ?? 0).toBeLessThanOrEqual(
          notificationDismiss.dismissLeft,
        );
        await notificationDismissButton.click();
        await expect(toast).toBeHidden();
      });
    }

    test(`${adapter.name}: system dark mode keeps toast info accent and action legible`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(adapter.url('dark', 'status-feedback'));
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
      });
      const fixture = page.locator(
        adapter.name === 'Vue' ? '#status-feedback-toast' : '[data-react-adapter="UiToast"]',
      );
      await fixture.locator('[data-toast-open="action"]').click();
      const toast = page.locator('.ui-toast[role="status"]');
      const action = toast.locator('[data-toast-action]');
      await expect(action).toBeVisible();
      const { actionLuminance, infoAccentLuminance, actionMatchesProseLink } = await toast.evaluate(
        (element) => {
          const resolveRgba = (color: string) => {
            const context = new OffscreenCanvas(1, 1).getContext('2d');
            if (!context) throw new Error('A 2D canvas context is required');
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            return Array.from(context.getImageData(0, 0, 1, 1).data);
          };
          const readLuminance = (color: string) => {
            const [r = 0, g = 0, b = 0] = resolveRgba(color);
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const actionEl = element.querySelector<HTMLElement>('[data-toast-action]');
          if (!actionEl) throw new Error('Missing toast action');
          const rootStyle = getComputedStyle(document.documentElement);
          const infoText = rootStyle.getPropertyValue('--neoverse-effect-status-info-text').trim();
          const proseLinkColor = rootStyle
            .getPropertyValue('--neoverse-prose-link-foreground')
            .trim();
          const actionStyle = getComputedStyle(actionEl);
          return {
            actionLuminance: readLuminance(actionStyle.color),
            infoAccentLuminance: readLuminance(infoText),
            actionMatchesProseLink:
              actionEl.classList.contains('ui-button') ||
              (resolveRgba(actionStyle.color).join(',') === resolveRgba(proseLinkColor).join(',') &&
                actionStyle.backgroundImage.includes('linear-gradient')),
          };
        },
      );
      expect(actionLuminance).toBeGreaterThan(120);
      expect(infoAccentLuminance).toBeGreaterThan(120);
      expect(actionMatchesProseLink).toBe(true);
      await toast.getByRole('button', { name: 'Dismiss notification' }).click();
      await expect(toast).toBeHidden();
    });
  }
});

async function popoverParts(page: Page, adapterName: string) {
  const shell =
    adapterName === 'Vue'
      ? page.locator('#overlays-popover [data-overlay-popover]')
      : page.locator('[data-react-adapter="UiPopover"]');
  const trigger = shell.locator('.ui-popover__trigger');
  return { shell, trigger, panel: shell.locator('.ui-popover__content') };
}

async function menuParts(page: Page, adapterName: string) {
  const shell =
    adapterName === 'Vue'
      ? page.locator('#overlays-popover [data-overlay-dropdown]')
      : page.locator('[data-react-adapter="UiDropdownMenu"]');
  const trigger = shell.locator('.ui-dropdown-menu__trigger');
  return { shell, trigger, panel: shell.locator('.ui-dropdown-menu__panel') };
}

async function readPanelFillAlpha(panel: Locator): Promise<number> {
  return panel.evaluate((element) => {
    const color = getComputedStyle(element).backgroundColor;
    return Number(color.match(/(?:\/\s*|rgba\([^)]*,\s*)([\d.]+)\)$/)?.[1] ?? 1);
  });
}

test.describe('overlays', () => {
  for (const adapter of adapters) {
    for (const mode of ['native', 'fallback'] as const) {
      test(`${adapter.name}: popover dismisses with Escape and returns focus / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'));
        const { trigger, panel } = await popoverParts(page, adapter.name);

        await trigger.click();
        await expectPanelOpen(panel);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await page.keyboard.press('Escape');
        await expectPanelClosed(panel, trigger);
        await expect(trigger).toBeFocused();
      });

      test(`${adapter.name}: dropdown supports roving focus and Escape / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'));
        const { trigger, panel } = await menuParts(page, adapter.name);

        await trigger.click();
        await expectPanelOpen(panel);
        const openItem = panel.getByRole('menuitem', { name: 'Open' });
        await expect(openItem).toBeFocused();
        await expect(openItem).toHaveAttribute('data-neoverse-focus-origin', 'pointer');
        await page.keyboard.press('ArrowDown');
        const archiveItem = panel.getByRole('menuitem', { name: 'Archive' });
        await expect(archiveItem).toBeFocused();
        await expect(archiveItem).not.toHaveAttribute('data-neoverse-focus-origin');
        await page.keyboard.press('ArrowDown');
        await expect(panel.getByRole('menuitem', { name: 'Remove' })).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(panel.getByRole('menuitem', { name: 'Open' })).toBeFocused();
        await page.keyboard.press('End');
        await expect(panel.getByRole('menuitem', { name: 'Remove' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expectPanelClosed(panel, trigger);
        await expect(trigger).toBeFocused();
      });

      test(`${adapter.name}: an open menu replaces the open popover / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'));
        const popover = await popoverParts(page, adapter.name);
        const menu = await menuParts(page, adapter.name);

        await popover.trigger.click();
        await expectPanelOpen(popover.panel);
        await menu.trigger.click();
        await expect(popover.panel).toBeHidden();
        await expectPanelOpen(menu.panel);

        await page.mouse.click(5, 5);
        await expectPanelClosed(menu.panel, menu.trigger);
      });

      test(`${adapter.name}: dropdown releases focus and closes when Tab leaves / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'));
        const { trigger, panel } = await menuParts(page, adapter.name);

        await trigger.click();
        await expectPanelOpen(panel);
        await page.keyboard.press('Tab');
        await expectPanelClosed(panel, trigger);
      });
    }

    test(`${adapter.name}: a disabled trigger closes its panel and keeps ARIA aligned`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'));
      const controlled = page.locator('[data-overlay-controlled-popover]');
      const controlledTrigger = controlled.locator('.ui-popover__trigger');
      const controlledPanel = controlled.locator('.ui-popover__content');
      const menu = await menuParts(page, adapter.name);
      const togglePopover = page.locator('[data-overlay-toggle-disabled]');
      const toggleMenu = page.locator('[data-overlay-toggle-menu-disabled]');

      await controlledTrigger.click();
      await expectPanelOpen(controlledPanel);
      await togglePopover.evaluate((button: HTMLElement) => button.click());
      await expect(controlledTrigger).toBeDisabled();
      await expectPanelClosed(controlledPanel, controlledTrigger);

      await togglePopover.evaluate((button: HTMLElement) => button.click());
      await expect(controlledTrigger).toBeEnabled();

      await page.locator('[data-overlay-unmount]').click();
      await expect(controlled).toHaveCount(0);

      await menu.trigger.click();
      await expectPanelOpen(menu.panel);
      await toggleMenu.evaluate((button: HTMLElement) => button.click());
      await expect(menu.trigger).toBeDisabled();
      await expectPanelClosed(menu.panel, menu.trigger);
      await expect(menu.panel.locator('.ui-dropdown-menu__item').first()).not.toBeFocused();
    });

    test(`${adapter.name}: a controlled popover rejects dismissal and unmounts cleanly`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'));
      const shell = page.locator('[data-overlay-controlled-popover]');
      const trigger = shell.locator('.ui-popover__trigger');
      const panel = shell.locator('.ui-popover__content');
      const attempts = page.locator('[data-overlay-controlled] [data-overlay-dismiss-attempts]');

      await trigger.click();
      await expectPanelOpen(panel);
      await page.keyboard.press('Escape');
      await expect(attempts).toHaveText('1');
      await expectPanelOpen(panel);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();

      await page
        .locator('[data-overlay-unmount]')
        .evaluate((button: HTMLElement) => button.click());
      await expect(shell).toHaveCount(0);
    });

    test(`${adapter.name}: the panel follows a moving anchor`, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 700 });
      await page.goto(adapter.url('light', 'overlays'));
      const shell = page.locator('[data-overlay-controlled-popover]');
      const trigger = shell.locator('.ui-popover__trigger');
      const panel = shell.locator('.ui-popover__content');

      await shell.evaluate((element) => {
        Object.assign((element as HTMLElement).style, {
          position: 'fixed',
          left: '100px',
          top: '180px',
          zIndex: '2147483647',
        });
      });
      await page.evaluate(() => document.fonts.ready);
      await trigger.click();
      await expectPanelOpen(panel);

      const offset = () =>
        panel.evaluate((el) => {
          const anchor = el.parentElement?.querySelector('.ui-popover__trigger');
          if (!anchor) throw new Error('The overlay trigger is missing');
          return Math.abs(el.getBoundingClientRect().left - anchor.getBoundingClientRect().left);
        });
      await expect.poll(offset).toBeLessThan(2);

      await shell.evaluate((element) => {
        (element as HTMLElement).style.transform = 'translate(120px, 50px)';
      });
      await expect
        .poll(() => trigger.evaluate((element) => element.getBoundingClientRect().left))
        .toBeGreaterThan(210);
      await expect.poll(offset).toBeLessThan(2);
    });
  }

  test('the tooltip surface renders its message', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#status-feedback-tooltip');
    const tooltip = page.locator('#status-feedback-tooltip .ui-tooltip-surface').first();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).not.toBeEmpty();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`tooltip variants stay distinct on a solid ${theme} backdrop`, async ({ page }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#status-feedback-tooltip`);

      for (const context of ['neutral', 'reduced']) {
        const stage = page.locator(`#status-feedback-tooltip [data-qa-stage="${context}"]`);
        await expect(stage.getByRole('tooltip').last()).toBeVisible();
        const surfaces = await stage.evaluate((element) => {
          const hasShape = CSS.supports('clip-path', 'shape(from 0 0, line to 100% 100%, close)');
          const canvas = document.createElement('canvas').getContext('2d', {
            willReadFrequently: true,
          });
          if (!canvas) throw new Error('A 2D canvas context is required');
          const composite = (color: string) => {
            canvas.fillStyle = color;
            canvas.fillRect(0, 0, 1, 1);
            const [red = 0, green = 0, blue = 0] = canvas.getImageData(0, 0, 1, 1).data;
            return { tone: 0.2126 * red + 0.7152 * green + 0.0722 * blue, blue: blue - red };
          };
          return Array.from(element.querySelectorAll('[role="tooltip"]'), (tooltip) => {
            const plate = getComputedStyle(tooltip, hasShape ? '::before' : null);
            canvas.clearRect(0, 0, 1, 1);
            composite(getComputedStyle(document.body).backgroundColor);
            const background = composite(getComputedStyle(element).backgroundColor);
            const surface = composite(plate.backgroundColor);
            return {
              toneDifference: surface.tone - background.tone,
              blueShift: surface.blue - background.blue,
              backdropFilter: plate.backdropFilter,
            };
          });
        });
        const [neutral, accent] = surfaces;
        if (!neutral || !accent) throw new Error('Both tooltip variants are required');
        const direction = theme === 'light' ? -1 : 1;
        expect(neutral.toneDifference * direction, context).toBeGreaterThanOrEqual(11);
        expect(neutral.blueShift, context).toBeGreaterThanOrEqual(16);
        const accentSeparation = (accent.toneDifference - neutral.toneDifference) * direction;
        expect(accentSeparation, context).toBeGreaterThanOrEqual(3);
        for (const { backdropFilter } of surfaces) {
          if (context === 'neutral') {
            expect(backdropFilter).toContain('blur(12px)');
          } else {
            expect(backdropFilter).toBe('none');
          }
        }
      }
    });
  }

  for (const adapter of adapters) {
    test(`${adapter.name}: destructive confirmation is red while ordinary confirmation stays blue`, async ({
      page,
    }) => {
      for (const theme of ['light', 'dark'] as const) {
        await page.goto(adapter.url(theme, 'overlays'));
        const dialog = page.locator('dialog.ui-dialog');
        const confirm = dialog.locator('[data-dialog-confirm]');
        const redMinusBlue = () =>
          confirm.evaluate((button) => {
            const paint = getComputedStyle(button).backgroundImage;
            const channels = paint.match(
              /(?:color\(srgb |rgba?\()([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/,
            );
            if (channels === null) throw new Error(`Expected a colored fill, received ${paint}`);
            return Number(channels[1]) - Number(channels[3]);
          });

        await page.locator('[data-dialog-open-form]').click();
        await expect(confirm).toBeVisible();
        expect(await redMinusBlue()).toBeLessThan(0);
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();

        await page.locator('[data-dialog-open-destructive]').click();
        await expect(confirm).toBeVisible();
        expect(await redMinusBlue()).toBeGreaterThan(0);
      }
    });

    test(`${adapter.name}: unified overlay typography, elevated rim, dimmed scrim and scenarios`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'));
      await page.locator('[data-overlay-rich-dropdown] .ui-dropdown-menu__trigger').click();
      const richPanel = page.locator('[data-overlay-rich-dropdown] .ui-dropdown-menu__panel');
      await expectPanelOpen(richPanel);
      const richItem = richPanel.locator('.ui-dropdown-menu__item').first();
      await expect(richItem).toHaveCSS('font-size', '14px');
      await expect(richPanel.locator('.ui-dropdown-menu__shortcut').first()).toBeVisible();
      const overlayFillAlpha = await readPanelFillAlpha(richPanel);
      await page.keyboard.press('Escape');

      await page.locator('[data-context-menu-keyboard]').click();
      const ctxPanel = page.locator('.ui-context-menu');
      await expect(ctxPanel).toBeVisible();
      const ctxItem = ctxPanel.locator('.ui-context-menu__item').first();
      await expect(ctxItem).toHaveCSS('font-size', '14px');
      await ctxPanel.locator('.ui-context-menu__item').filter({ hasText: 'Theme' }).hover();
      const submenu = page.locator('.ui-context-menu__submenu');
      await expect(submenu).toBeVisible();
      const isSameShadow =
        (await submenu.evaluate((e) => getComputedStyle(e).boxShadow)) ===
        (await ctxPanel.evaluate((e) => getComputedStyle(e).boxShadow));
      expect(isSameShadow).toBe(true);
      await page.keyboard.press('Tab');
      await expect(ctxPanel).toBeHidden();
      await expect(submenu).toBeHidden();

      await page.locator('[data-dialog-open-form]').click();
      const dialog = page.locator('dialog.ui-dialog');
      await expect(dialog).toBeVisible();
      const dialogFillAlpha = await readPanelFillAlpha(dialog);
      expect(dialogFillAlpha).toBeGreaterThan(overlayFillAlpha);
      expect(dialogFillAlpha).toBeLessThan(1);
      await expect(dialog).toHaveCSS('backdrop-filter', /blur\(18px\)/);
      expect(await dialog.evaluate((e) => e.matches(':modal'))).toBe(false);
      await expect(dialog.locator('input')).not.toBeFocused();
      expect(
        await dialog.evaluate((el) => {
          const probe = document.createElement('div');
          Object.assign(probe.style, { position: 'fixed', inset: '0', zIndex: '2147483647' });
          document.body.append(probe);
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          probe.remove();
          return hit === probe;
        }),
      ).toBe(true);
      await page.keyboard.press('Tab');
      await expect(dialog.locator('input')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await page.locator('[data-dialog-open-destructive]').click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      await expect(dialog).toHaveAttribute('data-size', 'sm');
      const scrim = page.locator('.ui-dialog__backdrop');
      await expect(scrim).toHaveCSS('opacity', '1');
      await expect.poll(() => readPanelFillAlpha(scrim)).toBeCloseTo(0.32);
      await page.mouse.click(10, 10);
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    });
  }
});
