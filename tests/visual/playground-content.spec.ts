import { expect, test } from '@playwright/test';
import {
  componentContracts,
  contractLabSummary,
  interactionContracts,
} from '../../apps/playground/src/contract-lab';

for (const theme of ['light', 'dark'] as const) {
  test(`standalone data display components keep native semantics and shared inset material / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#data-display-table`, {
      waitUntil: 'domcontentloaded',
    });

    const table = page.locator('#data-display-table [data-data-display-table]');
    await expect(table).toHaveClass(/ui-table/);
    await expect(table.locator('caption')).toHaveText('Package compatibility matrix');
    await expect(table.locator('thead th')).toHaveCount(3);
    await expect(table.locator('tbody tr')).toHaveCount(3);
    const tableMaterial = await table.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
      };
    });
    expect(tableMaterial.borderWidth).toBe('0px');
    expect(tableMaterial.backgroundImage).toBe('none');
    expect(tableMaterial.boxShadow).not.toBe('none');
    expect(tableMaterial.backdropFilter).toContain('blur(12px)');
    expect(
      await table.locator('..').evaluate((element) => getComputedStyle(element).borderRadius),
    ).toBe('0px');

    const tableSurface = page.locator('#data-display-table .playground-data-table-surface');
    await expect(tableSurface).toHaveAttribute('data-surface', 'none');
    const cardMaterial = await tableSurface.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        edgeBackgroundImage: edge.backgroundImage,
      };
    });
    expect(cardMaterial.boxShadow).toBe('none');
    expect(cardMaterial.backdropFilter).toBe('none');
    expect(cardMaterial.edgeBackgroundImage).toBe('none');

    const tableBackdrop = page.locator('#data-display-table .playground-material-backdrop--inset');
    const tableBackdropMaterial = await tableBackdrop.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        boxShadow: style.boxShadow,
        edgeBackgroundImage: edge.backgroundImage,
        edgeOpacity: edge.opacity,
        edgeBackdropFilter: edge.backdropFilter,
      };
    });
    expect(tableBackdropMaterial.boxShadow).not.toBe('none');
    expect(tableBackdropMaterial.edgeBackgroundImage).not.toBe('none');
    expect(Number(tableBackdropMaterial.edgeOpacity)).toBeGreaterThan(0);
    expect(tableBackdropMaterial.edgeBackdropFilter).not.toBe('none');

    const captionMaterial = await table.locator('caption').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(captionMaterial.backgroundImage).toBe('none');
    expect(captionMaterial.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(captionMaterial.boxShadow).toBe('none');

    const cellMaterial = await table
      .locator('tbody td')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          boxShadow: style.boxShadow,
          backdropFilter: style.backdropFilter,
        };
      });
    expect(cellMaterial.backgroundImage).toBe('none');
    expect(cellMaterial.boxShadow).not.toBe('none');
    expect(cellMaterial.backdropFilter).toBe('none');

    const headerMaterial = await table
      .locator('thead th')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
          boxShadow: style.boxShadow,
        };
      });
    const bodyBackgroundColor = await table
      .locator('tbody td')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(bodyBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      await table
        .locator('thead th')
        .first()
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.borderBlockStartWidth, style.borderInlineStartWidth];
        }),
    ).toEqual(['1px', '1px']);
    expect(headerMaterial.backgroundImage).toBe(cellMaterial.backgroundImage);
    expect(headerMaterial.backgroundColor).toBe(bodyBackgroundColor);
    expect(headerMaterial.boxShadow).not.toBe(cellMaterial.boxShadow);

    await page.goto(`/?theme=${theme}&lang=en#data-display-disclosure`, {
      waitUntil: 'domcontentloaded',
    });
    const closed = page.locator('#data-display-disclosure [data-data-display-disclosure="closed"]');
    const open = page.locator('#data-display-disclosure [data-data-display-disclosure="open"]');
    await expect(closed).not.toHaveAttribute('open', '');
    await expect(open).toHaveAttribute('open', '');
    await expect(closed).not.toHaveClass(/material-glass-/);
    await expect(open).not.toHaveClass(/material-glass-/);
    await expect(closed.locator(':scope > summary')).toHaveClass(/ui-disclosure__summary/);

    const disclosureMaterial = await closed.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        edgeBackgroundImage: getComputedStyle(element, '::before').backgroundImage,
      };
    });
    expect(disclosureMaterial.backgroundImage).toBe('none');
    expect(disclosureMaterial.edgeBackgroundImage).toBe('none');
    expect(disclosureMaterial.boxShadow).not.toBe('none');
    expect(disclosureMaterial.backdropFilter).toContain('blur(12px)');

    const closedSummary = closed.locator(':scope > summary');
    const summaryRest = await closedSummary.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
      };
    });
    const supportsHover = await page.evaluate(() => window.matchMedia('(hover: hover)').matches);
    if (supportsHover) {
      const closedBackgroundRest = await closed.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      const closedShadowRest = await closed.evaluate(
        (element) => getComputedStyle(element).boxShadow,
      );
      const indicatorRest = await closedSummary.evaluate(
        (element) => getComputedStyle(element, '::after').color,
      );
      await closedSummary.hover();
      const summaryHover = await closedSummary.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
        };
      });
      const indicatorHover = await closedSummary.evaluate(
        (element) => getComputedStyle(element, '::after').color,
      );
      expect(summaryHover).toEqual(summaryRest);
      await expect
        .poll(() => closed.evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(closedBackgroundRest);
      await expect
        .poll(() => closed.evaluate((element) => getComputedStyle(element).boxShadow))
        .not.toBe(closedShadowRest);
      expect(indicatorHover).toBe(indicatorRest);
    }

    await closed.locator(':scope > summary').press('Enter');
    await expect(closed).toHaveAttribute('open', '');
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`form controls keep material state hierarchy without opacity-only disabled styling / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#forms-input`, {
      waitUntil: 'domcontentloaded',
    });

    const rest = page.locator('#forms-input [data-form-input]');
    const disabled = page.locator('#forms-input #forms-email-disabled');
    await expect(rest).toBeVisible();
    await expect(disabled).toBeDisabled();

    const restState = await rest.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        foreground: style.color,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
      };
    });
    expect(restState.borderWidth).toBe('0px');
    // The inset form field uses a translucent solid fill, not an image layer.
    expect(restState.backgroundImage).toBe('none');
    expect(restState.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(restState.boxShadow).not.toBe('none');
    expect(restState.backdropFilter).not.toBe('none');

    await rest.focus();
    const focusedState = await rest.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    // Focus depth is expressed through the ring/shadow, without repainting the fill.
    expect(focusedState.backgroundColor).toBe(restState.backgroundColor);
    expect(focusedState.boxShadow).not.toBe(restState.boxShadow);

    const disabledState = await disabled.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        opacity: style.opacity,
        cursor: style.cursor,
        backgroundColor: style.backgroundColor,
        foreground: style.color,
        textFill: style.webkitTextFillColor,
      };
    });
    expect(disabledState.opacity).toBe('1');
    expect(disabledState.cursor).toBe('not-allowed');
    // Disabled inset controls retain the same material fill; muted text carries
    // the state without reducing opacity or obscuring the backdrop.
    expect(disabledState.backgroundColor).toBe(restState.backgroundColor);
    expect(disabledState.foreground).not.toBe(restState.foreground);
    expect(disabledState.textFill).toBe(disabledState.foreground);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`feedback surfaces stay borderless while retaining material depth / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#status-feedback-badge`, {
      waitUntil: 'domcontentloaded',
    });

    const statusDot = page.locator('#status-feedback-indicator .ui-status-indicator__dot').first();
    const notice = page.locator('#status-feedback-notice .ui-notice--info');
    const tooltip = page.locator(
      '#status-feedback-tooltip [data-qa-context="gradient"] .ui-tooltip-surface--accent',
    );
    const neutralTooltip = page.locator(
      '#status-feedback-tooltip [data-qa-context="gradient"] .ui-tooltip-surface--neutral',
    );

    await expect(statusDot).toBeVisible();
    await expect(notice).toBeVisible();
    await expect(tooltip).toBeVisible();
    await expect(neutralTooltip).toBeVisible();

    const noticeStyle = await notice.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
      };
    });
    expect(noticeStyle.borderWidth).toBe('0px');
    // Semantic Notice uses its tinted fill plus shadow/filter without a gradient image.
    expect(noticeStyle.backgroundImage).toBe('none');
    expect(noticeStyle.boxShadow).not.toBe('none');
    expect(noticeStyle.backdropFilter).not.toBe('none');

    const tooltipStyle = await tooltip.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      const arrow = getComputedStyle(element, '::after');
      return {
        borderColor: style.borderTopColor,
        borderWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        plateBackground: edge.backgroundColor,
        plateFilter: edge.backdropFilter,
        plateClip: edge.clipPath,
        edgeOpacity: Number(edge.opacity),
        arrowBorderWidth: arrow.borderTopWidth,
        arrowBoxShadow: arrow.boxShadow,
      };
    });
    expect(tooltipStyle.borderColor).toBe('rgba(0, 0, 0, 0)');
    expect(tooltipStyle.borderWidth).toBe('0px');
    expect(tooltipStyle.boxShadow, 'A rectangular shadow must not cross the pointer join').toBe(
      'none',
    );
    expect(
      tooltipStyle.boxShadow.includes('inset'),
      'accent Tooltip must not render a continuous inset top stroke',
    ).toBe(false);
    expect(tooltipStyle.plateBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(tooltipStyle.plateFilter).toContain('blur(');
    expect(tooltipStyle.plateClip).toContain('shape(');
    expect(tooltipStyle.edgeOpacity).toBeGreaterThan(0);
    expect(tooltipStyle.arrowBorderWidth).toBe('0px');
    expect(tooltipStyle.arrowBoxShadow.includes('inset')).toBe(false);
    expect(tooltipStyle.backdropFilter, 'The complete plate owns backdrop sampling').toBe('none');

    const neutralArrowContrast = await neutralTooltip.evaluate((element) => {
      const body = getComputedStyle(element, '::before').backgroundColor;
      const arrow = getComputedStyle(element, '::after').backgroundColor;
      const alphaOf = (value: string): number => {
        const modern = value.match(/\/\s*([\d.]+)\)/);
        if (modern) return Number(modern[1]);
        const legacy = value.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        if (legacy) return Number(legacy[1]);
        return 1;
      };
      return {
        body,
        arrow,
        bodyAlpha: alphaOf(body),
        arrowAlpha: alphaOf(arrow),
      };
    });
    expect(
      neutralArrowContrast.arrow,
      'The pointer marker must not paint a separate material',
    ).toBe('rgba(0, 0, 0, 0)');
    expect(
      neutralArrowContrast.bodyAlpha,
      'The unified tooltip plate must retain its translucent fill',
    ).toBeGreaterThan(0);

    expect(await statusDot.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
      'none',
    );
  });
}

