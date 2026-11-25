import { UiButton, UiDialog, UiDropdownMenu, UiPopover } from '@neoverse-ui/vue';
import { defineComponent, h, ref } from 'vue';
import { lazyComponent, withPreload } from '../lazy-component';
import { type Locale, localize, localized } from '../playground-content';

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
  openDialog: localized('Open dialog', '打开对话框'),
  dialogTitle: localized('Confirm changes', '确认修改'),
  dialogBody: localized('Review this action before continuing.', '继续前请确认本次操作。'),
  cancel: localized('Cancel', '取消'),
  confirm: localized('Continue', '继续'),
};

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

/** A modal trigger and its dialog share the owning preview's lifetime */
export const DialogPreview = defineComponent(
  (props: { locale: Locale }) => {
    const open = ref(false);
    const close = () => {
      open.value = false;
    };
    return () => {
      const locale = props.locale;
      return [
        h(
          UiButton,
          {
            'data-dialog-open': '',
            onClick: () => {
              open.value = true;
            },
          },
          () => localize(copy.openDialog, locale),
        ),
        h(
          UiDialog,
          {
            open: open.value,
            title: localize(copy.dialogTitle, locale),
            'onUpdate:open': (value: boolean) => {
              open.value = value;
            },
          },
          {
            default: () => h('p', localize(copy.dialogBody, locale)),
            footer: () => [
              h(UiButton, { variant: 'ghost', onClick: close }, () =>
                localize(copy.cancel, locale),
              ),
              h(UiButton, { onClick: close }, () => localize(copy.confirm, locale)),
            ],
          },
        ),
      ];
    };
  },
  { props: ['locale'] },
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
