import { UiButton, UiDrawer, UiDropdownMenu, UiPopover } from '@neoverse-ui/vue';
import { defineComponent, h, ref } from 'vue';
import { lazyComponent, withPreload } from '../../app/lazy-component';
import { type Locale, localize, localized } from '../../content/playground-content';
import { DialogPreview, OverlayScenarios } from './OverlayScenarios';

const ContextMenuPreview = lazyComponent(() => import('./ContextMenuPreview.vue'));

const copy = {
  popoverTrigger: localized('Open popover', '打开弹层'),
  popoverLabel: localized('Popover example', '弹层示例'),
  popoverBody: localized(
    'Top-layer positioning, light dismiss, viewport clamping, and Motion are shared by one overlay runtime.',
    '顶层定位、轻量关闭、视口约束与 Motion 均复用同一套 Overlay Runtime。',
  ),
  menuTrigger: localized('Open menu', '打开菜单'),
  menuLabel: localized('Project actions', '项目操作'),
  open: localized('Open', '打开'),
  archive: localized('Archive', '归档'),
  remove: localized('Remove', '移除'),
  selected: localized('Selected action', '已选择操作'),
};

export { DialogPreview, OverlayScenarios };

/** The standard Popover instance shared with the full overlay fixture */
export const PopoverPreview = ({ locale }: { locale: Locale }) =>
  h(
    UiPopover,
    { ariaLabel: localize(copy.popoverLabel, locale), 'data-overlay-popover': '' },
    {
      trigger: () => localize(copy.popoverTrigger, locale),
      default: () =>
        h(
          'p',
          { class: 'max-w-container-xs p-2 text-body-sm text-secondary' },
          localize(copy.popoverBody, locale),
        ),
    },
  );

/** The menu instance; the QA host supplies the contract-only options and controls */
export const DropdownPreview = defineComponent(
  (props: { locale: Locale; id?: string; contractMode?: boolean; disabled?: boolean }) => {
    const selection = ref('');
    return () => [
      h(
        UiDropdownMenu,
        {
          id: props.id,
          ariaLabel: localize(copy.menuLabel, props.locale),
          items: [
            { id: 'open', label: localize(copy.open, props.locale) },
            { id: 'archive', label: localize(copy.archive, props.locale) },
            ...(props.contractMode
              ? [{ id: 'disabled', label: 'Disabled action', disabled: true }]
              : []),
            { id: 'remove', label: localize(copy.remove, props.locale), tone: 'danger' },
          ],
          disabled: props.disabled ?? false,
          'data-overlay-dropdown': '',
          onSelect: (item: { id: string }) => {
            selection.value = item.id;
          },
        },
        { trigger: () => localize(copy.menuTrigger, props.locale) },
      ),
      h(
        'output',
        {
          class: 'w-full text-caption text-secondary',
          'aria-live': 'polite',
          'data-overlay-selection': '',
        },
        `${localize(copy.selected, props.locale)}: ${selection.value || '—'}`,
      ),
    ];
  },
  { props: ['locale', 'id', 'contractMode', 'disabled'] },
);

/** Mount only the standard Popover */
export const popover = (locale: Locale) => h(PopoverPreview, { locale });
/** Mount only the standard DropdownMenu */
export const dropdownMenu = (locale: Locale) =>
  h('div', { class: 'grid justify-items-start gap-3' }, [h(DropdownPreview, { locale })]);
/** Mount the ContextMenu and its activation zone without the diagnostic backdrop */
export const contextMenu = withPreload(
  (locale: Locale) => h(ContextMenuPreview, { locale }),
  ContextMenuPreview,
);
/** Mount the modal dialog example */
export const dialog = (locale: Locale) => h(DialogPreview, { locale });

export const DrawerPreview = defineComponent(
  (props: { locale: Locale }) => {
    const open = ref(false);
    return () => {
      const label = localize(localized('Tools drawer', '工具抽屉'), props.locale);
      const close = () => {
        open.value = false;
      };
      return [
        h(
          UiButton,
          {
            'aria-controls': 'overlay-example-drawer',
            'aria-expanded': open.value,
            'data-drawer-open': '',
            onClick: () => {
              open.value = true;
            },
          },
          () => localize(localized('Open drawer', '打开抽屉'), props.locale),
        ),
        h(
          UiDrawer,
          {
            id: 'overlay-example-drawer',
            open: open.value,
            'onUpdate:open': (value: boolean) => {
              open.value = value;
            },
            'aria-label': label,
            class: 'gap-3 p-4',
            'data-drawer-panel': '',
          },
          () => [
            h('h3', { class: 'text-subtitle font-heading' }, label),
            h(UiButton, { 'data-drawer-close': '', onClick: close }, () =>
              localize(localized('Close drawer', '关闭抽屉'), props.locale),
            ),
          ],
        ),
      ];
    };
  },
  { props: ['locale'] },
);

export const drawer = (locale: Locale) => h(DrawerPreview, { locale });
