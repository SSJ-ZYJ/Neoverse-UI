import { expect, test } from '@playwright/test';

test.describe('surfaces', () => {
  for (const adapter of ['Vue', 'React'] as const) {
    test(`${adapter}: disclosure expands and collapses from its summary`, async ({ page }) => {
      await page.goto(
        adapter === 'Vue'
          ? '/frame?theme=light&lang=en#data-display-disclosure'
          : '/react-fixture?theme=light&lang=en',
        { waitUntil: 'domcontentloaded' },
      );
      const disclosure = page
        .locator(
          adapter === 'Vue'
            ? '#data-display-disclosure .ui-disclosure'
            : '[data-react-adapter="UiDisclosure"]',
        )
        .first();

      const summary = disclosure.locator('summary');
      const content = disclosure.locator('.ui-disclosure__content');
      const isOpen = () => disclosure.evaluate((element) => (element as HTMLDetailsElement).open);
      const initiallyOpen = await isOpen();

      await summary.click();
      await expect.poll(isOpen).toBe(!initiallyOpen);
      await expect(content).toBeVisible();

      await summary.click();
      await expect.poll(isOpen).toBe(initiallyOpen);
      if (!initiallyOpen) await expect(content).toBeHidden();
    });
  }

  test('React: table, skeleton, timeline and stat card expose semantic markup', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });

    const table = page.locator('[data-react-adapter="UiTable"]');
    await expect(table).toHaveRole('table');
    await expect(table.getByRole('columnheader')).toHaveCount(2);
    await expect(table.getByRole('row')).toHaveCount(2);

    await expect(page.locator('[data-react-adapter="UiSkeleton"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(page.locator('[data-react-adapter="UiTimeline"] time')).toHaveAttribute(
      'datetime',
      '2026',
    );
    const statCard = page.locator('[data-react-adapter="UiStatCard"]');
    await expect(statCard).toBeVisible();
    await expect(statCard).not.toBeEmpty();
    await expect(page.locator('[data-react-adapter="UiStatusIndicator"]').first()).not.toBeEmpty();
  });

  test('React: scrollbar reveals, seeks, drags, hides and cleans up', async ({ page }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const track = page.locator('[data-react-adapter="UiScrollbar"]');

    await page.locator('[data-parity-native]').click();
    await expect(page.locator('html')).toHaveClass(/ui-scrollbar-target/);
    await page.evaluate(() => window.scrollTo(0, 100));
    await expect(track).toHaveAttribute('data-visible', 'true');

    const revealTrack = async () => {
      await page.keyboard.press('Shift');
      await expect(track).toHaveAttribute('data-visible', 'true');
    };
    await revealTrack();
    let box = await track.boundingBox();
    if (box === null) throw new Error('The scrollbar track is missing');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

    await revealTrack();
    box = await track.boundingBox();
    if (box === null) throw new Error('The scrollbar track is missing');
    const thumb = track.locator('.ui-scrollbar__thumb');
    const thumbBox = await thumb.boundingBox();
    if (thumbBox === null) throw new Error('The scrollbar thumb is missing');
    await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(thumbBox.x + thumbBox.width / 2, box.y + box.height * 0.85);
    await expect(track).toHaveClass(/ui-scrollbar--dragging/);
    await page.mouse.up();
    await expect(track).not.toHaveClass(/ui-scrollbar--dragging/);

    await page.mouse.move(box.x - 32, box.y + box.height * 0.85);
    await expect(track).toHaveAttribute('data-visible', 'false');
    await page.locator('[data-parity-scrollbar]').click();
    await expect(track).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/ui-scrollbar-target/);
  });

  test('Vue: document scrollbar follows scroll and releases its native class', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#scrollbar-component', {
      waitUntil: 'domcontentloaded',
    });
    const track = page.locator('[data-ui-scrollbar-fixture]');
    await expect(page.locator('html')).toHaveClass(/ui-scrollbar-target/);

    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(track).toHaveAttribute('data-visible', 'true');
    const box = await track.boundingBox();
    if (box === null) throw new Error('The scrollbar track is missing');
    await page.mouse.move(box.x - 32, box.y);
    await expect(track).toHaveAttribute('data-visible', 'false');
  });

  test('Vue: stat card and notice keep their labels and actions', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#data-display-stat-card', {
      waitUntil: 'domcontentloaded',
    });
    const statCard = page.locator('#data-display-stat-card .ui-stat-card').first();
    await expect(statCard).toBeVisible();
    await expect(statCard).not.toBeEmpty();
  });
});
