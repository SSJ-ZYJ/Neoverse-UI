import { actionCssVariables } from './actions/action.js';
import { buttonCssVariables } from './actions/button.js';
import { avatarCssVariables } from './display/avatar.js';
import { disclosureCssVariables } from './display/disclosure.js';
import { emptyStateCssVariables } from './display/empty-state.js';
import { proseCssVariables } from './display/prose.js';
import { tableCssVariables } from './display/table.js';
import { badgeCssVariables } from './feedback/badge.js';
import { noticeCssVariables } from './feedback/notice.js';
import { skeletonCssVariables } from './feedback/skeleton.js';
import { statusIndicatorCssVariables } from './feedback/status-indicator.js';
import { formControlCssVariables } from './forms/form-control.js';
import { breadcrumbCssVariables } from './navigation/breadcrumb.js';
import { dockCssVariables } from './navigation/dock.js';
import { navigationItemCssVariables } from './navigation/navigation-item.js';
import { paginationCssVariables } from './navigation/pagination.js';
import { segmentedControlCssVariables } from './navigation/segmented-control.js';
import { tabsCssVariables } from './navigation/tabs.js';
import { contextMenuCssVariables } from './overlays/context-menu.js';
import { dialogCssVariables } from './overlays/dialog.js';
import { drawerCssVariables } from './overlays/drawer.js';
import { overlayCssVariables } from './overlays/overlay.js';
import { toastCssVariables } from './overlays/toast.js';
import { tooltipCssVariables } from './overlays/tooltip.js';
import { controlSurfaceCssVariables } from './surfaces/control-surface.js';
import { scrollbarCssVariables } from './surfaces/scrollbar.js';
import { terminalCssVariables } from './terminal/terminal.js';

export const componentCssVariables = {
  terminal: terminalCssVariables,
  button: buttonCssVariables,
  action: actionCssVariables,
  navigationItem: navigationItemCssVariables,
  breadcrumb: breadcrumbCssVariables,
  dock: dockCssVariables,
  controlSurface: controlSurfaceCssVariables,
  statusIndicator: statusIndicatorCssVariables,
  segmentedControl: segmentedControlCssVariables,
  badge: badgeCssVariables,
  notice: noticeCssVariables,
  tooltip: tooltipCssVariables,
  overlay: overlayCssVariables,
  tabs: tabsCssVariables,
  avatar: avatarCssVariables,
  pagination: paginationCssVariables,
  emptyState: emptyStateCssVariables,
  dialog: dialogCssVariables,
  drawer: drawerCssVariables,
  toast: toastCssVariables,
  contextMenu: contextMenuCssVariables,
  skeleton: skeletonCssVariables,
  scrollbar: scrollbarCssVariables,
  table: tableCssVariables,
  disclosure: disclosureCssVariables,
  prose: proseCssVariables,
  formControl: formControlCssVariables,
} as const;

export type ComponentToken = keyof typeof componentCssVariables;
