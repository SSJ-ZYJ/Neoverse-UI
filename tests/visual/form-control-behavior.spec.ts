import { expect, test } from '@playwright/test';

const adapters = [
  {
    name: 'Vue',
    url: (theme: string) => `/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`,
    selector: '#forms-runtime',
  },
  {
    name: 'React',
    url: (theme: string) => `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`,
    selector: '[data-react-adapter="UiSelect"]',
  },
] as const;

for (const adapter of adapters) {
  for (const theme of ['light', 'dark']) {
    for (const mode of ['native', 'fallback']) {
      test(`${adapter.name} Select keyboard entry and selection / ${theme} / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') {
          await page.addInitScript(() => {
            Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
            Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
          });
        }
        await page.goto(adapter.url(theme), { waitUntil: 'domcontentloaded' });
        const trigger = page.locator(adapter.selector).first();
        const shell = page.locator('.ui-select-shell').filter({ has: trigger });
        const panel = shell.getByRole('listbox');
        await trigger.focus();
        await trigger.press('ArrowDown');
        await expect(panel).toBeVisible();
        await expect(trigger).toHaveAttribute(
          'aria-controls',
          (await panel.getAttribute('id')) ?? '',
        );
        await expect(panel.locator('[aria-selected="true"]')).toBeFocused();
        await page.keyboard.press('End');
        const last = panel.getByRole('option').last();
        await expect(last).toBeFocused();
        const selectedText = await last.innerText();
        await page.keyboard.press('Enter');
        await expect(panel).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(trigger).toContainText(selectedText);
        await trigger.press('ArrowUp');
        await expect(panel).toBeVisible();
        await expect(panel.locator('[aria-selected="true"]')).toBeFocused();
        await page.keyboard.press('Home');
        await expect(panel.getByRole('option').first()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
        await expect(trigger).toBeFocused();
      });
    }
  }
}

for (const adapter of adapters) {
  for (const theme of ['light', 'dark']) {
    test(`${adapter.name} text controls keep Field state, submission and responsive layout / ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.goto(adapter.url(theme), { waitUntil: 'domcontentloaded' });
      const form = page.locator('[data-text-contract-form]');
      const input = form.getByRole('textbox', { name: 'Contract text', exact: true });
      const notes = form.getByRole('textbox', { name: 'Contract notes', exact: true });
      await input.fill('你好 release');
      await notes.fill('First line\n第二行');
      await expect(form.locator('[data-text-value]')).toHaveText('你好 release');
      await expect(form.locator('[data-notes-value]')).toHaveText('First line\n第二行');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(notes).not.toHaveAttribute('aria-invalid');
      const ids = (await input.getAttribute('aria-describedby'))?.split(' ') ?? [];
      expect(ids).toHaveLength(2);
      for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toBeVisible();
      await form.locator('[data-text-toggle-hints]').click();
      await expect(input).not.toHaveAttribute('aria-describedby');
      for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(0);
      await form.locator('[data-text-readonly]').click();
      for (const editor of [input, notes]) {
        const value = await editor.inputValue();
        await editor.focus();
        await page.keyboard.type('must not mutate');
        await expect(editor).toHaveValue(value);
        await expect(editor).toBeFocused();
      }
      const values = await form.evaluate((element) =>
        Object.fromEntries(new FormData(element as HTMLFormElement)),
      );
      expect(values).toEqual({
        text: '你好 release',
        notes: 'First line\n第二行',
        selection: 'native',
      });
      await form.locator('[data-text-disabled]').click();
      await expect(input).toBeDisabled();
      await expect(notes).toBeDisabled();
      expect(
        await form.evaluate((element) => Array.from(new FormData(element as HTMLFormElement))),
      ).toEqual([]);
      await form.locator('[data-text-editable]').click();
      await expect(input).toBeEnabled();
      await expect(notes).toBeEnabled();
      await expect(input).toHaveValue('你好 release');
      const overflow = await form.evaluate((element) => ({
        form: element.scrollWidth > element.clientWidth + 1,
        page: document.documentElement.scrollWidth > window.innerWidth + 1,
      }));
      expect(overflow).toEqual({ form: false, page: false });
      await form.screenshot({ path: testInfo.outputPath(`text-controls-${theme}.png`) });
    });

    test(`${adapter.name} Select skips disabled options and respects rejected controlled changes / ${theme}`, async ({
      page,
    }) => {
      await page.goto(adapter.url(theme), { waitUntil: 'domcontentloaded' });
      const form = page.locator('[data-text-contract-form]');
      const trigger = form.getByRole('combobox', { name: 'Contract selection' });
      const shell = form.locator('.ui-select-shell');
      const panel = shell.getByRole('listbox');
      await trigger.press('ArrowDown');
      await expect(panel.getByRole('option', { name: 'Native', exact: true })).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(panel.getByRole('option', { name: 'Remote', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(panel).toBeHidden();
      await expect(form.locator('[data-select-requests]')).toHaveText('1');
      await expect(trigger).toContainText('Native');
      await expect(shell.locator('input[name="selection"]')).toHaveValue('native');
      await form.locator('[data-text-readonly]').click();
      await trigger.press('ArrowDown');
      await expect(panel).toBeHidden();
      await expect(form.locator('[data-select-requests]')).toHaveText('1');
    });
  }
}

for (const theme of ['light', 'dark']) {
  for (const name of ['Contract text', 'Contract notes']) {
    test(`Vue IME preserves composition through a consumer rerender / ${name} / ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`, {
        waitUntil: 'domcontentloaded',
      });
      const form = page.locator('[data-text-contract-form]');
      const editor = form.getByRole('textbox', { name, exact: true });
      const output = form.locator(
        name === 'Contract text' ? '[data-text-value]' : '[data-notes-value]',
      );
      const initial = await output.textContent();
      await editor.focus();
      await editor.evaluate((element) => {
        element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        (element as HTMLInputElement).value = 'ni';
        element.dispatchEvent(
          new InputEvent('input', { bubbles: true, isComposing: true, data: 'ni' }),
        );
      });
      await expect(output).toHaveText(initial ?? '');
      await form.locator('[data-text-toggle-hints]').click();
      await expect(editor).toHaveValue('ni');
      await editor.evaluate((element) => {
        (element as HTMLInputElement).value = '你好';
        element.dispatchEvent(
          new CompositionEvent('compositionend', { bubbles: true, data: '你好' }),
        );
      });
      await expect(output).toHaveText('你好');
      await expect(editor).toHaveValue('你好');
    });
  }

  test(`React uncontrolled text controls retain edits across rerenders and reset natively / ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`, {
      waitUntil: 'domcontentloaded',
    });
    const form = page.locator('[data-text-uncontrolled-form]');
    const input = form.getByRole('textbox', { name: 'Native text', exact: true });
    const notes = form.getByRole('textbox', { name: 'Native notes', exact: true });
    await input.fill('Edited input');
    await notes.fill('Edited\nnotes');
    await page.locator('[data-text-toggle-hints]').click();
    await expect(input).toHaveValue('Edited input');
    await expect(notes).toHaveValue('Edited\nnotes');
    await form.getByRole('button', { name: 'Reset native text' }).click();
    await expect(input).toHaveValue('Native input');
    await expect(notes).toHaveValue('Native notes');
  });
}
