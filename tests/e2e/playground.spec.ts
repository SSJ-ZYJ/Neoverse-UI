import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';

async function showInspector(page: Page, mobile: boolean): Promise<Locator> {
  if (mobile) await page.locator('[data-playground-inspector-trigger]').click();
  return page.locator('#design-lab-inspector');
}

async function chooseOption(inspector: Locator, field: string, name: string): Promise<void> {
  const editor = inspector.locator(`[data-specimen-control="${field}"]`);
  await editor.getByRole('combobox').click();
  await editor.getByRole('option', { name, exact: true }).click();
}

async function switchToChinese(page: Page, mobile: boolean): Promise<void> {
  const language = mobile
    ? page.getByRole('button', { name: /Switch language/ })
    : page.getByRole('radiogroup', { name: 'Language' }).getByRole('radio', { name: '中文' });
  await language.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
}

test('every Explorer specimen opens a nonempty, independently sized preview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=system&lang=en', { waitUntil: 'domcontentloaded' });
  const explorer = page.locator('[data-playground-navigation]');
  const links = explorer.locator('.playground-explorer__specimens a[href^="#"]');
  await expect(links.first()).toBeAttached();
  const hashes = await links.evaluateAll((items) =>
    items.flatMap((item) => (item instanceof HTMLAnchorElement ? [item.hash] : [])),
  );
  const stage = page.locator('[data-design-lab-workspace]');
  for (const hash of [...hashes, '#foundation-layout-shape', '#forms-choice-controls']) {
    await test.step(hash, async () => {
      await page.goto(`/?theme=system&lang=en${hash}`, { waitUntil: 'domcontentloaded' });
      const specimen = stage.locator(`[data-design-lab-region="specimen"]${hash}`);
      await expect(specimen).toBeVisible();
      await expect(page.locator(hash)).toHaveCount(1);
      await expect(
        stage.locator('[data-design-lab-region="module"], [data-qa-matrix]'),
      ).toHaveCount(0);
      expect(
        await specimen.locator('.playground-stage__specimen-content').evaluate((content) => {
          const { height, width } = content.getBoundingClientRect();
          return (
            width > 0 &&
            height > 0 &&
            Array.from(content.children).some((child) => {
              const rect = child.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            })
          );
        }),
      ).toBe(true);
      expect(
        await stage.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
});

test('focused compositions and foundations keep the full galleries in the isolated frame', async ({
  page,
}) => {
  await page.goto('/?lang=en#composition-standard-mode', { waitUntil: 'domcontentloaded' });
  const composition = page.locator('[data-design-lab-region="specimen"]#composition-standard-mode');
  await expect(composition.locator('[data-composition-surface]')).toHaveCount(2);
  await expect(composition.getByRole('heading', { name: 'Atlas workspace' })).toBeVisible();
  await expect(composition.getByRole('heading', { name: 'Aurora Atlas' })).toBeVisible();
  await expect(composition.locator('#composition-reading')).toHaveCount(0);
  await expect(composition.locator('#composition-control-cluster')).toHaveCount(0);

  await page.goto('/?lang=en#foundation-layout-shape', { waitUntil: 'domcontentloaded' });
  const geometry = page.locator('[data-design-lab-region="specimen"]#foundation-layout-shape');
  for (const preview of ['space', 'radius', 'border']) {
    await expect(geometry.locator(`[data-token-preview="${preview}"]`).first()).toBeVisible();
  }
  await expect(geometry.locator('[data-token-preview="layout"]')).toHaveCount(0);
  await expect(geometry.locator('#spacing-alias, #radius-alias, #border-style')).toHaveCount(0);

  await page.goto('/frame?theme=light&lang=en#composition-standard-mode', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('#composition-reading')).toBeVisible();
  await expect(page.locator('#composition-control-cluster')).toBeVisible();
  await expect(page.locator('#composition-floating-toolbar')).toBeVisible();
  await expect(page.locator('#composition-project-card').getByRole('progressbar')).toBeVisible();
  const docsMode = page.locator('#composition-docs-toolbar').getByRole('radiogroup');
  await docsMode.getByRole('radio', { name: 'Preview' }).press('Space');
  await expect(docsMode.getByRole('radio', { name: 'Preview' })).toBeChecked();
  await expect(page.locator('[data-specimen-control="preset"]')).toHaveCount(0);

  await page.goto('/frame?theme=light&lang=en#foundation-layout-shape', {
    waitUntil: 'domcontentloaded',
  });
  for (const id of ['spacing-alias', 'radius-alias', 'border-style']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator('[data-token-preview="layout"]').first()).toBeVisible();
});

test('Control Cluster applies workspace presets and resets the live controls in place', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/?lang=en&theme=light#composition-control-cluster');
  const surface = page.locator('#composition-control-cluster [data-composition-surface]');
  const mode = surface.getByRole('radiogroup');
  const status = surface.locator('[data-specimen-status]');
  const root = await surface.elementHandle();
  const segments = await mode.elementHandle();
  await expect(surface).toHaveCSS('padding', '16px');
  await expect(mode.getByRole('radio', { checked: true })).toHaveText('Focus');
  await expect(status).toBeVisible();

  const inspector = await showInspector(page, mobile);
  const preset = inspector.locator('[data-specimen-control="preset"]').getByRole('combobox');
  const modeEditor = inspector.locator('[data-specimen-control="mode"]').getByRole('combobox');
  await expect(preset).toHaveText('Default Workspace');
  await chooseOption(inspector, 'preset', 'Compact Workspace');
  await expect(surface).toHaveCSS('padding', '8px');
  await expect(surface).toHaveAttribute('data-surface', 'elevated');
  await expect(status).toHaveCount(0);
  await expect(modeEditor).toHaveText('Review');
  await expect(mode.getByRole('radio', { checked: true, includeHidden: mobile })).toHaveText(
    'Review',
  );

  await chooseOption(inspector, 'mode', 'Focus');
  await inspector
    .locator('[data-specimen-control="showStatus"]')
    .getByRole('switch')
    .press('Space');
  if (mobile) await page.keyboard.press('Escape');
  await expect(status).toBeVisible();
  const focus = mode.getByRole('radio', { name: 'Focus' });
  await expect(focus).toBeChecked();
  await focus.press('End');
  await expect(mode.getByRole('radio', { name: 'Archive' })).toBeFocused();
  await showInspector(page, mobile);
  await expect(modeEditor).toHaveText('Archive');
  await inspector.getByRole('button', { name: 'Reset specimen' }).press('Enter');
  await expect(preset).toHaveText('Compact Workspace');
  await expect(modeEditor).toHaveText('Review');
  if (mobile) await page.keyboard.press('Escape');
  await expect(mode.getByRole('radio', { checked: true })).toHaveText('Review');
  await expect(status).toHaveCount(0);
  expect(await surface.evaluate((node, previous) => node === previous, root)).toBe(true);
  expect(await mode.evaluate((node, previous) => node === previous, segments)).toBe(true);
});

test('Floating Toolbar changes its layout without scaling buttons and restores the compact preset', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/?lang=en&theme=dark#composition-floating-toolbar');
  const toolbar = page.locator('#composition-floating-toolbar [data-composition-surface]');
  const group = toolbar.getByRole('radiogroup');
  const actions = toolbar.locator('[data-specimen-extra-actions]');
  const coreAction = toolbar.getByRole('button', { name: 'Add canvas item' });
  const root = await toolbar.elementHandle();
  const initialButton = await coreAction.boundingBox();
  const initialToolbar = await toolbar.boundingBox();
  await expect(actions).toBeVisible();
  await expect(group.getByRole('radio', { name: 'Canvas' })).toBeChecked();

  const inspector = await showInspector(page, mobile);
  await chooseOption(inspector, 'preset', 'Compact Toolbar');
  await expect(toolbar).toHaveCSS('padding', '8px');
  await expect(toolbar).toHaveAttribute('data-surface', 'glass-subtle');
  await expect(actions).toHaveCount(0);
  if (mobile) await page.keyboard.press('Escape');
  await expect(group.getByRole('radio', { name: 'Inspect' })).toBeChecked();
  expect((await coreAction.boundingBox())?.width).toBe(initialButton?.width);
  expect((await toolbar.boundingBox())?.height).toBeLessThan(initialToolbar?.height ?? 0);
  await expectNoPageOverflow(page);
  await group.getByRole('radio', { name: 'History' }).click();

  await showInspector(page, mobile);
  const mode = inspector.locator('[data-specimen-control="mode"]').getByRole('combobox');
  await expect(mode).toHaveText('History');
  await chooseOption(inspector, 'mode', 'Canvas');
  await inspector
    .locator('[data-specimen-control="showActions"]')
    .getByRole('switch')
    .press('Space');
  if (mobile) await page.keyboard.press('Escape');
  await expect(actions).toBeVisible();
  await expect(group.getByRole('radio', { name: 'Canvas' })).toBeChecked();
  await showInspector(page, mobile);
  await inspector.getByRole('button', { name: 'Reset specimen' }).press('Enter');
  if (mobile) await page.keyboard.press('Escape');
  await expect(actions).toHaveCount(0);
  await expect(group.getByRole('radio', { name: 'Inspect' })).toBeChecked();
  expect(await toolbar.evaluate((node, previous) => node === previous, root)).toBe(true);
});

