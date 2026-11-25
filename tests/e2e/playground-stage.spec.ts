import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';

test.describe('playground stage', () => {
  test('the focused stage remains a plain canvas in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.goto(`/?theme=${theme}&lang=en#forms-textarea`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('#forms-textarea')).toBeVisible();
      const workspace = page.locator('[data-design-lab-workspace]');
      expect(await workspace.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
        'none',
      );
      expect(
        await page
          .locator('.playground-shell')
          .evaluate((element) => getComputedStyle(element).backgroundImage),
      ).toBe('none');
      await expect(
        workspace.locator('.playground-material-backdrop, [data-qa-matrix]'),
      ).toHaveCount(0);
      await expect(workspace.locator('.ui-textarea')).toHaveCount(1);
      await expect(workspace.locator('.ui-input, .ui-select')).toHaveCount(0);
    }
  });

  test('the stage background switcher repaints the workspace and survives a reload', async ({
    page,
  }) => {
    await page.goto('/?theme=light&lang=en#forms-textarea', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    const control = page.getByRole('radiogroup', { name: 'Stage background' });
    await expect(control).toBeVisible();
    await expect(workspace).toHaveAttribute('data-stage-background', 'canvas');
    expect(await workspace.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
      'none',
    );

    await control.getByRole('radio', { name: 'Gradient' }).click();
    await expect(workspace).toHaveAttribute('data-stage-background', 'gradient');
    expect(
      await workspace.evaluate((element) => getComputedStyle(element).backgroundImage),
    ).toContain('radial-gradient');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(workspace).toHaveAttribute('data-stage-background', 'gradient');
    await expect(control.getByRole('radio', { name: 'Gradient' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await control.getByRole('radio', { name: 'Solid' }).click();
    await expect(workspace).toHaveAttribute('data-stage-background', 'canvas');
  });

  test('the stage move handle moves the specimen and Home recenters it', async ({ page }) => {
    // The entrance animation offsets the content for its first frames; reduced
    // motion keeps the measured centre stable for the recenter assertion.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    const movable = page.locator('.playground-stage__specimen-content > *');
    const grip = page.locator('[data-stage-move-handle]');
    await expect(grip).toBeVisible();
    const before = await movable.boundingBox();
    const handle = await grip.boundingBox();
    if (before === null || handle === null) throw new Error('Missing stage geometry');

    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 48, handle.y + handle.height / 2 + 36, {
      steps: 6,
    });
    await page.mouse.up();

    const moved = await movable.boundingBox();
    expect(moved?.x ?? 0).toBeGreaterThan(before.x + 24);
    expect(moved?.y ?? 0).toBeGreaterThan(before.y + 16);

    await grip.focus();
    await page.keyboard.press('Home');
    await expect
      .poll(async () => {
        const box = await movable.boundingBox();
        if (box === null) return Number.POSITIVE_INFINITY;
        return Math.max(Math.abs(box.x - before.x), Math.abs(box.y - before.y));
      })
      .toBeLessThan(2);
  });

  test('preview zoom resizes the live specimen without scaling the stage controls', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#controls-button', {
      waitUntil: 'domcontentloaded',
    });
    const specimen = page.locator('#controls-button');
    const button = specimen.getByRole('button');
    const zoomIn = page.locator('[data-stage-zoom="in"]');
    const zoomOut = page.locator('[data-stage-zoom="out"]');
    const range = page.locator('[data-stage-zoom="range"]');
    const reset = page.locator('[data-stage-zoom="reset"]');
    await expect(reset).toHaveText('100%');
    const original = await button.boundingBox();
    const control = await zoomIn.boundingBox();
    if (!original || !control) throw new Error('Missing preview geometry');

    // The track is logarithmic: 500 is 100%, 613 is about 137%.
    await range.fill('613');
    await expect(reset).toHaveText('137%');
    const enlarged = await button.boundingBox();
    expect((enlarged?.width ?? 0) / original.width).toBeCloseTo(1.37, 1);
    expect((await zoomIn.boundingBox())?.width).toBe(control.width);
    await button.click();
    await expect(specimen.locator('output')).toHaveText('Activations: 1');

    await reset.press('Enter');
    await expect(reset).toHaveText('100%');
    const restored = await button.boundingBox();
    expect(Math.abs((restored?.width ?? 0) - original.width)).toBeLessThan(1);
    await zoomOut.click();
    await expect(reset).toHaveText('91%');
    const shrunk = await button.boundingBox();
    expect((shrunk?.width ?? 0) / original.width).toBeCloseTo(0.91, 1);
    await expect(specimen.locator('output')).toHaveText('Activations: 1');
  });

  test('magnified action controls keep their hover feedback on the same outline', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.use.hasTouch === true, 'Hover requires a hover-capable pointer');
    await page.emulateMedia({ reducedMotion: 'reduce' });

    for (const [id, role] of [
      ['controls-action', 'link'],
      ['controls-icon-button', 'button'],
      ['controls-button', 'button'],
    ] as const) {
      await page.goto(`/?theme=light&lang=zh&fps=0#${id}`, { waitUntil: 'domcontentloaded' });
      await page.mouse.move(0, 0);
      const control = page.locator(`#${id}[data-design-lab-region="specimen"]`).getByRole(role);
      await expect(control).toBeVisible();
      const original = await control.boundingBox();
      await page.locator('[data-stage-zoom="range"]').fill('900');
      const magnified = await control.boundingBox();
      if (!original || !magnified) throw new Error(`Missing ${id} geometry`);
      expect(magnified.width / original.width).toBeGreaterThan(3);
      await expect(control).toHaveCSS('background-clip', 'border-box');
      const rest = await control.evaluate((element) => getComputedStyle(element).backgroundImage);
      await control.hover();
      await expect(control).not.toHaveCSS('background-image', rest);
      await expect(control).toHaveCSS('background-clip', 'border-box');
      expect(await control.boundingBox()).toEqual(magnified);
      await page.mouse.move(0, 0);
      await expect(control).toHaveCSS('background-image', rest);
    }
  });

  test('ctrl and wheel zooms continuously around the pointer inside the preview', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#controls-button', {
      waitUntil: 'domcontentloaded',
    });
    const content = page.locator('#controls-button .playground-stage__specimen-content');
    const reset = page.locator('[data-stage-zoom="reset"]');
    const stage = await content.boundingBox();
    if (!stage) throw new Error('Missing preview geometry');
    await expect(reset).toHaveText('100%');

    await page.mouse.move(stage.x + stage.width * 0.7, stage.y + stage.height / 2);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120);
    await page.mouse.wheel(0, -120);
    await page.keyboard.up('Control');
    await expect(reset).not.toHaveText('100%');
    const zoomed = Number.parseInt((await reset.textContent()) ?? '100', 10);
    expect(zoomed).toBeGreaterThan(120);
    expect(zoomed).toBeLessThan(200);
    await expectNoPageOverflow(page);
  });

  test('a magnified preview stays under the stage chrome and specimen heading', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#composition-reading', {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('[data-stage-zoom="range"]').fill('900');
    const topmost = await page.evaluate(() => {
      const owner = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return hit !== null && hit.closest(selector) !== null;
      };
      return {
        zoom: owner('.playground-stage__zoom'),
        background: owner('[data-stage-background]'),
        heading: owner('.playground-stage__heading'),
      };
    });
    expect(topmost).toEqual({ zoom: true, background: true, heading: true });
  });

  test('a magnified preview pans freely and keeps its shadow unclipped', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0#status-feedback-skeleton', {
      waitUntil: 'domcontentloaded',
    });
    const content = page.locator('#status-feedback-skeleton .playground-stage__specimen-content');
    const root = content.locator(':scope > *');
    const skeleton = page.locator('#status-feedback-skeleton .ui-skeleton').first();
    const original = await skeleton.boundingBox();
    if (!original) throw new Error('Missing preview geometry');
    // The track is logarithmic: 750 is 200%.
    await page.locator('[data-stage-zoom="range"]').fill('750');
    const stage = await content.boundingBox();
    const before = await root.boundingBox();
    if (!stage || !before) throw new Error('Missing preview geometry');
    expect(await content.evaluate((element) => getComputedStyle(element).overflow)).toBe('visible');
    const enlarged = await skeleton.boundingBox();
    expect((enlarged?.height ?? 0) / original.height).toBeCloseTo(2, 1);
    await expectNoPageOverflow(page);

    const grip = page.locator('[data-stage-move-handle]');
    for (let step = 0; step < 12; step++) await grip.press('Shift+ArrowRight');
    const panned = await root.boundingBox();
    expect((panned?.x ?? 0) - before.x).toBeGreaterThan(100);
    await expectNoPageOverflow(page);

    // The preview covers most of the stage once magnified, so dragging its own
    // surface must pan it; only a real control keeps its own press.
    const center = { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 };
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x - 120, center.y, { steps: 8 });
    await page.mouse.up();
    const dragged = await root.boundingBox();
    expect(dragged?.x ?? 0).toBeLessThan((panned?.x ?? 0) - 60);
  });
});
