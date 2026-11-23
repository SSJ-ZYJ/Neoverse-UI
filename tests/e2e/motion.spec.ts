import { expect, expectNoPageOverflow, test } from '../support/e2e';

test.describe('motion', () => {
  test('presence specimens render the library badge instead of a local chip', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const specimen = page.locator('[data-motion-presence-specimen="veil"]');

    await expect(specimen).toBeVisible();
    // The specimen must be the real UiBadge, so its status tint, hairline and
    // glass depth follow the library instead of a hand-written pill.
    await expect(specimen).toHaveClass(/ui-badge/);
    await expect(specimen).toHaveClass(/ui-badge--info/);
    await expect(specimen).toHaveAttribute('data-neoverse-motion', 'veil');
  });

  test('presence fallback profiles rewrite the frames the engine applies', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const grid = page.locator('[data-motion-presence-grid]');
    const control = page.locator('[data-motion-presence-fallback]');
    const specimen = grid.locator('[data-motion-presence-specimen="veil"]');
    const frame = (property: string) =>
      specimen.evaluate(
        (node, name) => getComputedStyle(node).getPropertyValue(name).trim(),
        property,
      );
    // Chromium serializes a custom-property number without the leading zero.
    const frameScale = async () => Number.parseFloat(await frame('--neoverse-motion-from-scale'));

    // Full motion keeps the preset's own geometry: veil is a pure blur arrival.
    await expect(grid).not.toHaveAttribute('data-neoverse-motion-fallback');
    expect(await frameScale()).toBe(1);
    expect(await frame('--neoverse-motion-from-filter')).toBe('blur(8px)');

    await control.getByRole('radio', { name: 'No filter' }).click();
    await expect(grid).toHaveAttribute('data-neoverse-motion-fallback', 'no-filter');
    // The blur pass is dropped and the arrival moves to a near scale instead.
    await expect.poll(() => frame('--neoverse-motion-from-filter')).toBe('blur(0px)');
    await expect.poll(frameScale).toBeCloseTo(0.97, 2);

    await control.getByRole('radio', { name: 'Fade only' }).click();
    await expect(grid).toHaveAttribute('data-neoverse-motion-fallback', 'fade-only');
    // An engine without individual transform properties only changes opacity.
    await expect.poll(() => frame('--neoverse-motion-from-translate')).toBe('none');
    await expect.poll(frameScale).toBe(1);

    await control.getByRole('radio', { name: 'Full motion' }).click();
    await expect(grid).not.toHaveAttribute('data-neoverse-motion-fallback');
    await expect.poll(() => frame('--neoverse-motion-from-filter')).toBe('blur(8px)');
  });

  test('presence presets are split into helper and component paths', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const helper = page.locator('[data-motion-presence-path="helper"]');
    const adapter = page.locator('[data-motion-presence-path="adapter"]');

    await expect(helper).toBeVisible();
    await expect(adapter).toBeVisible();
    // The helper path owns every preset; the component path owns only the
    // UiPresence specimen, so the two mechanisms never share a cell.
    await expect(helper.locator('[data-motion-presence-specimen]')).toHaveCount(11);
    await expect(adapter.locator('[data-motion-presence-specimen]')).toHaveCount(0);
    await expect(adapter.locator('[data-motion-presence-adapter]')).toHaveCount(1);
  });

  test('every preset enters at once and replays on its own', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const specimens = page.locator('[data-motion-presence-specimen]');

    // No stagger: every cell carries the same zero enter delay, so all eleven
    // presets arrive together instead of waiting their turn.
    const delays = await specimens.evaluateAll((nodes) =>
      nodes.map((node) =>
        getComputedStyle(node).getPropertyValue('--neoverse-motion-enter-delay').trim(),
      ),
    );
    expect(new Set(delays)).toEqual(new Set(['0ms']));

    const veil = page.locator('[data-motion-presence-specimen="veil"]');
    const rise = page.locator('[data-motion-presence-specimen="rise"]');
    await veil.evaluate((node) => {
      node.dataset.replayProbe = 'veil';
    });
    await rise.evaluate((node) => {
      node.dataset.replayProbe = 'rise';
    });

    await page.locator('[data-motion-presence-replay-specimen="veil"]').click();

    // The replayed cell mounts a fresh node; its neighbour is untouched.
    await expect(veil).not.toHaveAttribute('data-replay-probe', 'veil');
    await expect(rise).toHaveAttribute('data-replay-probe', 'rise');
    await expect(page.locator('[data-motion-presence-replay-specimen]')).toHaveCount(12);
  });

  test('replaying a hidden preset shows it again', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const toggle = page.locator('[data-motion-presence-toggle]');
    const specimen = page.locator('[data-motion-presence-specimen="bloom"]');

    await toggle.click();
    await expect(specimen).toHaveCount(0);

    await page.locator('[data-motion-presence-replay-specimen="bloom"]').click();
    await expect(specimen).toBeVisible();
  });

  test('list reorder moves every item to its new position', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const group = page.locator('[data-motion-presence-group]');
    const items = group.locator('[data-motion-presence-group-item]');

    await expect(group).toBeVisible();
    const original = await items.allTextContents();
    expect(original.length).toBeGreaterThan(1);

    await page.locator('[data-motion-presence-shuffle]').click();
    await expect(items).toHaveText([...original.slice(1), original[0] ?? '']);

    await page.locator('[data-motion-presence-shuffle]').click();
    await expect(items).toHaveText([...original.slice(2), ...original.slice(0, 2)]);
  });

  test('reduced motion keeps the reorder complete and immediate', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/frame?theme=light&lang=en#motion');
    const group = page.locator('[data-motion-presence-group]');
    const items = group.locator('[data-motion-presence-group-item]');
    const original = await items.allTextContents();

    await page.locator('[data-motion-presence-shuffle]').click();
    await expect(items).toHaveText([...original.slice(1), original[0] ?? '']);
  });

  test('replaying the entrance keeps the list content intact', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion');
    const group = page.locator('[data-motion-presence-group]');
    const items = group.locator('[data-motion-presence-group-item]');
    const original = await items.allTextContents();

    await page.locator('[data-motion-presence-replay]').click();
    await expect(items).toHaveText(original);
    for (const item of await items.all()) await expect(item).toBeVisible();
  });

  test('a language switch reflows the width specimen without wrapping its copy', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/?lang=en#motion');
    const stage = page.locator('[data-motion-width-stage]');
    await expect(stage).toBeVisible();
    await stage.scrollIntoViewIfNeeded();
    const targets = stage.locator('[data-motion-width-target]');
    await expect(targets).toHaveCount(3);

    const measure = () =>
      targets.evaluateAll((elements) =>
        elements.map((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        })),
      );
    const before = await measure();

    await page
      .locator('.playground-shell__toolbar')
      .getByRole('radiogroup', { name: 'Language', exact: true })
      .getByRole('radio', { name: '中文', exact: true })
      .check();

    await expect
      .poll(async () => (await measure()).map((box) => Math.round(box.width)).join(','))
      .not.toBe(before.map((box) => Math.round(box.width)).join(','));
    const after = await measure();
    after.forEach((box, index) => {
      expect(box.height).toBeLessThanOrEqual((before[index]?.height ?? 0) + 1);
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expectNoPageOverflow(page);
  });
});

