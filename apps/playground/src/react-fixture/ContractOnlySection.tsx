import {
  UiAction,
  UiButton,
  UiCard,
  UiCheckbox,
  UiInput,
  UiPopover,
  UiRadioGroup,
  UiSwitch,
} from '@neoverse-ui/react';
import { useCallback, useState } from 'react';
import { TextControlContractFixture } from '../TextControlContractFixture';

export default function ContractOnlySection({
  onIncrement,
  onToggleDropdownDisabled,
}: {
  onIncrement: () => void;
  onToggleDropdownDisabled: () => void;
}) {
  const [controlledOpen, setControlledOpen] = useState(false);
  const [controlledMounted, setControlledMounted] = useState(true);
  const [controlledDisabled, setControlledDisabled] = useState(false);
  const [dismissAttempts, setDismissAttempts] = useState(0);
  const [formNotifications, setFormNotifications] = useState(true);
  const [formChannel, setFormChannel] = useState<string | number>(2);
  const [formSync, setFormSync] = useState(true);

  const requestControlledOpen = useCallback((value: boolean) => {
    if (value) setControlledOpen(true);
    else setDismissAttempts((attempts) => attempts + 1);
  }, []);

  return (
    <>
      <div data-overlay-controlled>
        {controlledMounted ? (
          <UiPopover
            open={controlledOpen}
            disabled={controlledDisabled}
            trigger="Controlled popover"
            ariaLabel="Controlled details"
            data-overlay-controlled-popover
            onOpenChange={requestControlledOpen}
          >
            <p>Parent retains open state after a dismiss request.</p>
          </UiPopover>
        ) : null}
        <button type="button" data-overlay-unmount onClick={() => setControlledMounted(false)}>
          Unmount overlay
        </button>
        <button
          type="button"
          data-overlay-toggle-disabled
          onClick={() => setControlledDisabled((value) => !value)}
        >
          Toggle controlled disabled
        </button>
        <button type="button" data-overlay-toggle-menu-disabled onClick={onToggleDropdownDisabled}>
          Toggle menu disabled
        </button>
        <output data-overlay-dismiss-attempts>{dismissAttempts}</output>
      </div>
      <TextControlContractFixture />
      <form
        data-contract-form
        className="grid gap-3"
        onReset={(event) => {
          event.preventDefault();
          setFormNotifications(true);
          setFormChannel(2);
          setFormSync(true);
        }}
      >
        <UiCheckbox
          checked={formNotifications}
          onCheckedChange={setFormNotifications}
          name="notifications"
          value="yes"
          data-contract-checkbox
        >
          Notifications
        </UiCheckbox>
        <UiRadioGroup
          value={formChannel}
          onValueChange={setFormChannel}
          options={[
            { value: 1, label: 'First channel' },
            { value: 3, label: 'Unavailable channel', disabled: true },
            { value: 2, label: 'Second channel' },
          ]}
          name="channel"
          aria-label="Channel"
          data-contract-radio
        />
        <UiSwitch
          checked={formSync}
          onCheckedChange={setFormSync}
          name="sync"
          value="yes"
          data-contract-switch
        >
          Synchronization
        </UiSwitch>
        <UiCheckbox checked readOnly name="locked" value="yes" data-contract-readonly-checkbox>
          Locked notifications
        </UiCheckbox>
        <UiRadioGroup
          value={2}
          readOnly
          options={[
            { value: 1, label: 'First channel' },
            { value: 2, label: 'Second channel' },
          ]}
          name="locked-channel"
          aria-label="Locked channel"
          data-contract-readonly-radio
        />
        <UiSwitch checked readOnly name="locked-sync" value="yes" data-contract-readonly-switch>
          Locked synchronization
        </UiSwitch>
        <UiCheckbox checked disabled name="disabled" value="yes" data-contract-disabled-checkbox>
          Disabled notifications
        </UiCheckbox>
        <button type="reset" data-contract-reset>
          Reset controlled form
        </button>
        <output data-contract-form-state>
          {String(formNotifications)} / {formChannel} / {String(formSync)} / {typeof formChannel}
        </output>
      </form>
      <form data-contract-uncontrolled-form className="grid gap-3">
        <UiCheckbox defaultChecked name="notifications" value="yes">
          Uncontrolled notifications
        </UiCheckbox>
        <UiRadioGroup
          defaultValue={2}
          options={[
            { value: 1, label: 'Uncontrolled first' },
            { value: 2, label: 'Uncontrolled second' },
          ]}
          name="channel"
          aria-label="Uncontrolled channel"
        />
        <UiSwitch defaultChecked name="sync" value="yes">
          Uncontrolled synchronization
        </UiSwitch>
        <button type="reset">Reset native form</button>
      </form>
      <div data-material-tier-fixtures className="flex flex-wrap gap-3">
        {(['glass-subtle', 'glass-elevated', 'glass-immersive'] as const).map((surface) => (
          <div key={surface} className="grid gap-2">
            <p className="text-caption text-muted">{surface}</p>
            <UiButton surface={surface} onClick={onIncrement} data-tier-button={surface}>
              {surface}
            </UiButton>
            <UiAction
              surface={surface}
              href="#react-runtime-fixture"
              onClick={(event) => event.preventDefault()}
              data-tier-action={surface}
            >
              Action
            </UiAction>
            <UiCard surface={surface} data-tier-card={surface}>
              Card
            </UiCard>
          </div>
        ))}
        <UiAction disabled href="#react-runtime-fixture" data-disabled-action onClick={onIncrement}>
          Disabled action
        </UiAction>
      </div>
      <UiInput readOnly value="readonly@neoverse.dev" aria-label="Readonly material specimen" />
    </>
  );
}
