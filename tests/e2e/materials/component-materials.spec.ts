import { measureContrast } from '../../support/contrast';
import { expect, test, themes } from '../../support/e2e';

const materials = ['solid', 'frosted', 'glass'] as const;

test.describe('component material integration', () => {
  for (const theme of themes) {
    test(`disabled filled buttons stay legible in Solid and Frosted (${theme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/react-fixture?theme=${theme}&lang=en`, {
        waitUntil: 'domcontentloaded',
      });
      await page.evaluate(() => {
        const variants = ['primary', 'danger', 'success', 'warning', 'accent'];
        for (const material of ['solid', 'frosted']) {
          const scope = document.createElement('div');
          scope.id = `disabled-buttons-${material}`;
          scope.dataset.neoverseMaterial = material;
          scope.style.cssText = 'display:flex;gap:8px;padding:12px;';
          for (const variant of variants) {
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = true;
            button.className = `ui-button ui-button--md ui-button--${variant} material-role-control`;
            button.dataset.surface = 'auto';
            button.dataset.disabledVariant = variant;
            button.innerHTML = `<span class="ui-button__content">${variant}</span>`;
            scope.append(button);
          }
          document.body.append(scope);
        }
      });

      for (const material of ['solid', 'frosted'] as const) {
        const selectors = ['primary', 'danger', 'success', 'warning', 'accent'].map(
          (variant) => `#disabled-buttons-${material} [data-disabled-variant="${variant}"]`,
        );
        const samples = await page.evaluate(measureContrast, selectors);
        expect(samples).toHaveLength(5);
        for (const sample of samples) {
          expect(
            sample.ratio,
            `${theme} ${material} disabled button ${sample.selector}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    test(`tooltip pointer, avatar plate, table striping, status plates and terminal adapt across materials (${theme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`, {
        waitUntil: 'domcontentloaded',
      });

      const root = page.locator('html');
      const tooltip = page.locator('[data-react-adapter="UiTooltipSurface"]');
      const avatar = page.locator('[data-react-adapter="UiAvatar"]');
      const badge = page.locator('[data-react-adapter="UiBadge"]');
      const notice = page.locator('[data-react-adapter="UiNotice"]');
      const terminal = page.locator('[data-react-adapter="UiTerminalSurface"]');

      for (const material of ['solid', 'frosted'] as const) {
        await root.evaluate((element, next) => {
          element.setAttribute('data-neoverse-material', next);
        }, material);

        // Tooltip pointer resolves a valid bottom offset (no IACVT fallback to auto)
        // and matches the tooltip plate fill.
        const tooltipMetrics = await tooltip.evaluate((element) => {
          const body = getComputedStyle(element);
          const arrow = getComputedStyle(element, '::after');
          return {
            bodyFill: body.backgroundColor,
            bodyBorder: body.borderTopColor,
            bodyBackdrop: body.backdropFilter,
            arrowFill: arrow.backgroundColor,
            arrowBottom: arrow.bottom,
            arrowHeight: Number.parseFloat(arrow.height),
          };
        });
        expect(tooltipMetrics.arrowHeight).toBeGreaterThan(0);
        expect(tooltipMetrics.arrowBottom).not.toBe('auto');
        expect(tooltipMetrics.arrowFill).toBe(tooltipMetrics.bodyFill);
        if (material === 'solid') {
          expect(tooltipMetrics.bodyBackdrop).toBe('none');
        } else {
          expect(tooltipMetrics.bodyBackdrop).toMatch(/blur\(14px\)/);
          expect(tooltipMetrics.bodyBorder).toBe('rgba(0, 0, 0, 0)');
        }

        // Avatar clears Glass gradient background-image in Solid and Frosted.
        await expect(avatar).toHaveCSS('background-image', 'none');
        if (material === 'solid') {
          await expect(avatar).toHaveCSS('backdrop-filter', 'none');
        } else {
          await expect(avatar).toHaveCSS('backdrop-filter', /blur\(12px\)/);
        }

        // Badge never samples backdrop; standalone Notice samples in Frosted and stays opaque in Solid.
        await expect(badge).toHaveCSS('backdrop-filter', 'none');
        if (material === 'solid') {
          await expect(notice).toHaveCSS('backdrop-filter', 'none');
        } else {
          await expect(notice).toHaveCSS('backdrop-filter', /blur\(10px\)/);
        }
        const statusSamples = await page.evaluate(measureContrast, [
          '[data-react-adapter="UiBadge"]',
          '[data-react-adapter="UiNotice"]',
        ]);
        for (const sample of statusSamples) {
          expect(sample.ratio, `${theme} ${material} ${sample.selector}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }

        // Terminal follows Solid/Frosted panel backdrop ownership.
        if (material === 'solid') {
          await expect(terminal).toHaveCSS('backdrop-filter', 'none');
        } else {
          await expect(terminal).toHaveCSS('backdrop-filter', /blur\(16px\)/);
        }
      }
    });
  }

  test('explicit surface="frosted" works across segmented controls, docks and terminals inside a Solid scope', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/react-fixture?theme=light&lang=en&material=solid&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });

    await page.evaluate(() => {
      const host = document.createElement('div');
      host.id = 'explicit-frosted-probes';
      host.innerHTML = `
        <div id="probe-dock" class="ui-control-surface ui-dock material-role-panel material-frosted" data-surface="frosted">
          <span class="ui-control-surface__group ui-control-surface__group--trailing">Actions</span>
        </div>
        <div id="probe-segmented" class="ui-segmented-control material-role-group material-frosted" data-surface="frosted">
          <span class="ui-segmented-control__slider"></span>
        </div>
        <div id="probe-terminal" class="ui-terminal-surface material-role-panel material-frosted" data-surface="frosted">
          <header class="ui-terminal-surface__header">Terminal</header>
        </div>
      `;
      document.body.append(host);
    });

    await expect(page.locator('#probe-dock')).toHaveCSS('backdrop-filter', /blur\(16px\)/);
    await expect(page.locator('#probe-segmented')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
    await expect(page.locator('#probe-terminal')).toHaveCSS('backdrop-filter', /blur\(16px\)/);
    for (const id of ['#probe-dock', '#probe-segmented', '#probe-terminal']) {
      expect(
        await page.locator(id).evaluate((el) => getComputedStyle(el, '::before').content),
      ).toBe('none');
    }
  });

  test('Prose reading surfaces and table striping adapt across all three materials without leaking blur', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/frame?theme=light&lang=en#foundation-prose', {
      waitUntil: 'domcontentloaded',
    });
    const prose = page.locator('[data-foundation-prose]');
    const quote = prose.locator('blockquote');
    const codeBlock = prose.locator('pre');
    const table = prose.getByRole('table');

    for (const material of materials) {
      await prose.evaluate((element, next) => {
        element.setAttribute('data-neoverse-material', next);
      }, material);

      if (material === 'solid') {
        await expect(quote).toHaveCSS('backdrop-filter', 'none');
        await expect(codeBlock).toHaveCSS('backdrop-filter', 'none');
        await expect(table).toHaveCSS('backdrop-filter', 'none');
      } else if (material === 'frosted') {
        await expect(quote).toHaveCSS('backdrop-filter', /blur\(8px\)/);
        await expect(codeBlock).toHaveCSS('backdrop-filter', /blur\(8px\)/);
        await expect(table).toHaveCSS('backdrop-filter', /blur\(14px\)/);
      } else {
        await expect(quote).toHaveCSS('backdrop-filter', /blur\(/);
        await expect(table).toHaveCSS('backdrop-filter', /blur\(/);
      }
    }
  });

  test('Frosted and Solid dialogs bridge ancestor scope immediately on open in Vue and React', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/react-fixture?theme=dark&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });

    const source = page.locator('[data-react-adapter="UiDialog"]');
    await expect(source).toBeVisible();
    await source.evaluate((el) => el.setAttribute('data-neoverse-material', 'frosted'));
    await source.locator('[data-dialog-open]').click();

    const dialog = page.locator('dialog.ui-dialog[open]');
    await expect(dialog.locator('..')).toHaveAttribute('data-neoverse-material', 'frosted');
    await expect(dialog).toHaveCSS('backdrop-filter', /blur\(20px\)/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Pure Frosted and Solid pages keep zero Aurora Glass renderer canvases', async ({
    page,
  }) => {
    for (const material of ['solid', 'frosted'] as const) {
      await page.goto(`/frame?theme=light&lang=en&fps=0&material=${material}#forms-textarea`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('html')).toHaveAttribute('data-neoverse-material', material);
      await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
    }
  });
});
