import { expect, expectNoPageOverflow, test } from '../../support/e2e';
import {
  capturePagePreset,
  expectPageDissolveSwap,
  observeStageResize,
} from '../../support/motion';
import { chooseOption, showInspector } from '../../support/playground';

test.describe('motion', () => {
  test('presence fallback profiles rewrite the frames the engine applies', async ({ page }) => {
    // The cross-browser config runs the suite under reduced motion; these
    // assertions read the full-motion arrival tokens, so opt back in first.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
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
    expect(delays.length).toBeGreaterThan(0);
    expect(new Set(delays).size).toBe(1);
    expect(['0ms', '0s']).toContain(delays[0]);

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

  test('disclosure motion expands and collapses the mounted leaf list', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/?theme=light&lang=en&fps=0#foundation-motion-disclosure');
    const specimen = page.locator('#foundation-motion-disclosure');
    const list = specimen.locator('[data-motion-disclosure-list]');
    const toggle = specimen.locator('[data-motion-disclosure-toggle]');
    const animations = () => list.evaluate((element) => element.getAnimations().length);
    await expect(list).not.toHaveAttribute('hidden', '');

    const finalShift = await toggle.evaluate(async (element) => {
      if (!(element instanceof HTMLElement))
        throw new Error('The disclosure toggle must be an element');
      const list = document.getElementById(element.getAttribute('aria-controls') ?? '');
      const hint = list?.parentElement?.querySelector('p');
      element.click();
      await Promise.resolve();
      const animation = list?.getAnimations()[0];
      if (!animation?.effect || !hint) throw new Error('Missing disclosure exit or hint');
      const { endTime } = animation.effect.getComputedTiming();
      if (typeof endTime !== 'number') throw new Error('The disclosure exit must have a timed end');
      animation.pause();
      animation.currentTime = endTime - 0.01;
      const before = hint.getBoundingClientRect().top - element.getBoundingClientRect().top;
      animation.finish();
      await animation.finished;
      const after = hint.getBoundingClientRect().top - element.getBoundingClientRect().top;
      return Math.abs(after - before);
    });
    await expect(list).toHaveAttribute('inert', '');
    expect(finalShift).toBeLessThan(0.5);
    await expect(list).toHaveAttribute('hidden', '');
    await expect(list).toHaveAttribute('aria-hidden', 'true');

    await toggle.click();
    await expect(list).not.toHaveAttribute('hidden', '');
    await expect(list).not.toHaveAttribute('inert', '');
    await expect.poll(animations).toBe(0);
  });

  test('a language switch reflows the Transitions width group without wrapping its copy', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/?lang=en#foundation-motion-playground');
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

for (const path of ['/', '/frame'] as const) {
  test(`the Motion showcase on ${path} switches theme and language without resetting size`, async ({
    page,
  }) => {
    await page.goto(`${path}?theme=light&lang=en&fps=0#foundation-motion-playground`);
    const demo = page.locator('#foundation-motion-playground');
    const root = page.locator('html');
    const sample = demo.locator('[data-motion-size-sample="icon"]');
    await expect(sample).toHaveCSS('width', '28px');
    await demo.locator('[data-motion-size-control]').getByRole('radio', { name: 'Large' }).click();
    await expect(sample).toHaveCSS('width', '44px');

    await demo.locator('[data-motion-theme-reveal]').click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await demo.locator('[data-motion-theme-fade]').click();
    await expect(root).toHaveAttribute('data-theme', 'light');
    await demo.locator('[data-motion-locale]').click();
    await expect(root).toHaveAttribute('lang', 'zh-CN');
    await expect(demo.locator('[data-motion-size-sample="text"]')).toHaveText('示例操作');
    await expect(sample).toHaveCSS('width', '44px');
  });
}

test('translated actions resize and move without wrapping their labels', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?theme=light&lang=zh&fps=0#foundation-motion-playground');
  test.skip(
    !(await page.evaluate(() => typeof document.startViewTransition === 'function')),
    'The engine has no view-transition snapshots',
  );
  const specimen = page.locator('#foundation-motion-playground');
  await expect(specimen.getByRole('heading', { name: '切换动效', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const sample = specimen.locator('[data-motion-size-sample="text"]');
  const icon = specimen.locator('[data-motion-size-sample="icon"]');
  const before = await sample.boundingBox();
  const iconBefore = await icon.boundingBox();
  if (!before || !iconBefore) throw new Error('Size samples are not laid out');

  const [frame] = await Promise.all([
    page.waitForFunction(() => {
      const root = document.documentElement;
      const snapshot = getComputedStyle(root, '::view-transition-old(root)');
      if (root.lang !== 'en' || snapshot.animationName === 'none') return;
      const selector = `#foundation-motion-playground :is(
        [data-motion-theme-reveal], [data-motion-theme-fade], [data-motion-locale],
        [data-motion-size-sample='text']
      ) .ui-button__content`;
      const range = document.createRange();
      const lines = Array.from(document.querySelectorAll(selector), (label) => {
        range.selectNodeContents(label);
        return range.getClientRects().length;
      });
      const text = document.querySelector('[data-motion-size-sample="text"]');
      const icon = document.querySelector('[data-motion-size-sample="icon"]');
      return {
        lines,
        width: text?.getBoundingClientRect().width,
        iconX: icon?.getBoundingClientRect().x,
      };
    }),
    specimen.locator('[data-motion-locale]').press('Enter'),
  ]);

  const during = await frame.jsonValue();
  if (!during) throw new Error('Localized size transition did not start');
  await expect.poll(() => sample.evaluate((element) => element.getAnimations().length)).toBe(0);
  const after = await sample.boundingBox();
  const iconAfter = await icon.boundingBox();
  if (!after || !iconAfter) throw new Error('Translated size samples are not laid out');
  expect(during.lines).toEqual([1, 1, 1, 1]);
  expect(during.width).toBeGreaterThanOrEqual(before.width - 1);
  expect(during.width).toBeLessThan(after.width - 1);
  expect(during.iconX).toBeLessThan(iconAfter.x - 1);
  expect(iconAfter.x).toBeGreaterThan(iconBefore.x);
  await expect(specimen.getByRole('heading', { name: 'Transitions', exact: true })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('a larger text button keeps its label on one line throughout resize', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?theme=light&lang=en&fps=0#foundation-motion-playground');
  const sample = page.locator('[data-motion-size-sample="text"]');
  const large = page.locator('[data-motion-size-control]').getByRole('radio', { name: 'Large' });
  await expect(sample).toHaveCSS('height', '28px');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const [frame] = await Promise.all([
    page.waitForFunction(
      () => {
        const button = document.querySelector('[data-motion-size-sample="text"]');
        const label = button?.querySelector('.ui-button__content');
        if (!button || !label) return;
        const animation = button
          .getAnimations()
          .find(
            (entry) =>
              entry.effect instanceof KeyframeEffect &&
              entry.effect.getKeyframes().some((keyframe) => 'height' in keyframe),
          );
        if (!animation) return;
        animation.pause();
        animation.currentTime = 24;
        const height = button.getBoundingClientRect().height;
        const range = document.createRange();
        range.selectNodeContents(label);
        const lines = range.getClientRects().length;
        animation.finish();
        return { height, lines };
      },
      undefined,
      { timeout: 5000 },
    ),
    large.press('Enter'),
  ]);

  const during = await frame.jsonValue();
  if (!during) throw new Error('Text size transition did not start');
  expect(during.height).toBeGreaterThan(28);
  expect(during.height).toBeLessThan(44);
  expect(during.lines).toBe(1);
  await expect(sample).toHaveCSS('height', '44px');
});

test('an indicator keeps its label on one line as the status changes', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?theme=light&lang=zh&fps=0#status-feedback-indicator');
  const inspector = await showInspector(page, testInfo.project.name === 'mobile');
  const selector = '#status-feedback-indicator .ui-status-indicator';
  const label = page.locator(`${selector} .ui-status-indicator__label`);
  await expect(label).toHaveText('空闲');

  const [frame] = await Promise.all([
    page.waitForFunction((target) => {
      const indicator = document.querySelector(target);
      if (!indicator) return;
      const label = indicator.querySelector('.ui-status-indicator__label');
      if (label?.textContent !== '性能下降') return;
      const resize = indicator
        .getAnimations()
        .find(
          ({ effect }) =>
            effect instanceof KeyframeEffect &&
            effect.getKeyframes().some((frame) => 'width' in frame),
        );
      if (!resize) return;
      resize.pause();
      resize.currentTime = 0;
      const range = document.createRange();
      range.selectNodeContents(label);
      const lines = range.getClientRects().length;
      resize.finish();
      return { lines };
    }, selector),
    chooseOption(inspector, 'status', '警告'),
  ]);

  expect(await frame.jsonValue()).toEqual({ lines: 1 });
  await expect(label).toHaveText('性能下降');
});

test('theme reveal stays clickable and reverses from its current edge', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?theme=light&lang=en&fps=0#foundation-motion-playground');
  test.skip(
    !(await page.evaluate(
      () =>
        typeof document.startViewTransition === 'function' &&
        typeof CSS.registerProperty === 'function',
    )),
    'The engine has no animated snapshot mask',
  );
  const reveal = page.locator('[data-motion-theme-reveal]');
  const large = page.locator('[data-motion-size-control]').getByRole('radio', { name: 'Large' });
  await reveal.click();
  await page.waitForFunction(() => {
    const animation = document
      .getAnimations()
      .find((entry) => entry instanceof CSSAnimation && entry.animationName === 'nv-theme-reveal');
    if (!animation) return false;
    animation.pause();
    animation.currentTime = 320;
    return true;
  });
  // Click the actual control after scrolling/layout settles; the native
  // snapshot must not intercept it while the animation is paused.
  await large.click();
  await expect(large).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const first = await page.evaluateHandle(() => {
    const animation = document
      .getAnimations()
      .find((entry) => entry instanceof CSSAnimation && entry.animationName === 'nv-theme-reveal');
    if (!animation) throw new Error('First reveal was not captured');
    animation.currentTime = 320;
    return animation;
  });
  // Step the JS playback clock, not the browser-owned snapshot animation.
  // A slow software compositor can otherwise consume the whole reversal
  // before the first sample even though it continued from the correct edge.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  const clickReveal = async () => {
    const box = await reveal.boundingBox();
    if (!box) throw new Error('Reveal control is not laid out');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  const playback = async () => {
    const before = await first.evaluate((animation) => Number(animation.currentTime));
    await page.clock.runFor(48);
    return first.evaluate(
      (animation, before) => ({
        active: document.getAnimations().includes(animation),
        before,
        time: Number(animation.currentTime),
      }),
      before,
    );
  };
  await clickReveal();
  const reversing = await playback();
  expect(reversing.active).toBe(true);
  expect(reversing.time).toBeLessThan(reversing.before);
  // The existing effect must continue from the paused edge, not restart at zero.
  expect(reversing.time).toBeGreaterThan(0);
  expect(reversing.time).toBeLessThanOrEqual(320);
  await clickReveal();
  const advancing = await playback();
  expect(advancing.active).toBe(true);
  expect(advancing.time).toBeGreaterThan(advancing.before);
  await clickReveal();
  const returning = await playback();
  expect(returning.active).toBe(true);
  expect(returning.time).toBeLessThan(returning.before);
  await page.clock.runFor(1000);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-appearance-live');
  await expect(page.locator('[data-motion-size-sample="icon"]')).toHaveCSS('width', '44px');
});

test('reversing from the toolbar does not replay Glass colors outside the reveal', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1474, height: 916 });
  await page.goto('/?theme=light&lang=zh&fps=0#foundation-motion-playground');
  test.skip(
    !(await page.evaluate(
      () =>
        typeof document.startViewTransition === 'function' &&
        typeof CSS.registerProperty === 'function',
    )),
    'The engine has no animated snapshot mask',
  );
  await page.getByRole('radio', { name: '光学', exact: true }).click();
  const theme = page.locator('[data-playground-theme-control="segments"]');
  const panel = page.locator('#design-lab-inspector');
  const settled = await panel.evaluate((element) => getComputedStyle(element).backgroundColor);

  await theme.getByRole('radio', { name: '深色', exact: true }).click();
  await page.waitForFunction(() => {
    const reveal = document
      .getAnimations()
      .find((entry) => entry instanceof CSSAnimation && entry.animationName === 'nv-theme-reveal');
    if (!reveal) return false;
    reveal.pause();
    reveal.currentTime = 160;
    return true;
  });

  const [firstLightFrame] = await Promise.all([
    page.waitForFunction(() => {
      const panel = document.getElementById('design-lab-inspector');
      if (!panel || document.documentElement.dataset.theme !== 'light') return false;
      return getComputedStyle(panel).backgroundColor;
    }),
    theme.getByRole('radio', { name: '浅色', exact: true }).click(),
  ]);
  expect(await firstLightFrame.jsonValue()).toBe(settled);
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-appearance-live');
});

test('the theme thumb blends into its pressed tint when reversing a reveal', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.use.hasTouch === true, 'The compact toolbar has no theme thumb');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?theme=light&lang=en&fps=0');
  test.skip(
    !(await page.evaluate(() => typeof document.startViewTransition === 'function')),
    'The engine has no view-transition snapshots',
  );
  const theme = page.locator('[data-playground-theme-control="segments"]');
  const light = theme.getByRole('radio', { name: 'Light', exact: true });
  const thumb = theme.locator('.ui-segmented-control__slider');
  await theme.getByRole('radio', { name: 'Dark', exact: true }).press('Space');
  await page.waitForFunction(() => {
    const reveal = document
      .getAnimations()
      .find((entry) => entry instanceof CSSAnimation && entry.animationName === 'nv-theme-reveal');
    if (!reveal) return false;
    reveal.pause();
    reveal.currentTime = 320;
    return true;
  });

  await light.hover();
  const before = await thumb.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.mouse.down();
  await expect(thumb).toHaveAttribute('data-pressed', '');
  const pressed = await thumb.evaluate((element) => {
    const fill = () => getComputedStyle(element).backgroundColor;
    const transition = element
      .getAnimations()
      .find(
        (entry) =>
          entry instanceof CSSTransition && entry.transitionProperty === 'background-color',
      );
    if (!transition?.effect) return { start: fill(), middle: fill(), end: fill() };
    const { endTime } = transition.effect.getComputedTiming();
    if (typeof endTime !== 'number') throw new Error('The pressed tint must have a timed end');
    transition.pause();
    transition.currentTime = 0;
    const start = fill();
    transition.currentTime = endTime / 2;
    const middle = fill();
    transition.currentTime = endTime;
    const end = fill();
    transition.play();
    return { start, middle, end };
  });
  await page.mouse.up();
  await expect(light).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(pressed.start).toBe(before);
  expect(pressed.middle).not.toBe(pressed.start);
  expect(pressed.middle).not.toBe(pressed.end);
});

const pagePresets = ['fade', 'glide', 'slide', 'push', 'depth', 'veil', 'curtain', 'iris', 'morph'];

test('page transitions switch presets, directions, and pages without overflowing', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page');
  const specimen = page.locator('#foundation-motion-page');
  const stage = specimen.locator('[data-motion-page-stage]');

  await expect(stage).toContainText('Aurora Glass Surfaces');
  await expect(stage).toContainText('Edge tracking active');
  for (const variant of pagePresets) {
    await expect(specimen.locator(`[data-motion-page-variant="${variant}"]`)).toBeVisible();
  }

  await specimen.locator('[data-motion-page-variant="push"]').click();
  await expect(stage).toContainText('Spatial Motion Cadence');
  await expect(specimen).toContainText("variant: 'push'");
  await expect(specimen.locator('[data-motion-page-direction-hint]')).toHaveAttribute('hidden', '');

  await specimen.locator('[data-motion-page-next]').click();
  await expect(stage).toContainText('Interruptible Choreography');

  await specimen.locator('[data-motion-page-prev]').click();
  await expect(stage).toContainText('Spatial Motion Cadence');
  await expect(specimen).toContainText("direction: 'backward'");

  await specimen.locator('[data-motion-page-variant="morph"]').click();
  await expect(specimen.locator('[data-motion-page-direction-hint]')).not.toHaveAttribute(
    'hidden',
    '',
  );

  await expectNoPageOverflow(page);
});

