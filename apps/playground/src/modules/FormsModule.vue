<script setup lang="ts">
import {
  UiCheckbox,
  UiField,
  UiInput,
  UiRadioGroup,
  UiSelect,
  UiSwitch,
  UiTextarea,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import FormContractFixture from '../FormContractFixture.vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';

const contractMode = new URLSearchParams(window.location.search).has('contract-fixtures');

import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const email = ref('');
const filledEmail = ref('studio@neoverse.dev');
const notes = ref('');
const filledNotes = ref('Review the 0.2.0 visual contract before release.');
const runtime = ref('native');
const remoteRuntime = ref('remote');
const releaseNotifications = ref(true);
const releaseChannel = ref('stable');
const autoSync = ref(true);

const copy = {
  input: localized('Text input', '文本输入'),
  inputDescription: localized(
    'Native input semantics with shared material, geometry, focus, and disabled states.',
    '原生输入语义复用共享材质、几何、焦点与禁用状态。',
  ),
  textarea: localized('Textarea', '多行文本'),
  textareaDescription: localized(
    'Multiline input shares the control contract with vertical resizing.',
    '多行输入复用控件契约并支持垂直缩放。',
  ),
  select: localized('Select', '选择框'),
  selectDescription: localized(
    'Library-owned selection surface with shared Glass material and keyboard semantics.',
    '选择弹层由组件库接管，并复用统一的 Glass 材质与键盘交互语义。',
  ),
  choices: localized('Choice controls', '选择控件'),
  choicesDescription: localized(
    'Checkbox, radio group, and switch reuse one native-first choice contract.',
    '复选框、单选组与开关复用同一套原生优先的选择控件契约。',
  ),
  fieldStates: localized('Field states', '字段状态'),
  fieldStatesDescription: localized(
    'Field composition keeps labels, descriptions, validation messages, readonly, and control state aligned.',
    '字段组合统一标签、说明、校验信息、只读状态与控件状态。',
  ),
  email: localized('Email address', '邮箱地址'),
  notes: localized('Project notes', '项目备注'),
  runtime: localized('Runtime', '运行时'),
  emailPlaceholder: localized('you@example.com', 'you@example.com'),
  notesPlaceholder: localized('Describe the next iteration…', '描述下一轮迭代…'),
  native: localized('Native', '原生'),
  remote: localized('Remote', '远程'),
  releaseNotifications: localized('Release notifications', '版本发布通知'),
  releaseChannel: localized('Release channel', '发布通道'),
  autoSync: localized('Automatic synchronization', '自动同步'),
  stable: localized('Stable', '稳定版'),
  preview: localized('Preview', '预览版'),
  invalidEmail: localized('Enter a valid release email.', '请输入有效的版本通知邮箱。'),
  readonlyHint: localized('This value is managed by the workspace.', '该值由工作区统一管理。'),
  readyHint: localized('Validation passed.', '校验已通过。'),
  states: {
    rest: localized('Rest', '静止'),
    value: localized('With value', '已有内容'),
    disabled: localized('Disabled', '禁用'),
    readonly: localized('Readonly', '只读'),
    error: localized('Error', '错误'),
    success: localized('Success', '成功'),
  },
  qa: {
    label: localized('Canonical form QA', '规范表单 QA'),
    hint: localized(
      'Input, select, and textarea share one backdrop matrix so density and material hierarchy can be compared directly.',
      '输入框、选择框与多行文本共用一组背景矩阵，便于直接比较密度与材质层级。',
    ),
  },
} as const;

const runtimeOptions = computed(() => [
  { value: 'native', label: localize(copy.native, props.locale) },
  { value: 'remote', label: localize(copy.remote, props.locale) },
]);

const releaseChannelOptions = computed(() => [
  { value: 'stable', label: localize(copy.stable, props.locale) },
  { value: 'preview', label: localize(copy.preview, props.locale) },
]);
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="forms-input"
      :title="localize(copy.input, props.locale)"
      :description="localize(copy.inputDescription, props.locale)"
    >
      <div class="grid gap-3">
        <MaterialBackdrop edge="inset">
          <div class="grid gap-3 md:grid-cols-3">
            <label for="forms-email" class="grid gap-2 text-body-sm text-secondary">
              <span class="text-label-sm text-muted"
                >{{ localize(copy.states.rest, props.locale) }}</span
              >
              <UiInput
                id="forms-email"
                v-model="email"
                type="email"
                autocomplete="email"
                :placeholder="localize(copy.emailPlaceholder, props.locale)"
                data-form-input
                data-contract-state="default"
              />
            </label>
            <label for="forms-email-filled" class="grid gap-2 text-body-sm text-secondary">
              <span class="text-label-sm text-muted"
                >{{ localize(copy.states.value, props.locale) }}</span
              >
              <UiInput
                id="forms-email-filled"
                v-model="filledEmail"
                type="email"
                :aria-label="localize(copy.email, props.locale)"
              />
            </label>
            <label for="forms-email-disabled" class="grid gap-2 text-body-sm text-secondary">
              <span class="text-label-sm text-muted"
                >{{ localize(copy.states.disabled, props.locale) }}</span
              >
              <UiInput
                id="forms-email-disabled"
                model-value="disabled@neoverse.dev"
                type="email"
                disabled
                :aria-label="localize(copy.email, props.locale)"
                data-contract-state="disabled"
              />
            </label>
          </div>
        </MaterialBackdrop>

        <div class="grid gap-2" data-forms-qa>
          <div class="grid gap-1 px-1">
            <h4 class="text-label-sm font-label text-primary">
              {{ localize(copy.qa.label, props.locale) }}
            </h4>
            <p class="text-caption text-secondary">
              {{ localize(copy.qa.hint, props.locale) }}
            </p>
          </div>
          <QaPreviewMatrix :locale="props.locale">
            <div class="grid w-full max-w-container-sm gap-2">
              <UiInput
                :aria-label="localize(copy.email, props.locale)"
                :placeholder="localize(copy.emailPlaceholder, props.locale)"
              />
              <UiSelect
                :aria-label="localize(copy.runtime, props.locale)"
                model-value="native"
                :options="runtimeOptions"
              />
              <UiTextarea
                :aria-label="localize(copy.notes, props.locale)"
                :placeholder="localize(copy.notesPlaceholder, props.locale)"
                rows="2"
              />
            </div>
          </QaPreviewMatrix>
        </div>
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="forms-textarea"
      :title="localize(copy.textarea, props.locale)"
      :description="localize(copy.textareaDescription, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-3 md:grid-cols-3">
          <label for="forms-notes" class="grid gap-2 text-body-sm text-secondary">
            <span class="text-label-sm text-muted"
              >{{ localize(copy.states.rest, props.locale) }}</span
            >
            <UiTextarea
              id="forms-notes"
              v-model="notes"
              :placeholder="localize(copy.notesPlaceholder, props.locale)"
              rows="4"
              data-form-textarea
              data-contract-state="default"
            />
          </label>
          <label for="forms-notes-filled" class="grid gap-2 text-body-sm text-secondary">
            <span class="text-label-sm text-muted"
              >{{ localize(copy.states.value, props.locale) }}</span
            >
            <UiTextarea
              id="forms-notes-filled"
              v-model="filledNotes"
              rows="4"
              :aria-label="localize(copy.notes, props.locale)"
            />
          </label>
          <label for="forms-notes-disabled" class="grid gap-2 text-body-sm text-secondary">
            <span class="text-label-sm text-muted"
              >{{ localize(copy.states.disabled, props.locale) }}</span
            >
            <UiTextarea
              id="forms-notes-disabled"
              model-value="Locked while the build is running."
              rows="4"
              disabled
              :aria-label="localize(copy.notes, props.locale)"
              data-contract-state="disabled"
            />
          </label>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="forms-select"
      :title="localize(copy.select, props.locale)"
      :description="localize(copy.selectDescription, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-3 md:grid-cols-3">
          <div class="grid gap-2 text-body-sm text-secondary">
            <span class="text-label-sm text-muted"
              >{{ localize(copy.states.rest, props.locale) }}</span
            >
            <UiSelect
              id="forms-runtime"
              v-model="runtime"
              :options="runtimeOptions"
              data-form-select
              data-contract-state="default"
              :aria-label="localize(copy.runtime, props.locale)"
            />
          </div>
          <div class="grid gap-2 text-body-sm text-secondary">
            <span class="text-label-sm text-muted"
              >{{ localize(copy.states.value, props.locale) }}</span
            >
            <UiSelect
              id="forms-runtime-value"
              v-model="remoteRuntime"
              :options="runtimeOptions"
              :aria-label="localize(copy.runtime, props.locale)"
            />
          </div>
          <div class="grid gap-2 text-body-sm text-secondary">
            <span class="text-label-sm text-muted"
              >{{ localize(copy.states.disabled, props.locale) }}</span
            >
            <UiSelect
              id="forms-runtime-disabled"
              model-value="native"
              :options="runtimeOptions"
              disabled
              :aria-label="localize(copy.runtime, props.locale)"
              data-contract-state="disabled"
            />
          </div>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="forms-choice-controls"
      :title="localize(copy.choices, props.locale)"
      :description="localize(copy.choicesDescription, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-5 md:grid-cols-3">
          <UiCheckbox
            v-model="releaseNotifications"
            data-form-checkbox
            data-contract-state="default"
          >
            {{ localize(copy.releaseNotifications, props.locale) }}
          </UiCheckbox>

          <UiRadioGroup
            v-model="releaseChannel"
            name="forms-release-channel"
            :aria-label="localize(copy.releaseChannel, props.locale)"
            :options="releaseChannelOptions"
            data-form-radio-group
            data-contract-state="default"
          />

          <UiSwitch v-model="autoSync" data-form-switch data-contract-state="default">
            {{ localize(copy.autoSync, props.locale) }}
          </UiSwitch>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="forms-field-states"
      :title="localize(copy.fieldStates, props.locale)"
      :description="localize(copy.fieldStatesDescription, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-5 md:grid-cols-2">
          <UiField
            v-slot="{ controlAttrs }"
            control-id="forms-validation-error"
            :label="localize(copy.email, props.locale)"
            :message="localize(copy.invalidEmail, props.locale)"
            validation="error"
            required
            data-contract-state="validation"
          >
            <UiInput
              v-bind="controlAttrs"
              model-value="invalid-address"
              validation="error"
              type="email"
            />
          </UiField>

          <UiField
            v-slot="{ controlAttrs }"
            control-id="forms-validation-readonly"
            :label="localize(copy.states.readonly, props.locale)"
            :description="localize(copy.readonlyHint, props.locale)"
            data-contract-state="readonly"
          >
            <UiInput v-bind="controlAttrs" model-value="workspace@neoverse.dev" readonly />
          </UiField>

          <UiField
            v-slot="{ controlAttrs }"
            :label="localize(copy.states.success, props.locale)"
            :message="localize(copy.readyHint, props.locale)"
            validation="success"
          >
            <UiCheckbox v-bind="controlAttrs" model-value validation="success">
              {{ localize(copy.releaseNotifications, props.locale) }}
            </UiCheckbox>
          </UiField>

          <UiField
            v-slot="{ controlAttrs }"
            :label="localize(copy.states.disabled, props.locale)"
            disabled
            data-contract-state="disabled"
          >
            <UiSwitch v-bind="controlAttrs" model-value>
              {{ localize(copy.autoSync, props.locale) }}
            </UiSwitch>
          </UiField>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>
    <FormContractFixture v-if="contractMode" />
  </div>
</template>
