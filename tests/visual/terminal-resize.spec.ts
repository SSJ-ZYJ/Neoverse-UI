import { expect, test } from '@playwright/test';

test('terminal follows reflow while at the bottom and preserves readers on resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
  const terminal = page.locator('.ui-terminal-surface');
  const transcript = terminal.locator('.ui-terminal-transcript');
  const input = terminal.locator('input');
  const bottom = () =>
    transcript.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);
  for (let index = 0; index < 12; index++) {
    await input.fill(`line ${index}: ${'long output wraps across the viewport '.repeat(3)}`);
    await input.press('Enter');
  }
  await expect.poll(bottom).toBeLessThanOrEqual(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(bottom).toBeLessThanOrEqual(3);
  await input.fill('continued output');
  await input.press('Enter');
  await expect.poll(bottom).toBeLessThanOrEqual(3);
  await transcript.evaluate((node) => {
    node.scrollTop = 0;
    node.dispatchEvent(new Event('scroll'));
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
  await input.fill('preserve history');
  await input.press('Enter');
  await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
});