test('design QA matrices compare canonical components across shared backdrop contexts', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#controls-button`, {
      waitUntil: 'domcontentloaded',
    });

    const buttonMatrix = page.locator('#controls-button [data-qa-matrix]').first();
    await expect(buttonMatrix.locator('[data-qa-context]')).toHaveCount(3);
    await expect(buttonMatrix.locator('[data-qa-context="gradient"]')).toBeVisible();
    await expect(buttonMatrix.locator('[data-qa-context="neutral"]')).toBeVisible();
    await expect(buttonMatrix.locator('[data-qa-context="reduced"]')).toBeVisible();

    const backdropMetrics = await buttonMatrix.evaluate((matrix) => {
      const read = (id: string) => {
        const stage = matrix.querySelector<HTMLElement>(`[data-qa-stage="${id}"]`);
        if (!stage) throw new Error(`Missing QA stage: ${id}`);
        const style = getComputedStyle(stage);
        return {
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          borderWidth: style.borderTopWidth,
          boxShadow: style.boxShadow,
        };
      };
      return {
        gradient: read('gradient'),
        neutral: read('neutral'),
        reduced: read('reduced'),
      };
    });

    expect(backdropMetrics.gradient.backgroundImage).not.toBe('none');
    expect(backdropMetrics.neutral.backgroundImage).toBe('none');
    // QA stages share the same neutral base; only the contextual image differs.
    expect(backdropMetrics.gradient.backgroundColor).toBe(backdropMetrics.neutral.backgroundColor);
    expect(backdropMetrics.gradient.borderWidth).toBe('0px');
    expect(backdropMetrics.neutral.borderWidth).toBe('0px');
    expect(backdropMetrics.reduced.borderWidth).toBe('0px');
    expect(backdropMetrics.reduced.boxShadow).not.toBe('none');

    const reducedButton = buttonMatrix
      .locator('[data-qa-context="reduced"] .ui-button.material-glass-subtle')
      .first();
    await expect(reducedButton).toBeVisible();
    const reducedButtonStyle = await reducedButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backdropFilter: style.backdropFilter,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(reducedButtonStyle.backdropFilter).toBe('none');
    expect(reducedButtonStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

    const firstStateRow = page.locator('#controls-button [data-specimen-state-row]').first();
    const stateShell = await firstStateRow.evaluate((element) => {
      const preview = element.querySelector<HTMLElement>('[data-specimen-preview]');
      if (!preview) throw new Error('Missing state preview');
      const rowStyle = getComputedStyle(element);
      const previewStyle = getComputedStyle(preview);
      return {
        rowBorder: rowStyle.borderTopWidth,
        rowShadow: rowStyle.boxShadow,
        previewBorder: previewStyle.borderTopWidth,
        previewShadow: previewStyle.boxShadow,
      };
    });
    expect(stateShell.rowBorder).toBe('0px');
    expect(stateShell.previewBorder).toBe('0px');
    expect(stateShell.rowShadow).not.toBe('none');
    expect(stateShell.previewShadow).not.toBe('none');

    await page.goto(`/?theme=${theme}&lang=en#forms-input`, {
      waitUntil: 'domcontentloaded',
    });
    const formMatrix = page.locator('[data-forms-qa] [data-qa-matrix]');
    await expect(formMatrix.locator('[data-qa-context]')).toHaveCount(3);
    await expect(formMatrix.locator('[data-qa-context] .ui-input')).toHaveCount(3);
    await expect(formMatrix.locator('[data-qa-context] .ui-select')).toHaveCount(3);
    await expect(formMatrix.locator('[data-qa-context] .ui-textarea')).toHaveCount(3);

    await page.goto(`/?theme=${theme}&lang=en#card-card`, { waitUntil: 'domcontentloaded' });
    const cardMatrix = page.locator('[data-card-qa] [data-qa-matrix]');
    await expect(cardMatrix.locator('[data-qa-context] .ui-card')).toHaveCount(3);
    await page.goto(`/?theme=${theme}&lang=en#status-feedback-tooltip`, {
      waitUntil: 'domcontentloaded',
    });
    const tooltipMatrix = page.locator('#status-feedback-tooltip [data-qa-matrix]');
    await expect(tooltipMatrix.locator('[data-qa-context]')).toHaveCount(3);
    await expect(tooltipMatrix.locator('[data-qa-context] .ui-tooltip-surface')).toHaveCount(6);

    const tooltipPointerGeometry = await tooltipMatrix
      .locator('[data-qa-context="gradient"] .ui-tooltip-surface')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const arrow = getComputedStyle(element, '::after');
          const arrowBottom = Number.parseFloat(arrow.bottom);
          return {
            arrowBottom,
            arrowLeftToken: getComputedStyle(element)
              .getPropertyValue('--ui-tooltip-arrow-left')
              .trim(),
            arrowTransform: arrow.transform,
          };
        }),
      );
    for (const geometry of tooltipPointerGeometry) {
      expect(geometry.arrowBottom, 'Tooltip pointer must sit below the surface body').toBeLessThan(
        0,
      );
      expect(geometry.arrowLeftToken, 'Tooltip pointer anchor stays centered').toBe('50%');
      expect(geometry.arrowTransform, 'Tooltip pointer compensates for its own width').not.toBe(
        'none',
      );
    }
  }
});

