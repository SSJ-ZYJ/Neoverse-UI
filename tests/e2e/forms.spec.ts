import { expect, test } from '@playwright/test';
import { adapters, describedTexts, disablePopoverApi, formValues, themes } from '../support/e2e';

test.describe('forms', () => {
  for (const theme of themes) {
    test(`renders every form control in the ${theme} theme`, async ({ page }) => {
      await page.goto(adapters[0]?.url(theme) ?? '/', { waitUntil: 'domcontentloaded' });

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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });

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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
      const form = page.locator('[data-contract-form]');
      const notifications = form.locator('[data-contract-checkbox]');
      const lockedCheckbox = form.locator('[data-contract-readonly-checkbox]');

      await expect(lockedCheckbox).toHaveAttribute('aria-disabled', 'true');
      await lockedCheckbox.click({ force: true });
      await lockedCheckbox.focus();
      await page.keyboard.press('Space');
      await expect(lockedCheckbox).toBeChecked();
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
      await page.goto(adapter.url('light'), { waitUntil: 'domcontentloaded' });
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
    await page.goto(adapters[0]?.url('light') ?? '/', { waitUntil: 'domcontentloaded' });
    const input = page.locator('.ui-choice-trap').locator('[data-contract-checkbox-reject]');

    await expect(input).toBeChecked();
    await input.scrollIntoViewIfNeeded();
    await input.click({ force: true });
    await expect(input).toBeChecked();
  });

  test('Vue: IME composition is not committed until composition ends', async ({ page }) => {
    await page.goto(adapters[0]?.url('light') ?? '/', { waitUntil: 'domcontentloaded' });
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
    await page.goto(adapters[1]?.url('light') ?? '/', { waitUntil: 'domcontentloaded' });
    const form = page.locator('[data-text-uncontrolled-form]');
    const input = form.getByRole('textbox', { name: 'Native text', exact: true });

    await input.fill('Edited input');
    await page.locator('[data-text-toggle-hints]').click();
    await expect(input).toHaveValue('Edited input');
    await form.getByRole('button', { name: 'Reset native text' }).click();
    await expect(input).toHaveValue('Native input');
  });

  test('Vue: number steps stay in bounds and keep focus on the input', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=zh#controls', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
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
});
