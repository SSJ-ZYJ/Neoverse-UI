import { expect, type Locator, test } from '@playwright/test';

const backgroundAlpha = (thumb: Locator) =>
  thumb.evaluate((element) => {
    const color = getComputedStyle(element).backgroundColor;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('Cannot inspect scrollbar colour');
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return context.getImageData(0, 0, 1, 1).data[3] ?? 0;
  });

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: document scrollbar stays painted during hover and a stationary drag`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Hover requires a fine pointer.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#scrollbar-component`, {
      waitUntil: 'domcontentloaded',
    });
    const track = page.locator('[data-ui-scrollbar-fixture]');
    const thumb = track.locator('.ui-scrollbar__thumb');
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(track).toHaveAttribute('data-visible', 'true');
    expect(await backgroundAlpha(thumb)).toBeGreaterThan(0);
    const bounds = await thumb.boundingBox();
    if (!bounds) throw new Error('The scrollbar thumb is missing');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForTimeout(1400);
    await expect(track).toHaveAttribute('data-visible', 'true');
    expect(await backgroundAlpha(thumb)).toBeGreaterThan(0);
    await page.mouse.down();
    await expect(track).toHaveClass(/ui-scrollbar--dragging/);
    await page.waitForTimeout(1400);
    await expect(track).toHaveAttribute('data-visible', 'true');
    expect(await backgroundAlpha(thumb)).toBeGreaterThan(0);
    await page.mouse.up();
    await page.mouse.move(bounds.x - 32, bounds.y);
    await expect(track).toHaveAttribute('data-visible', 'false');
  });

  test(`${theme}: native immersive thumb keeps its paint and clip in hover and drag`, async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      browserName !== 'chromium' || testInfo.project.name === 'mobile',
      'Chromium mouse scrollbar.',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#scrollbar-component`, {
      waitUntil: 'domcontentloaded',
    });
    const viewport = page.locator('[data-scrollbar-preview-viewport]');
    await viewport.scrollIntoViewIfNeeded();
    const geometry = await viewport.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const size = Number.parseFloat(getComputedStyle(element, '::-webkit-scrollbar').width);
      const style = getComputedStyle(element);
      return {
        size,
        x: rect.right - Number.parseFloat(style.borderRightWidth) - size / 2,
        y:
          rect.top +
          Number.parseFloat(style.borderTopWidth) +
          Math.min((element.clientHeight * (element.clientHeight / element.scrollHeight)) / 2, 30),
      };
    });
    expect(geometry.size).toBeGreaterThan(0);
    await page.mouse.move(0, 0);
    const rest = await page.screenshot();
    await page.mouse.move(geometry.x, geometry.y);
    const hover = await page.screenshot();
    await page.mouse.down();
    const active = await page.screenshot();
    await page.mouse.up();
    await page.addStyleTag({
      content:
        '[data-scrollbar-preview-viewport]::-webkit-scrollbar-thumb { background: transparent !important; box-shadow: none !important; }',
    });
    const withoutThumb = await page.screenshot();
    const differences = await page.evaluate(
      async ({ sources, center }) => {
        const decode = async (source: string) => {
          const image = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${source}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot inspect scrollbar pixels');
          context.drawImage(image, 0, 0);
          image.close();
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const [restImage, hoverImage, activeImage, blankImage] = await Promise.all(
          sources.map(decode),
        );
        if (!restImage || !hoverImage || !activeImage || !blankImage) {
          throw new Error('Scrollbar screenshots are missing');
        }
        const peak = (first: ImageData, second: ImageData) => {
          let difference = 0;
          for (let y = Math.round(center.y) - 3; y <= Math.round(center.y) + 3; y++) {
            for (let x = Math.round(center.x) - 5; x <= Math.round(center.x) + 5; x++) {
              for (let channel = 0; channel < 3; channel++) {
                const offset = (y * first.width + x) * 4 + channel;
                difference = Math.max(
                  difference,
                  Math.abs((first.data[offset] ?? 0) - (second.data[offset] ?? 0)),
                );
              }
            }
          }
          return difference;
        };
        const paintedWidth = (image: ImageData) => {
          let width = 0;
          const half = Math.ceil(center.size / 2) + 2;
          for (let x = Math.round(center.x) - half; x <= Math.round(center.x) + half; x++) {
            let difference = 0;
            for (let y = Math.round(center.y) - 3; y <= Math.round(center.y) + 3; y++) {
              for (let channel = 0; channel < 3; channel++) {
                const offset = (y * image.width + x) * 4 + channel;
                difference = Math.max(
                  difference,
                  Math.abs((image.data[offset] ?? 0) - (blankImage.data[offset] ?? 0)),
                );
              }
            }
            if (difference > 2) width += 1;
          }
          return width;
        };
        return {
          resting: peak(restImage, blankImage),
          hovered: peak(hoverImage, blankImage),
          dragging: peak(activeImage, blankImage),
          hoverChange: peak(restImage, hoverImage),
          dragChange: peak(hoverImage, activeImage),
          hoverWidth: paintedWidth(hoverImage),
          dragWidth: paintedWidth(activeImage),
        };
      },
      {
        sources: [rest, hover, active, withoutThumb].map((image) => image.toString('base64')),
        center: geometry,
      },
    );
    expect(differences.resting).toBeGreaterThan(2);
    expect(differences.hovered).toBeGreaterThan(2);
    expect(differences.dragging).toBeGreaterThan(2);
    expect(differences.hoverChange).toBeGreaterThan(2);
    expect(differences.dragChange).toBeGreaterThan(1);
    expect(differences.hoverWidth).toBeLessThan(geometry.size);
    expect(differences.dragWidth).toBeLessThan(geometry.size);
  });
}
