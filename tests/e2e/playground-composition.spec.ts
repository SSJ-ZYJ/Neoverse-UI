import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';
import { chooseOption, showInspector, switchToChinese } from '../support/playground';

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
  // The scene paints both progress ends itself; the native OS bar is square
  // and dark, so keep the platform appearance disabled.
  await expect(progress).toHaveCSS('appearance', 'none');
  await expect(progress).toHaveCSS('border-radius', '9999px');
  expect(await progress.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
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
  await page.addInitScript(() => {
    const key = 'neoverse-design-lab.preferences';
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return;
      const stored: unknown = JSON.parse(raw);
      if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return;
      delete (stored as Record<string, unknown>).specimens;
      window.localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      // Malformed storage is already ignored by the application.
    }
  });
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
