import {
  type DialogRole,
  type DialogSize,
  UiButton,
  UiDialog,
  UiDropdownMenu,
  UiField,
  UiInput,
  UiPopover,
  UiSwitch,
} from '@neoverse-ui/vue';
import { defineComponent, h, ref } from 'vue';
import { type Locale, localize, localized } from '../../content/playground-content';

const copy = {
  quickSettingsTrigger: localized('Top inspector (top-start)', '顶部检查弹层 (top-start)'),
  quickSettingsTitle: localized('Surface tuning', '表面调节'),
  edgePassLabel: localized('Sync frosted highlight', '同步磨砂边缘高光'),
  apply: localized('Apply', '应用'),
  cancel: localized('Cancel', '取消'),
  confirm: localized('Continue', '继续'),
  commandWidthTrigger: localized('Matched width (bottom-end)', '等宽对齐弹层 (bottom-end)'),
  commandWidthBody: localized(
    'Matches the trigger width while sharing the exact overlay surface and glass rim.',
    '面板宽度自动匹配触发器，同时复用相同的玻璃边缘与菜单规范。',
  ),
  sidePopoverTrigger: localized('Right inspector (right-start)', '右侧检查弹层 (right-start)'),
  sidePopoverBody: localized(
    'Horizontal placements clamp cleanly against the viewport edge.',
    '横向弹层同样自动约束在视口安全边距内。',
  ),
  richMenuTrigger: localized('Command menu', '命令菜单'),
  showGrid: localized('Show layout grid', '显示网格参考'),
  autoSave: localized('Auto sync tokens', '自动同步令牌'),
  duplicate: localized('Duplicate view', '创建视图副本'),
  remove: localized('Remove', '移除'),
  selected: localized('Selected action', '已选择操作'),
  openDialog: localized('Open dialog', '打开对话框'),
  dialogTitle: localized('Confirm changes', '确认修改'),
  dialogBody: localized('Review this action before continuing.', '继续前请确认本次操作。'),
  openFormDialog: localized('Form modal (md)', '表单弹窗 (md)'),
  formDialogTitle: localized('Rename workspace', '重命名工作区'),
  formDialogDesc: localized(
    'Enter a display label for this workspace.',
    '输入该工作区的展示名称。',
  ),
  workspaceName: localized('Workspace name', '工作区名称'),
  openAlertDialog: localized('Destructive alert (sm)', '危险确认弹窗 (sm)'),
  alertDialogTitle: localized('Delete release snapshot?', '删除发布快照？'),
  alertDialogDesc: localized(
    'Backdrop clicks stay locked for high-impact confirmation; use an explicit button or Escape.',
    '高风险确认关闭了遮罩点击退场，需明确点击操作或按 Escape 取消。',
  ),
  deleteAction: localized('Delete snapshot', '确认删除'),
  openScrollDialog: localized('Long notes modal (lg)', '长文本弹窗 (lg)'),
  scrollDialogTitle: localized('Release checklist', '发布清单详情'),
  scrollDialogDesc: localized(
    'Header and action footer stay pinned while body scrolls.',
    '内容区可独立滚动，标题与操作栏保持固定。',
  ),
};

