import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`tooltip sampling root stays clear in every preview context / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#status-feedback-tooltip`);
    for (const context of ['gradient', 'neutral', 'reduced']) {
      for (const variant of ['neutral', 'accent']) {
        const tooltip = page.locator(
          `#status-feedback-tooltip [data-qa-context="${context}"] .ui-tooltip-surface--${variant}`,
        );
        await expect(tooltip).toBeVisible();
        // A retained blur(0px) on the owner creates a backdrop root that
        // prevents the sampled plate from seeing the background behind it.
        await expect(tooltip).toHaveCSS('filter', 'none');
        await expect(tooltip).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        const layers = await tooltip.evaluate((element) => {
          const plate = getComputedStyle(element, '::before');
          const pointer = getComputedStyle(element, '::after');
          return {
            filter: plate.backdropFilter,
            display: plate.display,
            background: plate.backgroundColor,
            mask: plate.maskImage,
            maskPosition: plate.maskPosition,
            radius: Number.parseFloat(getComputedStyle(element).borderTopRightRadius),
            pointerFill: pointer.backgroundColor,
          };
        });
        expect(layers.display, `${context} / ${variant}`).toBe('block');
        expect(
          layers.mask,
          'Backdrop output must be masked to the body and pointer silhouette',
        ).not.toBe('none');
        const fullWidthStrip = layers.maskPosition.split(',')[1]?.trim().split(/\s+/);
        expect(
          Number.parseFloat(fullWidthStrip?.[1] ?? ''),
          'The full-width middle strip must start below the corner radius to cover both straight sides',
        ).toBe(layers.radius);
        expect(layers.pointerFill).toBe('rgba(0, 0, 0, 0)');
        if (context === 'reduced') {
          expect(layers.filter).toBe('none');
          expect(layers.background).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
        } else expect(layers.filter).toContain('blur(12px)');
      }
    }
  });
}

for (const theme of ['light', 'dark']) {
  for (const variant of ['neutral', 'accent']) {
    test(`tooltip body and pointer share one continuous contour / ${theme} / ${variant}`, async ({
      page,
    }, testInfo) => {
      await page.goto(`/?theme=${theme}&lang=en#status-feedback-tooltip`);
      const source = page
        .locator(`#status-feedback-tooltip .ui-tooltip-surface--${variant}`)
        .first();
      await expect(source).toBeVisible();
      await expect(
        page.locator(
          '#status-feedback-tooltip [data-qa-context="gradient"] [data-material-legend]',
        ),
      ).toContainText('12px / 15%');
      if (variant === 'neutral' && testInfo.project.name === 'desktop') {
        await page.locator('#status-feedback-tooltip [data-qa-context="gradient"]').screenshot({
          path: testInfo.outputPath('tooltip-gradient-context.png'),
          animations: 'disabled',
        });
      }
      await source.evaluate((element, variant) => {
        const stage = document.createElement('div');
        stage.dataset.tooltipContourProbe = '';
        stage.style.cssText = `position:fixed;inset:0;width:${Math.min(innerWidth, 600)}px;height:260px;background:rgb(38 58 76);`;
        const width = innerWidth < 600 ? 120 : 220;
        (element as HTMLElement).style.cssText =
          `position:absolute;left:32px;top:24px;width:${width}px;height:52px;box-sizing:border-box;zoom:2;animation:none;--ui-tooltip-arrow-left:${variant === 'accent' ? '64%' : '50%'};`;
        element.textContent = '';
        stage.append(element);
        const canvases = [...document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')];
        document.body.replaceChildren(stage, ...canvases);
        window.dispatchEvent(new Event('resize'));
      }, variant);
      const stage = page.locator('[data-tooltip-contour-probe]');
      const tooltip = stage.locator('.ui-tooltip-surface');
      const anchor = await tooltip.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const arrow = getComputedStyle(element, '::after');
        return {
          x: Math.round(
            rect.x +
              (Number.parseFloat(arrow.left) * rect.width) / (element as HTMLElement).offsetWidth,
          ),
          y: Math.round(rect.bottom),
        };
      });
      const shot = await stage.screenshot({
        path: testInfo.outputPath('tooltip-contour.png'),
        animations: 'disabled',
      });
      const samples = await page.evaluate(
        async ({ data, anchor }) => {
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${data}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Missing pixel context');
          context.drawImage(bitmap, 0, 0);
          const pixel = (y: number) =>
            [...context.getImageData(anchor.x, y, 1, 1).data].slice(0, 3);
          const result = {
            body: pixel(anchor.y - 4),
            join: pixel(anchor.y),
            arrow: pixel(anchor.y + 3),
          };
          bitmap.close();
          return result;
        },
        { data: shot.toString('base64'), anchor },
      );
      for (const sample of [samples.join, samples.arrow]) {
        expect(
          sample.every((channel, index) => Math.abs(channel - (samples.body[index] ?? 0)) <= 2),
          JSON.stringify(samples),
        ).toBe(true);
      }
      const planeFilter = await tooltip.evaluate(
        (element) => getComputedStyle(element, '::before').backdropFilter,
      );
      expect(planeFilter).toContain('blur(12px)');
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
      });
      const readFallback = () =>
        tooltip.evaluate((element) => {
          const style = getComputedStyle(element, '::before');
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Missing pixel context');
          context.fillStyle = style.backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return { filter: style.backdropFilter, alpha: context.getImageData(0, 0, 1, 1).data[3] };
        });
      expect(await readFallback()).toEqual({ filter: 'none', alpha: 255 });
      await session.send('Emulation.setEmulatedMedia', { features: [] });
      await stage.evaluate((element) =>
        element.classList.add('playground-reduced-transparency-preview'),
      );
      expect(await readFallback()).toEqual({ filter: 'none', alpha: 255 });
    });
  }
}
