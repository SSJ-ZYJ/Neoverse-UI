import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`Badge blurs real backdrop pixels with a shared filter / ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/frame?theme=${theme}&lang=zh#status-feedback`);
    const row = page.locator('#status-feedback-badge [data-specimen-label="变体"]');
    await expect(row).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await row.screenshot({ path: testInfo.outputPath(`badge-frost-${theme}.png`) });
    const badges = row.locator('.ui-badge');
    for (const badge of await badges.all()) {
      const optics = await badge.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          filter: style.backdropFilter,
          blur: style.getPropertyValue('--neoverse-material-glass-subtle-blur').trim(),
        };
      });
      expect(optics.filter).toContain(`blur(${optics.blur})`);
    }

    await badges.evaluateAll((elements) => {
      const stage = document.createElement('div');
      stage.dataset.badgeBlurStage = '';
      stage.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-start;gap:12px;padding:32px 24px;background:repeating-linear-gradient(90deg,#fff 0 4px,#000 4px 8px)';
      for (const element of elements) {
        const label = element.querySelector<HTMLElement>('.ui-badge__label');
        if (label) label.style.visibility = 'hidden';
        stage.append(element);
      }
      document.body.append(stage);
    });
    const samples = page.locator('[data-badge-blur-stage] .ui-badge');
    const ranges = async () => {
      const boxes = await samples.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x + 12, y: rect.y + rect.height / 2, width: rect.width - 24 };
        }),
      );
      const screenshot = await page.screenshot();
      return page.evaluate(
        async ({ data, boxes }) => {
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
          return boxes.map(({ x, y, width }) => {
            const row = context.getImageData(
              Math.round(x * devicePixelRatio),
              Math.round(y * devicePixelRatio),
              Math.floor(width * devicePixelRatio),
              1,
            ).data;
            const values = Array.from({ length: row.length / 4 }, (_, i) => row[i * 4] ?? 0);
            return Math.max(...values) - Math.min(...values);
          });
        },
        { data: screenshot.toString('base64'), boxes },
      );
    };
    const blurred = await ranges();
    await samples.evaluateAll((elements) => {
      for (const element of elements) {
        (element as HTMLElement).style.setProperty('--neoverse-badge-backdrop-filter', 'none');
      }
    });
    const sharp = await ranges();
    for (let index = 0; index < 5; index += 1) {
      expect(
        blurred[index],
        'background stripes must visibly soften inside every Badge',
      ).toBeLessThan(20);
      expect(
        sharp[index],
        'removing the shared filter must restore sharp backdrop detail',
      ).toBeGreaterThan(180);
    }

    await samples.evaluateAll((elements) => {
      for (const element of elements) {
        (element as HTMLElement).style.removeProperty('--neoverse-badge-backdrop-filter');
      }
    });
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    for (const badge of await samples.all()) {
      await expect(badge).toHaveCSS('backdrop-filter', 'none');
      const alpha = await badge.evaluate((element) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing color context');
        context.fillStyle = getComputedStyle(element).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return context.getImageData(0, 0, 1, 1).data[3];
      });
      expect(alpha).toBe(255);
    }
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`Badge variants retain equal geometry and optical weight / ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/frame?theme=${theme}&lang=zh#status-feedback`);
    const variants = page.locator('#status-feedback-badge [data-specimen-label="变体"]');
    await expect(variants).toBeVisible();
    const badges = variants.locator('.ui-badge');
    await expect(badges).toHaveCount(5);
    for (const zoom of [1, 1.5, 2]) {
      await variants.evaluate((element, value) => {
        (element as HTMLElement).style.zoom = String(value);
      }, zoom);
      const metrics = await badges.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Missing color context');
          const alpha = (color: string) => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            return context.getImageData(0, 0, 1, 1).data[3];
          };
          return {
            label: element.textContent,
            width: rect.width,
            height: rect.height,
            fontSize: style.fontSize,
            backgroundAlpha: alpha(style.backgroundColor),
            borderAlpha: alpha(style.borderTopColor),
          };
        }),
      );
      await testInfo.attach(`geometry-${theme}-${zoom}`, {
        body: JSON.stringify(metrics, null, 2),
        contentType: 'application/json',
      });
      await variants.screenshot({ path: testInfo.outputPath(`variants-${theme}-${zoom}.png`) });
      expect(new Set(metrics.map(({ width }) => width)).size).toBe(1);
      expect(new Set(metrics.map(({ height }) => height)).size).toBe(1);
      expect(new Set(metrics.map(({ fontSize }) => fontSize)).size).toBe(1);
      expect(metrics.map(({ backgroundAlpha }) => backgroundAlpha)).toEqual([26, 26, 26, 26, 26]);
      expect(new Set(metrics.map(({ borderAlpha }) => borderAlpha)).size).toBe(1);
    }
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`Badge shares semantic tint and status ink / ${theme}`, async ({ page }, testInfo) => {
    await page.goto(`/frame?theme=${theme}&lang=zh#status-feedback`);
    const section = page.locator('#status-feedback-badge');
    await expect(section).toBeVisible();
    await section.screenshot({ path: testInfo.outputPath(`badge-${theme}.png`) });

    for (const variant of ['info', 'success', 'warning', 'danger']) {
      const badge = section.locator(`.ui-badge--${variant}`).first();
      const colors = await badge.evaluate((element, status) => {
        const style = getComputedStyle(element);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing color context');
        const rgba = (color: string) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data];
        };
        const ink = style.getPropertyValue(`--neoverse-effect-label-${status}-foreground`);
        return {
          background: rgba(style.backgroundColor),
          foreground: rgba(style.color),
          expectedInk: rgba(ink),
          status: rgba(style.getPropertyValue(`--neoverse-color-status-${status}`)),
        };
      }, variant);
      expect(colors.background[3], `${variant} uses the same quiet tint in both themes`).toBe(26);
      expect(colors.foreground, `${variant} uses semantic status ink`).toEqual(colors.expectedInk);
      if (theme === 'light') {
        const channels = colors.foreground.slice(0, 3);
        const peak = Math.max(...channels);
        expect(
          peak,
          `${variant} uses bright midtone ink instead of a deep shade`,
        ).toBeGreaterThanOrEqual(160);
        expect(
          peak - Math.min(...channels),
          `${variant} retains vivid chroma`,
        ).toBeGreaterThanOrEqual(120);
      }
      for (let channel = 0; channel < 3; channel += 1) {
        // Canvas unpremultiplication can round translucent channels by a few units.
        expect(
          Math.abs((colors.background[channel] ?? 0) - (colors.status[channel] ?? 0)),
        ).toBeLessThanOrEqual(5);
      }
      await badge.evaluate((element, status) => {
        (element as HTMLElement).style.setProperty(
          `--neoverse-badge-${status}-foreground`,
          'rgb(105 55 140)',
        );
      }, variant);
      await expect(badge).toHaveCSS('color', 'rgb(105, 55, 140)');
    }
  });
}

test('Badge follows explicit and system theme changes and semantic palette overrides', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=zh#status-feedback');
  const badge = page.locator('#status-feedback-badge .ui-badge--info').first();
  await expect(badge).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--neoverse-color-status-info', 'rgb(120 90 180)');
    document.documentElement.style.setProperty('--neoverse-color-blue-600', 'rgb(50 30 70)');
  });
  await expect(badge).toHaveCSS('color', 'rgb(50, 30, 70)');

  for (const theme of ['dark', 'light', 'system'] as const) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const colorScheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme });
      const dark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
      await expect(badge).toHaveCSS('color', dark ? 'rgb(120, 90, 180)' : 'rgb(50, 30, 70)');
      const background = await badge.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      expect(background).toBe('color(srgb 0.470588 0.352941 0.705882 / 0.1)');
    }
  }
});
