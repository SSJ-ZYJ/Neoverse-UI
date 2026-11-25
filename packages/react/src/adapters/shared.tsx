export type NoticeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type FormControlValidation = 'none' | 'error' | 'warning' | 'success';
export type FormControlValue = string | number;
export type ActionSize = 'sm' | 'md' | 'lg';
export type ActionScale = 'md' | 'lg';
export type ControlSurfaceScale = 'md' | 'lg';
export type SurfaceHoverMode = 'auto' | 'static';
export type SurfaceEdgeMode = 'auto' | 'local';
export type ControlSurfacePreset = 'none' | 'glass-subtle' | 'glass-elevated' | 'glass-immersive';

export const actionSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-action--sm',
  md: 'ui-action--md',
  lg: 'ui-action--lg',
};

export const actionScaleClasses: Record<ActionScale, string> = {
  md: 'ui-action--scale-md',
  lg: 'ui-action--scale-lg',
};

export const buttonSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
};

export const buttonStretchSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-button--sm ui-button--stretch',
  md: 'ui-button--md ui-button--stretch',
  lg: 'ui-button--lg ui-button--stretch',
};

export const iconButtonSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-icon-button--sm',
  md: 'ui-icon-button--md',
  lg: 'ui-icon-button--lg',
};

export const iconButtonStretchSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-icon-button--sm ui-icon-button--stretch',
  md: 'ui-icon-button--md ui-icon-button--stretch',
  lg: 'ui-icon-button--lg ui-icon-button--stretch',
};

export const loadingIndicatorClass = 'ui-loading-indicator';

/**
 * The two decorative layers every button-family surface renders.
 *
 * `packages/tailwind/src/components/button.css` selects these classes
 * directly, so the markup is a public visual contract shared by UiButton,
 * UiAction and UiIconButton. Keep the elements as direct children: sibling
 * selectors such as `.ui-button > .ui-button__tone-field` depend on that.
 */
export function ButtonMaterialShell() {
  return (
    <>
      <span className="ui-button__tone-field" aria-hidden="true" />
      <span className="ui-button__edge-field" aria-hidden="true" />
    </>
  );
}
