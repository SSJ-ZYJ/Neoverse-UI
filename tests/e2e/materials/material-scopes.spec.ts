import { expect, test } from '@playwright/test';
import { measureContrast } from '../../support/contrast';
import { themes } from '../../support/e2e';

const expected = { glass: /blur\(18px\)/, solid: 'none', frosted: /blur\(16px\)/ } as const;
const materials = ['glass', 'solid', 'frosted'] as const;

for (const [adapter, url] of [
  ['Vue', '/frame?theme=light&lang=en#materials'],
  ['React', '/react-fixture?theme=light&lang=en'],
] as const) {
  test(`${adapter} paints the closest valid scope for all material pairs`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(url);
    const card = page.locator('[data-contract-material="card"]');
    await card.evaluate((element) => {
      const outer = document.createElement('div');
      outer.id = 'material-outer';
      const inner = document.createElement('div');
      inner.id = 'material-inner';
      const invalid = document.createElement('div');
      invalid.setAttribute('data-neoverse-material', 'unknown');
      element.replaceWith(outer);
      outer.append(inner);
      inner.append(invalid);
      invalid.append(element);
    });
    const outer = page.locator('#material-outer');
    const inner = page.locator('#material-inner');
    for (const parent of materials) {
      await outer.evaluate(
        (element, value) => element.setAttribute('data-neoverse-material', value),
        parent,
      );
      for (const child of materials) {
        await inner.evaluate(
          (element, value) => element.setAttribute('data-neoverse-material', value),
          child,
        );
        await expect(card).toHaveCSS('backdrop-filter', expected[child]);
        if (child !== 'glass') {
          expect(
            await card.evaluate((element) => getComputedStyle(element, '::before').content),
          ).toBe('none');
        }
      }
      await inner.evaluate((element) => element.removeAttribute('data-neoverse-material'));
      await expect(card).toHaveCSS('backdrop-filter', expected[parent]);
    }

    // Exercise each directional switch with a painted surface already on screen.
    for (const material of [
      'glass',
      'solid',
      'glass',
      'frosted',
      'solid',
      'frosted',
      'glass',
    ] as const) {
      await inner.evaluate(
        (element, value) => element.setAttribute('data-neoverse-material', value),
        material,
      );
      await expect(card).toHaveCSS('backdrop-filter', expected[material]);
      await expect(card).toHaveAttribute('data-surface', 'auto');
    }
  });
}

test('Frosted paint becomes genuinely opaque with reduced transparency or forced colors without resetting state', {
  tag: '@chromium-materials',
}, async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en&material=frosted#forms-textarea');
  const panel = page.locator('#forms-textarea');
  const field = page.locator('#forms-notes');
  await field.fill('Keep my draft intact');
  await expect(panel).toHaveCSS('backdrop-filter', /blur\(16px\)/);
  await expect(field).toHaveCSS('backdrop-filter', 'none');

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await expect(panel).toHaveCSS('backdrop-filter', 'none');
  await expect(field).toHaveCSS('backdrop-filter', 'none');
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const alpha = (selector: string) => {
          const el = document.querySelector(selector);
          const ctx = new OffscreenCanvas(1, 1).getContext('2d');
          if (!el || !ctx) return 0;
          ctx.fillStyle = getComputedStyle(el).backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
          return ctx.getImageData(0, 0, 1, 1).data[3] ?? 0;
        };
        return { panel: alpha('#forms-textarea'), field: alpha('#forms-notes') };
      }),
    )
    .toEqual({ panel: 255, field: 255 });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-material', 'frosted');
  await expect(field).toHaveValue('Keep my draft intact');

  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(panel).toHaveCSS('backdrop-filter', 'none');
  await expect(field).toHaveCSS('backdrop-filter', 'none');
  await field.focus();
  await expect(field).toHaveCSS('outline-style', 'solid');
});

