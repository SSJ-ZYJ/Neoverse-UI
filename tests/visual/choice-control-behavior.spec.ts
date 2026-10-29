import { expect, test } from '@playwright/test';

for (const adapter of ['Vue', 'React']) {
  for (const theme of ['light', 'dark']) {
    for (const control of [
      { name: 'Checkbox', label: 'Notifications', selector: '[data-contract-checkbox]' },
      { name: 'Switch', label: 'Synchronization', selector: '[data-contract-switch]' },
    ]) {
      test(`${adapter} ${control.name} label activates the native control / ${theme}`, async ({
        page,
        browserName,
      }) => {
        const url =
          adapter === 'Vue'
            ? `/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`
            : `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const form = page.locator('[data-contract-form]');
        const input = form.locator(control.selector);
        await expect(input).toBeChecked();
        await input.scrollIntoViewIfNeeded();
        const label = await form.getByText(control.label, { exact: true }).boundingBox();
        if (!label) throw new Error('The visible choice label is missing.');
        // Vue overlays its native input over the row; click the user's visible
        // label coordinates rather than requiring the text span to receive it.
        await page.mouse.click(label.x + label.width / 2, label.y + label.height / 2);
        await expect(input).not.toBeChecked();
        // WebKit preserves its platform's mouse-focus policy. Keyboard focus is
        // still required; do not impose Chromium's pointer policy on the adapter.
        if (browserName !== 'webkit') await expect(input).toBeFocused();
        await input.focus();
        await expect(input).toBeFocused();
        await input.press('Space');
        await expect(input).toBeChecked();
      });
    }
  }
}

for (const adapter of ['Vue', 'React']) {
  for (const theme of ['light', 'dark']) {
    test(`${adapter} RadioGroup keyboard skips disabled options and preserves native group state / ${theme}`, async ({
      page,
    }) => {
      const url =
        adapter === 'Vue'
          ? `/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`
          : `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const form = page.locator('[data-contract-form]');
      const group = form.getByRole('radiogroup', { name: 'Channel', exact: true });
      const first = group.getByRole('radio', { name: 'First channel', exact: true });
      const second = group.getByRole('radio', { name: 'Second channel', exact: true });
      await expect(group.getByRole('radio', { name: 'Unavailable channel' })).toBeDisabled();
      await second.focus();
      await second.press('ArrowRight');
      await expect(first).toBeFocused();
      await expect(first).toBeChecked();
      await expect(second).not.toBeChecked();
      await page.keyboard.press('ArrowLeft');
      await expect(second).toBeFocused();
      await expect(second).toBeChecked();
      await expect(form.locator('[data-contract-form-state]')).toContainText(
        'true / 2 / true / number',
      );
    });
  }
}
