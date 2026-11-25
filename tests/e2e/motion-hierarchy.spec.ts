import { expect, test } from '../support/e2e';
import { chooseOption, showInspector } from '../support/playground';

test.describe('motion hierarchy and distinct surfaces', () => {
  test('distinct surface transitions cross-composite without enter delay gaps and Motion promotes to Explorer + Inspector', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/?theme=light&lang=en#foundation-motion-page', {
      waitUntil: 'domcontentloaded',
    });

    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    const navSection = page.locator(
      '[data-playground-navigation] section[aria-labelledby="explorer-group-motion"]',
    );
    await expect(navSection).toBeVisible();
    await expect(navSection.locator('a[href="#foundation-motion-page"]')).toBeVisible();
    if (mobile) await page.keyboard.press('Escape');

    const inspector = await showInspector(page, mobile);
    await chooseOption(inspector, 'background', 'Distinct scenes');
    await chooseOption(inspector, 'variant', 'Fade');
    if (mobile) await page.keyboard.press('Escape');

    const stage = page.locator('#foundation-motion-page [data-motion-page-stage]');
    await expect(stage.locator('[data-page-background="surface"]')).toBeVisible();

    if (
      !mobile &&
      (await page.evaluate(() => typeof document.startViewTransition === 'function'))
    ) {
      const [surfaceFrame] = await Promise.all([
        page.waitForFunction(() => {
          const root = document.documentElement;
          if (root.getAttribute('data-neoverse-page-transition') !== 'glide') return;
          const incoming = getComputedStyle(root, '::view-transition-new(nv-page)');
          const outgoing = getComputedStyle(root, '::view-transition-old(nv-page)');
          return {
            backgroundMode: root.getAttribute('data-neoverse-page-background'),
            incomingDelay: incoming.animationDelay,
            outgoingAnimation: outgoing.animationName,
          };
        }),
        chooseOption(inspector, 'variant', 'Glide'),
      ]);
      expect(await surfaceFrame.jsonValue()).toMatchObject({
        backgroundMode: 'surface',
        incomingDelay: '0s',
        outgoingAnimation: 'nv-page-surface-glide-out',
      });
    }

    if (mobile) await showInspector(page, true);
    await chooseOption(inspector, 'category', 'Particle dissolve');
    if (mobile) await page.keyboard.press('Escape');
    await expect(page.locator('#foundation-motion-page [data-motion-page-dissolve]')).toBeVisible();
    await expect(page.locator('#foundation-motion-page [data-motion-page-stage]')).toHaveCount(0);
  });
});
