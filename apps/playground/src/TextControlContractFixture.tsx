import { UiField, UiInput, UiSelect, UiTextarea } from '@neoverse-ui/react';
import { useState } from 'react';

export function TextControlContractFixture() {
  const [text, setText] = useState('Initial');
  const [notes, setNotes] = useState('Initial notes');
  const [locked, setLocked] = useState<'none' | 'readonly' | 'disabled'>('none');
  const [hints, setHints] = useState(true);
  const [requests, setRequests] = useState(0);
  return (
    <>
      <form
        data-text-contract-form
        className="grid gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <UiField
          controlId="contract-text"
          label="Contract text"
          description={hints ? 'Text is included in the form.' : undefined}
          message={hints ? 'Review this value.' : undefined}
          validation="error"
          required
          disabled={locked === 'disabled'}
        >
          {(attrs) => (
            <UiInput
              {...attrs}
              value={text}
              name="text"
              validation="error"
              readOnly={locked === 'readonly'}
              onChange={(event) => setText(event.currentTarget.value)}
            />
          )}
        </UiField>
        <UiField controlId="contract-notes" label="Contract notes">
          {(attrs) => (
            <UiTextarea
              {...attrs}
              value={notes}
              name="notes"
              rows={3}
              validation="warning"
              disabled={locked === 'disabled'}
              readOnly={locked === 'readonly'}
              onChange={(event) => setNotes(event.currentTarget.value)}
            />
          )}
        </UiField>
        <UiSelect
          value="native"
          options={[
            { value: 'native', label: 'Native' },
            { value: 'unavailable', label: 'Unavailable', disabled: true },
            { value: 'remote', label: 'Remote' },
          ]}
          name="selection"
          aria-label="Contract selection"
          disabled={locked === 'disabled'}
          readOnly={locked === 'readonly'}
          onValueChange={() => setRequests((value) => value + 1)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" data-text-toggle-hints onClick={() => setHints((value) => !value)}>
            Toggle hints
          </button>
          <button type="button" data-text-readonly onClick={() => setLocked('readonly')}>
            Readonly
          </button>
          <button type="button" data-text-disabled onClick={() => setLocked('disabled')}>
            Disabled
          </button>
          <button type="button" data-text-editable onClick={() => setLocked('none')}>
            Editable
          </button>
        </div>
        <output data-text-value>{text}</output>
        <output data-notes-value>{notes}</output>
        <output data-select-requests>{requests}</output>
      </form>
      <form data-text-uncontrolled-form className="grid gap-3">
        <UiInput name="nativeText" aria-label="Native text" defaultValue="Native input" />
        <UiTextarea name="nativeNotes" aria-label="Native notes" defaultValue="Native notes" />
        <button type="reset">Reset native text</button>
      </form>
    </>
  );
}
