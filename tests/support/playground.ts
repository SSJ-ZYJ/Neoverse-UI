import { expect, type Locator, type Page } from '@playwright/test';

/** Open the Inspector through its mobile trigger and return its region. */
export async function showInspector(page: Page, mobile: boolean): Promise<Locator> {
  if (mobile) await page.locator('[data-playground-inspector-trigger]').click();
  return page.locator('#design-lab-inspector');
}

/** Pick one Inspector field option by its visible label. */
export async function chooseOption(inspector: Locator, field: string, name: string): Promise<void> {
  const editor = inspector.locator(`[data-specimen-control="${field}"]`);
  await editor.getByRole('combobox').click();
  await editor.getByRole('option', { name, exact: true }).click();
}

/** Switch the Design Lab language through the desktop radiogroup or the mobile cycle. */
export async function switchToChinese(page: Page, mobile: boolean): Promise<void> {
  const language = mobile
    ? page.getByRole('button', { name: /Switch language/ })
    : page.getByRole('radiogroup', { name: 'Language' }).getByRole('radio', { name: '中文' });
  await language.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
}
