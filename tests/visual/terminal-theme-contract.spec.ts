import { expect, test } from '@playwright/test';

const terminalRoles = [
  'background',
  'header-background',
  'foreground',
  'muted',
  'command',
  'prompt',
  'cursor',
  'selection',
  'segment-host-background',
  'segment-path-background',
  'segment-branch-background',
  'segment-runtime-background',
  'segment-time-background',
  'segment-accent-foreground',
  'segment-soft-foreground',
  'segment-branch-foreground',
  'segment-runtime-foreground',
  'segment-time-foreground',
] as const;

async function readTerminalTheme(page: import('@playwright/test').Page) {
  return page.evaluate((roles) => {
    const root = getComputedStyle(document.documentElement);
    const terminal = document.querySelector<HTMLElement>('.ui-terminal-surface');
    if (!terminal) throw new Error('The terminal specimen is missing');
    const prompt = terminal.querySelector<HTMLElement>('.ui-terminal-prompt');
    const path = terminal.querySelector<HTMLElement>(
      '.ui-terminal-prompt__segment[data-tone="path"]',
    );
    if (!prompt || !path) throw new Error('Terminal prompt or path segment is missing');
    const values = Object.fromEntries(
      roles.map((role) => [
        role,
        root.getPropertyValue(`--neoverse-terminal-${role}`).trim().replace(/\s+/g, ' '),
      ]),
    );
    return {
      values,
      surfaceForeground: getComputedStyle(terminal).color,
      promptForeground: getComputedStyle(prompt).color,
      pathBackground: getComputedStyle(path).backgroundColor,
      pathForeground: getComputedStyle(path).color,
    };
  }, terminalRoles);
}

test('terminal semantic colors track light, dark and live system theme changes', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ui-terminal-surface')).toBeVisible();

  async function setTheme(theme: 'light' | 'dark' | 'system', scheme: 'light' | 'dark') {
    await page.emulateMedia({ colorScheme: scheme });
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    return readTerminalTheme(page);
  }

  const light = await setTheme('light', 'light');
  const dark = await setTheme('dark', 'dark');
  for (const role of terminalRoles) {
    expect(light.values[role], `light: ${role}`).not.toBe('');
    expect(dark.values[role], `dark: ${role}`).not.toBe('');
  }
  expect(light.surfaceForeground).not.toBe(dark.surfaceForeground);
  expect(light.pathBackground).not.toBe(dark.pathBackground);

  expect(await setTheme('light', 'dark')).toEqual(light);
  expect(await setTheme('dark', 'light')).toEqual(dark);
  expect(await setTheme('system', 'light')).toEqual(light);
  expect(await setTheme('system', 'dark')).toEqual(dark);
  expect(await setTheme('system', 'light')).toEqual(light);
});

test('terminal text, status and prompt colors retain readable semantic contrast', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#terminal', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ui-terminal-surface')).toBeVisible();

  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'system';
    });

    const contrasts = await page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.append(probe);
      try {
        const color = (token: string) => {
          probe.style.color = `var(${token})`;
          return getComputedStyle(probe).color;
        };
        // Canvas text is the minimum legibility contract for the transparent
        // terminal body. Translucent Glass backdrops are separately visual-tested.
        const canvas = color('--neoverse-color-surface-canvas');
        const rgb = (value: string) => {
          const channels = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
          if (!channels) throw new Error(`Unrecognised computed RGB: ${value}`);
          return channels.slice(1, 4).map((channel) => {
            const v = Number(channel) / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
        };
        const luminance = (value: string) => {
          const [r = Number.NaN, g = Number.NaN, b = Number.NaN] = rgb(value);
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const background = luminance(canvas);
        return Object.fromEntries(
          ['foreground', 'muted', 'command', 'prompt', 'cursor'].map((role) => {
            const foreground = luminance(color(`--neoverse-terminal-${role}`));
            return [
              role,
              (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05),
            ];
          }),
        );
      } finally {
        probe.remove();
      }
    });
    for (const role of ['foreground', 'muted', 'command'] as const) {
      expect(contrasts[role], `${scheme} terminal ${role} / canvas`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrasts.prompt, `${scheme} terminal prompt / canvas`).toBeGreaterThanOrEqual(4.5);
    expect(contrasts.cursor, `${scheme} terminal cursor / canvas`).toBeGreaterThanOrEqual(3);
  }
});