test('a Frosted preview initializes before either framework bundle runs', async ({ page }) => {
  await page.route('**/assets/*.js', (route) => route.abort());
  for (const path of ['/frame', '/react-fixture']) {
    await page.goto(`${path}?theme=light&lang=en&material=frosted`);
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-material', 'frosted');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  }
});

test('a Glass surface can borrow an ancestor across a Solid boundary without adding a second blur', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en&material=solid#forms-textarea');
  await page.locator('#forms-notes').waitFor();
  await page.evaluate(() => {
    const region = document.createElement('section');
    region.setAttribute('data-neoverse-material', 'glass');
    region.innerHTML = `
      <div class="material-role-panel" id="material-plane">
        <span class="ui-skeleton" id="material-skeleton">Loading</span>
        <div data-neoverse-material="solid">
          <div class="material-glass-subtle" id="material-borrower" data-neoverse-glass-nesting="inherit">Label</div>
          <div class="material-glass-subtle" id="material-local">Independent label</div>
        </div>
      </div>`;
    document.body.append(region);
  });
  await expect(page.locator('#material-plane')).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  await expect(page.locator('#material-skeleton')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#material-skeleton')).not.toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
  await expect(page.locator('#material-borrower')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#material-local')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
});

for (const theme of themes) {
  test(`all seven Surface Roles, Frosted isolation, and contrast hold across three materials in ${theme}`, {
    tag: '@chromium-materials',
  }, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#materials`, {
      waitUntil: 'domcontentloaded',
    });

    const solidCol = page.locator('[data-foundation-column="solid"]');
    const frostedCol = page.locator('[data-foundation-column="frosted"]');
    const glassCol = page.locator('[data-foundation-column="glass"]');
    await expect(frostedCol).toBeVisible();

    // Solid stays fully opaque and never samples the backdrop on any role.
    for (const role of [
      'panel',
      'group',
      'control-primary',
      'control-secondary',
      'field',
      'table',
      'standalone-field',
      'standalone-group',
      'standalone-control',
      'overlay',
      'compact-overlay',
    ]) {
      await expect(solidCol.locator(`[data-foundation-role="${role}"]`)).toHaveCSS(
        'backdrop-filter',
        'none',
      );
    }

    // Frosted assigns role-specific blur & saturation across all seven roles without Glass optics.
    const frostedPanel = frostedCol.locator('[data-foundation-role="panel"]');
    const frostedTable = frostedCol.locator('[data-foundation-role="table"]');
    const frostedField = frostedCol.locator('[data-foundation-role="standalone-field"]');
    const frostedGroup = frostedCol.locator('[data-foundation-role="standalone-group"]');
    const frostedControl = frostedCol.locator('[data-foundation-role="standalone-control"]');
    const frostedOverlay = frostedCol.locator('[data-foundation-role="overlay"]');
    const frostedCompact = frostedCol.locator('[data-foundation-role="compact-overlay"]');
    const frostedGhost = frostedCol.locator('[data-foundation-role="control-ghost"]');
    const frostedBadge = frostedCol.locator('[data-foundation-role="badge"]');
    const frostedSkeleton = frostedCol.locator('[data-foundation-role="skeleton"]');

    await expect(frostedPanel).toHaveCSS('backdrop-filter', /blur\(16px\) saturate\(1\.18\)/);
    await expect(frostedGroup).toHaveCSS('backdrop-filter', /blur\(12px\) saturate\(1\.12\)/);
    await expect(frostedControl).toHaveCSS('backdrop-filter', /blur\(10px\) saturate\(1\.12\)/);
    await expect(frostedField).toHaveCSS('backdrop-filter', /blur\(8px\) saturate\(1\.12\)/);
    await expect(frostedTable).toHaveCSS('backdrop-filter', /blur\(14px\) saturate\(1\.18\)/);
    await expect(frostedTable.locator('td').first()).toHaveCSS('backdrop-filter', 'none');
    await expect(frostedOverlay).toHaveCSS('backdrop-filter', /blur\(20px\) saturate\(1\.24\)/);
    await expect(frostedCompact).toHaveCSS('backdrop-filter', /blur\(14px\) saturate\(1\.18\)/);
    await expect(frostedGhost).toHaveCSS('backdrop-filter', 'none');
    await expect(frostedGhost).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(frostedBadge).toHaveCSS('backdrop-filter', 'none');
    await expect(frostedSkeleton).toHaveCSS('backdrop-filter', 'none');

    // Non-optical isolation: Frosted never owns a Glass tier or refraction mask.
    const frostedOptics = await frostedPanel.evaluate((element) => ({
      tier: getComputedStyle(element).getPropertyValue('--neoverse-glass-tier').trim(),
      beforeContent: getComputedStyle(element, '::before').content,
      afterMask: getComputedStyle(element, '::after').maskImage,
    }));
    expect(frostedOptics.tier).toBe('');
    expect(frostedOptics.beforeContent).toBe('none');
    expect(frostedOptics.afterMask).toBe('none');

    // Glass keeps Aurora Glass optical tiers intact.
    await expect(glassCol.locator('[data-foundation-role="panel"]')).toHaveCSS(
      'backdrop-filter',
      /blur\(18px\)/,
    );

    // Contrast checks across Solid and Frosted in both Light and Dark themes.
    const samples = await page.evaluate(measureContrast, [
      '[data-foundation-column="solid"] [data-foundation-role="control-primary"]',
      '[data-foundation-column="solid"] [data-foundation-role="control-secondary"]',
      '[data-foundation-column="solid"] [data-foundation-role="field"]',
      '[data-foundation-column="solid"] [data-foundation-role="table"] :is(th, td)',
      '[data-foundation-column="solid"] [data-foundation-role="badge"]',
      '[data-foundation-column="frosted"] [data-foundation-role="control-primary"]',
      '[data-foundation-column="frosted"] [data-foundation-role="control-secondary"]',
      '[data-foundation-column="frosted"] [data-foundation-role="field"]',
      '[data-foundation-column="frosted"] [data-foundation-role="table"] :is(th, td)',
      '[data-foundation-column="frosted"] [data-foundation-role="badge"]',
    ]);
    expect(samples.length).toBeGreaterThanOrEqual(10);
    for (const sample of samples) {
      expect(sample.ratio, `${theme} ${sample.selector} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('same-material nesting avoids Frosted double-blur, steps Solid panels, and isolates all 9 mixed pairs', {
  tag: '@chromium-materials',
}, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#materials', {
    waitUntil: 'domcontentloaded',
  });

  // Frosted-in-Frosted: outer panel samples, inner descendants skip blur, floating overlay samples.
  const frostedNesting = page.locator('[data-same-nesting="frosted"]');
  await expect(frostedNesting.locator('[data-nesting-level="outer-panel"]')).toHaveCSS(
    'backdrop-filter',
    /blur\(16px\)/,
  );
  for (const inner of [
    'inner-panel',
    'inner-group',
    'inner-control',
    'inner-field',
    'inherit-surface',
  ]) {
    await expect(frostedNesting.locator(`[data-nesting-level="${inner}"]`)).toHaveCSS(
      'backdrop-filter',
      'none',
    );
  }
  await expect(frostedNesting.locator('[data-nesting-level="floating-overlay"]')).toHaveCSS(
    'backdrop-filter',
    /blur\(20px\)/,
  );

  // Solid-in-Solid: nested panel steps tonal fill from outer panel without blur.
  const solidNesting = page.locator('[data-same-nesting="solid"]');
  const solidFills = await solidNesting.evaluate((root) => {
    const outer = root.querySelector('[data-nesting-level="outer-panel"]');
    const inner = root.querySelector('[data-nesting-level="inner-panel"]');
    return {
      outer: outer ? getComputedStyle(outer).backgroundColor : '',
      inner: inner ? getComputedStyle(inner).backgroundColor : '',
    };
  });
  expect(solidFills.outer).not.toBe(solidFills.inner);

  // Full 3x3 mixed-material nesting matrix (all 9 parent x child pairs).
  for (const parent of materials) {
    for (const child of materials) {
      const card = page.locator(`[data-nesting-child="${parent}-${child}"]`);
      await expect(card).toHaveCSS('backdrop-filter', expected[child]);
    }
  }

  // Clipped scroll container stays stable on scroll across all three materials.
  for (const material of materials) {
    const scroller = page.locator(`[data-scroll-stage="${material}"]`);
    const moved = await scroller.evaluate((el) => {
      el.scrollTop = 64;
      return el.scrollTop;
    });
    expect(moved).toBeGreaterThan(0);
  }
});