test('scoped transitions, shared backdrops, and morph choreography preserve contracts and clean up', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page');
  test.skip(
    !(await page.evaluate(() => typeof document.startViewTransition === 'function')),
    'The engine has no view-transition snapshots',
  );

  const specimen = page.locator('#foundation-motion-page');
  const stage = specimen.locator('[data-motion-page-stage]');

  const capturePreset = (variant: string) => capturePagePreset(page, specimen, variant);

  const push = await capturePreset('push');
  expect(push).toMatchObject({
    scope: 'region',
    direction: 'forward',
    backgroundMode: 'surface',
    animationName: 'nv-page-push-enter',
    stageTargeted: true,
    contentTargeted: false,
  });

  const glide = await capturePreset('glide');
  expect(glide).toMatchObject({
    animationName: 'nv-page-glide-in',
    backgroundMode: 'shared',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    contentTargeted: true,
    stageTargeted: false,
  });
  expect(glide?.delay).toBeGreaterThan(0);

  const curtain = await capturePreset('curtain');
  expect(curtain?.backgroundMode).toBe('surface');
  expect(curtain?.stageTargeted).toBe(true);
  expect(curtain?.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(curtain?.maskImage).toContain('linear-gradient');

  await specimen
    .locator('[data-motion-page-background]')
    .getByRole('radio', { name: 'Distinct', exact: true })
    .click();
  expect(await capturePreset('glide')).toMatchObject({
    backgroundMode: 'surface',
    stageTargeted: true,
  });

  await specimen
    .locator('[data-motion-page-background]')
    .getByRole('radio', { name: 'Same canvas', exact: true })
    .click();
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-view-transitioning');
  const resize = await observeStageResize(stage);
  const morph = await capturePreset('morph');
  expect(morph?.backgroundMode).toBe('shared');
  expect(morph?.contentTargeted).toBe(true);
  expect(morph?.figureName).toBe('nv-morph-stage-figure');
  expect(morph?.morphGroupDuration).toBeGreaterThan(0);
  await expect.poll(async () => (await resize.jsonValue()).heightDelta).toBeGreaterThan(40);
  await resize.dispose();

  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-view-transitioning');
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-page-transition');
  await expect(stage).not.toHaveAttribute('data-neoverse-page-target');
  await expect(specimen.locator('[data-motion-page-figure]')).toHaveCSS(
    'view-transition-name',
    'none',
  );
});

test('page transitions honor reduced motion immediately across every preset', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page');
  const specimen = page.locator('#foundation-motion-page');
  const stage = specimen.locator('[data-motion-page-stage]');

  await specimen.locator('[data-motion-page-variant="veil"]').click();
  await expect(stage).toContainText('Spatial Motion Cadence');
  await specimen.locator('[data-motion-page-variant="morph"]').click();
  await expect(stage).toContainText('Interruptible Choreography');
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-view-transitioning');
  await expect(stage).not.toHaveAttribute('data-neoverse-page-target');
});

test('page dissolve swaps the specimen and clears the particle layer', async ({ page }) => {
  await expectPageDissolveSwap(page);
});

test('page dissolve honors reduced motion without keeping a particle layer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectPageDissolveSwap(page);
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
  await expect(presence).toHaveJSProperty('tagName', 'ARTICLE');
});
