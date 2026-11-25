import {
  UiAction,
  UiAvatar,
  UiButton,
  UiCard,
  UiDialog,
  UiDropdownMenu,
  UiEmptyState,
  UiIconButton,
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

      <UiNotice
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
        <UiButton data-dialog-open onClick={() => setDialogOpen(true)}>
          Open dialog
        </UiButton>
        <UiDialog
          open={dialogOpen}
          title="Confirm changes"
          onOpenChange={setDialogOpen}
          footer={<UiButton onClick={() => setDialogOpen(false)}>Continue</UiButton>}
        >
          Review this action before continuing.
        </UiDialog>
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
              <button
                type="button"
                data-toast-action
                onClick={() => {
                  setToastDetails(true);
                  setToastOpen(false);
                }}
              >
                View details
              </button>
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
        title="No projects yet"
        description="Create a project to get started."
        icon={<span aria-hidden="true">□</span>}
        action={<UiButton size="sm">Create project</UiButton>}
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
