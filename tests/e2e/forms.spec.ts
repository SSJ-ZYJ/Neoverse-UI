import {
  adapters,
  describedTexts,
  disablePopoverApi,
  expect,
  formValues,
  test,
  themes,
} from '../support/e2e';

test.describe('forms', () => {
  for (const theme of themes) {
    test(`renders every form control in the ${theme} theme`, async ({ page }) => {
      await page.goto(adapters[0]?.url(theme) ?? '/');

      const form = page.locator('[data-text-contract-form]');
      await expect(form.getByRole('textbox', { name: 'Contract text', exact: true })).toBeVisible();
      await expect(
        form.getByRole('textbox', { name: 'Contract notes', exact: true }),
      ).toBeVisible();
      await expect(form.getByRole('combobox', { name: 'Contract selection' })).toBeVisible();
      await expect(
        page.locator('[data-contract-form]').getByRole('checkbox').first(),
      ).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    });
  }

  for (const adapter of adapters) {
    test(`${adapter.name}: field wires its label, description and validation state`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));

      const form = page.locator('[data-text-contract-form]');
      const input = form.getByRole('textbox', { name: 'Contract text', exact: true });
      const notes = form.getByRole('textbox', { name: 'Contract notes', exact: true });

      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(notes).not.toHaveAttribute('aria-invalid');
      expect(await describedTexts(input)).toEqual([
        'Text is included in the form.',
        'Review this value.',
      ]);

      await form.locator('[data-text-toggle-hints]').click();
      await expect(input).not.toHaveAttribute('aria-describedby');
      await expect(page.locator('[id$="-hint"]')).toHaveCount(0);
    });

    test(`${adapter.name}: readonly text controls keep their value and cannot be edited`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-text-contract-form]');
      const input = form.getByRole('textbox', { name: 'Contract text', exact: true });

      await form.locator('[data-text-readonly]').click();
      const value = await input.inputValue();
      await input.focus();
      await page.keyboard.type('must not mutate');
      await expect(input).toHaveValue(value);
      await expect(input).toBeFocused();
      await expect(await formValues(form)).toMatchObject({ text: value });
    });

    test(`${adapter.name}: disabled controls are removed from the submission`, async ({ page }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-text-contract-form]');
      const input = form.getByRole('textbox', { name: 'Contract text', exact: true });

      await form.locator('[data-text-disabled]').click();
      await expect(input).toBeDisabled();
      expect(await formValues(form)).toEqual({});
      await form.locator('[data-text-editable]').click();
      await expect(input).toBeEnabled();
    });

    test(`${adapter.name}: select supports keyboard entry, selection and focus return`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const trigger = page.getByRole('combobox', { name: 'Contract selection' });
      const shell = trigger.locator('xpath=..');
      const listbox = shell.getByRole('listbox');

      await trigger.focus();
      await trigger.press('ArrowDown');
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(listbox.getByRole('option', { name: 'Native', exact: true })).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(listbox.getByRole('option', { name: 'Remote', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(listbox).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page.locator('[data-select-requests]')).toHaveText('1');

      await trigger.press('ArrowUp');
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole('option', { name: 'Native', exact: true })).toBeFocused();
      await page.keyboard.press('End');
      await expect(listbox.getByRole('option', { name: 'Remote', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(listbox).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test(`${adapter.name}: select ignores the disabled option and a rejected change`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-text-contract-form]');
      const trigger = form.getByRole('combobox', { name: 'Contract selection' });
      const listbox = trigger.locator('xpath=..').getByRole('listbox');

      await trigger.press('ArrowDown');
      await expect(listbox.getByRole('option', { name: 'Native', exact: true })).toBeFocused();
      await expect(
        listbox.getByRole('option', { name: 'Unavailable', exact: true }),
      ).toBeDisabled();
      await page.keyboard.press('ArrowDown');
      await expect(listbox.getByRole('option', { name: 'Remote', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(form.locator('[data-select-requests]')).toHaveText('1');
      // The fixture is controlled and rejects the update, so the trigger keeps its value.
      await expect(trigger).toContainText('Native');

      await form.locator('[data-text-readonly]').click();
      await trigger.press('ArrowDown');
      await expect(listbox).toBeHidden();
      await expect(form.locator('[data-select-requests]')).toHaveText('1');
    });

    test(`${adapter.name}: fallback select closes when focus leaves with Tab`, async ({ page }) => {
      await disablePopoverApi(page);
      await page.goto(adapter.url('light'));
      const trigger = page.getByRole('combobox', { name: 'Contract selection' });
      const listbox = trigger.locator('xpath=..').getByRole('listbox');

      await trigger.focus();
      await trigger.press('ArrowDown');
      await expect(listbox).toBeVisible();

      const optionCount = await listbox.getByRole('option').count();
      for (let index = 0; index < optionCount + 2; index += 1) await page.keyboard.press('Tab');
      await expect(listbox).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    test(`${adapter.name}: choice labels activate the native control`, async ({ page }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-contract-form]');
      const checkbox = form.locator('[data-contract-checkbox]');
      const switchControl = form.locator('[data-contract-switch]');

      await checkbox.scrollIntoViewIfNeeded();
      await expect(checkbox).toBeChecked();
      const label = await form.getByText('Notifications', { exact: true }).boundingBox();
      if (label === null) throw new Error('The visible choice label is missing');
      await page.mouse.click(label.x + label.width / 2, label.y + label.height / 2);
      await expect(checkbox).not.toBeChecked();
      await checkbox.focus();
      await checkbox.press('Space');
      await expect(checkbox).toBeChecked();

      await expect(switchControl).toBeChecked();
      await switchControl.scrollIntoViewIfNeeded();
      const switchLabel = await form.getByText('Synchronization', { exact: true }).boundingBox();
      if (switchLabel === null) throw new Error('The visible switch label is missing');
      await page.mouse.click(
        switchLabel.x + switchLabel.width / 2,
        switchLabel.y + switchLabel.height / 2,
      );
      await expect(switchControl).not.toBeChecked();
    });

    test(`${adapter.name}: radio keyboard skips disabled options and updates the form state`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-contract-form]');
      const group = form.getByRole('radiogroup', { name: 'Channel', exact: true });
      const first = group.getByRole('radio', { name: 'First channel', exact: true });
      const second = group.getByRole('radio', { name: 'Second channel', exact: true });

      await expect(group.getByRole('radio', { name: 'Unavailable channel' })).toBeDisabled();
      await second.focus();
      await second.press('ArrowLeft');
      await expect(first).toBeFocused();
      await expect(first).toBeChecked();
      await page.keyboard.press('ArrowRight');
      await expect(second).toBeChecked();
      await expect(form.locator('[data-contract-form-state]')).toContainText(
        'true / 2 / true / number',
      );
    });

    test(`${adapter.name}: readonly choices keep submission and return on reset`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-contract-form]');
      const notifications = form.locator('[data-contract-checkbox]');
      const sync = form.locator('[data-contract-switch]');
      const lockedCheckbox = form.locator('[data-contract-readonly-checkbox]');

      await expect(lockedCheckbox).toHaveAttribute('aria-disabled', 'true');
      await lockedCheckbox.click({ force: true });
      await lockedCheckbox.focus();
      await page.keyboard.press('Space');
      await expect(lockedCheckbox).toBeChecked();
      // A pointer that misses the readonly row by one row would flip this
      // controlled switch instead; the submitted record would still look valid.
      await expect(sync).toBeChecked();
      expect(await formValues(form)).toMatchObject({ locked: 'yes', 'locked-channel': '2' });

      await notifications.uncheck();
      await form.locator('[data-contract-reset]').click();
      await expect(notifications).toBeChecked();
      await expect(form.locator('[data-contract-form-state]')).toContainText(
        'true / 2 / true / number',
      );
    });

    test(`${adapter.name}: controls expose their accessibility roles and names`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-contract-form]');

      await expect(form.locator('[data-contract-checkbox]')).toHaveRole('checkbox');
      await expect(form.locator('[data-contract-checkbox]')).toHaveAccessibleName('Notifications');
      await expect(form.locator('[data-contract-switch]')).toHaveRole('switch');
      await expect(form.locator('[data-contract-switch]')).toHaveAccessibleName('Synchronization');
      await expect(form.getByRole('radiogroup', { name: 'Channel', exact: true })).toBeVisible();
      await expect(
        form
          .getByRole('radiogroup', { name: 'Channel', exact: true })
          .getByRole('radio', { name: 'Unavailable channel' }),
      ).toBeDisabled();
      await expect(page.getByRole('combobox', { name: 'Contract selection' })).toHaveAttribute(
        'aria-haspopup',
        'listbox',
      );
    });
  }

  test('Vue: a rejected controlled checkbox restores the previous state', async ({ page }) => {
    await page.goto(adapters[0]?.url('light') ?? '/');
    const input = page.locator('.ui-choice-trap').locator('[data-contract-checkbox-reject]');

    await expect(input).toBeChecked();
    await input.scrollIntoViewIfNeeded();
    await input.click({ force: true });
    await expect(input).toBeChecked();
  });

  test('Vue: IME composition is not committed until composition ends', async ({ page }) => {
    await page.goto(adapters[0]?.url('light') ?? '/');
    const form = page.locator('[data-text-contract-form]');
    const editor = form.getByRole('textbox', { name: 'Contract text', exact: true });
    const output = form.locator('[data-text-value]');
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

    await editor.evaluate((element) => {
      (element as HTMLInputElement).value = '你好';
      element.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '你好' }),
      );
    });
    await expect(output).toHaveText('你好');
  });

  test('React: uncontrolled text controls keep edits and reset natively', async ({ page }) => {
    await page.goto(adapters[1]?.url('light') ?? '/');
    const form = page.locator('[data-text-uncontrolled-form]');
    const input = form.getByRole('textbox', { name: 'Native text', exact: true });

    await input.fill('Edited input');
    await page.locator('[data-text-toggle-hints]').click();
    await expect(input).toHaveValue('Edited input');
    await form.getByRole('button', { name: 'Reset native text' }).click();
    await expect(input).toHaveValue('Native input');
  });

  test('Vue: number steps stay in bounds and keep focus on the input', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=zh#controls');
    const input = page.locator('[data-custom-blur]');
    const shell = page.locator('.ui-input-number').filter({ has: input });

    await input.fill('18');
    await shell.getByRole('button', { name: '增加模糊', exact: true }).click();
    await expect(input).toHaveValue('19');
    await expect(input).toBeFocused();
    await shell.getByRole('button', { name: '减少模糊', exact: true }).click();
    await expect(input).toHaveValue('18');

    await input.fill('64');
    await shell.getByRole('button', { name: '增加模糊', exact: true }).click();
    await expect(input).toHaveValue('64');
    await input.fill('0');
    await shell.getByRole('button', { name: '减少模糊', exact: true }).click();
    await expect(input).toHaveValue('0');
  });

  test('React: number steps support decimals, bounds and locked states', async ({ page }) => {
    await page.goto('/react-fixture?lang=en&contract-fixtures=1');
    const input = page.getByRole('spinbutton', { name: 'Amount', exact: true });
    const shell = page.locator('.ui-input-number').filter({ has: input });

    await shell.getByRole('button', { name: 'Increase value', exact: true }).click();
    await expect(input).toHaveValue('2');
    await shell.getByRole('button', { name: 'Increase value', exact: true }).click();
    await expect(input).toHaveValue('2');
    await shell.getByRole('button', { name: 'Decrease value', exact: true }).click();
    await expect(input).toHaveValue('1.5');
    await input.fill('0');
    await shell.getByRole('button', { name: 'Decrease value', exact: true }).click();
    await expect(input).toHaveValue('0');

    for (const name of ['Disabled number', 'Readonly number']) {
      const locked = page.getByRole('spinbutton', { name, exact: true });
      const lockedShell = page.locator('.ui-input-number').filter({ has: locked });
      for (const button of await lockedShell.getByRole('button').all()) {
        await expect(button).toBeDisabled();
      }
    }
  });

  test('choice controls preview state with a flowing fill instead of a press shadow', async ({
    page,
  }) => {
    await page.goto('/?theme=light&lang=en#forms-checkbox', { waitUntil: 'domcontentloaded' });
    const input = page.locator('[data-form-checkbox]');
    const control = page.locator('[data-form-checkbox] + .ui-choice__control');
    const fillOpacity = () =>
      control.evaluate((element) => Number(getComputedStyle(element, '::after').opacity));
    const fillPaint = () =>
      control.evaluate((element) => {
        const style = getComputedStyle(element, '::after');
        return { display: style.display, background: style.backgroundImage };
      });
    const pressShadow = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.position = 'fixed';
      probe.style.opacity = '0';
      probe.style.boxShadow = 'var(--neoverse-effect-press-shadow)';
      document.body.append(probe);
      const value = getComputedStyle(probe).boxShadow;
      probe.remove();
      return value;
    });

    await expect(input).toBeChecked();
    // The Glass edge owns ::before; a fill that targets it is never painted.
    const paint = await fillPaint();
    expect(paint.display).toBe('block');
    expect(paint.background).toContain('linear-gradient');
    await input.click();
    await expect(input).not.toBeChecked();
    await expect.poll(fillOpacity).toBe(0);

    await input.hover();
    await page.mouse.down();
    try {
      await expect.poll(fillOpacity).toBeGreaterThan(0.4);
      const pressed = await control.evaluate((element) => ({
        shadow: getComputedStyle(element).boxShadow,
        transform: getComputedStyle(element).transform,
      }));
      expect(pressed.shadow).not.toBe(pressShadow);
      expect(pressed.transform).toBe('none');
    } finally {
      await page.mouse.up();
    }
    await expect(input).toBeChecked();
    await expect.poll(fillOpacity).toBe(1);
  });

  for (const adapter of adapters) {
    test(`${adapter.name}: single-line text caret paints above glass and tracks left/right movement immediately`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light'));
      const form = page.locator('[data-text-contract-form]');
      const input = form.getByRole('textbox', { name: 'Contract text', exact: true });
      const shell = input.locator('xpath=..');

      await input.fill('Neoverse Studio');
      await input.blur();
      const box = await input.boundingBox();
      if (box === null) throw new Error('Input bounding box is missing');

      // Clicking at the end of existing text mounts the caret directly at the clicked slot.
      await page.mouse.click(box.x + Math.min(box.width - 16, 260), box.y + box.height / 2);
      await expect(shell).toHaveAttribute('data-caret', 'overlay');
      const caret = shell.locator('.ui-input-caret');
      const glyph = caret.locator('.ui-input-caret__glyph');
      await expect(glyph).toBeVisible();

      const stacking = await shell.evaluate((node) => {
        const children = Array.from(node.children).map((child) => child.className);
        const overlay = node.querySelector('.ui-input-caret');
        const bar = overlay?.querySelector('.ui-input-caret__glyph');
        return {
          children,
          zIndex: overlay ? Number(getComputedStyle(overlay).zIndex) : 0,
          glyphTransform: bar ? getComputedStyle(bar).transform : '',
        };
      });
      expect(
        stacking.children.findIndex((name) => name.includes('ui-input-caret')),
      ).toBeGreaterThan(
        stacking.children.findIndex((name) => name.split(' ').includes('ui-input')),
      );
      expect(stacking.zIndex).toBeGreaterThan(0);
      expect(stacking.glyphTransform).toBe('none');

      // ArrowLeft must update the caret on keydown (before keyup) and glide smoothly.
      await page.keyboard.down('ArrowLeft');
      await expect(caret.locator('.ui-input-caret__prefix')).toHaveText('Neoverse Studi');
      await page.keyboard.up('ArrowLeft');

      // Long jump to Home starts an active transform glide and settles at the start.
      const beforeHome = await glyph.evaluate((el) => el.getBoundingClientRect().left);
      await page.keyboard.press('Home');
      await expect(caret.locator('.ui-input-caret__prefix')).toHaveText('');
      await expect
        .poll(() =>
          glyph.evaluate((el) => {
            const anims = el
              .getAnimations()
              .filter(
                (anim) => 'transitionProperty' in anim && anim.transitionProperty === 'transform',
              );
            return anims.length;
          }),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() => glyph.evaluate((el) => el.getBoundingClientRect().left))
        .toBeLessThan(beforeHome - 60);

      // Vertical alignment stays stable between ASCII and CJK characters.
      await input.fill('Hello 新宇宙');
      await page.keyboard.press('Home');
      const startTop = await glyph.evaluate((el) => el.getBoundingClientRect().top);
      await page.keyboard.press('End');
      const endTop = await glyph.evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(endTop - startTop)).toBeLessThanOrEqual(0.5);

      // Multi-line textarea shares the same caret above glass and glides across lines.
      const notes = form.getByRole('textbox', { name: 'Contract notes', exact: true });
      const notesShell = notes.locator('xpath=..');
      await notes.fill('Line one\nLine two');
      await notes.focus();
      await page.keyboard.press('End');
      await expect(notesShell).toHaveAttribute('data-caret', 'overlay');
      const notesCaret = notesShell.locator('.ui-textarea-caret');
      const notesGlyph = notesCaret.locator('.ui-textarea-caret__glyph');
      await expect(notesGlyph).toBeVisible();
      const notesStack = await notesShell.evaluate((node) => {
        const children = Array.from(node.children).map((child) => child.className);
        const overlay = node.querySelector('.ui-textarea-caret');
        return {
          children,
          zIndex: overlay ? Number(getComputedStyle(overlay).zIndex) : 0,
        };
      });
      expect(
        notesStack.children.findIndex((name) => name.includes('ui-textarea-caret')),
      ).toBeGreaterThan(
        notesStack.children.findIndex((name) => name.split(' ').includes('ui-textarea')),
      );
      expect(notesStack.zIndex).toBeGreaterThan(1);

      const lineTwoTop = await notesGlyph.evaluate((el) => el.getBoundingClientRect().top);
      await page.keyboard.down('ArrowUp');
      await expect(notesCaret.locator('.ui-textarea-caret__prefix')).toHaveText('Line one');
      await page.keyboard.up('ArrowUp');
      await expect
        .poll(() => notesGlyph.evaluate((el) => el.getBoundingClientRect().top))
        .toBeLessThan(lineTwoTop - 10);
    });
  }
});
