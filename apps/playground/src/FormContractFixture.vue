<script setup lang="ts">
import { UiCheckbox, UiRadioGroup, UiSwitch } from '@neoverse-ui/vue';
import { ref } from 'vue';

const notifications = ref(true);
const channel = ref<string | number>(2);
const sync = ref(true);
const options = [
  { value: 1, label: 'First channel' },
  { value: 2, label: 'Second channel' },
  { value: 3, label: 'Unavailable channel', disabled: true },
];
const unnamedOptions = [
  { value: 'first', label: 'Unnamed first' },
  { value: 'second', label: 'Unnamed second' },
];

function resetControlledForm(event: Event) {
  event.preventDefault();
  notifications.value = true;
  channel.value = 2;
  sync.value = true;
}
</script>

<template>
  <form data-contract-form class="grid gap-3" @reset="resetControlledForm">
    <UiCheckbox v-model="notifications" name="notifications" value="yes" data-contract-checkbox>
      Notifications
    </UiCheckbox>
    <UiRadioGroup
      v-model="channel"
      :options="options"
      name="channel"
      aria-label="Channel"
      data-contract-radio
    />
    <UiSwitch v-model="sync" name="sync" value="yes" data-contract-switch>Synchronization</UiSwitch>
    <UiCheckbox model-value readonly name="locked" value="yes" data-contract-readonly-checkbox
      >Locked notifications</UiCheckbox
    >
    <UiRadioGroup
      :model-value="2"
      readonly
      :options="options"
      name="locked-channel"
      aria-label="Locked channel"
      data-contract-readonly-radio
    />
    <UiSwitch model-value readonly name="locked-sync" value="yes" data-contract-readonly-switch
      >Locked synchronization</UiSwitch
    >
    <UiCheckbox model-value disabled name="disabled" value="yes" data-contract-disabled-checkbox
      >Disabled notifications</UiCheckbox
    >
    <UiSwitch model-value disabled name="disabled-sync" value="yes" data-contract-disabled-switch
      >Disabled synchronization</UiSwitch
    >
    <UiRadioGroup
      :options="unnamedOptions"
      aria-label="Unnamed radio group"
      data-contract-radio-unnamed
    />
    <button type="reset" data-contract-reset>Reset controlled form</button>
    <div class="ui-choice-trap">
      <UiCheckbox
        model-value
        value="yes"
        data-contract-checkbox-reject
        @update:model-value="() => undefined"
        >Reject updates</UiCheckbox
      >
      <UiSwitch
        model-value
        value="yes"
        data-contract-switch-reject
        @update:model-value="() => undefined"
        >Reject updates</UiSwitch
      >
      <output data-choice-trap-state>true</output>
    </div>
    <output data-contract-form-state
      >{{ notifications }}
      / {{ channel }} / {{ sync }} / {{ typeof channel }}</output
    >
  </form>
</template>
