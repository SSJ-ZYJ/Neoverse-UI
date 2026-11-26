import { bridgePortalMaterialScope, isKeyboardModality } from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { mergeClassNames } from '../../internal.js';
import {
  checkableState,
  contextMenuItemRole,
  isContextMenuItem,
  type UiContextMenuProps,
} from './context-menu-types.js';
import { useContextMenu } from './use-context-menu.js';

const panelMaterial = getSurfaceClass('auto', 'overlay');

export function UiContextMenu({
  entries,
  open,
  ariaLabel,
  point,
  focusReturn,
  autoFocus = true,
  onOpenChange,
  onSelect,
  className,
  ...props
}: UiContextMenuProps) {
  const {
    panelRef,
    submenuRef,
    portalHost,
    panelId,
    submenuId,
    openSubmenu,
    submenuContent,
    enterSubmenu,
    onItemPointerMove,
    onPanelToggle,
    selectItem,
    onMenuKeyDown,
  } = useContextMenu({
    entries,
    open,
    point,
    focusReturn,
    autoFocus,
    onOpenChange,
    onSelect,
  });
  const materialSource = useRef<HTMLSpanElement>(null);
  const materialHost = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const source = focusReturn ?? materialSource.current;
    if (portalHost && source && materialHost.current) {
      return bridgePortalMaterialScope(source, materialHost.current);
    }
  }, [focusReturn, portalHost]);

  const panel = (
    <div
      {...props}
      ref={panelRef}
      id={panelId}
      className={mergeClassNames(
        `ui-overlay-panel ui-context-menu ${panelMaterial} nv-presence`,
        className,
      )}
      popover="manual"
      data-surface="auto"
      role="menu"
      aria-label={ariaLabel}
      data-neoverse-motion="pop"
      data-neoverse-motion-origin="top"
      onToggle={onPanelToggle}
      onKeyDown={onMenuKeyDown}
    >
      <div className="ui-context-menu__level" role="none">
        {entries.map((entry, index) => {
          const key = 'id' in entry && entry.id ? entry.id : index;
          if ('type' in entry && entry.type === 'separator') {
            return <hr key={key} className="ui-context-menu__separator" />;
          }
          if ('type' in entry && entry.type === 'heading') {
            return (
              <p key={key} className="ui-context-menu__heading">
                {entry.label}
              </p>
            );
          }
          if (!isContextMenuItem(entry)) return null;
          return (
            <button
              key={key}
              className="ui-context-menu__item"
              type="button"
              tabIndex={-1}
              role={contextMenuItemRole(entry)}
              disabled={entry.disabled}
              data-tone={entry.tone ?? 'default'}
              data-entry-id={entry.id}
              data-open={openSubmenu?.id === entry.id ? 'true' : undefined}
              aria-haspopup={entry.children?.length ? 'menu' : undefined}
              aria-expanded={
                entry.children?.length
                  ? openSubmenu?.id === entry.id
                    ? 'true'
                    : 'false'
                  : undefined
              }
              aria-controls={entry.children?.length ? submenuId : undefined}
              {...checkableState(entry)}
              onPointerMove={(event) => {
                // A moving column can change hit targets under a stationary pointer.
                if (event.pointerType !== 'touch') onItemPointerMove(entry, event.currentTarget);
              }}
              onClick={(event) =>
                entry.children?.length
                  ? enterSubmenu(
                      entry,
                      event.currentTarget,
                      isKeyboardModality(event.currentTarget.ownerDocument),
                    )
                  : selectItem(entry)
              }
            >
              {entry.selection === undefined ? null : (
                <span className="ui-context-menu__check" aria-hidden="true">
                  {entry.checked ? '✓' : ''}
                </span>
              )}
              <span className="ui-context-menu__label">{entry.label}</span>
              {entry.shortcut ? (
                <span className="ui-context-menu__shortcut">{entry.shortcut}</span>
              ) : entry.children?.length ? (
                <span className="ui-context-menu__chevron" aria-hidden="true">
                  ›
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  const submenu =
    submenuContent === undefined || portalHost === null
      ? null
      : createPortal(
          <div
            id={submenuId}
            ref={submenuRef}
            className={`ui-overlay-panel ui-context-menu__submenu ${panelMaterial} nv-presence`}
            data-surface="auto"
            popover="manual"
            role="menu"
            aria-label={typeof submenuContent.label === 'string' ? submenuContent.label : undefined}
            inert={openSubmenu === null}
            data-neoverse-motion="slide-end"
            data-neoverse-motion-origin="start"
            onKeyDown={onMenuKeyDown}
          >
            {(submenuContent.children ?? []).map((child) => (
              <button
                key={child.id}
                className="ui-context-menu__item"
                type="button"
                tabIndex={-1}
                role={contextMenuItemRole(child)}
                disabled={child.disabled}
                data-entry-id={child.id}
                {...checkableState(child)}
                onClick={() => selectItem(child)}
              >
                {child.selection === undefined ? null : (
                  <span className="ui-context-menu__check" aria-hidden="true">
                    {child.checked ? '✓' : ''}
                  </span>
                )}
                <span className="ui-context-menu__label">{child.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        );

  return (
    <>
      <span hidden ref={materialSource} />
      {portalHost === null
        ? panel
        : createPortal(
            <div ref={materialHost} className="ui-overlay-portal">
              {panel}
            </div>,
            portalHost,
          )}
      {submenu}
    </>
  );
}
