import {
  defaultMaterial,
  type GlassTier,
  getSurfaceClass,
  type Material,
  materialAttribute,
  materials,
  type SurfaceRole,
} from '@neoverse-ui/tokens';

const scope = (material: Material) => `[${materialAttribute}='${material}']`;
const others = (material: Material) =>
  materials
    .filter((value) => value !== material)
    .map(scope)
    .join(', ');
const boundaries = materials.map(scope).join(', ');
const region = (root: string) => `:where(${root}, ${root} *)`;
const glassRegion = region(`:scope:not(${others('glass')})`);
const frostedRegion = region(`:scope${scope('frosted')}`);
const scopeValues = materials
  .map((material) => {
    const selector = material === defaultMaterial ? `:root, ${scope(material)}` : scope(material);
    return `  :where(${selector}) { --neoverse-scope-material: ${material}; }`;
  })
  .join('\n');

const glassTiers: Record<SurfaceRole, GlassTier | null> = {
  control: 'subtle',
  panel: 'elevated',
  group: 'subtle',
  field: null,
  overlay: 'elevated',
  compactOverlay: 'subtle',
  table: null,
};
const roles = Object.entries(glassTiers).map(([role, tier]) => ({
  selector: `.${getSurfaceClass('auto', role as SurfaceRole)}`,
  tier,
}));
const roleSelector = `:is(${roles.map(({ selector }) => selector).join(', ')})`;
const ghostExclusion = ":not(:where(.ui-button--ghost, [data-surface='none']))";
const frostedSelectorFor = (suffix?: string): string => {
  if (suffix === 'control') {
    return `.material-role-control:where(.material-frosted, ${frostedRegion})${ghostExclusion}`;
  }
  if (suffix !== undefined) {
    return `.material-role-${suffix}:where(.material-frosted, ${frostedRegion})`;
  }
  const allRoles = roles
    .map(({ selector }) =>
      selector === '.material-role-control' ? `${selector}${ghostExclusion}` : selector,
    )
    .join(', ');
  return `:is(${allRoles}):where(.material-frosted, ${frostedRegion})`;
};

/** Expand authored recipe selectors in both standalone and compiled stylesheets. */
export function materialRecipes(css: string): string {
  return (
    css
      .replaceAll('@scope (.material-scopes)', `@scope (:root, ${boundaries}) to (${boundaries})`)
      // Descendants inherit a painted ancestor even when the immediate child starts a new scope.
      .replaceAll(
        '@scope (.material-scope-edges)',
        `@scope (:root, ${boundaries}) to (:scope :is(${boundaries}) > *)`,
      )
      .replaceAll(
        '@scope (.material-glass-scope)',
        `@scope (:root:not(${others('glass')}), ${scope('glass')}) to (${others('glass')})`,
      )
      .replaceAll(
        '@scope (.material-solid-scope)',
        `@scope (${scope('solid')}) to (${others('solid')})`,
      )
      .replaceAll(
        '@scope (.material-frosted-scope)',
        `@scope (${scope('frosted')}) to (${others('frosted')})`,
      )
      .replace(
        /\.material-recipe-glass-(subtle|elevated|immersive)/g,
        (_match, tier: GlassTier) => {
          const explicit = `.material-glass-${tier}`;
          const automatic = roles
            .filter((role) => role.tier === tier)
            .map(({ selector }) => selector)
            .join(', ');
          return automatic
            ? `:is(${explicit}, ${glassRegion}:is(${automatic}):where(:not(.material-frosted)))`
            : explicit;
        },
      )
      .replaceAll('.material-recipe-auto', `${roleSelector}:where(:not(.material-frosted))`)
      .replace(
        /\.material-recipe-frosted(?:-(compact-overlay|control|panel|group|field|overlay|table))?(?![\w-])/g,
        (_match, role?: string) => frostedSelectorFor(role),
      )
      .replaceAll('  /* Generated material scope values */', scopeValues)
  );
}