export const OverlayScenarios = defineComponent(
  (props: { locale: Locale }) => {
    const syncHighlight = ref(true);
    const showGrid = ref(true);
    const autoSync = ref(false);
    const filterOpen = ref(false);
    const lastRichAction = ref('—');
    return () => {
      const locale = props.locale;
      return h(
        'div',
        { class: 'flex flex-wrap items-center gap-3', 'data-overlay-scenarios': '' },
        [
          h(
            UiPopover,
            {
              open: filterOpen.value,
              placement: 'top-start',
              triggerSize: 'sm',
              ariaLabel: localize(copy.quickSettingsTitle, locale),
              'data-overlay-popover-top': '',
              'onUpdate:open': (value: boolean) => {
                filterOpen.value = value;
              },
            },
            {
              trigger: () => localize(copy.quickSettingsTrigger, locale),
              default: () =>
                h('div', { class: 'grid gap-3 min-w-60 p-2' }, [
                  h(
                    'p',
                    { class: 'm-0 text-body-sm font-medium text-primary' },
                    localize(copy.quickSettingsTitle, locale),
                  ),
                  h(UiSwitch, {
                    modelValue: syncHighlight.value,
                    label: localize(copy.edgePassLabel, locale),
                    'onUpdate:modelValue': (value: boolean) => {
                      syncHighlight.value = value;
                    },
                  }),
                  h('div', { class: 'flex justify-end gap-2' }, [
                    h(
                      UiButton,
                      {
                        size: 'sm',
                        variant: 'ghost',
                        onClick: () => {
                          filterOpen.value = false;
                        },
                      },
                      () => localize(copy.cancel, locale),
                    ),
                    h(
                      UiButton,
                      {
                        size: 'sm',
                        variant: 'primary',
                        onClick: () => {
                          filterOpen.value = false;
                        },
                      },
                      () => localize(copy.apply, locale),
                    ),
                  ]),
                ]),
            },
          ),
          h(
            UiPopover,
            {
              placement: 'bottom-end',
              matchTriggerWidth: true,
              triggerVariant: 'ghost',
              triggerSize: 'sm',
              ariaLabel: localize(copy.commandWidthTrigger, locale),
              'data-overlay-popover-matched': '',
            },
            {
              trigger: () => localize(copy.commandWidthTrigger, locale),
              default: () =>
                h(
                  'p',
                  { class: 'm-0 p-2 text-secondary' },
                  localize(copy.commandWidthBody, locale),
                ),
            },
          ),
          h(
            UiPopover,
            {
              placement: 'right-start',
              triggerSize: 'sm',
              ariaLabel: localize(copy.sidePopoverTrigger, locale),
              'data-overlay-popover-side': '',
            },
            {
              trigger: () => localize(copy.sidePopoverTrigger, locale),
              default: () =>
                h(
                  'p',
                  { class: 'max-w-container-xs m-0 p-2 text-secondary' },
                  localize(copy.sidePopoverBody, locale),
                ),
            },
          ),
          h(
            UiDropdownMenu,
            {
              ariaLabel: localize(copy.richMenuTrigger, locale),
              placement: 'bottom-end',
              triggerVariant: 'ghost',
              triggerSize: 'sm',
              'data-overlay-rich-dropdown': '',
              items: [
                {
                  id: 'grid',
                  label: localize(copy.showGrid, locale),
                  checked: showGrid.value,
                  shortcut: '⌘G',
                },
                {
                  id: 'sync',
                  label: localize(copy.autoSave, locale),
                  checked: autoSync.value,
                  shortcut: '⌘S',
                },
                { id: 'dup', label: localize(copy.duplicate, locale), shortcut: '⌘D' },
                { id: 'remove', label: localize(copy.remove, locale), tone: 'danger' },
              ],
              onSelect: (item: { id: string }) => {
                if (item.id === 'grid') showGrid.value = !showGrid.value;
                else if (item.id === 'sync') autoSync.value = !autoSync.value;
                lastRichAction.value = item.id;
              },
            },
            { trigger: () => localize(copy.richMenuTrigger, locale) },
          ),
          h(
            'output',
            { class: 'text-caption text-secondary', 'aria-live': 'polite' },
            `${localize(copy.selected, locale)}: ${lastRichAction.value}`,
          ),
        ],
      );
    };
  },
  { props: ['locale'] },
);

