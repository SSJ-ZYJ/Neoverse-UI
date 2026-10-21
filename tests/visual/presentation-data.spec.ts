import { expect, test } from '@playwright/test';

const freezeMotion = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
`;

const nextPaint = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

test('presentation data components / counts, connectors, themes, and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en&visual-fixture=1#data-display', {
    waitUntil: 'domcontentloaded',
  });
  await page.addStyleTag({ content: freezeMotion });
  await page.evaluate(() => document.fonts.ready);

  const fixture = page.locator('[data-presentation-visual-fixture]');
  await expect(fixture).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  const minimumMetrics = fixture.locator('[data-stat-variation="minimum"] .ui-stat-card');
  const maximumMetrics = fixture.locator('[data-stat-variation="maximum"] .ui-stat-card');
  await expect(minimumMetrics).toHaveCount(2);
  await expect(maximumMetrics).toHaveCount(4);
  for (const card of await fixture.locator('.ui-stat-card').all()) {
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    await expect(card).toHaveClass(/material-glass-elevated/);
  }
  for (const grid of await fixture.locator('.ui-stat-grid').all()) {
    expect(await grid.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
  }

  const minimumTimeline = fixture.locator('[data-timeline-variation="minimum"] .ui-timeline');
  const maximumTimeline = fixture.locator('[data-timeline-variation="maximum"] .ui-timeline');
  await expect(minimumTimeline.locator(':scope > .ui-timeline__item')).toHaveCount(2);
  await expect(maximumTimeline.locator(':scope > .ui-timeline__item')).toHaveCount(10);
  expect(
    await maximumTimeline.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);

  const timelineGeometry = await maximumTimeline.evaluate((list) => {
    const items = [...list.querySelectorAll<HTMLElement>(':scope > .ui-timeline__item')];
    return items.map((item, index) => {
      const node = item.querySelector<HTMLElement>('.ui-timeline__node');
      if (node === null) throw new Error('Timeline item is missing its node');
      const itemBox = item.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      const line = getComputedStyle(item, '::before');
      const hasLine = line.content !== 'none' && line.content !== 'normal';
      return {
        index,
        hasLine,
        nodeCenterX: nodeBox.left + nodeBox.width / 2,
        nodeCenterY: nodeBox.top + nodeBox.height / 2,
        lineCenterX:
          itemBox.left + Number.parseFloat(line.left) + Number.parseFloat(line.width) / 2,
        lineStartY: itemBox.top + Number.parseFloat(line.top),
        lineEndY: itemBox.bottom - Number.parseFloat(line.bottom),
        nextNodeCenterY: (() => {
          const nextNode = items[index + 1]?.querySelector<HTMLElement>('.ui-timeline__node');
          if (nextNode === null || nextNode === undefined) return undefined;
          const nextNodeBox = nextNode.getBoundingClientRect();
          return nextNodeBox.top + nextNodeBox.height / 2;
        })(),
      };
    });
  });
  for (const segment of timelineGeometry.slice(0, -1)) {
    expect(segment.hasLine, `timeline item ${segment.index + 1} has a connector`).toBe(true);
    expect(Math.abs(segment.lineCenterX - segment.nodeCenterX)).toBeLessThan(0.75);
    expect(Math.abs(segment.lineStartY - segment.nodeCenterY)).toBeLessThan(0.75);
    expect(segment.nextNodeCenterY).toBeDefined();
    expect(Math.abs(segment.lineEndY - (segment.nextNodeCenterY ?? 0))).toBeLessThan(0.75);
  }
  expect(timelineGeometry.at(-1)?.hasLine).toBe(false);

  const minimumSteps = fixture.locator('[data-step-variation="minimum"] .ui-step-flow');
  const maximumSteps = fixture.locator('[data-step-variation="maximum"] .ui-step-flow');
  await expect(minimumSteps.locator(':scope > .ui-step-flow__item')).toHaveCount(2);
  await expect(maximumSteps.locator(':scope > .ui-step-flow__item')).toHaveCount(6);
  for (const flow of [minimumSteps, maximumSteps]) {
    expect(await flow.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
  }

  const readStepFlow = async (list: typeof minimumSteps) =>
    list.evaluate((element) => {
      const items = [...element.querySelectorAll<HTMLElement>(':scope > .ui-step-flow__item')];
      const boxes = items.map((item) => item.getBoundingClientRect());
      const marker = items[0]?.querySelector<HTMLElement>('.ui-step-flow__marker');
      if (items[0] === undefined || marker === null || marker === undefined) {
        throw new Error('Step flow marker is missing');
      }
      const item = items[0];
      const itemBox = item.getBoundingClientRect();
      const markerBox = marker.getBoundingClientRect();
      const connector = getComputedStyle(item, '::after');
      return {
        width: element.getBoundingClientRect().width,
        itemBoxes: boxes.map(({ x, y }) => ({ x, y })),
        markerCenterX: markerBox.left + markerBox.width / 2,
        markerCenterY: markerBox.top + markerBox.height / 2,
        connectorCenterX:
          itemBox.left + Number.parseFloat(connector.left) + Number.parseFloat(connector.width) / 2,
        connectorCenterY:
          itemBox.top + Number.parseFloat(connector.top) + Number.parseFloat(connector.height) / 2,
        connectorWidth: Number.parseFloat(connector.width),
        connectorHeight: Number.parseFloat(connector.height),
      };
    });

  const narrowFlow = await readStepFlow(minimumSteps);
  expect(narrowFlow.itemBoxes[1]?.y).toBeGreaterThan(narrowFlow.itemBoxes[0]?.y ?? 0);
  expect(Math.abs(narrowFlow.connectorCenterX - narrowFlow.markerCenterX)).toBeLessThan(0.75);
  expect(narrowFlow.connectorHeight).toBeGreaterThan(narrowFlow.connectorWidth);

  const wideFlow = await readStepFlow(maximumSteps);
  const shouldBeHorizontal = test.info().project.name === 'desktop';
  if (shouldBeHorizontal) {
    expect(wideFlow.width).toBeGreaterThanOrEqual(768);
    for (const box of wideFlow.itemBoxes.slice(1)) {
      expect(Math.abs(box.y - (wideFlow.itemBoxes[0]?.y ?? 0))).toBeLessThan(1);
    }
    expect(wideFlow.connectorWidth).toBeGreaterThan(wideFlow.connectorHeight);
    expect(Math.abs(wideFlow.connectorCenterY - wideFlow.markerCenterY)).toBeLessThan(0.75);
  } else {
    expect(wideFlow.itemBoxes[1]?.y).toBeGreaterThan(wideFlow.itemBoxes[0]?.y ?? 0);
    expect(wideFlow.connectorHeight).toBeGreaterThan(wideFlow.connectorWidth);
    expect(Math.abs(wideFlow.connectorCenterX - wideFlow.markerCenterX)).toBeLessThan(0.75);
  }

  await expect(fixture).toHaveScreenshot('presentation-data-light.png');

  const root = page.locator('html');
  await root.evaluate((element) => {
    element.dataset.theme = 'dark';
  });
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(nextPaint);
  await expect(fixture).toHaveScreenshot('presentation-data-dark.png');

  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await root.evaluate((element) => element.removeAttribute('data-theme'));
  await expect(root).not.toHaveAttribute('data-theme');
  await page.evaluate(nextPaint);
  await expect(fixture).toHaveScreenshot('presentation-data-system-dark.png');

  await root.evaluate((element) => {
    element.dataset.theme = 'light';
  });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await root.evaluate((element) => element.removeAttribute('data-theme'));
  await expect(root).not.toHaveAttribute('data-theme');
  await page.evaluate(nextPaint);
  await expect(fixture).toHaveScreenshot('presentation-data-system-light.png');
});
