<script setup lang="ts">
import { UiInput, UiSelect, UiTextarea } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const email = ref('');
const filledEmail = ref('studio@neoverse.dev');
const notes = ref('');
const filledNotes = ref('Review the 0.2.0 visual contract before release.');
const runtime = ref('native');
const remoteRuntime = ref('remote');

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
  email: localized('Email address', '邮箱地址'),
  notes: localized('Project notes', '项目备注'),
  runtime: localized('Runtime', '运行时'),
  emailPlaceholder: localized('you@example.com', 'you@example.com'),
  notesPlaceholder: localized('Describe the next iteration…', '描述下一轮迭代…'),
  native: localized('Native', '原生'),
  remote: localized('Remote', '远程'),
  states: {
    rest: localized('Rest', '静止'),
    value: localized('With value', '已有内容'),
    disabled: localized('Disabled', '禁用'),
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
            />
          </div>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>
  </div>
</template>
