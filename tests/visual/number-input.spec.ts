import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`Vue number steps update the material preview / ${theme}`, async ({ page }, testInfo) => {
    await page.goto(`/frame?theme=${theme}&lang=zh#controls`);
    const input = page.locator('[data-custom-blur]');
    const shell = page.locator('.ui-input-number').filter({ has: input });
    await expect(shell.getByRole('button')).toHaveCount(2);
    await expect(input).toHaveCSS('appearance', 'textfield');
    await expect(input).toHaveCSS('min-height', '40px');
    await input.fill('18');
    await shell.getByRole('button', { name: '增加模糊', exact: true }).click();
    await expect(input).toHaveValue('19');
    await expect(input).toBeFocused();
    await shell.getByRole('button', { name: '减少模糊', exact: true }).click();
    await expect(input).toHaveValue('18');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('19');
    await input.fill('64');
    await shell.getByRole('button', { name: '增加模糊', exact: true }).click();
    await expect(input).toHaveValue('64');
    await input.fill('0');
    await shell.getByRole('button', { name: '减少模糊', exact: true }).click();
    await expect(input).toHaveValue('0');
    await input.fill('18');
    await page.mouse.move(0, 0);
    await shell.screenshot({ path: testInfo.outputPath(`number-input-${theme}.png`) });
  });
}

test('React number steps preserve controlled updates, decimal steps, bounds and locked states', async ({
  page,
}) => {
  await page.goto('/react-fixture?lang=en&contract-fixtures=1');
  const input = page.getByRole('spinbutton', { name: 'Amount', exact: true });
  const shell = page.locator('.ui-input-number').filter({ has: input });
  await shell.getByRole('button', { name: 'Increase value', exact: true }).click();
  await expect(input).toHaveValue('2');
  await expect(page.locator('[data-number-value]')).toHaveText('2');
  await shell.getByRole('button', { name: 'Increase value', exact: true }).click();
  await expect(input).toHaveValue('2');
  await shell.getByRole('button', { name: 'Decrease value', exact: true }).click();
  await expect(input).toHaveValue('1.5');
  await expect(page.locator('[data-number-value]')).toHaveText('1.5');
  await input.fill('0');
  await shell.getByRole('button', { name: 'Decrease value', exact: true }).click();
  await expect(input).toHaveValue('0');
  await input.fill('');
  await shell.getByRole('button', { name: 'Increase value', exact: true }).click();
  await expect(input).toHaveValue('0.5');
  const anyInput = page.getByRole('spinbutton', { name: 'Any step', exact: true });
  const anyShell = page.locator('.ui-input-number').filter({ has: anyInput });
  await anyShell.getByRole('button', { name: 'Increase value', exact: true }).click();
  await expect(anyInput).toHaveValue('2.25');
  for (const name of ['Disabled number', 'Readonly number']) {
    const locked = page.getByRole('spinbutton', { name, exact: true });
    const lockedShell = page.locator('.ui-input-number').filter({ has: locked });
    for (const button of await lockedShell.getByRole('button').all()) {
      await expect(button).toBeDisabled();
    }
  }
});