test('Project Card presets change the rendered content and keep progress accessible', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/?lang=en&theme=light#composition-project-card');
  const card = page.locator('#composition-project-card [data-composition-surface]');
  const progress = card.locator('progress');
  const summary = card.locator('[data-specimen-project-summary]');
  const actions = card.locator('[data-specimen-extra-actions]');
  const status = card.locator('[data-specimen-status]');
  const printed = card.locator('[data-specimen-progress-value]');
  const root = await card.elementHandle();
  const bar = await progress.elementHandle();
  await expect(summary).toBeVisible();
  await expect(actions).toBeVisible();
  await expect(card.getByRole('progressbar', { name: 'Delivery' })).toHaveJSProperty(
    'position',
    0.68,
  );

  const inspector = await showInspector(page, mobile);
  const preset = inspector.locator('[data-specimen-control="preset"]').getByRole('combobox');
  await chooseOption(inspector, 'preset', 'Overview Card');
  await expect(card).toHaveAttribute('data-surface', 'elevated');
  await expect(summary).toHaveCount(0);
  await expect(actions).toHaveCount(0);
  await expect(status).toHaveText('Needs review');
  await expect(progress).toHaveJSProperty('position', 0.4);
  await expect(printed).toHaveText('40%');

  const slider = inspector.getByRole('slider', { name: 'Delivery progress' });
  await slider.press('Home');
  await expect(progress).toHaveJSProperty('position', 0);
  await expect(printed).toHaveText('0%');
  await slider.press('End');
  await expect(progress).toHaveJSProperty('position', 1);
  await expect(printed).toHaveText('100%');
  await chooseOption(inspector, 'content', 'Detailed');
  await chooseOption(inspector, 'status', 'Blocked');
  await expect(actions).toBeVisible();
  await expect(status).toHaveText('Blocked');
  await inspector.getByRole('button', { name: 'Reset specimen' }).press('Enter');
  await expect(preset).toHaveText('Overview Card');
  await expect(progress).toHaveJSProperty('position', 0.4);
  await expect(status).toHaveText('Needs review');
  await expect(actions).toHaveCount(0);
  expect(await card.evaluate((node, previous) => node === previous, root)).toBe(true);
  expect(await progress.evaluate((node, previous) => node === previous, bar)).toBe(true);
});

test('Docs Toolbar shares the editing mode with its Inspector and resets without remounting', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/?lang=en&theme=dark#composition-docs-toolbar');
  const toolbar = page.locator('#composition-docs-toolbar [data-composition-surface]');
  const group = toolbar.getByRole('radiogroup');
  const copyLink = toolbar.locator('[data-specimen-extra-actions]');
  const root = await toolbar.elementHandle();
  const segments = await group.elementHandle();
  await expect(copyLink).toBeVisible();
  await expect(group.getByRole('radio', { name: 'Read', exact: true })).toBeChecked();

  const inspector = await showInspector(page, mobile);
  const preset = inspector.locator('[data-specimen-control="preset"]').getByRole('combobox');
  const modeEditor = inspector.locator('[data-specimen-control="mode"]').getByRole('combobox');
  await chooseOption(inspector, 'preset', 'Editing Toolbar');
  await expect(toolbar).toHaveCSS('padding', '8px');
  await expect(toolbar).toHaveAttribute('data-surface', 'glass-elevated');
  await expect(copyLink).toHaveCount(0);
  await expect(modeEditor).toHaveText('Edit');
  if (mobile) await page.keyboard.press('Escape');
  const edit = group.getByRole('radio', { name: 'Edit' });
  await expect(edit).toBeChecked();
  await edit.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Preview' })).toBeFocused();

  await showInspector(page, mobile);
  await expect(modeEditor).toHaveText('Preview');
  await chooseOption(inspector, 'mode', 'Read');
  await inspector
    .locator('[data-specimen-control="showActions"]')
    .getByRole('switch')
    .press('Space');
  if (mobile) await page.keyboard.press('Escape');
  await expect(copyLink).toBeVisible();
  await expect(group.getByRole('radio', { name: 'Read', exact: true })).toBeChecked();
  await showInspector(page, mobile);
  await inspector.getByRole('button', { name: 'Reset specimen' }).press('Enter');
  await expect(preset).toHaveText('Editing Toolbar');
  if (mobile) await page.keyboard.press('Escape');
  await expect(edit).toBeChecked();
  await expect(copyLink).toHaveCount(0);
  expect(await toolbar.evaluate((node, previous) => node === previous, root)).toBe(true);
  expect(await group.evaluate((node, previous) => node === previous, segments)).toBe(true);
});

test('a configuration change that hides the focused control falls back inside the scene', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'The persistent Inspector owns focus on the touch layout.',
  );
  const inspector = page.locator('#design-lab-inspector');
  const reset = inspector.getByRole('button', { name: 'Reset specimen' });

  await test.step('Docs Toolbar', async () => {
    await page.goto('/?lang=en#composition-docs-toolbar');
    const toolbar = page.locator('#composition-docs-toolbar');
    const surface = toolbar.locator('[data-composition-surface]');
    const root = await surface.elementHandle();
    await chooseOption(inspector, 'preset', 'Editing Toolbar');
    await inspector
      .locator('[data-specimen-control="showActions"]')
      .getByRole('switch')
      .press('Space');
    const copyLink = toolbar.getByRole('button', { name: 'Copy link', exact: true });
    await copyLink.click();
    await expect(copyLink).toBeFocused();
    // Reset with an activation that leaves focus in the scene, as a
    // platform-level click or an assistive-technology action can.
    await reset.dispatchEvent('click');
    await expect(toolbar.getByRole('button', { name: 'More documentation actions' })).toBeFocused();
    await expect(surface).toHaveAttribute('data-surface', 'glass-elevated');
    expect(await surface.evaluate((node, previous) => node === previous, root)).toBe(true);
  });

  await test.step('Floating Toolbar', async () => {
    await page.goto('/?lang=en#composition-floating-toolbar');
    const toolbar = page.locator('#composition-floating-toolbar');
    const surface = toolbar.locator('[data-composition-surface]');
    const root = await surface.elementHandle();
    await chooseOption(inspector, 'preset', 'Compact Toolbar');
    await inspector
      .locator('[data-specimen-control="showActions"]')
      .getByRole('switch')
      .press('Space');
    const share = toolbar.getByRole('button', { name: 'Share', exact: true });
    await share.click();
    await expect(share).toBeFocused();
    await reset.dispatchEvent('click');
    await expect(toolbar.getByRole('button', { name: 'More canvas actions' })).toBeFocused();
    await expect(surface).toHaveAttribute('data-surface', 'glass-subtle');
    expect(await surface.evaluate((node, previous) => node === previous, root)).toBe(true);
  });

  await test.step('Project Card', async () => {
    await page.goto('/?lang=en#composition-project-card');
    const card = page.locator('#composition-project-card');
    const surface = card.locator('[data-composition-surface]');
    const root = await surface.elementHandle();
    await chooseOption(inspector, 'preset', 'Overview Card');
    await chooseOption(inspector, 'content', 'Detailed');
    const open = card.getByRole('button', { name: 'Open project', exact: true });
    await open.click();
    await expect(open).toBeFocused();
    await reset.dispatchEvent('click');
    await expect(card.getByRole('button', { name: 'More project actions' })).toBeFocused();
    await expect(surface).toHaveAttribute('data-surface', 'elevated');
    expect(await surface.evaluate((node, previous) => node === previous, root)).toBe(true);
  });
});

