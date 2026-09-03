import { expect, test } from 'bun:test';

import { cssVariables, layoutBreakpoints } from './index.js';

test('exposes semantic color variables under the Neoverse namespace', () => {
  expect(cssVariables.color.surface.canvas).toBe('--neoverse-color-surface-canvas');
  expect(cssVariables.color.text.primary).toBe('--neoverse-color-text-primary');
  expect(cssVariables.color.edgeLight).toBe('--neoverse-color-edge-light');
  expect(cssVariables.color.ambient.ice).toBe('--neoverse-color-ambient-ice');
  expect(cssVariables.color.action.primaryHover).toBe('--neoverse-color-action-primary-hover');
  expect(cssVariables.color.status.danger).toBe('--neoverse-color-status-danger');
});

test('exposes compact-control and skeleton effect tokens', () => {
  expect(cssVariables.control.primaryBackground).toBe('--neoverse-control-primary-background');
  expect(cssVariables.control.primaryForeground).toBe('--neoverse-control-primary-foreground');
  expect(cssVariables.control.primaryHoverShadow).toBe('--neoverse-control-primary-hover-shadow');
  expect(cssVariables.control.buttonBorder).toBe('--neoverse-control-button-border');
  expect(cssVariables.control.secondaryForeground).toBe('--neoverse-control-secondary-foreground');
  expect(cssVariables.control.secondaryHoverForeground).toBe(
    '--neoverse-control-secondary-hover-foreground',
  );
  expect(cssVariables.control.secondaryActiveForeground).toBe(
    '--neoverse-control-secondary-active-foreground',
  );
  expect(cssVariables.control.ghostForeground).toBe('--neoverse-control-ghost-foreground');
  expect(cssVariables.control.ghostHoverForeground).toBe(
    '--neoverse-control-ghost-hover-foreground',
  );
  expect(cssVariables.control.ghostActiveForeground).toBe(
    '--neoverse-control-ghost-active-foreground',
  );
  expect(cssVariables.control.ghostBackground).toBe('--neoverse-control-ghost-background');
  expect(cssVariables.control.buttonEdge).toBe('--neoverse-control-button-edge');
  expect(cssVariables.control.buttonEdgeActive).toBe('--neoverse-control-button-edge-active');
  expect(cssVariables.control.buttonEdgeCarrier).toBe('--neoverse-control-button-edge-carrier');
  expect(cssVariables.control.buttonRefractionGradient).toBe(
    '--neoverse-control-button-refraction-gradient',
  );
  expect(cssVariables.control.buttonPressGlow).toBe('--neoverse-control-button-press-glow');
  expect(cssVariables.control.buttonHoverBackground).toBe(
    '--neoverse-control-button-hover-background',
  );
  expect(cssVariables.control.buttonActiveBackground).toBe(
    '--neoverse-control-button-active-background',
  );
  expect(cssVariables.control.buttonGhostActiveBackground).toBe(
    '--neoverse-control-button-ghost-active-background',
  );
  expect(cssVariables.control.secondaryBackground).toBe('--neoverse-control-secondary-background');
  expect(cssVariables.control.secondaryBorder).toBe('--neoverse-control-secondary-border');
  expect(cssVariables.control.secondaryFilter).toBe('--neoverse-control-secondary-filter');
  expect(cssVariables.control.segmentedBackground).toBe('--neoverse-control-segmented-background');
  expect(cssVariables.control.segmentedForeground).toBe('--neoverse-control-segmented-foreground');
  expect(cssVariables.control.segmentedActiveForeground).toBe(
    '--neoverse-control-segmented-active-foreground',
  );
  expect(cssVariables.control.segmentedBorder).toBe('--neoverse-control-segmented-border');
  expect(cssVariables.control.segmentedShadow).toBe('--neoverse-control-segmented-shadow');
  expect(cssVariables.control.segmentedFilter).toBe('--neoverse-control-segmented-filter');
  expect(cssVariables.control.segmentedFocusShadow).toBe(
    '--neoverse-control-segmented-focus-shadow',
  );
  expect(cssVariables.control.activeBackground).toBe('--neoverse-control-active-background');
  expect(cssVariables.control.activeBorder).toBe('--neoverse-control-active-border');
  expect(cssVariables.control.hoverBackground).toBe('--neoverse-control-hover-background');
  expect(cssVariables.scrollbar.immersive.size).toBe('--neoverse-scrollbar-immersive-size');
  expect(cssVariables.scrollbar.immersive.track).toBe('--neoverse-scrollbar-immersive-track');
  expect(cssVariables.scrollbar.immersive.thumb).toBe('--neoverse-scrollbar-immersive-thumb');
  expect(cssVariables.scrollbar.immersive.thumbHover).toBe(
    '--neoverse-scrollbar-immersive-thumb-hover',
  );
  expect(cssVariables.scrollbar.immersive.thumbActive).toBe(
    '--neoverse-scrollbar-immersive-thumb-active',
  );
  expect(cssVariables.scrollbar.immersive.thumbEdge).toBe(
    '--neoverse-scrollbar-immersive-thumb-edge',
  );
  expect(cssVariables.skeleton.fill).toBe('--neoverse-skeleton-fill');
  expect(cssVariables.skeleton.highlight).toBe('--neoverse-skeleton-highlight');
  expect(cssVariables.skeleton.edge).toBe('--neoverse-skeleton-edge');
});

