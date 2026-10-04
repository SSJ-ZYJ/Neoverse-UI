<script setup lang="ts">
import { UiInput, UiSelect, UiTextarea } from '@neoverse-ui/vue';
import { ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const email = ref('');
const notes = ref('');
const runtime = ref('native');

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
    'Native selection behavior stays intact for platform accessibility.',
    '保留原生选择行为与平台无障碍能力。',
  ),
  email: localized('Email address', '邮箱地址'),
  notes: localized('Project notes', '项目备注'),
  runtime: localized('Runtime', '运行时'),
  placeholder: localized('Describe the next iteration…', '描述下一轮迭代…'),
  native: localized('Native', '原生'),
  remote: localized('Remote', '远程'),
} as const;
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="forms-input"
      :title="localize(copy.input, props.locale)"
      :description="localize(copy.inputDescription, props.locale)"
    >
      <MaterialBackdrop>
        <label for="forms-email" class="grid gap-2 text-body-sm text-secondary">
          <span>{{ localize(copy.email, props.locale) }}</span>
          <UiInput
            id="forms-email"
            v-model="email"
            type="email"
            autocomplete="email"
            data-form-input
          />
        </label>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="forms-textarea"
      :title="localize(copy.textarea, props.locale)"
      :description="localize(copy.textareaDescription, props.locale)"
    >
      <MaterialBackdrop>
        <label for="forms-notes" class="grid gap-2 text-body-sm text-secondary">
          <span>{{ localize(copy.notes, props.locale) }}</span>
          <UiTextarea
            id="forms-notes"
            v-model="notes"
            :placeholder="localize(copy.placeholder, props.locale)"
            rows="4"
            data-form-textarea
          />
        </label>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="forms-select"
      :title="localize(copy.select, props.locale)"
      :description="localize(copy.selectDescription, props.locale)"
    >
      <MaterialBackdrop>
        <label for="forms-runtime" class="grid gap-2 text-body-sm text-secondary">
          <span>{{ localize(copy.runtime, props.locale) }}</span>
          <UiSelect id="forms-runtime" v-model="runtime" data-form-select>
            <option value="native">{{ localize(copy.native, props.locale) }}</option>
            <option value="remote">{{ localize(copy.remote, props.locale) }}</option>
          </UiSelect>
        </label>
      </MaterialBackdrop>
    </LabSpecimenSection>
  </div>
</template>
