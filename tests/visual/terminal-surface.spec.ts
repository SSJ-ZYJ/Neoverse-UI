import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const width of [480, 1440]) {
    test(`shared terminal surface / ${theme} / ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/frame?theme=${theme}&lang=en#terminal`, { waitUntil: 'domcontentloaded' });

      const terminal = page.locator('.ui-terminal-surface');
      const transcript = terminal.locator('.ui-terminal-transcript');
      const input = terminal.locator('.ui-terminal-prompt__editor');
      await expect(terminal).toBeVisible();
      await expect(terminal).toHaveAttribute('data-surface', 'glass-elevated');
      await expect(transcript.locator('[role="log"]')).toHaveAttribute('aria-live', 'polite');
      const echo = transcript.locator('.ui-terminal-echo');
      await expect(echo.locator('.ui-terminal-echo__text')).toHaveText('echo hello');
      await expect(echo.locator('input, textarea')).toHaveCount(0);
      expect(
        await terminal.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      ).toBe(true);
      await page.evaluate(() => document.fonts.ready);

      await input.fill('echo');
      await expect(terminal.locator('.ui-terminal-prompt__ghost-suffix')).toHaveText(' hello');
      await page.addStyleTag({
        content:
          '.ui-terminal-prompt__segment[data-tone="time"] { visibility: hidden !important; }',
      });
      await expect(terminal).toHaveScreenshot(`shared-terminal-${theme}-${width}.png`, {
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }
}
