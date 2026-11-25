import { UiContextMenu } from '@neoverse-ui/react';
import { useState } from 'react';
import type { FixtureCopy } from './fixture-copy';

export function ContextMenuFixture({
  copy,
  onSelectItem,
}: {
  copy: FixtureCopy;
  onSelectItem: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [autoFocus, setAutoFocus] = useState(false);
  const [contextTheme, setContextTheme] = useState('system');
  const [showDetails, setShowDetails] = useState(true);

  return (
    <div data-react-adapter="UiContextMenu">
      <section
        data-context-menu-zone
        aria-label={copy.contextMenu}
        className="rounded-control border border-subtle p-4 text-caption text-secondary"
        onContextMenu={(event) => {
          event.preventDefault();
          setPoint({ x: event.clientX, y: event.clientY });
          setAutoFocus(false);
          setOpen(true);
        }}
      >
        <p className="m-0">{copy.contextMenu}</p>
        <p className="m-0 mt-2">
          {copy.contextMenuTheme}: {contextTheme} · {copy.contextMenuDetails}:{' '}
          {showDetails ? 'on' : 'off'}
        </p>
        <button
          className="mt-2 rounded-control border border-default px-2 py-1 text-caption"
          type="button"
          data-context-menu-keyboard
          onClick={() => {
            const zone = document.querySelector<HTMLElement>('[data-context-menu-zone]');
            const rect = zone?.getBoundingClientRect();
            setPoint({ x: (rect?.left ?? 0) + 24, y: (rect?.top ?? 0) + 24 });
            setAutoFocus(true);
            setOpen(true);
          }}
        >
          {copy.contextMenuKeyboard}
        </button>
      </section>

      <UiContextMenu
        open={open}
        ariaLabel={copy.contextMenu}
        point={point}
        autoFocus={autoFocus}
        entries={[
          { type: 'heading', id: 'edit', label: copy.contextMenuEdit },
          { id: 'copy', label: copy.contextMenuCopy, shortcut: 'Ctrl+C' },
          {
            id: 'details',
            label: copy.contextMenuDetails,
            selection: 'multiple',
            checked: showDetails,
          },
          { type: 'separator', id: 'sep' },
          { id: 'archive', label: copy.contextMenuArchive },
          {
            id: 'theme',
            label: copy.contextMenuTheme,
            children: ['light', 'dark', 'system'].map((value) => ({
              id: `theme:${value}`,
              label: value,
              group: 'theme',
              selection: 'single' as const,
              checked: contextTheme === value,
            })),
          },
          {
            id: 'locale',
            label: copy.contextMenuLanguage,
            children: [
              { id: 'locale:en', label: 'English' },
              { id: 'locale:zh', label: '中文' },
            ],
          },
          { type: 'separator', id: 'sep-danger' },
          { id: 'disabled', label: 'Disabled action', disabled: true },
          { id: 'remove', label: copy.contextMenuRemove, tone: 'danger' },
        ]}
        onOpenChange={setOpen}
        onSelect={(item) => {
          if (item.id === 'details') setShowDetails((value) => !value);
          else if (item.id.startsWith('theme:')) setContextTheme(item.id.slice(6));
          else onSelectItem(item.id);
        }}
      />
    </div>
  );
}
