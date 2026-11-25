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
