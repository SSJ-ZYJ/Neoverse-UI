import { expect, test } from '@playwright/test';

function isTransparent(color: string): boolean {
  if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return true;
  const channels = color.match(/\/\s*([\d.]+)\s*\)?$/);
  if (channels?.[1] !== undefined) return Number(channels[1]) === 0;
  return false;
}

function readGlassMaterial(element: Element) {
  const root = getComputedStyle(element);
  return {
    background: root.backgroundColor,
    filter: root.backdropFilter,
    border: Number.parseFloat(root.borderTopWidth),
    shadow: root.boxShadow,
    nesting: (element as HTMLElement).dataset.neoverseGlassNesting,
  };
}

test('all Glass specimens render their own material at rest, after hover and in both themes', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
    const samples = page.locator('[data-glass-variant], [data-surface-preset^="glass-"]');
    await expect(samples).toHaveCount(6);

    for (const sample of await samples.all()) {
      const label =
        (await sample.getAttribute('data-glass-variant')) ??
        (await sample.getAttribute('data-surface-preset'));
      const rest = await sample.evaluate(readGlassMaterial);
      expect(rest.nesting, `${theme}/${label} nesting`).toBe('local');
      expect(isTransparent(rest.background), `${theme}/${label} rest background`).toBe(false);
      expect(rest.border, `${theme}/${label} rest border`).toBeGreaterThan(0);
      expect(rest.filter, `${theme}/${label} rest filter`).not.toBe('none');

      await sample.hover();
      const hover = await sample.evaluate(readGlassMaterial);
      expect(isTransparent(hover.background), `${theme}/${label} hover background`).toBe(false);
    }

    await page.goto(`/?theme=${theme}&lang=en#card`, { waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-card-default]');
    const cardStyle = await card.evaluate(readGlassMaterial);
    expect(isTransparent(cardStyle.background), `${theme}/UiCard rest background`).toBe(false);
    expect(cardStyle.filter, `${theme}/UiCard rest filter`).not.toBe('none');
  }
});

test('UiCard shares the Glass hairline and clips only its CSS refraction band', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
    const elevated = page.locator('[data-glass-variant="elevated"]');
    const elevatedBorder = await elevated.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        width: Number.parseFloat(style.borderTopWidth),
        color: style.borderTopColor,
        edgePadding: Number.parseFloat(edge.paddingTop),
      };
    });
    expect(elevatedBorder.edgePadding, 'Card edge clipping must not affect Glass itself').toBe(0);

    await page.goto(`/?theme=${theme}&lang=en#card`, { waitUntil: 'domcontentloaded' });
    const cardEdge = await page.locator('[data-card-default]').evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        width: Number.parseFloat(style.borderTopWidth),
        color: style.borderTopColor,
        edgePadding: Number.parseFloat(edge.paddingTop),
        maskComposite: edge.maskComposite,
        webkitMaskComposite: (edge as CSSStyleDeclaration & { webkitMaskComposite?: string })
          .webkitMaskComposite,
      };
    });
    expect(cardEdge.color).toBe(elevatedBorder.color);
    expect(
      cardEdge.width,
      `${theme}: UiCard keeps the shared Glass hairline so its refractive edge matches Glass`,
    ).toBe(elevatedBorder.width);
    expect(cardEdge.edgePadding, 'UiCard keeps a token-sized refractive edge band').toBeGreaterThan(
      0,
    );
    expect(
      [cardEdge.maskComposite, cardEdge.webkitMaskComposite].some((value) =>
        value?.includes('exclude'),
      ),
      'UiCard clips the shared refraction field to its edge band',
    ).toBe(true);
  }

  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  const lightHairline = await page
    .locator('[data-glass-variant="elevated"]')
    .evaluate((element) => getComputedStyle(element).borderTopColor);
  expect(lightHairline, 'light elevated Glass keeps its established transparent hairline').toBe(
    'rgba(0, 0, 0, 0)',
  );
});

