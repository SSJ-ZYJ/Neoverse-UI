import { expect, test } from '../support/e2e';

test.describe('surfaces', () => {
  for (const adapter of ['Vue', 'React'] as const) {
    test(`${adapter}: selected plates disable spatial animation when motion is reduced`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(
        adapter === 'Vue'
          ? '/frame?theme=dark&lang=en#data-display-tabs'
          : '/react-fixture?theme=dark&lang=en',
      );
      for (const [component, indicatorClass] of [
        ['UiTabs', '.ui-tabs__indicator'],
        ['UiPagination', '.ui-pagination__indicator'],
      ] as const) {
        const selector =
          adapter === 'Vue'
            ? component === 'UiTabs'
              ? '#data-display-tabs'
              : '#data-display-pagination'
            : `[data-react-adapter="${component}"]`;
        const indicator = page.locator(selector).locator(indicatorClass);
        await expect(indicator).toHaveAttribute('data-ready', 'true');
        await expect(indicator).toHaveCSS('transition-duration', '0s');
      }
    });
    for (const theme of ['light', 'dark'] as const) {
      test(`${adapter}: tabs skip disabled sections and reveal the matching panel / ${theme}`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(
          adapter === 'Vue'
            ? `/frame?theme=${theme}&lang=en#data-display-tabs`
            : `/react-fixture?theme=${theme}&lang=en`,
        );
        const tabs = page.locator(
          adapter === 'Vue' ? '#data-display-tabs .ui-tabs' : '[data-react-adapter="UiTabs"]',
        );
        const indicator = tabs.locator('.ui-tabs__indicator');
        await expect(indicator).toHaveAttribute('data-ready', 'true');
        const initialOffset = await indicator.evaluate((element) =>
          Number.parseFloat(element.style.getPropertyValue('--neoverse-selection-offset')),
        );
        await expect(indicator).toHaveCSS('opacity', '1');
        await expect(indicator).not.toHaveCSS('background-image', 'none');
        const activeTab = tabs.locator('[role="tab"][aria-selected="true"]');
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        // Compare the final plate with the tab after any resize from font loading.
        await expect(async () => {
          const [indicatorBox, activeBox] = await Promise.all([
            indicator.boundingBox(),
            activeTab.boundingBox(),
          ]);
          expect(indicatorBox).not.toBeNull();
          expect(activeBox).not.toBeNull();
          if (indicatorBox !== null && activeBox !== null) {
            // Glass content positioning must not turn the selection plate into a
            // flex item: that shifts both the tabs and the plate out of the tab.
            expect(Math.abs(indicatorBox.x - activeBox.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(indicatorBox.y - activeBox.y)).toBeLessThanOrEqual(1);
            expect(
              Math.abs(
                indicatorBox.x + indicatorBox.width / 2 - (activeBox.x + activeBox.width / 2),
              ),
            ).toBeLessThanOrEqual(1);
          }
        }).toPass({ timeout: 2_000 });
        expect(
          await indicator.evaluate((element) =>
            getComputedStyle(element)
              .transitionDuration.split(',')
              .some((duration) => Number.parseFloat(duration) > 0),
          ),
        ).toBe(true);
        const overview = tabs.getByRole('tab', { name: /Overview/ });
        await overview.focus();
        await page.keyboard.press('ArrowRight');
        await expect(tabs.getByRole('tab', { name: /Activity/ })).toHaveAttribute(
          'aria-selected',
          'true',
        );
        await expect(tabs.getByRole('tab', { name: /Blocked|Disabled/ })).toBeDisabled();
        await expect(tabs.getByRole('tabpanel')).toContainText('activity');
        await expect
          .poll(() =>
            indicator.evaluate((element) =>
              Number.parseFloat(element.style.getPropertyValue('--neoverse-selection-offset')),
            ),
          )
          .toBeGreaterThan(initialOffset);
      });
      test(`${adapter}: pagination moves between pages without leaving the valid range / ${theme}`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(
          adapter === 'Vue'
            ? `/frame?theme=${theme}&lang=en#data-display-pagination`
            : `/react-fixture?theme=${theme}&lang=en`,
        );
        const pagination = page.locator(
          adapter === 'Vue'
            ? '#data-display-pagination .ui-pagination'
            : '[data-react-adapter="UiPagination"]',
        );
        const indicator = pagination.locator('.ui-pagination__indicator');
        await expect(indicator).toHaveAttribute('data-ready', 'true');
        const initialOffset = await indicator.evaluate((element) =>
          Number.parseFloat(element.style.getPropertyValue('--neoverse-selection-offset')),
        );
        await expect(indicator).toHaveCSS('opacity', '1');
        await expect(indicator).not.toHaveCSS('background-image', 'none');
        const [paginationBox, parentBox, ellipsisBox, firstPageBox] = await Promise.all([
          pagination.boundingBox(),
          pagination.evaluate((element) => {
            const rect = element.parentElement?.getBoundingClientRect();
            return rect === undefined
              ? null
              : { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }),
          pagination.locator('.ui-pagination__ellipsis').boundingBox(),
          pagination.locator('.ui-pagination__button[aria-label^="Page"]').first().boundingBox(),
        ]);
        expect(paginationBox).not.toBeNull();
        expect(parentBox).not.toBeNull();
        if (paginationBox !== null && parentBox !== null) {
          // The component centers its own cluster instead of relying on the host
          // to align a full-width nav.
          expect(
            Math.abs(
              paginationBox.x + paginationBox.width / 2 - (parentBox.x + parentBox.width / 2),
            ),
          ).toBeLessThanOrEqual(1);
        }
        expect(ellipsisBox).not.toBeNull();
        expect(firstPageBox).not.toBeNull();
        if (ellipsisBox !== null && firstPageBox !== null) {
          // The ellipsis occupies a centered page-sized slot so the visible page
          // sequence stays on one aligned grid.
          expect(Math.abs(ellipsisBox.width - firstPageBox.width)).toBeLessThanOrEqual(1);
          expect(Math.abs(ellipsisBox.height - firstPageBox.height)).toBeLessThanOrEqual(1);
        }
        expect(
          await indicator.evaluate((element) =>
            getComputedStyle(element)
              .transitionDuration.split(',')
              .some((duration) => Number.parseFloat(duration) > 0),
          ),
        ).toBe(true);
        await pagination.getByRole('button', { name: /Next page/ }).click();
        await expect(pagination.getByRole('button', { name: /Page 5/ })).toHaveAttribute(
          'aria-current',
          'page',
        );
        await expect
          .poll(() =>
            indicator.evaluate((element) =>
              Number.parseFloat(element.style.getPropertyValue('--neoverse-selection-offset')),
            ),
          )
          .toBeGreaterThan(initialOffset);
      });
    }
    test(`${adapter}: avatar announces identity and displays initial fallback`, async ({
      page,
    }) => {
      await page.goto(
        adapter === 'Vue'
          ? '/frame?theme=light&lang=en#data-display-avatar'
          : '/react-fixture?theme=light&lang=en',
      );
      const avatar = page
        .locator(
          adapter === 'Vue' ? '#data-display-avatar .ui-avatar' : '[data-react-adapter="UiAvatar"]',
        )
        .first();
      await expect(avatar).toHaveRole('img');
      await expect(avatar).toHaveAttribute('aria-label', 'Shenshijun');
      await expect(avatar.locator('.ui-avatar__fallback')).toHaveText('SSJ');
      const circle =
        adapter === 'Vue'
          ? page.locator('#data-display-avatar [data-avatar-sample]')
          : page.locator('[data-avatar-sample]');
      const rounded =
        adapter === 'Vue'
          ? page.locator('#data-display-avatar [data-avatar-rounded]')
          : page.locator('[data-react-adapter="UiAvatar"]');
      await expect(circle).toHaveClass(/ui-avatar--circle/);
      await expect(circle).toHaveCSS('border-radius', '9999px');
      await expect(rounded).toHaveClass(/ui-avatar--rounded/);
      await expect(rounded).toHaveCSS('border-radius', '8px');
    });
  }
  test('Vue: empty state exposes its title and creation action', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#data-display-empty-state');
    const state = page.locator('#data-display-empty-state .ui-empty-state');
    await expect(state.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
    await expect(state.getByRole('button', { name: 'Create project' })).toBeVisible();
  });
  test('React: empty state exposes its action and accessible title', async ({ page }) => {
    await page.goto('/react-fixture?theme=dark&lang=en');
    const state = page.locator('[data-react-adapter="UiEmptyState"]');
    const heading = state.getByRole('heading', { name: 'No projects yet' });
    await expect(heading).toBeVisible();
    expect(await state.getAttribute('aria-labelledby')).toBe(await heading.getAttribute('id'));
    await expect(state.getByRole('button', { name: 'Create project' })).toBeVisible();
  });
  for (const theme of ['light', 'dark'] as const) {
    test(`Vue: colored QA target does not intersect the reference card lower rim / ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#card`);
      const stage = page.locator('[data-card-qa] [data-qa-stage="gradient"]');
      await stage.scrollIntoViewIfNeeded();
      const gap = await stage.evaluate((element) => {
        const card = element.querySelector('.ui-card');
        if (!card) throw new Error('Missing reference card');
        const circle = /circle at 72% ([0-9.]+)%.*? ([0-9.]+)px/.exec(
          getComputedStyle(element).backgroundImage,
        );
        if (!circle) throw new Error('Missing QA colored backdrop target');
        const stageRect = element.getBoundingClientRect();
        return (
          stageRect.top +
          (stageRect.height * Number(circle[1])) / 100 -
          Number(circle[2]) -
          card.getBoundingClientRect().bottom
        );
      });
      expect(gap).toBeGreaterThan(0);
    });
  }
  for (const adapter of ['Vue', 'React'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${adapter}: disclosure expands and collapses from its summary / ${theme}`, async ({
        page,
      }) => {
        await page.goto(
          adapter === 'Vue'
            ? `/frame?theme=${theme}&lang=en#data-display-disclosure`
            : `/react-fixture?theme=${theme}&lang=en`,
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

        if (theme === 'dark') {
          const edge = await disclosure.evaluate((element) => getComputedStyle(element).boxShadow);
          // The disclosure shares the directional dark edge with other inset
          // glass; a uniform inset ring is the regression this guards.
          expect(edge).not.toContain('0px 0px 0px 1px inset');
          expect(edge).toContain('inset');
        }

        await summary.click();
        await expect.poll(isOpen).toBe(!initiallyOpen);
        await expect(content).toBeVisible();

        await summary.click();
        await expect.poll(isOpen).toBe(initiallyOpen);
        if (!initiallyOpen) await expect(content).toBeHidden();
      });
    }
  }

  test('React: table, skeleton, timeline and stat card expose semantic markup', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');

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
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');
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
    await page.goto('/frame?theme=light&lang=en#scrollbar-component');
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
    await page.goto('/frame?theme=light&lang=en#data-display-stat-card');
    const statCard = page.locator('#data-display-stat-card .ui-stat-card').first();
    await expect(statCard).toBeVisible();
    await expect(statCard).not.toBeEmpty();
  });
});
