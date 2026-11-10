import { expect, test } from '@playwright/test';

test.describe('terminal', () => {
  test('Vue: commands append to the transcript and keep the tail in view', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const transcript = terminal.locator('.ui-terminal-transcript');
    const input = terminal.locator('.ui-terminal-prompt__editor');

    await expect(terminal).toHaveAttribute('data-surface', 'glass-elevated');
    await expect(transcript).toHaveAttribute('aria-label', 'Terminal history');
    await expect(transcript.locator('[role="log"]')).toHaveAttribute('aria-live', 'polite');
    await expect(terminal.locator('.ui-input')).toHaveCount(0);

    const recorded = transcript.locator('.ui-terminal-echo').first();
    await expect(recorded.locator('.ui-terminal-echo__text')).toHaveText('echo hello');
    await expect(recorded.locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);

    for (let index = 0; index < 20; index += 1) {
      await input.fill(`echo ${index}`);
      await input.press('Enter');
    }
    await expect(transcript.locator('.ui-terminal-echo')).toHaveCount(21);
    await expect(transcript.locator('.ui-terminal-echo__text').last()).toHaveText('echo 19');
    await expect(input).toHaveValue('');
    await expect
      .poll(() =>
        transcript.evaluate(
          (element) => element.scrollHeight - element.clientHeight - element.scrollTop,
        ),
      )
      .toBeLessThan(4);
  });

  test('Vue: composition does not submit a half-finished command', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const transcript = terminal.locator('.ui-terminal-transcript');
    const input = terminal.locator('.ui-terminal-prompt__editor');
    const before = await transcript.locator('.ui-terminal-echo').count();

    await input.fill('中文输入');
    await input.evaluate((element) => {
      element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
      );
    });
    await expect(transcript.locator('.ui-terminal-echo')).toHaveCount(before);
    await expect(input).toHaveValue('中文输入');
  });

  test('Vue: a reader position survives appended output', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const transcript = terminal.locator('.ui-terminal-transcript');
    const input = terminal.locator('.ui-terminal-prompt__editor');

    for (let index = 0; index < 12; index += 1) {
      await input.fill(`echo ${index}`);
      await input.press('Enter');
    }
    await transcript.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event('scroll'));
    });
    await input.blur();
    const readerScroll = await transcript.evaluate((element) => element.scrollTop);

    await input.fill('echo preserve-scroll');
    await input.press('Enter');
    await expect.poll(() => transcript.evaluate((element) => element.scrollTop)).toBe(readerScroll);
    await expect(transcript.locator('.ui-terminal-echo__text').last()).toHaveText(
      'echo preserve-scroll',
    );
  });

  test('React: prompt suggestions follow focus, caret and input state', async ({ page }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
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

  test('React: the transcript keeps the tail while output is appended', async ({ page }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const input = page.locator('[data-react-adapter="UiTerminalPrompt"]');
    const transcript = page.locator('[data-react-adapter="UiTerminalTranscript"]');
    const bottom = () =>
      transcript.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);

    for (let index = 0; index < 12; index += 1) {
      await input.fill(`${index}: ${'long output wraps in the terminal '.repeat(4)}`);
      await input.press('Enter');
    }
    await expect.poll(bottom).toBeLessThanOrEqual(3);
    await page.setViewportSize({ width: 480, height: 900 });
    await expect.poll(bottom).toBeLessThanOrEqual(3);
  });

  for (const adapter of ['React', 'Vue'] as const) {
    test(`${adapter}: reader intent wins over a same-frame column resize`, async ({ page }) => {
      await page.goto(
        adapter === 'React'
          ? '/react-fixture?theme=light&contract-fixtures=1'
          : '/frame?theme=light&lang=en#terminal',
        { waitUntil: 'domcontentloaded' },
      );
      const terminal = page.locator(
        adapter === 'React' ? '[data-react-adapter="UiTerminalSurface"]' : '.ui-terminal-surface',
      );
      const input = terminal.locator('input').first();
      const transcript = terminal.locator('.ui-terminal-transcript');

      for (let index = 0; index < 12; index += 1) {
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
        node.style.width = `${Math.max(240, node.clientWidth - 20)}px`;
        node.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000, bubbles: true }));
        node.scrollTop = 0;
        node.dispatchEvent(new Event('scroll'));
      });
      await expect.poll(() => transcript.evaluate((node) => node.scrollTop)).toBe(0);
    });
  }
});