test('a reset keeps focus on a scene control that remains visible', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'The persistent Inspector owns focus on the touch layout.',
  );
  await page.goto('/?lang=en#composition-control-cluster');
  const cluster = page.locator('#composition-control-cluster');
  const inspector = page.locator('#design-lab-inspector');
  await chooseOption(inspector, 'preset', 'Compact Workspace');
  const archive = cluster.getByRole('radio', { name: 'Archive', exact: true });
  await archive.click();
  await expect(archive).toBeFocused();
  await inspector.getByRole('button', { name: 'Reset specimen' }).dispatchEvent('click');
  await expect(cluster.getByRole('radio', { name: 'Review', exact: true })).toBeChecked();
  await expect(archive).toBeFocused();
});

test('an Inspector preset change keeps focus in the Inspector', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/?lang=en#composition-floating-toolbar');
  const toolbar = page.locator('#composition-floating-toolbar');
  await toolbar.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(toolbar.getByRole('button', { name: 'Share', exact: true })).toBeFocused();
  const inspector = await showInspector(page, mobile);
  const picker = inspector.locator('[data-specimen-control="preset"]').getByRole('combobox');
  await chooseOption(inspector, 'preset', 'Compact Toolbar');
  await expect(picker).toBeFocused();
  await expect(toolbar.locator(':focus')).toHaveCount(0);
  if (mobile) await page.keyboard.press('Escape');
  await expect(toolbar.locator('[data-composition-surface]')).toHaveCSS('padding', '8px');
});

test('the mobile composition Inspector drawer returns focus to its trigger', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The drawer only exists below the xl breakpoint.');
  await page.goto('/?lang=en#composition-docs-toolbar');
  const toolbar = page.locator('#composition-docs-toolbar');
  const trigger = page.locator('[data-playground-inspector-trigger]');
  await trigger.click();
  const drawer = page.getByRole('dialog', { name: 'Inspector' });
  await expect(drawer.getByRole('button', { name: 'Close Inspector' })).toBeFocused();
  await chooseOption(drawer, 'preset', 'Editing Toolbar');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(toolbar.locator('[data-composition-surface]')).toHaveCSS('padding', '8px');
  await expect(toolbar.locator(':focus')).toHaveCount(0);
});

test('Composition history restores default presets while preferences preserve current edits', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/?lang=en&theme=light#composition-control-cluster');
  const cluster = page.locator('#composition-control-cluster');
  const surface = cluster.locator('[data-composition-surface]');
  const root = await surface.elementHandle();
  const inspector = await showInspector(page, mobile);
  const preset = inspector.locator('[data-specimen-control="preset"]').getByRole('combobox');
  const mode = inspector.locator('[data-specimen-control="mode"]').getByRole('combobox');
  await chooseOption(inspector, 'preset', 'Compact Workspace');
  await chooseOption(inspector, 'mode', 'Archive');
  if (mobile) await page.keyboard.press('Escape');

  const dark = mobile
    ? page.getByRole('button', { name: /Cycle theme/ })
    : page
        .getByRole('radiogroup', { name: 'Playground theme' })
        .getByRole('radio', { name: 'Dark' });
  await dark.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await switchToChinese(page, mobile);
  await expect(cluster.getByRole('radio', { checked: true })).toHaveText('归档');
  expect(await surface.evaluate((node, previous) => node === previous, root)).toBe(true);
  await showInspector(page, mobile);
  await expect(preset).toHaveText('紧凑工作区');
  await expect(mode).toHaveText('归档');
  if (mobile) await page.keyboard.press('Escape');

  if (mobile) await page.locator('[data-playground-nav-trigger]').click();
  await page.locator('[data-playground-navigation] a[href="#composition-docs-toolbar"]').click();
  const docs = page.locator('#composition-docs-toolbar');
  await expect(docs).toBeFocused();
  await expect(docs.getByRole('radio', { checked: true })).toHaveText('阅读');
  await showInspector(page, mobile);
  await chooseOption(inspector, 'preset', '编辑工具栏');
  if (mobile) await page.keyboard.press('Escape');

  await page.goBack();
  await expect(cluster).toBeFocused();
  await expect(cluster.getByRole('radio', { checked: true })).toHaveText('聚焦');
  expect(await root?.evaluate((node) => node.isConnected)).toBe(false);
  await showInspector(page, mobile);
  await expect(preset).toHaveText('默认工作区');
  if (mobile) await page.keyboard.press('Escape');
  await page.goForward();
  await expect(docs).toBeFocused();
  await expect(docs.getByRole('radio', { checked: true })).toHaveText('阅读');
  await showInspector(page, mobile);
  await expect(preset).toHaveText('阅读工具栏');
});

const compositionCases = [
  {
    id: 'composition-control-cluster',
    alternate: 'Compact Workspace',
    alternateZh: '紧凑工作区',
    surfaces: ['glass-subtle', 'elevated'],
    tabs: ['More workspace actions', 'Focus', 'Apply'],
    compactTabs: ['More workspace actions', 'Review', 'Apply'],
  },
  {
    id: 'composition-floating-toolbar',
    alternate: 'Compact Toolbar',
    alternateZh: '紧凑工具栏',
    surfaces: ['glass-immersive', 'glass-subtle'],
    tabs: [
      'Highlight selection',
      'Add canvas item',
      'Confirm canvas changes',
      'More canvas actions',
      'Canvas',
      'Share',
      'Publish',
    ],
    compactTabs: [
      'Highlight selection',
      'Add canvas item',
      'Confirm canvas changes',
      'More canvas actions',
      'Inspect',
    ],
  },
  {
    id: 'composition-project-card',
    alternate: 'Overview Card',
    alternateZh: '概览卡片',
    surfaces: ['glass-elevated', 'elevated'],
    tabs: ['More project actions', 'Open project'],
    compactTabs: ['More project actions'],
  },
  {
    id: 'composition-docs-toolbar',
    alternate: 'Editing Toolbar',
    alternateZh: '编辑工具栏',
    surfaces: ['glass-subtle', 'glass-elevated'],
    tabs: ['Read', 'Copy link', 'More documentation actions'],
    compactTabs: ['Edit', 'More documentation actions'],
  },
] as const;

test('Composition presets keep keyboard order and remove hidden actions from the tab sequence', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  for (const { id, alternate, tabs, compactTabs } of compositionCases) {
    await test.step(id, async () => {
      await page.goto(`/?lang=en#${id}`);
      const specimen = page.locator(`#${id}`);
      await expect(specimen).toBeFocused();
      const control = (name: string) =>
        specimen
          .getByRole('radio', { name, exact: true })
          .or(specimen.getByRole('button', { name, exact: true }));

      // Start from a clicked control: the deep-link section uses tabindex -1,
      // so Chrome re-enters the scene from that origin when the window is not
      // focused. A clicked control gives the walk a stable, user-like origin.
      async function expectTabSequence(names: readonly string[]): Promise<void> {
        const [first, ...rest] = names;
        if (first === undefined) throw new Error('A tab sequence needs one control');
        await control(first).click();
        await expect(control(first)).toBeFocused();
        for (const name of rest) {
          await page.keyboard.press('Tab');
          await expect(control(name)).toBeFocused();
        }
        await page.keyboard.press('Tab');
        await expect(specimen.locator(':focus')).toHaveCount(0);
      }

      await expectTabSequence(tabs);
      const inspector = await showInspector(page, mobile);
      await chooseOption(inspector, 'preset', alternate);
      if (mobile) await page.keyboard.press('Escape');
      await expectTabSequence(compactTabs);
    });
  }
});

