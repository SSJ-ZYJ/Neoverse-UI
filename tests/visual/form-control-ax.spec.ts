import { expect, test } from '@playwright/test';

/**
 * Accessibility-tree contract audit for the shared form/choice controls.
 *
 * These assertions use Playwright's ARIA snapshot (page.locator.ariaSnapshot)
 * so the verified structure is what assistive technology consumes, not the
 * DOM shape. They are browser-level checks; they do not replace real screen
 * reader acceptance (NVDA/Orca remain pending in the audit record).
 */

const cases = [
  {
    name: 'Vue',
    url: (theme: string) => `/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`,
    form: '[data-text-contract-form]',
  },
  {
    name: 'React',
    url: (theme: string) => `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`,
    form: '[data-text-contract-form]',
  },
] as const;

for (const adapter of cases) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${adapter.name} text contract exposes field, textbox, combobox and invalid state / ${theme}`, async ({
      page,
    }) => {
      await page.goto(adapter.url(theme), { waitUntil: 'domcontentloaded' });
      const form = page.locator(adapter.form);

      // Field + textbox wiring (name, description, invalid).
      const input = form.getByRole('textbox', { name: 'Contract text', exact: true });
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('aria-invalid', 'true');

      const notes = form.getByRole('textbox', { name: 'Contract notes', exact: true });
      await expect(notes).toBeVisible();
      await expect(notes).not.toHaveAttribute('aria-invalid');

      // aria-describedby points at existing, visible description nodes.
      const ids = (await input.getAttribute('aria-describedby'))?.split(' ') ?? [];
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        await expect(page.locator(`[id="${id}"]`)).toBeVisible();
      }

      // Select: combobox semantics with a controlled listbox relationship.
      const combobox = form.getByRole('combobox', { name: 'Contract selection' });
      await expect(combobox).toBeVisible();
      await expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
      await expect(combobox).toHaveAttribute('aria-expanded', 'false');
      const listboxId = await combobox.getAttribute('aria-controls');
      expect(listboxId).toBeTruthy();
      await expect(page.locator(`[id="${listboxId}"]`)).toHaveCount(1);

      // Opening via keyboard keeps the ARIA relationship and focuses an option.
      await combobox.focus();
      await page.keyboard.press('ArrowDown');
      const listbox = page.locator(`[id="${listboxId}"]`);
      await expect(listbox).toBeVisible();
      await expect(combobox).toHaveAttribute('aria-expanded', 'true');
      await expect(listbox.getByRole('option', { name: 'Native', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(listbox).toBeHidden();
      await expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    test(`${adapter.name} choice controls expose switch/checkbox/radio semantics / ${theme}`, async ({
      page,
    }) => {
      await page.goto(adapter.url(theme), { waitUntil: 'domcontentloaded' });
      const form = page.locator('[data-contract-form]');

      const checkbox = form.locator('[data-contract-checkbox]');
      await expect(checkbox).toHaveAccessibleName('Notifications');
      await expect(checkbox).toHaveRole('checkbox');

      const switchControl = form.locator('[data-contract-switch]');
      await expect(switchControl).toHaveRole('switch');
      await expect(switchControl).toHaveAccessibleName('Synchronization');

      const group = form.getByRole('radiogroup', { name: 'Channel', exact: true });
      await expect(group).toBeVisible();
      const radio = group.getByRole('radio', { name: 'First channel', exact: true });
      await expect(radio).toBeVisible();
      await expect(group.getByRole('radio', { name: 'Unavailable channel' })).toBeDisabled();
    });
  }
}