test('prose and reading fixtures keep mobile overflow inside their content regions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en#foundation-prose', { waitUntil: 'domcontentloaded' });

  const foundationMetrics = await page.locator('[data-foundation-prose]').evaluate((element) => ({
    proseWidth: (element as HTMLElement).getBoundingClientRect().width,
    viewportWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
  }));

  expect(foundationMetrics.proseWidth).toBeLessThanOrEqual(foundationMetrics.viewportWidth);
  expect(foundationMetrics.rootScrollWidth).toBe(foundationMetrics.viewportWidth);

  await page.goto('/?lang=en#composition-reading', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#reading-panel pre')).toBeVisible();
  await expect(page.locator('[data-reading-prose] [data-ui-table-region]')).toBeVisible();
  await expect(page.locator('[data-reading-long-inline]')).toBeVisible();

  const readingMetrics = await page.evaluate(() => {
    const pre = document.querySelector<HTMLElement>('#reading-panel pre');
    const tableScroll = document.querySelector<HTMLElement>(
      '[data-reading-prose] [data-ui-table-region]',
    );
    const longInline = document.querySelector<HTMLElement>('[data-reading-long-inline]');
    if (pre === null || tableScroll === null || longInline === null) {
      throw new Error('Reading overflow fixtures are missing');
    }

    return {
      viewportWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      preClientWidth: pre.clientWidth,
      preScrollWidth: pre.scrollWidth,
      tableWidth: tableScroll.getBoundingClientRect().width,
      inlineClientWidth: longInline.clientWidth,
      inlineScrollWidth: longInline.scrollWidth,
    };
  });

  expect(readingMetrics.rootScrollWidth).toBe(readingMetrics.viewportWidth);
  expect(readingMetrics.preScrollWidth).toBeGreaterThan(readingMetrics.preClientWidth);
  expect(readingMetrics.tableWidth).toBeLessThanOrEqual(readingMetrics.viewportWidth);
  expect(readingMetrics.inlineScrollWidth).toBeLessThanOrEqual(readingMetrics.inlineClientWidth);
});

