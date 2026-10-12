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
    await expect(terminal.locator('.ui-terminal-prompt__segment')).toHaveCount(5);
    await expect(terminal.locator('.ui-terminal-prompt__symbol')).toContainText('❯');
    const segmentHeights = await terminal
      .locator('.ui-terminal-prompt__lead, .ui-terminal-prompt__segment')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    // SVG-only host segments and text segments must join without a height seam,
    // including when font metrics or the mobile root size change.
    expect(Math.max(...segmentHeights) - Math.min(...segmentHeights)).toBeLessThan(0.1);
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
      .locator('.ui-terminal-transcript, .ui-terminal-line, .ui-terminal-prompt, input')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).fontFamily));
    for (const fontFamily of fontFamilies) {
      expect(fontFamily).toBe(styles.font);
    }
    expect(styles.width).toBe(true);

    for (let i = 0; i < 20; i += 1) {
      await input.fill(`echo ${i}`);
      await input.press('Enter');
    }
    await expect(transcript.locator('.ui-terminal-line')).toHaveCount(22);
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
    await input.fill('echo preserve-scroll');
    await input.press('Enter');
    await expect.poll(() => transcript.evaluate((element) => element.scrollTop)).toBe(0);
    await expect(transcript.locator('.ui-terminal-line').last()).toContainText('preserve-scroll');
  });
}
