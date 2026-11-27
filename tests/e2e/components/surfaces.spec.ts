import { expect, test } from '../../support/e2e';

test.describe('surfaces', () => {
  for (const adapter of ['Vue', 'React'] as const) {
    test(`${adapter}: grouped controls animate scale only when motion is allowed`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(
        adapter === 'Vue'
          ? '/frame?theme=light&lang=en#dock'
          : '/react-fixture?theme=light&lang=en',
      );
      const dock = page.locator(
        adapter === 'Vue'
          ? '[data-dock-specimen="standard"] .ui-dock'
          : '[data-react-adapter="UiDock"]',
      );
      await expect(dock).toHaveCSS(
        'transition-property',
        'background-color, border-color, box-shadow, zoom',
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(dock).toHaveCSS(
        'transition-property',
        'background-color, border-color, box-shadow',
      );

      if (adapter === 'Vue') {
        await page.goto('/frame?theme=light&lang=en#controls-surface');
      }
      const surface = page
        .locator(
          adapter === 'Vue'
            ? '#controls-surface .ui-control-surface[data-surface="none"]'
            : '[data-dock-section]',
        )
        .first();
      await expect(surface).toHaveCSS('transition-duration', '0s');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(surface).toHaveCSS('transition-property', 'zoom');
      await expect(surface).not.toHaveCSS('transition-duration', '0s');
    });
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
              ? '#data-display-tabs [data-tabs-sample="glass"]'
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
          adapter === 'Vue'
            ? '#data-display-tabs [data-tabs-sample="glass"]'
            : '[data-react-adapter="UiTabs"]',
        );
        const indicator = tabs.locator('.ui-tabs__indicator');
        await expect(indicator).toHaveAttribute('data-ready', 'true');
        const initialOffset = await indicator.evaluate((element) =>
          Number.parseFloat(element.style.getPropertyValue('--neoverse-selection-offset')),
        );
        await expect(indicator).toHaveCSS('opacity', '1');
        await expect(indicator).not.toHaveCSS('background-image', 'none');
        await expect(indicator).toHaveCSS('backdrop-filter', /blur\(12px\)/);
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
      test(`${adapter}: tabs keep a visible underline or pill on the selected section / ${theme}`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(
          adapter === 'Vue'
            ? `/frame?theme=${theme}&lang=en#data-display-tabs`
            : `/react-fixture?theme=${theme}&lang=en`,
        );
        for (const variant of ['underline', 'pill'] as const) {
          const tabs = page.locator(`[data-tabs-sample="${variant}"]`);
          const list = tabs.getByRole('tablist');
          const indicator = list.locator('.ui-tabs__indicator');
          await expect(list).toHaveCSS('backdrop-filter', 'none');
          await expect(indicator).toHaveCSS('backdrop-filter', 'none');
          await expect(indicator).toHaveCSS('opacity', '1');
          if (variant === 'underline') {
            await expect(list).toHaveCSS('border-bottom-style', 'solid');
            await expect(indicator).toHaveCSS('height', '2px');
            const inactive = list.getByRole('tab', { selected: false }).last();
            if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
              const restingFill = await inactive.evaluate((tab) => {
                return getComputedStyle(tab).backgroundColor;
              });
              await inactive.hover();
              await expect(inactive).not.toHaveCSS('background-color', restingFill);
            }
            await expect(inactive).not.toHaveCSS('border-radius', '0px');
          }
          await expect(indicator).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
          await expect(indicator).not.toHaveCSS('border-radius', '0px');
          await list.getByRole('tab', { selected: true }).focus();
          await page.keyboard.press('ArrowRight');
          const active = list.getByRole('tab', { selected: true });
          await expect(active).toBeFocused();
          await expect(tabs.getByRole('tabpanel')).toHaveText('activity');
          await expect(async () => {
            const [marker, tab] = await Promise.all([
              indicator.boundingBox(),
              active.boundingBox(),
            ]);
            if (!marker || !tab) throw new Error('Selected tab and marker must be visible');
            expect(Math.abs(marker.x - tab.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(marker.width - tab.width)).toBeLessThanOrEqual(1);
            const bottomOffset = marker.y + marker.height - (tab.y + tab.height);
            expect(Math.abs(bottomOffset)).toBeLessThanOrEqual(1);
          }).toPass({ timeout: 2_000 });
        }
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
        await expect(indicator).toHaveCSS('backdrop-filter', /blur\(12px\)/);
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

      // The placeholder icon is a centered neutral glyph, not initials.
      const iconAvatar = page
        .locator(
          adapter === 'Vue' ? '#data-display-avatar [data-avatar-icon]' : '[data-avatar-icon]',
        )
        .first();
      await expect(iconAvatar.locator('.ui-avatar__icon svg')).toBeVisible();
      await expect(iconAvatar.locator('.ui-avatar__fallback')).toHaveCount(0);
      await expect(iconAvatar).toHaveAttribute('aria-label', 'Anonymous');
      const centering = await iconAvatar.evaluate((element) => {
        const glyph = element.querySelector('.ui-avatar__icon svg');
        if (!glyph) throw new Error('Missing placeholder glyph');
        const box = element.getBoundingClientRect();
        const rect = glyph.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - (box.left + box.width / 2),
          y: rect.top + rect.height / 2 - (box.top + box.height / 2),
        };
      });
      expect(Math.abs(centering.x)).toBeLessThan(1);
      expect(Math.abs(centering.y)).toBeLessThan(1);
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
  for (const adapter of ['Vue', 'React'] as const) {
    test(`${adapter}: empty states render distinct boundary, density, and background treatments`, async ({
      page,
    }) => {
      await page.goto(
        adapter === 'Vue'
          ? '/frame?theme=light&lang=en#data-display-empty-state'
          : '/react-fixture?theme=dark&lang=en',
      );
      const standard = page.locator('[data-empty-state-sample="onboarding"]');
      const outlined = page.locator('[data-empty-state-sample="search"]');
      const compact = page.locator('[data-empty-state-sample="activity"]');
      const subtle = page.locator('[data-empty-state-sample="access"]');
      await expect(standard).not.toHaveCSS('min-height', '0px');
      await expect(standard).toHaveCSS('border-top-style', 'solid');
      await expect(standard.getByRole('heading')).toHaveCSS('text-align', 'center');
      await expect(standard).toHaveCSS('backdrop-filter', /blur\(18px\)/);
      const icon = standard.locator('.ui-empty-state__icon');
      await expect(icon).toHaveCSS('border-top-width', '1px');
      await expect(icon).toHaveCSS('border-top-style', 'solid');
      await expect(icon).not.toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
      await expect(outlined).toHaveCSS('border-top-style', 'dashed');
      await expect(outlined).toHaveCSS('border-top-width', '2px');
      await expect(compact).toHaveCSS('min-height', '0px');
      await expect(compact.getByRole('heading')).toHaveCSS('text-align', 'start');
      const standardInset = await standard.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).paddingTop),
      );
      const compactInset = await compact.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).paddingTop),
      );
      expect(compactInset).toBeLessThan(standardInset);
      await expect(subtle).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(subtle).toHaveCSS('backdrop-filter', 'none');
      await expect(subtle.getByRole('heading')).toHaveCSS('text-align', 'start');
      await expect(subtle).toHaveCSS('border-left-width', '0px');
      await expect(subtle).toHaveCSS('border-right-width', '0px');
    });
  }
  for (const theme of ['light', 'dark'] as const) {
    test(`Vue: the card comparison backdrop keeps color below the reference card / ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#card`);
      const stage = page.locator('[data-card-qa] [data-qa-stage="gradient"]');
      await stage.scrollIntoViewIfNeeded();
      // The isolated frame paints the shared dot-and-aurora field. Its lowest
      // glow must stay below the card so the Glass edge still samples color.
      const field = await stage.evaluate((element) => {
        const card = element.querySelector('.ui-card');
        if (!card) throw new Error('Missing reference card');
        const glows = [
          ...getComputedStyle(element).backgroundImage.matchAll(/at\s+([\d.]+)%\s+([\d.]+)%/g),
        ].map((match) => Number(match[2]));
        if (glows.length === 0) throw new Error('Missing QA colored backdrop');
        const stageRect = element.getBoundingClientRect();
        const cardBottom = card.getBoundingClientRect().bottom;
        return {
          gap: stageRect.top + (stageRect.height * Math.max(...glows)) / 100 - cardBottom,
          belowCard: stageRect.bottom - cardBottom,
        };
      });
      expect(field.gap).toBeGreaterThan(0);
      expect(field.gap).toBeLessThan(field.belowCard);
    });
  }
  for (const adapter of ['Vue', 'React'] as const) {
    test(`${adapter}: disclosure expands and collapses from its summary`, async ({ page }) => {
      await page.goto(
        adapter === 'Vue'
          ? '/frame?theme=dark&lang=en#data-display-disclosure'
          : '/react-fixture?theme=dark&lang=en',
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

      const edge = await disclosure.evaluate((element) => getComputedStyle(element).boxShadow);
      // The disclosure shares the directional dark edge with other inset
      // glass; a uniform inset ring is the regression this guards.
      expect(edge).not.toContain('0px 0px 0px 1px inset');
      expect(edge).toContain('inset');

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

  for (const theme of ['light', 'dark'] as const) {
    test(`skeleton specimens keep a clean large-radius surface and a pulse-only effect / ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/?theme=${theme}&lang=en#status-feedback-skeleton`, {
        waitUntil: 'domcontentloaded',
      });
      const rectangle = page.locator('[data-design-lab-region="specimen"] .ui-skeleton');
      await expect(rectangle).toBeVisible();

      const geometry = await rectangle.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          shadow: style.boxShadow,
          topLeft: style.borderTopLeftRadius,
          bottomRight: style.borderBottomRightRadius,
        };
      });
      expect(geometry.shadow).toBe('none');
      expect(geometry.topLeft).toBe('24px');
      expect(geometry.bottomRight).toBe('24px');

      await page.goto(`/frame?theme=${theme}&lang=en#status-feedback`, {
        waitUntil: 'domcontentloaded',
      });
      const pulse = page.locator('.ui-skeleton[data-effect="pulse"]').first();
      await expect(pulse).toBeVisible();
      const animations = await pulse.evaluate((element) => ({
        surface: getComputedStyle(element).animationName,
        sheen: getComputedStyle(element, '::after').animationName,
      }));
      expect(animations.surface).toBe('ui-skeleton-pulse');
      expect(animations.sheen).toBe('none');
    });
  }

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

  test('Disclosure deepens its field on press without swapping to the press shadow', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#data-display-disclosure');
    const details = page.locator('#data-display-disclosure .ui-disclosure').first();
    const summary = details.locator('summary');
    const shadow = () =>
      summary.evaluate((element) => {
        const owner = element.closest('.ui-disclosure');
        if (!(owner instanceof HTMLElement)) throw new Error('The disclosure owner is missing');
        return getComputedStyle(owner).boxShadow;
      });
    const pressShadow = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.position = 'fixed';
      probe.style.opacity = '0';
      probe.style.boxShadow = 'var(--neoverse-effect-press-shadow)';
      document.body.append(probe);
      const value = getComputedStyle(probe).boxShadow;
      probe.remove();
      return value;
    });

    const rest = await shadow();
    await summary.hover();
    await page.mouse.down();
    try {
      await expect.poll(shadow).not.toBe(rest);
      expect(await shadow()).not.toBe(pressShadow);
    } finally {
      await page.mouse.up();
    }
  });
});