test('overview catalogue searches public component API names', async ({ page }) => {
  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-specimen-search]').fill('UiTooltipSurface');

  const result = page.locator('[data-specimen-catalogue] a[href="#status-feedback-tooltip"]');
  await expect(result).toBeVisible();
  await expect(page.locator('[data-specimen-catalogue] a')).toHaveCount(1);
});

test('Contract Lab renders the component matrix from shared contract metadata', async ({
  page,
}) => {
  await page.goto('/?lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });

  const lab = page.locator('[data-contract-lab]');
  await expect(lab).toBeVisible();
  await expect(lab.locator('[data-contract-summary] > *')).toHaveCount(4);
  await expect(lab.locator('[data-contract-runtime-framework="vue"]')).toBeVisible();
  await expect(lab.locator('[data-contract-runtime-framework="react"]')).toHaveAttribute(
    'href',
    '/react-fixture?lang=en',
  );

  const rows = lab.locator('[data-contract-component]');
  await expect(rows).toHaveCount(contractLabSummary.totalComponents);

  for (const contract of componentContracts) {
    const row = lab.locator(`[data-contract-component="${contract.name}"]`);
    await expect(row).toHaveCount(1);
    await expect(row).toHaveAttribute('data-contract-track', contract.track);
    await expect(row).toHaveAttribute('data-contract-visual', contract.visual);
    await expect(row).toHaveAttribute('data-contract-runtime', contract.runtime);
  }
});

test('interaction contract metadata resolves to stable state fixtures', async ({ page }) => {
  for (const contract of interactionContracts) {
    await page.goto(`/?lang=en#${contract.specimenId}`, { waitUntil: 'domcontentloaded' });
    const specimen = page.locator(`#${contract.specimenId}`);
    await expect(specimen).toBeVisible();

    for (const state of contract.states) {
      await expect(
        specimen.locator(`[data-contract-state="${state}"]`).first(),
        `${contract.specimenId} should expose ${state}`,
      ).toBeVisible();
    }
  }
});

test('control specimens expose the complete interactive state matrix', async ({ page }) => {
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

  const buttonSection = page.locator('#controls-button');
  const requiredStates = ['Default', 'Hover', 'Active', 'Focus', 'Disabled', 'Loading'];
  for (const label of requiredStates) {
    await expect(
      buttonSection.locator(`[data-specimen-state-row][data-specimen-label="${label}"]`),
    ).toBeVisible();
  }

  const disabledButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Disabled"] .ui-button')
    .first();
  await expect(disabledButton).toBeDisabled();

  const loadingButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Loading"] .ui-button')
    .first();
  await expect(loadingButton).toBeDisabled();
  await expect(loadingButton).toHaveAttribute('aria-busy', 'true');

  for (const sectionId of [
    'controls-button',
    'controls-icon-button',
    'controls-action',
    'controls-segmented-control',
  ]) {
    const rows = page.locator(`#${sectionId} [data-specimen-state-row]`);
    const rowCount = await rows.count();
    expect(rowCount, `${sectionId} should expose state specimens`).toBeGreaterThan(0);
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const specimenLabel = await row.getAttribute('data-specimen-label');
      expect(specimenLabel, `${sectionId} state ${index} should have a label`).not.toBeNull();
      await expect(row).toHaveAttribute('aria-label', specimenLabel ?? '');
    }
  }

  const disabledIconButton = page
    .locator('#controls-icon-button [data-specimen-state-row][data-specimen-label="Disabled"]')
    .locator('.ui-button')
    .first();
  await expect(disabledIconButton).toBeDisabled();

  const loadingIconButton = page
    .locator('#controls-icon-button [data-specimen-state-row][data-specimen-label="Loading"]')
    .locator('.ui-button')
    .first();
  await expect(loadingIconButton).toBeDisabled();
  await expect(loadingIconButton).toHaveAttribute('aria-busy', 'true');

  const disabledAction = page
    .locator('#controls-action [data-specimen-state-row][data-specimen-label="Disabled"]')
    .locator('.ui-action')
    .first();
  await expect(disabledAction).toHaveAttribute('aria-disabled', 'true');
  await expect(disabledAction).toHaveAttribute('tabindex', '-1');
  await expect(disabledAction).not.toHaveAttribute('href');

  const disabledSegments = page
    .locator(
      '#controls-segmented-control [data-specimen-state-row][data-specimen-label="Disabled"] .ui-segmented-control',
    )
    .first();
  await expect(disabledSegments).toHaveAttribute('aria-disabled', 'true');
  await expect(disabledSegments.locator('[role="radio"]')).toHaveCount(3);
  await expect(disabledSegments.locator('[role="radio"]:disabled')).toHaveCount(3);

  const loadingSegments = page
    .locator(
      '#controls-segmented-control [data-specimen-state-row][data-specimen-label="Loading"] .ui-segmented-control',
    )
    .first();
  await expect(loadingSegments).toHaveAttribute('aria-busy', 'true');
  await expect(loadingSegments.locator('[role="radio"]:disabled')).toHaveCount(3);

  const focusButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Focus"] .ui-button')
    .first();
  await focusButton.focus();
  const focusStyle = await focusButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, shadow: style.boxShadow };
  });
  expect(focusStyle.outline !== 'none' || focusStyle.shadow !== 'none').toBe(true);

  const hoverButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Hover"] .ui-button')
    .first();
  await hoverButton.hover();
  await expect(hoverButton).toBeVisible();
});

