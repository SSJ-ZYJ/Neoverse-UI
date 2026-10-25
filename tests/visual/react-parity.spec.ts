import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test.describe(`React parity / ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/react-fixture?theme=${theme}&lang=zh&contract-fixtures`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('[data-react-parity-fixture]')).toBeVisible();
    });

    test('all added adapters render semantic DOM and use the selected material theme', async ({
      page,
    }) => {
      const failures: string[] = [];
      page.on('pageerror', (error) => failures.push(error.message));
      for (const name of [
        'UiBadge',
        'UiControlSurface',
        'UiNavigationItem',
        'UiSegmentedControl',
        'UiSkeleton',
        'UiStatusIndicator',
        'UiTooltipSurface',
        'UiStatCard',
        'UiTimeline',
        'UiStepFlow',
        'UiTerminalSurface',
        'UiTerminalTranscript',
        'UiTerminalLine',
        'UiTerminalPrompt',
        'UiTerminalEcho',
        'UiScrollbar',
      ]) {
        await expect(page.locator(`[data-react-adapter="${name}"]`)).toHaveCount(1);
      }
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(
        page.locator('[data-react-adapter="UiStepFlow"] [aria-current="step"]'),
      ).toHaveCount(1);
      await expect(page.locator('[data-react-adapter="UiTimeline"] time')).toHaveAttribute(
        'datetime',
        '2026',
      );
      await expect(page.locator('[data-react-adapter="UiSkeleton"]')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(failures).toEqual([]);
    });

    test('navigation indicator follows selection and CSS zoom in both grouped shells', async ({
      page,
    }) => {
      for (const selector of ['[data-parity-navigation]', '[data-parity-dock]']) {
        const group = page.locator(selector);
        const marker = group.locator('.ui-navigation-item--active .ui-navigation-item__indicator');
        const indicator = group.locator('.ui-control-surface__indicator');
        await group.scrollIntoViewIfNeeded();
        await expect(indicator).toBeVisible();
        const difference = () =>
          indicator.evaluate((node) => {
            const markerNode = node.parentElement?.querySelector(
              '.ui-navigation-item--active .ui-navigation-item__indicator',
            );
            if (!markerNode) return 999;
            const a = node.getBoundingClientRect();
            const b = markerNode.getBoundingClientRect();
            return Math.max(
              Math.abs(a.left - b.left),
              Math.abs(a.top - b.top),
              Math.abs(a.width - b.width),
              Math.abs(a.height - b.height),
            );
          });
        await expect.poll(difference).toBeLessThan(1.5);
        await group.getByRole('button').nth(1).click();
        await expect(group.getByRole('button').nth(1)).toHaveAttribute('aria-current', 'page');
        await expect.poll(difference).toBeLessThan(1.5);
        await group.evaluate((node) => {
          node.style.zoom = '1.2';
        });
        await expect.poll(difference).toBeLessThan(1.5);
        await expect(marker).toHaveCount(1);
      }
    });

    test('segmented keyboard selection skips disabled values and reconciles rejected controlled updates', async ({
      page,
    }) => {
      const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
      const radios = group.getByRole('radio');
      await radios.first().focus();
      await radios.first().press('ArrowRight');
      await expect(radios.nth(2)).toBeFocused();
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
      await radios.nth(2).press('Home');
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
      await radios.first().press('End');
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
      await radios.nth(2).press('ArrowRight');
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
      await page.locator('[data-parity-reject]').click();
      await radios.nth(2).click();
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false');
      await page.locator('[data-parity-loading]').click();
      await expect(group).toHaveAttribute('aria-busy', 'true');
      await expect(group.locator('.ui-loading-indicator circle')).toHaveCount(1);
      for (const radio of await radios.all()) await expect(radio).toBeDisabled();
      await page.locator('[data-parity-loading]').click();
      await page.locator('[data-parity-disabled]').click();
      for (const radio of await radios.all()) await expect(radio).toBeDisabled();
      await page.locator('[data-parity-options]').click();
      await expect(
        page.locator('[data-parity-uncontrolled]').getByRole('radio', { checked: true }),
      ).toHaveText('C');
    });

    test('terminal suggestions follow focus, caret, composition, readonly and password state', async ({
      page,
    }) => {
      const input = page.locator('[data-react-adapter="UiTerminalPrompt"]');
      const ghost = page.locator('.ui-terminal-prompt__ghost-suffix');
      await input.fill('he');
      await expect(ghost).toHaveText('lp --all');
      await input.press('ArrowLeft');
      await expect(ghost).toHaveCount(0);
      await input.press('End');
      await expect(ghost).toHaveText('lp --all');
      await input.dispatchEvent('compositionstart', { data: '' });
      await expect(ghost).toHaveCount(0);
      await input.dispatchEvent('compositionend', { data: '' });
      await expect(ghost).toHaveText('lp --all');
      await input.press('Tab');
      await expect(input).toHaveValue('he');
      await expect(ghost).toHaveCount(0);
      await page.locator('[data-parity-loading]').click();
      await input.focus();
      await expect(input).toHaveAttribute('readonly', '');
      await expect(ghost).toHaveCount(0);
      await page.locator('[data-parity-loading]').click();
      await page.locator('[data-parity-password]').click();
      await input.focus();
      await expect(input).toHaveAttribute('type', 'password');
      await expect(ghost).toHaveCount(0);
      await page.locator('[data-parity-disabled]').click();
      await expect(input).toBeDisabled();
      await page.locator('[data-parity-mount]').click();
      await expect(input).toHaveCount(0);
      await page.locator('[data-parity-mount]').click();
      await expect(input).toHaveCount(1);
    });

    test('recorded commands retain prompt context, selectable text and readonly geometry', async ({
      page,
    }) => {
      const terminal = page.locator('[data-react-adapter="UiTerminalSurface"]');
      const input = terminal.locator('input');
      const transcript = terminal.locator('.ui-terminal-transcript');
      const echo = transcript.locator('.ui-terminal-echo').first();
      await expect(echo.locator('.ui-terminal-echo__text')).toHaveText('help --all');
      await expect(echo.locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);
      await expect(echo.locator('.ui-terminal-prompt__symbol')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      await expect(echo.locator('.ui-terminal-prompt__segment')).toHaveCount(3);
      await expect(echo.locator('svg')).toHaveCount(1);
      await expect(transcript.locator('[role="log"]')).toHaveAttribute('aria-live', 'polite');
      await echo.locator('.ui-terminal-echo__text').click();
      await expect(input).not.toBeFocused();
      await echo.locator('.ui-terminal-echo__text').evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
      await expect
        .poll(() => page.evaluate(() => window.getSelection()?.toString()))
        .toBe('help --all');
      for (const width of [480, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const chrome = await terminal
          .locator('.ui-terminal-prompt__context')
          .evaluateAll((elements) =>
            elements.map((element) => ({
              height: element.getBoundingClientRect().height,
              segments: Array.from(element.querySelectorAll('.ui-terminal-prompt__segment')).map(
                (segment) => ({
                  width: segment.getBoundingClientRect().width,
                  color: getComputedStyle(segment).color,
                  background: getComputedStyle(segment).backgroundColor,
                }),
              ),
            })),
          );
        expect(chrome).toHaveLength(2);
        expect(chrome[0]).toEqual(chrome[1]);
        expect(
          await terminal.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
        ).toBe(true);
        await page.evaluate(() => {
          window.getSelection()?.removeAllRanges();
          return document.fonts.ready;
        });
        await expect(terminal).toHaveScreenshot(`react-terminal-${theme}-${width}.png`, {
          animations: 'disabled',
          caret: 'hide',
        });
      }
      await input.fill('echo <recorded> & literal');
      await input.press('Enter');
      await expect(transcript.locator('.ui-terminal-echo__text').last()).toHaveText(
        'echo <recorded> & literal',
      );
      await expect(
        transcript.locator('.ui-terminal-echo').last().locator('.ui-terminal-prompt__segment'),
      ).toHaveCount(3);
      await expect(input).toHaveValue('');
    });

    test('terminal tail follows appended and reflowed output while preserving history readers', async ({
      page,
    }) => {
      const input = page.locator('[data-react-adapter="UiTerminalPrompt"]');
      const transcript = page.locator('[data-react-adapter="UiTerminalTranscript"]');
      const bottom = () =>
        transcript.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);
      for (let index = 0; index < 12; index++) {
        await input.fill(`${index}: ${'long output wraps in the terminal '.repeat(4)}`);
        await input.press('Enter');
      }
      await expect.poll(bottom).toBeLessThanOrEqual(3);
      await page.setViewportSize({ width: 480, height: 900 });
      await expect.poll(bottom).toBeLessThanOrEqual(3);
      await transcript.hover();
      await page.mouse.wheel(0, -100000);
      await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
      await page.locator('[data-parity-append]').click();
      await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
    });

    test('scrollbar supports reveal, track seeking, dragging, auto hide and native cleanup', async ({
      page,
    }) => {
      const track = page.locator('[data-react-adapter="UiScrollbar"]');
      await page.locator('[data-parity-native]').click();
      await expect(page.locator('html')).toHaveClass(/ui-scrollbar-target/);
      await page.evaluate(() => window.scrollTo(0, 100));
      await expect(track).toHaveAttribute('data-visible', 'true');
      const rect = await track.boundingBox();
      if (!rect) throw new Error('Scrollbar track is missing');
      await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height * 0.6);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
      // Reveal after any auto-hide elapsed while waiting for scrolling.
      await page.keyboard.press('Shift');
      const thumb = track.locator('.ui-scrollbar__thumb');
      const thumbRect = await thumb.boundingBox();
      if (!thumbRect) throw new Error('Scrollbar thumb is missing');
      await page.mouse.move(thumbRect.x + thumbRect.width / 2, thumbRect.y + thumbRect.height / 2);
      await page.mouse.down();
      await page.mouse.move(thumbRect.x + thumbRect.width / 2, rect.y + rect.height * 0.85);
      await expect(track).toHaveClass(/ui-scrollbar--dragging/);
      await page.mouse.up();
      await expect(track).not.toHaveClass(/ui-scrollbar--dragging/);
      await expect(track).toHaveAttribute('data-visible', 'false');
      await page.locator('[data-parity-scrollbar]').click();
      await expect(track).toHaveCount(0);
      await expect(page.locator('html')).not.toHaveClass(/ui-scrollbar-target/);
    });
  });
}

for (const adapter of ['React', 'Vue']) {
  test(`${adapter} terminal reader intent wins over a same-frame column resize`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(
      adapter === 'React'
        ? '/react-fixture?theme=light&contract-fixtures'
        : '/frame?theme=light&lang=en#terminal',
      { waitUntil: 'domcontentloaded' },
    );
    const terminal = page.locator(
      adapter === 'React' ? '[data-react-adapter="UiTerminalSurface"]' : '.ui-terminal-surface',
    );
    const input = terminal.locator('input');
    const transcript = terminal.locator('.ui-terminal-transcript');
    for (let index = 0; index < 12; index++) {
      await input.fill(`${index}: ${'output wraps when the column resizes '.repeat(4)}`);
      await input.press('Enter');
    }
    await expect
      .poll(() =>
        transcript.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop),
      )
      .toBeLessThanOrEqual(3);
    await input.blur();
    await transcript.evaluate((node) => {
      // A reader scroll can arrive before ResizeObserver has delivered the new size.
      node.style.width = `${Math.max(240, node.clientWidth - 20)}px`;
      node.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000, bubbles: true }));
      node.scrollTop = 0;
      node.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
  });
}
