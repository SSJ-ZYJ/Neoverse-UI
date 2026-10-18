import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`tooltip keeps its backdrop sampling root clear throughout entrance / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/?theme=${theme}&lang=en#status-feedback-tooltip`);
    const tooltip = page.locator('#status-feedback-tooltip .ui-tooltip-surface--accent').first();
    await expect(tooltip).toBeVisible();
    const frames = await tooltip.evaluate(async (source) => {
      const element = source.cloneNode(true) as HTMLElement;
      source.parentElement?.append(element);
      const animations = element.getAnimations({ subtree: true });
      for (const animation of animations) animation.pause();
      await Promise.all(animations.map((animation) => animation.ready));
      const frames = [0, 40, 100, 180, 239].map((time) => {
        for (const animation of animations) animation.currentTime = time;
        const root = getComputedStyle(element);
        return {
          time,
          filter: root.filter,
          opacity: root.opacity,
          plateOpacity: getComputedStyle(element, '::before').opacity,
          backdrop: getComputedStyle(element, '::before').backdropFilter,
        };
      });
      element.remove();
      return frames;
    });
    for (const frame of frames) {
      expect(frame.filter, `sampling root filter at ${frame.time}ms`).toBe('none');
      expect(frame.opacity, `sampling root opacity at ${frame.time}ms`).toBe('1');
      expect(frame.plateOpacity, `blur plate opacity at ${frame.time}ms`).toBe('1');
      expect(frame.backdrop).toContain('blur(12px)');
    }
  });
}

test('tooltip blurs real backdrop pixels before its entrance finishes', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?theme=dark&lang=en#status-feedback-tooltip');
  // This text-free pixel probe does not depend on the specimen webfonts.
  await page.addStyleTag({ content: '* { font-family: Arial, sans-serif !important; }' });
  const source = page.locator('#status-feedback-tooltip .ui-tooltip-surface--accent').first();
  await expect(source).toBeVisible();
  await source.evaluate(async (source) => {
    const stage = document.createElement('div');
    stage.dataset.tooltipEntranceProbe = '';
    stage.style.cssText =
      'position:fixed;inset:20px auto auto 20px;width:300px;height:140px;z-index:2147483647;background:repeating-linear-gradient(90deg,#000 0 3px,#fff 3px 6px)';
    const tooltip = source.cloneNode(true) as HTMLElement;
    tooltip.textContent = '';
    tooltip.style.cssText =
      'position:absolute;left:20px;top:20px;width:260px;height:90px;box-sizing:border-box';
    stage.append(tooltip);
    document.body.append(stage);
    const animations = tooltip.getAnimations({ subtree: true });
    for (const animation of animations) animation.pause();
    await Promise.all(animations.map((animation) => animation.ready));
    for (const animation of animations) animation.currentTime = 100;
  });
  const stage = page.locator('[data-tooltip-entrance-probe]');
  const shot = await stage.screenshot({ path: testInfo.outputPath('tooltip-mid-entrance.png') });
  const contrast = await page.evaluate(async (data) => {
    const bitmap = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${data}`)).blob(),
    );
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Missing pixel context');
    context.drawImage(bitmap, 0, 0);
    const row = context.getImageData(70, 60, 160, 1).data;
    const values = Array.from(
      { length: 160 },
      (_, index) =>
        ((row[index * 4] ?? 0) + (row[index * 4 + 1] ?? 0) + (row[index * 4 + 2] ?? 0)) / 3,
    );
    bitmap.close();
    return Math.max(...values) - Math.min(...values);
  }, shot.toString('base64'));
  expect(contrast, 'High contrast stripes must already be fully blurred at 100ms').toBeLessThan(8);
});

test('Neoverse Pulse uses the shared entrance fix with real contribution data', async ({
  page,
}, testInfo) => {
  const consumerUrl = process.env.NEOVERSE_CONSUMER_URL;
  test.skip(!consumerUrl, 'Set NEOVERSE_CONSUMER_URL to verify the real consumer.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`${consumerUrl}/pulse`);
  const days = page.getByRole('button', { name: /\d.*(?:贡献|contributions)/i });
  const day = testInfo.project.name === 'mobile' ? days.last() : days.nth(296);
  await expect(day).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(requestAnimationFrame)));
  if (testInfo.project.name === 'mobile') await day.focus();
  else await day.hover();
  const tooltip = page.locator('.contribution-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('position', 'fixed');
  expect(await tooltip.evaluate((element) => element.parentElement === document.body)).toBe(true);
  const [targetBox, tooltipBox] = await Promise.all([day.boundingBox(), tooltip.boundingBox()]);
  if (!targetBox || !tooltipBox) throw new Error('Tooltip or trigger geometry is missing');
  expect(tooltipBox.y + tooltipBox.height).toBeLessThan(targetBox.y);
  expect(targetBox.y - tooltipBox.y - tooltipBox.height).toBeLessThan(24);
  await expect(tooltip.locator('.ui-tooltip-surface__content')).toBeVisible();
  const frame = await tooltip.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    for (const animation of animations) animation.pause();
    await Promise.all(animations.map((animation) => animation.ready));
    for (const animation of animations) animation.currentTime = 100;
    return {
      filter: getComputedStyle(element).filter,
      opacity: getComputedStyle(element).opacity,
      backdrop: getComputedStyle(element, '::before').backdropFilter,
    };
  });
  expect(frame.filter).toBe('none');
  expect(frame.opacity).toBe('1');
  expect(frame.backdrop).toContain('blur(12px)');
  await page.screenshot({ path: testInfo.outputPath('neoverse-pulse-tooltip.png') });
  const blurred = await tooltip.screenshot();
  await page.addStyleTag({
    content: `.contribution-tooltip::before { backdrop-filter: ${frame.backdrop.replace(/blur\([^)]*\)/g, 'blur(0px)')} !important; }`,
  });
  const clear = await tooltip.screenshot({
    path: testInfo.outputPath('neoverse-pulse-tooltip-no-blur.png'),
  });
  const pixels = await page.evaluate(
    async ({ blurred, clear }) => {
      const read = async (data: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing pixel context');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return {
          data: context.getImageData(0, 0, canvas.width, canvas.height).data,
          width: canvas.width,
          height: canvas.height,
        };
      };
      const a = await read(blurred);
      const b = await read(clear);
      const energy = (image: typeof a) => {
        let total = 0;
        for (const y of [4, 5, image.height - 5, image.height - 6]) {
          for (let x = 20; x < image.width - 21; x += 1) {
            for (let channel = 0; channel < 3; channel += 1) {
              const index = (y * image.width + x) * 4 + channel;
              total += Math.abs((image.data[index] ?? 0) - (image.data[index + 4] ?? 0));
            }
          }
        }
        return total;
      };
      return { blurredEnergy: energy(a), clearEnergy: energy(b) };
    },
    { blurred: blurred.toString('base64'), clear: clear.toString('base64') },
  );
  expect(pixels.blurredEnergy, JSON.stringify(pixels)).toBeLessThan(pixels.clearEnergy * 0.5);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Viewport is missing');
  await page.setViewportSize({ ...viewport, width: viewport.width - 16 });
  await expect(tooltip).toHaveCount(0);
});