test('default cards keep a visible material fill in light and dark themes', async ({ page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#card`, { waitUntil: 'domcontentloaded' });

    const card = page.locator('[data-card-default]');
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    const backgroundColor = await card.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');

    const elevated = page.locator('#card-card .ui-card[data-surface="elevated"]');
    const elevatedStyle = await elevated.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(elevatedStyle.borderWidth).toBe('0px');
    expect(elevatedStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(elevatedStyle.boxShadow).not.toBe('none');

    const optOut = page.locator('[data-card-transparent-optout]');
    await expect(optOut).toHaveAttribute('data-surface', 'none');

    const optOutShell = optOut.locator('..');
    const shellStyle = await optOutShell.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(shellStyle.borderWidth).toBe('0px');
    expect(shellStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('surface presets expose their native material without preview-only hairline borders', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#materials-surface`, {
      waitUntil: 'domcontentloaded',
    });

    for (const preset of ['solid', 'subtle', 'elevated', 'inset'] as const) {
      const surface = page.locator(`[data-surface-preset="${preset}"]`);
      await expect(surface).toBeVisible();
      const metrics = await surface.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          borderWidth: style.borderTopWidth,
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          boxShadow: style.boxShadow,
        };
      });

      expect(metrics.borderWidth).toBe('0px');
      expect(
        metrics.backgroundColor !== 'rgba(0, 0, 0, 0)' || metrics.backgroundImage !== 'none',
      ).toBe(true);

      if (preset === 'elevated' || preset === 'inset') {
        expect(metrics.boxShadow).not.toBe('none');
      }
    }
  }
});

