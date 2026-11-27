import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../../support/e2e';

test.describe('material switching', () => {
  test('material switching preserves the specimen session, zoom and scroll', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#forms-textarea');
    const textarea = page.locator('#forms-textarea').getByRole('textbox');
    await textarea.fill('Solid keeps state');
    await textarea.focus();
    const zoom = page.locator('[data-stage-zoom="range"]');
    await zoom.fill('750');
    const workspace = page.locator('[data-design-lab-workspace]');
    await workspace.evaluate((element) => element.scrollTo({ top: 260, behavior: 'instant' }));
    const scrollTop = await workspace.evaluate((element) => element.scrollTop);
    const control = page.locator(
      `[data-playground-material-control="${mobile ? 'cycle' : 'segments'}"]`,
    );
    const root = page.locator('html');

    await (mobile ? control : control.getByRole('radio', { name: 'Solid' })).click();
    await expect(root).toHaveAttribute('data-neoverse-material', 'solid');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
    await expect(textarea).toHaveValue('Solid keeps state');
    await expect(zoom).toHaveValue('750');
    expect(await workspace.evaluate((element) => element.scrollTop)).toBe(scrollTop);
    await expect(mobile ? control : control.getByRole('radio', { name: 'Solid' })).toBeFocused();

    await (mobile ? control : control.getByRole('radio', { name: /Frosted/ })).click();
    await expect(root).toHaveAttribute('data-neoverse-material', 'frosted');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
    await expect(textarea).toHaveValue('Solid keeps state');
    await (mobile ? control : control.getByRole('radio', { name: 'Glass' })).click();
    await expect(root).toHaveAttribute('data-neoverse-material', 'glass');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(1);
    await expect(textarea).toHaveValue('Solid keeps state');
    await expect(zoom).toHaveValue('750');
    expect(await workspace.evaluate((element) => element.scrollTop)).toBe(scrollTop);
  });

  test('rapid material switching settles on the last choice', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#forms-textarea');
    const root = page.locator('html');
    const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');

    await page.evaluate(async (cycle) => {
      const host = document.querySelector(
        `[data-playground-material-control="${cycle ? 'cycle' : 'segments'}"]`,
      );
      if (!host) throw new Error('Material control is missing');
      // Click synchronously so every request lands inside one task; a stale
      // run must never win over the newest selection.
      if (cycle) {
        for (const cycleStep of [1, 2, 3, 4]) {
          (host as HTMLElement).click();
          if (cycleStep < 4) await Promise.resolve();
        }
        return;
      }
      for (const name of ['Frosted', 'Aurora Glass', 'Solid']) {
        const option = [...host.querySelectorAll('[role="radio"]')].find(
          (radio) => radio.getAttribute('aria-label') === name,
        );
        (option as HTMLElement | undefined)?.click();
      }
    }, mobile);

    await expect(root).toHaveAttribute('data-neoverse-material', 'solid');
    await expect(root).not.toHaveAttribute('data-neoverse-appearance-motion');
    await expect(canvas).toHaveCount(0);

    await page.evaluate(async (cycle) => {
      const host = document.querySelector(
        `[data-playground-material-control="${cycle ? 'cycle' : 'segments'}"]`,
      );
      if (!host) throw new Error('Material control is missing');
      if (cycle) {
        (host as HTMLElement).click();
        await Promise.resolve();
        (host as HTMLElement).click();
        return;
      }
      for (const name of ['Aurora Glass', 'Solid', 'Aurora Glass']) {
        const option = [...host.querySelectorAll('[role="radio"]')].find(
          (radio) => radio.getAttribute('aria-label') === name,
        );
        (option as HTMLElement | undefined)?.click();
      }
    }, mobile);

    await expect(root).toHaveAttribute('data-neoverse-material', 'glass');
    await expect(root).not.toHaveAttribute('data-neoverse-appearance-motion');
    await expect(canvas).toHaveCount(1);
    await expectNoPageOverflow(page);
  });

  test('a material switch uses one fade snapshot and clears its overlay state', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en&fps=0#forms-textarea');
    const root = page.locator('html');
    const control = page.locator(
      `[data-playground-material-control="${mobile ? 'cycle' : 'segments'}"]`,
    );
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as Window & { __materialMotionKinds?: string[] }).__materialMotionKinds = seen;
      new MutationObserver(() => {
        const kind = document.documentElement.getAttribute('data-neoverse-appearance-motion');
        const snapshot = document.documentElement.hasAttribute(
          'data-neoverse-theme-view-transitioning',
        );
        if (kind !== null && snapshot) seen.push(kind);
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: [
          'data-neoverse-appearance-motion',
          'data-neoverse-theme-view-transitioning',
        ],
      });
    });

    await (mobile ? control : control.getByRole('radio', { name: 'Solid' })).click();
    await expect(root).toHaveAttribute('data-neoverse-material', 'solid');
    await expect(root).not.toHaveAttribute('data-neoverse-appearance-motion');
    await expect(root).not.toHaveAttribute('data-neoverse-theme-view-transitioning');
    expect(
      await page.evaluate(
        () => (window as Window & { __materialMotionKinds?: string[] }).__materialMotionKinds,
      ),
    ).toContain('material-fade');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
  });

  test('Solid keeps the Glass foreground hierarchy for status and selection', async ({ page }) => {
    const read = async (theme: string, material: string) => {
      await page.goto(
        `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1&material=${material}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.locator('[data-react-adapter="UiBadge"]').first().waitFor();
      return page.evaluate(() => {
        const style = (selector: string) => {
          const element = document.querySelector(selector);
          return element ? getComputedStyle(element).color : null;
        };
        return {
          notice: style('.ui-notice--info'),
          nav: style('.ui-navigation-item--active'),
          badgeInfo: style('.ui-badge--info'),
          badgeSuccess: style('.ui-badge--success'),
        };
      });
    };

    for (const theme of ['dark', 'light'] as const) {
      const glass = await read(theme, 'glass');
      const solid = await read(theme, 'solid');
      expect(solid.notice, `${theme} neutral status ink`).toBe(glass.notice);
      expect(solid.nav, `${theme} selection ink`).toBe(glass.nav);
      expect(solid.badgeInfo, `${theme} info badge keeps its hue`).not.toBe(solid.notice);
      expect(solid.badgeSuccess, `${theme} success badge keeps its hue`).not.toBe(solid.notice);
      expect(solid.badgeInfo).not.toBe(solid.badgeSuccess);
    }
  });

  test('all six directed material switches preserve the DOM instance and Glass canvas lifecycle', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile',
      'Directed pairwise selection uses the desktop segmented control.',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#forms-input', { waitUntil: 'domcontentloaded' });
    const root = page.locator('html');
    const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');
    const input = page.locator('#forms-input input');
    await input.fill('Persistent value');
    const handle = await input.elementHandle();
    const control = page.locator('[data-playground-material-control="segments"]');

    // Visit every directed edge: glass -> solid -> frosted -> glass -> frosted -> solid -> glass
    const transitions = [
      ['Solid', 'solid', 0],
      ['Frosted', 'frosted', 0],
      ['Glass', 'glass', 1],
      ['Frosted', 'frosted', 0],
      ['Solid', 'solid', 0],
      ['Glass', 'glass', 1],
    ] as const;

    for (const [label, expectedMaterial, expectedCanvas] of transitions) {
      await control.getByRole('radio', { name: label }).click();
      await expect(root).toHaveAttribute('data-neoverse-material', expectedMaterial);
      await expect(canvas).toHaveCount(expectedCanvas);
      await expect(input).toHaveValue('Persistent value');
      expect(await input.evaluate((node, before) => node === before, handle)).toBe(true);
    }
  });

  test('simultaneous Theme and Material switching settles cleanly and persists across reload', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile',
      'Simultaneous toolbar selection uses the desktop controls.',
    );
    await page.goto('/?theme=light&material=glass&lang=en&fps=0#forms-textarea', {
      waitUntil: 'domcontentloaded',
    });
    const root = page.locator('html');
    const textarea = page.locator('#forms-textarea').getByRole('textbox');
    await textarea.fill('Theme and material together');
    const handle = await textarea.elementHandle();

    // Trigger Theme and Material switches back-to-back without waiting for the first snapshot.
    await page.evaluate(() => {
      const dark = document
        .querySelector('[data-playground-theme-control="segments"]')
        ?.querySelector<HTMLElement>('[role="radio"][aria-label="Dark"]');
      const frosted = document
        .querySelector('[data-playground-material-control="segments"]')
        ?.querySelector<HTMLElement>('[role="radio"][aria-label="Frosted"]');
      dark?.click();
      frosted?.click();
    });

    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(root).toHaveAttribute('data-neoverse-material', 'frosted');
    await expect(root).not.toHaveAttribute('data-neoverse-appearance-motion');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
    await expect(textarea).toHaveValue('Theme and material together');
    expect(await textarea.evaluate((node, before) => node === before, handle)).toBe(true);

    // Reload must preserve the persisted interactive choices rather than reverting to URL query.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(root).toHaveAttribute('data-neoverse-material', 'frosted');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
  });
});