/** A single modal host cycling across confirm, form, alert and scrollable scenarios */
export const DialogPreview = defineComponent(
  (props: { locale: Locale }) => {
    const open = ref(false);
    const motionSource = ref<HTMLElement | null>(null);
    const mode = ref<'confirm' | 'form' | 'destructive' | 'scrollable'>('confirm');
    const workspaceName = ref('Aurora Glass');
    const close = () => {
      open.value = false;
    };
    const launch = (next: typeof mode.value, event: MouseEvent) => {
      motionSource.value = event.currentTarget as HTMLElement;
      mode.value = next;
      open.value = true;
    };
    return () => {
      const locale = props.locale;
      const isAlert = mode.value === 'destructive';
      const isForm = mode.value === 'form';
      const isScrollable = mode.value === 'scrollable';
      const size: DialogSize = isAlert ? 'sm' : isScrollable ? 'lg' : 'md';
      const role: DialogRole = isAlert ? 'alertdialog' : 'dialog';
      const title = isForm
        ? localize(copy.formDialogTitle, locale)
        : isAlert
          ? localize(copy.alertDialogTitle, locale)
          : isScrollable
            ? localize(copy.scrollDialogTitle, locale)
            : localize(copy.dialogTitle, locale);
      const description = isForm
        ? localize(copy.formDialogDesc, locale)
        : isAlert
          ? localize(copy.alertDialogDesc, locale)
          : isScrollable
            ? localize(copy.scrollDialogDesc, locale)
            : undefined;
      return [
        h('div', { class: 'flex flex-wrap items-center gap-2' }, [
          h(
            UiButton,
            { 'data-dialog-open': '', onClick: (event: MouseEvent) => launch('confirm', event) },
            () => localize(copy.openDialog, locale),
          ),
          h(
            UiButton,
            {
              variant: 'secondary',
              size: 'sm',
              'data-dialog-open-form': '',
              onClick: (event: MouseEvent) => launch('form', event),
            },
            () => localize(copy.openFormDialog, locale),
          ),
          h(
            UiButton,
            {
              variant: 'secondary',
              size: 'sm',
              'data-dialog-open-destructive': '',
              onClick: (event: MouseEvent) => launch('destructive', event),
            },
            () => localize(copy.openAlertDialog, locale),
          ),
          h(
            UiButton,
            {
              variant: 'ghost',
              size: 'sm',
              'data-dialog-open-scrollable': '',
              onClick: (event: MouseEvent) => launch('scrollable', event),
            },
            () => localize(copy.openScrollDialog, locale),
          ),
        ]),
        h(
          UiDialog,
          {
            open: open.value,
            motionSource: motionSource.value,
            title,
            ...(description ? { description } : {}),
            size,
            role,
            closeOnBackdrop: isForm || isScrollable,
            'onUpdate:open': (value: boolean) => {
              open.value = value;
            },
          },
          {
            default: () => {
              if (isForm) {
                return h(UiField, { label: localize(copy.workspaceName, locale) }, () =>
                  h(UiInput, {
                    modelValue: workspaceName.value,
                    'onUpdate:modelValue': (value: string) => {
                      workspaceName.value = value;
                    },
                  }),
                );
              }
              if (isScrollable) {
                return h(
                  'div',
                  { class: 'grid gap-3' },
                  Array.from({ length: 12 }, (_, index) =>
                    h(
                      'p',
                      { key: index, class: 'm-0 text-secondary' },
                      `${index + 1}. ${localize(copy.dialogBody, locale)} — ${workspaceName.value}`,
                    ),
                  ),
                );
              }
              return h('p', { class: 'm-0' }, localize(copy.dialogBody, locale));
            },
            footer: () => [
              h(UiButton, { variant: 'ghost', onClick: close }, () =>
                localize(copy.cancel, locale),
              ),
              h(
                UiButton,
                {
                  variant: isAlert ? 'danger' : 'primary',
                  'data-dialog-confirm': '',
                  onClick: close,
                },
                () =>
                  isAlert ? localize(copy.deleteAction, locale) : localize(copy.confirm, locale),
              ),
            ],
          },
        ),
      ];
    };
  },
  { props: ['locale'] },
);
