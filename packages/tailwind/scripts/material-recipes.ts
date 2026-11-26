import {
  defaultMaterial,
  getSurfaceClass,
  type GlassTier,
  type Material,
  materialAttribute,
  materials,
  type SurfaceRole,
} from '@neoverse-ui/tokens';

const scope = (material: Material) => `[${materialAttribute}='${material}']`;
const others = (material: Material) => materials.filter((value) => value !== material).map(scope).join(', ');
const boundaries = materials.map(scope).join(', ');
const region = (root: string) => `:where(${root}, ${root} *)`;
const glassRegion = region(`:scope:not(${others('glass')})`);
const frostedRegion = region(`:scope${scope('frosted')}`);
const scopeValues = materials.map((material) => {
  const selector = material === defaultMaterial ? `:root, ${scope(material)}` : scope(material);
  return `  :where(${selector}) { --neoverse-scope-material: ${material}; }`;
}).join('\n');

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
const intrinsic = ':is(.ui-choice__control, .ui-disclosure, .neoverse-prose details, .neoverse-prose table)';

/** Expand authored recipe selectors in both standalone and compiled stylesheets. */
export function materialRecipes(css: string): string {
  return css
    .replaceAll('@scope (.material-scopes)', `@scope (:root, ${boundaries}) to (${boundaries})`)
    // Descendants inherit a painted ancestor even when the immediate child starts a new scope.
    .replaceAll('@scope (.material-scope-edges)', `@scope (:root, ${boundaries}) to (:scope :is(${boundaries}) > *)`)
    .replaceAll('@scope (.material-glass-default)', `@scope (:root:not(${others('glass')}), ${scope('glass')}) to (${others('glass')})`)
    .replaceAll('@scope (.material-solid-scope)', `@scope (${scope('solid')}) to (${others('solid')})`)
    .replaceAll('@scope (.material-static-scope)', `@scope (${others('glass')}) to (${scope('glass')})`)
    .replace(/\.material-recipe-glass-(subtle|elevated|immersive)/g, (_match, tier: GlassTier) => {
      const explicit = `.material-glass-${tier}`;
      const automatic = roles.filter((role) => role.tier === tier).map(({ selector }) => selector).join(', ');
      return automatic
        ? `:is(${explicit}, ${glassRegion}:is(${automatic}):where(:not(.material-frosted)))`
        : explicit;
    })
    .replaceAll('.material-recipe-auto', `${roleSelector}:where(:not(.material-frosted))`)
    .replaceAll('.material-recipe-frosted', `:is(${roleSelector}:where(.material-frosted, ${frostedRegion}), ${frostedRegion}${intrinsic})`)
    .replaceAll('  /* Generated material scope values */', scopeValues);
}
