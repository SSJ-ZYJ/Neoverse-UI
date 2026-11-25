import {
  UiCheckbox,
  UiField,
  UiInput,
  UiRadioGroup,
  UiSelect,
  UiSurface,
  UiSwitch,
  UiTextarea,
} from '@neoverse-ui/react';
import { useState } from 'react';
import { createChannelOptions, createRuntimeOptions, type FixtureCopy } from './fixture-copy';

export default function FormContractSection({
  copy,
  contractMode,
}: {
  copy: FixtureCopy;
  contractMode: boolean;
}) {
  const [email, setEmail] = useState('runtime@neoverse.dev');
  const [numberValue, setNumberValue] = useState('1.5');
  const [notes, setNotes] = useState('Shared React runtime fixture');
  const [runtime, setRuntime] = useState<string | number>('native');
  const [selectBlockedState, setSelectBlockedState] = useState<'none' | 'disabled' | 'readonly'>(
    'none',
  );
  const [selectMounted, setSelectMounted] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [channel, setChannel] = useState<string | number>('stable');
  const [autoSync, setAutoSync] = useState(true);
  const runtimeOptions = createRuntimeOptions(copy);
  const channelOptions = createChannelOptions(copy);

  return (
    <UiSurface surface="glass-subtle" className="grid gap-4 rounded-card p-4">
      <h2 className="text-subtitle font-heading tracking-heading text-primary">{copy.forms}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <UiField
          controlId="react-runtime-email"
          label={copy.email}
          description={copy.emailDescription}
          required
          validation="success"
          data-react-adapter="UiField"
        >
          {(controlAttrs) => (
            <UiInput
              {...controlAttrs}
              value={email}
              validation="success"
              onChange={(event) => setEmail(event.currentTarget.value)}
              data-react-adapter="UiInput"
            />
          )}
        </UiField>

        <UiField controlId="react-runtime-notes" label={copy.notes}>
          {(controlAttrs) => (
            <UiTextarea
              {...controlAttrs}
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              data-react-adapter="UiTextarea"
            />
          )}
        </UiField>

        {contractMode && (
          <div data-number-fixtures>
            <UiInput
              type="number"
              name="amount"
              aria-label="Amount"
              min="0"
              max="2"
              step="0.5"
              value={numberValue}
              onChange={(event) => setNumberValue(event.currentTarget.value)}
            />
            <output data-number-value>{numberValue}</output>
            <UiInput type="number" aria-label="Any step" step="any" defaultValue="1.25" />
            <UiInput type="number" aria-label="Disabled number" disabled defaultValue="4" />
            <UiInput type="number" aria-label="Readonly number" readOnly value="5" />
          </div>
        )}

        <UiField label={copy.runtime}>
          {selectMounted ? (
            <UiSelect
              value={runtime}
              options={runtimeOptions}
              name="runtime"
              onValueChange={setRuntime}
              data-react-adapter="UiSelect"
              disabled={selectBlockedState === 'disabled'}
              readOnly={selectBlockedState === 'readonly'}
            />
          ) : null}
          {contractMode ? (
            <div data-select-block-controls>
              <button
                type="button"
                data-select-block-disabled
                onClick={() =>
                  setSelectBlockedState((value) => (value === 'disabled' ? 'none' : 'disabled'))
                }
              >
                Toggle disabled
              </button>
              <button
                type="button"
                data-select-block-readonly
                onClick={() =>
                  setSelectBlockedState((value) => (value === 'readonly' ? 'none' : 'readonly'))
                }
              >
                Toggle readonly
              </button>
              <button type="button" data-select-unmount onClick={() => setSelectMounted(false)}>
                Unmount select
              </button>
            </div>
          ) : null}
        </UiField>

        <UiField label={copy.channel}>
          <UiRadioGroup
            name="release-channel"
            value={channel}
            options={channelOptions}
            onValueChange={setChannel}
            aria-label={copy.channel}
            data-react-adapter="UiRadioGroup"
          />
        </UiField>

        {contractMode ? (
          <div data-unnamed-radio-fixture>
            <UiRadioGroup
              options={[
                { value: 'first', label: 'Unnamed first' },
                { value: 'second', label: 'Unnamed second' },
              ]}
              aria-label="Unnamed radio group"
            />
          </div>
        ) : null}

        <div data-react-adapter="UiCheckbox">
          <UiCheckbox
            checked={notifications}
            onCheckedChange={setNotifications}
            aria-label={copy.notifications}
          >
            {copy.notifications}
          </UiCheckbox>
        </div>

        <div data-react-adapter="UiSwitch">
          <UiSwitch checked={autoSync} onCheckedChange={setAutoSync} aria-label={copy.sync}>
            {copy.sync}
          </UiSwitch>
        </div>
      </div>

      <output className="text-caption text-secondary" data-react-form-state aria-live="polite">
        {email} · {notes} · {String(runtime)} · {String(channel)} · {String(notifications)} ·{' '}
        {String(autoSync)}
      </output>
    </UiSurface>
  );
}
