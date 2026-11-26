import { expect, test } from '@playwright/test';

const expected = { glass: /blur\(18px\)/, solid: 'none', frosted: /blur\(12px\)/ } as const;
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
      await outer.evaluate((element, value) => element.setAttribute('data-neoverse-material', value), parent);
      for (const child of materials) {
        await inner.evaluate((element, value) => element.setAttribute('data-neoverse-material', value), child);
        await expect(card).toHaveCSS('backdrop-filter', expected[child]);
        if (child !== 'glass') {
          expect(await card.evaluate((element) => getComputedStyle(element, '::before').content)).toBe('none');
        }
      }
      await inner.evaluate((element) => element.removeAttribute('data-neoverse-material'));
      await expect(card).toHaveCSS('backdrop-filter', expected[parent]);
    }

    // Exercise each directional switch with a painted surface already on screen.
    for (const material of ['glass', 'solid', 'glass', 'frosted', 'solid', 'frosted', 'glass'] as const) {
      await inner.evaluate((element, value) => element.setAttribute('data-neoverse-material', value), material);
      await expect(card).toHaveCSS('backdrop-filter', expected[material]);
      await expect(card).toHaveAttribute('data-surface', 'auto');
    }
  });
}

test('Frosted paint becomes opaque with reduced transparency or forced colors', {
  tag: '@chromium-materials',
}, async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en&material=frosted#forms-textarea');
  const field = page.locator('#forms-notes');
  await expect(field).toHaveCSS('backdrop-filter', /blur\(12px\)/);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await expect(field).toHaveCSS('backdrop-filter', 'none');
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  await page.emulateMedia({ forcedColors: 'active' });
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

test('a Glass surface can borrow an ancestor across a Solid boundary without adding a second blur', async ({ page }) => {
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
  await expect(page.locator('#material-skeleton')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('#material-borrower')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#material-local')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
});