test('page dissolve swaps the specimen and clears the particle layer', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page');
  const trigger = page.locator('[data-motion-page-dissolve]');
  const stage = page.locator('#foundation-motion-page .playground-motion-stage');

  await expect(stage).toContainText('{ dissolveSource }');
  await trigger.click();
  await expect(stage).toContainText('{ particle }');
  await expect(trigger).toBeEnabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-particle-transitioning');
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(0);
});

test('page dissolve honors reduced motion without keeping a particle layer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page');
  const trigger = page.locator('[data-motion-page-dissolve]');
  const stage = page.locator('#foundation-motion-page .playground-motion-stage');

  await expect(stage).toContainText('{ dissolveSource }');
  await trigger.click();
  await expect(stage).toContainText('{ particle }');
  await expect(trigger).toBeEnabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-particle-transitioning');
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(0);
});

test('React presence removes the exited region and returns it on show', async ({ page }) => {
  await page.goto('/react-fixture?theme=light&lang=en');
  const presence = page.locator('[data-react-adapter="UiPresence"]');
  const toggle = page.locator('[data-react-presence-toggle]');

  await expect(presence).toBeVisible();
  await toggle.click();
  await expect(presence).toHaveCount(0);
  await toggle.click();
  await expect(presence).toBeVisible();
});
