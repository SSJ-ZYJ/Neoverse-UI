import { expect, type Locator, type Page, test } from '@playwright/test';

// Geometry/lifetime checks retain normal Motion on the authoritative CSS
// baseline, independently from optional WebGL scheduling in the large Vue fixture.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const media = matchMedia(query);
      if (query === '(prefers-reduced-transparency: reduce)') {
        Object.defineProperty(media, 'matches', { value: true });
      }
      return media;
    };
  });
});

const adapters = [
  { name: 'Vue', url: '/frame?theme=light&lang=en&contract-fixtures=1#controls' },
  { name: 'React', url: '/react-fixture?lang=en&contract-fixtures=1' },
] as const;

async function disablePopoverApi(page: Page) {
  await page.addInitScript(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });
}

async function expectAnchored(trigger: Locator, panel: Locator) {
  await expect
    .poll(() =>
      panel.evaluate((element) => {
        const shell = element.parentElement;
        const anchor = shell?.querySelector('button');
        if (!anchor) throw new Error('Missing overlay trigger');
        const triggerRect = anchor.getBoundingClientRect();
        const panelRect = element.getBoundingClientRect();
        return Math.abs(panelRect.left - triggerRect.left);
      }),
    )
    .toBeLessThan(2);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
}

async function pendingFrames(page: Page) {
  return page.evaluate(() => (Reflect.get(window, '__pendingFrames') as () => number)());
}

async function instrumentFrames(page: Page) {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>();
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => {
        pending.delete(id);
        callback(time);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
    Reflect.set(window, '__pendingFrames', () => pending.size);
  });
}