test('exposes component token namespaces while preserving compatibility aliases', () => {
  const compatibilityMappings = [
    [cssVariables.components.button.primary.background, cssVariables.control.primaryBackground],
    [cssVariables.components.button.primary.foreground, cssVariables.control.primaryForeground],
    [cssVariables.components.button.primary.border, cssVariables.control.primaryBorder],
    [cssVariables.components.button.primary.shadow, cssVariables.control.primaryShadow],
    [
      cssVariables.components.button.primary.hoverBackground,
      cssVariables.control.primaryHoverBackground,
    ],
    [cssVariables.components.button.primary.hoverShadow, cssVariables.control.primaryHoverShadow],
    [
      cssVariables.components.button.primary.activeBackground,
      cssVariables.control.primaryActiveBackground,
    ],
    [cssVariables.components.button.secondary.background, cssVariables.control.secondaryBackground],
    [cssVariables.components.button.secondary.border, cssVariables.control.secondaryBorder],
    [
      cssVariables.components.button.secondary.hoverBackground,
      cssVariables.control.secondaryHoverBackground,
    ],
    [cssVariables.components.button.secondary.shadow, cssVariables.control.secondaryShadow],
    [
      cssVariables.components.button.secondary.hoverShadow,
      cssVariables.control.secondaryHoverShadow,
    ],
    [cssVariables.components.button.secondary.foreground, cssVariables.control.secondaryForeground],
    [
      cssVariables.components.button.secondary.hoverForeground,
      cssVariables.control.secondaryHoverForeground,
    ],
    [
      cssVariables.components.button.secondary.activeForeground,
      cssVariables.control.secondaryActiveForeground,
    ],
    [cssVariables.components.button.secondary.filter, cssVariables.control.secondaryFilter],
    [cssVariables.components.button.ghost.background, cssVariables.control.ghostBackground],
    [cssVariables.components.button.ghost.foreground, cssVariables.control.ghostForeground],
    [
      cssVariables.components.button.ghost.hoverForeground,
      cssVariables.control.ghostHoverForeground,
    ],
    [
      cssVariables.components.button.ghost.activeForeground,
      cssVariables.control.ghostActiveForeground,
    ],
    [cssVariables.components.button.border, cssVariables.control.buttonBorder],
    [cssVariables.components.button.edge, cssVariables.control.buttonEdge],
    [cssVariables.components.button.edgeActive, cssVariables.control.buttonEdgeActive],
    [cssVariables.components.button.edgeCarrier, cssVariables.control.buttonEdgeCarrier],
    [
      cssVariables.components.button.refractionGradient,
      cssVariables.control.buttonRefractionGradient,
    ],
    [cssVariables.components.button.pressGlow, cssVariables.control.buttonPressGlow],
    [cssVariables.components.button.hoverBackground, cssVariables.control.buttonHoverBackground],
    [cssVariables.components.button.activeBackground, cssVariables.control.buttonActiveBackground],
    [
      cssVariables.components.button.ghostActiveBackground,
      cssVariables.control.buttonGhostActiveBackground,
    ],
    [cssVariables.components.segmentedControl.background, cssVariables.control.segmentedBackground],
    [cssVariables.components.segmentedControl.foreground, cssVariables.control.segmentedForeground],
    [
      cssVariables.components.segmentedControl.activeForeground,
      cssVariables.control.segmentedActiveForeground,
    ],
    [cssVariables.components.segmentedControl.border, cssVariables.control.segmentedBorder],
    [cssVariables.components.segmentedControl.shadow, cssVariables.control.segmentedShadow],
    [cssVariables.components.segmentedControl.filter, cssVariables.control.segmentedFilter],
    [
      cssVariables.components.segmentedControl.focusShadow,
      cssVariables.control.segmentedFocusShadow,
    ],
    [
      cssVariables.components.segmentedControl.activeBackground,
      cssVariables.control.activeBackground,
    ],
    [cssVariables.components.segmentedControl.activeBorder, cssVariables.control.activeBorder],
    [
      cssVariables.components.segmentedControl.activeHighlight,
      cssVariables.control.activeHighlight,
    ],
    [cssVariables.components.segmentedControl.activeShadow, cssVariables.control.activeShadow],
    [
      cssVariables.components.segmentedControl.hoverBackground,
      cssVariables.control.hoverBackground,
    ],
    [cssVariables.components.skeleton.fill, cssVariables.skeleton.fill],
    [cssVariables.components.skeleton.highlight, cssVariables.skeleton.highlight],
    [cssVariables.components.skeleton.edge, cssVariables.skeleton.edge],
    [cssVariables.components.skeleton.shimmerDuration, cssVariables.skeleton.shimmerDuration],
    [cssVariables.components.skeleton.shimmerEasing, cssVariables.skeleton.shimmerEasing],
    [cssVariables.components.scrollbar.immersive.size, cssVariables.scrollbar.immersive.size],
    [cssVariables.components.scrollbar.immersive.track, cssVariables.scrollbar.immersive.track],
    [cssVariables.components.scrollbar.immersive.thumb, cssVariables.scrollbar.immersive.thumb],
    [
      cssVariables.components.scrollbar.immersive.thumbHover,
      cssVariables.scrollbar.immersive.thumbHover,
    ],
    [
      cssVariables.components.scrollbar.immersive.thumbActive,
      cssVariables.scrollbar.immersive.thumbActive,
    ],
    [
      cssVariables.components.scrollbar.immersive.thumbBackground,
      cssVariables.scrollbar.immersive.thumbBackground,
    ],
    [
      cssVariables.components.scrollbar.immersive.thumbHoverBackground,
      cssVariables.scrollbar.immersive.thumbHoverBackground,
    ],
    [
      cssVariables.components.scrollbar.immersive.thumbActiveBackground,
      cssVariables.scrollbar.immersive.thumbActiveBackground,
    ],
    [
      cssVariables.components.scrollbar.immersive.thumbEdge,
      cssVariables.scrollbar.immersive.thumbEdge,
    ],
    [
      cssVariables.components.scrollbar.immersive.thumbGlow,
      cssVariables.scrollbar.immersive.thumbGlow,
    ],
  ] as const;

  for (const [componentToken, legacyToken] of compatibilityMappings) {
    expect(componentToken).toBe(legacyToken);
  }

  expect(cssVariables.components.badge.background).toBe('--neoverse-badge-background');
  expect(cssVariables.components.badge.border).toBe('--neoverse-badge-border');
  expect(cssVariables.components.badge.foreground).toBe('--neoverse-badge-foreground');
});

test('keeps semantic source generic and assigns component token ownership', async () => {
  const semanticCss = await readTokenCss('semantic.css');
  expect(semanticCss).not.toMatch(/--neoverse-(?:control|scrollbar|skeleton|badge)-/);
  expect(semanticCss).not.toMatch(/\[data-theme=|:root\.(?:light|dark)/);

  const ownership = await Promise.all([
    ['components/button.css', '--neoverse-control-primary-background'],
    ['components/segmented-control.css', '--neoverse-control-segmented-background'],
    ['components/badge.css', '--neoverse-badge-background'],
    ['components/skeleton.css', '--neoverse-skeleton-fill'],
    ['components/scrollbar.css', '--neoverse-scrollbar-immersive-size'],
  ] as const);

  for (const [fileName, token] of ownership) {
    expect(await readTokenCss(fileName)).toContain(`${token}:`);
  }
});

test('keeps skeleton motion at a calmer loading pace', async () => {
  const semanticCss = await readTokenCss('components/skeleton.css');
  const duration = semanticCss
    .match(/--neoverse-skeleton-shimmer-duration:\s*([^;]+)/)?.[1]
    ?.trim();

  expect(duration).toBe('1.25s');
});

test('keeps immersive scrollbars theme-aware and quiet at rest', async () => {
  const semanticCss = await readTokenCss('components/scrollbar.css');

  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-size: 0.75rem;');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-track: color-mix(');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-thumb: color-mix(');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-thumb-hover: color-mix(');
  expect(semanticCss).toContain('var(--neoverse-scrollbar-immersive-thumb-hover) 48%,');
  expect(semanticCss).toContain('var(--neoverse-scrollbar-immersive-thumb-active) 48%,');
  expect(semanticCss).toMatch(/--neoverse-scrollbar-immersive-thumb-edge:\s*inset 0 1px 1px/);
});

