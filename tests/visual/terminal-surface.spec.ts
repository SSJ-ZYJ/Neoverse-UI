import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`shared terminal surface / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#terminal`, { waitUntil: 'domcontentloaded' });

    const terminal = page.locator('.ui-terminal-surface');
    const transcript = terminal.locator('.ui-terminal-transcript');
    const input = terminal.locator('.ui-terminal-prompt__editor');
    await expect(terminal).toBeVisible();
    await expect(terminal).toHaveAttribute('data-surface', 'glass-elevated');
    await expect(transcript.locator('[role="log"]')).toHaveAttribute('aria-live', 'polite');
    await page.evaluate(() => document.fonts.ready);

    await input.fill('echo');
    await expect(terminal.locator('.ui-terminal-prompt__ghost-suffix')).toHaveText(' hello');
    await page.addStyleTag({
      content: '.ui-terminal-prompt__segment[data-tone="time"] { visibility: hidden !important; }',
    });
    await expect(terminal).toHaveScreenshot(`shared-terminal-${theme}.png`, {
      animations: 'disabled',
      caret: 'hide',
    });
  });
}
