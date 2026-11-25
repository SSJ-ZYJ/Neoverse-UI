import {
  type DialogRole,
  type DialogSize,
  UiAction,
  UiAvatar,
  UiButton,
  UiCard,
  UiDialog,
  UiDrawer,
  UiDropdownMenu,
  UiEmptyState,
  UiField,
  UiIconButton,
  UiInput,
  UiNotice,
  UiPagination,
  UiPopover,
  UiSurface,
  UiTabs,
  UiToast,
  type UiToastProps,
} from '@neoverse-ui/react';
import { useState } from 'react';
import { ContextMenuFixture } from './ContextMenuFixture';
import type { FixtureCopy } from './fixture-copy';

export default function SurfaceAndOverlaySection({
  copy,
  contractMode,
  dropdownDisabled,
  count,
  onIncrement,
}: {
  copy: FixtureCopy;
  contractMode: boolean;
  dropdownDisabled: boolean;
  count: number;
  onIncrement: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'confirm' | 'form' | 'destructive' | 'scrollable'>(
    'confirm',
  );
  const [motionSource, setMotionSource] = useState<HTMLElement | null>(null);
  const launchDialog = (mode: typeof dialogMode, source: HTMLElement) => {
    setDialogMode(mode);
    setMotionSource(source);
    setDialogOpen(true);
  };
  const [workspaceName, setWorkspaceName] = useState('Aurora Glass');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(4);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastPresentation, setToastPresentation] =
    useState<NonNullable<UiToastProps['presentation']>>('compact');
  const [toastDetails, setToastDetails] = useState(false);
  const [menuSelection, setMenuSelection] = useState('');
  const avatarName = 'Shenshijun';
  const avatarFallback = 'SSJ';

  return (
    <UiSurface
      surface="glass-subtle"
      className="grid gap-4 rounded-card p-4"
      data-react-adapter="UiSurface"
    >
      <h2 className="text-subtitle font-heading tracking-heading text-primary">{copy.actions}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <UiAction
          href="#react-runtime-fixture"
          onClick={(event) => event.preventDefault()}
          variant="secondary"
          data-react-adapter="UiAction"
        >
          {copy.action}
        </UiAction>
        <UiButton variant="primary" onClick={onIncrement} data-react-adapter="UiButton">
          {copy.button} · {copy.count} {count}
        </UiButton>
        {(['success', 'warning', 'accent'] as const).map((variant) => (
          <UiButton
            key={variant}
            variant={variant}
            onClick={onIncrement}
            data-button-palette={variant}
          >
            {variant}
          </UiButton>
        ))}
        <UiIconButton
          label={copy.icon}
          variant="ghost"
          onClick={onIncrement}
          data-react-adapter="UiIconButton"
        >
          +
        </UiIconButton>

        <div data-react-adapter="UiPopover">
          <UiPopover trigger={copy.popover} ariaLabel={copy.popover}>
            <p className="max-w-container-xs p-2 text-body-sm text-secondary">{copy.popoverBody}</p>
          </UiPopover>
        </div>

        <ContextMenuFixture copy={copy} onSelectItem={setMenuSelection} />

        <div data-react-adapter="UiDropdownMenu">
          <UiDropdownMenu
            trigger={copy.menu}
            ariaLabel={copy.menu}
            disabled={dropdownDisabled}
            items={[
              { id: 'open', label: copy.menuOpen },
              { id: 'archive', label: copy.menuArchive },
              ...(contractMode
                ? [{ id: 'disabled', label: 'Disabled action', disabled: true }]
                : []),
              { id: 'remove', label: copy.menuRemove, tone: 'danger' },
            ]}
            onSelect={(item) => setMenuSelection(item.id)}
          />
        </div>
      </div>

      <output className="text-caption text-secondary" aria-live="polite" data-react-overlay-state>
        {menuSelection}
      </output>

      <div className="flex flex-wrap items-center gap-2" data-overlay-scenarios>
        <UiPopover
          placement="top-start"
          triggerSize="sm"
          trigger="Top inspector"
          ariaLabel="Top inspector"
          data-overlay-popover-top
        >
          <p className="m-0 max-w-container-xs p-2 text-secondary">{copy.popoverBody}</p>
        </UiPopover>
        <UiDropdownMenu
          trigger="Rich menu"
          ariaLabel="Rich menu"
          placement="bottom-end"
          triggerVariant="ghost"
          triggerSize="sm"
          data-overlay-rich-dropdown
          items={[
            { id: 'grid', label: 'Show layout grid', checked: showGrid, shortcut: '⌘G' },
            { id: 'dup', label: 'Duplicate view', shortcut: '⌘D' },
            { id: 'remove', label: copy.menuRemove, tone: 'danger' },
          ]}
          onSelect={(item) => {
            if (item.id === 'grid') setShowGrid((value) => !value);
            setMenuSelection(item.id);
          }}
        />
      </div>

      <UiNotice
        as="article"
        variant="info"
        data-react-adapter="UiNotice"
        action={
          <UiButton size="sm" variant="ghost" surface="none">
            {copy.noticeAction}
          </UiButton>
        }
      >
        {copy.notice}
      </UiNotice>

      <div data-react-adapter="UiDialog">
        <div className="flex flex-wrap items-center gap-2">
          <UiButton
            data-dialog-open
            onClick={(event) => launchDialog('confirm', event.currentTarget)}
          >
            Open dialog
          </UiButton>
          <UiButton
            variant="secondary"
            size="sm"
            data-dialog-open-form
            onClick={(event) => launchDialog('form', event.currentTarget)}
          >
            Form modal (md)
          </UiButton>
          <UiButton
            variant="secondary"
            size="sm"
            data-dialog-open-destructive
            onClick={(event) => launchDialog('destructive', event.currentTarget)}
          >
            Destructive alert (sm)
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            data-dialog-open-scrollable
            onClick={(event) => launchDialog('scrollable', event.currentTarget)}
          >
            Long notes modal (lg)
          </UiButton>
        </div>
        <UiDialog
          open={dialogOpen}
          motionSource={motionSource}
          title={
            dialogMode === 'form'
              ? 'Rename workspace'
              : dialogMode === 'destructive'
                ? 'Delete release snapshot?'
                : dialogMode === 'scrollable'
                  ? 'Release checklist'
                  : 'Confirm changes'
          }
          {...(dialogMode === 'destructive'
            ? { description: 'Backdrop clicks stay locked for high-impact confirmation.' }
            : dialogMode === 'scrollable'
              ? { description: 'Header and action footer stay pinned while body scrolls.' }
              : {})}
          size={
            (dialogMode === 'destructive'
              ? 'sm'
              : dialogMode === 'scrollable'
                ? 'lg'
                : 'md') as DialogSize
          }
          role={(dialogMode === 'destructive' ? 'alertdialog' : 'dialog') as DialogRole}
          closeOnBackdrop={dialogMode === 'form' || dialogMode === 'scrollable'}
          onOpenChange={setDialogOpen}
          footer={
            <div className="flex gap-2">
              <UiButton variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </UiButton>
              <UiButton
                variant={dialogMode === 'destructive' ? 'danger' : 'primary'}
                data-dialog-confirm
                onClick={() => setDialogOpen(false)}
              >
                {dialogMode === 'destructive' ? 'Delete' : 'Continue'}
              </UiButton>
            </div>
          }
        >
          {dialogMode === 'form' ? (
            <UiField label="Workspace name">
              <UiInput
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
              />
            </UiField>
          ) : dialogMode === 'scrollable' ? (
            <div className="grid gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((row) => (
                <p key={row} className="m-0 text-secondary">
                  {row}. Review this action before continuing. — {workspaceName}
                </p>
              ))}
            </div>
          ) : (
            'Review this action before continuing.'
          )}
        </UiDialog>
      </div>
      <div data-react-adapter="UiDrawer">
        <UiButton
          aria-controls="react-overlay-example-drawer"
          aria-expanded={drawerOpen}
          data-drawer-open
          onClick={() => setDrawerOpen(true)}
        >
          Open drawer
        </UiButton>
        <UiDrawer
          id="react-overlay-example-drawer"
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          side="right"
          aria-label="Tools drawer"
          className="gap-3 p-4"
          data-drawer-panel
        >
          <h3 className="text-subtitle font-heading">Tools drawer</h3>
          <UiButton data-drawer-close onClick={() => setDrawerOpen(false)}>
            Close drawer
          </UiButton>
        </UiDrawer>
      </div>
      <div data-react-adapter="UiToast">
        <div className="flex flex-wrap gap-2">
          {(['compact', 'action', 'notification'] as const).map((presentation) => (
            <UiButton
              key={presentation}
              data-toast-open={presentation}
              onClick={() => {
                setToastDetails(false);
                setToastPresentation(presentation);
                setToastOpen(true);
              }}
            >
              {presentation}
            </UiButton>
          ))}
        </div>
        {toastDetails && (
          <p data-toast-details role="status">
            The saved changes are available in this preview.
          </p>
        )}
        <UiToast
          open={toastOpen}
          presentation={toastPresentation}
          message={
            toastPresentation === 'notification'
              ? 'Your changes are saved. Review the preview before sharing it with your team.'
              : 'Changes saved.'
          }
          dismissLabel="Dismiss notification"
          variant="success"
          onOpenChange={setToastOpen}
          action={
            toastPresentation === 'action' ? (
              <UiButton
                size="sm"
                variant="ghost"
                data-toast-action
                onClick={() => {
                  setToastDetails(true);
                  setToastOpen(false);
                }}
              >
                View details
              </UiButton>
            ) : undefined
          }
        />
      </div>
      <UiTabs
        data-react-adapter="UiTabs"
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'blocked', label: 'Blocked', disabled: true },
          { value: 'activity', label: 'Activity' },
        ]}
        ariaLabel="Member sections"
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        {(value) => <span data-tabs-panel-state>{value}</span>}
      </UiTabs>
      <div className="flex flex-wrap items-center gap-3">
        <UiAvatar name={avatarName} fallback={avatarFallback} size="sm" />
        <UiAvatar
          data-react-adapter="UiAvatar"
          name={avatarName}
          fallback={avatarFallback}
          size="md"
        />
        <UiAvatar name={avatarName} fallback={avatarFallback} size="lg" />
        <UiAvatar name={avatarName} fallback={avatarFallback} size="sm" shape="circle" />
        <UiAvatar
          name={avatarName}
          fallback={avatarFallback}
          size="md"
          shape="circle"
          data-avatar-sample
        />
        <UiAvatar name={avatarName} fallback={avatarFallback} size="lg" shape="circle" />
        <UiAvatar name="Anonymous" placeholder="icon" size="md" shape="circle" data-avatar-icon />
        <UiAvatar name="Anonymous" placeholder="icon" size="lg" data-avatar-icon />
      </div>
      <UiPagination
        data-react-adapter="UiPagination"
        page={currentPage}
        totalPages={18}
        ariaLabel="Member list pages"
        previousLabel="Previous page"
        nextLabel="Next page"
        pageLabel="Page"
        onPageChange={setCurrentPage}
      />
      <UiEmptyState
        data-react-adapter="UiEmptyState"
        data-empty-state-sample="onboarding"
        title="No projects yet"
        description="Create a project to get started."
        icon={<span aria-hidden="true">□</span>}
        action={<UiButton size="sm">Create project</UiButton>}
      />
      <UiEmptyState title="No matching files" variant="outlined" data-empty-state-sample="search" />
      <UiEmptyState
        title="No recent activity"
        variant="compact"
        data-empty-state-sample="activity"
      />
      <UiEmptyState
        title="Shared files are restricted"
        variant="subtle"
        data-empty-state-sample="access"
      />
      <UiCard as="article" surface="elevated" className="grid gap-2" data-react-adapter="UiCard">
        <h3 className="text-subtitle font-heading tracking-heading text-primary">{copy.card}</h3>
        <p className="text-body text-secondary" data-react-count>
          {copy.surface} · {copy.count} {count}
        </p>
      </UiCard>
    </UiSurface>
  );
}