test('keeps the light segmented control edges translucent and blurred', async () => {
  const [segmentedCss, sharedControlCss, themesCss] = await Promise.all([
    readTokenCss('components/segmented-control.css'),
    readTokenCss('components/shared-control.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const semanticCss = `${segmentedCss}\n${sharedControlCss}`;

  expect(semanticCss).toContain(
    '--neoverse-control-segmented-background: color-mix(\n      in srgb,\n      var(--neoverse-color-accent-primary) 7%',
  );
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-border: var(--neoverse-control-button-border);',
  );
  expect(semanticCss).toMatch(
    /--neoverse-control-segmented-shadow:\s*var\(--neoverse-control-secondary-shadow\);/,
  );
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-filter: blur(6px) saturate(112%) brightness(102%);',
  );
  expect(semanticCss).toMatch(/--neoverse-control-segmented-focus-shadow:\s*0 0 0 1px/);
  expect(semanticCss).toMatch(/--neoverse-control-segmented-foreground:\s*color-mix\(/);
  expect(semanticCss).toMatch(/--neoverse-control-segmented-active-foreground:\s*color-mix\(/);
  const activeForeground =
    semanticCss.match(/--neoverse-control-segmented-active-foreground:([\s\S]*?);/)?.[1] ?? '';
  expect(activeForeground).toContain('var(--neoverse-color-accent-secondary) 30%');
  expect(activeForeground).not.toContain('var(--neoverse-color-accent-primary)');
  const segmentedShadow =
    sharedControlCss.match(/--neoverse-control-secondary-shadow:([\s\S]*?);/)?.[1] ?? '';
  expect(segmentedShadow).not.toContain('var(--neoverse-color-text-primary)');
  expect(segmentedShadow).not.toContain('var(--neoverse-color-accent-secondary)');
  expect(segmentedShadow).toContain('inset 1px 0 3px');
  expect(segmentedShadow).toContain('0 2px 8px -2px');
  expect(semanticCss).toMatch(/--neoverse-control-active-background:\s*linear-gradient\(/);
  const activeBackground =
    semanticCss.match(/--neoverse-control-active-background:([\s\S]*?);/)?.[1] ?? '';
  expect(activeBackground).toContain('var(--neoverse-color-accent-secondary) 13%');
  expect(activeBackground).toContain('var(--neoverse-color-accent-secondary) 7%');
  expect(activeBackground).not.toContain('var(--neoverse-color-accent-primary)');
  expect(semanticCss).toContain('--neoverse-control-active-border: transparent;');
  expect(semanticCss).toMatch(/--neoverse-control-active-highlight:\s*inset 0 1px 3px/);
  const activeHighlight =
    semanticCss.match(/--neoverse-control-active-highlight:([\s\S]*?);/)?.[1] ?? '';
  expect(activeHighlight).not.toContain('var(--neoverse-color-edge-light)');
  expect(activeHighlight).not.toContain('var(--neoverse-color-text-primary)');
  expect(activeHighlight).not.toContain('var(--neoverse-color-accent-primary)');
  expect(activeHighlight).toContain('var(--neoverse-color-accent-secondary) 14%');
  const focusShadow =
    semanticCss.match(/--neoverse-control-segmented-focus-shadow:([\s\S]*?);/)?.[1] ?? '';
  expect(focusShadow).not.toContain('var(--neoverse-color-white)');
  expect(focusShadow).not.toContain('rgb(255 255 255');
  expect(semanticCss).toContain(
    '--neoverse-control-active-shadow:\n      var(--neoverse-control-active-highlight),\n      0 2px 7px -2px color-mix(in srgb, var(--neoverse-color-accent-secondary) 24%, transparent);',
  );
  expect(semanticCss).toMatch(/--neoverse-control-secondary-shadow:\s*inset 0 1px 3px/);
  expect(
    themesCss.match(
      /--neoverse-control-active-shadow:\s*var\(--neoverse-control-active-highlight\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-shadow:\s*var\(--neoverse-control-secondary-shadow\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-filter:\s*var\(--neoverse-control-secondary-filter\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-background:\s*var\(--neoverse-control-secondary-background\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(/--neoverse-control-active-background:\s*linear-gradient\(/g),
  ).toHaveLength(1);
  expect(themesCss.match(/--neoverse-control-active-border:\s*transparent;/g)).toHaveLength(1);
});

test('keeps dark segmented active surfaces aligned with Neoverse navigation', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const activeBackgrounds = themesCss.match(/--neoverse-control-active-background:([\s\S]*?);/g);

  expect(activeBackgrounds).toHaveLength(1);
  for (const activeBackground of activeBackgrounds ?? []) {
    expect(activeBackground).toContain('linear-gradient(');
    expect(activeBackground).toContain('var(--neoverse-color-accent-secondary) 13%');
    expect(activeBackground).toContain('var(--neoverse-color-accent-primary) 7%');
    expect(activeBackground).not.toContain('var(--neoverse-color-blue-900)');
    expect(activeBackground).not.toContain('var(--neoverse-color-text-primary)');
  }

  expect(
    themesCss.match(
      /--neoverse-control-segmented-active-foreground:\s*var\(--neoverse-color-accent-secondary\);/g,
    ),
  ).toHaveLength(1);

  const activeHighlights = themesCss.match(/--neoverse-control-active-highlight:([\s\S]*?);/g);

  expect(activeHighlights).toHaveLength(1);
  for (const activeHighlight of activeHighlights ?? []) {
    expect(activeHighlight).not.toContain('var(--neoverse-color-text-primary)');
    expect(activeHighlight).toContain('var(--neoverse-color-edge-light) 62%');
  }
});

test('keeps dark elevated cards neutral and softly edged', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const expectedOverrides = [
    [
      /--neoverse-material-filter-elevated:\s*blur\(14px\) saturate\(112%\) brightness\(102%\) contrast\(102%\);/g,
      1,
    ],
    [
      /--neoverse-material-edge-filter-elevated:\s*blur\(16px\) saturate\(118%\) brightness\(102%\)\s+contrast\(103%\);/g,
      1,
    ],
    [
      /--neoverse-material-tint-elevated:\s*color-mix\(\s*in srgb,\s*var\(--neoverse-color-surface-raised\) 84%,\s*var\(--neoverse-color-text-primary\) 16%\s*\);/g,
      1,
    ],
    [/--neoverse-material-transparency-elevated:\s*26%;/g, 1],
    [/--neoverse-material-edge-refraction-opacity-elevated:\s*0\.24;/g, 1],
    [/--neoverse-material-refraction-gradient-elevated:\s*radial-gradient\(/g, 1],
  ];

  for (const [override, count] of expectedOverrides) {
    expect(themesCss.match(override as RegExp)).toHaveLength(count as number);
  }

  for (const token of [
    'tint-elevated',
    'edge-highlight-elevated',
    'inner-glow-elevated',
    'seam-glow-elevated',
    'bloom-elevated',
  ]) {
    const declarations = themesCss.match(
      new RegExp(`--neoverse-material-${token}:([\\s\\S]*?);`, 'g'),
    );

    expect(declarations).toHaveLength(1);
    for (const declaration of declarations ?? []) {
      expect(declaration).not.toMatch(/accent-(?:primary|secondary|tertiary)/);
    }
  }
  expect(themesCss).toContain('var(--neoverse-color-surface-raised)');
});

test('keeps dark subtle state cards neutral and softly grounded', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const expectedOverrides: Array<[RegExp, number]> = [
    [
      /--neoverse-material-filter-subtle:\s*blur\(10px\) saturate\(112%\) brightness\(102%\) contrast\(102%\);/g,
      1,
    ],
    [
      /--neoverse-material-edge-filter-subtle:\s*blur\(12px\) saturate\(118%\) brightness\(102%\)\s+contrast\(103%\);/g,
      1,
    ],
    [
      /--neoverse-material-tint-subtle:\s*color-mix\(\s*in srgb,\s*var\(--neoverse-color-surface-raised\) 84%,\s*var\(--neoverse-color-text-primary\) 16%\s*\);/g,
      1,
    ],
    [/--neoverse-material-transparency-subtle:\s*24%;/g, 1],
    [/--neoverse-material-edge-refraction-opacity-subtle:\s*0\.3(?:0)?;/g, 1],
    [
      /--neoverse-material-glass-subtle-shadow:\s*0 0\.75rem 2rem -1\.25rem rgb\(0 0 0 \/ 34%\),\s*0 3px 8px -1px rgb\(0 0 0 \/ 12%\);/g,
      1,
    ],
    [/--neoverse-material-refraction-gradient-subtle:\s*radial-gradient\(/g, 1],
  ];

  for (const [override, count] of expectedOverrides) {
    expect(themesCss.match(override)).toHaveLength(count);
  }

  for (const token of [
    'edge-highlight-subtle',
    'inner-glow-subtle',
    'seam-glow-subtle',
    'bloom-subtle',
  ]) {
    const declarations = themesCss.match(
      new RegExp(`--neoverse-material-${token}:([\\s\\S]*?);`, 'g'),
    );

    expect(declarations).toHaveLength(1);
    for (const declaration of declarations ?? []) {
      expect(declaration).not.toMatch(/accent-(?:primary|secondary|tertiary)/);
    }
  }
});

test('aligns dark button states with the segmented control color language', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const primaryBackgrounds = themesCss.match(/--neoverse-control-primary-background:([\s\S]*?);/g);

  expect(primaryBackgrounds).toHaveLength(1);
  for (const background of primaryBackgrounds ?? []) {
    expect(background).toContain('var(--neoverse-control-active-background)');
    expect(background).toContain('var(--neoverse-control-secondary-background)');
  }

  for (const token of [
    'primary-foreground',
    'secondary-hover-foreground',
    'secondary-active-foreground',
    'ghost-hover-foreground',
    'ghost-active-foreground',
  ]) {
    expect(
      themesCss.match(
        new RegExp(
          `--neoverse-control-${token}:\\s*var\\(\\s*--neoverse-control-segmented-active-foreground\\s*\\);`,
          'g',
        ),
      ),
    ).toHaveLength(1);
  }

  expect(
    themesCss.match(
      /--neoverse-control-secondary-foreground:\s*var\(--neoverse-control-segmented-foreground\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-button-hover-background:\s*var\(--neoverse-control-hover-background\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-button-active-background:\s*\n?\s*var\(--neoverse-control-active-background\),/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-button-edge:\s*var\(--neoverse-control-secondary-shadow\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-button-edge-active:\s*var\(--neoverse-control-active-shadow\);/g,
    ),
  ).toHaveLength(1);

  const refractionGradients = themesCss.match(
    /--neoverse-control-button-refraction-gradient:([\s\S]*?);/g,
  );
  expect(refractionGradients).toHaveLength(1);
  for (const gradient of refractionGradients ?? []) {
    expect(gradient).toContain('var(--neoverse-color-accent-secondary)');
    expect(gradient).toContain('var(--neoverse-color-accent-primary)');
  }
});

test('keeps light control buttons grounded by a compact neutral shadow', async () => {
  const [geometryCss, buttonCss, sharedControlCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const semanticCss = `${buttonCss}\n${sharedControlCss}`;
  const controlShadow = 'var(--neoverse-shadow-control)';

  expect(geometryCss).toContain('--neoverse-shadow-control: 0 2px 6px -1px rgb(14 34 44 / 20%);');

  const primaryShadow = semanticCss.match(/--neoverse-control-primary-shadow:([\s\S]*?);/)?.[1];
  expect(primaryShadow).toContain('var(--neoverse-control-active-shadow)');

  const secondaryShadow = semanticCss.match(/--neoverse-control-secondary-shadow:([\s\S]*?);/)?.[1];
  expect(secondaryShadow).toContain(controlShadow);

  expect(semanticCss).toMatch(/--neoverse-control-secondary-background:\s*linear-gradient\(/);
  expect(semanticCss).toMatch(
    /--neoverse-control-primary-hover-shadow:\s*var\(\s*--neoverse-control-active-shadow\s*\);/,
  );
  expect(semanticCss).toMatch(
    /--neoverse-control-button-edge:\s*var\(--neoverse-control-secondary-shadow\);/,
  );
  expect(semanticCss).toMatch(
    /--neoverse-control-button-edge-active:\s*var\(--neoverse-control-active-shadow\);/,
  );

  expect(
    themesCss.match(/--neoverse-shadow-control:\s*var\(--neoverse-shadow-xs\);/g),
  ).toHaveLength(1);
});

test('aligns light buttons with the pale mint segmented-control surface', async () => {
  const [buttonCss, sharedControlCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
  ]);
  const semanticCss = `${buttonCss}\n${sharedControlCss}`;
  const declaration = (token: string): string =>
    semanticCss.match(new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`))?.[1] ?? '';

  expect(declaration('primary-background')).toContain('var(--neoverse-control-active-background)');
  expect(declaration('secondary-background')).not.toContain(
    'var(--neoverse-control-active-background)',
  );
  expect(declaration('primary-foreground')).toMatch(
    /var\(\s*--neoverse-control-segmented-active-foreground\s*\)/,
  );
  for (const token of [
    'primary-hover-background',
    'button-hover-background',
    'button-active-background',
    'button-ghost-active-background',
  ]) {
    expect(declaration(token)).toMatch(/var\(\s*--neoverse-control-active-background\s*\)/);
  }

  for (const token of [
    'secondary-hover-foreground',
    'secondary-active-foreground',
    'ghost-hover-foreground',
    'ghost-active-foreground',
  ]) {
    expect(declaration(token)).toMatch(
      /var\(\s*--neoverse-control-segmented-active-foreground\s*\)/,
    );
  }
});

test('keeps button edges restrained and stable beside segmented controls', async () => {
  const [buttonTokensCss, buttonCss, sharedControlCss, segmentedCss] = await Promise.all([
    readTokenCss('components/button.css'),
    Bun.file(new URL('../../tailwind/src/components/button.css', import.meta.url)).text(),
    readTokenCss('components/shared-control.css'),
    readTokenCss('components/segmented-control.css'),
  ]);
  const declaration = (source: string, token: string): string =>
    source.match(new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`))?.[1] ?? '';
  const ghostDefault =
    buttonCss.match(/\.ui-button--ghost\.material-glass-subtle \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
  const ghostHover =
    buttonCss.match(
      /\.ui-button--ghost\.material-glass-subtle:hover:not\(:disabled\) \{([\s\S]*?)\n {2}\}/,
    )?.[1] ?? '';
  const buttonSurface =
    buttonCss.match(/\.ui-button\.material-glass-subtle \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
  const pressLayer =
    buttonCss.match(/\.ui-button\.material-glass-subtle::after \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';

  expect(buttonCss).toMatch(
    /border:\s*var\(--neoverse-border-width-thin\)\s+var\(--neoverse-border-style-solid\)\s+var\(--neoverse-control-button-border\);/,
  );
  expect(buttonSurface).toContain('overflow: hidden;');
  expect(pressLayer).toContain('inset: 0;');
  expect(pressLayer).toContain('border-radius: inherit;');
  expect(declaration(buttonTokensCss, 'button-edge')).not.toContain(
    'var(--neoverse-color-edge-light)',
  );
  expect(declaration(buttonTokensCss, 'button-refraction-gradient')).not.toContain(
    'var(--neoverse-color-edge-light)',
  );
  expect(declaration(buttonTokensCss, 'button-edge-carrier')).not.toContain(
    'var(--neoverse-color-edge-light)',
  );
  for (const token of [
    'secondary-background',
    'secondary-hover-background',
    'secondary-shadow',
    'secondary-hover-shadow',
  ]) {
    expect(declaration(sharedControlCss, token)).not.toContain('var(--neoverse-color-edge-light)');
  }

  expect(ghostDefault).toContain('--neoverse-material-shadow: 0 0 0 0 transparent;');
  expect(ghostDefault).toContain('border-color: transparent;');
  expect(ghostDefault).toContain('--neoverse-material-edge-refraction-opacity: 0;');
  expect(ghostDefault).toContain('background: var(--neoverse-control-ghost-background);');
  expect(ghostHover).not.toContain('--neoverse-material-edge-refraction-opacity:');
  expect(ghostHover).not.toContain('--neoverse-material-shadow:');
  expect(ghostHover).not.toContain('--neoverse-material-edge-refraction-opacity:');

  expect(declaration(segmentedCss, 'segmented-border')).toMatch(
    /var\(\s*--neoverse-control-button-border\s*\)/,
  );
});

test('keeps secondary and ghost button surfaces visually distinct', async () => {
  const [buttonCss, sharedControlCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
  ]);
  const declaration = (source: string, token: string): string =>
    source.match(new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`))?.[1] ?? '';
  const secondaryBackground = declaration(sharedControlCss, 'secondary-background');
  const ghostBackground = declaration(buttonCss, 'ghost-background');

  expect(declaration(sharedControlCss, 'button-border').trim()).toBe(
    'var(--neoverse-color-border-default)',
  );
  expect(secondaryBackground).toContain('var(--neoverse-color-surface-raised)');
  expect(secondaryBackground).not.toContain('var(--neoverse-color-surface-canvas)');
  expect(ghostBackground.trim()).toBe('transparent');
  expect(secondaryBackground).not.toBe(ghostBackground);
});

test('keeps button surfaces independent of theme accents', async () => {
  const [buttonCss, sharedControlCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
  ]);
  const semanticCss = `${buttonCss}\n${sharedControlCss}`;
  const buttonTokens = [
    'primary-background',
    'primary-foreground',
    'primary-border',
    'primary-shadow',
    'primary-hover-background',
    'primary-hover-shadow',
    'primary-active-background',
    'button-edge',
    'button-edge-active',
    'button-edge-carrier',
    'button-refraction-gradient',
    'button-press-glow',
    'button-hover-background',
    'button-active-background',
    'button-ghost-active-background',
    'secondary-background',
    'secondary-border',
    'secondary-hover-background',
    'secondary-shadow',
    'secondary-hover-shadow',
    'secondary-filter',
  ];

  for (const token of buttonTokens) {
    const declaration = semanticCss.match(
      new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`),
    )?.[1];

    expect(declaration).toBeDefined();
    expect(declaration).not.toMatch(/accent-(?:primary|secondary|tertiary)/);
    expect(declaration).not.toMatch(/material-(?:tint|edge-highlight|inner-glow|bloom)/);
  }
});

test('positions the button press glow from pointer coordinates', async () => {
  const semanticCss = await readTokenCss('components/button.css');
  const themesCss = await readTokenCss('themes/dark.css');
  const pointerPosition =
    /at var\(--neoverse-button-press-x,\s*50%\) var\(--neoverse-button-press-y,\s*50%\)/;

  expect(semanticCss).toMatch(pointerPosition);
  expect(themesCss).toMatch(pointerPosition);
  expect(semanticCss).not.toContain('90% 140% at 50% -12%');
  expect(themesCss).not.toContain('90% 140% at 50% -12%');
});

test('keeps dark keyboard focus aligned with the segmented-control accent', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const focusRings = themesCss.match(/--neoverse-color-focus-ring:\s*([^;]+);/g);

  expect(focusRings).toHaveLength(1);
  for (const focusRing of focusRings ?? []) {
    expect(focusRing).toContain('var(--neoverse-color-accent-secondary)');
    expect(focusRing).not.toContain('var(--neoverse-color-accent-tertiary)');
  }
});

test('provides the complete four-pixel spacing grid', () => {
  const spacingTokens = Object.values(cssVariables.space);

  expect(spacingTokens).toHaveLength(33);
  expect(spacingTokens[0]).toBe('--neoverse-space-0');
  expect(spacingTokens[32]).toBe('--neoverse-space-32');
});

test('exposes the shared geometry and typography contracts', () => {
  expect(cssVariables.radius['2xl']).toBe('--neoverse-radius-2xl');
  expect(cssVariables.shadow.inset).toBe('--neoverse-shadow-inset');
  expect(cssVariables.font.family.mono).toBe('--neoverse-font-family-mono');
  expect(cssVariables.typography.body.lineHeight).toBe('--neoverse-typography-body-line-height');
});

test('exposes semantic geometry and focus aliases', () => {
  expect(cssVariables.radius.control).toBe('--neoverse-radius-control');
  expect(cssVariables.radius.controlInner).toBe('--neoverse-radius-control-inner');
  expect(cssVariables.radius.card).toBe('--neoverse-radius-card');
  expect(cssVariables.shadow.overlay).toBe('--neoverse-shadow-overlay');
  expect(cssVariables.focus.ringWidth).toBe('--neoverse-focus-ring-width');
  expect(cssVariables.focus.ringOffset).toBe('--neoverse-focus-ring-offset');
  expect(cssVariables.focus.ringOffsetColor).toBe('--neoverse-focus-ring-offset-color');
});

test('exposes shared Surface and Glass material contracts', () => {
  const surfaceParameters = [
    'background',
    'backgroundFallback',
    'transparency',
    'blur',
    'saturation',
    'border',
    'borderWidth',
    'edgeHighlight',
    'shadow',
    'refractionGradient',
  ];
  const glassParameters = [
    'background',
    'backgroundFallback',
    'tint',
    'transparency',
    'blur',
    'saturation',
    'filter',
    'edgeFilter',
    'border',
    'borderWidth',
    'edgeRefractionOpacity',
    'edgeRefractionWidth',
    'edgeRefractionSoftness',
    'edgeRefractionCarrier',
    'edgeHighlight',
    'innerGlow',
    'seamGlow',
    'bloom',
    'shadow',
    'refractionGradient',
  ];
  const surfaceRoles = [
    cssVariables.material.surface.solid,
    cssVariables.material.surface.subtle,
    cssVariables.material.surface.elevated,
  ];
  const glassRoles = [
    cssVariables.material.glass.subtle,
    cssVariables.material.glass.elevated,
    cssVariables.material.glass.immersive,
  ];

  for (const role of surfaceRoles) {
    expect(Object.keys(role)).toEqual(surfaceParameters);
  }

  for (const role of glassRoles) {
    expect(Object.keys(role)).toEqual(glassParameters);
  }

  expect(cssVariables.material.scale.blur.md).toBe('--neoverse-material-blur-md');
  expect(cssVariables.material.scale.saturation.immersive).toBe(
    '--neoverse-material-saturation-immersive',
  );
  expect(cssVariables.material.scale.filter.elevated).toBe('--neoverse-material-filter-elevated');
  expect(cssVariables.material.scale.edgeFilter.immersive).toBe(
    '--neoverse-material-edge-filter-immersive',
  );
  expect(cssVariables.material.scale.tint.subtle).toBe('--neoverse-material-tint-subtle');
  expect(cssVariables.material.scale.innerGlow.elevated).toBe(
    '--neoverse-material-inner-glow-elevated',
  );
  expect(cssVariables.material.scale.seamGlow.subtle).toBe('--neoverse-material-seam-glow-subtle');
  expect(cssVariables.material.scale.bloom.immersive).toBe('--neoverse-material-bloom-immersive');
  expect(cssVariables.material.surface.elevated.shadow).toBe(
    '--neoverse-material-surface-elevated-shadow',
  );
  expect(cssVariables.material.glass.elevated.filter).toBe(
    '--neoverse-material-glass-elevated-filter',
  );
  expect(cssVariables.material.glass.immersive.edgeRefractionSoftness).toBe(
    '--neoverse-material-glass-immersive-edge-refraction-softness',
  );
  expect(cssVariables.material.glass.immersive.refractionGradient).toBe(
    '--neoverse-material-glass-immersive-refraction-gradient',
  );
});

test('exposes Motion duration, easing, and spatial tokens', () => {
  expect(cssVariables.motion.duration).toEqual({
    fast: '--neoverse-motion-duration-fast',
    standard: '--neoverse-motion-duration-standard',
    expressive: '--neoverse-motion-duration-expressive',
  });
  expect(cssVariables.motion.easing.standard).toBe('--neoverse-motion-easing-standard');
  expect(cssVariables.motion.spatialDistance).toBe('--neoverse-motion-spatial-distance');
});

test('keeps layout breakpoints available as numeric adapter constants', () => {
  expect(layoutBreakpoints).toEqual({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  });
});

type ShadowLayer = [boolean, number, number, number, number];

const splitShadowLayers = (value: string): string[] => {
  const layers: string[] = [];
  let start = 0;
  let parentheses = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '(') {
      parentheses += 1;
    } else if (value[index] === ')') {
      parentheses -= 1;
    } else if (value[index] === ',' && parentheses === 0) {
      layers.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  layers.push(value.slice(start).trim());
  return layers;
};

const parseShadowLayers = (value: string): ShadowLayer[] =>
  splitShadowLayers(value).map((layer) => {
    const match =
      /^(inset\s+)?(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s+([\d.]+(?:px|rem)?)(?:\s+(-?[\d.]+(?:px|rem)?))?/.exec(
        layer,
      );

    if (match === null) {
      throw new Error(`Unable to parse shadow layer: ${layer}`);
    }

    const offsetX = match[2];
    const offsetY = match[3];
    const blur = match[4];
    const spread = match[5] ?? '0';

    if (offsetX === undefined || offsetY === undefined || blur === undefined) {
      throw new Error(`Incomplete shadow layer: ${layer}`);
    }

    const toPx = (token: string): number =>
      Number.parseFloat(token) * (token.endsWith('rem') ? 16 : 1);

    return [match[1] !== undefined, toPx(offsetX), toPx(offsetY), toPx(blur), toPx(spread)];
  });

const firstShadowLayer = (value: string): ShadowLayer => {
  const layer = parseShadowLayers(value)[0];

  if (layer === undefined) {
    throw new Error(`Missing shadow layer: ${value}`);
  }

  return layer;
};

const shadowDeclarations = (css: string, name: string): string[] =>
  [...css.matchAll(new RegExp(`--neoverse-shadow-${name}:\\s*([^;]+)`, 'g'))].flatMap((match) =>
    match[1] === undefined ? [] : [match[1].trim()],
  );

const readTokenCss = async (fileName: string): Promise<string> => {
  const localFile = Bun.file(new URL(`./${fileName}`, import.meta.url));

  if (await localFile.exists()) {
    return localFile.text();
  }

  return Bun.file(new URL(`../src/${fileName}`, import.meta.url)).text();
};

const readBuiltTokenCss = (): Promise<string> =>
  Bun.file(new URL('../dist/tokens.css', import.meta.url)).text();

const extractCssBlock = (css: string, selector: string): string => {
  const selectorIndex = css.indexOf(selector);
  const openingBrace = css.indexOf('{', selectorIndex);

  if (selectorIndex < 0 || openingBrace < 0) {
    throw new Error(`Unable to find selector block: ${selector}`);
  }

  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === '{') {
      depth += 1;
    } else if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(openingBrace + 1, index);
      }
    }
  }

  throw new Error(`Unclosed selector block: ${selector}`);
};

test('renders one dark source into matching explicit and system wrappers', async () => {
  const darkSource = await readTokenCss('themes/dark.css');
  const declarations = [...darkSource.matchAll(/^\s*(--neoverse-[\w-]+):/gm)].map(
    (match) => match[1],
  );
  const builtCss = await readBuiltTokenCss();
  const systemBody = extractCssBlock(
    builtCss,
    ":root[data-theme='system'],\n    :root:not([data-theme], .light, .dark)",
  );
  const explicitBody = extractCssBlock(
    builtCss,
    ":root.dark:not([data-theme]),\n  :root[data-theme='dark']",
  );

  expect(declarations.length).toBeGreaterThan(0);
  expect(new Set(declarations).size).toBe(declarations.length);
  expect(darkSource).not.toMatch(/:root|\[data-theme=|@media/);
  expect(builtCss).not.toContain('@neoverse-dark-tokens');
  expect(systemBody.replace(/\s+/g, ' ').trim()).toBe(explicitBody.replace(/\s+/g, ' ').trim());
});

test('keeps Glass transparency visible and ordered by depth', async () => {
  const materialCss = await readTokenCss('material.css');
  const transparency = ['subtle', 'elevated', 'immersive'].map((name) => {
    const value = materialCss.match(
      new RegExp(`--neoverse-material-transparency-${name}:\\s*(\\d+)%`),
    )?.[1];

    return Number(value);
  });

  expect(transparency).toEqual([30, 20, 12]);
});

test('keeps light Glass surfaces free of dark hairline borders', async () => {
  const [materialCss, themesCss] = await Promise.all([
    readTokenCss('material.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const variants = ['subtle', 'elevated', 'immersive'];

  for (const variant of variants) {
    expect(materialCss).toContain(`--neoverse-material-glass-${variant}-border: transparent;`);
    expect(
      themesCss.match(
        new RegExp(
          `--neoverse-material-glass-${variant}-border:\\s*var\\(--neoverse-color-border-(?:subtle|default)\\);`,
          'g',
        ),
      ),
    ).toHaveLength(1);
  }
});

test('keeps Glass edge highlights refractive and softly diffused', async () => {
  const [materialCss, buttonCss, geometryCss, themesCss] = await Promise.all([
    readTokenCss('material.css'),
    readTokenCss('components/button.css'),
    readTokenCss('geometry.css'),
    readTokenCss('themes/dark.css'),
  ]);

  for (const variant of ['subtle', 'elevated', 'immersive']) {
    const declaration = materialCss.match(
      new RegExp(`--neoverse-material-edge-highlight-${variant}:([\\s\\S]*?);`),
    )?.[1];

    expect(declaration).toContain('inset 0 1px 2px');
    expect(declaration).toContain('inset 0 -1px 2px');
    expect(declaration).toContain('inset 1px 0 2px');
    expect(declaration).toContain('inset -1px 0 2px');
    expect(declaration).toContain('var(--neoverse-color-accent-primary)');
    expect(declaration).toContain('var(--neoverse-color-accent-secondary)');
    expect(declaration).toContain('var(--neoverse-color-accent-tertiary)');

    const darkDeclarations = themesCss.match(
      new RegExp(`--neoverse-material-edge-highlight-${variant}:([\\s\\S]*?);`, 'g'),
    );

    expect(darkDeclarations).toHaveLength(1);
    for (const darkDeclaration of darkDeclarations ?? []) {
      expect(darkDeclaration).toContain('inset 0 1px 2px');
      expect(darkDeclaration).toContain('inset 0 -1px 2px');
      expect(darkDeclaration).toContain('inset 1px 0 2px');
      expect(darkDeclaration).toContain('inset -1px 0 2px');
      if (variant === 'elevated' || variant === 'subtle') {
        expect(darkDeclaration).not.toMatch(
          /var\(--neoverse-color-accent-(?:primary|secondary|tertiary)\)/,
        );
      } else {
        expect(darkDeclaration).toContain('var(--neoverse-color-accent-primary)');
        expect(darkDeclaration).toContain('var(--neoverse-color-accent-secondary)');
        expect(darkDeclaration).toContain('var(--neoverse-color-accent-tertiary)');
      }
    }
  }

  expect(buttonCss).toMatch(
    /--neoverse-control-primary-shadow:\s*var\(\s*--neoverse-control-active-shadow\s*\);/,
  );
  expect(geometryCss).toMatch(
    /--neoverse-shadow-inset:\s*var\(--neoverse-material-edge-highlight-subtle\),/,
  );
  expect(materialCss).toMatch(
    /--neoverse-material-refraction-gradient-subtle:\s*radial-gradient\(/,
  );
  expect(materialCss).toMatch(
    /--neoverse-material-refraction-gradient-immersive:\s*radial-gradient\(/,
  );
  for (const token of [
    'filter',
    'edge-filter',
    'tint',
    'inner-glow',
    'seam-glow',
    'bloom',
    'edge-refraction-width',
    'edge-refraction-softness',
  ]) {
    expect(materialCss).toContain(`--neoverse-material-${token}-subtle:`);
    expect(materialCss).toContain(`--neoverse-material-${token}-elevated:`);
    expect(materialCss).toContain(`--neoverse-material-${token}-immersive:`);
  }
  expect(themesCss).toContain('--neoverse-material-filter-subtle: blur(10px)');
  expect(themesCss).toContain('--neoverse-material-edge-filter-subtle: blur(12px)');
  expect(themesCss).toMatch(/--neoverse-material-refraction-gradient-subtle:\s*radial-gradient\(/);
});

test('keeps dark shadows aligned with the light hierarchy', async () => {
  const [geometryCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('themes/dark.css'),
  ]);

  for (const name of ['xs', 'sm', 'md', 'lg', 'xl']) {
    const lightValue = shadowDeclarations(geometryCss, name)[0];
    const darkValues = shadowDeclarations(themesCss, name);

    expect(lightValue).toBeDefined();
    expect(darkValues).toHaveLength(1);

    if (lightValue === undefined) {
      continue;
    }

    const lightLayers = parseShadowLayers(lightValue);

    for (const darkValue of darkValues) {
      expect(parseShadowLayers(darkValue)).toEqual(lightLayers);
    }
  }
});

test('keeps inset material distinct between light and dark surfaces', async () => {
  const [geometryCss, materialCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('material.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const lightValue = shadowDeclarations(geometryCss, 'inset')[0];
  const lightEdgeHighlight = materialCss.match(
    /--neoverse-material-edge-highlight-subtle:([\s\S]*?);/,
  )?.[1];
  const darkValues = shadowDeclarations(themesCss, 'inset');
  const darkEdgeHighlights = [
    ...themesCss.matchAll(/--neoverse-material-edge-highlight-subtle:([\s\S]*?);/g),
  ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

  expect(lightValue).toBeDefined();
  expect(lightEdgeHighlight).toBeDefined();
  expect(darkValues).toHaveLength(1);
  expect(darkEdgeHighlights).toHaveLength(1);

  if (lightValue === undefined || lightEdgeHighlight === undefined) {
    return;
  }

  expect(
    parseShadowLayers(
      lightValue.replace('var(--neoverse-material-edge-highlight-subtle)', lightEdgeHighlight),
    ),
  ).toEqual([
    [true, 0, 1, 2, 0],
    [true, 0, -1, 2, 0],
    [true, 1, 0, 2, 0],
    [true, -1, 0, 2, 0],
    [true, 0, -1, 2, 0],
  ]);

  for (const [index, darkValue] of darkValues.entries()) {
    const darkEdgeHighlight = darkEdgeHighlights[index];

    expect(darkEdgeHighlight).toBeDefined();
    if (darkEdgeHighlight === undefined) {
      continue;
    }

    expect(
      parseShadowLayers(
        darkValue.replace('var(--neoverse-material-edge-highlight-subtle)', darkEdgeHighlight),
      ),
    ).toEqual([
      [true, 0, 1, 2, 0],
      [true, 0, -1, 2, 0],
      [true, 1, 0, 2, 0],
      [true, -1, 0, 2, 0],
      [true, 0, -1, 2, 0],
    ]);
  }
});

const shadowReach = ([, offsetX, offsetY, blur, spread]: ShadowLayer): number =>
  Math.abs(offsetX) + Math.abs(offsetY) + blur + spread;

test('keeps sm and md shadows visibly separated from xs', async () => {
  const [geometryCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('themes/dark.css'),
  ]);

  const lightValue = shadowDeclarations(geometryCss, 'xs')[0];
  const lightSmValue = shadowDeclarations(geometryCss, 'sm')[0];
  const lightMdValue = shadowDeclarations(geometryCss, 'md')[0];
  const darkValues = ['xs', 'sm', 'md'].map((name) => shadowDeclarations(themesCss, name));
  const shadowSets = [
    [lightValue, lightSmValue, lightMdValue],
    ...[0].map((index) => darkValues.map((values) => values[index])),
  ];

  for (const [xsValue, smValue, mdValue] of shadowSets) {
    expect(xsValue).toBeDefined();
    expect(smValue).toBeDefined();
    expect(mdValue).toBeDefined();

    if (xsValue === undefined || smValue === undefined || mdValue === undefined) {
      continue;
    }

    const smLayers = parseShadowLayers(smValue);
    const mdLayers = parseShadowLayers(mdValue);
    const xsLayer = firstShadowLayer(xsValue);
    const smLayer = firstShadowLayer(smValue);
    const mdLayer = firstShadowLayer(mdValue);
    const smGroundingLayer = smLayers[1];
    const mdGroundingLayer = mdLayers[1];

    expect(smGroundingLayer).toBeDefined();
    expect(mdGroundingLayer).toBeDefined();
    expect(shadowReach(smLayer)).toBeGreaterThan(shadowReach(xsLayer));
    expect(shadowReach(mdLayer)).toBeGreaterThan(shadowReach(smLayer));

    if (smGroundingLayer === undefined || mdGroundingLayer === undefined) {
      continue;
    }

    expect(shadowReach(smGroundingLayer)).toBeGreaterThan(shadowReach(xsLayer));
    expect(shadowReach(mdGroundingLayer)).toBeGreaterThan(shadowReach(smGroundingLayer));
  }
});
