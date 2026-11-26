import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { materialRecipes } from '../scripts/material-recipes.ts';

describe('materialRecipes', () => {
  it('expands symmetrical three-material scope aliases without binary static-scope leakage', () => {
    const input = [
      '@scope (.material-solid-scope) { .a { color: red; } }',
      '@scope (.material-frosted-scope) { .b { color: blue; } }',
      '@scope (.material-glass-scope) { .c { color: green; } }',
    ].join('\n');

    const output = materialRecipes(input);

    expect(output).toContain(
      "@scope ([data-neoverse-material='solid']) to ([data-neoverse-material='glass'], [data-neoverse-material='frosted'])",
    );
    expect(output).toContain(
      "@scope ([data-neoverse-material='frosted']) to ([data-neoverse-material='glass'], [data-neoverse-material='solid'])",
    );
    expect(output).toContain(
      "@scope (:root:not([data-neoverse-material='solid'], [data-neoverse-material='frosted']), [data-neoverse-material='glass']) to ([data-neoverse-material='solid'], [data-neoverse-material='frosted'])",
    );
    expect(output).not.toContain('material-static-scope');
    expect(output).not.toContain('material-glass-default');
  });

  it('expands all seven Frosted SurfaceRole recipe selectors and excludes ghost buttons', () => {
    const roles = [
      'control',
      'panel',
      'group',
      'field',
      'overlay',
      'compact-overlay',
      'table',
    ] as const;

    const input = [
      '.material-recipe-frosted { display: block; }',
      ...roles.map((role) => `.material-recipe-frosted-${role} { --r: ${role}; }`),
    ].join('\n');

    const output = materialRecipes(input);

    expect(output).toContain(
      ".material-role-control:not(:where(.ui-button--ghost, [data-surface='none']))",
    );
    for (const role of roles) {
      expect(output).toContain(`.material-role-${role}:where(.material-frosted,`);
    }
    expect(output).toContain(
      ".material-role-control:where(.material-frosted, :where(:scope[data-neoverse-material='frosted'], :scope[data-neoverse-material='frosted'] *)):not(:where(.ui-button--ghost, [data-surface='none']))",
    );
  });

  it('expands Glass recipe selectors across all three optical tiers', () => {
    const input = [
      '.material-recipe-glass-subtle { opacity: 1; }',
      '.material-recipe-glass-elevated { opacity: 1; }',
      '.material-recipe-glass-immersive { opacity: 1; }',
    ].join('\n');

    const output = materialRecipes(input);

    expect(output).toContain('.material-glass-subtle');
    expect(output).toContain('.material-glass-elevated');
    expect(output).toContain('.material-glass-immersive');
    expect(output).toContain('.material-role-panel');
    expect(output).toContain('.material-role-overlay');
  });

  it('keeps built dist/components.css free of obsolete scope aliases', () => {
    const componentsCss = readFileSync(resolve(import.meta.dir, '../dist/components.css'), 'utf8');
    expect(componentsCss).not.toContain('.material-static-scope');
    expect(componentsCss).not.toContain('.material-glass-default');
    expect(componentsCss).toContain('.material-role-panel:where(.material-frosted,');
    expect(componentsCss).toContain('.material-role-overlay:where(.material-frosted,');
  });
});