test('Composition presets fit the stage across themes and viewport sizes with reduced motion', async ({
  page,
}, testInfo) => {
  // Four scenes across two presets, themes, and widths: 40 fresh loads.
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of testInfo.project.name === 'mobile' ? [390] : [768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      for (const { id, alternate, surfaces } of compositionCases) {
        await test.step(`${width}px ${theme}: ${id}`, async () => {
          await page.goto(`/?lang=en&theme=${theme}#${id}`);
          const stage = page.locator('[data-design-lab-workspace]');
          const surface = stage.locator('[data-composition-surface]');
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          async function expectSceneFit(presetSurface: string): Promise<void> {
            await expect(surface).toHaveAttribute('data-surface', presetSurface);
            await expect(surface).toHaveCSS(
              'backdrop-filter',
              presetSurface.startsWith('glass-') ? /blur\(/ : 'none',
            );
            await expectNoPageOverflow(page);
            expect(
              await stage.evaluate((node) => node.scrollWidth - node.clientWidth),
            ).toBeLessThanOrEqual(1);
            expect(
              await surface.evaluate((node) => node.scrollWidth - node.clientWidth),
            ).toBeLessThanOrEqual(1);
          }

          await expectSceneFit(surfaces[0]);
          const drawer = width < 1280;
          const inspector = await showInspector(page, drawer);
          await chooseOption(inspector, 'preset', alternate);
          if (drawer) await page.keyboard.press('Escape');
          await expectSceneFit(surfaces[1]);
          if (id !== 'composition-project-card') {
            await expect(surface).toHaveCSS('padding', '8px');
            await expect(surface).toHaveCSS('transition-property', 'none');
          }
        });
      }
    }
  }
});

test('Composition presets fit long Chinese labels at the touch and desktop breakpoints', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const width = testInfo.project.name === 'mobile' ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  for (const theme of ['light', 'dark'] as const) {
    for (const { id, alternateZh } of compositionCases) {
      await test.step(`${width}px ${theme}: ${id}`, async () => {
        await page.goto(`/?lang=zh&theme=${theme}#${id}`);
        const stage = page.locator('[data-design-lab-workspace]');
        const surface = stage.locator('[data-composition-surface]');
        await expectNoPageOverflow(page);
        expect(
          await stage.evaluate((node) => node.scrollWidth - node.clientWidth),
        ).toBeLessThanOrEqual(1);
        const drawer = width < 1280;
        const inspector = await showInspector(page, drawer);
        await chooseOption(inspector, 'preset', alternateZh);
        if (drawer) await page.keyboard.press('Escape');
        await expectNoPageOverflow(page);
        expect(
          await surface.evaluate((node) => node.scrollWidth - node.clientWidth),
        ).toBeLessThanOrEqual(1);
      });
    }
  }
});

test('a composition preset switch uses the spatial padding transition', async ({
  page,
}, testInfo) => {
  await page.goto('/?lang=en#composition-docs-toolbar');
  const surface = page.locator('#composition-docs-toolbar [data-composition-surface]');
  const timing = await surface.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      property: style.transitionProperty,
      duration: style.transitionDuration,
      easing: style.transitionTimingFunction,
    };
  });
  expect(timing.property).toBe('padding');
  expect(timing.duration).not.toBe('0s');
  expect(timing.easing).not.toBe('');
  const inspector = await showInspector(page, testInfo.project.name === 'mobile');
  await chooseOption(inspector, 'preset', 'Editing Toolbar');
  await expect(surface).toHaveCSS('padding', '8px');
  await expect(surface).toHaveCSS('transition-property', 'padding');
});

test('a focused overlay stays anchored and unmounts on navigation without mounting QA controls', async ({
  page,
}) => {
  const url = '/?lang=en&contract-fixtures=1';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${url}#overlays-dropdown-menu`, { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[data-design-lab-workspace]');
  const trigger = stage.getByRole('button', { name: 'Open menu' });
  await expect(trigger).toBeVisible();
  await expect(stage.locator('[data-overlay-controlled-popover]')).toHaveCount(0);
  await expect(stage.locator('[data-overlay-popover]')).toHaveCount(0);
  await trigger.press('Enter');
  const menu = stage.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu).toBeInViewport({ ratio: 1 });
  expect(await menu.evaluate((element) => element.matches(':popover-open'))).toBe(true);
  const anchor = await trigger.boundingBox();
  const panel = await menu.boundingBox();
  if (!anchor || !panel) throw new Error('The open menu must have an anchor and a panel');
  expect(Math.abs(panel.y - anchor.y - anchor.height)).toBeLessThan(16);
  expect(Math.abs(panel.x - anchor.x)).toBeLessThan(2);

  await page.goto(`${url}#overlays-popover`);
  await expect(stage.locator('#overlays-popover')).toBeFocused();
  await expect(page.locator('.ui-dropdown-menu')).toHaveCount(0);
  await page.goBack();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toHaveCount(0);
});