test('in-page module anchors do not reset the workspace scroll position', async ({ page }) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  const workspace = page.locator('[data-design-lab-workspace]');
  await workspace.evaluate((element) => element.scrollTo({ top: 900, behavior: 'auto' }));
  await page.evaluate(() => {
    window.location.hash = 'controls-action';
  });
  await page.waitForTimeout(100);

  expect(await workspace.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  await expect(page).toHaveURL(/#controls-action$/);
});

test('specimen preview links do not navigate or reset the workspace scroll', async ({ page }) => {
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
  // Fonts can finish loading after DOMContentLoaded and change the Controls
  // specimen heights. Native scroll anchoring then adjusts scrollTop even
  // without a click; establish the final layout before measuring navigation.
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  const workspace = page.locator('[data-design-lab-workspace]');
  const samples = [
    page.locator('#controls-action a[href="#controls-action"]').first(),
    page.locator('#controls-navigation-item a[href="#controls-navigation-item"]').first(),
    page.locator('#controls-breadcrumb a[href="#top"]').first(),
  ];

  for (const sample of samples) {
    await sample.scrollIntoViewIfNeeded();
    await sample.click({ trial: true });
    const before = await workspace.evaluate((element) => element.scrollTop);
    expect(before).toBeGreaterThan(100);
    // Avoid Playwright's second auto-scroll: only the anchor's click handler
    // should be allowed to change the workspace position in this assertion.
    await sample.evaluate((element) => (element as HTMLElement).click());
    await expect(page).toHaveURL(/#controls$/);
    const after = await workspace.evaluate((element) => element.scrollTop);
    expect(after).toBeGreaterThan(100);
    // Native scroll anchoring may shift a few pixels while late assets settle.
    // An actual placeholder jump or scroll reset is substantially larger.
    expect(Math.abs(after - before)).toBeLessThanOrEqual(64);
  }
});

test('real section navigation still follows its anchor', async ({ page }) => {
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
  await page
    .locator('nav.playground-floating-interaction-surface a[href="#controls-action"]')
    .click();
  await expect(page).toHaveURL(/#controls-action$/);
  await expect(page.locator('#controls-action')).toBeInViewport();
});

test('reading composition keeps its real cross-module link', async ({ page }) => {
  await page.goto('/?lang=en#composition', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-reading-surface-link]').click();
  await expect(page).toHaveURL(/#materials-surface$/);
  await expect(page.locator('#materials-surface')).toBeVisible();
});

test('composition preview actions do not navigate to placeholder anchors', async ({ page }) => {
  await page.goto('/?lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });
  const sample = page.locator('[data-consumer-parity="hero-actions"] a').first();
  await sample.click();
  await expect(page).toHaveURL(/#consumer-parity$/);
});

test('mobile playground header preserves title width and stays within the viewport', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

    const metrics = await page.evaluate(() => {
      const title = document.querySelector<HTMLElement>('#module-title');
      const header = document.querySelector<HTMLElement>('[data-playground-page] > header');
      if (title === null || header === null) {
        throw new Error('Playground mobile header fixtures are missing');
      }

      return {
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
        titleClientWidth: title.clientWidth,
        titleScrollWidth: title.scrollWidth,
        headerRight: header.getBoundingClientRect().right,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(metrics.documentOverflow, `document overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.bodyOverflow, `body overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.titleClientWidth, `title width at ${width}px`).toBeGreaterThan(80);
    expect(
      metrics.titleScrollWidth - metrics.titleClientWidth,
      `title truncation at ${width}px`,
    ).toBeLessThanOrEqual(1);
    expect(metrics.headerRight, `header edge at ${width}px`).toBeLessThanOrEqual(
      metrics.viewportWidth,
    );
    await expect(page.locator('[data-back-to-overview]')).toBeHidden();
  }
});

test('drawer content and scrim opening share the same enter and exit transform', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: ':root { --neoverse-motion-duration-standard: 1000ms; }' });

  const sampleTransition = async (opening: boolean) =>
    page.evaluate(async (opening) => {
      const shell = document.querySelector<HTMLElement>('.playground-shell');
      const navigation = document.querySelector<HTMLElement>('#design-lab-navigation');
      const title = navigation?.querySelector<HTMLElement>('h1');
      const trigger = document.querySelector<HTMLElement>('[data-playground-nav-trigger]');
      const close = navigation?.querySelector<HTMLElement>('button');
      if (!shell || !navigation || !title || !trigger || !close) {
        throw new Error('Drawer animation fixtures are missing');
      }
      const titleOffset = title.getBoundingClientRect().x - navigation.getBoundingClientRect().x;
      (opening ? trigger : close).click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const ownAnimations = (element: HTMLElement) =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect instanceof KeyframeEffect && animation.effect.target === element,
          );
      const transform = (element: HTMLElement) =>
        ownAnimations(element).find(
          (animation) =>
            animation instanceof CSSTransition && animation.transitionProperty === 'transform',
        );
      const drawerAnimation = transform(navigation);
      const scrimAnimation = transform(shell);
      if (!drawerAnimation || !scrimAnimation) {
        return { animating: false, titleOffset, frames: [] };
      }
      const animations = [...ownAnimations(navigation), ...ownAnimations(shell)];
      animations.forEach((animation) => {
        animation.pause();
      });
      const frames = [];
      for (const time of [0, 250, 500, 1000]) {
        animations.forEach((animation) => {
          animation.currentTime = time;
        });
        await new Promise(requestAnimationFrame);
        const bounds = navigation.getBoundingClientRect();
        const scrim = getComputedStyle(shell, '::after');
        frames.push({
          x: bounds.x,
          titleX: title.getBoundingClientRect().x,
          scrimX: Number.parseFloat(scrim.left) + new DOMMatrixReadOnly(scrim.transform).m41,
        });
      }
      animations.forEach((animation) => {
        animation.finish();
      });
      return { animating: true, titleOffset, frames };
    }, opening);

  for (const opening of [true, false]) {
    const transition = await sampleTransition(opening);
    expect(transition.animating, 'both the drawer and the scrim must animate').toBe(true);
    expect(transition.frames).toHaveLength(4);
    for (const frame of transition.frames) {
      expect(frame.x).toBeCloseTo(frame.scrimX, 1);
      expect(frame.titleX - frame.x).toBeCloseTo(transition.titleOffset, 1);
    }
    const first = transition.frames[0];
    const last = transition.frames[3];
    if (!first || !last) throw new Error('Drawer animation samples are missing');
    if (opening) {
      expect(first.titleX).toBeLessThan(0);
      expect(first.x).toBeLessThan(last.x);
    } else {
      expect(last.titleX).toBeLessThan(0);
      expect(last.x).toBeLessThan(first.x);
    }
  }
});