for (const adapter of adapters) {
  for (const mode of ['native', 'fallback'] as const) {
    test(`${adapter.name} keeps overlay associations stable through open and dismiss / ${mode}`, async ({
      page,
    }) => {
      if (mode === 'fallback') await disablePopoverApi(page);
      await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });
      const triggers = page.locator('.ui-popover__trigger, .ui-dropdown-menu__trigger');
      const associations = () =>
        triggers.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-controls')));
      const ids = await associations();
      expect(ids.length).toBeGreaterThanOrEqual(3);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
      for (const selector of ['.ui-popover__trigger', '.ui-dropdown-menu__trigger']) {
        const trigger = page.locator(selector).first();
        const id = await trigger.getAttribute('aria-controls');
        await trigger.click();
        await expect(page.locator(`[id="${id}"]`)).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator(`[id="${id}"]`)).toBeHidden();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger).toBeFocused();
        expect(await associations()).toEqual(ids);
      }
    });

    test(`${adapter.name} cancels tracking on close and unmount without idle position writes / ${mode}`, async ({
      page,
    }) => {
      if (mode === 'fallback') await disablePopoverApi(page);
      await instrumentFrames(page);
      await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });
      const shell = page.locator('[data-overlay-controlled-popover]');
      const trigger = shell.locator('.ui-popover__trigger');
      const panel = shell.locator('.ui-popover__content');
      await trigger.scrollIntoViewIfNeeded();
      // Let unrelated one-shot fixture animations finish before taking a baseline.
      await expect.poll(() => pendingFrames(page)).toBe(0);
      await trigger.click();
      await expect(panel).toBeVisible();
      await expect.poll(() => pendingFrames(page)).toBe(1);
      await expect
        .poll(() =>
          panel.evaluate(async (element) => {
            const style = (element as HTMLElement).style;
            const original = style.setProperty;
            let count = 0;
            style.setProperty = function (name, value, priority) {
              if (name.startsWith('--neoverse-overlay-')) count += 1;
              original.call(this, name, value, priority);
            };
            try {
              for (let index = 0; index < 2; index += 1) {
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              }
            } finally {
              style.setProperty = original;
            }
            return count;
          }),
        )
        .toBe(0);
      await page
        .locator('[data-overlay-toggle-disabled]')
        .evaluate((button: HTMLElement) => button.click());
      await expect(panel).toBeHidden();
      await expect.poll(() => pendingFrames(page)).toBe(0);
      await page
        .locator('[data-overlay-toggle-disabled]')
        .evaluate((button: HTMLElement) => button.click());
      await expect(panel).toBeVisible();
      await expect.poll(() => pendingFrames(page)).toBe(1);
      await page
        .locator('[data-overlay-unmount]')
        .evaluate((button: HTMLElement) => button.click());
      await expect(shell).toHaveCount(0);
      await expect.poll(() => pendingFrames(page)).toBe(0);
    });

    for (const zoom of [1, 1.5]) {
      test(`${adapter.name} tracks an anchor moving without scroll or resize / ${mode} / ${zoom}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.setViewportSize({ width: 1000, height: 700 });
        await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });
        const shell = page
          .locator('[data-overlay-controlled-popover] .ui-popover')
          .or(page.locator('.ui-popover[data-overlay-controlled-popover]'));
        const trigger = shell.locator('.ui-popover__trigger');
        const panel = shell.locator('.ui-popover__content');
        await shell.evaluate((element, factor) => {
          // Keep the actual adapter mounted, but remove unrelated specimen layout.
          (document.getElementById('react-root') ?? document.getElementById('app'))?.append(
            element,
          );
          Object.assign((element as HTMLElement).style, {
            position: 'fixed',
            left: '100px',
            top: '180px',
            zoom: String(factor),
          });
        }, zoom);
        await trigger.click();
        await expect(panel).toBeVisible();
        await expectAnchored(trigger, panel);
        const before = await trigger.boundingBox();
        await shell.evaluate((element) => {
          (element as HTMLElement).style.transform = 'translate(120px, 50px)';
        });
        await expect
          .poll(async () => (await trigger.boundingBox())?.x)
          .toBeGreaterThan((before?.x ?? 0) + 100);
        await expectAnchored(trigger, panel);
        // Vertical motion must follow as well, rather than only preserving left.
        await expect
          .poll(() =>
            panel.evaluate((element) => {
              const anchor = element.parentElement?.querySelector('button');
              if (!anchor) throw new Error('Missing overlay trigger');
              return Math.abs(
                element.getBoundingClientRect().top - anchor.getBoundingClientRect().bottom,
              );
            }),
          )
          .toBeLessThan(30);
      });

      test(`${adapter.name} repositions asynchronously growing content / ${mode} / ${zoom}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.setViewportSize({ width: 1000, height: 700 });
        await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });
        const shell = page
          .locator('[data-overlay-controlled-popover] .ui-popover')
          .or(page.locator('.ui-popover[data-overlay-controlled-popover]'));
        const trigger = shell.locator('.ui-popover__trigger');
        const panel = shell.locator('.ui-popover__content');
        await shell.evaluate((element, factor) => {
          (document.getElementById('react-root') ?? document.getElementById('app'))?.append(
            element,
          );
          Object.assign((element as HTMLElement).style, {
            position: 'fixed',
            left: '100px',
            top: `${480 / factor}px`,
            zoom: String(factor),
          });
        }, zoom);
        await trigger.click();
        await expect(panel).toBeVisible();
        await expect(panel).toHaveAttribute('data-neoverse-overlay-side', 'bottom');
        await panel.evaluate((element) => {
          const body = document.createElement('div');
          body.style.height = '220px';
          body.textContent = 'Asynchronously loaded details';
          element.append(body);
        });
        await expect(panel).toHaveAttribute('data-neoverse-overlay-side', 'top');
        await expect
          .poll(() =>
            panel.evaluate((element) => {
              const anchor = element.parentElement?.querySelector('button');
              if (!anchor) throw new Error('Missing overlay trigger');
              return element.getBoundingClientRect().bottom - anchor.getBoundingClientRect().top;
            }),
          )
          .toBeLessThan(1);
      });
    }
  }
}