test('UiCard reuses the glass-elevated CSS refraction field without a card-specific white edge', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#card`, { waitUntil: 'domcontentloaded' });

    const fields = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>('[data-card-default]');
      if (card === null) throw new Error('Default card fixture is missing');

      const reference = document.createElement('div');
      reference.className = 'material-glass-elevated';
      reference.style.position = 'fixed';
      reference.style.width = '160px';
      reference.style.height = '96px';
      reference.style.borderRadius = '24px';
      reference.style.pointerEvents = 'none';
      reference.style.visibility = 'hidden';
      document.body.append(reference);

      const result = {
        card: getComputedStyle(card, '::before').backgroundImage,
        reference: getComputedStyle(reference, '::before').backgroundImage,
      };
      reference.remove();
      return result;
    });

    expect(fields.card, `${theme}/card refraction field`).toBe(fields.reference);
  }
});

test('only an explicitly inherited Glass grouping is transparent, including on hover', async ({
  page,
}) => {
  await page.goto('/?theme=dark&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const host = document.querySelector('#materials-glass');
    if (host === null) throw new Error('Glass specimen host is missing');
    for (const nesting of ['inherit', 'local', 'unmarked'] as const) {
      const element = document.createElement('div');
      element.className = 'ui-surface material-glass-elevated rounded-card';
      element.dataset.glassFixture = nesting;
      if (nesting !== 'unmarked') element.dataset.neoverseGlassNesting = nesting;
      element.textContent = nesting;
      element.style.padding = 'var(--neoverse-space-4)';
      host.append(element);
    }
  });

  const inherited = page.locator('[data-glass-fixture="inherit"]');
  const sample = (selector: string) => page.locator(selector).evaluate(readGlassMaterial);

  const rest = await sample('[data-glass-fixture="inherit"]');
  expect(isTransparent(rest.background)).toBe(true);
  expect(rest.border).toBe(0);
  expect(rest.shadow).toBe('none');
  expect(rest.filter).toBe('none');

  for (const nesting of ['local', 'unmarked']) {
    const independent = await sample(`[data-glass-fixture="${nesting}"]`);
    expect(isTransparent(independent.background), nesting).toBe(false);
    expect(independent.filter, nesting).not.toBe('none');
  }

  await inherited.hover();
  // Wait for the material transition: a computed style sampled mid-transition
  // can incorrectly pass even if hover later reintroduces a separate shadow.
  await page.waitForTimeout(350);
  const hovered = await sample('[data-glass-fixture="inherit"]');
  expect(isTransparent(hovered.background)).toBe(true);
  expect(hovered.shadow).toBe('none');
  expect(hovered.filter).toBe('none');
});

test('reduced transparency keeps independent nested Glass visible without blur', async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.goto('/?theme=dark&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const samples = page.locator('[data-glass-variant]');
  await expect(samples).toHaveCount(3);
  for (const sample of await samples.all()) {
    const material = await sample.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, filter: style.backdropFilter };
    });
    expect(isTransparent(material.background)).toBe(false);
    expect(material.filter).toBe('none');
  }
});

test('independent nested Glass uses the WebGL edge pass without duplicate CSS outlines', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.neoverseGlassRenderer))
      .toBe('webgl');

    const metrics = await page.evaluate(() => {
      const parent = document.querySelector<HTMLElement>('#materials-glass');
      if (parent === null) throw new Error('Glass specimen section is missing');

      const inherited = document.createElement('div');
      inherited.className = 'material-glass-subtle rounded-card';
      inherited.dataset.neoverseGlassNesting = 'inherit';
      parent.append(inherited);

      const edge = (element: Element) => {
        const before = getComputedStyle(element, '::before');
        return {
          display: before.display,
          opacity: Number(before.opacity),
        };
      };

      return {
        canvas: document.querySelectorAll('[data-neoverse-glass-renderer-canvas]').length,
        outer: edge(parent),
        specimens: [...parent.querySelectorAll<HTMLElement>('[data-glass-variant]')].map(edge),
        inherited: edge(inherited),
      };
    });

    expect(metrics.canvas, `${theme}/shared renderer`).toBe(1);
    expect(metrics.outer.display, `${theme}/outer WebGL edge`).toBe('none');
    expect(metrics.specimens).toHaveLength(3);
    for (const specimen of metrics.specimens) {
      expect(specimen.display, `${theme}/nested WebGL edge`).toBe('none');
      expect(specimen.opacity, `${theme}/edge token`).toBeGreaterThan(0);
    }
    expect(metrics.inherited.display, `${theme}/inherited group edge`).toBe('none');
  }
});

