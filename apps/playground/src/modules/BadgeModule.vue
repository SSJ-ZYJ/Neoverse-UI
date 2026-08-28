<script setup lang="ts">
import { UiBadge } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.badge;
</script>

<template>
  <StateRow :label="copy.variants" :locale="props.locale">
    <UiBadge>{{ localize(copy.controls.neutral, props.locale) }}</UiBadge>
    <UiBadge variant="info">{{ localize(copy.controls.info, props.locale) }}</UiBadge>
    <UiBadge variant="success">{{ localize(copy.controls.success, props.locale) }}</UiBadge>
    <UiBadge variant="warning">{{ localize(copy.controls.warning, props.locale) }}</UiBadge>
    <UiBadge variant="danger">{{ localize(copy.controls.danger, props.locale) }}</UiBadge>
  </StateRow>
  <StateRow :label="copy.sizes" :locale="props.locale">
    <UiBadge size="sm">{{ localize(copy.controls.small, props.locale) }}</UiBadge>
    <UiBadge size="md">{{ localize(copy.controls.medium, props.locale) }}</UiBadge>
  </StateRow>
</template>
