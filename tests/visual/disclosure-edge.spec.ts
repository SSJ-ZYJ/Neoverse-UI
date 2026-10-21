import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const mode of ['explicit', 'system'] as const) {
    test(`disclosure retains a glass edge without a dark outline / ${theme} / ${mode}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
      // Material edges do not depend on CDN font loading.
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'font' ? route.abort() : route.continue(),
      );
      await page.goto(
        `${mode === 'system' ? '/' : '/frame'}?theme=${mode === 'system' ? 'system' : theme}&lang=zh#data-display-disclosure`,
        {
          waitUntil: 'domcontentloaded',
        },
      );
      const disclosure = page.locator('[data-data-display-disclosure="closed"]');
      await expect(disclosure).toBeVisible();
      const summary = disclosure.locator('summary');
      const checkEdge = async (state: string) => {
        const edge = await disclosure.evaluate((element, state) => {
          const style = getComputedStyle(element);
          const shadows: string[] = [];
          let depth = 0;
          let start = 0;
          for (let index = 0; index < style.boxShadow.length; index += 1) {
            const char = style.boxShadow[index];
            if (char === '(') depth += 1;
            if (char === ')') depth -= 1;
            if (char === ',' && depth === 0) {
              shadows.push(style.boxShadow.slice(start, index).trim());
              start = index + 1;
            }
          }
          shadows.push(style.boxShadow.slice(start).trim());
          const context = document.createElement('canvas').getContext('2d');
          if (!context) throw new Error('Missing color probe');
          const darkOutlines = shadows.filter((shadow) => {
            if (!shadow.includes('0px 0px 0px 1px inset')) return false;
            const color = shadow.match(/^(rgba?\([^)]+\)|color\([^)]+\))/)?.[0];
            if (!color) throw new Error(`Cannot read outline color: ${shadow}`);
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
            return Math.max(r, g, b) < 128 && a / 255 > 0.05;
          });
          const glass = document.createElement('span');
          glass.style.boxShadow = `var(--neoverse-surface-inset-edge-${state === 'closed' ? 'rest' : 'active'})`;
          element.append(glass);
          const glassShadow = getComputedStyle(glass).boxShadow;
          glass.remove();
          return {
            darkOutlines,
            glassShadow,
            shadow: style.boxShadow,
            filter: style.backdropFilter,
            background: style.backgroundColor,
          };
        }, state);
        expect(
          edge.darkOutlines,
          `${state} must retain glass lighting instead of a dark stroke`,
        ).toEqual([]);
        expect(edge.shadow).toContain('inset');
        expect(edge.glassShadow).not.toBe('none');
        expect(edge.shadow).toContain(edge.glassShadow);
        if (theme === 'dark' && state === 'closed') {
          expect(edge.shadow).toContain('rgba(219, 234, 254, 0.18) 0px 0px 0px 1px inset');
        }
        expect(edge.filter).toContain('blur(12px)');
        await testInfo.attach(`${state} material`, {
          body: JSON.stringify(edge),
          contentType: 'application/json',
        });
      };
      await checkEdge('closed');
      if (testInfo.project.name === 'desktop') {
        await summary.hover();
        await checkEdge('hover');
        await page.mouse.down();
        await checkEdge('pressed');
        await page.mouse.up();
      } else {
        await summary.click();
      }
      await expect(disclosure).toHaveAttribute('open', '');
      await page.mouse.move(0, 0);
      await checkEdge('open');
      await page.locator('#data-display-disclosure .playground-material-backdrop').screenshot({
        path: testInfo.outputPath(`disclosure-${theme}.png`),
      });
    });
  }
}