test('Glass CSS edge remains visible when WebGL is unavailable', async ({ page }) => {
  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-neoverse-glass-renderer');
  });

  const edge = await page.locator('[data-glass-variant="elevated"]').evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return { display: style.display, opacity: Number(style.opacity) };
  });
  expect(edge.display).toBe('block');
  expect(edge.opacity).toBeGreaterThan(0);
});

test('masked scrolling navigation retains its CSS edge independently of WebGL', async ({
  page,
}) => {
  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  const navigation = page.locator('.playground-navigation-group').first();
  const edge = await navigation.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return {
      mode: element.getAttribute('data-neoverse-glass-edge-pass'),
      display: style.display,
      opacity: Number(style.opacity),
    };
  });
  expect(edge.mode).toBe('css');
  expect(edge.display).toBe('block');
  expect(edge.opacity).toBeGreaterThan(0);
});

test('WebGL actually paints the nested elevated silhouette in light and dark modes', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
    const surface = page.locator('[data-glass-variant="elevated"]');
    await surface.scrollIntoViewIfNeeded();
    await page.waitForTimeout(220);
    const withEdge = await surface.screenshot({ animations: 'disabled' });
    await page.evaluate(() => {
      const canvas = document.querySelector<HTMLElement>('[data-neoverse-glass-renderer-canvas]');
      if (canvas === null) throw new Error('The shared Glass renderer canvas is missing');
      canvas.style.visibility = 'hidden';
    });
    const withoutEdge = await surface.screenshot({ animations: 'disabled' });

    const difference = await page.evaluate(
      async ({ withEdge, withoutEdge }) => {
        const decode = async (base64: string) => {
          const image = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${base64}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (context === null) throw new Error('Cannot decode the Glass edge screenshot');
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const front = await decode(withEdge);
        const back = await decode(withoutEdge);
        let edgeDelta = 0;
        let centerDelta = 0;
        let edgeCount = 0;
        let centerCount = 0;
        for (let y = 14; y < front.height - 14; y++) {
          for (let x = 0; x < front.width; x++) {
            const offset = (y * front.width + x) * 4;
            const delta =
              (Math.abs((front.data[offset] ?? 0) - (back.data[offset] ?? 0)) +
                Math.abs((front.data[offset + 1] ?? 0) - (back.data[offset + 1] ?? 0)) +
                Math.abs((front.data[offset + 2] ?? 0) - (back.data[offset + 2] ?? 0))) /
              3;
            // The material edge is 1.25px, plus anti-aliasing. Measure that
            // silhouette rather than diluting it with untouched interior pixels.
            if (x < 2 || x >= front.width - 2) {
              edgeDelta += delta;
              edgeCount++;
            } else if (x >= 10 && x < front.width - 10) {
              centerDelta += delta;
              centerCount++;
            }
          }
        }
        return { edge: edgeDelta / edgeCount, center: centerDelta / centerCount };
      },
      { withEdge: withEdge.toString('base64'), withoutEdge: withoutEdge.toString('base64') },
    );

    expect(difference.edge, `${theme}/painted directional edge`).toBeGreaterThan(1);
    expect(difference.center, `${theme}/no extra interior wash`).toBeLessThan(0.5);
  }
});
