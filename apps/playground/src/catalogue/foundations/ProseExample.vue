<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { localize } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import { proseCopy } from './prose-copy';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <UiSurface as="article" surface="none" class="playground-specimen-panel">
    <div data-foundation-prose class="neoverse-prose max-w-reading">
      <h3>{{ localize(proseCopy.prose, props.locale) }}</h3>
      <p>{{ localize(proseCopy.proseBody, props.locale) }}</p>
      <blockquote>{{ localize(proseCopy.proseQuote, props.locale) }}</blockquote>
      <ul>
        <li>{{ localize(proseCopy.proseItemOne, props.locale) }}</li>
        <li>{{ localize(proseCopy.proseItemTwo, props.locale) }}</li>
      </ul>
      <p><code>.neoverse-prose</code>+<code>max-w-reading</code></p>
      <pre><code>data-neoverse-material="solid"</code></pre>
      <table>
        <thead>
          <tr>
            <th scope="col">{{ localize(proseCopy.materialHeading, props.locale) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ localize(proseCopy.materialExample, props.locale) }}</td>
          </tr>
        </tbody>
      </table>
      <details>
        <summary>{{ localize(proseCopy.keyboardHeading, props.locale) }}</summary>
        <p><kbd>Enter</kbd> · <kbd>Space</kbd></p>
      </details>
      <p>
        <a href="#composition-reading">{{ localize(proseCopy.proseLink, props.locale) }}</a>
      </p>
    </div>
  </UiSurface>
</template>
