import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`terminal composition / ${theme}`, async ({ page }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#terminal`, { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const transcript = terminal.locator('.ui-terminal-transcript');
    const input = terminal.locator('.ui-terminal-prompt__editor');
    await expect(terminal).toBeVisible();
    await expect(terminal).toHaveAttribute('data-surface', 'glass-elevated');
    await expect(transcript).toHaveAttribute('aria-label', 'Terminal history');
    await expect(transcript.locator('[role="log"]')).toHaveAttribute('aria-live', 'polite');
    await expect(input).toBeVisible();
    await expect(input).toHaveJSProperty('type', 'text');
    await expect(terminal.locator('.ui-input')).toHaveCount(0);
    const live = terminal.locator('.ui-terminal-prompt');
    const recorded = transcript.locator('.ui-terminal-echo').first();
    await expect(live.locator('.ui-terminal-prompt__segment')).toHaveCount(5);
    await expect(recorded.locator('.ui-terminal-prompt__segment')).toHaveCount(5);
    await expect(recorded.locator('.ui-terminal-echo__text')).toHaveText('echo hello');
    await expect(recorded.locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);
    await expect(recorded.locator('.ui-terminal-prompt__symbol')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(recorded.locator('svg')).toHaveCount(4);
    await expect(live.locator('svg')).toHaveCount(4);
    await expect(live.locator('.ui-terminal-prompt__symbol')).toContainText('❯');
    const segmentHeights = await terminal
      .locator('.ui-terminal-prompt__lead, .ui-terminal-prompt__segment')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    // SVG-only host segments and text segments must join without a height seam,
    // including when font metrics or the mobile root size change.
    expect(Math.max(...segmentHeights) - Math.min(...segmentHeights)).toBeLessThan(0.1);
    const chrome = await terminal.locator('.ui-terminal-prompt__context').evaluateAll((elements) =>
      elements.map((element) => ({
        height: element.getBoundingClientRect().height,
        background: getComputedStyle(element).backgroundColor,
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
    const editorAppearance = await input.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        border: style.borderTopWidth,
        boxShadow: style.boxShadow,
        padding: style.paddingTop,
      };
    });
    expect(editorAppearance).toEqual({
      background: 'rgba(0, 0, 0, 0)',
      border: '0px',
      boxShadow: 'none',
      padding: '0px',
    });

    await input.fill('中文输入');
    await input.evaluate((element) => {
      element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
      );
    });
    await expect(transcript.locator('.ui-terminal-line')).toHaveCount(2);
    await expect(transcript.locator('.ui-terminal-echo')).toHaveCount(1);
    await expect(input).toHaveValue('中文输入');

    const styles = await terminal.evaluate((element) => {
      const root = getComputedStyle(element);
      const bodyElement = element.querySelector('.ui-terminal-surface__body');
      if (!bodyElement) throw new Error('Terminal body is missing');
      const body = getComputedStyle(bodyElement);
      return {
        background: body.backgroundColor,
        foreground: root.color,
        font: root.fontFamily,
        width: element.scrollWidth <= element.clientWidth + 1,
      };
    });
    expect(styles.foreground).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.font).toContain('Maple Mono NF CN');
    const fontFamilies = await terminal
      .locator(
        '.ui-terminal-transcript, .ui-terminal-line, .ui-terminal-echo, .ui-terminal-prompt, input',
      )
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).fontFamily));
    for (const fontFamily of fontFamilies) {
      expect(fontFamily).toBe(styles.font);
    }
    expect(styles.width).toBe(true);

    for (let i = 0; i < 20; i += 1) {
      await input.fill(`echo ${i}`);
      await input.press('Enter');
    }
    await expect(transcript.locator('.ui-terminal-line')).toHaveCount(2);
    await expect(transcript.locator('.ui-terminal-echo')).toHaveCount(21);
    await expect(transcript.locator('.ui-terminal-echo__text').last()).toHaveText('echo 19');
    await expect(input).toHaveValue('');
    await expect
      .poll(() =>
        transcript.evaluate((element) =>
          Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop),
        ),
      )
      .toBeLessThan(4);

    await transcript.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event('scroll'));
    });
    await input.blur();
    await recorded.locator('.ui-terminal-echo__text').click();
    await recorded.locator('.ui-terminal-echo__text').evaluate((element) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe('echo hello');
    await expect(input).not.toBeFocused();
    // Revealing selectable text may scroll it into view on narrow screens.
    // Appending output must preserve that reader position, not force the tail.
    const readerScroll = await transcript.evaluate((element) => element.scrollTop);
    await input.fill('echo preserve-scroll');
    await input.press('Enter');
    await expect.poll(() => transcript.evaluate((element) => element.scrollTop)).toBe(readerScroll);
    await expect(transcript.locator('.ui-terminal-echo__text').last()).toHaveText(
      'echo preserve-scroll',
    );
  });
}