test.describe('playground', () => {
  test('the explorer lists actual specimens before opening their modules', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open Explorer' }).click();
    }
    const explorer = page.locator('[data-playground-navigation]');
    await explorer.locator('#explorer-module-data-display').click();
    await expect(explorer.locator('a[href="#data-display-tabs"]')).toBeVisible();
    await explorer.locator('a[href="#data-display-tabs"]').click();
    await expect(page).toHaveURL(/#data-display-tabs$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
    await expect(page.locator('#data-display-tabs')).toBeVisible();
    await expect(page.locator('#data-display-avatar')).toHaveCount(0);
  });

  test('Explorer hides redundant aggregate comparisons while preserving individual component entries', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open Explorer' }).click();
    }
    const explorer = page.locator('[data-playground-navigation]');
    await explorer.locator('#explorer-module-forms').click();
    await expect(explorer.locator('a[href="#forms-choice-controls"]')).toHaveCount(0);
    await expect(explorer.locator('a[href="#forms-checkbox"]')).toBeVisible();
    await expect(explorer.locator('a[href="#forms-radio-group"]')).toBeVisible();
    await expect(explorer.locator('a[href="#forms-switch"]')).toBeVisible();

    await explorer.locator('#explorer-module-layout-shape').click();
    await expect(explorer.locator('a[href="#foundation-layout-shape"]')).toHaveCount(0);
    await expect(explorer.locator('a[href="#layout-shape-spacing"]')).toBeVisible();
    await expect(explorer.locator('a[href="#layout-shape-radius"]')).toBeVisible();
    await expect(explorer.locator('a[href="#layout-shape-border"]')).toBeVisible();
  });
  for (const [selected, absent] of [
    ['controls-icon-button', 'controls-action'],
    ['forms-textarea', 'forms-select'],
    ['status-feedback-notice', 'status-feedback-toast'],
    ['data-display-step-flow', 'data-display-tabs'],
    ['foundation-prose', 'typography-scale'],
    ['foundation-motion-width', 'foundation-motion-page'],
    ['composition-project-card', 'composition-control-cluster'],
    ['composition-reading', 'composition-docs-content-surface'],
  ] as const) {
    test(`opens only the selected specimen: ${selected}`, async ({ page }) => {
      await page.goto(`/?lang=en#${selected}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
      await expect(page.locator(`#${selected}`)).toBeVisible();
      await expect(page.locator(`#${absent}`)).toHaveCount(0);
    });
  }

  test('the focused stage remains a plain canvas in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.goto(`/?theme=${theme}&lang=en#forms-textarea`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('#forms-textarea')).toBeVisible();
      const workspace = page.locator('[data-design-lab-workspace]');
      expect(await workspace.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
        'none',
      );
      expect(
        await page
          .locator('.playground-shell')
          .evaluate((element) => getComputedStyle(element).backgroundImage),
      ).toBe('none');
      await expect(
        workspace.locator('.playground-material-backdrop, [data-qa-matrix]'),
      ).toHaveCount(0);
      await expect(workspace.locator('.ui-textarea')).toHaveCount(1);
      await expect(workspace.locator('.ui-input, .ui-select')).toHaveCount(0);
    }
  });

  for (const [id, selector] of [
    ['controls-icon-button', '.ui-icon-button'],
    ['controls-action', '.ui-action'],
    ['status-feedback-badge', '.ui-badge'],
    ['status-feedback-indicator', '.ui-status-indicator'],
    ['status-feedback-skeleton', '.ui-skeleton'],
    ['status-feedback-notice', '.ui-notice'],
    ['status-feedback-tooltip', '.ui-tooltip-surface'],
    ['data-display-avatar', '.ui-avatar'],
    ['data-display-stat-card', '.ui-stat-card'],
    ['data-display-disclosure', '.ui-disclosure'],
    ['forms-select', '.ui-select'],
    ['forms-field-states', '.ui-field'],
  ] as const) {
    test(`a focused ${id} mounts only one representative component`, async ({ page }) => {
      await page.goto(`/?lang=en#${id}`, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('[data-design-lab-region="specimen"]');
      await expect(stage).toBeVisible();
      await expect(stage.locator(selector)).toHaveCount(1);
      await expect(stage.locator('.playground-material-backdrop, [data-qa-matrix]')).toHaveCount(0);
    });
  }

  test('new foundation leaves show their own content and keep a usable width', async ({ page }) => {
    for (const id of [
      'layout-shape-spacing',
      'layout-shape-radius',
      'layout-shape-border',
      'shadow-primitive',
      'shadow-alias',
      'materials-glass',
      'data-display-step-flow',
    ]) {
      await page.goto(`/?lang=en#${id}`, { waitUntil: 'domcontentloaded' });
      const specimen = page.locator(`#${id}`);
      await expect(specimen).toBeVisible();
      expect((await specimen.boundingBox())?.width).toBeGreaterThan(0);
    }
  });

  test('the isolated frame keeps diagnostic backdrops and the complete form matrix', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#forms-input', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('[data-qa-matrix]')).toBeVisible();
    await expect(page.locator('[data-qa-stage="gradient"]')).toBeVisible();
    await expect(page.locator('[data-qa-stage="neutral"]')).toBeVisible();
    await expect(page.locator('[data-qa-stage="reduced"]')).toBeVisible();
    await expect(page.locator('[data-form-input]')).toBeVisible();
  });
  test('individual choice controls are independent while the combined fixture remains available', async ({
    page,
  }) => {
    for (const [id, target, unrelated] of [
      ['forms-checkbox', 'data-form-checkbox', 'data-form-radio-group'],
      ['forms-radio-group', 'data-form-radio-group', 'data-form-switch'],
      ['forms-switch', 'data-form-switch', 'data-form-checkbox'],
    ] as const) {
      await page.goto(`/?lang=en#${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
      await expect(page.locator(`#${id}`)).toBeAttached();
      await expect(page.locator(`[${target}]`)).toHaveCount(1);
      await expect(page.locator(`[${unrelated}]`)).toHaveCount(0);
    }
    await page.goto('/frame?theme=light&lang=en#forms-choice-controls', {
      waitUntil: 'domcontentloaded',
    });
    for (const fixture of ['data-form-checkbox', 'data-form-radio-group', 'data-form-switch']) {
      await expect(page.locator(`[${fixture}]`)).toHaveCount(1);
    }
  });

  test('Popover and DropdownMenu have separate leaf previews without changing overlay fixtures', async ({
    page,
  }) => {
    await page.goto('/?lang=en#overlays-popover', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-overlay-popover]')).toBeVisible();
    await expect(page.locator('[data-overlay-dropdown]')).toHaveCount(0);

    await page.goto('/?lang=en#overlays-dropdown-menu', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-overlay-dropdown]')).toBeVisible();
    await expect(page.locator('[data-overlay-popover]')).toHaveCount(0);

    await page.goto('/frame?theme=light&lang=en#overlays-popover', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('[data-overlay-popover]')).toBeVisible();
    await expect(page.locator('[data-overlay-dropdown]')).toBeVisible();
  });
  test('module and isolated QA routes still expose the original complete gallery', async ({
    page,
  }) => {
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
    await expect(page.locator('#controls-icon-button')).toBeVisible();
    await expect(page.locator('#controls-segmented-control')).toBeVisible();

    await page.goto('/frame?lang=en&theme=light#controls-icon-button', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('#controls-icon-button')).toBeVisible();
    await expect(page.locator('#controls-segmented-control')).toBeVisible();
  });

  test('the overview showcase switches material presets and opens a module', async ({ page }) => {
    await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
    const sample = page.locator('[data-overview-hero] .playground-overview-hero__sample');
    await expect(sample).toHaveAttribute('data-surface', 'glass-subtle');

    await page
      .getByRole('radiogroup', { name: 'Preview material' })
      .getByRole('radio')
      .nth(1)
      .click();
    await expect(sample).toHaveAttribute('data-surface', 'glass-elevated');

    await sample.getByRole('button', { name: 'Components' }).click();
    await expect(page).toHaveURL(/#controls-button$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('expanding an Explorer module and selecting a specimen resets stage scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));

    const navigation = page.locator('[data-playground-navigation]');
    await navigation.locator('#explorer-module-materials').click();
    await navigation.locator('a[href="#materials-surface"]').click();
    await expect(page).toHaveURL(/#materials-surface$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
  });

  test('a reload restores the reading position', async ({ page }) => {
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);

    await page.reload();
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await page.evaluate(() => document.fonts.ready.then(() => new Promise(requestAnimationFrame)));
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);
  });

  test('a specimen deep link resolves its module and moves focus to the specimen', async ({
    page,
  }) => {
    for (const specimenId of [
      'foundation-typography',
      'controls-action',
      'status-feedback-notice',
      'composition-reading',
    ]) {
      await page.goto(`/#${specimenId}`, { waitUntil: 'domcontentloaded' });
      const specimen = page.locator(`#${specimenId}`);
      await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
      await expect(specimen).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`#${specimenId}$`));
      await expect
        .poll(() => specimen.evaluate((element) => document.activeElement === element))
        .toBe(true);
      await expect(page.getByRole('banner')).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test('each drawer traps focus when open and restores focus on Escape', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'The drawer only exists below the xl breakpoint.',
    );
    await page.goto('/?lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    for (const [name, triggerAttribute] of [
      ['Explorer', 'data-playground-nav-trigger'],
      ['Inspector', 'data-playground-inspector-trigger'],
    ] as const) {
      const trigger = page.locator(`[${triggerAttribute}]`);
      const drawer = page.getByRole('dialog', { name });
      await expect(trigger).toBeVisible();
      await expect(drawer).toBeHidden();

      await trigger.press('Enter');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('button', { name: `Close ${name}` })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(drawer.locator(':focus')).toHaveCount(1);
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('header.playground-shell__toolbar :focus')).toHaveCount(0);

      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(drawer).toBeVisible();
      const outsideX = name === 'Explorer' ? 380 : 10;
      await page.mouse.click(outsideX, 400);
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('the Explorer finds specimens by API and browser history restores focus and selection', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lang=en#forms', { waitUntil: 'domcontentloaded' });
    const mobile = testInfo.project.name === 'mobile';
    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    const explorer = page.locator('[data-playground-navigation]');
    const components = explorer.getByRole('button', { name: 'Components' });
    await components.press('Enter');
    await expect(components).toHaveAttribute('aria-expanded', 'false');
    await expect(explorer.locator('a[href="#forms"]')).toBeHidden();

    const search = explorer.getByRole('searchbox');
    await search.fill('no matching specimen');
    await expect(explorer.getByRole('status')).toContainText('No modules or specimens');
    await search.fill('UiSelect');
    const select = explorer.locator('a[href="#forms-select"]');
    await select.press('Enter');
    await expect(page).toHaveURL(/#forms-select$/);
    await expect(page.locator('#forms-select')).toBeFocused();

    if (mobile) await page.getByRole('button', { name: 'Open Inspector' }).click();
    const inspector = page.locator('#design-lab-inspector');
    await expect(inspector.getByText('UiSelect', { exact: true })).toBeVisible();
    if (mobile) await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page).toHaveURL(/#forms$/);
    await expect(page.locator('[data-stage-heading]')).toBeFocused();
    await page.goForward();
    await expect(page).toHaveURL(/#forms-select$/);
    await expect(page.locator('#forms-select')).toBeFocused();
    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    await expect(select).toHaveAttribute('aria-current', 'location');
  });

  test('the Inspector edits a real Button and resets activation state without remounting it', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    const live = page.locator('[data-design-lab-region="specimen"]');
    const button = live.locator('button');
    const inspector = page.locator('#design-lab-inspector');
    await expect(live).toBeFocused();
    await expect(page.locator('[data-design-lab-region="module"]')).toHaveCount(0);
    await expect(button).toHaveCSS('height', '32px');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(live.locator('output')).toHaveText('Activations: 1');
    const instance = await button.elementHandle();

    if (mobile) await page.locator('[data-playground-inspector-trigger]').click();
    const size = inspector.getByRole('combobox', { name: 'Size' });
    await size.press('ArrowDown');
    const large = inspector.getByRole('option', { name: 'Large' });
    await page.keyboard.press('End');
    await expect(large).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(size).toBeFocused();
    await expect(size.locator('..')).toContainText('Large');
    await expect(button).toHaveCSS('height', '48px');
    const sizeField = inspector.locator('[data-specimen-control="size"]');
    await expect(sizeField).toContainText('Modified');
    const disabled = inspector.getByRole('switch', { name: 'Disabled' });
    await disabled.press('Space');
    await expect(button).toBeDisabled();
    await disabled.press('Space');
    await expect(button).toBeEnabled();
    await inspector.getByRole('switch', { name: 'Loading' }).press('Space');
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');

    await inspector.getByRole('button', { name: 'Reset specimen' }).press('Enter');
    if (mobile) await page.keyboard.press('Escape');
    await expect(button).toBeEnabled();
    await expect(button).toHaveCSS('height', '32px');
    await expect(sizeField).not.toContainText('Modified');
    await expect(live.locator('output')).toHaveText('Activations: 0');
    expect(await button.evaluate((node, initialNode) => node === initialNode, instance)).toBe(true);
  });

  test('the Inspector and SegmentedControl share a selection and honor disabled options', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?lang=en#controls-segmented-control', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#controls-segmented-control');
    const overview = live.getByRole('radio', { name: 'Overview' });
    const activity = live.getByRole('radio', { name: 'Activity' });
    await expect(live.getByRole('radio', { name: 'Details' })).toBeDisabled();
    await overview.press('ArrowRight');
    await expect(activity).toBeChecked();
    await expect(activity).toBeFocused();

    const inspector = await showInspector(page, mobile);
    const selected = inspector.getByRole('combobox', { name: 'Selected option' });
    await expect(selected).toHaveText('Activity');
    await chooseOption(inspector, 'modelValue', 'Overview');
    const disabled = inspector.getByRole('switch', { name: 'Disabled' });
    await disabled.press('Space');
    await expect(selected).toBeDisabled();
    if (mobile) await page.keyboard.press('Escape');
    await expect(overview).toBeChecked();
    await expect(activity).toBeDisabled();

    await showInspector(page, mobile);
    await inspector.getByRole('button', { name: 'Reset specimen' }).click();
    if (mobile) await page.keyboard.press('Escape');
    await expect(activity).toBeEnabled();
    await expect(overview).toBeChecked();
  });

  test('preview and Inspector edits are discarded when Explorer history changes specimen', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?lang=en#forms-input', { waitUntil: 'domcontentloaded' });
    const live = page.locator('[data-design-lab-region="specimen"]');
    const input = live.locator('input');
    await live.getByRole('textbox').fill('From the stage');
    const inspector = await showInspector(page, mobile);
    const value = inspector.getByRole('textbox', { name: 'Value' });
    await expect(value).toHaveValue('From the stage');
    await value.fill('From the Inspector');
    await expect(input).toHaveValue('From the Inspector');
    await chooseOption(inspector, 'validation', 'Error');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveValue('From the Inspector');
    await inspector.getByRole('switch', { name: 'Read-only' }).press('Space');
    await expect(input).toHaveAttribute('readonly', '');
    await expect(value).toBeDisabled();
    if (mobile) await page.keyboard.press('Escape');
    await input.press('a');
    await expect(input).toHaveValue('From the Inspector');

    if (mobile) await page.locator('[data-playground-nav-trigger]').click();
    const explorer = page.locator('[data-playground-navigation]');
    await explorer.locator('a[href="#forms-select"]').click();
    await expect(page.locator('#forms-select')).toBeFocused();
    await expect(live).toBeVisible();
    await expect(page.locator('#forms-input')).toHaveCount(0);
    await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Value' })).toHaveText('Native');
    if (mobile) await page.keyboard.press('Escape');
    const runtime = live.getByRole('combobox');
    await expect(runtime).toHaveText('Native');
    await runtime.press('Enter');
    await live.getByRole('option', { name: 'Remote' }).click();
    await expect(runtime).toHaveText('Remote');
    await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Value' })).toHaveText('Remote');
    if (mobile) await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page).toHaveURL(/#forms-input$/);
    await expect(live).toBeFocused();
    await expect(input).toHaveValue('Neoverse Studio');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toBeEditable();
    await page.goForward();
    await expect(page).toHaveURL(/#forms-select$/);
    await expect(page.locator('#forms-select')).toBeFocused();
    await expect(runtime).toHaveText('Native');
    await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Value' })).toHaveText('Native');
    if (mobile) {
      await page.keyboard.press('Escape');
      await page.locator('[data-playground-nav-trigger]').click();
    }
    await explorer.locator('a[href="#forms-textarea"]').click();
    await expect(live).toBeFocused();
    await showInspector(page, mobile);
    await expect(
      inspector.getByText('This specimen is read-only.', { exact: false }),
    ).toBeVisible();
    await expect(inspector.locator('[data-specimen-control]')).toHaveCount(0);
  });

  test('Select synchronizes with the Inspector and resets without remounting', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#forms-select', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#forms-select');
    const runtime = live.locator('[data-form-select]');
    await runtime.press('ArrowDown');
    const remote = live.getByRole('option', { name: 'Remote' });
    await page.keyboard.press('End');
    await expect(remote).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(runtime).toBeFocused();
    await expect(runtime).toHaveText('Remote');
    const instance = await runtime.elementHandle();

    const inspector = await showInspector(page, mobile);
    const valueField = inspector.locator('[data-specimen-control="modelValue"]');
    const value = valueField.getByRole('combobox');
    await expect(value).toHaveText('Remote');
    await expect(valueField).toContainText('Modified');
    await chooseOption(inspector, 'modelValue', 'Native');
    await expect(runtime).toHaveText('Native');
    await expect(valueField).not.toContainText('Modified');
    await chooseOption(inspector, 'modelValue', 'Remote');
    await expect(runtime).toHaveText('Remote');

    for (const name of ['Disabled', 'Read-only']) {
      const toggle = inspector.getByRole('switch', { name });
      await toggle.press('Space');
      await expect(value).toBeDisabled();
      await expect(runtime).toBeDisabled();
      if (mobile) await page.keyboard.press('Escape');
      await runtime.press('ArrowDown');
      await runtime.click({ force: true });
      await expect(runtime).toHaveAttribute('aria-expanded', 'false');
      await expect(runtime).toHaveText('Remote');
      await showInspector(page, mobile);
      await toggle.press('Space');
      await expect(value).toBeEnabled();
      await expect(runtime).toBeEnabled();
      await expect(value).toHaveText('Remote');
    }

    if (mobile) await page.keyboard.press('Escape');
    await switchToChinese(page, mobile);
    await expect(runtime).toHaveText('远程');
    await showInspector(page, mobile);
    await expect(value).toHaveText('远程');
    await inspector
      .locator('[data-specimen-control="readonly"]')
      .getByRole('switch')
      .press('Space');
    const reset = inspector.getByRole('button', { name: '重置示例' });
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    await expect(value).toBeEnabled();
    await expect(value).toHaveText('原生');
    await expect(runtime).toBeEnabled();
    await expect(runtime).toHaveText('原生');
    expect(await runtime.evaluate((node, initialNode) => node === initialNode, instance)).toBe(
      true,
    );
  });

  test('Checkbox shares its checked state and keeps disabled edits until reset or navigation', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const url = '/?theme=dark&lang=en';
    await page.goto(`${url}#forms-checkbox`, { waitUntil: 'domcontentloaded' });
    const live = page.locator('#forms-checkbox');
    const checkbox = live.getByRole('checkbox');
    const label = live.getByText('Release notifications');
    await expect(checkbox).toBeChecked();
    await label.click({ force: true });
    await expect(checkbox).not.toBeChecked();
    const instance = await checkbox.elementHandle();

    const inspector = await showInspector(page, mobile);
    const checked = inspector.getByRole('switch', { name: 'Checked' });
    const disabled = inspector.getByRole('switch', { name: 'Disabled' });
    await expect(checked).not.toBeChecked();
    await checked.press('Space');
    await expect(checkbox).toBeChecked();
    if (mobile) await page.keyboard.press('Escape');
    await checkbox.press('Space');
    await expect(checkbox).toBeFocused();
    await expect(checkbox).not.toBeChecked();
    await showInspector(page, mobile);
    await expect(checked).not.toBeChecked();

    await disabled.press('Space');
    await expect(checked).toBeDisabled();
    await expect(checkbox).toBeDisabled();
    if (mobile) await page.keyboard.press('Escape');
    await label.click({ force: true });
    await live.focus();
    await page.keyboard.press('Tab');
    await expect(checkbox).not.toBeFocused();
    await expect(checkbox).not.toBeChecked();
    await showInspector(page, mobile);
    await disabled.press('Space');
    await expect(checked).toBeEnabled();
    await expect(checkbox).toBeEnabled();
    await expect(checkbox).not.toBeChecked();
    await disabled.press('Space');

    const reset = inspector.getByRole('button', { name: 'Reset specimen' });
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    await expect(checked).toBeChecked();
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBeEnabled();
    expect(await checkbox.evaluate((node, initialNode) => node === initialNode, instance)).toBe(
      true,
    );

    await checked.press('Space');
    await disabled.press('Space');
    if (mobile) await page.keyboard.press('Escape');
    await page.goto(`${url}#forms-choice-controls`);
    const aggregate = page.locator('#forms-choice-controls').getByRole('checkbox');
    await expect(aggregate).toBeChecked();
    await expect(aggregate).toBeEnabled();
    await aggregate.press('Space');
    await expect(aggregate).not.toBeChecked();
    await page.goBack();
    await expect(live).toBeFocused();
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBeEnabled();
    await page.goForward();
    await expect(aggregate).toBeChecked();
  });

  test('Tabs keep keyboard selection, the panel and the indicator in sync with the Inspector', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en#data-display-tabs', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#data-display-tabs');
    const tablist = live.getByRole('tablist');
    const overview = tablist.getByRole('tab', { name: 'Overview' });
    const activity = tablist.getByRole('tab', { name: 'Activity' });
    const disabled = tablist.getByRole('tab', { name: 'Disabled' });
    const panel = live.getByRole('tabpanel');
    await expect(disabled).toBeDisabled();
    await overview.focus();
    for (const [key, selected, value] of [
      ['ArrowRight', activity, 'activity'],
      ['ArrowLeft', overview, 'overview'],
      ['End', activity, 'activity'],
      ['Home', overview, 'overview'],
    ] as const) {
      await page.keyboard.press(key);
      await expect(selected).toBeFocused();
      await expect(selected).toHaveAttribute('tabindex', '0');
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      await expect(panel).toHaveText(value);
    }
    await expect(disabled).toHaveAttribute('aria-selected', 'false');
    await activity.click();
    await expect(panel).toHaveAccessibleName('Activity');
    const indicator = live.locator('.ui-tabs__indicator');
    const instance = await tablist.elementHandle();
    const indicatorInstance = await indicator.elementHandle();
    await expect(indicator).toHaveAttribute('data-ready', 'true');
    const indicatorDistance = async (tab: Locator) => {
      const [plate, target] = await Promise.all([indicator.boundingBox(), tab.boundingBox()]);
      return plate && target ? Math.abs(plate.x - target.x) : Infinity;
    };
    await expect.poll(() => indicatorDistance(activity)).toBeLessThanOrEqual(1);

    const inspector = await showInspector(page, mobile);
    const editor = inspector.locator('[data-specimen-control="modelValue"]');
    const selected = editor.getByRole('combobox');
    await expect(selected).toHaveText('Activity');
    await selected.press('ArrowDown');
    await expect(editor.getByRole('option')).toHaveCount(2);
    await editor.getByRole('option', { name: 'Overview' }).click();
    await expect(selected).toBeFocused();
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(panel).toHaveAccessibleName('Overview');
    await expect(panel).toHaveText('overview');
    await expect.poll(() => indicatorDistance(overview)).toBeLessThanOrEqual(1);
    await chooseOption(inspector, 'modelValue', 'Activity');
    if (mobile) await page.keyboard.press('Escape');

    const dark = mobile
      ? page.getByRole('button', { name: /Cycle theme/ })
      : page
          .getByRole('radiogroup', { name: 'Playground theme' })
          .getByRole('radio', { name: 'Dark' });
    await dark.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await switchToChinese(page, mobile);
    await expect(tablist.getByRole('tab', { name: '动态', selected: true })).toBeVisible();
    await showInspector(page, mobile);
    await expect(selected).toHaveText('动态');
    const reset = inspector.getByRole('button', { name: '重置示例' });
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    await expect(selected).toHaveText('概览');
    await expect(panel).toHaveAccessibleName('概览');
    expect(await tablist.evaluate((node, before) => node === before, instance)).toBe(true);
    expect(await indicator.evaluate((node, before) => node === before, indicatorInstance)).toBe(
      true,
    );

    await chooseOption(inspector, 'modelValue', '动态');
    if (mobile) await page.keyboard.press('Escape');
    await page.goto(new URL('#data-display-avatar', page.url()).href);
    const avatar = page.locator('#data-display-avatar');
    await expect(avatar).toBeFocused();
    await page.goBack();
    await expect(live).toBeFocused();
    await expect(tablist.getByRole('tab', { name: '概览', selected: true })).toBeVisible();
    await expect(panel).toHaveText('overview');
    await page.goForward();
    await expect(avatar).toBeFocused();
  });

  test('Card surface edits restore the component default and respect reduced transparency', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=dark&lang=en#card-card', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#card-card');
    const card = live.locator('article');
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    await expect(card).toHaveCSS('backdrop-filter', /blur\(/);
    await expect(live.locator('.playground-stage__specimen-content')).toHaveCSS(
      'animation-name',
      'none',
    );
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const measureCard = () =>
      card.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        const { borderTopWidth, borderBottomWidth } = getComputedStyle(element);
        return {
          width,
          centerX: x + width / 2,
          centerY: y + height / 2,
          heightInsideBorder: height - parseFloat(borderTopWidth) - parseFloat(borderBottomWidth),
        };
      });
    const initialGeometry = await measureCard();
    const inspector = await showInspector(page, mobile);
    await chooseOption(inspector, 'surface', 'None');
    await expect(card).toHaveAttribute('data-surface', 'none');
    expect(await measureCard()).toEqual(initialGeometry);
    await chooseOption(inspector, 'surface', 'Component default');
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    if (mobile) await page.keyboard.press('Escape');

    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    await expect(card).toHaveCSS('backdrop-filter', 'none');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
    await expect(card).toContainText('Reference card');
  });

  test('Dock selection and its shared indicator follow real navigation and Inspector edits', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?lang=en#dock-component', { waitUntil: 'domcontentloaded' });
    const dock = page.locator('#dock-component nav');
    const projects = dock.getByRole('button', { name: 'Projects' });
    await projects.press('Enter');
    await expect(projects).toHaveAttribute('aria-current', 'location');
    await expect(dock).toHaveAttribute('data-neoverse-navigation-indicator-ready', 'true');

    const inspector = await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Active destination' })).toHaveText(
      'Projects',
    );
    await chooseOption(inspector, 'destination', 'Focus');
    await inspector.getByRole('switch', { name: 'Navigation indicator' }).press('Space');
    await expect(dock.locator('.ui-control-surface__indicator')).toHaveCount(0);
    await inspector.getByRole('switch', { name: 'Compact' }).press('Space');
    if (mobile) await page.keyboard.press('Escape');
    await expect(dock.getByRole('button', { name: 'Focus' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await expect(projects).not.toHaveAttribute('aria-current', 'location');
    await expectNoPageOverflow(page);
  });

  test('the Inspector opens the selected specimen in an isolated frame', async ({
    page,
  }, testInfo) => {
    await page.goto('/?theme=dark&lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open Inspector' }).click();
    }
    await page.getByRole('link', { name: 'Open isolated preview' }).click();
    await expect(page).toHaveURL(/\/frame\?theme=dark&lang=en#controls-button$/);
    await expect(page.locator('#controls-button')).toBeVisible();
    await expect(page.locator('#controls-button [data-specimen-state-row]').first()).toBeVisible();
    await expect(page.locator('[data-design-lab-region="specimen"]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-design-lab-workspace]')).toHaveCount(0);
  });

  test('the desktop toolbar switches theme and language without resizing the stage', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    const stage = page.locator('[data-design-lab-workspace]');
    const original = await stage.boundingBox();
    await page
      .getByRole('radiogroup', { name: 'Playground theme' })
      .getByRole('radio', { name: 'Dark' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page
      .getByRole('radiogroup', { name: 'Language' })
      .getByRole('radio', { name: '中文' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page).toHaveURL(/theme=light&lang=zh#controls$/);
    await expect(page.getByRole('complementary', { name: '检查器' })).toBeVisible();
    expect(await stage.boundingBox()).toEqual(original);
  });

  test('the mobile toolbar cycles the theme and switches the language', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'The compact toolbar only renders on mobile.');
    await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
    const themeButton = page.getByRole('button', { name: /Cycle theme/ });
    const languageButton = page.getByRole('button', { name: /Switch language/ });

    await themeButton.click();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          mode: document.documentElement.dataset.theme ?? 'system',
          stored: JSON.parse(window.localStorage.getItem('neoverse-design-lab.preferences') ?? '{}')
            .theme,
        })),
      )
      .toEqual({ mode: 'system', stored: 'system' });
    await expect(page).toHaveURL(/theme=dark/);

    await languageButton.click();
    await expect(page).toHaveURL(/lang=zh/);
  });

  test('the Giscus module previews both widget themes with the shipped CSS', async ({ page }) => {
    await page.goto('/?lang=en#giscus', { waitUntil: 'domcontentloaded' });
    const section = page.locator('#giscus-themes');
    await expect(section).toBeVisible();
    await expect(page.locator('iframe[data-giscus-preview]')).toHaveCount(2);

    const canvases: string[] = [];
    for (const theme of ['light', 'dark'] as const) {
      const frame = page.frameLocator(`iframe[data-giscus-preview="${theme}"]`);
      await expect(frame.locator('.gsc-comment')).toBeVisible();
      await expect(frame.locator('.gsc-comment-box')).toBeVisible();
      await expect(frame.locator('.gsc-comment-box-textarea')).toBeVisible();
      // The theme paints a frosted plate; an unstyled document reports `none`.
      expect(
        await frame
          .locator('.gsc-comment')
          .evaluate((element) => getComputedStyle(element).backdropFilter),
      ).toContain('blur(');
      canvases.push(
        await frame
          .locator('.giscus-preview-surface')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      );
    }
    expect(canvases[0]).not.toBe(canvases[1]);
  });

  test('demo actions navigate to their real destinations', async ({ page }) => {
    await page.goto('/?lang=en#composition-reading', { waitUntil: 'domcontentloaded' });
    const action = page.locator('[data-reading-surface-link]');
    await expect(action).toHaveAttribute('href', '#materials-surface');
    await action.click();
    await expect(page).toHaveURL(/#materials-surface$/);
    await expect(page.locator('#materials-surface')).toBeVisible();

    await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });
    const reactAction = page.locator('[data-react-adapter="UiAction"]');
    await expect(reactAction).toHaveAttribute('href', '#react-runtime-fixture');
    await reactAction.click();
    await expect(page).toHaveURL(/\/react-fixture\?lang=en$/);
    expect(await page.locator('a[href^="https://github.com/"]').count()).toBe(0);
  });

  test('the React runtime fixture links back to the consumer parity section', async ({ page }) => {
    for (const locale of ['en', 'zh'] as const) {
      await page.goto(`/react-fixture?lang=${locale}`, { waitUntil: 'domcontentloaded' });
      const returnLink = page.getByRole('link', {
        name: locale === 'zh' ? '返回设计实验室' : 'Back to Design Lab',
      });
      await expect(returnLink).toHaveAttribute('href', `/?lang=${locale}#consumer-parity`);
      await returnLink.click();
      await expect(page).toHaveURL(new RegExp(`\\?lang=${locale}#consumer-parity$`));
      await expect(page.locator('[data-contract-runtime-entry]')).toBeVisible();
    }
  });

  for (const width of [390, 1024, 1440, 1920]) {
    test(`the shell keeps its content inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
      const stage = page.locator('[data-design-lab-workspace]');
      expect(
        await stage.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
      if (width >= 1280) {
        const explorer = page.getByRole('complementary', { name: 'Explorer' });
        const inspector = page.getByRole('complementary', { name: 'Inspector' });
        await expect(explorer).toBeVisible();
        await expect(inspector).toBeVisible();
        const bounds = await stage.boundingBox();
        expect(bounds?.width).toBeGreaterThan((await explorer.boundingBox())?.width ?? Infinity);
        expect(bounds?.width).toBeGreaterThan((await inspector.boundingBox())?.width ?? Infinity);
        expect((await explorer.boundingBox())?.height).toBe(bounds?.height);
        expect((await inspector.boundingBox())?.height).toBe(bounds?.height);
      } else {
        await expect(page.getByRole('button', { name: 'Open Explorer' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Open Inspector' })).toBeVisible();
      }
      await expectNoPageOverflow(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      await page.goto('/?lang=en#dock-component', { waitUntil: 'domcontentloaded' });
      await expect(stage.getByRole('navigation', { name: 'Dock navigation' })).toBeVisible();
      expect(
        await stage.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
      await expectNoPageOverflow(page);
    });
  }
});
