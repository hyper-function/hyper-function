<template>
  <h1
    class="flex-1 inline-block text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200 select-all"
  >
    {{ manifest.name || "\0" }}
  </h1>

  <p class="text-lg text-gray-500 dark:text-gray-400">
    {{ manifest.description || "\0" }}
  </p>

  <div class="my-4 border-b border-gray-200 dark:border-gray-800"></div>

  <ul class="flex pb-5 space-x-8 text-sm font-semibold">
    <li v-for="tab in tabs" :key="tab.name">
      <a
        :class="
          activeTab === tab.name
            ? 'cursor-pointer'
            : 'cursor-pointer text-gray-500 hover:text-black'
        "
        @click="changeTab(tab.name)"
      >
        {{ tab.name }}
      </a>
    </li>
  </ul>
</template>
<script setup lang="ts">
import { inject, ref } from "vue";

defineProps(["tabs", "activeTab"]);

const manifest = inject<any>("manifest")!;

const emit = defineEmits(["change"]);
function changeTab(name: string) {
  emit("change", { name });
}
</script>
