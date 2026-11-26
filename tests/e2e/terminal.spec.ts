import { expect, test } from '@playwright/test';

test.describe('terminal', () => {
  test('Vue: commands append to the transcript and keep the tail in view', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const transcript = terminal.locator('.ui-terminal-transcript');
    const input = terminal.locator('.ui-terminal-prompt__editor');

    await expect(terminal).toHaveCSS('backdrop-filter', /blur\(18px\)/);
    await terminal.evaluate((element) => element.setAttribute('data-neoverse-material', 'solid'));
    await expect(terminal).toHaveCSS('backdrop-filter', 'none');
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

  test('Vue terminal switches macOS, Windows, Linux and auto titlebar styles with interactive window controls', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const titlebarTrigger = page.getByRole('combobox', { name: 'Titlebar style' });
    const selectTitlebar = async (label: string) => {
      await titlebarTrigger.click();
      await titlebarTrigger
        .locator('xpath=..')
        .getByRole('option', { name: label, exact: true })
        .click();
    };

    const initialTitlebar = await terminal.getAttribute('data-titlebar');
    expect(['default', 'macos', 'windows', 'linux']).toContain(initialTitlebar);

    await selectTitlebar('macOS');
    await expect(terminal).toHaveAttribute('data-titlebar', 'macos');
    await expect(terminal.locator('.ui-terminal-surface__window-button')).toHaveCount(3);
    const macosOrder = await terminal
      .locator('.ui-terminal-surface__window-button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-window-action')));
    expect(macosOrder).toEqual(['close', 'minimize', 'maximize']);

    const maximizeButton = terminal.locator('[data-window-action="maximize"]');
    await maximizeButton.click();
    await expect(terminal).toHaveAttribute('data-maximized', 'true');
    await expect(maximizeButton).toHaveAttribute('aria-pressed', 'true');

    await terminal.locator('[data-window-action="minimize"]').click();
    await expect(terminal.locator('.ui-terminal-transcript')).toBeHidden();
    await terminal.locator('[data-terminal-restore]').click();
    await expect(terminal.locator('.ui-terminal-transcript')).toBeVisible();

    await selectTitlebar('Windows');
    await expect(terminal).toHaveAttribute('data-titlebar', 'windows');
    await expect(terminal.locator('.ui-terminal-surface__app-icon svg')).toBeVisible();
    const windowsOrder = await terminal
      .locator('.ui-terminal-surface__window-button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-window-action')));
    expect(windowsOrder).toEqual(['minimize', 'maximize', 'close']);

    await selectTitlebar('Linux / GNOME');
    await expect(terminal).toHaveAttribute('data-titlebar', 'linux');
    await expect(terminal.locator('.ui-terminal-surface__app-icon')).toHaveCount(0);

    await terminal.locator('[data-window-action="close"]').click();
    await expect(terminal).toHaveCount(0);
    await page.locator('[data-terminal-reopen]').click();
    await expect(terminal).toHaveCount(1);
    await expect(terminal).toHaveAttribute('data-titlebar', 'linux');
  });

  test('Vue terminal commandline recognizes OS, shell, browser and runtime icons', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
    const terminal = page.locator('.ui-terminal-surface');
    const promptHostSegment = terminal.locator(
      '.ui-terminal-prompt .ui-terminal-prompt__segment[data-tone="host"]',
    );
    const runtimeSegment = terminal.locator(
      '.ui-terminal-prompt .ui-terminal-prompt__segment[data-tone="runtime"]',
    );

    const detectedIcon = await promptHostSegment.getAttribute('data-icon');
    expect(detectedIcon).toBeTruthy();
    expect(detectedIcon).not.toBe('auto');
    await expect(promptHostSegment.locator('svg')).toBeVisible();
    await expect(runtimeSegment).toHaveAttribute('data-icon', 'bun');
    await expect(runtimeSegment.locator('svg')).toBeVisible();

    for (const expectedIcon of [
      'powershell',
      'windows-terminal',
      'macos',
      'ubuntu',
      'vscode',
    ] as const) {
      await page.locator(`[data-terminal-icon-chip="${expectedIcon}"]`).click();
      await expect(promptHostSegment).toHaveAttribute('data-icon', expectedIcon);
      await expect(promptHostSegment.locator('.sr-only')).toHaveText(expectedIcon);
    }

    const input = terminal.locator('.ui-terminal-prompt__editor');
    await input.fill('pwsh --version');
    await input.press('Enter');
    const latestEchoHost = terminal
      .locator('.ui-terminal-transcript .ui-terminal-echo')
      .last()
      .locator('.ui-terminal-prompt__segment[data-tone="host"]');
    await expect(latestEchoHost).toHaveAttribute('data-icon', 'vscode');
  });

  test('React terminal renders titlebar presets, caption controls and commandline icon recognition', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const terminal = page.locator('[data-react-adapter="UiTerminalSurface"]');
    const promptHostSegment = terminal.locator(
      '.ui-terminal-prompt .ui-terminal-prompt__segment[data-tone="host"]',
    );
    const titlebarButton = page.locator('[data-react-titlebar-cycle]');
    const iconButton = page.locator('[data-react-icon-cycle]');

    await expect(promptHostSegment.locator('svg')).toBeVisible();

    await titlebarButton.click();
    await expect(terminal).toHaveAttribute('data-titlebar', 'macos');
    await terminal.locator('[data-window-action="maximize"]').click();
    await expect(terminal).toHaveAttribute('data-maximized', 'true');

    await titlebarButton.click();
    await expect(terminal).toHaveAttribute('data-titlebar', 'windows');
    await expect(terminal.locator('.ui-terminal-surface__app-icon svg')).toBeVisible();

    await iconButton.click();
    await expect(promptHostSegment).toHaveAttribute('data-icon', 'windows-terminal');
    await iconButton.click();
    await expect(promptHostSegment).toHaveAttribute('data-icon', 'powershell');
  });
});
